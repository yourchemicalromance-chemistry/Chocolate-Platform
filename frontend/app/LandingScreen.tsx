
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { colors, spacing } from '../theme';

import { ChemistryLogo } from '../components/ChemistryLogo';

import { MoonlightBackground } from '../components/MoonlightBackground';

import { LandingFeatures } from '../components/LandingFeatures';

import { GradientText } from '../components/GradientText';

import { VideoView, useVideoPlayer } from 'expo-video';


import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
} from 'react-native';


type LandingScreenProps = {
  onCreateAccount: () => void;
  onLogin: () => void;
  isLoginTransitioning?: boolean;
};




export function LandingScreen({
  onCreateAccount,
  onLogin,
  isLoginTransitioning = false,
}: LandingScreenProps) {
  const brandingTranslateY = useRef(new Animated.Value(0)).current;
  const landingButtonsOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(brandingTranslateY, {
        toValue: isLoginTransitioning ? -100 : 0,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(landingButtonsOpacity, {
        toValue: isLoginTransitioning ? 0 : 1,
        duration: isLoginTransitioning ? 350 : 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isLoginTransitioning, brandingTranslateY, landingButtonsOpacity]);


  const player = useVideoPlayer(
    require('../assets/backgrounds/LandingPageBG.mp4'),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );


  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      <View style={styles.content}>


        <Animated.View
          style={[
            styles.branding,
            { transform: [{ translateY: brandingTranslateY }] },
          ]}
        >
          <View style={styles.logo}>
            <ChemistryLogo size={130} />
          </View>

          <View style={styles.title}>
            <GradientText variant="display">
              CHEMISTREE
            </GradientText>
          </View>

          <Text variant="bodyLarge" style={styles.tagline}>
            Where Connection Grows.
          </Text>
        </Animated.View>

        <View style={styles.features}>
          <LandingFeatures />
        </View>
        <Animated.View
          style={[styles.actions, { opacity: landingButtonsOpacity }]}
          pointerEvents={isLoginTransitioning ? 'none' : 'auto'}
        >
          <Button
            title="Create Account"
            onPress={onCreateAccount}
          />

          <Button
            title="Log In"
            variant="secondary"
            onPress={onLogin}
          />
        </Animated.View>
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnight,
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.md,
    alignItems: 'center',
    transform: [{ translateY: 85 }],
  },

  tagline: {
    marginTop: 1,
  },

  actions: {
    width: '95%',
    marginTop: spacing.xl,
    gap: spacing.md,
  },

  title: {
    marginTop: spacing.xl,
  },

  features: {
    marginTop: spacing.lg,
    width: '100%',
  },

  logo: {
    transform: [{ translateY: 50 }],
  },

  branding: {
    alignItems: 'center',
  },

});