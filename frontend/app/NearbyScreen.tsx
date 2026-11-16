
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type NearbyScreenProps = {
  onBack: () => void;
};

const RADIUS_OPTIONS = ['5 km', '10 km', '25 km', '50 km', '100 km'];

export function NearbyScreen({ onBack }: NearbyScreenProps) {
  const [selectedRadius, setSelectedRadius] = useState('25 km');

  const handleEnableDiscovery = () => {
    Alert.alert(
      'Nearby Discovery',
      `Your nearby discovery radius is set to ${selectedRadius}.\n\nGPS permission and live profile discovery will be connected in a later development step.`,
      [{ text: 'Got it' }],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D18" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
        </View>

        {/* Heading */}
        <View style={styles.headingContainer}>
          <Text style={styles.eyebrow}>YOUR WORLD, CLOSER</Text>

          <Text style={styles.title}>
            Discover{'\n'}
            <Text style={styles.titleAccent}>Nearby</Text>
          </Text>

          <Text style={styles.description}>
            Sometimes the best connections are closer than you think.
            Explore people around your location.
          </Text>
        </View>

        {/* Radar */}
        <View style={styles.radarContainer}>
          <View style={styles.radarOuter}>
            <View style={styles.radarMiddle}>
              <View style={styles.radarInner}>
                <View style={styles.radarCenter}>
                  <Text style={styles.radarHeart}>♥</Text>
                  <Text style={styles.radarCenterText}>YOU</Text>
                </View>
              </View>
            </View>

            <View style={[styles.radarDot, styles.dotOne]} />
            <View style={[styles.radarDot, styles.dotTwo]} />
            <View style={[styles.radarDot, styles.dotThree]} />
            <View style={[styles.radarDot, styles.dotFour]} />
          </View>

          <Text style={styles.radarCaption}>
            YOUR CONNECTION RADAR
          </Text>
        </View>

        {/* Location card */}
        <View style={styles.locationCard}>
          <View style={styles.locationIconContainer}>
            <Text style={styles.locationIcon}>⌖</Text>
          </View>

          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>YOUR LOCATION</Text>
            <Text style={styles.locationTitle}>Current location</Text>
            <Text style={styles.locationDescription}>
              Location access required to discover nearby profiles
            </Text>
          </View>

          <View style={styles.locationStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>OFF</Text>
          </View>
        </View>

        {/* Distance selection */}
        <View style={styles.radiusSection}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTitle}>Discovery radius</Text>
            <Text style={styles.selectedRadius}>{selectedRadius}</Text>
          </View>

          <Text style={styles.sectionDescription}>
            How far would you like to explore?
          </Text>

          <View style={styles.radiusOptions}>
            {RADIUS_OPTIONS.map((radius) => {
              const isSelected = selectedRadius === radius;

              return (
                <Pressable
                  key={radius}
                  onPress={() => setSelectedRadius(radius)}
                  style={[
                    styles.radiusOption,
                    isSelected && styles.radiusOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.radiusText,
                      isSelected && styles.radiusTextSelected,
                    ]}
                  >
                    {radius}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Privacy note */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyIcon}>✧</Text>
          <View style={styles.privacyTextContainer}>
            <Text style={styles.privacyTitle}>
              Your privacy matters
            </Text>
            <Text style={styles.privacyDescription}>
              Your exact location will never be displayed to other
              members. You stay in control of your discoverability.
            </Text>
          </View>
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleEnableDiscovery}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            Enable Nearby Discovery
          </Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>

        <Text style={styles.bottomNote}>
          CONNECTIONS BEGIN WITH A LITTLE CURIOSITY
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D18',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 38,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#F5EAF0',
    fontSize: 34,
    lineHeight: 38,
    marginTop: -5,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  brand: {
    color: '#F1DCE8',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
  },
  headerSubtitle: {
    color: '#A77B9A',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 4,
  },
  headerSpacer: {
    width: 42,
  },

  // Heading
  headingContainer: {
    marginBottom: 28,
  },
  eyebrow: {
    color: '#C17DAE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: '#F7F0F4',
    fontSize: 43,
    lineHeight: 48,
    fontWeight: '600',
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#D58AB8',
  },
  description: {
    color: '#A9A5B3',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
    maxWidth: 310,
  },

  // Radar
  radarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  radarOuter: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(192,121,175,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,83,139,0.035)',
  },
  radarMiddle: {
    width: 175,
    height: 175,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: 'rgba(192,121,175,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(192,121,175,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#412844',
    borderWidth: 1,
    borderColor: '#BD79AD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarHeart: {
    color: '#F0A6D0',
    fontSize: 25,
  },
  radarCenterText: {
    color: '#F5DDEA',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 1,
  },
  radarDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E7A1CF',
    shadowColor: '#E7A1CF',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  dotOne: {
    top: 38,
    right: 48,
  },
  dotTwo: {
    bottom: 48,
    right: 27,
    width: 7,
    height: 7,
  },
  dotThree: {
    bottom: 35,
    left: 53,
    width: 6,
    height: 6,
  },
  dotFour: {
    top: 70,
    left: 25,
    width: 7,
    height: 7,
  },
  radarCaption: {
    color: '#D9B5CE',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginTop: 18,
  },
  radarSubcaption: {
    color: '#777486',
    fontSize: 11,
    marginTop: 6,
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151A29',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 30,
  },
  locationIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(191,121,174,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  locationIcon: {
    color: '#D99BC7',
    fontSize: 27,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    color: '#A77B9A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  locationTitle: {
    color: '#F1EAF0',
    fontSize: 14,
    fontWeight: '600',
  },
  locationDescription: {
    color: '#898797',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D18C8C',
    marginRight: 5,
  },
  statusText: {
    color: '#D18C8C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Radius
  radiusSection: {
    marginBottom: 24,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#F2EAF0',
    fontSize: 17,
    fontWeight: '600',
  },
  selectedRadius: {
    color: '#D99BC7',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionDescription: {
    color: '#898797',
    fontSize: 12,
    marginTop: 7,
    marginBottom: 16,
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  radiusOption: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#151A29',
  },
  radiusOptionSelected: {
    backgroundColor: 'rgba(190,119,174,0.18)',
    borderColor: '#C681B3',
  },
  radiusText: {
    color: '#A9A5B3',
    fontSize: 12,
    fontWeight: '500',
  },
  radiusTextSelected: {
    color: '#F0C8E2',
    fontWeight: '700',
  },

  // Privacy
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(111,91,139,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(174,142,200,0.16)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
  },
  privacyIcon: {
    color: '#D6A9D2',
    fontSize: 22,
    marginRight: 12,
    marginTop: -2,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyTitle: {
    color: '#E4CDE0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  privacyDescription: {
    color: '#A8A0B2',
    fontSize: 11,
    lineHeight: 17,
  },

  // Button
  primaryButton: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: '#A75D96',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#A75D96',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  primaryButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryButtonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 12,
  },
  bottomNote: {
    color: '#686577',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 23,
  },
});
