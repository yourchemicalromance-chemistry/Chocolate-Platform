
import React, { useEffect, useState } from 'react';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { discoverNearbyProfiles, getNearbyPreference, type DiscoveryProfile } from '../../auth-api';
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
  onResults?: (profiles: DiscoveryProfile[]) => void;
};

const RADIUS_OPTIONS = ['5 km', '10 km', '25 km', '50 km', '100 km'];

export function NearbyScreen({ onBack, onResults }: NearbyScreenProps) {
  const [selectedRadius, setSelectedRadius] = useState('25 km');
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'off' | 'on'>('off');
  const [isLocating, setIsLocating] = useState(false);
  useEffect(() => {
    let active = true;
    void getNearbyPreference().then(saved => {
      if (active && saved && RADIUS_OPTIONS.includes(`${saved.radiusKm} km`)) setSelectedRadius(`${saved.radiusKm} km`);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const mapRegion = userCoordinates
    ? { ...userCoordinates, latitudeDelta: Number.parseInt(selectedRadius, 10) * 0.02, longitudeDelta: Number.parseInt(selectedRadius, 10) * 0.02 }
    : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 18, longitudeDelta: 18 };

  const handleEnableDiscovery = async () => {
    try {
      setIsLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Location permission needed',
          'Allow CHOCOLATE to access your location while using the app to show your nearby search area.',
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      const place = await Location.reverseGeocodeAsync(coordinates).catch(() => []);
      const areaLabel = place[0] ? [place[0].district, place[0].city, place[0].region].filter(Boolean).join(', ') : undefined;
      const profiles = await discoverNearbyProfiles({ ...coordinates, areaLabel, radiusKm: Number.parseInt(selectedRadius, 10) });
      onResults?.(profiles);
      setUserCoordinates(coordinates);
      setLocationStatus('on');
      Alert.alert('Nearby Discovery enabled', `Your map is centered on your current location with a ${selectedRadius} search radius.`);
    } catch {
      Alert.alert('Unable to get location', 'Please check that location services are enabled on your phone and try again.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <LinearGradient
      colors={['#2B1A12', '#21140E', '#160905']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#160905" />

      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
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

        {/* Live map with connection radar layered over it */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeadingRow}>
            <Text style={styles.mapSubheading}>{locationStatus === 'on' ? 'CURRENT LOCATION' : 'LOCATION PREVIEW'}</Text>
          </View>
          <View style={styles.mapFrame}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              showsUserLocation={locationStatus === 'on'}
              showsMyLocationButton={locationStatus === 'on'}
              toolbarEnabled={false}
              loadingEnabled
            >
              {userCoordinates && (
                <>
                  <Marker coordinate={userCoordinates} title="You are here" />
                  <Circle
                    center={userCoordinates}
                    radius={Number.parseInt(selectedRadius, 10) * 1000}
                    strokeColor="rgba(213,181,140,0.9)"
                    fillColor="rgba(213,181,140,0.16)"
                    strokeWidth={2}
                  />
                </>
              )}
            </MapView>

            <View pointerEvents="none" style={styles.radarOverlay}>
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
            </View>
          </View>
          <Text style={styles.mapFootnote}>
            {locationStatus === 'on' ? 'Your exact location is visible only to you on this map.' : 'Enable Nearby Discovery to center the map on your phone location.'}
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
              {locationStatus === 'on' ? 'Your current location is being used for nearby discovery' : 'Location access required to discover nearby profiles'}
            </Text>
          </View>

          <View style={styles.locationStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{locationStatus.toUpperCase()}</Text>
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
                  onPress={() => { setSelectedRadius(radius); if (userCoordinates) setLocationStatus('off'); }}
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
            {isLocating ? 'Finding your location…' : locationStatus === 'on' ? 'Refresh My Location' : 'Enable Nearby Discovery'}
          </Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>

        <Text style={styles.bottomNote}>
          CONNECTIONS BEGIN WITH A LITTLE CURIOSITY
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#160905',
  },
  screenScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    backgroundColor: '#2B1A12',
    borderWidth: 1,
    borderColor: 'rgba(213,181,140,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#FFF0DF',
    fontSize: 34,
    lineHeight: 38,
    marginTop: -5,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  brand: {
    color: '#FFF0DF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
  },
  headerSubtitle: {
    color: '#D5B58C',
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
    color: '#D5B58C',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: '#FFF0DF',
    fontSize: 36,
    lineHeight: 41,
    fontWeight: '600',
    letterSpacing: -1,
  },
  titleAccent: {
    color: '#F8DCC6',
  },
  description: {
    color: '#CDB9A7',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
    maxWidth: 310,
  },

  // Radar layered over the map
  mapFrame: {
    width: '100%',
    height: 280,
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  radarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 22,
  },
  radarOuter: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: 'rgba(213,181,140,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(43,26,18,0.35)',
  },
  radarMiddle: {
    width: 175,
    height: 175,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: 'rgba(213,181,140,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(213,181,140,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2B1A12',
    borderWidth: 1,
    borderColor: '#D5B58C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarHeart: {
    color: '#F8DCC6',
    fontSize: 25,
  },
  radarCenterText: {
    color: '#FFF0DF',
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
    backgroundColor: '#D5B58C',
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
    color: '#FFF0DF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginTop: 12,
    textShadowColor: 'rgba(22,9,5,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  radarSubcaption: {
    color: '#B99E88',
    fontSize: 11,
    marginTop: 6,
  },

  mapSection: {
    marginBottom: 24,
  },
  mapHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mapHeading: {
    color: '#FFF0DF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapSubheading: {
    color: '#D5B58C',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  map: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  mapFootnote: {
    color: '#B99E88',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 8,
  },

  // Location
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2B1A12',
    borderWidth: 1,
    borderColor: 'rgba(213,181,140,0.18)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 30,
  },
  locationIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(213,181,140,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  locationIcon: {
    color: '#D5B58C',
    fontSize: 27,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    color: '#D5B58C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 5,
  },
  locationTitle: {
    color: '#FFF0DF',
    fontSize: 14,
    fontWeight: '600',
  },
  locationDescription: {
    color: '#CDB9A7',
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
    backgroundColor: '#D5B58C',
    marginRight: 5,
  },
  statusText: {
    color: '#D5B58C',
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
    color: '#FFF0DF',
    fontSize: 17,
    fontWeight: '600',
  },
  selectedRadius: {
    color: '#D5B58C',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionDescription: {
    color: '#CDB9A7',
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
    borderColor: 'rgba(213,181,140,0.24)',
    backgroundColor: '#2B1A12',
  },
  radiusOptionSelected: {
    backgroundColor: 'rgba(248,220,198,0.12)',
    borderColor: '#D5B58C',
  },
  radiusText: {
    color: '#CDB9A7',
    fontSize: 12,
    fontWeight: '500',
  },
  radiusTextSelected: {
    color: '#FFF0DF',
    fontWeight: '700',
  },

  // Privacy
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(43,26,18,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(213,181,140,0.18)',
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
  },
  privacyIcon: {
    color: '#D5B58C',
    fontSize: 22,
    marginRight: 12,
    marginTop: -2,
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyTitle: {
    color: '#FFF0DF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  privacyDescription: {
    color: '#CDB9A7',
    fontSize: 11,
    lineHeight: 17,
  },

  // Button
  primaryButton: {
    minHeight: 56,
    borderRadius: 17,
    backgroundColor: '#4B2017',
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
    color: '#FFF0DF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryButtonArrow: {
    color: '#FFF0DF',
    fontSize: 20,
    marginLeft: 12,
  },
  bottomNote: {
    color: '#B99E88',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 23,
  },
});
