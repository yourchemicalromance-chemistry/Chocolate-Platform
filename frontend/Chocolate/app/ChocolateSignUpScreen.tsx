
import React, { useState } from 'react';

import {
    ImageBackground,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    Text as RNText,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// import { ChocolateLogo } from '../components/ChocolateLogo/ChocolateLogo';
import { SignUpInput } from '../components/Input/SignUpInput';

import { Text } from '../../components/Text';
import type { SignupInput } from '../../auth-api';

type SignUpScreenProps = {
    onBackToLanding: () => void;
    onContinueToAgeVerification: (input: SignupInput) => Promise<void>;
    onLogin: () => void;
    onGoogleSignIn?: () => void;
    googleSignInUnavailable?: boolean;
    googleProfile?: { fullName: string; email: string } | null;
    googleIdToken?: string | null;
    onCompleteGoogleProfile?: (profile: Pick<SignupInput, 'mobileNumber' | 'dateOfBirth' | 'is18PlusDeclared'>) => Promise<void>;
};

export function ChocolateSignUpScreen({
    onBackToLanding,
    onContinueToAgeVerification,
    onLogin,
    onGoogleSignIn,
    googleSignInUnavailable = false,
    googleProfile,
    googleIdToken,
    onCompleteGoogleProfile,
}: SignUpScreenProps) {

    const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submitSignup = async () => {
        if (!fullName.trim() || !email.trim() || !mobileNumber.trim() || (!googleIdToken && !password) || !day || !month || !year || !isAgeConfirmed) {
            Alert.alert('Complete your details', 'Enter your account details and confirm that you are 18 or older.');
            return;
        }
        setSubmitting(true);
        try {
            const profile = {
                mobileNumber,
                dateOfBirth: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
                is18PlusDeclared: true as const,
            };
            if (googleIdToken) await onCompleteGoogleProfile?.(profile);
            else await onContinueToAgeVerification({ fullName, email, password, ...profile });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>

            <ImageBackground
                source={require('../assets/background/Landing-Cinematic.png')}
                style={styles.background}
                resizeMode="cover"
            >

                <LinearGradient
                    colors={['rgba(35,10,3,0.12)', 'rgba(35,10,3,0.55)', '#321108', '#210902']}
                    locations={[0, 0.28, 0.58, 1]}
                    style={StyleSheet.absoluteFill}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    automaticallyAdjustKeyboardInsets
                >

                    <View style={styles.content}>

                        {/* Back Button 

                        <View style={styles.topBar}>
                            <Pressable
                                onPress={onBackToLanding}
                                hitSlop={12}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={30}
                                    color="#FFF0DF"
                                />
                            </Pressable>
                        </View>
                        */}

                        {/* Chocolate Branding 

                        <View style={styles.branding}>
                            <ChocolateLogo size={250} />
                        </View>
                        */}

                        {/* Heading */}

                        <View style={styles.heading}>

                            <RNText style={styles.title}>
                                Create Account
                            </RNText>


                        </View>

                        {/* Champagne Form Panel */}

                        <LinearGradient
                            colors={['#FFE6D2', '#F8DCC6', '#F2C9A8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.formPanel}
                        >

                            <View style={styles.form}>

                                {/* Full Name */}

                                <SignUpInput
                                    placeholder="Full Name"
                                    value={googleProfile?.fullName ?? fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    icon={
                                        <Ionicons
                                            name="person-outline"
                                            size={23}
                                            color="#542719"
                                        />
                                    }
                                />

                                {/* Email */}

                                <SignUpInput
                                    placeholder="Email Address"
                                    value={googleProfile?.email ?? email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    icon={
                                        <Ionicons
                                            name="mail-outline"
                                            size={23}
                                            color="#542719"
                                        />
                                    }
                                />

                                {/* Mobile Number */}

                                <SignUpInput
                                    placeholder="Mobile Number"
                                    value={mobileNumber}
                                    onChangeText={setMobileNumber}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                    icon={
                                        <Ionicons
                                            name="call-outline"
                                            size={23}
                                            color="#542719"
                                        />
                                    }
                                />

                                {/* Password */}
                                {!googleIdToken && <SignUpInput
                                    placeholder="Create Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    showPasswordToggle
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    icon={
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={23}
                                            color="#542719"
                                        />
                                    }
                                />}

                                {/* Date of Birth */}

                                <View style={styles.dobSection}>

                                    <RNText style={styles.dobLabel}>
                                        Date of Birth
                                    </RNText>

                                    <View style={styles.dobRow}>

                                        <View style={styles.dobDay}>
                                            <SignUpInput
                                                placeholder="Day"
                                                value={day}
                                                onChangeText={setDay}
                                                keyboardType="number-pad"
                                                maxLength={2}
                                                compact
                                            />
                                        </View>

                                        <View style={styles.dobMonth}>
                                            <SignUpInput
                                                placeholder="Month"
                                                value={month}
                                                onChangeText={setMonth}
                                                keyboardType="number-pad"
                                                maxLength={2}
                                                compact
                                            />
                                        </View>

                                        <View style={styles.dobYear}>
                                            <SignUpInput
                                                placeholder="Year"
                                                value={year}
                                                onChangeText={setYear}
                                                keyboardType="number-pad"
                                                maxLength={4}
                                                compact
                                            />
                                        </View>

                                    </View>

                                </View>

                                {/* 18+ Confirmation */}

                                <View style={styles.ageConfirmation}>

                                    <Pressable
                                        onPress={() =>
                                            setIsAgeConfirmed(
                                                current => !current
                                            )
                                        }
                                        style={[
                                            styles.checkbox,
                                            isAgeConfirmed &&
                                            styles.checkboxChecked,
                                        ]}
                                    >
                                        {isAgeConfirmed ? (
                                            <Ionicons
                                                name="checkmark"
                                                size={15}
                                                color="#FFF4E5"
                                            />
                                        ) : null}
                                    </Pressable>

                                    <View style={styles.ageTextContainer}>

                                        <RNText style={styles.ageTitle}>
                                            I am 18 years or older.
                                        </RNText>

                                        <RNText style={styles.ageSubtitle}>
                                            You must be 18+ to join CHOCOLATE.
                                        </RNText>

                                    </View>

                                </View>

                                {/* Create Account Button */}

                                <View style={styles.createAccountButton}>

                                    <Pressable
                                        onPress={() => void submitSignup()}
                                        disabled={submitting}
                                        style={styles.createAccountButtonPressable}
                                        accessibilityRole="button"
                                    >
                                        <LinearGradient
                                            colors={['#3B1D12', '#241008', '#160905']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.createAccountButtonGradient}
                                        >
                                            <RNText style={styles.createAccountButtonText}>
                                                {submitting ? 'Creating Account…' : googleIdToken ? 'Complete Account' : 'Create Account'}
                                            </RNText>
                                        </LinearGradient>
                                    </Pressable>

                                </View>

                                {/* Social Divider */}

                                <View style={styles.socialLogin}>

                                    <View style={styles.dividerLine} />

                                    <RNText style={styles.orText}>
                                        Or sign up with
                                    </RNText>

                                    <View style={styles.dividerLine} />

                                </View>

                                {/* Social Buttons */}

                                <View style={styles.socialRow}>

                                    {onGoogleSignIn ? <Pressable accessibilityRole="button" accessibilityLabel="Sign up with Google" style={styles.socialButton} onPress={onGoogleSignIn}>
                                        <Ionicons name="logo-google" size={27} color="#4285F4" />
                                    </Pressable> : null}

                                    <Pressable style={styles.socialButton}>
                                        <Ionicons
                                            name="logo-apple"
                                            size={27}
                                            color="#24100A"
                                        />
                                    </Pressable>

                                    <Pressable style={styles.socialButton}>
                                        <Ionicons
                                            name="call"
                                            size={25}
                                            color="#542719"
                                        />
                                    </Pressable>

                                </View>
                                {googleSignInUnavailable && <Text variant="caption" color="#704537" style={styles.googleUnavailable}>Google sign-in is unavailable. You can create an account with email and password.</Text>}

                                {/* Terms */}

                                <Text
                                    variant="caption"
                                    color="#542719"
                                    style={styles.termsText}
                                >
                                    By creating an account, you agree to our{' '}
                                    <Text style={styles.termsLink}>
                                        Terms of Service
                                    </Text>
                                    {' '}and{' '}
                                    <Text style={styles.termsLink}>
                                        Privacy Policy
                                    </Text>.
                                </Text>

                                {/* Login Prompt */}

                                <View style={styles.loginPrompt}>

                                    <RNText style={styles.loginPromptText}>
                                        Already have an account?
                                    </RNText>

                                    <Pressable onPress={onLogin}>
                                        <RNText style={styles.loginLink}>
                                            Log In
                                        </RNText>
                                    </Pressable>

                                </View>

                            </View>

                        </LinearGradient>

                    </View>

                </ScrollView>

            </ImageBackground>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#321108',
    },

    background: {
        flex: 1,
        width: '100%',
    },

    scrollView: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 35,
    },

    content: {
        width: '100%',
    },

    topBar: {
        height: 32,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },

    branding: {
        alignItems: 'center',
        marginTop: 4,
        marginBottom: -4,
    },

    heading: {
        width: '100%',
        alignItems: 'center',
        marginTop: 55,
        marginBottom: 5,
    },

    title: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 46,
        lineHeight: 52,
        color: '#FFF0DF',
        textAlign: 'center',
        textShadowColor: '#FFF0DF',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 0.7,
    },


    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: -5,
    },

    subtitle: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        lineHeight: 21,
        color: '#F8E3CE',
    },

    formPanel: {
        width: '100%',
        paddingHorizontal: 13,
        paddingVertical: 14,
        borderRadius: 27,
        borderWidth: 1,
        borderColor: 'rgba(255,222,190,0.85)',

        shadowColor: '#FFB35C',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.55,
        shadowRadius: 15,
        elevation: 8,
    },

    form: {
        width: '100%',
        gap: 7,
    },

    dobSection: {
        marginTop: 4,
        width: '100%',
    },

    dobLabel: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        color: '#542719',
        marginBottom: 6,
    },

    dobRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 5,
        marginTop: 2,
    },

    checkbox: {
        width: 21,
        height: 21,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#70412D',
        backgroundColor: 'rgba(255,244,229,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkboxChecked: {
        backgroundColor: '#A94C1D',
        borderColor: '#A94C1D',
    },

    ageTextContainer: {
        flex: 1,
        marginLeft: 9,
    },

    ageTitle: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 11,
        color: '#542719',
    },

    ageSubtitle: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 9,
        color: '#704537',
        marginTop: 2,
    },

    createAccountButton: {
        marginTop: 8,
    },

    createAccountButtonPressable: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(233,198,159,0.58)',
    },

    createAccountButtonGradient: {
        minHeight: 52,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    createAccountButtonText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 14,
        color: '#F8E3CE',
        letterSpacing: 0.3,
    },

    socialLogin: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },

    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(84,39,25,0.40)',
    },

    orText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        color: '#542719',
    },

    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        marginTop: 11,
    },

    socialButton: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#FFF1E8',
    elevation: 3,
},
    googleUnavailable: { textAlign: 'center', marginTop: 10 },

    termsText: {
    width: '100%',
    marginTop: 15,
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    lineHeight: 17,
    color: '#542719',
},

termsLink: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 11,
    lineHeight: 17,
    color: '#542719',
    textDecorationLine: 'underline',
},

    loginPrompt: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 5,
    },

    loginPromptText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 11,
        color: '#704537',
    },

    loginLink: {
        fontFamily: 'Montserrat_700Bold',
        fontSize: 11,
        color: '#542719',
        textDecorationLine: 'underline',
    },

});
