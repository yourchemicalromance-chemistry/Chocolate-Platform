import { describe, expect, it } from 'vitest';
import type { OnboardingProfile, VerificationSubmission } from './auth-api';
import { resolvePostLoginScreen } from './post-login-routing';

const fullProfile: OnboardingProfile = {
  displayName: 'Ada', age: 30, genderIdentity: 'Woman', interestedIn: ['Everyone'], bio: 'Hello',
  selectedPrompt: null, languages: ['English'], storedLanguages: ['English'], interests: ['Music'],
  lifestyles: ['Active'], values: ['Kindness'], conversationStyles: ['Warm'],
  photos: [{ id: 'photo', assetId: 'asset', position: 0, isMain: true, ready: true, uri: '/photo' }], completed: true,
};
const verification = (status: VerificationSubmission['status']): VerificationSubmission => ({
  id: 'verification', status, createdAt: '2026-01-01T00:00:00.000Z', reviewedAt: null,
});
const emptyProfile: OnboardingProfile = {
  displayName: null, age: null, genderIdentity: null, interestedIn: [], bio: null, selectedPrompt: null,
  languages: ['English', 'Hindi'], storedLanguages: [], interests: [], lifestyles: [], values: [],
  conversationStyles: [], photos: [], completed: false,
};
const progress = (overrides: Partial<Parameters<typeof resolvePostLoginScreen>[0]> = {}) => ({
  emailVerified: true, intents: ['serious'], modes: ['browse'], profile: fullProfile, verifications: [verification('VERIFIED')], ...overrides,
});

describe('post-login onboarding routing', () => {
  it('routes users with unverified email to email verification', () => {
    expect(resolvePostLoginScreen(progress({ emailVerified: false }))).toBe('ageVerification');
  });

  it('resumes the first incomplete profile setup screen', () => {
    expect(resolvePostLoginScreen(progress({ profile: { ...fullProfile, completed: false, displayName: null } }))).toBe('profileBasics');
    expect(resolvePostLoginScreen(progress({ profile: { ...fullProfile, completed: false, photos: [] } }))).toBe('profileBasics2');
    expect(resolvePostLoginScreen(progress({ profile: { ...fullProfile, completed: false, interests: [] } }))).toBe('profileBasics3');
  });

  it('resumes Screen 2 when Screen 1 was saved without an optional gender identity', () => {
    expect(resolvePostLoginScreen(progress({
      profile: { ...fullProfile, completed: false, genderIdentity: null, bio: null, photos: [] },
    }))).toBe('profileBasics2');
  });

  it('resumes earlier setup selections when they have not been saved', () => {
    expect(resolvePostLoginScreen(progress({ profile: emptyProfile, intents: [], modes: [] }))).toBe('intentSelection');
    expect(resolvePostLoginScreen(progress({ profile: emptyProfile, modes: [] }))).toBe('discoveryMode');
  });

  it('keeps an email-verified account at video verification before later setup selections', () => {
    expect(resolvePostLoginScreen(progress({ profile: emptyProfile, intents: [], modes: [], verifications: [] })))
      .toBe('videoVerificationStatus');
  });

  it('continues from a submitted video to Intent Selection when later selections are still empty', () => {
    expect(resolvePostLoginScreen(progress({
      profile: emptyProfile, intents: [], modes: [], verifications: [verification('PENDING')],
    }))).toBe('intentSelection');
  });

  it('does not return a user with saved profile progress to empty intent or mode selections', () => {
    expect(resolvePostLoginScreen(progress({
      profile: { ...fullProfile, completed: false, bio: null, photos: [] }, intents: [], modes: [],
    }))).toBe('profileBasics2');
  });

  it('uses a saved later selection as evidence that an earlier empty selection was already passed', () => {
    expect(resolvePostLoginScreen(progress({ profile: emptyProfile, intents: [], modes: ['browse'] })))
      .toBe('profileBasics');
  });

  it('does not send a completed account back when selection rows are absent', () => {
    expect(resolvePostLoginScreen(progress({ intents: [], modes: [] }))).toBe('userDashboard');
  });

  it('routes a completed profile without a video submission to video verification', () => {
    expect(resolvePostLoginScreen(progress({ verifications: [] }))).toBe('videoVerificationStatus');
  });

  it.each(['PENDING', 'MANUAL_REVIEW'] as const)('lets submitted video with %s review continue to Dashboard', (status) => {
    expect(resolvePostLoginScreen(progress({ verifications: [verification(status)] }))).toBe('userDashboard');
  });

  it('routes approved verification and fully completed accounts to Dashboard', () => {
    expect(resolvePostLoginScreen(progress({ verifications: [verification('VERIFIED')] }))).toBe('userDashboard');
    expect(resolvePostLoginScreen(progress())).toBe('userDashboard');
  });

  it('routes rejected verification to the existing retry/status screen', () => {
    expect(resolvePostLoginScreen(progress({ verifications: [verification('FAILED')] }))).toBe('videoVerificationStatus');
  });
});
