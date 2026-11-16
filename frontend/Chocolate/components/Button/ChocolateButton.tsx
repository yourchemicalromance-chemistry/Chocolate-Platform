
import React from 'react';

import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'primary' | 'secondary';

type ChocolateButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
};

export function ChocolateButton({
  title,
  variant = 'primary',
  style,
  ...props
}: ChocolateButtonProps) {
  return (
    <Pressable
      {...props}
      style={(state: PressableStateCallbackType) => [
        styles.button,
        variant === 'primary'
          ? styles.primary
          : styles.secondary,
        props.disabled && styles.disabled,
        typeof style === 'function'
          ? style(state)
          : style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={['#E99548', '#A94C1D', '#3D1006']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        >
          <View style={styles.primaryContent}>
            <RNText style={[styles.label, styles.primaryLabel]}>
              {title}
            </RNText>

            <Ionicons
              name="arrow-forward"
              size={25}
              color="#FFFFFF"
            />
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.secondaryContent}>
          <RNText style={[styles.label, styles.secondaryLabel]}>
            {title}
          </RNText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    width: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  primary: {
  borderWidth: 1.5,
  borderColor: '#D58B4A',
},

  secondary: {
    backgroundColor: '#FCE5D3',
    borderWidth: 1.5,
    borderColor: '#85432A',
  },

  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
  },

  primaryLabel: {
    color: '#FFFFFF',
  },

  secondaryLabel: {
    color: '#542719',
  },

  disabled: {
    opacity: 0.45,
  },

  primaryContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
},
});
