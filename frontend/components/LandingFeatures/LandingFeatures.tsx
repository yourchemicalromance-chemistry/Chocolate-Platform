import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { Text } from '../Text';

type Feature = {
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
};

const features: Feature[] = [
  {
    image: require('../../assets/branding/meet-badge.png'),
    title: 'Meet',
    subtitle: 'Real People',
  },
  {
    image: require('../../assets/branding/make-badge.png'),
    title: 'Make',
    subtitle: 'Real Connections',
  },
  {
    image: require('../../assets/branding/see-where-badge.png'),
    title: 'See Where',
    subtitle: 'It Leads',
  },
];

export function LandingFeatures() {
  return (
    <View style={styles.container}>
      {features.map((feature, index) => (
        <React.Fragment key={feature.title}>
          <View style={styles.feature}>
            <Image
              source={feature.image}
              style={styles.badge}
              resizeMode="contain"
            />

            <Text variant="body" style={styles.title}>
              {feature.title}
            </Text>

            <Text variant="body" style={styles.subtitle}>
              {feature.subtitle}
            </Text>
          </View>

          {index < features.length - 1 && (
            <View style={styles.separator} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  feature: {
    flex: 1,
    alignItems: 'center',
  },

  badge: {
    width: 52,
    height: 52,
    marginBottom: spacing.xs,
  },

  title: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },

  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    lineHeight: 17,
    color: colors.ivory,
    textAlign: 'center',
    marginTop: 1,
  },

  separator: {
    width: 1,
    height: 52,
    backgroundColor: 'rgba(248, 244, 240, 0.20)',
  },
});