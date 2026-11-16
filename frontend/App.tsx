
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Platform,
  Pressable,
  Text as RNText,
  View,
} from 'react-native';

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
import { LocationSearchScreen } from './Chocolate/app/LocationSearchScreen';
import { NearbyScreen } from './Chocolate/app/NearbyScreen';


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
  type DiscoveryMode,
} from './Chocolate/app/ChocolateDiscoveryModeScreen';

//import { UserDashboardScreen } from './app/UserDashboardScreen';
//import { UserDashboardScreen as ChemistryUserDashboardScreen } from './app/UserDashboardScreen';
import { UserDashboardScreen as ChocolateUserDashboardScreen } from './Chocolate/app/ChocolateUserDashboardScreen';
import { restoreLanguage } from './Chocolate/localization';

import { ProfileBasicsScreen } from './Chocolate/app/ChocolateProfileBasicsScreen';
import { ProfileBasicsScreen2 } from './Chocolate/app/ChocolateProfileBasicsScreen2';
import { ProfileBasicsScreen3 } from './Chocolate/app/ChocolateProfileBasicsScreen3';

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
  | 'userDashboard'
  | 'discover'
  | 'nearby'
  | 'locationSearch'
  | 'privacyLock'
  | 'dashboardFilter';

export default function App() {
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
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const modalOpacity = useRef(new Animated.Value(0)).current;
  const screenHistory = useRef<Screen[]>([]);

  useEffect(() => {
    restoreLanguage();
  }, []);

  const navigateTo = useCallback((nextScreen: Screen) => {
    if (screen !== nextScreen) {
      screenHistory.current.push(screen);
    }

    setScreen(nextScreen);
  }, [screen]);

  const openDiscover = useCallback((profileId?: string) => {
    setSelectedProfileId(profileId ?? null);
    navigateTo('discover');
  }, [navigateTo]);

  const goBack = useCallback(() => {
    const previousScreen = screenHistory.current.pop();

    if (previousScreen) {
      setScreen(previousScreen);
      return true;
    }

    return false;
  }, []);

  const [selectedDiscoveryModes, setSelectedDiscoveryModes] =
    useState<DiscoveryMode[]>(['algorithmic']);

  const [activeDiscoveryMode, setActiveDiscoveryMode] =
    useState('Algorithmic Match');

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

  const isModalVisible = screen === 'signup' || screen === 'login';

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

  if (screen === 'ageVerification') {
    return (
        <ChocolateAgeVerificationScreen
            onBack={goBack}
            onContinueToLogin={() => navigateTo('intentSelection')}
        />
    );
}

  if (screen === 'intentSelection') {
    return (
      <IntentSelectionScreen
        onBack={goBack}
        onContinue={(selectedIntents) => {
          console.log('Selected dating intentions:', selectedIntents);
          navigateTo('discoveryMode');
        }}
      />
    );
  }

  if (screen === 'discoveryMode') {
    return (
      <DiscoveryModeScreen
        onContinue={(modes) => {
          setSelectedDiscoveryModes(modes);
          console.log('Selected discovery modes:', modes);
          navigateTo('profileBasics');
        }}
      />
    );
  }

  if (screen === 'profileBasics') {
    return (
      <ProfileBasicsScreen
        onBack={goBack}
        onContinue={(details) => {
          console.log('Profile basics:', details);
          navigateTo('profileBasics2');
        }}
      />
    );
  }

  if (screen === 'profileBasics2') {
    return (
      <ProfileBasicsScreen2
        onBack={goBack}
        onContinue={(details) => {
          console.log('Profile story:', details);
          navigateTo('profileBasics3');
        }}
      />
    );
  }

  if (screen === 'profileBasics3') {
    return (
      <ProfileBasicsScreen3
        onBack={goBack}
        onContinue={(details) => {
          console.log('Profile chemistry:', details);
          console.log('Profile creation completed.');
          navigateTo('userDashboard');
        }}
      />
    );
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
          screenHistory.current = [];
          setScreen('landing');
        }}
        onOpenNearby={() => navigateTo('nearby')}
        onOpenLocationSearch={() => navigateTo('locationSearch')}
        onOpenPrivacyLock={() => navigateTo('privacyLock')}
        onOpenDashboardFilter={(filterType) => {
          setActiveDashboardFilter(filterType);
          navigateTo('dashboardFilter');
        }}
        activeDiscoveryMode={activeDiscoveryMode}
        activeSearchIntent={activeSearchIntent}
      />
    );
  }

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
        onSelect={(option) => {
          if (activeDashboardFilter === 'discovery') {
            setActiveDiscoveryMode(option);
          } else {
            setActiveSearchIntent(option);
          }

          goBack();
        }}
      />
    );
  }

  if (screen === 'nearby') {
    return <NearbyScreen onBack={goBack} />;
  }

  if (screen === 'locationSearch') {
    return <LocationSearchScreen onBack={goBack} />;
  }

  if (screen === 'privacyLock') {
    return (
      <PrivacyLockScreen
        onBack={goBack}
        settings={privacyLockSettings}
        onSettingsChange={setPrivacyLockSettings}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ChocolateLandingScreen
        onCreateAccount={() => navigateTo('signup')}
        onLogin={() => navigateTo('login')}
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
                onContinueToAgeVerification={() =>
                  navigateTo('ageVerification')
                }
                onLogin={() => navigateTo('login')}
              />
            ) : (
              <ChocolateLoginScreen
                onLogin={(usernameOrEmail, password) => {
                  console.log(
                    'Prototype login submitted:',
                    usernameOrEmail,
                  );

                  screenHistory.current = [];
                  setScreen('userDashboard');
                }}
                onCreateAccount={() => navigateTo('signup')}
                onBack={closeModal}
              />
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
