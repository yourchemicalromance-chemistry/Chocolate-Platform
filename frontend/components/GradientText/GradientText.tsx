import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '../Text';

type GradientTextProps = {
  children: string;
  variant?: 'display' | 'heading1' | 'heading2' | 'heading3';
  align?: 'center' | 'flex-start' | 'flex-end';
};

export function GradientText({
  children,
  variant = 'display',
    align = 'center',
}: GradientTextProps) {
  return (
    <MaskedView
      style={[styles.container, { alignSelf: align }]}
      maskElement={
        <Text variant={variant} style={styles.mask}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={['#F8F4F0', '#F472B6', '#A78BFA']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        <Text variant={variant} style={styles.transparentText}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },

  mask: {
    backgroundColor: 'transparent',
    letterSpacing: 1,
  },

  gradient: {
    alignItems: 'center',
  },

  transparentText: {
    opacity: 0,
    letterSpacing: 1,
  },
});