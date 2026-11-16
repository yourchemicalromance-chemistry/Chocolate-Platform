
import React, { useEffect, useRef, useState } from 'react';

import {
    Animated,
    StyleSheet,
    View,
    Image,
} from 'react-native';

import { changeAppLanguage } from '../localization';
import { useTranslation } from 'react-i18next';

// import { VideoView, useVideoPlayer } from 'expo-video';

import { ChocolateLogo } from '../components/ChocolateLogo/ChocolateLogo';
import { ChocolateFeatures } from '../components/ChocolateLandingFeatures/ChocolateFeatures';
import { ChocolateButton } from '../components/Button/ChocolateButton';

import { Ionicons } from '@expo/vector-icons';
import { Text as RNText, Pressable } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import i18n from '../localization';

type ChocolateLandingScreenProps = {
    onCreateAccount: () => void;
    onLogin: () => void;
    isLoginTransitioning?: boolean;
};

export function ChocolateLandingScreen({
    onCreateAccount,
    onLogin,
    isLoginTransitioning = false,
}: ChocolateLandingScreenProps) {

    const { t } = useTranslation();

    const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'Hindi' },
        { code: 'bn', label: 'Bengali' },
        { code: 'mr', label: 'Marathi' },
        { code: 'ta', label: 'Tamil' },
        { code: 'te', label: 'Telugu' },
        { code: 'gu', label: 'Gujarati' },
        { code: 'pa', label: 'Punjabi' },
        { code: 'kn', label: 'Kannada' },
        { code: 'ml', label: 'Malayalam' },
    ];

    const selectLanguage = async (code: string) => {
        await changeAppLanguage(code);
        setLanguageMenuVisible(false);
    };

    const brandingTranslateY = useRef(
        new Animated.Value(0)
    ).current;

    const landingButtonsOpacity = useRef(
        new Animated.Value(1)
    ).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(brandingTranslateY, {
                toValue: isLoginTransitioning ? -100 : 0,
                duration: 650,
                useNativeDriver: true,
            }),

            Animated.timing(landingButtonsOpacity, {
                toValue: isLoginTransitioning ? 0 : 1,
                duration: isLoginTransitioning ? 350 : 260,
                useNativeDriver: true,
            }),
        ]).start();

    }, [
        isLoginTransitioning,
        brandingTranslateY,
        landingButtonsOpacity,
    ]);
    
    {/*

    const player = useVideoPlayer(
        require('../assets/background/LandingPageBG.mp4'),
        (player) => {
            player.loop = true;
            player.muted = true;
            player.play();
        }
    ); */}

    return (
        <View style={styles.container}>

            <View style={styles.languageSelector}>
                <Pressable
                    style={styles.languageTrigger}
                    onPress={() => setLanguageMenuVisible(!languageMenuVisible)}
                >
                    <Ionicons name="globe-outline" size={18} color="#542719" />
                    <RNText style={styles.languageTriggerText}>
                        {languages.find(lang => lang.code === i18n.language)?.label ?? 'Hindi'}
                    </RNText>
                    <Ionicons name="chevron-down" size={16} color="#542719" />
                </Pressable>

                {languageMenuVisible && (
                    <View style={styles.languageDropdown}>
                        {languages.map(language => (
                            <Pressable
                                key={language.code}
                                style={styles.languageOption}
                                onPress={() => selectLanguage(language.code)}
                            >
                                <RNText style={styles.languageOptionText}>
                                    {language.label}
                                </RNText>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>

            {/*

            <VideoView
                player={player}
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '-5%',
                    width: '110%',
                    transform: [
                        { translateX: 20 },
                        { translateY: -100 },
                    ],
                }}
                contentFit="cover"
                nativeControls={false}
            //surfaceType="textureView"
            />  */}
            {/*
            <Image
                source={require('../assets/branding/Overlay-bg.png')}
                style={StyleSheet.absoluteFill}
                resizeMode="stretch"
            /> */}

            <Image
                source={require('../assets/background/Landing-Cinematic.png')}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '68%',
                }}
                resizeMode="cover"
            />

            <View
                pointerEvents="none"
                style={styles.backgroundOverlay}
            />

            <LinearGradient
                colors={[
                    'rgba(255,230,210,0)',
                    'rgba(255,230,210,0.72)',
                    '#FFE6D2',
                    '#F8DCC6',
                    '#F2C9A8',
                ]}
                locations={[0, 0.16, 0.38, 0.68, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.champagnePanel}
            />


            <View style={styles.content}>

                <Animated.View
                    style={[
                        styles.branding,
                        { transform: [{ translateY: brandingTranslateY }] },
                    ]}
                >

                    <View style={styles.logo}>
                        <ChocolateLogo size={300} />
                    </View>

                    <View style={styles.taglineContainer}>
                        <Animated.Text style={styles.tagline}>
                            {t('brand.tagline')}
                        </Animated.Text>
                    </View>

                </Animated.View>

                <View style={styles.features}>
                    <ChocolateFeatures />
                </View>

                <Animated.View
                    style={[
                        styles.actions,
                        { opacity: landingButtonsOpacity },
                    ]}
                    pointerEvents={isLoginTransitioning ? 'none' : 'auto'}
                >

                    <Pressable
                        onPress={onCreateAccount}
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
                                Create Account
                            </RNText>
                        </LinearGradient>
                    </Pressable>

                    <ChocolateButton
                        title="Log In"
                        variant="secondary"
                        onPress={onLogin}
                    />


                    {/* Social Login Divider */}

                    <View style={styles.socialHeading}>
                        <View style={styles.divider} />

                        <RNText style={styles.socialTitle}>
                            Or continue with
                        </RNText>

                        <View style={styles.divider} />
                    </View>

                    {/* Social Login Buttons */}

                    <View style={styles.socialButtons}>

                        <Pressable style={styles.socialButton}>
                            <Ionicons name="logo-google" size={26} color="#4285F4" />
                        </Pressable>

                        <Pressable style={styles.socialButton}>
                            <Ionicons name="logo-apple" size={26} color="#17120F" />
                        </Pressable>

                        <Pressable style={styles.socialButton}>
                            <Ionicons name="call" size={23} color="#542719" />
                        </Pressable>

                    </View>

                    {/* Legal Footer 

                    <RNText style={styles.legalText}>
                        By continuing, you agree to our{' '}
                        <RNText style={styles.legalLink}>
                            Terms of Service
                        </RNText>
                        {'\n'}and{' '}
                        <RNText style={styles.legalLink}>
                            Privacy Policy
                        </RNText>.
                    </RNText>
                    */}

                </Animated.View>

            </View>



        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F8DCC6',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    content: {
        paddingHorizontal: 24,
        paddingTop: 55,
        paddingBottom: 35,
        alignItems: 'center',
        transform: [{ translateY: 35 }],
    },

    champagnePanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '68%',
    },

    taglineContainer: {
        marginTop: -15,
    },

    tagline: {
        fontFamily: 'CormorantGaramond_600SemiBold',
        fontSize: 23,
        color: '#4B2017',
        textAlign: 'center',
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

    actions: {
        width: '95%',
        marginTop: 24,
        gap: 10,
    },

    features: {
        marginTop: 24,
        width: '100%',
    },

    logo: {
        transform: [{ translateY: 50 }],
    },

    branding: {
        alignItems: 'center',
    },



    // social
    socialHeading: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 18,
    },

    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(84, 39, 25, 0.25)',

    },

    socialTitle: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 13,
        color: '#542719',

    },

    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 26,
        marginTop: 12,
    },

    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFF1E8',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },


    legalText: {
        fontFamily: 'Montserrat_400Regular',
        fontSize: 10,
        lineHeight: 17,
        color: '#704537',
        textAlign: 'center',
        marginTop: 14,
    },

    legalLink: {
        fontFamily: 'Montserrat_700Bold',
        color: '#542719',
        textDecorationLine: 'underline',
    },

    // language 
    languageSelector: {
        position: 'absolute',
        top: 55,
        right: 20,
        zIndex: 100,
        alignItems: 'flex-end',
    },

    languageTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: '#F4DFC3',
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 22,
        elevation: 4,
    },

    languageTriggerText: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 12,
        color: '#542719',
    },

    languageDropdown: {
        marginTop: 8,
        width: 155,
        backgroundColor: '#FFF4E5',
        borderRadius: 14,
        paddingVertical: 5,
        elevation: 8,
    },

    languageOption: {
        paddingVertical: 11,
        paddingHorizontal: 15,
    },

    languageOptionText: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 13,
        color: '#542719',
    },

    backgroundOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(35, 12, 5, 0)',
    },

});
