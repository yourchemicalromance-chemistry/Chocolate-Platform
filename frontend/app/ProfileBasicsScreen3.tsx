import React, { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ChemistryLogo } from '../components/ChemistryLogo';
import { GradientText } from '../components/GradientText';
import { Text } from '../components/Text';
import { Button } from '../components/Button';
import { colors, radii, spacing } from '../theme';

const PINK = '#F472B6';
const PURPLE = '#C084FC';
const COMPLETED_GREEN = '#86EFAC';

const INTERESTS = [
  { label: 'Music', icon: 'musical-notes-outline' },
  { label: 'Travel', icon: 'airplane-outline' },
  { label: 'Fitness', icon: 'barbell-outline' },
  { label: 'Food', icon: 'restaurant-outline' },
  { label: 'Movies', icon: 'film-outline' },
  { label: 'Books', icon: 'book-outline' },
  { label: 'Art', icon: 'color-palette-outline' },
  { label: 'Gaming', icon: 'game-controller-outline' },
  { label: 'Nature', icon: 'leaf-outline' },
  { label: 'Technology', icon: 'laptop-outline' },
  { label: 'Pets', icon: 'paw-outline' },
  { label: 'Spirituality', icon: 'flower-outline' },
] as const;

const LIFESTYLES = [
  { label: 'Active', icon: 'walk-outline' },
  { label: 'Relaxed', icon: 'cafe-outline' },
  { label: 'Social', icon: 'people-outline' },
  { label: 'Homebody', icon: 'home-outline' },
  { label: 'Adventurous', icon: 'trail-sign-outline' },
  { label: 'Balanced', icon: 'scale-outline' },
  { label: 'Career-focused', icon: 'briefcase-outline' },
] as const;

const VALUES = [
  { label: 'Honesty', icon: 'heart' },
  { label: 'Emotional connection', icon: 'heart-outline' },
  { label: 'Humour', icon: 'happy-outline' },
  { label: 'Ambition', icon: 'stats-chart-outline' },
  { label: 'Family', icon: 'people-outline' },
  { label: 'Kindness', icon: 'hand-left-outline' },
  { label: 'Stability', icon: 'shield-outline' },
  { label: 'Adventure', icon: 'compass-outline' },
  { label: 'Intellectual chemistry', icon: 'planet-outline' },
  { label: 'Affection', icon: 'heart-outline' },
] as const;

const CONVERSATION_STYLES = [
  { label: 'Deep conversations', icon: 'chatbubble-ellipses-outline' },
  { label: 'Playful banter', icon: 'happy-outline' },
  { label: 'Spontaneous chats', icon: 'chatbubbles-outline' },
  { label: 'Meaningful topics', icon: 'bulb-outline' },
  { label: 'Light and fun', icon: 'sunny-outline' },
  { label: 'A bit of everything', icon: 'star-outline' },
] as const;

type Choice = { label: string; icon: string };

export type ProfileChemistryDetails = {
  interests: string[];
  lifestyles: string[];
  values: string[];
  conversationStyles: string[];
};

type ProfileBasicsScreen3Props = {
  onBack: () => void;
  onContinue: (details: ProfileChemistryDetails) => void;
};

