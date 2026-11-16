import React from 'react';
import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleSheet,
  View,
} from 'react-native';

import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

import { LinearGradient } from 'expo-linear-gradient';


type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
};


export function Button({
  title,
  variant = 'primary',
  style,
  ...props
}: ButtonProps) {
  if (variant === 'secondary') {
    return (
      <LinearGradient
        colors={['#F472B6', '#C026D3', '#6D28D9']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.secondaryGradientBorder}
      >
        <Pressable
          {...props}
          style={(state: PressableStateCallbackType) => [
            styles.secondaryButton,
            typeof style === 'function'
              ? style(state)
              : style,
          ]}
        >
          <Text variant="label">
            {title}
          </Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <Pressable
      {...props}
      style={(state: PressableStateCallbackType) => [
        styles.button,
        typeof style === 'function'
          ? style(state)
          : style,
      ]}
    >


      <LinearGradient
        colors={
          props.disabled
            ? ['#514252', '#40334A', '#332A45']
            : ['#F472B6', '#C026D3', '#6D28D9']
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}

        style={[
    styles.gradient,
    props.disabled && { opacity: 0.4 },
]}
      >
        <Text
          variant="label"
          color={props.disabled ? 'rgba(248, 244, 240, 0.45)' : undefined}
        >
          {title}
        </Text>
      </LinearGradient>


    </Pressable>
  );
}


const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },



  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },


  secondaryGradientBorder: {
    width: '100%',
    height: 48,
    borderRadius: radii.pill,
    padding: 1,
  },

  secondaryButton: {
    flex: 1,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(16, 11, 22, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

});