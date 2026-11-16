
import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    Text as RNText,
} from 'react-native';

import { Text } from '../../components/Text';
import { radii, spacing } from '../../theme';

import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ChocolateInput } from '../components/Input/ChocolateInput';
import { ChocolateButton } from '../components/Button/ChocolateButton';

type SignUpScreenProps = {
    onBackToLanding: () => void;
    onContinueToAgeVerification: () => void;
    onLogin: () => void;
};

export function ChocolateSignUpScreen({
    onBackToLanding,
    onContinueToAgeVerification,
    onLogin,
}: SignUpScreenProps) {
    const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                automaticallyAdjustKeyboardInsets
            >
                <View style={styles.signupContent}>

                    {/* Heading */}
                    <View style={styles.heading}>
                        <View style={styles.cardTitleRow}>
                            <RNText style={styles.cardTitleIvory}>
                                Create
                            </RNText>

                            <MaskedView
                                maskElement={
                                    <RNText style={styles.cardTitleGradient}>
                                        {' your account'}
                                    </RNText>
                                }
                            >
                                <LinearGradient
                                    colors={['#D9A879', '#FFF4E5']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                >
                                    <RNText
                                        style={[
                                            styles.cardTitleGradient,
                                            styles.gradientText,
                                        ]}
                                    >
                                        {' your account'}
                                    </RNText>
                                </LinearGradient>
                            </MaskedView>
                        </View>
                    </View>

                    <Text
                        variant="body"
                        color="#FFF4E5"
                        style={styles.subtitle}
                    >
                        A little information. Then connection begins.
                    </Text>

                    {/* Signup Form */}
                    <View style={styles.form}>

                        <ChocolateInput
                            placeholder="First name"
                            autoCapitalize="words"
                            autoCorrect={false}
                            icon={
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color="#D9A879"
                                />
                            }
                        />

                        <ChocolateInput
                            placeholder="Email address"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            icon={
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color="#D9A879"
                                />
                            }
                        />

                        <ChocolateInput
                            placeholder="Password"
                            secureTextEntry
                            showPasswordToggle
                            autoCapitalize="none"
                            autoCorrect={false}
                            icon={
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color="#D9A879"
                                />
                            }
                        />

                        <Text
                            variant="caption"
                            color="rgba(255,244,229,0.75)"
                            style={styles.passwordHint}
                        >
                            Use at least 8 characters with a mix of letters,
                            numbers and symbols.
                        </Text>

                        {/* Date of Birth */}
                        <View style={styles.dobSection}>
                            <Text
                                variant="label"
                                color="#FFF4E5"
                                style={styles.dobLabel}
                            >
                                Date of birth
                            </Text>

                            <View style={styles.dobRow}>
                                <View style={styles.dobDay}>
                                    <ChocolateInput
                                        placeholder="Day"
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        compact
                                    />
                                </View>

                                <View style={styles.dobMonth}>
                                    <ChocolateInput
                                        placeholder="Month"
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        compact
                                    />
                                </View>

                                <View style={styles.dobYear}>
                                    <ChocolateInput
                                        placeholder="Year"
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        compact
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Age Confirmation */}
                        <View style={styles.ageConfirmation}>
                            <Pressable
                                onPress={() =>
                                    setIsAgeConfirmed(current => !current)
                                }
                                style={[
                                    styles.checkbox,
                                    isAgeConfirmed && styles.checkboxChecked,
                                ]}
                            >
                                {isAgeConfirmed ? (
                                    <Ionicons
                                        name="checkmark"
                                        size={14}
                                        color="#FFF4E5"
                                    />
                                ) : null}
                            </Pressable>

                            <View style={styles.ageTextContainer}>
                                <Text
                                    variant="caption"
                                    color="#3B211B"
                                    style={styles.ageTitle}
                                >
                                    I am 18 years or older.
                                </Text>

                                <Text
                                    variant="caption"
                                    color="rgba(59,33,27,0.75)"
                                    style={styles.ageSubtitle}
                                >
                                    You must be 18+ to join CHEMISTREE.
                                </Text>
                            </View>
                        </View>

                        {/* Create Account Button */}
                        <View style={styles.createAccountButton}>
                            <ChocolateButton
                                title="Create Account"
                                variant="primary"
                                onPress={onContinueToAgeVerification}
                            />
                        </View>

                        {/* Social Login Divider */}
                        <View style={styles.socialLogin}>
                            <View style={styles.dividerLine} />

                            <Text
                                variant="caption"
                                color="rgba(255,244,229,0.75)"
                                style={styles.orText}
                            >
                                OR
                            </Text>

                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <Pressable style={styles.socialButton}>
                                <Ionicons
                                    name="logo-google"
                                    size={18}
                                    color="#3B211B"
                                />
                            </Pressable>

                            <Pressable style={styles.socialButton}>
                                <Ionicons
                                    name="logo-apple"
                                    size={18}
                                    color="#3B211B"
                                />
                            </Pressable>

                            <Pressable style={styles.socialButton}>
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color="#3B211B"
                                />
                            </Pressable>
                        </View>

                        {/* Login Prompt */}
                        <View style={styles.loginPrompt}>
                            <Text
                                variant="bodySmall"
                                color="rgba(255,244,229,0.82)"
                            >
                                Already have an account?
                            </Text>

                            <Pressable onPress={onLogin}>
                                <Text
                                    variant="bodySmall"
                                    color="#D9A879"
                                    style={styles.loginLink}
                                >
                                    Log In
                                </Text>
                            </Pressable>
                        </View>

                        {/* Terms */}
                        <Text
                            variant="caption"
                            color="rgba(255,244,229,0.75)"
                            style={styles.termsText}
                        >
                            By creating an account, you agree to our{' '}
                            <Text style={styles.termsLink}>
                                Terms of Service
                            </Text>
                            {' '}and{' '}
                            <Text style={styles.termsLink}>
                                Privacy Policy
                            </Text>
                            .
                        </Text>

                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3B211B',
    },

    scrollView: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    scrollContent: {
        flexGrow: 1,
        paddingTop: spacing.xxl,
        paddingBottom: 100,
        paddingHorizontal: spacing.lg,
        alignItems: 'stretch',
    },

    signupContent: {
        width: '100%',
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
    },

    heading: {
        alignItems: 'flex-start',
        width: '100%',
    },

    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-start',
    },

    cardTitleIvory: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 34,
        lineHeight: 42,
        color: '#FFF4E5',
    },

    cardTitleGradient: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 34,
        lineHeight: 42,
        color: '#FFF4E5',
    },

    gradientText: {
        opacity: 0,
    },

    subtitle: {
        marginTop: 4,
        textAlign: 'left',
        fontSize: 13,
        lineHeight: 20,
    },

    form: {
        width: '100%',
        marginTop: spacing.xl,
        gap: spacing.sm,
    },

    passwordHint: {
        marginTop: 2,
        marginLeft: 4,
        fontSize: 10,
        lineHeight: 14,
    },

    dobSection: {
        width: '100%',
        marginTop: spacing.sm,
    },

    dobLabel: {
        marginBottom: spacing.sm,
        fontSize: 12,
        lineHeight: 16,
    },

    dobRow: {
        width: '100%',
        flexDirection: 'row',
        gap: spacing.sm,
    },

    dobDay: {
        flex: 0.8,
    },

    dobMonth: {
        flex: 1,
    },

    dobYear: {
        flex: 1.2,
    },

    ageConfirmation: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(59,33,27,0.25)',
        borderRadius: radii.md,
        backgroundColor: '#F4DFC3',
    },

    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#542719',
        backgroundColor: '#FFF4E5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkboxChecked: {
        backgroundColor: '#B97848',
        borderColor: '#B97848',
    },

    ageTextContainer: {
        flex: 1,
        marginLeft: spacing.sm,
    },

    ageTitle: {
        fontSize: 12,
        lineHeight: 15,
    },

    ageSubtitle: {
        marginTop: 1,
        fontSize: 10,
        lineHeight: 14,
    },

    createAccountButton: {
        marginTop: spacing.xs,
    },

    socialLogin: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,244,229,0.30)',
    },

    orText: {
        marginHorizontal: spacing.sm,
        fontSize: 10,
        lineHeight: 14,
    },

    socialRow: {
        width: '100%',
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xs,
    },

    socialButton: {
        flex: 1,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(59,33,27,0.18)',
        backgroundColor: '#F4DFC3',
    },

    loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: spacing.sm,
},

    loginLink: {
        marginLeft: 6,
    },

    termsText: {
        marginTop: spacing.xs,
        textAlign: 'left',
        fontSize: 10,
        lineHeight: 14,
    },

    termsLink: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 10,
        lineHeight: 14,
        color: '#D9A879',
        textDecorationLine: 'underline',
    },
});
