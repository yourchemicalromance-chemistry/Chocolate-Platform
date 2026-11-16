


import React, { useRef, useState } from 'react';


import {
    Animated,
    ImageBackground,
    Keyboard,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    Text as RNText,
} from 'react-native';

import { ChemistryLogo } from '../components/ChemistryLogo';
import { GradientText } from '../components/GradientText';
import { Text } from '../components/Text';
import { colors, radii, spacing } from '../theme';


import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/Input';

import { Button } from '../components/Button';

import { Image } from 'react-native';




type LoginScreenProps = {
    onBack: () => void;
    onCreateAccount: () => void;
    onLogin: (usernameOrEmail: string, password: string) => void;
};

export function LoginScreen({
    onBack,
    onCreateAccount,
    onLogin,
}: LoginScreenProps) {

    const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


    {/* Dragging Back Button */ }

    {/*Image Background and page begins */ }


    return (
        <View style={styles.container}>
            <View style={styles.background}>



                {/* Page Branding 

                <Animated.View
                    style={[
                        styles.branding,
                        { opacity: brandingOpacity },
                    ]}
                >

                    <View style={styles.logo}>
                        <ChemistryLogo size={150} />
                    </View>

                    <View style={styles.title}>
                        <GradientText variant="display">
                            CHEMISTREE
                        </GradientText>
                    </View>

                    <Text variant="bodyLarge" style={styles.tagline}>
                        Where Connection Grows.
                    </Text>
                </Animated.View>

                {/* The Card Begins Here */}

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    automaticallyAdjustKeyboardInsets
                    scrollEnabled={true}
                >

                    <View style={styles.card}>

                        <Pressable style={styles.heading}>

                            <View style={styles.cardTitleRow}>
                                <RNText style={styles.cardTitleIvory}>
                                    Log into
                                </RNText>

                                <MaskedView
                                    maskElement={
                                        <RNText style={styles.cardTitleGradient}>
                                            {' your account'}
                                        </RNText>
                                    }
                                >
                                    <LinearGradient
                                        colors={['#F472B6', '#A78BFA']}
                                        start={{ x: 0, y: 0.5 }}
                                        end={{ x: 1, y: 0.5 }}
                                    >
                                        <RNText style={[styles.cardTitleGradient, styles.gradientText]}>
                                            {' your account'}
                                        </RNText>
                                    </LinearGradient>
                                </MaskedView>

                            </View>
                        </Pressable>


                        <Text
                            variant="body"
                            color="rgba(248, 244, 240, 0.72)"
                            style={styles.subtitle}
                        >
                            Welcome back. Your chemistree awaits.

                        </Text>

                        {/* Form will be added here */}

                        <View style={styles.form}>

                            <Input
                                placeholder="Email address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                autoCorrect={false}
                                icon={
                                    <Ionicons
                                        name="mail-outline"
                                        size={20}
                                        color="rgba(199, 203, 217, 0.55)"
                                    />
                                }
                            />

                            <Input
                                placeholder="Password"
                                secureTextEntry
                                showPasswordToggle
                                autoCapitalize="none"
                                value={password}
                                onChangeText={setPassword}
                                autoCorrect={false}
                                icon={
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color="rgba(199, 203, 217, 0.55)"
                                    />
                                }
                            />

                            <Text
                                variant="caption"
                                color="rgba(199, 203, 217, 0.55)"
                                style={styles.passwordHint}
                            >
                                Use at least 8 characters with a mix of letters, numbers and symbols.
                            </Text>

                            {/* Create Account */}
                            <View style={styles.createAccountButton}>
                                <Button
                                    title="Log In"
                                    variant="primary"
                                    onPress={() => onLogin(email.trim(), password)}
                                    disabled={!email.trim() || !password}
                                />
                            </View>

                            {/* Create Account ends */}

                            {/* Divider  */}
                            <View style={styles.socialLogin}>
                                <View style={styles.dividerLine} />

                                <Text
                                    variant="caption"
                                    color="rgba(199, 203, 217, 0.55)"
                                    style={styles.orText}
                                >
                                    OR
                                </Text>

                                <View style={styles.dividerLine} />
                            </View>

                            {/* Divider Ends */}

                            {/* Social Login */}
                            {/* Social Login */}
                            <View style={styles.socialRow}>

                                {/* Google Login */}
                                <Pressable style={styles.socialButton}>
                                    <Ionicons
                                        name="logo-google"
                                        size={18}
                                        color={colors.ivory}
                                    />
                                </Pressable>

                                {/* Apple Login */}
                                <Pressable style={styles.socialButton}>
                                    <Ionicons
                                        name="logo-apple"
                                        size={18}
                                        color={colors.ivory}
                                    />
                                </Pressable>

                                {/* Email Login */}
                                <Pressable style={styles.socialButton}>
                                    <Ionicons
                                        name="mail-outline"
                                        size={18}
                                        color={colors.ivory}
                                    />
                                </Pressable>

                            </View>
                            {/* Social Login */}

                            {/* Existing Account */}
                            <View style={styles.loginPrompt}>
                                <Text variant="bodySmall" color="rgba(199,203,217,0.82)">

                                    New to Chemistree?
                                </Text>

                                <Pressable onPress={onCreateAccount}>
                                    <Text
                                        variant="bodySmall"
                                        color="#F472B6"
                                        style={styles.loginLink}
                                    >
                                        Create Account
                                    </Text>
                                </Pressable>

                            </View>

                            {/* Terms & Privacy */}
                            <Text
                                variant="caption"
                                color="rgba(199,203,217,0.55)"
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

                            {/* Terms & Privacy Ends */}
                        </View>
                    </View>

                </ScrollView>
            </View>
        </View>
    );
}

