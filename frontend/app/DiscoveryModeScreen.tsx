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
import { LinearGradient } from 'expo-linear-gradient';

const DISCOVERY_MODES = [
    {
        id: 'algorithmic',
        title: 'Algorithmic Match',
        description:
            'Let CHEMISTREE suggest people based on your interests, preferences and behaviour.',
        icon: 'flame',
        color: '#F472B6',
        tags: ['Personalized', 'Higher Compatibility'],
        image: require('../assets/branding/nearby-discovery.png'),


    },
    {
        id: 'browse',
        title: 'Browse Freely',
        description:
            'Explore profiles on your own without algorithmic suggestions.',
        icon: 'people',
        color: '#C084FC',
        tags: ['Full Control', 'Wider Choices'],
        image: require('../assets/branding/browse-freely.png'),

    },
    {
        id: 'kismat',
        title: 'Kismat Connect',
        description:
            'A unique discovery experience built around unexpected connections.',
        icon: 'sparkles',
        color: '#F472B6',
        tags: ['Surprise Matches', 'Fate Inspired'],
        image: require('../assets/branding/kismat-connect.png'),


    },
    {
        id: 'nearby',
        title: 'Nearby Discovery',
        description:
            'Find people within a chosen distance, based on your location and their privacy settings.',
        icon: 'location',
        color: '#93C5FD',
        tags: ['People Near You', 'Local Vibes'],
        image: require('../assets/branding/nearby-discovery.png'),

    },
] as const;

export type DiscoveryMode = (typeof DISCOVERY_MODES)[number]['id'];

type DiscoveryModeScreenProps = {
    onContinue: (selectedModes: DiscoveryMode[]) => void;
};

