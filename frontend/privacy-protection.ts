import type { AppStateStatus } from 'react-native';

export const PRIVACY_CAPTURE_KEY = 'chocolate-app-wide-capture-protection';

export type ScreenCaptureProtectionApi = {
  preventScreenCaptureAsync: (key: string) => Promise<void>;
  allowScreenCaptureAsync?: (key: string) => Promise<void>;
  enableAppSwitcherProtectionAsync: (blurIntensity?: number) => Promise<void>;
};

export function shouldShowPrivacyShield(state: AppStateStatus | null): boolean {
  return state !== 'active';
}

export function subscribeToAppPrivacyLifecycle(
  addListener: (listener: (state: AppStateStatus) => void) => { remove: () => void },
  setShieldVisible: (visible: boolean) => void,
  retryProtection: () => void,
): { remove: () => void } {
  return addListener((state) => {
    setShieldVisible(shouldShowPrivacyShield(state));
    if (state === 'active') retryProtection();
  });
}

export async function activatePrivacyProtections(
  platform: string,
  screenCapture: ScreenCaptureProtectionApi,
  enableCaptureBlocking = true,
): Promise<void> {
  if (enableCaptureBlocking) {
    await screenCapture.preventScreenCaptureAsync(PRIVACY_CAPTURE_KEY);
  } else if (screenCapture.allowScreenCaptureAsync) {
    // Clear a protection key left active by an earlier dev session/reload.
    await screenCapture.allowScreenCaptureAsync(PRIVACY_CAPTURE_KEY);
  }
  if (platform === 'ios') await screenCapture.enableAppSwitcherProtectionAsync(1);
}
