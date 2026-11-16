
import React, { useState } from 'react';
import {
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ChemistryLogo } from '../components/ChemistryLogo';
import { GradientText } from '../components/GradientText';
import { Text } from '../components/Text';
import { Button } from '../components/Button';

const INTENTS = [
    {
        id: 'serious',
        title: 'Serious Relationship',
        description: 'Build a meaningful, lasting relationship.',
        icon: 'heart',
        color: '#F472B6',
    },
    {
        id: 'casual',
        title: 'Casual Dating',
        description: 'Meet people without immediate commitment.',
        icon: 'cafe',
        color: '#D879F9',
    },
    {
        id: 'flirting',
        title: 'Fun & Flirting',
        description: 'Enjoy playful conversations and explore the spark.',
        icon: 'sparkles',
        color: '#F9A8D4',
    },
    {
        id: 'exploring',
        title: 'Open to Exploring',
        description: 'Stay open-minded and see where things lead.',
        icon: 'compass',
        color: '#A78BFA',
    },
    {
        id: 'marriage',
        title: 'Marriage',
        description: 'Find a life partner with marriage in mind.',
        icon: 'infinite',
        color: '#F0ABFC',
    },
] as const;

export type DatingIntent = (typeof INTENTS)[number]['id'];

type IntentSelectionScreenProps = {
    onBack: () => void;
    onContinue: (selectedIntents: DatingIntent[]) => void;
};

export function IntentSelectionScreen({
    onBack,
    onContinue,
}: IntentSelectionScreenProps) {
    const [selectedIntents, setSelectedIntents] = useState<DatingIntent[]>([]);

    const toggleIntent = (intent: DatingIntent) => {
        setSelectedIntents((current) =>
            current.includes(intent)
                ? current.filter((item) => item !== intent)
                : [...current, intent],
        );
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../assets/backgrounds/18-verify-bg.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.overlay} />


                {/* Page Branding */}
                <View style={styles.branding}>
                    <View style={styles.logo}>
                        <ChemistryLogo size={60} />
                    </View>

                    <View style={styles.title}>
                        <GradientText variant="display">
                            CHEMISTREE
                        </GradientText>
                    </View>

                    <Text variant="bodyLarge" style={styles.tagline}>
                        Where Connection Grows.
                    </Text>
                </View>


                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    {/*
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={['#F472B6', '#A78BFA']}
                style={styles.progressFill}
              />
            </View>
            <Text style={styles.progressText}>STEP 2 OF 5</Text>
          </View>

           */}


                    <View style={styles.heading}>
                        <Text variant="heading1" style={styles.headingText}>
                            What do you
                            <Text style={styles.ageText}> Seek</Text>

                        </Text>

                        <Text variant="body" style={styles.description}>
                            Choose what you're seeking with Chemistree.
                        </Text>
                    </View>

                    <View style={styles.cards}>
                        {INTENTS.map((intent) => {
                            const selected = selectedIntents.includes(intent.id);

                            return (
                                <Pressable
                                    key={intent.id}
                                    onPress={() => toggleIntent(intent.id)}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: selected }}
                                    style={[
                                        styles.card,
                                        selected && {
                                            borderColor: intent.color,
                                            backgroundColor: 'rgba(66, 28, 75, 0.72)',
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.iconBox,
                                            {
                                                borderColor: `${intent.color}70`,
                                                backgroundColor: `${intent.color}18`,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={intent.icon}
                                            size={25}
                                            color={intent.color}
                                        />
                                    </View>

                                    <View style={styles.cardText}>
                                        <Text style={styles.cardTitle}>{intent.title}</Text>
                                        <Text style={styles.cardDescription}>
                                            {intent.description}
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.checkCircle,
                                            selected && {
                                                backgroundColor: intent.color,
                                                borderColor: intent.color,
                                            },
                                        ]}
                                    >
                                        {selected && (
                                            <Ionicons name="checkmark" size={16} color="#170B24" />
                                        )}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title={
                                selectedIntents.length > 0
                                    ? `Continue · ${selectedIntents.length} selected`
                                    : 'Select your intentions'
                            }
                            variant="primary"
                            disabled={selectedIntents.length === 0}
                            onPress={() => onContinue([...selectedIntents])}
                        />

                        <Text style={styles.footerNote}>
                            Your intentions help us find more meaningful connections.
                        </Text>
                    </View>
                </ScrollView>
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
    contentScroll: {
        flex: 1,
        transform: [{ scale: 0.90 }],
    },

    scrollContent: {
        flexGrow: 1,
        paddingTop: 180,
        paddingHorizontal: 17,
        paddingBottom: 40,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.35)',
        backgroundColor: 'rgba(8,7,20,0.7)',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 28,
    },
    progressTrack: {
        flex: 1,
        height: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(199,203,217,0.17)',
        overflow: 'hidden',
    },
    progressFill: {
        width: '40%',
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        color: '#C7CBD9',
        fontSize: 9,
        letterSpacing: 1,
    },
    heading: {
        marginBottom: 22,
    },
    eyebrow: {
        color: '#D879F9',
        fontSize: 10,
        letterSpacing: 1.6,
        marginBottom: 10,
    },
    headingTitle: {
        color: '#F8F4F0',
        fontSize: 38,
        lineHeight: 43,
        fontFamily: 'CormorantGaramond_600SemiBold',
        textAlign: 'left',
    },
    headingAccent: {
        color: '#F472B6',
        fontFamily: 'CormorantGaramond_600SemiBold',
    },

    cards: {
        gap: 10,
    },
    card: {
        minHeight: 78,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.30)',
        backgroundColor: 'rgba(8,7,20,0.77)',
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardText: {
        flex: 1,
        gap: 4,
    },
    cardTitle: {
        color: '#F8F4F0',
        fontSize: 12,
        fontFamily: 'Montserrat_600SemiBold',
    },
    cardDescription: {
        color: '#A7ABC3',
        fontSize: 10,
        lineHeight: 15,
    },
    checkCircle: {
        width: 23,
        height: 23,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
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

    branding: {
        alignItems: 'center',
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        zIndex: 1,
        transform: [{ translateY: 40 }],
    },

    logo: {
        // no transform
    },

    title: {
        marginTop: -14,
        transform: [{ scale: 0.60 }],
    },

    tagline: {
        color: '#C7CBD9',
        fontSize: 11,
        letterSpacing: 0.5,
        marginTop: -12,
    },


    // heading text

    headingText: {
        fontSize: 45,
        lineHeight: 40,
        textAlign: 'center',
        fontFamily: 'CormorantGaramond_600SemiBold',
        color: '#F8F4F0',
        fontWeight: '600',
    },

    ageText: {
        color: '#F472B6',
        fontSize: 50,
        lineHeight: 40,
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontWeight: '600',
    },


    description: {
        marginTop: 8,
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 20,
        letterSpacing: 0.8,
        fontFamily: 'Montserrat_400Regular',
        color: '#C7CBD9',
    },

});