// StyleSheet


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    background: {
        flex: 1,
        width: '100%',
    },

    scrollContent: {
        paddingTop: 180,
        paddingBottom: 100,
        alignItems: 'center',
    },


    card: {
        width: '90%',
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
        borderRadius: radii.xl,
        backgroundColor: 'rgba(8, 7, 20, 0.98)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.65)',
    },


    heading: {
        alignItems: 'center',
    },

    subtitle: {
        marginTop: 2,
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 20,
        color: 'rgba(199, 203, 217, 0.82)',
    },


    branding: {
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        transform: [{ translateY: 40 }],
    },

    logo: {
        // no transform
    },

    title: {
        marginTop: -20,
    },

    tagline: {
        marginTop: 2,
    },

    // ScrollView Styles
    scrollView: {
        flex: 1,
        zIndex: 2,
        backgroundColor: 'transparent',

    },

    // Form Styles

    form: {
        width: '100%',
        marginTop: spacing.xl,
        gap: spacing.sm,
    },


    cardTitle: {
        fontFamily: 'CormorantGaramond_500Medium',
        fontSize: 38,
        lineHeight: 44,
        color: colors.ivory,
        textAlign: 'center',
    },


    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        flexWrap: 'wrap',
        paddingHorizontal: 4,
    },

    cardTitleIvory: {
        fontFamily: 'CormorantGaramond_500Medium',
        fontSize: 32,
        lineHeight: 38,
        color: colors.ivory,
    },

    cardTitleGradient: {
        fontFamily: 'CormorantGaramond_500Medium',
        fontSize: 32,
        lineHeight: 38,
    },

    gradientText: {
        opacity: 0,
    },

    passwordHint: {
        marginTop: 2,
        marginLeft: 4,
        fontSize: 10,
        lineHeight: 14,
    },

    /* Date of Birth Section Styles */

    dobSection: {
        width: '100%',
        marginTop: spacing.sm,
    },

    dobLabel: {
        marginBottom: spacing.sm,
        fontSize: 12,
        lineHeight: 16,
        color: 'rgba(199, 203, 217, 0.90)',
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

    /* Age Confirmation Styles */
    ageConfirmation: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(199, 203, 217, 0.20)',
        borderRadius: radii.md,
        backgroundColor: 'rgba(16, 11, 22, 0.72)',
    },

    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(199, 203, 217, 0.45)',
        backgroundColor: 'rgba(16, 11, 22, 0.72)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkboxChecked: {
        backgroundColor: '#F472B6',
        borderColor: '#F472B6',
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

    // Button Create Account Styles
    createAccountButton: {
        marginTop: spacing.xs
        ,
    },

    // Scoial Login Styles

    socialLogin: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(199, 203, 217, 0.18)',
    },

    orText: {
        marginHorizontal: spacing.sm,
        fontSize: 10,
        lineHeight: 14,
    },

    // Social Login Button Styles
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
        borderRadius: 9.5,
        borderWidth: 1,
        borderColor: 'rgba(199, 203, 217, 0.23)',
        backgroundColor: 'rgba(16, 11, 22, 0.72)',
    },

    // Existing Account Prompt Styles
    loginPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
    },

    loginLink: {
        marginLeft: 6,
    },

    // Terms & Privacy Styles
    termsText: {
        marginTop: spacing.xs,
        textAlign: 'center',
        fontSize: 10,
        lineHeight: 14,
    },

    termsLink: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 10,
        lineHeight: 14,
        color: '#F472B6',
        textDecorationLine: 'underline',
    },


});