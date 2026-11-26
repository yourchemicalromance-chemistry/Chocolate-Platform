import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileReactionType } from '../generated/prisma/client.js';
import { DiscoveryService } from './discovery.service.js';

function kismatHarness(candidateIds: string[], point?: { latitude: number; longitude: number; radiusKm: number; areaLabel: string }, incompatibleIds: string[] = []) {
  const candidates = candidateIds.map(userId => ({ userId, distanceBand: null }));
  const profiles = candidateIds.map((userId, index) => ({
    userId,
    displayName: `Candidate ${index}`,
    genderIdentity: 'Man',
    bio: null,
    owner: { dateOfBirth: new Date('1990-01-01') },
    interestedIn: [{ value: incompatibleIds.includes(userId) ? 'Men' : 'Everyone' }],
    interests: [],
    photos: [{ asset: { id: `photo-${index}` } }],
  }));
  const raw = vi.fn(async (_query: TemplateStringsArray, ..._values: unknown[]): Promise<unknown[]> => [])
    .mockResolvedValueOnce(point ? [point] : []).mockResolvedValueOnce(candidates);
  const prisma = {
    discoveryModeSelection: { findMany: vi.fn(async () => [{ mode: 'kismat' }]) },
    profile: {
      findUnique: vi.fn(async () => ({ completedAt: new Date(), genderIdentity: 'Woman', interestedIn: [{ value: 'Everyone' }], owner: { accountStatus: 'ACTIVE', dateOfBirth: new Date('1990-01-01') } })),
      findMany: vi.fn(async () => profiles),
    },
    user: { findUnique: vi.fn(async () => ({ email: 'viewer@example.test', mobileNumber: null })) },
    $queryRaw: raw,
  };
  const service = new DiscoveryService(prisma as never, { contactDigests: () => [] } as never);
  return { service, prisma, raw };
}

