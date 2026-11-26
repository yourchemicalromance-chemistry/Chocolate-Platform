# CHOCOLATE privacy protection

`AppPrivacyProtection` wraps the complete app tree. It keeps `expo-screen-capture` protection active for the app lifetime and uses a black, layout-independent shield while React Native reports the app as inactive or backgrounded. The current screen remains mounted, so navigation and unsaved state are retained.

The SDK 57 `expo-screen-capture` native implementation:

- Sets Android `FLAG_SECURE`, which blocks normal OS screenshots and screen recordings and blanks the Android Recents preview.
- On iOS, uses a secure window canvas for screenshot blocking where supported, observes `UIScreen.capturedDidChangeNotification`, and covers the app window while recording or mirroring is active.
- Adds the iOS app-switcher privacy blur while the app resigns active, including interruptions. The React Native shield provides a second lifecycle layer.

These controls reduce capture through supported OS features; they cannot prevent photographing the display with another device, extraction on a compromised/jailbroken device, future OS behavior changes, or all vendor capture paths. iOS screenshot notifications fire after a screenshot has been taken; CHOCOLATE does not rely on notification as prevention. On iOS versions where native screenshot prevention is unavailable or fails to attach, capture may remain possible.

Private media is served from the authenticated `/media/:assetId/content` controller only. The route performs owner or configured reviewer authorization, supports streaming/ranges, and sends private no-store headers. There is no static public media-serving route. Story photos use authenticated requests with reload cache policy; `expo-video` caching is not enabled for review video. Native image/video decoders can retain transient buffers while displaying media, which cannot be reliably erased by JavaScript.

`expo-screen-capture` is a native module. This repository uses Expo Continuous Native Generation and has no checked-in `ios/` or `android/` directories. A new native/development or production build must include the dependency before standalone binaries receive the protection. Expo SDK 57 documentation lists the module as included in Expo Go, but Expo Go is not evidence that a separately built CHOCOLATE binary has the feature. No physical-device verification has been performed.
