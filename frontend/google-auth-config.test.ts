import { describe, expect, it } from 'vitest';
import { hasGoogleClientIdForPlatform } from './google-auth-config';

describe('hasGoogleClientIdForPlatform', () => {
  it('requires the client ID for the active platform', () => {
    expect(hasGoogleClientIdForPlatform('android', {})).toBe(false);
    expect(hasGoogleClientIdForPlatform('android', { iosClientId: 'ios-client' })).toBe(false);
    expect(hasGoogleClientIdForPlatform('ios', { androidClientId: 'android-client' })).toBe(false);
    expect(hasGoogleClientIdForPlatform('android', { androidClientId: 'android-client' })).toBe(true);
    expect(hasGoogleClientIdForPlatform('ios', { iosClientId: 'ios-client' })).toBe(true);
    expect(hasGoogleClientIdForPlatform('web', { webClientId: 'web-client' })).toBe(true);
  });

  it('treats blank values as unavailable', () => {
    expect(hasGoogleClientIdForPlatform('android', { androidClientId: '   ' })).toBe(false);
  });
});
