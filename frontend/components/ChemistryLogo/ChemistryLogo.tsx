import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type ChemistryLogoProps = {
  size?: number;
};

export function ChemistryLogo({
  size = 220,
}: ChemistryLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/branding/chemistry-atom-heart.png')}
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