import React from 'react';
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radii, spacing } from '../theme';
import { Text } from '../components/Text';
import { GradientText } from '../components/GradientText';
import { MoonlightBackground } from '../components/MoonlightBackground';

export type DashboardFilterType = 'discovery' | 'intent';

type DashboardFilterScreenProps = {
    filterType: DashboardFilterType;
    selectedOption: string;
    onSelect: (option: string) => void;
    onBack: () => void;
};

const FILTER_OPTIONS: Record<DashboardFilterType, string[]> = {
    discovery: [
        'Algorithmic Match',
        'Browse Freely',
        'Kismat Connect',
        'Nearby Discovery',
    ],
    intent: [
        'Serious Relationship',
        'Casual Dating',
        'Fun & Flirting',
        'Open to Exploring',
        'Marriage',
    ],
};

export function DashboardFilterScreen({
    filterType,
    selectedOption,
    onSelect,
    onBack,
}: DashboardFilterScreenProps) {
    const isDiscovery = filterType === 'discovery';
    const title = isDiscovery ? 'Discovery Mode' : 'Search Intent';
    const subtitle = isDiscovery
        ? 'Choose how you want to discover people.'
        : 'Choose the kind of connection you are looking for.';
    const options = FILTER_OPTIONS[filterType];

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.midnight} />

            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <MoonlightBackground />
            </View>
            <View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: 'rgba(13, 7, 20, 0.76)' },
                ]}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>



                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.intro}>
                    <Text variant="caption" color={colors.moonlight.pink} style={styles.eyebrow}>
                        PERSONALIZE YOUR DISCOVERY
                    </Text>
                    <Text variant="heading3" style={styles.title}>
                        {title}
                    </Text>
                    <Text variant="bodySmall" color={colors.moonlight.silver} style={styles.subtitle}>
                        {subtitle}
                    </Text>
                </View>

                <View style={styles.selectionCard}>
                    <LinearGradient
                        colors={['rgba(39, 23, 55, 0.96)', 'rgba(13, 12, 30, 0.96)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.cardTopLine}>
                        <View style={styles.cardIcon}>
                            <Ionicons
                                name={isDiscovery ? 'compass-outline' : 'heart-outline'}
                                size={23}
                                color={colors.moonlight.pink}
                            />
                        </View>
                        <View style={styles.cardTopCopy}>
                            <Text variant="label" color={colors.ivory}>
                                {isDiscovery ? 'DISCOVERY PREFERENCE' : 'CONNECTION PREFERENCE'}
                            </Text>
                            <Text variant="caption" color={colors.moonlight.silver}>
                                Select one option
                            </Text>
                        </View>
                        <View style={styles.countPill}>
                            <Text variant="caption" color={colors.moonlight.pink}>
                                {options.length} OPTIONS
                            </Text>
                        </View>
                    </View>

                    <View style={styles.optionList}>
                        {options.map((option, index) => {
                            const selected = selectedOption === option;
                            return (
                                <Pressable
                                    key={option}
                                    onPress={() => onSelect(option)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected }}
                                    style={[
                                        styles.option,
                                        selected && styles.optionSelected,
                                    ]}
                                >
                                    <View style={styles.optionLeading}>
                                        <View style={styles.optionNumber}>
                                            <Text
                                                variant="caption"
                                                color={selected ? colors.moonlight.pink : colors.moonlight.silver}
                                            >
                                                0{index + 1}
                                            </Text>
                                        </View>
                                        <Text
                                            variant="label"
                                            color={selected ? colors.moonlight.pink : colors.ivory}
                                            style={styles.optionLabel}
                                        >
                                            {option}
                                        </Text>
                                    </View>

                                    <View style={[
                                        styles.radioOuter,
                                        selected && styles.radioOuterSelected,
                                    ]}>
                                        {selected && <View style={styles.radioInner} />}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.note}>
                    <Ionicons
                        name="sparkles-outline"
                        size={17}
                        color={colors.moonlight.lavender}
                    />
                    <Text variant="caption" color={colors.moonlight.silver} style={styles.noteText}>
                        Your selection updates the dashboard feed. You can return here anytime to change it.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#080914',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xxl,
    },
    header: {
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.055)',
        borderWidth: 1,
        borderColor: 'rgba(244,114,182,0.22)',
    },
    brand: {
        alignItems: 'center',
        gap: 0,
    },
    headerSpacer: {
        width: 42,
    },
    intro: {
        marginBottom: spacing.xl,
        gap: spacing.xs,
    },
    eyebrow: {
        letterSpacing: 2,
        fontSize: 9,
        fontWeight: '700',
    },
    title: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 36,
        lineHeight: 42,
        color: colors.ivory,
    },
    subtitle: {
        maxWidth: 310,
        lineHeight: 21,
    },
    selectionCard: {
        overflow: 'hidden',
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.42)',
        padding: spacing.lg,
        gap: spacing.lg,
        backgroundColor: 'rgba(8,7,20,0.96)',
    },
    cardTopLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    cardIcon: {
        width: 46,
        height: 46,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(244,114,182,0.11)',
        borderWidth: 1,
        borderColor: 'rgba(244,114,182,0.25)',
    },
    cardTopCopy: {
        flex: 1,
        gap: 3,
    },
    countPill: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(244,114,182,0.09)',
        borderWidth: 1,
        borderColor: 'rgba(244,114,182,0.2)',
    },
    optionList: {
        gap: spacing.sm,
    },
    option: {
        minHeight: 62,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: 'rgba(199,203,217,0.18)',
        backgroundColor: 'rgba(16,11,22,0.76)',
    },
    optionSelected: {
        borderColor: 'rgba(244,114,182,0.72)',
        backgroundColor: 'rgba(244,114,182,0.105)',
    },
    optionLeading: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    optionNumber: {
        width: 32,
        height: 32,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.055)',
    },
    optionLabel: {
        flexShrink: 1,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: radii.pill,
        borderWidth: 1.5,
        borderColor: 'rgba(199,203,217,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOuterSelected: {
        borderColor: colors.moonlight.pink,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: radii.pill,
        backgroundColor: colors.moonlight.pink,
    },
    note: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    noteText: {
        flex: 1,
        lineHeight: 18,
    },
});