export function DiscoveryModeScreen({
    onContinue,
}: DiscoveryModeScreenProps) {
    const [selectedModes, setSelectedModes] = useState<DiscoveryMode[]>([
        'algorithmic',
    ]);

    const toggleMode = (mode: DiscoveryMode) => {
        setSelectedModes((current) =>
            current.includes(mode)
                ? current.filter((item) => item !== mode)
                : [...current, mode],
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


                <ScrollView
                    style={styles.contentScroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >


                    {/* Keep the shared CHEMISTREE branding in the same position as
            Age Verification and Intent Selection. */}
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

                    {/* Braning Ends  */}
                    <View style={styles.heading}>
                        <Text variant="heading1" style={styles.headingText}>
                            Choose How You Want
                            {'\n'}
                            <Text style={styles.headingAccent}>to Discover People</Text>
                        </Text>

                        <Text variant="body" style={styles.description}>
                            You can select one or more discovery modes. You can change these
                            anytime in settings.
                        </Text>
                    </View>

                    <View style={styles.cards}>
                        {DISCOVERY_MODES.map((mode) => {
                            const selected = selectedModes.includes(mode.id);

                            return (
                                <Pressable
                                    key={mode.id}
                                    onPress={() => toggleMode(mode.id)}
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: selected }}
                                    accessibilityLabel={`${mode.title}. ${mode.description}`}
                                    style={[
                                        styles.card,
                                        selected && {
                                            borderColor: mode.color,
                                            shadowColor: mode.color,
                                            shadowOpacity: 0.65,
                                            shadowRadius: 12,
                                            elevation: 8,
                                        },
                                    ]}
                                >
                                    <ImageBackground
                                        source={mode.image}
                                        style={styles.cardArtwork}
                                        imageStyle={styles.cardArtworkImage}
                                        resizeMode="cover"
                                    >
                                        <LinearGradient
                                            colors={[
                                                'rgba(8,7,20,0.98)',
                                                'rgba(8,7,20,0.90)',
                                                'rgba(8,7,20,0.42)',
                                                'rgba(8,7,20,0.12)',
                                            ]}
                                            locations={[0, 0.48, 0.76, 1]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={StyleSheet.absoluteFill}
                                        />

                                        <View style={styles.cardContent}>
                                            <View
                                                style={[
                                                    styles.selectionCircle,
                                                    selected && {
                                                        backgroundColor: mode.color,
                                                        borderColor: mode.color,
                                                    },
                                                ]}
                                            >
                                                {selected && (
                                                    <Ionicons name="checkmark" size={17} color="#170B24" />
                                                )}
                                            </View>

                                            <View
                                                style={[
                                                    styles.iconBox,
                                                    {
                                                        borderColor: `${mode.color}70`,
                                                        backgroundColor: `${mode.color}18`,
                                                    },
                                                ]}
                                            >
                                                <Ionicons name={mode.icon} size={27} color={mode.color} />
                                            </View>

                                            <View style={styles.cardText}>
                                                <Text style={styles.cardTitle}>{mode.title}</Text>

                                                <Text style={styles.cardDescription}>
                                                    {mode.description}
                                                </Text>

                                                <View style={styles.tags}>
                                                    {mode.tags.map((tag) => (
                                                        <View
                                                            key={tag}
                                                            style={[
                                                                styles.tag,
                                                                {
                                                                    borderColor: `${mode.color}45`,
                                                                    backgroundColor: `${mode.color}14`,
                                                                },
                                                            ]}
                                                        >
                                                            <Text style={[styles.tagText, { color: mode.color }]}>
                                                                {tag}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        </View>
                                    </ImageBackground>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.footer}>
                        <Button
                            title={
                                selectedModes.length > 0
                                    ? `Continue · ${selectedModes.length} selected`
                                    : 'Choose at least one mode'
                            }
                            variant="primary"
                            disabled={selectedModes.length === 0}
                            onPress={() => onContinue([...selectedModes])}
                        />

                        <Text style={styles.footerNote}>
                            You can always update these preferences later in settings.
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

    // branding: {
    // alignItems: 'center',
    // position: 'absolute',
    // top: 20,
    // left: 0,
    // right: 0,
    // zIndex: 1,
    // transform: [{ translateY: 40 }],
    // },

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

    contentScroll: {
        flex: 1,
        //transform: [{ scale: 0.9 }],
    },

    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingHorizontal: 17,
        paddingBottom: 28,
    },

    heading: {
        alignItems: 'center',
        marginBottom: 20,
    },

    headingText: {
        color: '#F8F4F0',
        fontSize: 34,
        lineHeight: 38,
        textAlign: 'center',
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontWeight: '600',
    },

    headingAccent: {
        color: '#F472B6',
        fontSize: 37,
        lineHeight: 40,
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
    },

    cards: {
        gap: 12,
    },

    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 11,
        borderWidth: 1,
        // borderColor: 'rgba(167,139,250,0.32)',
        // backgroundColor: 'rgba(8,7,20,0.82)',

        borderRadius: 20,
        borderColor: 'rgba(167,139,250,0.32)',
        backgroundColor: '#080714',
        overflow: 'hidden',
    },

    selectionCircle: {
        width: 21,
        height: 21,
        marginTop: 2,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(199,203,217,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 13,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    cardTitle: {
        color: '#F8F4F0',
        fontSize: 12,
        fontFamily: 'Montserrat_600SemiBold',
    },

    cardDescription: {
        color: '#C7CBD9',
        fontSize: 10,
        lineHeight: 14,
        fontFamily: 'Montserrat_400Regular',
    },

    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: 2,
    },
    tag: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 5,
    },
    tagText: {
        fontSize: 9,
        fontFamily: 'Montserrat_500Medium',
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

    cardArtwork: {
        width: '100%',
        minHeight: 100,
        justifyContent: 'center',
    },

    cardArtworkImage: {
        width: '58%',
        height: '100%',
        position: 'absolute',
        right: 0,
        left: '42%',
    },

    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
    },

    cardText: {
        flex: 1,
        gap: 4,
        paddingRight: 2,
    },
});
