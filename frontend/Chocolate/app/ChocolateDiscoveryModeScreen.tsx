import React, { useEffect, useState } from 'react';
import {
    Alert,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../components/Text/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { getDiscoveryModes, type DiscoveryMode } from '../../auth-api';
import { selectDiscoveryMode } from '../../discovery-mode';

const DISCOVERY_MODES: {
    id: DiscoveryMode;
    title: string;
    description: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    tags: string[];
    image: number;
}[] = [
    {
        id: 'algorithmic',
        title: 'Algorithmic Recommendations',
        description:
            'Let us suggest people based on your interests, preferences and behaviour.',
        icon: 'flame',
        color: '#D9A879',
        tags: ['Personalized', 'Higher Compatibility'],
        image: require('../../assets/branding/algorithmic-match-chocolate.png'),


    },
    {
        id: 'browse',
        title: 'Self Search / Browse',
        description:
            'Explore profiles on your own without algorithmic suggestions.',
        icon: 'people',
        color: '#C68A5A',
        tags: ['Full Control', 'Wider Choices'],
        image: require('../../assets/branding/browse-freely-chocolate.png'),

    },
    {
        id: 'kismat',
        title: 'KISMAT',
        description:
            'A unique discovery experience built around unexpected connections.',
        icon: 'sparkles',
        color: '#D9A879',
        tags: ['Surprise Matches', 'Fate Inspired'],
        image: require('../../assets/branding/kismat-connect-chocolate.png'),
    },
];

type DiscoveryModeScreenProps = {
    onContinue: (selectedMode: DiscoveryMode) => Promise<void> | void;
};

export function DiscoveryModeScreen({
    onContinue,
}: DiscoveryModeScreenProps) {
    const [selectedMode, setSelectedMode] = useState<DiscoveryMode | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        getDiscoveryModes()
            .then(({ mode }) => {
                if (active) setSelectedMode(mode);
            })
            .catch((error: unknown) => {
                if (active) Alert.alert('Unable to load discovery modes', error instanceof Error ? error.message : 'Please try again.');
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const continueWithSave = async () => {
        if (loading || saving || !selectedMode) return;
        setSaving(true);
        try {
            await onContinue(selectedMode);
        } catch (error) {
            Alert.alert('Unable to save discovery modes', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const chooseMode = (mode: DiscoveryMode) => {
        setSelectedMode(current => selectDiscoveryMode(current, mode));
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../assets/background/Video-Verfication-bg.png')}
                style={styles.background}
                resizeMode="cover"
            >


                <ScrollView
                    style={styles.contentScroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >


                    <View style={styles.heading}>
                        <Text variant="heading1" style={styles.headingText}>
                            Choose How You Want
                            {'\n'}
                            <Text style={styles.headingAccent}>to Discover People</Text>
                        </Text>

                        <Text variant="body" style={styles.description}>
                            Select one discovery mode. You can change it
                            anytime in settings.
                        </Text>
                    </View>

                    <View style={styles.cards}>
                        {DISCOVERY_MODES.map((mode) => {
                            const selected = selectedMode === mode.id;

                            return (
                                <Pressable
                                    key={mode.id}
                                    onPress={() => chooseMode(mode.id)}
                                    disabled={loading || saving}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected }}
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
                                                'rgba(35,19,12,0.97)',
                                                'rgba(35,19,12,0.88)',
                                                'rgba(35,19,12,0.48)',
                                                'rgba(35,19,12,0.18)',
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
                        <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ disabled: loading || saving || !selectedMode }}
                            disabled={loading || saving || !selectedMode}
                            onPress={continueWithSave}
                            style={styles.continueButton}
                        >
                            <LinearGradient
                                colors={
                                    selectedMode
                                        ? ['#D9A879', '#B97843', '#8C4D2C']
                                        : ['#49372B', '#38271E', '#2A1B14']
                                }
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.continueButtonGradient}
                            >
                                <Text style={styles.continueButtonText}>
                                    {selectedMode ? 'Continue' : 'Choose a discovery mode'}
                                </Text>
                            </LinearGradient>
                        </Pressable>

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
        backgroundColor: '#21140E',
    },
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(35, 19, 12, 0.30)',
    },


    contentScroll: {
        flex: 1,
        //transform: [{ scale: 0.9 }],
    },

    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingHorizontal: 17,
        paddingBottom: 80,
    },

    heading: {
        alignItems: 'center',
        marginBottom: 20,
    },

    headingText: {
        fontSize: 34,
        lineHeight: 38,
        textAlign: 'center',
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontWeight: '600',
        color: '#4A3022',
    },

    headingAccent: {
            color: '#9A5E35',

        fontSize: 37,
        lineHeight: 40,
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontWeight: '600',
    },

    description: {
        color: '#68452F',
        fontSize: 12,
        lineHeight: 20,
        letterSpacing: 0.8,
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
        // borderColor: 'rgba(207,170,125,0.42)',
        // backgroundColor: 'rgba(8,7,20,0.82)',

        borderRadius: 20,
        borderColor: 'rgba(207,170,125,0.42)',
        backgroundColor: '#21140E',
        overflow: 'hidden',
    },

    selectionCircle: {
        width: 21,
        height: 21,
        marginTop: 2,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(207,170,125,0.65)',
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
        color: '#F4EBDD',
        fontSize: 12,
        fontFamily: 'Montserrat_600SemiBold',
    },

    cardDescription: {
        color: '#B9A995',
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
    continueButton: {
        width: '100%',
        borderRadius: 32,
        overflow: 'hidden',
    },
    continueButtonGradient: {
        minHeight: 52,
        borderRadius: 32,
        borderWidth: 1.2,
        borderColor: '#D58B4A',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
    },
    footerNote: {
        color: '#B9A995',
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