export function ProfileBasicsScreen3({
  onBack,
  onContinue,
}: ProfileBasicsScreen3Props) {
  const [interests, setInterests] = useState<string[]>([]);
  const [lifestyles, setLifestyles] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [conversationStyles, setConversationStyles] = useState<string[]>([]);

  const [interestsExpanded, setInterestsExpanded] = useState(false);
  const [lifestyleExpanded, setLifestyleExpanded] = useState(false);
  const [valuesExpanded, setValuesExpanded] = useState(false);
  const [conversationExpanded, setConversationExpanded] = useState(false);

  const toggleChoice = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const canContinue =
    interests.length > 0 &&
    lifestyles.length > 0 &&
    values.length > 0 &&
    conversationStyles.length > 0;

  const handleContinue = () => {
    onContinue({
      interests,
      lifestyles,
      values,
      conversationStyles,
    });
  };

  const renderOptions = (
    options: readonly Choice[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    accent: 'pink' | 'purple',
  ) => {
    const accentColor = accent === 'pink' ? PINK : PURPLE;

    return (
      <View style={styles.connectedList}>
        {options.map((option, index) => {
          const isSelected = selected.includes(option.label);
          const isLast = index === options.length - 1;

          return (
            <Pressable
              key={option.label}
              onPress={() => toggleChoice(option.label, selected, setSelected)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              style={styles.connectedRow}
            >
              <View style={styles.connectorColumn}>
                {!isLast ? (
                  <View
                    style={[
                      styles.connectorLine,
                      { backgroundColor: accent === 'pink'
                        ? 'rgba(244,114,182,0.38)'
                        : 'rgba(192,132,252,0.38)' },
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: accentColor },
                    isSelected && {
                      borderColor: accentColor,
                      backgroundColor: accentColor,
                    },
                  ]}
                >
                  {isSelected ? (
                    <Ionicons name="checkmark" size={10} color="#080714" />
                  ) : null}
                </View>
              </View>

              <View
                style={[
                  styles.connectedRowContent,
                  isSelected && {
                    borderColor: accent === 'pink'
                      ? 'rgba(244,114,182,0.58)'
                      : 'rgba(192,132,252,0.58)',
                    backgroundColor: accent === 'pink'
                      ? 'rgba(244,114,182,0.09)'
                      : 'rgba(192,132,252,0.09)',
                  },
                ]}
              >
                <View style={styles.optionLabelGroup}>
                  <Ionicons
                    name={option.icon as any}
                    size={17}
                    color={isSelected ? accentColor : '#C7B7E7'}
                  />
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.connectedLabel,
                      isSelected && { color: accentColor },
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={17} color={accentColor} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderSectionHeader = (
    title: string,
    description: string,
    icon: string,
    accent: 'pink' | 'purple',
    expanded: boolean,
    onToggle: () => void,
    selectedCount: number,
    instruction: string,
  ) => (
    <Pressable
      style={styles.sectionHeading}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`Toggle ${title} options`}
    >
      <View style={accent === 'pink' ? styles.sectionIconPink : styles.sectionIconPurple}>
        <Ionicons name={icon as any} size={22} color={accent === 'pink' ? PINK : PURPLE} />
      </View>
      <View style={styles.sectionHeadingText}>
        <Text variant="heading3" style={styles.sectionTitle}>{title}</Text>
        <Text variant="bodySmall" style={styles.sectionDescription}>{description}</Text>
      </View>
      <View style={styles.sectionHeaderRight}>
        <Text variant="caption" style={styles.selectionHint}>
          {selectedCount ? `${selectedCount} selected` : instruction}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={accent === 'pink' ? PINK : PURPLE}
        />
      </View>
    </Pressable>
  );

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

          <View style={styles.progressSection}>
            <View style={styles.progressLine} />
            <View style={styles.progressSteps}>
              <View style={styles.progressStep}>
                <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                  <Ionicons name="checkmark" size={17} color="#082817" />
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelCompleted]}>Basics</Text>
              </View>
              <View style={styles.progressStep}>
                <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                  <Ionicons name="checkmark" size={17} color="#082817" />
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelCompleted]}>Story</Text>
              </View>
              <View style={styles.progressStep}>
                <View style={[styles.stepCircle, styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, styles.stepNumberActive]}>3</Text>
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelActive]}> Chemistry </Text>
              </View>
            </View>
          </View>

          <View style={styles.intro}>
            <Text
              style={styles.pageHeading}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              Your <Text style={styles.pageHeadingAccent}>Chemistry</Text>
            </Text>
            <Text variant="body" style={styles.introDescription}>
              Help us understand what matters to you, so we can bring you more meaningful connections.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            {renderSectionHeader(
              'Interests',
              'Select a few things you enjoy.',
              'star-outline',
              'pink',
              interestsExpanded,
              () => setInterestsExpanded((value) => !value),
              interests.length,
              'Select multiple',
            )}
            {interestsExpanded
              ? renderOptions(INTERESTS, interests, setInterests, 'pink')
              : null}
          </View>

          <View style={styles.sectionCard}>
            {renderSectionHeader(
              'Lifestyle',
              'What best describes your lifestyle?',
              'sunny-outline',
              'purple',
              lifestyleExpanded,
              () => setLifestyleExpanded((value) => !value),
              lifestyles.length,
              'Select one or more',
            )}
            {lifestyleExpanded
              ? renderOptions(LIFESTYLES, lifestyles, setLifestyles, 'purple')
              : null}
          </View>

          <View style={styles.sectionCard}>
            {renderSectionHeader(
              'What Matters to You?',
              "Select what's important in a connection.",
              'heart',
              'pink',
              valuesExpanded,
              () => setValuesExpanded((value) => !value),
              values.length,
              'Select multiple',
            )}
            {valuesExpanded
              ? renderOptions(VALUES, values, setValues, 'pink')
              : null}
          </View>

          <View style={styles.sectionCard}>
            {renderSectionHeader(
              'Conversation Style',
              'What kind of conversations do you enjoy?',
              'chatbubbles-outline',
              'purple',
              conversationExpanded,
              () => setConversationExpanded((value) => !value),
              conversationStyles.length,
              'Select one or more',
            )}
            {conversationExpanded
              ? renderOptions(
                  CONVERSATION_STYLES,
                  conversationStyles,
                  setConversationStyles,
                  'purple',
                )
              : null}
          </View>

          <View style={styles.navigationRow}>
            <View style={styles.continueButton}>
              <Button
                title="Create My Profile  →"
                variant="primary"
                disabled={!canContinue}
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
    backgroundColor: 'rgba(244,114,182,0.55)',
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
  color: '#B9BDCD',
},
  intro: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 0,
    width: '100%',
  },
  pageHeading: {
    color: '#F8F4F0',
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontWeight: '600',
    width: '100%',
    flexShrink: 1,
  },
  pageHeadingAccent: {
    color: PINK,
    fontSize: 32,
    lineHeight: 36,
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontWeight: '600',
  },
  introDescription: {
    color: '#C7CBD9',
    fontSize: 12,
    lineHeight: 19,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 340,
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
    gap: 12,
    marginBottom: 13,
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
  sectionHeadingText: {
    flex: 1,
    gap: 3,
  },
  sectionHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: 115,
  },
  sectionTitle: {
    color: '#F8F4F0',
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  sectionDescription: {
    color: '#C7CBD9',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Montserrat_400Regular',
  },
  selectionHint: {
    color: '#C7CBD9',
    fontSize: 9,
    textAlign: 'right',
  },
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
  },
  radioOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    backgroundColor: '#080714',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
  optionLabelGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connectedLabel: {
    flex: 1,
    color: '#D5C6F1',
    fontFamily: 'Montserrat_500Medium',
    fontSize: 12,
  },
  navigationRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  continueButton: {
    flex: 1,
  },
  bottomSpacer: {
    height: 14,
  },
});
