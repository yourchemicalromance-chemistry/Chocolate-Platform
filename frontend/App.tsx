
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Platform,
  Pressable,
  Modal,
  Text as RNText,
  View,
  Alert,
} from 'react-native';
import { AppPrivacyProtection } from './AppPrivacyProtection';

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/montserrat';

import {
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';

import { IntentSelectionScreen } from './Chocolate/app/ChocolateIntentSelectionScreen';
import { ChocolateLandingScreen } from './Chocolate/app/ChocolateLandingScreen';
import { ChocolateSignUpScreen } from './Chocolate/app/ChocolateSignUpScreen';
import { ChocolateAgeVerificationScreen } from './Chocolate/app/ChocolateAgeVerificationScreen';
import { ChocolateLoginScreen } from './Chocolate/app/ChocolateLoginScreen';
import { ChocolatePasswordRecoveryFlow } from './Chocolate/app/ChocolatePasswordRecoveryFlow';
import { LocationSearchScreen } from './Chocolate/app/LocationSearchScreen';
import { NearbyScreen } from './Chocolate/app/NearbyScreen';
import { signup as signupApi, login as loginApi, googleAuth as googleAuthApi, getAccessToken, getAccountStatus, logout, uploadMedia, createVerificationSession, getVideoReviewAccess, getVideoVerificationStatus, saveDatingIntents, saveDiscoveryModes, getDatingIntents, getDiscoveryModes, getOnboardingProfile, saveProfileBasics, saveProfileStory, saveProfileChemistry, attachProfilePhoto, setMainProfilePhoto, removeProfilePhoto, completeProfile, getDiscoveryPrivacy, updateDiscoveryPrivacy, subscribeToAuthenticationExpiry, isAuthenticationExpiredError, type OnboardingProfile, type DiscoveryProfile, type DiscoveryMode } from './auth-api';
import { resolvePostLoginScreen } from './post-login-routing';
import { ChocolateVideoVerificationStatusScreen } from './Chocolate/app/ChocolateVideoVerificationStatusScreen';
import { ChocolateVideoReviewScreen } from './Chocolate/app/ChocolateVideoReviewScreen';


import {
  PrivacyLockScreen,
  type PrivacyLockSettings,
} from './Chocolate/app/PrivacyLockScreen';

import {
  DashboardFilterScreen,
  type DashboardFilterType,
} from './app/DashboardFilterScreen';


import {
  DiscoveryModeScreen,
} from './Chocolate/app/ChocolateDiscoveryModeScreen';

//import { UserDashboardScreen } from './app/UserDashboardScreen';
//import { UserDashboardScreen as ChemistryUserDashboardScreen } from './app/UserDashboardScreen';
import { UserDashboardScreen as ChocolateUserDashboardScreen } from './Chocolate/app/ChocolateUserDashboardScreen';
import { restoreLanguage } from './Chocolate/localization';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import { hasGoogleClientIdForPlatform, type GoogleOAuthClientIds } from './google-auth-config';

import { ProfileBasicsScreen } from './Chocolate/app/ChocolateProfileBasicsScreen';
import { ProfileBasicsScreen2 } from './Chocolate/app/ChocolateProfileBasicsScreen2';
import { ProfileBasicsScreen3 } from './Chocolate/app/ChocolateProfileBasicsScreen3';
import { ChocolateProfileExperienceScreen } from './Chocolate/app/ChocolateProfileExperienceScreen';

type Screen =
  | 'landing'
  | 'signup'
  | 'ageVerification'
  | 'intentSelection'
  | 'discoveryMode'
  | 'profileBasics'
  | 'profileBasics2'
  | 'profileBasics3'
  | 'login'
  | 'forgotPassword'
  | 'userDashboard'
  | 'videoVerificationStatus'
  | 'videoReviews'
  | 'discover'
  | 'nearby'
  | 'locationSearch'
  | 'privacyLock'
  | 'dashboardFilter'
  | 'myProfile'
  | 'profileDetail';

function alertUnlessSessionExpired(title: string, error: unknown): void {
  if (!isAuthenticationExpiredError(error)) Alert.alert(title, error instanceof Error ? error.message : 'Please try again.');
}

export default function App() {
  const clientIds: GoogleOAuthClientIds = {
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  };
  const googleAuthConfigured = hasGoogleClientIdForPlatform(Platform.OS, clientIds);
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthState | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showRecoveryLogin, setShowRecoveryLogin] = useState(false);
  const [authRecoveryCount, setAuthRecoveryCount] = useState(0);
  useEffect(() => subscribeToAuthenticationExpiry(() => { setSessionExpired(true); setShowRecoveryLogin(false); }), []);

  const finishSessionLogin = async (identifier: string, password: string) => {
    try {
      const auth = await loginApi(identifier, password);
      setSessionExpired(false);
      setShowRecoveryLogin(false);
      setAuthRecoveryCount((count) => count + 1);
      return auth;
    } catch (error) {
        alertUnlessSessionExpired('Unable to log in', error);
      return null;
    }
  };

  return (
    <AppPrivacyProtection>
      {googleAuthConfigured ? <GoogleAuthBridge clientIds={clientIds} onStateChange={setGoogleAuth} /> : null}
      <AppContent googleAuthConfigured={googleAuthConfigured} googleAuth={googleAuth} authRecoveryCount={authRecoveryCount} />
      <Modal visible={sessionExpired} animationType="slide" onRequestClose={() => undefined}>
        {showRecoveryLogin ? <ChocolateLoginScreen onBack={() => setShowRecoveryLogin(false)} onCreateAccount={() => undefined}
          onLogin={(identifier, password) => { void finishSessionLogin(identifier, password); }} onForgotPassword={() => undefined} /> :
          <View style={{ flex: 1, backgroundColor: '#160D08', justifyContent: 'center', padding: 28 }}>
            <RNText style={{ color: '#FFF0DF', fontSize: 20, textAlign: 'center', marginBottom: 18 }}>Your login session has expired. Please log in again to continue.</RNText>
            <Pressable accessibilityRole="button" onPress={() => setShowRecoveryLogin(true)} style={{ alignSelf: 'center', padding: 16 }}>
              <RNText style={{ color: '#D5B58C', fontWeight: '700' }}>Log in again</RNText>
            </Pressable>
          </View>}
      </Modal>
    </AppPrivacyProtection>
  );
}

