import React, { useState } from 'react';
import {
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
    Text as RNText,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '../../components/Text';
import { spacing } from '../../theme';
import { LoginInput } from '../components/Input/LoginInput';
import { LoginButton } from '../components/Button/LoginButton';

type LoginScreenProps = {
    onBack: () => void;
    onCreateAccount: () => void;
    onLogin: (usernameOrEmail: string, password: string) => void;
    onGoogleSignIn?: () => void;
    googleSignInUnavailable?: boolean;
    onForgotPassword?: () => void;
};

export function ChocolateLoginScreen({
    onBack,
    onLogin,
    onCreateAccount,
    onGoogleSignIn,
    googleSignInUnavailable = false,
    onForgotPassword,
}: LoginScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../assets/background/Landing-Cinematic.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={[
                        'rgba(42,22,13,0.48)',
                        'rgba(29,14,8,0.78)',
                        'rgba(22,9,5,0.94)',
                        'rgba(22,9,5,0.97)',
                    ]}
                    locations={[0, 0.34, 0.72, 1]}
                    start={{ x: 0.15, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
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
                        {/*
                        <View style={styles.topBar}>
                            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={30} color="#FFF0DF" />
                            </Pressable>
                        </View>
 */}
                        <View style={styles.heading}>
                            <RNText style={styles.title}>Log In</RNText>
                        </View>

                        <View style={styles.form}>
                            <LoginInput
                                placeholder="Email or Mobile Number"
                                placeholderTextColor="#F8DCC6"
                                style={{ color: '#FFF0DF' }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                autoCorrect={false}
                                icon={<Ionicons name="mail-outline" size={22} color="#F8DCC6" />}
                            />
                            <LoginInput
                                placeholder="Password"
                                placeholderTextColor="#F8DCC6"
                                style={{ color: '#FFF0DF' }}
                                secureTextEntry
                                showPasswordToggle
                                autoCapitalize="none"
                                value={password}
                                onChangeText={setPassword}
                                autoCorrect={false}
                                icon={<Ionicons name="lock-closed-outline" size={22} color="#F8DCC6" />}
                            />

                            <View style={styles.optionsRow}>
                                <View style={styles.rememberRow}>
                                    <View style={styles.checkbox}>
                                        <Ionicons name="checkmark" size={16} color="#160D08" />
                                    </View>
                                    <RNText style={styles.optionText}>Keep me logged in</RNText>
                                </View>
                                <Pressable hitSlop={8} onPress={onForgotPassword}>
                                    <RNText style={styles.forgotText}>Forgot Password?</RNText>
                                </Pressable>
                            </View>

                            <View style={styles.loginButton}>
                                <LoginButton
                                    title="Log In"
                                    onPress={() => onLogin(email.trim(), password)}
                                    disabled={!email.trim() || !password}
                                />
                            </View>

                            <View style={styles.socialLogin}>
                                <View style={styles.dividerLine} />
                                <Text variant="caption" color="#F8DCC6" style={styles.orText}>
                                    Or continue with
                                </Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <View style={styles.socialRow}>
                                {onGoogleSignIn ? <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" style={styles.socialButton} onPress={onGoogleSignIn}>
                                    <Ionicons name="logo-google" size={27} color="#4285F4" />
                                </Pressable> : null}
                                <View style={styles.socialButton}>
                                    <Ionicons name="logo-apple" size={27} color="#FFF0DF" />
                                </View>
                                <View style={styles.socialButton}>
                                    <Ionicons name="call" size={25} color="#F8DCC6" />
                                </View>
                            </View>
                            {googleSignInUnavailable && <Text variant="caption" color="#F8DCC6" style={styles.googleUnavailable}>Google sign-in is unavailable. Use email and password or configure Google sign-in for this platform.</Text>}

                            <Text variant="caption" color="#FFF0DF" style={styles.termsText}>
                                By continuing, you agree to our{' '}
                                <Text style={styles.termsLink}>Terms of Service</Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink}>Privacy Policy</Text>.
                            </Text>

                            <View style={styles.signupPrompt}>
                                <RNText style={styles.signupPromptText}>
                                    New to Chocolate?
                                </RNText>

                                <Pressable onPress={onCreateAccount}>
                                    <RNText style={styles.signupLink}>
                                        Create Account
                                    </RNText>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#160905' },
    background: { flex: 1, width: '100%' },
    scrollView: { flex: 1, backgroundColor: 'transparent' },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 28,
        paddingTop: 34,
        paddingBottom: 42,
    },
    content: {
        flex: 1,
        width: '100%'
    },
    topBar: {
        height: 28,
        justifyContent: 'center'
    },
    backButton: {
        width: 36,
        alignItems: 'flex-start'
    },

    heading: {
        alignItems: 'flex-start',
        marginTop: 240,
        marginBottom: 14,
    },

    title: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 46,
        lineHeight: 52,
        color: '#FFF0DF',
        textAlign: 'left',
    },
    form: { width: '100%', gap: 13 },
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 7,
    },
    rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    checkbox: {
        width: 21,
        height: 21,
        borderRadius: 5,
        backgroundColor: '#F8DCC6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#FFF0DF' },
    forgotText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        color: '#F8DCC6',
        textDecorationLine: 'underline',
    },
    loginButton: { marginTop: 2 },

    socialLogin: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },

    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(248,220,198,0.30)' },
    orText: {
        marginHorizontal: spacing.sm,
        fontFamily: 'Montserrat_500Medium',
        fontSize: 12,
        lineHeight: 18,
    },

    socialRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 5,
    },

    socialButton: {
        width: 58,
        height: 58,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 29,
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.24)',
        backgroundColor: 'rgba(35,19,13,0.92)',
    },
    googleUnavailable: { textAlign: 'center', marginTop: 10 },

    termsText: {
        marginTop: 26,
        width: '100%',
        textAlign: 'center',
        alignSelf: 'center',
        fontFamily: 'Montserrat_400Regular',
        fontSize: 11,
        lineHeight: 17,
        color: '#FFF0DF',
    },

    termsLink: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 11,
        lineHeight: 17,
        color: '#F8DCC6',
        textDecorationLine: 'underline',
    },
    signupPrompt: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        gap: 5,
    },

    signupPromptText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 11,
        color: '#FFF0DF',
    },

    signupLink: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 11,
        color: '#F8DCC6',
        textDecorationLine: 'underline',
    },
});
