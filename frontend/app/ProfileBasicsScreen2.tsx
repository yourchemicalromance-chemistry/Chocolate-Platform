
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ChemistryLogo } from '../components/ChemistryLogo';
import { GradientText } from '../components/GradientText';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { colors, radii, spacing } from '../theme';


const PINK = '#F472B6';
const PURPLE = '#C084FC';
const BLUE = '#93C5FD';
const COMPLETED_GREEN = '#86EFAC';

const MAX_PHOTOS = 5;
const MAX_BIO_LENGTH = 300;

const LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Urdu',
  'Other',
];

const PROMPTS = [
  'A little thing that makes me happy...',
  'My ideal weekend looks like...',
  "Something I'd love to share with someone...",
];

type ProfilePhoto = {
  id: string;
  uri: string;
};

export type ProfileStoryDetails = {
  photos: ProfilePhoto[];
  mainPhotoId: string | null;
  bio: string;
  selectedPrompt: string | null;
  languages: string[];
};

type ProfileBasicsScreen2Props = {
  onBack: () => void;
  onContinue: (details: ProfileStoryDetails) => void;
};

export function ProfileBasicsScreen2({
  onBack,
  onContinue,
}: ProfileBasicsScreen2Props) {
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [mainPhotoId, setMainPhotoId] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [languages, setLanguages] = useState<string[]>([
    'English',
    'Hindi',
  ]);
  const [languagesExpanded, setLanguagesExpanded] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);

  const mainPhoto = photos.find((photo) => photo.id === mainPhotoId);

  const handleAddPhoto = async () => {
    if (isPickingPhoto) return;

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        'Photo limit reached',
        'You can add up to five profile photos.',
      );
      return;
    }

    try {
      setIsPickingPhoto(true);

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo library access in your device settings to add profile photos.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const newPhoto: ProfilePhoto = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uri: asset.uri,
      };

      setPhotos((currentPhotos) => {
        if (currentPhotos.length >= MAX_PHOTOS) return currentPhotos;

        if (currentPhotos.length === 0) {
          setMainPhotoId(newPhoto.id);
        }

        return [...currentPhotos, newPhoto];
      });
    } catch {
      Alert.alert(
        'Unable to select photo',
        'Something went wrong while opening your photo library. Please try again.',
      );
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((currentPhotos) => {
      const remaining = currentPhotos.filter(
        (photo) => photo.id !== photoId,
      );

      if (mainPhotoId === photoId) {
        setMainPhotoId(remaining[0]?.id ?? null);
      }

      return remaining;
    });
  };

  const handleSetMainPhoto = (photoId: string) => {
    setMainPhotoId(photoId);
  };

  const toggleLanguage = (language: string) => {
    setLanguages((currentLanguages) => {
      if (currentLanguages.includes(language)) {
        return currentLanguages.filter((item) => item !== language);
      }

      return [...currentLanguages, language];
    });
  };

  const handleSelectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);

    setBio((currentBio) => {
      if (currentBio.trim().length > 0) return currentBio;
      return prompt;
    });
  };

  const handleContinue = () => {
    if (!bio.trim()) {
      Alert.alert(
        'Tell us about yourself',
        'Please write a short bio before continuing.',
      );
      return;
    }

    if (languages.length === 0) {
      Alert.alert(
        'Choose your languages',
        'Please select at least one language.',
      );
      return;
    }

    onContinue({
      photos,
      mainPhotoId,
      bio: bio.trim(),
      selectedPrompt,
      languages,
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/backgrounds/18-verify-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View pointerEvents="none" style={styles.backgroundOverlay} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Exact Page 1 branding: same logo, wordmark scale, and tagline */}
          <View style={styles.branding}>
            <View style={styles.logo}>
              <ChemistryLogo size={60} />
            </View>
            <View style={styles.brandTitle}>
              <GradientText variant="display">CHEMISTREE</GradientText>
            </View>
            <Text variant="bodyLarge" style={styles.tagline}>
              Where Connection Grows.
            </Text>
          </View>

          {/* Progress: same layout and styling as Page 1, with Step 1 completed */}
          <View style={styles.progressSection}>
            <View style={styles.progressLine} />

            <View style={styles.progressSteps}>
              <View style={styles.progressStep}>
                <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                  <Ionicons name="checkmark" size={17} color="#082817" />
                </View>
                <Text style={styles.stepLabel}>Basics</Text>
              </View>

              <View style={styles.progressStep}>
                <View style={[styles.stepCircle, styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, styles.stepNumberActive]}>
                    2
                  </Text>
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelActive]}>Story</Text>
              </View>

              <View style={styles.progressStep}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <Text style={styles.stepLabel}>Chemistry</Text>
              </View>
            </View>
          </View>

          {/* Page heading follows Page 1's serif + pink-accent treatment */}
          <View style={styles.intro}>
            <Text style={styles.pageHeading}>
              Share{' '}
              <Text style={styles.pageHeadingAccent}>Your Story</Text>
            </Text>
            <Text variant="body" style={styles.introDescription}>
              Add photos and a short bio to showcase your personality and
              give others a glimpse of who you are.
            </Text>
          </View>

          {/* PROFILE PHOTOS */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeading}>
              <View style={styles.photoSectionIcon}>
                <Ionicons
                  name="images"
                  size={20}
                  color={colors.moonlight.pink}
                />
              </View>
              <View style={styles.sectionHeadingText}>
                <Text variant="heading3" style={styles.sectionTitle}>
                  Profile Photos
                </Text>
                <Text variant="bodySmall" style={styles.sectionDescription}>
                  Add at least 1 photo. We recommend 3–5 photos.
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoCarouselContent}
              style={styles.photoCarousel}
              keyboardShouldPersistTaps="handled"
            >
              {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
                const photo = photos[index];
                const isMainPhoto = photo?.id === mainPhotoId;

                return (
                  <View
                    key={photo?.id ?? `empty-${index}`}
                    style={[styles.photoSlot, !photo && styles.emptyPhotoSlot]}
                  >
                    {photo ? (
                      <>
                        <Pressable
                          style={styles.photoPressable}
                          onPress={() => handleSetMainPhoto(photo.id)}
                          accessibilityRole="button"
                          accessibilityLabel={
                            isMainPhoto
                              ? 'Main photo selected'
                              : 'Set this as main photo'
                          }
                        >
                          <Image
                            source={{ uri: photo.uri }}
                            style={styles.photoImage}
                            resizeMode="cover"
                          />
                        </Pressable>

                        <Pressable
                          style={styles.removePhotoButton}
                          onPress={() => handleRemovePhoto(photo.id)}
                          accessibilityRole="button"
                          accessibilityLabel="Remove photo"
                          hitSlop={6}
                        >
                          <Ionicons
                            name="close"
                            size={17}
                            color={colors.ivory}
                          />
                        </Pressable>

                        {isMainPhoto ? (
                          <View style={styles.mainPhotoBadge}>
                            <Text variant="caption" style={styles.mainPhotoText}>
                              Main Photo
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => handleSetMainPhoto(photo.id)}
                            style={styles.makeMainBadge}
                          >
                            <Text variant="caption" style={styles.makeMainText}>
                              Make Main
                            </Text>
                          </Pressable>
                        )}
                      </>
                    ) : (
                      <Pressable
                        style={styles.addPhotoButton}
                        onPress={handleAddPhoto}
                        disabled={isPickingPhoto}
                        accessibilityRole="button"
                        accessibilityLabel="Add profile photo"
                      >
                        <View style={styles.addPhotoPlus}>
                          <Ionicons
                            name="add"
                            size={19}
                            color="#C7C7D1"
                          />
                        </View>
                        <Text variant="caption" style={styles.addPhotoText}>
                          {isPickingPhoto ? 'Opening...' : 'Add Photo'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            <Text variant="caption" style={styles.photoTip}>
              Tap a photo to make it your main photo.
            </Text>
          </View>

          {/* ABOUT ME */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionIconPurple}>
                <Ionicons
                  name="pencil"
                  size={20}
                  color={PURPLE}
                />
              </View>
              <View style={styles.sectionHeadingText}>
                <Text variant="heading3" style={styles.sectionTitle}>
                  About Me
                </Text>
                <Text variant="bodySmall" style={styles.sectionDescription}>
                  Write a short introduction about yourself.
                </Text>
              </View>
            </View>

            <TextInput
              value={bio}
              onChangeText={(value) =>
                setBio(value.slice(0, MAX_BIO_LENGTH))
              }
              placeholder="Tell people a bit about yourself, what you enjoy, and what makes you unique..."
              placeholderTextColor="#B7A0D7"
              multiline
              maxLength={MAX_BIO_LENGTH}
              textAlignVertical="top"
              style={styles.bioInput}
              accessibilityLabel="About me biography"
            />

            <View style={styles.bioMetaRow}>
              <View style={styles.bioMetaSpacer} />
              <Text variant="caption" style={styles.characterCount}>
                {bio.length}/{MAX_BIO_LENGTH}
              </Text>
            </View>
          </View>

          {/* LANGUAGES: expandable connected multi-select list */}
          <View style={styles.sectionCard}>
            <Pressable
              style={styles.sectionHeading}
              onPress={() => setLanguagesExpanded((expanded) => !expanded)}
              accessibilityRole="button"
              accessibilityState={{ expanded: languagesExpanded }}
              accessibilityLabel="Toggle language options"
            >
              <View style={styles.sectionIconPink}>
                <Ionicons
                  name="globe-outline"
                  size={25}
                  color={PINK}
                />
              </View>
              <View style={styles.sectionHeadingText}>
                <Text variant="heading3" style={styles.sectionTitle}>
                  Languages
                </Text>
                <Text variant="bodySmall" style={styles.sectionDescription}>
                  Select the languages you're comfortable with.
                </Text>
              </View>
              <Ionicons
                name={languagesExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={PINK}
              />
            </Pressable>

            {languagesExpanded ? (
              <View style={styles.connectedList}>
                {LANGUAGES.map((language, index) => {
                const selected = languages.includes(language);
                const isLast = index === LANGUAGES.length - 1;

                return (
                  <Pressable
                    key={language}
                    onPress={() => toggleLanguage(language)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    style={styles.connectedRow}
                  >
                    <View style={styles.connectorColumn}>
                      {!isLast ? <View style={styles.connectorLine} /> : null}
                      <View
                        style={[
                          styles.languageCheckboxOuter,
                          selected && styles.languageCheckboxOuterSelected,
                        ]}
                      >
                        {selected ? (
                          <Ionicons name="checkmark" size={10} color="#080714" />
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.connectedRowContent,
                        selected && styles.languageRowSelected,
                      ]}
                    >
                      <Text
                        variant="bodySmall"
                        style={[
                          styles.connectedLabel,
                          selected && styles.languageLabelSelected,
                        ]}
                      >
                        {language}
                      </Text>
                      {selected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={17}
                          color={PINK}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
                })}
              </View>
            ) : null}
          </View>

          {/* CONTINUE — always visible, enabled only when required details are complete */}
          <View style={styles.navigationRow}>
            <View style={styles.navigationButton}>
              <Button
                title="Continue"
                variant="primary"
                disabled={bio.trim().length === 0 || languages.length === 0}
                onPress={handleContinue}
              />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  background: {
    flex: 1,
    width: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 5, 18, 0.68)',
    zIndex: 1,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
    elevation: 2,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 17,
    paddingBottom: 28,
  },
  branding: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {},
  brandTitle: {
    marginTop: -14,
    transform: [{ scale: 0.6 }],
  },
  tagline: {
    color: '#C7CBD9',
    fontSize: 12,
    letterSpacing: 0.5,
    marginTop: -12,
  },
  progressSection: {
    position: 'relative',
    marginBottom: 24,
  },
  progressLine: {
    position: 'absolute',
    top: 17,
    left: '16%',
    right: '16%',
    height: 1,
    backgroundColor: 'rgba(199,203,217,0.45)',
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    width: '33.33%',
    alignItems: 'center',
  },
  stepCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.48)',
    backgroundColor: 'rgba(7,7,25,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleCompleted: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  stepCircleActive: {
    borderColor: PINK,
    backgroundColor: PINK,
  },
  stepNumber: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 12,
    color: '#C7CBD9',
  },
  stepNumberActive: {
    color: '#170B24',
  },
  stepLabel: {
    marginTop: 6,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
    color: '#B9BDCD',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: PINK,
  },
  stepLabelCompleted: {
    color: COMPLETED_GREEN,
  },

  intro: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  // Copied from ProfileBasicsScreen.tsx — keep heading typography consistent.
  pageHeading: {
    color: '#F8F4F0',
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontWeight: '600',
  },
  pageHeadingAccent: {
    color: '#F472B6',
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontWeight: '600',
  },
  // Page 1's centered intro-description style.
  introDescription: {
    color: '#C7CBD9',
    fontSize: 12,
    lineHeight: 19,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 330,
  },
  sectionCard: {
    width: '100%',
    padding: 14,
    marginBottom: 14,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.30)',
    backgroundColor: 'rgba(8,7,20,0.77)',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 13,
  },
  photoSectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.4,
    borderColor: colors.moonlight.pink,
    backgroundColor: 'rgba(190, 24, 93, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconPurple: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.44)',
    backgroundColor: 'rgba(192,132,252,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconPink: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(244,114,182,0.44)',
    backgroundColor: 'rgba(244,114,182,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeadingText: {
    flex: 1,
    gap: 3,
  },
  // Category title typography copied from Page 1's cardTitle.
  sectionTitle: {
    color: '#F8F4F0',
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  // Category description typography copied from Page 1's cardDescription.
  sectionDescription: {
    color: '#C7CBD9',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  photoCarousel: {
    marginHorizontal: -2,
  },
  photoCarouselContent: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  photoSlot: {
    width: 86,
    aspectRatio: 0.72,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(150, 149, 164, 0.62)',
    backgroundColor: 'rgba(4, 3, 18, 0.84)',
    position: 'relative',
  },
  emptyPhotoSlot: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  photoPressable: {
    flex: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 23,
    height: 23,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(16, 11, 22, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(248, 244, 240, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPhotoBadge: {
    position: 'absolute',
    bottom: 5,
    left: 4,
    right: 4,
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(10, 7, 24, 0.92)',
    borderWidth: 1,
    borderColor: colors.moonlight.pink,
    alignItems: 'center',
  },
  mainPhotoText: {
    color: colors.ivory,
    fontSize: 8,
    lineHeight: 11,
  },
  makeMainBadge: {
    position: 'absolute',
    bottom: 5,
    left: 4,
    right: 4,
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(10, 7, 24, 0.92)',
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  makeMainText: {
    color: '#C7C7D1',
    fontSize: 7,
    lineHeight: 10,
  },
  addPhotoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: 'rgba(199, 203, 217, 0.55)',
    backgroundColor: 'rgba(4, 3, 18, 0.84)',
    borderRadius: 15,
  },
  addPhotoPlus: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    borderWidth: 1.6,
    borderColor: '#C7C7D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    color: '#C7C7D1',
    fontSize: 9,
    textAlign: 'center',
  },
  photoTip: {
    color: 'rgba(199, 203, 217, 0.72)',
    fontSize: 11,
    marginTop: 11,
    textAlign: 'center',
  },
  bioInput: {
    minHeight: 100,
    maxHeight: 180,
    borderWidth: 1.2,
    borderColor: 'rgba(199, 203, 217, 0.30)',
    borderStyle: 'solid',
    borderRadius: 20,
    backgroundColor: 'rgba(8,7,20,0.77)',
    paddingHorizontal: 17,
    paddingVertical: 16,
    color: colors.ivory,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    lineHeight: 22,
  },
  bioMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 9,
    marginBottom: 10,
  },
  bioHelper: {
    flex: 1,
    color: '#D0C9DE',
    fontSize: 11,
  },
  bioMetaSpacer: {
    flex: 1,
  },
  characterCount: {
    color: '#D0C9DE',
    fontSize: 11,
  },
  promptsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 7,
  },
  promptChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    borderWidth: 1.2,
    borderColor: 'rgba(236, 72, 153, 0.78)',
    backgroundColor: 'rgba(190, 24, 93, 0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptChipSelected: {
    backgroundColor: 'rgba(244, 114, 182, 0.22)',
    borderColor: colors.moonlight.pink,
  },
  promptText: {
    color: colors.moonlight.pink,
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },
  promptTextSelected: {
    color: colors.ivory,
  },
  /* Connected language options — matched to Page 1 option lists */
  connectedList: {
    paddingLeft: 2,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 44,
  },
  connectorColumn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: 'rgba(192,132,252,0.42)',
  },
  languageCheckboxOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(192,132,252,0.72)',
    backgroundColor: '#080714',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  languageCheckboxOuterSelected: {
    borderColor: PINK,
    backgroundColor: PINK,
  },
  connectedRowContent: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(167,139,250,0.25)',
  },
  connectedLabel: {
    flex: 1,
    color: '#D5C6F1',
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  languageRowSelected: {
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(244,114,182,0.58)',
    backgroundColor: 'rgba(244,114,182,0.09)',
    paddingHorizontal: 12,
  },
  languageLabelSelected: {
    color: PINK,
  },
  navigationRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  navigationButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: 14,
  },
});
