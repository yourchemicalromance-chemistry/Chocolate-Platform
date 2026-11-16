import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Path,
} from 'react-native-svg';

type RecordingButtonProps = {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function RecordingButton({
  isRecording,
  onPress,
  disabled = false,
}: RecordingButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        isRecording ? 'Stop recording' : 'Start recording'
      }
      style={styles.touchTarget}
    >
      <View style={styles.visual}>
        <Svg width={124} height={124} viewBox="0 0 124 124">
          <Defs>
            <LinearGradient id="outerRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F1D4A9" />
              <Stop offset="1" stopColor="#8C4D2C" />
            </LinearGradient>

            <LinearGradient id="buttonFill" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#D9A879" />
              <Stop offset="0.52" stopColor="#B97843" />
              <Stop offset="1" stopColor="#8C4D2C" />
            </LinearGradient>

            <LinearGradient id="stopFill" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#6A3926" />
              <Stop offset="1" stopColor="#321A12" />
            </LinearGradient>
          </Defs>

          {/* Soft champagne halo */}
          <Circle
            cx="62"
            cy="62"
            r="59"
            fill="#D9A879"
            opacity={0.16}
          />

          {/* Champagne-to-chocolate outline ring */}
          <Circle
            cx="62"
            cy="62"
            r="51"
            fill="none"
            stroke="url(#outerRing)"
            strokeWidth="2.5"
          />

          {/* Warm ivory inner ring */}
          <Circle
            cx="62"
            cy="62"
            r="44"
            fill="#F4EBDD"
            opacity={0.98}
          />

          {/* Main button: champagne when ready, deep chocolate when recording */}
          <Circle
            cx="62"
            cy="62"
            r="37"
            fill={isRecording ? 'url(#stopFill)' : 'url(#buttonFill)'}
          />

          {isRecording ? (
            <Path
              d="M52 52 H72 V72 H52 Z"
              fill="#FFF4E5"
              stroke="#FFF4E5"
              strokeLinejoin="round"
            />
          ) : (
            <Path
              d="M62 43
                 C58.7 43 56 45.7 56 49 V62
                 C56 65.3 58.7 68 62 68
                 C65.3 68 68 65.3 68 62 V49
                 C68 45.7 65.3 43 62 43 Z
                 M49 59 V62
                 C49 69.2 54.1 74.3 60 75 V81 H64 V75
                 C69.9 74.3 75 69.2 75 62 V59 H71 V62
                 C71 67.1 67.1 71 62 71
                 C56.9 71 53 67.1 53 62 V59 Z"
              fill="#FFF8F0"
            />
          )}
        </Svg>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    alignSelf: 'center',
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visual: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
