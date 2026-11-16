import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type ChocolateLogoProps = {
  size?: number;
};

export function ChocolateLogo({
  size = 220,
}: ChocolateLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/branding/ChocolateDating-Connections-Logo00.png')}
        style={{
          width: size,
          height: size,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});