describe('DiscoveryService', () => {
  afterEach(() => { delete process.env.CONTACT_LOCK_HMAC_SECRET; });

  it('persists a location search and uses its real radius result query', async () => {
    const execute = vi.fn(async (_query: TemplateStringsArray, ..._values: unknown[]) => 1);
    const prisma = { $executeRaw: execute };
    const visibility = {};
    const service = new DiscoveryService(prisma as never, visibility as never);
    const feed = vi.spyOn(service, 'getFeed').mockResolvedValue([{ id: 'real-profile' }] as never);
    await expect(service.locationSearch('viewer-id', { latitude: 13.08, longitude: 80.27, locationLabel: 'Chennai', radiusKm: 25 })).resolves.toEqual([{ id: 'real-profile' }]);
    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.calls[0][0].join(' ')).toContain('ST_SetSRID(ST_MakePoint');
    expect(execute.mock.calls[0][2]).toBe(80.27);
    expect(execute.mock.calls[0][3]).toBe(13.08);
    expect(feed).toHaveBeenCalledWith('viewer-id', { locationFilter: 'search' });
  });

  it('applies verified, privacy, distance and contact filters in discovery SQL', async () => {
    process.env.CONTACT_LOCK_HMAC_SECRET = 'r4ndom-long-contact-secret-material-9X!q';
    const raw = vi.fn(async (_query: TemplateStringsArray, ..._values: unknown[]): Promise<unknown[]> => [])
      .mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const prisma = {
      discoveryModeSelection: { findMany: vi.fn(async () => [{ mode: 'algorithmic' }]) },
      profile: { findUnique: vi.fn(async () => ({ completedAt: new Date(), interestedIn: [{ value: 'Everyone' }], genderIdentity: 'Woman', owner: { accountStatus: 'ACTIVE', dateOfBirth: new Date('1990-01-01') } })) },
      user: { findUnique: vi.fn(async () => ({ email: 'viewer@example.test', mobileNumber: null })) },
      $queryRaw: raw,
    };
    const service = new DiscoveryService(prisma as never, { contactDigests: () => [] } as never);
    await expect(service.getFeed('viewer-id', { mode: 'algorithmic', locationFilter: 'nearby' })).rejects.toMatchObject({ status: 400 });
    raw.mockReset().mockResolvedValueOnce([{ latitude: 13, longitude: 80, radiusKm: 25, areaLabel: 'Chennai' }]).mockResolvedValueOnce([]);
    await expect(service.getFeed('viewer-id', { mode: 'algorithmic', locationFilter: 'nearby' })).resolves.toEqual([]);
    expect(raw.mock.calls[0][0].join(' ')).toContain('ROUND(ST_Y');
    expect(raw.mock.calls[0][0].join(' ')).toContain('ROUND(ST_X');
    const sql = raw.mock.calls[1][0].join(' ');
    expect(sql).toContain('"HumanVerification"');
    expect(sql).toContain('undiscoverableEnabled');
    expect(sql).toContain('ProfileContactHash');
    expect(sql).toContain('ST_DWithin');
    expect(sql).toContain('viewer_search."location"');
    expect(sql).toContain('ROUND(ST_X(gl."location"::geometry)');
    expect(sql).toContain('"processingStatus" = \'READY\'');
    expect(JSON.stringify(raw.mock.calls[1])).toContain('LIMIT');
    expect(JSON.stringify(raw.mock.calls[1])).toContain('OFFSET');
    expect(sql).toContain('distanceBand');
    expect(sql).not.toContain('distanceKm');
    expect(sql).toContain('EXISTS (SELECT 1 FROM "HumanVerification"');
    expect(sql).not.toContain('JOIN "HumanVerification"');
  });

  it.each([
    ['inactive', 'SUSPENDED', new Date('1990-01-01')],
    ['underage', 'ACTIVE', new Date('2010-01-01')],
  ])('does not serve a discovery feed to an %s viewer', async (_label, accountStatus, dateOfBirth) => {
    const query = vi.fn();
    const prisma = { discoveryModeSelection: { findMany: vi.fn(async () => [{ mode: 'algorithmic' }]) }, profile: { findUnique: vi.fn(async () => ({ completedAt: new Date(), interestedIn: [{ value: 'Everyone' }], owner: { accountStatus, dateOfBirth } })) }, $queryRaw: query };
    const service = new DiscoveryService(prisma as never, { contactDigests: () => [] } as never);
    await expect(service.getFeed('viewer-id', { mode: 'algorithmic' })).rejects.toMatchObject({ status: 403 });
    expect(query).not.toHaveBeenCalled();
  });

  it('requires one saved discovery mode and rejects requests for another mode', async () => {
    const findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ mode: 'nearby' }])
      .mockResolvedValueOnce([{ mode: 'algorithmic' }, { mode: 'browse' }]).mockResolvedValueOnce([{ mode: 'browse' }]);
    const service = new DiscoveryService({ discoveryModeSelection: { findMany } } as never, {} as never);
    await expect(service.getFeed('viewer-id', { mode: 'algorithmic' })).rejects.toMatchObject({ status: 400 });
    await expect(service.getFeed('viewer-id', { mode: 'algorithmic' })).rejects.toMatchObject({ status: 400 });
    await expect(service.getFeed('viewer-id', { mode: 'algorithmic' })).rejects.toMatchObject({ status: 409 });
    await expect(service.getFeed('viewer-id', { mode: 'algorithmic' })).rejects.toMatchObject({ status: 403 });
  });

  it('returns exactly one random eligible KISMAT profile without applying ranking or pagination', async () => {
    const { service, raw } = kismatHarness(['candidate-a', 'candidate-b', 'candidate-c']);
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    try {
      const result = await service.getFeed('viewer-id', { mode: 'kismat', page: 4, pageSize: 1 });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('candidate-c');
      const sql = raw.mock.calls[1][0].join(' ');
      expect(sql).toContain('undiscoverableEnabled');
      expect(sql).toContain('"id" <>');
      expect(JSON.stringify(raw.mock.calls[1])).not.toContain('ORDER BY');
      expect(JSON.stringify(raw.mock.calls[1])).not.toContain('LIMIT');
      expect(JSON.stringify(raw.mock.calls[1])).not.toContain('OFFSET');
      expect(sql).not.toContain('History');
    } finally {
      random.mockRestore();
    }
  });

  it('applies Nearby radius filtering before KISMAT draws', async () => {
    const { service, raw } = kismatHarness(['nearby-candidate'], { latitude: 13, longitude: 80, radiusKm: 25, areaLabel: 'Chennai' });
    const result = await service.getFeed('viewer-id', { mode: 'kismat', locationFilter: 'nearby' });
    expect(result).toHaveLength(1);
    const sql = raw.mock.calls[1][0].join(' ');
    expect(sql).toContain('ST_DWithin');
    expect(JSON.stringify(raw.mock.calls[1])).toContain('25000');
  });

  it('returns no draw when the privacy-filtered candidate pool is empty', async () => {
    const { service, raw, prisma } = kismatHarness([]);
    await expect(service.getFeed('viewer-id', { mode: 'kismat' })).resolves.toEqual([]);
    expect(raw.mock.calls[1][0].join(' ')).toContain('NOT COALESCE(candidate_privacy."undiscoverableEnabled", false)');
    expect(prisma.profile.findMany).not.toHaveBeenCalled();
  });

  it('filters incompatible profiles before random KISMAT selection', async () => {
    const { service } = kismatHarness(['candidate-a', 'incompatible', 'candidate-c'], undefined, ['incompatible']);
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.75);
    try {
      const result = await service.getFeed('viewer-id', { mode: 'kismat' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('candidate-c');
      expect(result[0].id).not.toBe('incompatible');
    } finally {
      random.mockRestore();
    }
  });

  it('uses an idempotent authenticated action write and returns mutual match state', async () => {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const upsert = vi.fn(async () => ({}));
    const prisma = {
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => callback({ profileReaction: { deleteMany, upsert } })),
      profileReaction: { findMany: vi.fn(async () => [{ id: 'mutual' }]) },
    };
    const visibility = { canAccessProfile: vi.fn(async () => true) };
    const service = new DiscoveryService(prisma as never, visibility as never);
    await expect(service.action('viewer-id', 'target-id', { action: ProfileReactionType.LIKE })).resolves.toEqual({ action: ProfileReactionType.LIKE, mutualMatch: true });
    expect(visibility.canAccessProfile).toHaveBeenCalledWith('viewer-id', 'target-id');
    expect(upsert).toHaveBeenCalledOnce();
    expect(prisma.profileReaction.findMany).toHaveBeenCalledOnce();
  });

  it('bounds and scopes saved-profile pagination to the authenticated owner', async () => {
    const findMany = vi.fn(async () => []);
    const service = new DiscoveryService({ savedProfile: { findMany } } as never, { canAccessProfile: vi.fn() } as never);
    await service.getSaved('viewer-id', { page: 2, pageSize: 500 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { ownerId: 'viewer-id' }, skip: 60, take: 30,
    }));
  });

  it('hides saved profiles after eligibility or privacy changes', async () => {
    const findMany = vi.fn(async () => [{ targetId: 'now-hidden-profile' }]);
    const canAccessProfile = vi.fn(async () => false);
    const service = new DiscoveryService({ savedProfile: { findMany } } as never, { canAccessProfile } as never);
    await expect(service.getSaved('viewer-id')).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: 'viewer-id' } }));
    expect(canAccessProfile).toHaveBeenCalledWith('viewer-id', 'now-hidden-profile');
  });

  it('denies direct profile, action and save requests when centralized eligibility rejects the target', async () => {
    const visibility = { canAccessProfile: vi.fn(async () => false) };
    const profileFind = vi.fn();
    const write = vi.fn();
    const service = new DiscoveryService({ profile: { findUnique: profileFind }, savedProfile: { upsert: write }, $transaction: write } as never, visibility as never);
    await expect(service.getProfile('viewer-id', 'ineligible-profile')).rejects.toMatchObject({ status: 404 });
    await expect(service.action('viewer-id', 'ineligible-profile', { action: ProfileReactionType.LIKE })).rejects.toMatchObject({ status: 404 });
    await expect(service.saveProfile('viewer-id', 'ineligible-profile')).rejects.toMatchObject({ status: 404 });
    expect(profileFind).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('returns an authorized rich profile detail without adding private account or precise location fields', async () => {
    const visibility = { canAccessProfile: vi.fn(async () => true) };
    const prisma = {
      profile: { findUnique: vi.fn(async () => ({
        genderIdentity: 'Woman', selectedPrompt: 'A perfect Sunday is…',
        interestedIn: [{ value: 'Men' }], languages: [{ value: 'English' }],
        lifestyles: [{ value: 'Outdoors' }], values: [{ value: 'Kindness' }],
        conversationStyles: [{ value: 'Thoughtful' }],
        photos: [{ isMain: true, asset: { id: 'photo-asset' } }, { isMain: false, asset: { id: 'photo-asset-2' } }],
      })) },
      savedProfile: { findUnique: vi.fn(async () => ({ ownerId: 'viewer-id' })) },
      humanVerification: { findFirst: vi.fn(async () => ({ id: 'verified-record' })) },
      datingIntentSelection: { findMany: vi.fn(async () => [{ intent: 'serious' }]) },
    };
    const service = new DiscoveryService(prisma as never, visibility as never);
    vi.spyOn(service, 'getFeed').mockResolvedValue([{
      id: 'target-id', name: 'Sam', age: 30, distanceKm: null, distanceBand: '10–50 km', location: '', profession: '', interests: 'Music', about: 'Hello', image: '/media/discovery-profiles/target-id/photo-asset/content', online: false, isSaved: false,
    }] as never);
    const result = await service.getProfile('viewer-id', 'target-id');
    expect(result).toMatchObject({
      id: 'target-id', name: 'Sam', age: 30, distanceBand: '10–50 km', isSaved: true,
      genderIdentity: 'Woman', interestedIn: ['Men'], prompt: 'A perfect Sunday is…',
      languages: ['English'], lifestyles: ['Outdoors'], values: ['Kindness'], conversationStyles: ['Thoughtful'],
      datingIntents: ['serious'], verified: true,
      photos: [
        { uri: '/media/discovery-profiles/target-id/photo-asset/content', isMain: true },
        { uri: '/media/discovery-profiles/target-id/photo-asset-2/content', isMain: false },
      ],
    });
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('mobileNumber');
    expect(result).not.toHaveProperty('dateOfBirth');
    expect(result).not.toHaveProperty('latitude');
    expect(result).not.toHaveProperty('longitude');
    expect(visibility.canAccessProfile).toHaveBeenCalledWith('viewer-id', 'target-id');
  });

  it('stores only HMAC digests for Contact Lock and deletes them when disabled', async () => {
    process.env.CONTACT_LOCK_HMAC_SECRET = 'r4ndom-long-contact-secret-material-9X!q';
    const upsert = vi.fn(async (_args: { where: { userId: string }; create: object; update: object }) => ({}));
    const deleteMany = vi.fn(async (_args: { where: { userId: string } }) => ({ count: 2 }));
    const createMany = vi.fn(async (_args: { data: { userId: string; digest: string }[] }) => ({ count: 1 }));
    const tx = { profilePrivacySetting: { upsert }, profileContactHash: { deleteMany, createMany } };
    const prisma = {
      profilePrivacySetting: { findUnique: vi.fn(async () => null) },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(tx)),
    };
    const service = new DiscoveryService(prisma as never, { contactDigests: (values: string[]) => values.map(() => 'a'.repeat(64)) } as never);
    const rawContact = 'phone[IN]:9876543210';
    await service.updatePrivacySettings('viewer-id', { contactLockEnabled: true, contacts: [rawContact] });
    expect(createMany.mock.calls[0][0].data).not.toContain(rawContact);
    expect(createMany.mock.calls[0][0].data).toEqual([{ userId: 'viewer-id', digest: 'a'.repeat(64) }]);
    await service.updatePrivacySettings('viewer-id', { contactLockEnabled: false });
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: 'viewer-id' } });
  });
});
