import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type LocationSearchScreenProps = {
  onBack: () => void;
};

const RADIUS_OPTIONS = ['5 km', '10 km', '25 km', '50 km', '100 km'];

export function LocationSearchScreen({ onBack }: LocationSearchScreenProps) {
  const [location, setLocation] = useState('Chennai, India');
  const [selectedRadius, setSelectedRadius] = useState('50 km');
  const [previewReady, setPreviewReady] = useState(false);

  const handlePreview = () => {
    if (!location.trim()) {
      Alert.alert('Enter a location', 'Type a city or country to continue.');
      return;
    }
    setPreviewReady(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2B1A12', '#21140E', '#160905']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <StatusBar barStyle="light-content" backgroundColor="#160905" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headingContainer}>
          <Text style={styles.eyebrow}>YOUR WORLD, YOUR CHOICE</Text>
          <Text style={styles.title}>
            Explore people{' '}
            <Text style={styles.titleAccent}>anywhere</Text>
          </Text>
          
        </View>

        {!previewReady ? (
          <>
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>CITY OR COUNTRY</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="search-outline" size={20} color="#CDB9A7" />
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Chennai, India or Singapore"
                  placeholderTextColor="rgba(205,185,167,0.55)"
                  autoCapitalize="words"
                  returnKeyType="done"
                  style={styles.input}
                  accessibilityLabel="Search city or country"
                />
                {location.length > 0 && (
                  <Pressable
                    accessibilityLabel="Clear location"
                    onPress={() => setLocation('')}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color="#B99E88" />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.radiusSection}>
              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionTitle}>Search area</Text>
                <Text style={styles.selectedRadius}>{selectedRadius}</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Set how far from your chosen location to explore.
              </Text>
              <View style={styles.radiusOptions}>
                {RADIUS_OPTIONS.map((radius) => {
                  const selected = selectedRadius === radius;
                  return (
                    <Pressable
                      key={radius}
                      onPress={() => setSelectedRadius(radius)}
                      style={[
                        styles.radiusOption,
                        selected && styles.radiusOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.radiusText,
                          selected && styles.radiusTextSelected,
                        ]}
                      >
                        {radius}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="compass-outline" size={21} color="#D6A9D2" />
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>Explore beyond your location</Text>
                <Text style={styles.infoDescription}>
                  Location Search is separate from Nearby Discovery. It lets
                  you choose a destination manually.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handlePreview}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Preview search</Text>
              <Ionicons name="arrow-forward" size={19} color="#FFF0DF" />
            </Pressable>
          </>
        ) : (
          <View style={styles.previewCard}>
            <View style={styles.previewIcon}>
              <Ionicons name="map-outline" size={31} color="#D5B58C" />
            </View>
            <Text style={styles.previewEyebrow}>SEARCH READY</Text>
            <Text style={styles.previewTitle}>{location.trim()}</Text>
            <Text style={styles.previewRadius}>Within {selectedRadius}</Text>
            <Text style={styles.previewDescription}>
              Your location-search preferences are ready. Real profile results
              will appear here after the discovery feed is connected.
            </Text>
            <Pressable
              onPress={() => setPreviewReady(false)}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Edit search</Text>
              <Ionicons name="create-outline" size={18} color="#FFF0DF" />
            </Pressable>
            <Text style={styles.previewNote}>
              FRONTEND PREVIEW ONLY · NO LIVE PROFILES FETCHED
            </Text>
          </View>
        )}

        <Text style={styles.bottomNote}>
          CONNECTIONS BEGIN WITH A LITTLE CURIOSITY
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#160905' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 34,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTextContainer: { alignItems: 'center' },
  brand: { color: '#F1DCE8', fontSize: 15, fontWeight: '800', letterSpacing: 3 },
  headerSubtitle: {
    color: '#A77B9A', fontSize: 9, fontWeight: '600',
    letterSpacing: 2, marginTop: 4,
  },
  headerSpacer: { width: 42 },
  headingContainer: { marginBottom: 22 },
  eyebrow: {
    color: '#D5B58C', fontSize: 10, fontWeight: '700',
    letterSpacing: 3, marginBottom: 12,
  },
  title: {
    color: '#FFF0DF', fontSize: 34, lineHeight: 42,
    fontWeight: '700', letterSpacing: -0.7,
  },
  titleAccent: { color: '#F8DCC6' },
  description: {
    color: '#CDB9A7', fontSize: 13, lineHeight: 21,
    marginTop: 12, maxWidth: 330,
  },
  formSection: { gap: 10, marginBottom: 24 },
  fieldLabel: {
    color: '#FFF0DF', fontSize: 12, fontWeight: '700', letterSpacing: 0.5,
  },
  inputWrap: {
    minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 15, borderRadius: 15,
    borderWidth: 1, borderColor: 'rgba(213,181,140,0.24)',
    backgroundColor: '#2B1A12',
  },
  input: { flex: 1, color: '#FFF0DF', fontSize: 14, paddingVertical: 12 },
  radiusSection: { marginBottom: 23 },
  sectionHeadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  sectionTitle: { color: '#FFF0DF', fontSize: 17, fontWeight: '600' },
  selectedRadius: { color: '#D5B58C', fontSize: 12, fontWeight: '700' },
  sectionDescription: {
    color: '#B99E88', fontSize: 12, lineHeight: 18,
    marginTop: 7, marginBottom: 15,
  },
  radiusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  radiusOption: {
    minHeight: 40, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(213,181,140,0.24)', backgroundColor: '#2B1A12',
    alignItems: 'center', justifyContent: 'center',
  },
  radiusOptionSelected: { backgroundColor: '#D5B58C', borderColor: '#D5B58C' },
  radiusText: { color: '#E8E3EA', fontSize: 12, fontWeight: '500' },
  radiusTextSelected: { color: '#160905', fontWeight: '700' },
  infoCard: {
    flexDirection: 'row', gap: 12, padding: 15, marginBottom: 22,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(213,181,140,0.18)',
    backgroundColor: 'rgba(43,26,18,0.75)',
  },
  infoCopy: { flex: 1, gap: 5 },
  infoTitle: { color: '#FFF0DF', fontSize: 12, fontWeight: '700' },
  infoDescription: { color: '#CDB9A7', fontSize: 11, lineHeight: 17 },
  primaryButton: {
    minHeight: 54, borderRadius: 18, backgroundColor: '#4B2017',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 20,
    shadowColor: '#4B2017', shadowOpacity: 0.24, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }, elevation: 5,
  },
  primaryButtonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  primaryButtonText: {
    color: '#FFF0DF', fontSize: 13, fontWeight: '700', letterSpacing: 0.3,
  },
  previewCard: {
    alignItems: 'center', padding: 22, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(213,181,140,0.24)',
    backgroundColor: 'rgba(43,26,18,0.92)', gap: 11,
  },
  previewIcon: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(213,181,140,0.12)',
    borderWidth: 1, borderColor: 'rgba(213,181,140,0.40)',
  },
  previewEyebrow: {
    color: '#D5B58C', fontSize: 9, fontWeight: '800', letterSpacing: 2,
  },
  previewTitle: {
    color: '#FFF0DF', fontSize: 20, fontWeight: '700', textAlign: 'center',
  },
  previewRadius: { color: '#D5B58C', fontSize: 13, fontWeight: '700' },
  previewDescription: {
    color: '#CDB9A7', fontSize: 12, lineHeight: 19,
    textAlign: 'center', marginBottom: 8,
  },
  previewNote: {
    color: '#B99E88', fontSize: 8, letterSpacing: 1.2,
    textAlign: 'center', marginTop: 8,
  },
  bottomNote: {
    color: '#B99E88', fontSize: 8, fontWeight: '600',
    letterSpacing: 1.7, textAlign: 'center', marginTop: 23,
  },
});
