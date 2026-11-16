
import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../components/Button';
import { ChemistryLogo } from '../components/ChemistryLogo';
import { GradientText } from '../components/GradientText';
import { Text } from '../components/Text';

type GenderIdentity =
  | 'Woman'
  | 'Man'
  | 'Non-binary'
  | 'Genderqueer'
  | 'Another identity';

type WhoToMeet =
  | 'Women'
  | 'Men'
  | 'Non-binary People'
  | 'Everyone'
  | 'Prefer not to say';

export type ProfileBasics = {
  displayName: string;
  genderIdentity: GenderIdentity | null;
  interestedIn: WhoToMeet[];
};

type ProfileBasicsScreenProps = {
  onBack: () => void;
  onContinue: (details: ProfileBasics) => void;
};

const GENDER_OPTIONS: GenderIdentity[] = [
  'Woman',
  'Man',
  'Non-binary',
  'Genderqueer',
  'Another identity',
];

const MEET_OPTIONS: WhoToMeet[] = [
  'Women',
  'Men',
  'Non-binary People',
  'Everyone',
  'Prefer not to say',
];

const PINK = '#F472B6';
const PURPLE = '#C084FC';
const BLUE = '#93C5FD';



export function ProfileBasicsScreen({
  onContinue,
}: ProfileBasicsScreenProps) {
  const [displayName, setDisplayName] = useState('');
  const [genderIdentity, setGenderIdentity] =
    useState<GenderIdentity | null>(null);
  const [interestedIn, setInterestedIn] = useState<WhoToMeet[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [genderExpanded, setGenderExpanded] = useState(false);
  const [meetExpanded, setMeetExpanded] = useState(false);

  const nameIsValid = displayName.trim().length > 0;
  const meetIsValid = interestedIn.length > 0;
  const canContinue = nameIsValid && meetIsValid;

  const toggleMeetOption = (option: WhoToMeet) => {
    setInterestedIn((current) => {
      if (option === 'Everyone' || option === 'Prefer not to say') {
        return current.includes(option) ? [] : [option];
      }

      const regularOptions = current.filter(
        (item) =>
          item !== 'Everyone' && item !== 'Prefer not to say',
      );

      return regularOptions.includes(option)
        ? regularOptions.filter((item) => item !== option)
        : [...regularOptions, option];
    });
  };

  const handleContinue = () => {
    setShowErrors(true);

    if (!canContinue) return;

    onContinue({
      displayName: displayName.trim(),
      genderIdentity,
      interestedIn,
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/backgrounds/18-verify-bg.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Branding */}
            <View style={styles.branding}>
              <View style={styles.logo}>
                <ChemistryLogo size={60} />
              </View>

              <View style={styles.brandTitle}>
                <GradientText variant="display">
                  CHEMISTREE
                </GradientText>
              </View>

              <Text variant="bodyLarge" style={styles.tagline}>
                Where Connection Grows.
              </Text>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressLine} />

              <View style={styles.progressSteps}>
                {[
                  { number: '1', label: 'Basics', active: true },
                  { number: '2', label: 'Story', active: false },
                  {
                    number: '3',
                    label: 'Chemistry',
                    active: false,
                  },
                ].map((step) => (
                  <View key={step.number} style={styles.progressStep}>
                    <View
                      style={[
                        styles.stepCircle,
                        step.active && styles.stepCircleActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumber,
                          step.active && styles.stepNumberActive,
                        ]}
                      >
                        {step.number}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.stepLabel,
                        step.active && styles.stepLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Heading */}
            <View style={styles.heading}>
              <Text
                style={styles.headingText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                Let’s Set Up <Text style={styles.headingAccent}>Your Profile</Text>
              </Text>

              <Text style={styles.description}>
                A few details to introduce yourself and find people
                who match your vibe.
              </Text>
            </View>

            {/* Profile cards */}
            <View style={styles.cards}>
              {/* Display name */}
              <View style={styles.card}>
                <View style={styles.cardArtwork}>
                  <View style={styles.cardContent}>
                    <View style={[styles.iconBox, styles.pinkIconBox]}>
                      <Ionicons name="person" size={25} color={PINK} />
                    </View>
                    <View style={styles.cardText}>
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>Display Name</Text>
                      </View>
                      <Text style={styles.cardDescription}>
                        The name people will see on your profile.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardForm}>
                    <TextInput
                      value={displayName}
                      onChangeText={(value) => setDisplayName(value.slice(0, 30))}
                      placeholder="Enter your display name"
                      placeholderTextColor="#B7A0D7"
                      maxLength={30}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                      accessibilityLabel="Display name"
                      style={styles.nameInput}
                    />
                    <View style={styles.inputFooter}>
                      {showErrors && !nameIsValid ? (
                        <Text style={styles.errorText}>Please enter your display name.</Text>
                      ) : <View />}
                      <Text style={styles.characterCount}>{displayName.length}/30</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Gender identity: expandable connected list */}
              <View style={styles.card}>
                <View style={styles.cardArtwork}>
                  <Pressable
                    style={styles.cardContent}
                    onPress={() => setGenderExpanded((expanded) => !expanded)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: genderExpanded }}
                    accessibilityLabel="Toggle gender identity options"
                  >
                    <View style={[styles.iconBox, styles.purpleIconBox]}>
                      <Ionicons name="transgender-outline" size={25} color={PURPLE} />
                    </View>
                    <View style={styles.cardText}>
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>Gender Identity</Text>
                      </View>
                      <Text style={styles.cardDescription}>
                        How do you identify? You can change this anytime.
                      </Text>
                    </View>
                    <Ionicons
                      name={genderExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={PURPLE}
                    />
                  </Pressable>

                  {genderExpanded ? (
                    <View style={styles.cardForm}>
                      <View style={styles.connectedList}>
                        {GENDER_OPTIONS.map((option, index) => {
                          const selected = genderIdentity === option;
                          const isLast = index === GENDER_OPTIONS.length - 1;
                          return (
                            <Pressable
                              key={option}
                              onPress={() => setGenderIdentity(selected ? null : option)}
                              accessibilityRole="radio"
                              accessibilityState={{ selected }}
                              style={styles.connectedRow}
                            >
                              <View style={styles.connectorColumn}>
                                {!isLast ? <View style={styles.connectorLine} /> : null}
                                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                  {selected ? (
                                    <Ionicons name="checkmark" size={10} color="#080714" />
                                  ) : null}
                                </View>
                              </View>
                              <View style={[styles.connectedRowContent, selected && styles.genderRowSelected]}>
                                <Text style={[styles.connectedLabel, selected && styles.genderLabelSelected]}>
                                  {option}
                                </Text>
                                {selected ? <Ionicons name="checkmark-circle" size={17} color={PINK} /> : null}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Meeting preferences: expandable connected multi-select list */}
              <View style={styles.card}>
                <View style={styles.cardArtwork}>
                  <Pressable
                    style={styles.cardContent}
                    onPress={() => setMeetExpanded((expanded) => !expanded)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: meetExpanded }}
                    accessibilityLabel="Toggle meeting preference options"
                  >
                    <View style={[styles.iconBox, styles.pinkIconBox]}>
                      <Ionicons name="heart" size={25} color={PINK} />
                    </View>
                    <View style={styles.cardText}>
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>Who Would You Like to Meet?</Text>
                      </View>
                      <Text style={styles.cardDescription}>
                        Choose who you’re interested in meeting. Select multiple options if you like.
                      </Text>
                    </View>
                    <Ionicons
                      name={meetExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={PINK}
                    />
                  </Pressable>

                  {meetExpanded ? (
                    <View style={styles.cardForm}>
                      <View style={styles.connectedList}>
                        {MEET_OPTIONS.map((option, index) => {
                          const selected = interestedIn.includes(option);
                          const isLast = index === MEET_OPTIONS.length - 1;
                          return (
                            <Pressable
                              key={option}
                              onPress={() => toggleMeetOption(option)}
                              accessibilityRole="checkbox"
                              accessibilityState={{ checked: selected }}
                              style={styles.connectedRow}
                            >
                              <View style={styles.connectorColumn}>
                                {!isLast ? <View style={styles.connectorLine} /> : null}
                                <View style={[styles.checkboxOuter, selected && styles.checkboxOuterSelected]}>
                                  {selected ? <Ionicons name="checkmark" size={10} color="#080714" /> : null}
                                </View>
                              </View>
                              <View style={[styles.connectedRowContent, selected && styles.meetRowSelected]}>
                                <Text style={[styles.connectedLabel, selected && styles.meetLabelSelected]}>
                                  {option}
                                </Text>
                                {selected ? <Ionicons name="checkmark-circle" size={17} color={PINK} /> : null}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                      {showErrors && !meetIsValid ? (
                        <Text style={styles.errorText}>Please select at least one option.</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Continue */}
            <View style={styles.footer}>
              <Button
                title="Continue"
                variant="primary"
                disabled={!canContinue}
                onPress={handleContinue}
              />

              <Text style={styles.footerNote}>
                You can update your profile details later.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080714',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 5, 18, 0.68)',
  },
  keyboardView: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 17,
    paddingBottom: 28,
  },

  branding: {
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

  heading: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headingText: {
    color: '#F8F4F0',
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontWeight: '600',
    alignSelf: 'center',
    flexShrink: 1,
  },
  headingAccent: {
    color: PINK,
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontWeight: '600',
  },
  description: {
    color: '#C7CBD9',
    fontSize: 12,
    lineHeight: 19,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 330,
  },

  /* Discovery Mode card shell */
  cards: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.32)',
    borderRadius: 20,
    backgroundColor: '#080714',
    overflow: 'hidden',
  },
  cardArtwork: {
    width: '100%',
    justifyContent: 'center',
      backgroundColor: '#080714',

  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 14,
    paddingHorizontal: 11,
    paddingBottom: 8,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinkIconBox: {
    borderColor: 'rgba(244,114,182,0.44)',
    backgroundColor: 'rgba(244,114,182,0.10)',
  },
  purpleIconBox: {
    borderColor: 'rgba(192,132,252,0.44)',
    backgroundColor: 'rgba(192,132,252,0.10)',
  },
  blueIconBox: {
    borderColor: 'rgba(147,197,253,0.44)',
    backgroundColor: 'rgba(147,197,253,0.10)',
  },
  cardText: {
    flex: 1,
    gap: 4,
    paddingRight: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardTitle: {
    color: '#F8F4F0',
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
    flexShrink: 1,
  },
  cardDescription: {
    color: '#C7CBD9',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Montserrat_400Regular',
  },

  /* Form controls sit inside the same card */
  cardForm: {
    paddingHorizontal: 11,
    paddingTop: 4,
    paddingBottom: 13,
  },
  nameInput: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(192,132,252,0.20)',
    backgroundColor: 'transparent',
    color: '#F8F4F0',
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    paddingHorizontal: 2,
    paddingVertical: 9,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 18,
    marginTop: 4,
  },
  characterCount: {
    color: '#C7CBD9',
    fontFamily: 'Montserrat_400Regular',
    fontSize: 9,
    marginLeft: 'auto',
  },
  errorText: {
    color: '#FDA4AF',
    fontFamily: 'Montserrat_500Medium',
    fontSize: 10,
    marginTop: 5,
  },

  /* Connected option lists */
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
  radioOuter: {
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
  radioOuterSelected: {
    borderColor: PINK,
    backgroundColor: PINK,
  },
  checkboxOuter: {
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
  checkboxOuterSelected: {
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
  genderRowSelected: {
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(244,114,182,0.58)',
    backgroundColor: 'rgba(244,114,182,0.09)',
    paddingHorizontal: 12,
  },
  genderLabelSelected: {
    color: PINK,
  },
  meetRowSelected: {
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(244,114,182,0.58)',
    backgroundColor: 'rgba(244,114,182,0.09)',
    paddingHorizontal: 12,
  },
  meetLabelSelected: {
    color: PINK,
  },

  footer: {
    marginTop: 22,
    gap: 12,
  },
  footerNote: {
    color: '#A7ABC3',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
  },
});
