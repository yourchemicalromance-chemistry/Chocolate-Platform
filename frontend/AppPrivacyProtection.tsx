import React, { useEffect, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { activatePrivacyProtections, shouldShowPrivacyShield, subscribeToAppPrivacyLifecycle } from './privacy-protection';

export function AppPrivacyProtection({ children }: React.PropsWithChildren) {
  const [shieldVisible, setShieldVisible] = useState(() => shouldShowPrivacyShield(AppState.currentState));

  useEffect(() => {
    let activated = false;
    const activate = async () => {
      if (activated) return;
      try {
        // Screenshot/capture blocking is disabled only for development builds.
        // iOS app-switcher obscuring and the app-state privacy shield stay on.
        await activatePrivacyProtections(Platform.OS, ScreenCapture, typeof __DEV__ === 'undefined' || !__DEV__);
        activated = true;
      } catch {
        // Retry on the next active transition if the native window is not ready yet.
      }
    };
    void activate();

    const subscription = subscribeToAppPrivacyLifecycle(
      (listener) => AppState.addEventListener('change', listener),
      setShieldVisible,
      () => { void activate(); },
    );
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {shieldVisible ? <View testID="app-privacy-shield" pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000000' }} /> : null}
    </View>
  );
}
