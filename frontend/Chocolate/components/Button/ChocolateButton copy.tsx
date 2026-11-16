
import React from 'react';

import {
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleSheet,
  Text as RNText,
} from 'react-native';

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
      <RNText
        style={[
          styles.label,
          variant === 'primary'
            ? styles.primaryLabel
            : styles.secondaryLabel,
        ]}
      >
        {title}
      </RNText>
    </Pressable>
  );
}

const styles = StyleSheet.create({

  button: {
    height: 50,
    width: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primary: {
    backgroundColor: '#4A2418',
    borderWidth: 1.5,
    //borderColor: '#B97848',
},

  secondary: {
    backgroundColor: '#FFF4E5',
    borderWidth: 1.5,
    borderColor: '#B97848',
  },

  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 17,
  },

  primaryLabel: {
    color: '#FFFFFF',
  },

  secondaryLabel: {
    color: '#3B211B',
  },
  disabled: {
    opacity: 0.45,
  },

});