type GoogleAuthState = ReturnType<typeof useIdTokenAuthRequest> extends [infer Request, infer Response, infer Prompt]
  ? { request: Request; response: Response; promptGoogle: Prompt }
  : never;

type GoogleAuthBridgeProps = {
  clientIds: GoogleOAuthClientIds;
  onStateChange: (state: GoogleAuthState) => void;
};

function GoogleAuthBridge({ clientIds, onStateChange }: GoogleAuthBridgeProps) {
  const [request, response, promptGoogle] = useIdTokenAuthRequest({ ...clientIds, selectAccount: true });

  useEffect(() => {
    onStateChange({ request, response, promptGoogle });
  }, [request, response, promptGoogle, onStateChange]);

  return null;
}

function AppContent({ googleAuthConfigured, googleAuth, authRecoveryCount }: { googleAuthConfigured: boolean; googleAuth: GoogleAuthState | null; authRecoveryCount: number }) {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
  });

  const [screen, setScreen] = useState<Screen>('landing');
  const [activeDiscoveryMode, setActiveDiscoveryMode] = useState('Algorithmic Recommendations');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [emailInitiallyVerified, setEmailInitiallyVerified] = useState(false);
  const [isVideoReviewer, setIsVideoReviewer] = useState(false);
  const [pendingGoogleIdToken, setPendingGoogleIdToken] = useState<string | null>(null);
  const [googleProfile, setGoogleProfile] = useState<{ fullName: string; email: string } | null>(null);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null);
  const [authResolving, setAuthResolving] = useState(true);
  const [videoReviewPending, setVideoReviewPending] = useState(false);

  const [modalOpacity] = useState(() => new Animated.Value(0));
  const screenHistory = useRef<Screen[]>([]);
  const handledGoogleResponse = useRef<string | null>(null);

  const startGoogleSignIn = useCallback(async () => {
    if (!googleAuthConfigured) {
      Alert.alert('Google sign-in unavailable', 'Google sign-in is not configured for this platform. Use email and password, or configure the platform Google OAuth client ID.');
      return;
    }
    if (!googleAuth?.request) {
      Alert.alert('Google sign-in unavailable', 'Google sign-in is still initializing. Please try again shortly.');
      return;
    }
    try {
      const result = await googleAuth.promptGoogle();
      if (result.type === 'error') Alert.alert('Google sign-in failed', 'Please try again.');
    } catch {
      Alert.alert('Google sign-in failed', 'Please try again.');
    }
  }, [googleAuth, googleAuthConfigured]);

  const finishAuthenticatedOnboarding = useCallback((auth: { user: { email: string; emailVerified: boolean } }) => {
    setRegisteredEmail(auth.user.email);
    setEmailInitiallyVerified(auth.user.emailVerified);
    screenHistory.current = [];
    setScreen('ageVerification');
  }, []);

  const routeAuthenticatedUser = useCallback(async (auth: { user: { email: string; emailVerified: boolean } }) => {
    setRegisteredEmail(auth.user.email);
    setEmailInitiallyVerified(auth.user.emailVerified);
    if (!auth.user.emailVerified) {
      screenHistory.current = [];
      setScreen('ageVerification');
      return;
    }
    const [profile, { intents }, { mode }, verifications] = await Promise.all([
      getOnboardingProfile(), getDatingIntents(), getDiscoveryModes(), getVideoVerificationStatus(),
    ]);
    setOnboardingProfile(profile);
    const latestVerification = verifications[0];
    setVideoReviewPending(latestVerification?.status === 'PENDING' || latestVerification?.status === 'MANUAL_REVIEW');
    screenHistory.current = [];
    setActiveDiscoveryMode(mode === 'browse' ? 'Self Search / Browse' : mode === 'kismat' ? 'KISMAT' : 'Algorithmic Recommendations');
    setScreen(resolvePostLoginScreen({ emailVerified: true, profile, intents, modes: mode ? [mode] : [], verifications }));
  }, []);

  const updateVideoReviewPending = useCallback((items: Awaited<ReturnType<typeof getVideoVerificationStatus>>) => {
    setVideoReviewPending(items[0]?.status === 'PENDING' || items[0]?.status === 'MANUAL_REVIEW');
  }, []);

  useEffect(() => {
    const googleResponse = googleAuth?.response;
    if (!googleResponse || googleResponse.type !== 'success') return;
    const idToken = googleResponse.params.id_token;
    if (!idToken || handledGoogleResponse.current === idToken) return;
    handledGoogleResponse.current = idToken;
    void googleAuthApi(idToken).then((result) => {
      if ('requiresProfileCompletion' in result) {
        setPendingGoogleIdToken(idToken);
        setGoogleProfile(result.profile);
        screenHistory.current = [];
        setScreen('signup');
        return;
      }
      void routeAuthenticatedUser(result).catch((error: unknown) => {
        alertUnlessSessionExpired('Unable to load your account setup', error);
      });
    }).catch((error: unknown) => {
      Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Please try again.');
    });
  }, [googleAuth?.response, finishAuthenticatedOnboarding, routeAuthenticatedUser]);

  useEffect(() => {
    restoreLanguage();
    void getAccessToken().then((token) => {
      if (!token) { setAuthResolving(false); return; }
      void Promise.all([getAccountStatus(), getOnboardingProfile(), getDatingIntents(), getDiscoveryModes(), getVideoVerificationStatus()])
        .then(([account, profile, { intents }, { mode }, verifications]) => {
          setRegisteredEmail(account.email);
          setEmailInitiallyVerified(account.emailVerified);
          setOnboardingProfile(profile);
          const latestVerification = verifications[0];
          setVideoReviewPending(latestVerification?.status === 'PENDING' || latestVerification?.status === 'MANUAL_REVIEW');
          setActiveDiscoveryMode(mode === 'browse' ? 'Self Search / Browse' : mode === 'kismat' ? 'KISMAT' : 'Algorithmic Recommendations');
          setScreen(resolvePostLoginScreen({ emailVerified: account.emailVerified, profile, intents, modes: mode ? [mode] : [], verifications }));
        })
        .catch((error: unknown) => {
          if (isAuthenticationExpiredError(error)) return;
          screenHistory.current = [];
          setScreen('landing');
          Alert.alert('Unable to load your account setup', error instanceof Error ? error.message : 'Please try again.');
        })
        .finally(() => setAuthResolving(false));
    }).catch(() => setAuthResolving(false));
  }, []);

  useEffect(() => {
    if (!authRecoveryCount) return;
    // Keep the current subtree mounted during reauthentication (notably the
    // local video preview). Route only when startup token restoration failed.
    if (screen !== 'landing' && screen !== 'login') return;
    const token = getAccessToken();
    void token.then(async (savedToken) => {
      if (!savedToken) return;
      const account = await getAccountStatus();
      await routeAuthenticatedUser({ user: { email: account.email, emailVerified: account.emailVerified } });
    }).catch((error: unknown) => {
      if (!isAuthenticationExpiredError(error)) Alert.alert('Unable to restore your account', error instanceof Error ? error.message : 'Please try again.');
    });
  }, [authRecoveryCount, routeAuthenticatedUser, screen]);

  useEffect(() => {
    if (screen === 'userDashboard') {
      void getVideoReviewAccess().then(({ authorized }) => setIsVideoReviewer(authorized)).catch(() => setIsVideoReviewer(false));
    }
  }, [screen]);

  useEffect(() => {
    if (!['profileBasics', 'profileBasics2', 'profileBasics3'].includes(screen)) return;
    void getOnboardingProfile().then(setOnboardingProfile).catch((error: unknown) => {
      alertUnlessSessionExpired('Unable to load your profile', error);
    });
  }, [screen]);

  const navigateTo = useCallback((nextScreen: Screen) => {
    if (screen !== nextScreen) {
      screenHistory.current.push(screen);
    }

    setScreen(nextScreen);
  }, [screen]);

  const openDiscover = useCallback((profileId?: string) => {
    setSelectedProfileId(profileId ?? null);
    navigateTo('profileDetail');
  }, [navigateTo]);

  const goBack = useCallback(() => {
    const previousScreen = screenHistory.current.pop();

    if (previousScreen) {
      setScreen(previousScreen);
      return true;
    }

    return false;
  }, []);

  const [activeSearchIntent, setActiveSearchIntent] =
    useState('Serious Relationship');

  const [activeDashboardFilter, setActiveDashboardFilter] =
    useState<DashboardFilterType>('discovery');

  const [privacyLockSettings, setPrivacyLockSettings] =
    useState<PrivacyLockSettings>({
      contactLockEnabled: false,
      neighbourhoodLockEnabled: false,
      areaExclusionEnabled: false,
      undiscoverableEnabled: false,
      excludedArea: '',
    });
  const [pendingDiscoveryProfiles, setPendingDiscoveryProfiles] = useState<DiscoveryProfile[] | undefined>();
  useEffect(() => {
    if (screen !== 'privacyLock') return;
    let active = true;
    void getDiscoveryPrivacy().then(saved => { if (active) setPrivacyLockSettings({ ...saved, excludedArea: saved.excludedArea ?? '' }); })
      .catch(error => alertUnlessSessionExpired('Unable to load privacy settings', error));
    return () => { active = false; };
  }, [screen]);

  const isModalVisible = screen === 'signup' || screen === 'login' || screen === 'forgotPassword';

  const closeModal = useCallback(() => {
    Animated.timing(modalOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        const previousScreen = screenHistory.current.pop();
        setScreen(previousScreen ?? 'landing');
      }
    });
  }, [modalOpacity]);

  useEffect(() => {
    if (!isModalVisible) return;

    modalOpacity.setValue(0);

    Animated.timing(modalOpacity, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [screen, isModalVisible, modalOpacity]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isModalVisible) {
          closeModal();
          return true;
        }

        return goBack();
      },
    );

    return () => subscription.remove();
  }, [isModalVisible, closeModal, goBack]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1 }} />;
  }

  if (authResolving) return <View style={{ flex: 1 }} />;

  if (screen === 'ageVerification') {
    return (
        <ChocolateAgeVerificationScreen
            onBack={goBack}
            registeredEmail={registeredEmail}
            emailInitiallyVerified={emailInitiallyVerified}
            onCreateInterviewSession={createVerificationSession}
            onRetakeInterview={createVerificationSession}
            onGetInterviewStatus={getVideoVerificationStatus}
            onUploadInterview={async (uri, session, progress) => {
              if (typeof __DEV__ !== 'undefined' && __DEV__) console.info('[video-recording-debug]', JSON.stringify({ stage: 'app-upload-handoff', uriScheme: uri.split(':', 1)[0] || null, sessionProvided: Boolean(session) }));
              return uploadMedia(uri, 'AGE_INTERVIEW_VIDEO', session, progress);
            }}
            onContinueToLogin={() => navigateTo('intentSelection')}
        />
    );
}

  if (screen === 'intentSelection') {
    return (
      <IntentSelectionScreen
        onBack={goBack}
        onContinue={async (selectedIntents) => {
          await saveDatingIntents(selectedIntents);
          navigateTo('discoveryMode');
        }}
      />
    );
  }

  if (screen === 'discoveryMode') {
    return (
      <DiscoveryModeScreen
        onContinue={async (mode) => {
          await saveDiscoveryModes(mode);
          setActiveDiscoveryMode(mode === 'browse' ? 'Self Search / Browse' : mode === 'kismat' ? 'KISMAT' : 'Algorithmic Recommendations');
          navigateTo('profileBasics');
        }}
      />
    );
  }

  if (screen === 'profileBasics') {
    return (
      <ProfileBasicsScreen
        onBack={goBack}
        initialDetails={onboardingProfile ? { displayName: onboardingProfile.displayName ?? '', genderIdentity: onboardingProfile.genderIdentity as any, interestedIn: onboardingProfile.interestedIn as any } : undefined}
        onContinue={async (details) => {
          try {
          const saved = await saveProfileBasics(details);
          setOnboardingProfile(saved);
          navigateTo('profileBasics2');
          } catch (error) { alertUnlessSessionExpired('Unable to save profile basics', error); }
        }}
      />
    );
  }

  if (screen === 'profileBasics2') {
    return (
      <ProfileBasicsScreen2
        onBack={goBack}
        initialDetails={onboardingProfile ? { photos: onboardingProfile.photos.map(photo => ({ id: photo.id, uri: photo.uri, assetId: photo.assetId } as any)), mainPhotoId: onboardingProfile.photos.find(photo => photo.isMain)?.id ?? null, bio: onboardingProfile.bio ?? '', selectedPrompt: onboardingProfile.selectedPrompt, languages: onboardingProfile.languages } : undefined}
        onContinue={async (details, onPhotoPersisted) => {
          try {
            let saved = await saveProfileStory({ bio: details.bio, selectedPrompt: details.selectedPrompt, languages: details.languages });
            setOnboardingProfile(saved);
            let currentPhotos = saved.photos;
            const originalPhotos = onboardingProfile?.photos ?? saved.photos;
            const requestedPhotoIds = new Set(details.photos.filter(photo => photo.assetId).map(photo => photo.id));
            let newlySelectedMain: string | null = null;
            for (const photo of details.photos) {
              if (photo.assetId) continue;
              const upload = await uploadMedia(photo.uri, 'PROFILE_PHOTO');
              const attached = await attachProfilePhoto(upload.assetId);
              saved = await getOnboardingProfile();
              setOnboardingProfile(saved);
              currentPhotos = saved.photos;
              const persistedPhoto = currentPhotos.find(item => item.id === attached.id);
              if (persistedPhoto) onPhotoPersisted?.(photo.id, persistedPhoto);
              if (photo.id === details.mainPhotoId) newlySelectedMain = attached.id;
            }
            const main = currentPhotos.find(photo => photo.id === (newlySelectedMain ?? details.mainPhotoId) || photo.assetId === details.mainPhotoId);
            if (main && !main.isMain) await setMainProfilePhoto(main.id);
            for (const prior of originalPhotos) {
              if (!requestedPhotoIds.has(prior.id)) {
                await removeProfilePhoto(prior.id);
                saved = await getOnboardingProfile();
                setOnboardingProfile(saved);
                currentPhotos = saved.photos;
              }
            }
            saved = await getOnboardingProfile();
            setOnboardingProfile(saved);
            navigateTo('profileBasics3');
          } catch (error) {
            try { setOnboardingProfile(await getOnboardingProfile()); } catch { /* Preserve the values already in the form when refresh is unavailable. */ }
            alertUnlessSessionExpired('Unable to save your profile story', error);
          }
        }}
      />
    );
  }

  if (screen === 'profileBasics3') {
    return (
      <ProfileBasicsScreen3
        onBack={goBack}
        initialDetails={onboardingProfile ? { interests: onboardingProfile.interests, lifestyles: onboardingProfile.lifestyles, values: onboardingProfile.values, conversationStyles: onboardingProfile.conversationStyles } : undefined}
        onContinue={async (details) => {
          try {
          const saved = await saveProfileChemistry(details);
          setOnboardingProfile(saved);
          await completeProfile();
          navigateTo('userDashboard');
          } catch (error) { alertUnlessSessionExpired('Unable to complete your profile', error); }
        }}
      />
    );
  }

  if (screen === 'myProfile') {
    return <ChocolateProfileExperienceScreen key="my-profile" mode="mine" onBack={goBack} />;
  }

  if (screen === 'profileDetail') {
    return <ChocolateProfileExperienceScreen key={selectedProfileId ?? 'missing-profile'} mode="other" targetId={selectedProfileId ?? undefined} onBack={goBack} />;
  }

  if (screen === 'discover') {
    return (
      <View style={{ flex: 1, backgroundColor: '#160D08', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <RNText style={{ color: '#F4EBDD', fontFamily: 'Montserrat_600SemiBold', fontSize: 20, textAlign: 'center' }}>
          CHOCOLATE DISCOVER
        </RNText>
        <RNText style={{ color: '#D5B58C', fontFamily: 'Montserrat_400Regular', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
          Selected profile: {selectedProfileId ?? 'No profile selected'}
        </RNText>
        <Pressable onPress={goBack} style={{ marginTop: 24, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: '#D5B58C' }}>
          <RNText style={{ color: '#D5B58C', fontFamily: 'Montserrat_600SemiBold' }}>Go Back</RNText>
        </Pressable>
      </View>
    );
  }

  if (screen === 'userDashboard') {
    return (
      <ChocolateUserDashboardScreen
        onLogout={() => {
          void logout().finally(() => {
            screenHistory.current = [];
            setScreen('landing');
          });
        }}
        onOpenNearby={() => navigateTo('nearby')}
        onOpenProfile={() => navigateTo('myProfile')}
        onOpenOtherProfile={(profileId) => openDiscover(profileId)}
        onOpenLocationSearch={() => navigateTo('locationSearch')}
        onOpenPrivacyLock={() => navigateTo('privacyLock')}
        onOpenDashboardFilter={(filterType) => {
          setActiveDashboardFilter(filterType);
          navigateTo('dashboardFilter');
        }}
        activeDiscoveryMode={activeDiscoveryMode}
        activeSearchIntent={activeSearchIntent}
        initialDiscoveryProfiles={pendingDiscoveryProfiles}
        isVideoReviewer={isVideoReviewer}
        videoReviewPending={videoReviewPending}
        onOpenVideoVerification={() => navigateTo('videoVerificationStatus')}
        onOpenVideoReviews={() => navigateTo('videoReviews')}
      />
    );
  }

  if (screen === 'videoVerificationStatus') return (
    <ChocolateVideoVerificationStatusScreen
      onBack={goBack}
      onStatusChange={updateVideoReviewPending}
      onContinue={async () => {
        const [profile, { intents }, { mode }, verifications] = await Promise.all([
          getOnboardingProfile(), getDatingIntents(), getDiscoveryModes(), getVideoVerificationStatus(),
        ]);
        setOnboardingProfile(profile);
        const latestVerification = verifications[0];
        setVideoReviewPending(latestVerification?.status === 'PENDING' || latestVerification?.status === 'MANUAL_REVIEW');
        screenHistory.current = [];
        setActiveDiscoveryMode(mode === 'browse' ? 'Self Search / Browse' : mode === 'kismat' ? 'KISMAT' : 'Algorithmic Recommendations');
        setScreen(resolvePostLoginScreen({ emailVerified: emailInitiallyVerified, profile, intents, modes: mode ? [mode] : [], verifications }));
      }}
    />
  );
  if (screen === 'videoReviews') return <ChocolateVideoReviewScreen onBack={goBack} />;

  if (screen === 'dashboardFilter') {
    const selectedOption =
      activeDashboardFilter === 'discovery'
        ? activeDiscoveryMode
        : activeSearchIntent;

    return (
      <DashboardFilterScreen
        filterType={activeDashboardFilter}
        selectedOption={selectedOption}
        onBack={goBack}
        onSelect={(option) => { void (async () => {
          try {
            if (activeDashboardFilter === 'discovery') {
              const ids: Record<string, DiscoveryMode> = { 'Algorithmic Recommendations': 'algorithmic', 'Self Search / Browse': 'browse', KISMAT: 'kismat' };
              const id = ids[option]; if (!id) throw new Error('Unknown discovery mode.');
              await saveDiscoveryModes(id); setActiveDiscoveryMode(option);
            } else {
              const ids: Record<string, 'serious' | 'casual' | 'flirting' | 'exploring' | 'marriage'> = { 'Serious Relationship': 'serious', 'Casual Dating': 'casual', 'Fun & Flirting': 'flirting', 'Open to Exploring': 'exploring', Marriage: 'marriage' };
              const id = ids[option]; if (!id) throw new Error('Unknown search intent.');
              await saveDatingIntents([id]); setActiveSearchIntent(option);
            }
            goBack();
          } catch (error) { alertUnlessSessionExpired('Unable to save preference', error); }
        })(); }}
      />
    );
  }

  if (screen === 'nearby') {
    return <NearbyScreen onBack={goBack} onResults={setPendingDiscoveryProfiles} />;
  }

  if (screen === 'locationSearch') {
    return <LocationSearchScreen onBack={goBack} onResults={setPendingDiscoveryProfiles} />;
  }

  if (screen === 'privacyLock') {
    return (
      <PrivacyLockScreen
        onBack={goBack}
        settings={privacyLockSettings}
        onSettingsChange={setPrivacyLockSettings}
        onSaveSettings={async (settings, extra) => {
          await updateDiscoveryPrivacy({ ...settings, excludedArea: settings.excludedArea || null, ...extra });
          setPrivacyLockSettings(settings);
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ChocolateLandingScreen
        onCreateAccount={() => navigateTo('signup')}
        onLogin={() => navigateTo('login')}
        onGoogleSignIn={googleAuthConfigured ? () => { void startGoogleSignIn(); } : undefined}
        googleSignInUnavailable={!googleAuthConfigured}
        isLoginTransitioning={isModalVisible}
      />

      {isModalVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: modalOpacity,
          }}
        >
          <Pressable
            onPress={closeModal}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.40)',
            }}
          />

          <View style={{ flex: 1, justifyContent: 'center' }}>
            {screen === 'signup' ? (
              <ChocolateSignUpScreen
                onBackToLanding={closeModal}
                onGoogleSignIn={googleAuthConfigured ? () => { void startGoogleSignIn(); } : undefined}
                googleSignInUnavailable={!googleAuthConfigured}
                googleProfile={googleProfile}
                googleIdToken={pendingGoogleIdToken}
                onCompleteGoogleProfile={async (profile) => {
                  if (!pendingGoogleIdToken) {
                    Alert.alert('Google sign-in expired', 'Please restart Google sign-in.');
                    return;
                  }
                  try {
                    const result = await googleAuthApi(pendingGoogleIdToken, profile);
                    if ('requiresProfileCompletion' in result) throw new Error('Please complete all requested details.');
                    setPendingGoogleIdToken(null);
                    setGoogleProfile(null);
                    finishAuthenticatedOnboarding(result);
                  } catch (error) {
                    alertUnlessSessionExpired('Unable to finish account setup', error);
                  }
                }}
        onContinueToAgeVerification={async (input) => {
                  try {
                    const result = await signupApi(input);
                    setRegisteredEmail(result.user.email);
                    setEmailInitiallyVerified(result.user.emailVerified);
                    navigateTo('ageVerification');
                  } catch (error) {
                    alertUnlessSessionExpired('Unable to create account', error);
                  }
                }}
                onLogin={() => navigateTo('login')}
              />
            ) : screen === 'forgotPassword' ? (
              <ChocolatePasswordRecoveryFlow
                onBackToLogin={() => setScreen('login')}
                onComplete={() => {
                  setScreen('login');
                  Alert.alert('Password reset', 'Your password has been updated. You can now log in with your new password.');
                }}
              />
            ) : (
              <ChocolateLoginScreen
                onLogin={async (usernameOrEmail, password) => {
                  try {
                    const result = await loginApi(usernameOrEmail, password);
                    await routeAuthenticatedUser(result);
                  } catch (error) {
                    alertUnlessSessionExpired('Unable to load your account setup', error);
                  }
                }}
                onCreateAccount={() => navigateTo('signup')}
                onGoogleSignIn={googleAuthConfigured ? () => { void startGoogleSignIn(); } : undefined}
                googleSignInUnavailable={!googleAuthConfigured}
                onForgotPassword={() => navigateTo('forgotPassword')}
                onBack={closeModal}
              />
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
