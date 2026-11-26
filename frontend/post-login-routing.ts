import type { OnboardingProfile, VerificationSubmission } from './auth-api';

export type PostLoginScreen =
  | 'ageVerification'
  | 'intentSelection'
  | 'discoveryMode'
  | 'profileBasics'
  | 'profileBasics2'
  | 'profileBasics3'
  | 'videoVerificationStatus'
  | 'userDashboard';

type Progress = {
  emailVerified: boolean;
  intents: string[];
  modes: string[];
  profile: OnboardingProfile;
  verifications: VerificationSubmission[];
};

export function resolvePostLoginScreen(progress: Progress): PostLoginScreen {
  if (!progress.emailVerified) return 'ageVerification';

  // Signup collects email and video verification before intent, discovery, and profile setup.
  // An empty verification list therefore means the account has not reached those later steps.
  const latest = progress.verifications[0];
  if (!latest || latest.status === 'FAILED') return 'videoVerificationStatus';

  const profile = progress.profile;
  const hasProfileProgress = Boolean(
    profile.completed || profile.displayName?.trim() || profile.genderIdentity || profile.interestedIn.length ||
    profile.bio?.trim() || profile.photos.length || profile.storedLanguages?.length || profile.interests.length ||
    profile.lifestyles.length || profile.values.length || profile.conversationStyles.length,
  );

  // Once profile data exists, the user has already passed intent and discovery selection.
  // Those saved selection endpoints can be empty for older or partially migrated accounts;
  // absence of their rows must not send the user backwards.
  if (!hasProfileProgress) {
    if (!progress.modes.length) {
      if (!progress.intents.length) return 'intentSelection';
      return 'discoveryMode';
    }
  }

  if (!profile.completed) {
    if (!profile.displayName?.trim() || !profile.interestedIn.length) return 'profileBasics';
    if (!profile.bio?.trim() || !profile.photos.length || !profile.languages.length) return 'profileBasics2';
    if (!profile.interests.length || !profile.lifestyles.length || !profile.values.length || !profile.conversationStyles.length) return 'profileBasics3';
    // A partially populated profile without completedAt still needs the final save/complete action.
    return 'profileBasics3';
  }

  // Pending/manual review is a submitted verification; it must not send the user back to recording.
  return 'userDashboard';
}
