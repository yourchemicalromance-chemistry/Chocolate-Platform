
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
              <Stop offset="0" stopColor="#F472B6" />
              <Stop offset="1" stopColor="#8B5CF6" />
            </LinearGradient>

            <LinearGradient id="buttonFill" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F472B6" />
              <Stop offset="0.52" stopColor="#D52BE8" />
              <Stop offset="1" stopColor="#7028E4" />
            </LinearGradient>
          </Defs>

          {/* Soft outer halo */}
          <Circle cx="62" cy="62" r="59" fill="#F472B6" opacity={0.12} />

          {/* Gradient outline ring */}
          <Circle
            cx="62"
            cy="62"
            r="51"
            fill="none"
            stroke="url(#outerRing)"
            strokeWidth="2.5"
          />

          {/* Inner ring */}
          <Circle
            cx="62"
            cy="62"
            r="44"
            fill="#FCE7F3"
            opacity={0.95}
          />

          {/* Main button */}
          <Circle
            cx="62"
            cy="62"
            r="37"
            fill={isRecording ? '#E11D48' : 'url(#buttonFill)'}
          />

          {isRecording ? (
            /* Stop icon */
            <Path
              d="M52 52 H72 V72 H52 Z"
              fill="#FFFFFF"
              stroke="#FFFFFF"
              strokeLinejoin="round"
            />
          ) : (
            /* Microphone icon */
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
              fill="#FFFFFF"
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
