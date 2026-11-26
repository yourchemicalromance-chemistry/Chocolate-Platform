import { describe, expect, it, vi } from 'vitest';
import { activatePrivacyProtections, PRIVACY_CAPTURE_KEY, shouldShowPrivacyShield, subscribeToAppPrivacyLifecycle } from './privacy-protection';

describe('app-wide privacy protection', () => {
  it('activates persistent screenshot and recording protection on Android', async () => {
    const api = { preventScreenCaptureAsync: vi.fn().mockResolvedValue(undefined), enableAppSwitcherProtectionAsync: vi.fn() };
    await activatePrivacyProtections('android', api);
    expect(api.preventScreenCaptureAsync).toHaveBeenCalledWith(PRIVACY_CAPTURE_KEY);
    expect(api.enableAppSwitcherProtectionAsync).not.toHaveBeenCalled();
  });

  it('activates iOS capture protection and native app-switcher obscuring', async () => {
    const api = { preventScreenCaptureAsync: vi.fn().mockResolvedValue(undefined), enableAppSwitcherProtectionAsync: vi.fn().mockResolvedValue(undefined) };
    await activatePrivacyProtections('ios', api);
    expect(api.preventScreenCaptureAsync).toHaveBeenCalledWith(PRIVACY_CAPTURE_KEY);
    expect(api.enableAppSwitcherProtectionAsync).toHaveBeenCalledWith(1);
  });

  it('allows screenshots in development while preserving iOS app-switcher protection', async () => {
    const api = { preventScreenCaptureAsync: vi.fn(), allowScreenCaptureAsync: vi.fn().mockResolvedValue(undefined), enableAppSwitcherProtectionAsync: vi.fn().mockResolvedValue(undefined) };
    await activatePrivacyProtections('ios', api, false);
    expect(api.preventScreenCaptureAsync).not.toHaveBeenCalled();
    expect(api.allowScreenCaptureAsync).toHaveBeenCalledWith(PRIVACY_CAPTURE_KEY);
    expect(api.enableAppSwitcherProtectionAsync).toHaveBeenCalledWith(1);
  });

  it.each([['inactive', true], ['background', true], ['active', false], [null, true]] as const)(
    'sets the privacy shield correctly for app state %s', (state, visible) => {
      expect(shouldShowPrivacyShield(state)).toBe(visible);
    },
  );

  it('shields background previews and restores the app while retrying native activation', () => {
    let listener: ((state: 'active' | 'background' | 'inactive') => void) | undefined;
    const setShield = vi.fn();
    const retry = vi.fn();
    const remove = vi.fn();
    const subscription = subscribeToAppPrivacyLifecycle((callback) => {
      listener = callback;
      return { remove };
    }, setShield, retry);

    listener?.('background');
    expect(setShield).toHaveBeenLastCalledWith(true);
    listener?.('active');
    expect(setShield).toHaveBeenLastCalledWith(false);
    expect(retry).toHaveBeenCalledOnce();
    subscription.remove();
    expect(remove).toHaveBeenCalledOnce();
  });
});
