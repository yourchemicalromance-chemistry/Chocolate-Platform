import { afterEach, describe, expect, it, vi } from 'vitest';
import { areMeetingPreferencesCompatible, DiscoveryPrivacyService, normalizeContact, validateContactLockSecret } from './discovery-privacy.service.js';
import { ServiceUnavailableException } from '@nestjs/common';

describe('DiscoveryPrivacyService', () => {
  afterEach(() => { delete process.env.CONTACT_LOCK_HMAC_SECRET; });
  it('normalizes emails and phone values for matching without retaining raw input', () => {
    expect(normalizeContact(' Ada@Example.test ')).toBe('email:ada@example.test');
    expect(normalizeContact('+91 (98765) 43210')).toBe('phone:+919876543210');
    expect(normalizeContact('123')).toBe('');
    expect(normalizeContact('phone[US]:202-555-0123')).toBe('phone:+12025550123');
    expect(normalizeContact('phone[GB]:020 7031 3000')).toBe('phone:+442070313000');
    expect(normalizeContact('phone[US]:not-a-number')).toBe('');
  });
  it('rejects missing, weak and known placeholder HMAC secrets', () => {
    for (const secret of [undefined, 'short', 'replace-with-a-real-contact-lock-secret-123']) {
      expect(() => validateContactLockSecret(secret)).toThrow(ServiceUnavailableException);
    }
    expect(validateContactLockSecret('r4ndom-long-secret-material-9X!q')).toBe('r4ndom-long-secret-material-9X!q');
  });
  it('validates the HMAC secret during Nest module startup without revealing it', () => {
    const service = new DiscoveryPrivacyService({} as never);
    delete process.env.CONTACT_LOCK_HMAC_SECRET;
    expect(() => service.onModuleInit()).toThrow(ServiceUnavailableException);
    process.env.CONTACT_LOCK_HMAC_SECRET = 'r4ndom-long-contact-secret-material-9X!q';
    expect(() => service.onModuleInit()).not.toThrow();
  });
  it('creates stable, deduplicated keyed digests and does not return contact values', () => {
    process.env.CONTACT_LOCK_HMAC_SECRET = 'r4ndom-long-contact-secret-material-9X!q';
    const service = new DiscoveryPrivacyService({} as never);
    const first = service.contactDigests(['Ada@Example.test', 'ada@example.test', '+91 98765 43210']);
    expect(first).toHaveLength(4);
    expect(first.every(value => /^[a-f0-9]{64}$/.test(value))).toBe(true);
    expect(first).toEqual(service.contactDigests(['ada@example.test', '+919876543210']));
  });
  it('uses server-side visibility filters before authorizing profile media', async () => {
    process.env.CONTACT_LOCK_HMAC_SECRET = 'r4ndom-long-contact-secret-material-9X!q';
    const raw = vi.fn(async (_query: TemplateStringsArray, ..._values: unknown[]) => [{ allowed: false }]);
    const adult = new Date(); adult.setFullYear(adult.getFullYear() - 30);
    const profile = { completedAt: new Date(), displayName: 'Profile', genderIdentity: 'Woman', interestedIn: [{ value: 'Everyone' }], owner: { accountStatus: 'ACTIVE', dateOfBirth: adult, email: 'viewer@example.test', mobileNumber: null, humanVerifications: [{ id: 'verified' }] }, photos: [{ id: 'photo' }] };
    const service = new DiscoveryPrivacyService({ profile: { findUnique: vi.fn().mockResolvedValue(profile) }, $queryRaw: raw } as never);
    await expect(service.canAccessProfile('viewer-id', 'owner-id')).resolves.toBe(false);
    const sql = raw.mock.calls[0][0].join(' ');
    expect(sql).toContain('undiscoverableEnabled');
    expect(sql).toContain('areaExclusionEnabled');
    expect(sql).toContain('neighbourhoodLockEnabled');
    expect(sql).toContain('ProfileContactHash');
    expect(sql).toContain('ST_DWithin');
    expect(sql).toContain('viewer_loc."location" IS NULL AND search_loc."location" IS NULL');
    expect(sql).toContain('ROUND(ST_X(gl."location"::geometry)');
    expect(sql).toContain('ROUND(ST_X(sp."location"::geometry)');
    expect(sql).toContain("'AGE_INTERVIEW_VIDEO'");
    expect(sql).toContain("'PROFILE_PHOTO'");
  });
  it('does not interpret Prefer not to say as an all-genders preference', () => {
    expect(areMeetingPreferencesCompatible(['Prefer not to say'], 'Woman', ['Everyone'], 'Man')).toBe(false);
    expect(areMeetingPreferencesCompatible(['Everyone'], 'Woman', ['Women'], 'Woman')).toBe(true);
    expect(areMeetingPreferencesCompatible(['Men'], 'Woman', ['Women'], 'Man')).toBe(true);
    expect(areMeetingPreferencesCompatible(['Women'], 'Woman', ['Men'], 'Woman')).toBe(false);
  });
  it.each([
    ['inactive account', { accountStatus: 'SUSPENDED' }, {}],
    ['underage account', { dateOfBirth: new Date('2010-01-01') }, {}],
    ['target account disabled', {}, { owner: { accountStatus: 'SUSPENDED' } }],
    ['target underage', {}, { owner: { dateOfBirth: new Date('2010-01-01') } }],
    ['missing approved verification', {}, { verifications: [] }],
    ['missing ready profile photo', {}, { photos: [] }],
    ['incompatible gender preferences', {}, { interestedIn: [{ value: 'Men' }] }],
  ])('denies direct profile and photo eligibility when %s changes', async (_label, viewerChanges, targetChanges) => {
    process.env.CONTACT_LOCK_HMAC_SECRET = 'r4ndom-long-contact-secret-material-9X!q';
    const adult = new Date(); adult.setFullYear(adult.getFullYear() - 30);
    const base = {
      completedAt: new Date(), genderIdentity: 'Woman', interestedIn: [{ value: 'Everyone' }],
      owner: { accountStatus: 'ACTIVE', dateOfBirth: adult, email: null, mobileNumber: null, humanVerifications: [{ id: 'verified' }] },
      photos: [{ id: 'photo' }], displayName: 'Profile',
    };
    const viewer = { ...base, owner: { ...base.owner, ...viewerChanges } };
    const target = { ...base, owner: { ...base.owner, ...(targetChanges as any).owner }, ...(targetChanges as any) };
    if ('verifications' in (targetChanges as object)) target.owner.humanVerifications = [];
    const profileFind = vi.fn().mockResolvedValueOnce(viewer).mockResolvedValueOnce(target);
    const service = new DiscoveryPrivacyService({ profile: { findUnique: profileFind } } as never);
    await expect(service.canAccessProfile('viewer-id', 'target-id')).resolves.toBe(false);
  });
});
