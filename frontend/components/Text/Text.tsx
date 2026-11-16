import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleProp,
  TextStyle,
} from 'react-native';

import { colors, typography } from '../../theme';

type TextVariant = keyof typeof typography;

type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Text({
  variant = 'body',
  color = colors.ivory,
  style,
  children,
  ...props
}: TextProps) {
  return (
    <RNText
      {...props}
      style={[
        typography[variant],
        { color },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}