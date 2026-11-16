import React, { useEffect, useRef, useState } from 'react';

import {
    Alert,
    BackHandler,
    Image,
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { VideoVerificationFlow } from '../components/VideoVerificationFlow';
import { Input } from '../components/Input';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ChemistryLogo } from '../components/ChemistryLogo';
import { GradientText } from '../components/GradientText';
import { Text } from '../components/Text';
import { colors, radii, spacing } from '../theme';

import { Button } from '../components/Button';

import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

import { RecordingButton } from '../components/RecordingButton';




type VerificationMethod = 'governmentId' | 'mobile' | 'card';

type AgeVerificationScreenProps = {
    onBack: () => void;
    onContinueToLogin: () => void;
};


export function AgeVerificationScreen({
    onBack,
    onContinueToLogin,
}: AgeVerificationScreenProps) {


    const [selectedMethod, setSelectedMethod] =
        useState<VerificationMethod>('governmentId');

    const [isModalVisible, setIsModalVisible] = useState(false);


    const [isEmailOtpStep, setIsEmailOtpStep] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');

    const [phoneNumber, setPhoneNumber] = useState('');

    const [isOtpStep, setIsOtpStep] = useState(false);
    const [otp, setOtp] = useState('');

    const [email, setEmail] = useState('');
    const [isEmailModal, setIsEmailModal] = useState(false);

    const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);

    const [isVideoVerificationCompleted, setIsVideoVerificationCompleted] = useState(false);

    const [isVideoVerificationFlowVisible, setIsVideoVerificationFlowVisible] = useState(false);


    const verificationMethods = [
        {
            id: 'governmentId' as const,
            title: 'Verify you phone number',
            subtitle: 'Get an OTP to comfirm your number.',
            icon: 'phone-portrait-outline' as const,
            color: '#F472B6',
            recommended: true,
        },
        {
            id: 'mobile' as const,
            title: 'Verify with Email Address',
            subtitle: 'Get a verfication link to confirm your email.',
            icon: 'mail-outline' as const,
            color: '#D879F9',
            recommended: false,
        },
        {
            id: 'card' as const,
            title: 'Verify with a Selfie',
            subtitle: 'Take a quick selfie to confirm you are a real person.',
            icon: 'person-circle-outline' as const,
            color: '#7CA7FF',
            recommended: false,
        },
    ];

    const handleContinue = () => {
        onContinueToLogin();
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

                {/* Branding Ends here */}

                {/* 18+ Verficaztion Sector */}


                <ScrollView
                    style={styles.contentScroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    bounces={false}
                    overScrollMode="never"
                >

                    <View style={styles.heading}>
                        <Text variant="heading1" style={styles.headingText}>
                            Let's Make It
                            <Text style={styles.ageText}> Real </Text>

                        </Text>

                        <Text variant="body" style={styles.description}>
                            Complete verfication to create your account.
                        </Text>
                    </View>

                    {/* 18+ Verficaztion Sector Ends*/}

                    {/* Hero Badge*/}

                    <View style={styles.hero}>
                        <Image
                            source={require('../assets/branding/atom-shield-badge.png')}
                            style={styles.shieldImage}
                            resizeMode="contain"
                        />
                    </View>


                    {/* Hero Badge Ends*/}


                    <Text variant="bodyLarge" style={styles.chooseTitle}>
                        Choose a verification method
                    </Text>

                    {/* Phonre Card */}

                    {/* ========================================= */}
                    {/* VERIFICATION CARDS — SHARED RENDERING     */}
                    {/* Phone, Email, and Selfie                  */}
                    {/* ========================================= */}

                    <View style={styles.methods}>
                        {verificationMethods.map((method) => {
                            const selected = selectedMethod === method.id;

                            return (
                                <Pressable
                                    key={method.id}

                                    // CARD BODY: Select and highlight only
                                    onPress={() => {
                                        setSelectedMethod(method.id);
                                    }}

                                    style={[
                                        styles.methodCard,
                                        selected && styles.methodCardSelected,
                                    ]}
                                >
                                    {/* CARD ICON */}
                                    <View
                                        style={[
                                            styles.methodIconBox,
                                            {
                                                borderColor: `${method.color}66`,
                                                backgroundColor: `${method.color}18`,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={method.icon}
                                            size={31}
                                            color={method.color}
                                        />
                                    </View>

                                    {/* CARD TITLE AND SUBTITLE */}
                                    <View style={styles.methodText}>
                                        <Text
                                            variant="body"
                                            style={styles.methodTitle}
                                        >
                                            {method.title}
                                        </Text>

                                        <Text
                                            variant="bodySmall"
                                            style={styles.methodSubtitle}
                                        >
                                            {method.subtitle}
                                        </Text>
                                    </View>

                                    {/* ================================= */}
                                    {/* PHONE CARD ARROW                  */}
                                    {/* Opens phone modal only            */}
                                    {/* ================================= */}
                                    {method.id === 'governmentId' && (
                                        <Pressable
                                            onPress={() => {
                                                setIsModalVisible(true);
                                                setIsOtpStep(false);
                                            }}
                                            hitSlop={10}
                                        >
                                            <Ionicons
                                                name="chevron-forward"
                                                size={27}
                                                color="#F02BBF"
                                            />
                                        </Pressable>
                                    )}

                                    {/* ================================= */}
                                    {/* EMAIL CARD ARROW                  */}
                                    {/* Opens email modal only            */}
                                    {/* ================================= */}
                                    {method.id === 'mobile' && (
                                        <Pressable
                                            onPress={() => {
                                                setIsEmailModalVisible(true);
                                                setIsEmailOtpStep(false);
                                            }}
                                            hitSlop={10}
                                        >
                                            <Ionicons
                                                name="chevron-forward"
                                                size={27}
                                                color="#F02BBF"
                                            />
                                        </Pressable>
                                    )}

                                    {/* ================================= */}
                                    {/* SELFIE CARD ARROW                 */}
                                    {/* No behavior change in this step   */}
                                    {/* ================================= */}

                                    {method.id === 'card' && (
                                        <Pressable
                                            onPress={() => {
                                                setSelectedMethod(method.id);
                                                setIsVideoVerificationFlowVisible(true);
                                            }}
                                            hitSlop={10}
                                        >
                                            <Ionicons
                                                name="chevron-forward"
                                                size={27}
                                                color="#F02BBF"
                                            />
                                        </Pressable>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>


                    {/* Continue Button */}
                    <View style={styles.continueButton}>
                        <Button
                            title="Continue"
                            variant="primary"
                            disabled={!isVideoVerificationCompleted}
                            onPress={handleContinue}
                        />
                    </View>

                    {/* Continue Button ends */}


                    <View style={styles.privacy}>
                        <Ionicons
                            name="lock-closed"
                            size={21}
                            color="#A5A8C2"
                        />
                        <Text variant="caption" style={styles.privacyText}>
                            Your information is used only for verification
                            and is kept secure and private.
                        </Text>
                    </View>
                </ScrollView>

                {/* Video Verification Flow */}
                <VideoVerificationFlow
                    visible={isVideoVerificationFlowVisible}
                    onComplete={(videoUri) => {
                        setIsVideoVerificationCompleted(true);
                        setIsVideoVerificationFlowVisible(false);
                    }}
                    onClose={() => setIsVideoVerificationFlowVisible(false)}
                />

                {/* Phone Verify Modal*/}
                <Modal
                    visible={isModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>


                            <Text style={styles.modalTitle}>
                                Verify Your{' '}
                                <Text style={styles.modalTitlePink}>
                                    {isEmailModal ? 'Email' : 'Phone'}
                                </Text>
                            </Text>



                            {/* Is OTP False */}

                            {!isOtpStep && (
                                <>
                                    <Text style={styles.modalSubtitle}>
                                        Enter your mobile number.
                                    </Text>


                                    {/* Phone Input Ends */}
                                    <View style={styles.phoneInputRow}>
                                        <View style={styles.phoneNumberField}>
                                            <Input
                                                placeholder="Mobile number"
                                                value={phoneNumber}
                                                onChangeText={setPhoneNumber}
                                                keyboardType="phone-pad"
                                                maxLength={10}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                icon={
                                                    <Text style={styles.countryCodeText}>
                                                        +91
                                                    </Text>
                                                }
                                            />
                                        </View>
                                    </View>

                                    {/* Phone Input Ends*/}

                                    {/* Send OTP button */}


                                    <View style={styles.sendOtpButton}>
                                        <Button
                                            title="Send OTP"
                                            variant="primary"
                                            disabled={!/^[6-9]\d{9}$/.test(phoneNumber)}
                                            onPress={() => {
                                                setOtp('');
                                                setIsOtpStep(true);
                                            }}
                                        />
                                    </View>

                                    {/* Send OTP button Ends */}
                                </>
                            )}

                            {isOtpStep && (
                                <>
                                    <Text style={styles.modalSubtitle}>
                                        Enter the 6-digit code.
                                    </Text>

                                    <View style={styles.otpInputField}>
                                        <Input
                                            placeholder="Enter OTP"
                                            value={otp}
                                            onChangeText={setOtp}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>



                                    <View style={styles.sendOtpButton}>
                                        <Button
                                            title="Verify OTP"
                                            variant="primary"
                                            disabled={!/^\d{6}$/.test(otp)}
                                            onPress={() => { }}
                                        />
                                    </View>


                                    <View style={styles.otpActionsRow}>
                                        <Pressable
                                            onPress={() => {
                                                setIsOtpStep(false);
                                                setOtp('');
                                            }}
                                            style={styles.otpAction}
                                        >
                                            <Text style={styles.otpBackButtonText}>
                                                Try Again
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => { }}
                                            style={styles.otpAction}
                                        >
                                            <Text style={styles.otpBackButtonText}>
                                                Resend Otp
                                            </Text>
                                        </Pressable>
                                    </View>

                                </>
                            )}



                            <Pressable
                                onPress={() => setIsModalVisible(false)}
                                style={styles.modalClose}
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color="#F8F4F0"
                                />
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                {/* Phone Modal End */}


                {/* Email Verification Modal */}
                <Modal
                    visible={isEmailModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsEmailModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>


                            <Text style={styles.modalTitle}>
                                Verify Your{' '}
                                <Text style={styles.modalTitlePink}>Email</Text>
                            </Text>




                            {!isEmailOtpStep ? (
                                <>
                                    <Text style={styles.modalSubtitle}>
                                        Enter your email address.
                                    </Text>

                                    <View style={styles.otpInputField}>
                                        <Input
                                            placeholder="Email address"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={styles.sendOtpButton}>
                                        <Button
                                            title="Send Email OTP"
                                            variant="primary"
                                            disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                                            onPress={() => {
                                                setEmailOtp('');
                                                setIsEmailOtpStep(true);
                                            }}
                                        />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.modalSubtitle}>
                                        Enter the 6-digit code sent to your email.
                                    </Text>

                                    <View style={styles.otpInputField}>
                                        <Input
                                            placeholder="Enter Email OTP"
                                            value={emailOtp}
                                            onChangeText={setEmailOtp}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={styles.sendOtpButton}>
                                        <Button
                                            title="Verify Email OTP"
                                            variant="primary"
                                            disabled={!/^\d{6}$/.test(emailOtp)}
                                            onPress={() => {
                                                // Real email OTP verification will be connected later.
                                            }}
                                        />
                                    </View>

                                    <View style={styles.otpActionsRow}>
                                        <Pressable
                                            onPress={() => {
                                                setIsEmailOtpStep(false);
                                                setEmailOtp('');
                                            }}
                                            style={styles.otpAction}
                                        >
                                            <Text style={styles.otpBackButtonText}>
                                                Try Again
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            onPress={() => { }}
                                            style={styles.otpAction}
                                        >
                                            <Text style={styles.otpBackButtonText}>
                                                Resend Otp
                                            </Text>
                                        </Pressable>
                                    </View>
                                </>
                            )}


                            <Pressable
                                onPress={() => setIsEmailModalVisible(false)}
                                style={styles.modalClose}
                            >
                                <Ionicons name="close" size={24} color="#F8F4F0" />
                            </Pressable>


                        </View>
                    </View>
                </Modal>


                {/* Email Modal Closing */}

            </ImageBackground >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.midnight,
    },
    background: {
        flex: 1,
    },

    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(7, 5, 18, 0.38)',
    },



    // Branding 

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
        marginTop: -12,
        fontSize: 11,
        letterSpacing: 0.5,
    },

    // Branding Ends

    // 18+ Sector

    scrollContent: {
        paddingTop: 150,
        paddingHorizontal: 0,
        paddingBottom: 40,
    },

    contentScroll: {
        flex: 1,
        transform: [{ scale: 0.90 }],

    },

    heading: {
        alignItems: 'center',
    },

    headingText: {
        fontSize: 45,
        lineHeight: 40,
        textAlign: 'center',
        fontFamily: 'CormorantGaramond_600SemiBold',
        color: colors.ivory,
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
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.8,
        fontFamily: 'Montserrat_400Regular',
        color: '#C7CBD9',
    },
    // 18+ Ends

    // Hero Badge 


    hero: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        marginBottom: 14,
        height: 145,
    },

    shieldImage: {
        width: 320,
        height: 170,
    },

    // Badge Ends
    // Cards Section
    chooseTitle: {
        marginTop: 4,
        marginBottom: 8,
        color: '#C7CBD9',
        fontSize: 14,
        lineHeight: 23,
        letterSpacing: 1,
        fontFamily: 'Montserrat_400Regular',
    },

    methods: {
        gap: 10,
    },

    methodCard: {
        minHeight: 91,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.38)',
        backgroundColor: 'rgba(8,7,20,0.78)',
    },

    methodCardSelected: {
        borderColor: '#F472B6',
        backgroundColor: 'rgba(55,20,65,0.65)',
    },

    methodIconBox: {
        width: 60,
        height: 60,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    methodText: {
        flex: 1,
        gap: 4,
    },

    methodTitle: {
        color: colors.ivory,
        fontSize: 14,
        fontFamily: 'Montserrat_500Medium',
    },

    methodSubtitle: {
        color: '#A7ABC3',
        fontSize: 11,
        lineHeight: 16,
    },

    recommended: {
        position: 'absolute',
        right: 10,
        top: -15,
        borderRadius: 20,
        overflow: 'hidden',
    },

    recommendedGradient: {
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    recommendedText: {
        color: '#170B24',
        fontSize: 9,
        fontFamily: 'Montserrat_700Bold',
    },

    continueButton: {
        marginTop: spacing.md,
        borderRadius: 40,
        overflow: 'hidden',
    },

    privacy: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 22,
        paddingHorizontal: 10,
    },
    privacyText: {
        flex: 1,
        textAlign: 'center',
        color: '#A7ABC3',
        fontSize: 11,
        lineHeight: 18,
    },


    // Modal

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(7, 5, 18, 0.72)',
    },

    modalCard: {
        width: '90%',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
        borderRadius: radii.md,
        backgroundColor: 'rgba(8, 7, 20, 0.80)',
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.30)',
    },

    modalTitle: {
        fontFamily: 'CormorantGaramond_500Medium',
        fontSize: 35,
        lineHeight: 40,
        color: colors.ivory,
        marginTop: spacing.md,
    },

    modalTitlePink: {
        color: '#F472B6',
        fontFamily: 'CormorantGaramond_500Medium',
        fontSize: 35,
        lineHeight: 40,
    },


    modalSubtitle: {
        marginTop: spacing.sm,
        color: 'rgba(248, 244, 240, 0.72)',
        fontSize: 13,
        lineHeight: 20,
    },

    modalClose: {
        position: 'absolute',
        top: 12,
        right: 12,
        padding: 6,
        zIndex: 1,
    },


    phoneInput: {
        width: '100%',
        height: 52,
        marginTop: spacing.xl,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.55)',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        color: colors.ivory,
        fontSize: 16,
    },

    phoneInputRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
    },

    countryCode: {
        height: 40,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9.5,
        borderWidth: 1,
        borderColor: 'rgba(199, 203, 217, 0.23)',
        backgroundColor: 'rgba(16, 11, 22, 0.72)',
    },

    countryCodeText: {
        color: colors.ivory,
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
    },

    phoneNumberField: {
        flex: 1,
    },


    sendOtpButton: {
        width: '100%',
        marginTop: spacing.lg,
    },


    otpBackButton: {
        alignSelf: 'center',
        marginTop: spacing.md,
        paddingVertical: spacing.xs,
    },

    otpBackButtonText: {
        color: '#F472B6',
        fontSize: 12,
        fontFamily: 'Montserrat_400Regular',
    },

    otpActionsRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
        gap: spacing.md,
        marginBottom: -10,


    },

    otpAction: {
        paddingVertical: spacing.xs,
    },


    otpInputField: {
        width: '100%',
        marginTop: spacing.md,
    },

    // Modal Video Verfication

    // CHEMISTREE LIVE — Full-screen introduction
    selfieModalRoot: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: spacing.lg,
        paddingTop: 60,
        paddingBottom: 28,
    },

    selfieClose: {
        position: 'absolute',
        top: 54,
        left: spacing.lg,
        zIndex: 2,
        padding: spacing.xs,
    },

    selfieHeader: {
        alignItems: 'center',
        marginTop: spacing.sm,
    },


    selfieHeaderTitle: {
        color: '#171321',
        textAlign: 'center',
    },

    selfieHeaderPink: {
        color: '#F02BBF',
    },

    selfieHeaderSubtitle: {
        color: '#686477',
        marginTop: spacing.xs,
        textAlign: 'center',
    },


    selfieContent: {
        flex: 1,
        justifyContent: 'center',
        alignSelf: 'stretch',
        paddingTop: 0,
        paddingHorizontal: spacing.xs,
    },


    selfieAssistantOrb: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(167, 139, 250, 0.13)',
        borderWidth: 2,
        borderColor: 'rgba(244, 114, 182, 0.65)',
        marginBottom: spacing.lg,
    },

    selfieTitle: {
        color: '#171321',
        textAlign: 'center',
        marginBottom: spacing.md,
    },

    selfieDescription: {
        color: '#555166',
        textAlign: 'center',
        lineHeight: 23,
        marginBottom: spacing.xxl,
        paddingHorizontal: spacing.xs,
    },


    selfieInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },

    selfieInfoText: {
        flex: 1,
        gap: spacing.xs,
    },

    selfieInfoTitle: {
        color: '#252033',

    },

    selfieInfoSubtitle: {
        color: '#625D73',

    },

    selfieActions: {
        gap: spacing.sm,
    },

    selfieNotNow: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
    },

    selfieNotNowText: {
        color: '#E91EAA',

    },

    // >>> CV02-STYLES: CAMERA PERMISSION — START
    cameraPermissionRoot: {
        flex: 1,
        backgroundColor: colors.midnight,
        paddingHorizontal: spacing.lg,
        paddingTop: 72,
        paddingBottom: 28,
        justifyContent: 'space-between',
    },

    cameraPermissionClose: {
        position: 'absolute',
        top: 48,
        left: spacing.lg,
        zIndex: 2,
        padding: spacing.xs,
    },

    cameraPermissionHeader: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },

    cameraPermissionEyebrow: {
        color: '#D879F9',
        letterSpacing: 1.2,
        marginBottom: spacing.md,
        textAlign: 'center',
    },

    cameraPermissionTitle: {
        color: colors.ivory,
        textAlign: 'center',
        marginBottom: spacing.md,
    },

    cameraPermissionDescription: {
        color: '#C7CBD9',
        textAlign: 'center',
        lineHeight: 23,
    },

    cameraPermissionVisual: {
        alignItems: 'center',
        paddingHorizontal: spacing.md,
    },

    cameraPermissionOuterRing: {
        width: 172,
        height: 172,
        borderRadius: 86,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(244, 114, 182, 0.45)',
        backgroundColor: 'rgba(167, 139, 250, 0.07)',
        marginBottom: spacing.xl,
    },

    cameraPermissionInnerCircle: {
        width: 126,
        height: 126,
        borderRadius: 63,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(244, 114, 182, 0.65)',
        backgroundColor: 'rgba(167, 139, 250, 0.13)',
    },

    cameraPermissionVisualTitle: {
        color: colors.ivory,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },

    cameraPermissionVisualText: {
        color: '#A7ABC3',
        textAlign: 'center',
        lineHeight: 20,
    },

    cameraPermissionPrivacy: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(167, 139, 250, 0.3)',
        borderRadius: radii.md,
        backgroundColor: 'rgba(167, 139, 250, 0.07)',
    },

    cameraPermissionPrivacyText: {
        flex: 1,
        gap: spacing.xs,
    },

    cameraPermissionPrivacyTitle: {
        color: colors.ivory,
    },

    cameraPermissionPrivacyBody: {
        color: '#A7ABC3',
        lineHeight: 19,
    },

    cameraPermissionActions: {
        gap: spacing.md,
    },
    // <<< CV02-STYLES: CAMERA PERMISSION — END

    // >>> CV02-STYLES: CAMERA PERMISSION POPUP — START



    cameraPermissionOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: 'rgba(15, 10, 28, 0.85)',
        zIndex: 10,
    },



    cameraPermissionCard: {
        width: '90%',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xl,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E4F5',
    },



    cameraPermissionIcon: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEE5FF',
        marginBottom: spacing.md,
    },

    cameraPermissionPopupTitle: {
        color: '#171321',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 23,
        fontFamily: 'Montserrat_600SemiBold',
        marginBottom: spacing.md,
    },

    cameraPermissionPopupDescription: {
        color: '#625D73',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.lg,
    },



    cameraPermissionPopupActions: {
        width: '100%',
        gap: spacing.sm,
    },

    cameraPermissionNotNow: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
    },
    cameraPermissionNotNowText: {
        color: '#E91EAA',
    },

    // <<< CV02-STYLES: CAMERA PERMISSION POPUP — END

    // >>> CV03-STYLES: CAMERA READY — START
    cv03Root: {
        flex: 1,
        backgroundColor: colors.midnight,
        paddingTop: 60,
        paddingBottom: 28,
    },

    cv03Header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },

    cv03BackButton: {
        position: 'absolute',
        left: spacing.lg,
        zIndex: 2,
        padding: spacing.xs,
    },

    cv03HeaderText: {
        alignItems: 'center',
    },

    cv03Brand: {
        color: colors.ivory,
        textAlign: 'center',
    },

    cv03BrandPink: {
        color: '#F472B6',
    },

    cv03Subtitle: {
        color: '#A7ABC3',
        marginTop: spacing.xs,
        textAlign: 'center',
    },

    cv03CameraContainer: {
        flex: 1,
        minHeight: 260,
        marginHorizontal: spacing.lg,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: '#080714',
        borderWidth: 1,
        borderColor: 'rgba(244, 114, 182, 0.65)',
    },

    cv03Camera: {
        ...StyleSheet.absoluteFill,
    },

    cv03FaceGuideContainer: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },

    cv03FaceGuide: {
        width: '68%',
        height: '68%',
        borderWidth: 2,
        borderColor: '#F472B6',
        borderRadius: 999,
        backgroundColor: 'transparent',
    },

    cv03CameraInstruction: {
        position: 'absolute',
        bottom: 18,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radii.md,
        backgroundColor: 'rgba(8, 7, 20, 0.78)',
    },

    cv03InstructionText: {
        color: colors.ivory,
        textAlign: 'center',
        flexShrink: 1,
    },

    cv03Bottom: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        alignItems: 'center',
    },

    cv03Title: {
        color: colors.ivory,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },

    cv03Description: {
        color: '#C7CBD9',
        textAlign: 'center',
        lineHeight: 22,
    },

    cv03Status: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
    },

    cv03StatusText: {
        color: '#C7CBD9',
    },
    // <<< CV03-STYLES: CAMERA READY — END


    // >>> CV04-STYLES: AI ORB ASSISTANT — START
    cv04Root: {
        flex: 1,
        backgroundColor: '#100B16',
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 16,
    },
    cv04Header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
    },
    cv04BackButton: {
        padding: 6,
    },
    cv04Brand: {
        color: '#F8F4F0',
        fontSize: 20,
        fontWeight: '700',
    },
    cv04Pink: {
        color: '#F472B6',
    },
    cv04Subtitle: {
        color: '#B9AABD',
        marginTop: 3,
    },

    cv04CameraContainer: {
        height: 235,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F472B6',
        position: 'relative',
        backgroundColor: '#00FF00', // TEMPORARY TEST
    },

    cv04Camera: {
        flex: 1,
    },
    cv04RecordingSection: {
        marginTop: 10,
        marginBottom: 2,
        gap: 6,
    },
    cv04RecordingButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    cv04RecordingButton: {
        flex: 1,
        minHeight: 42,
        borderRadius: 22,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        borderWidth: 1,
    },
    cv04StartRecordingButton: {
        backgroundColor: '#B91C55',
        borderColor: '#F472B6',
    },
    cv04StopRecordingButton: {
        backgroundColor: '#38233F',
        borderColor: '#A78BFA',
    },
    cv04RecordingButtonDisabled: {
        opacity: 0.42,
    },
    cv04RecordingButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
    },
    cv04RecordingStatus: {
        color: '#C7CBD9',
        textAlign: 'center',
    },
    cv04RecordingSaved: {
        color: '#86EFAC',
        textAlign: 'center',
    },
    cv04FaceGuideContainer: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cv04FaceGuide: {
        width: '58%',
        height: '88%',
        borderWidth: 2,
        borderColor: '#F472B6',
        borderRadius: 100,
    },
    cv04CameraBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: 'rgba(16,11,22,0.8)',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
    },
    cv04LiveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#F472B6',
    },
    cv04LiveText: {
        color: '#FFFFFF',
    },
    cv04OrbSection: {
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 14,
    },
    cv04OrbOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#F472B6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cv04OrbMiddle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        padding: 4,
        backgroundColor: '#4B164C',
    },
    cv04Orb: {
        flex: 1,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cv04AssistantTitle: {
        color: '#F8F4F0',
        textAlign: 'center',
        marginBottom: 5,
    },
    cv04AssistantDescription: {
        color: '#B9AABD',
        textAlign: 'center',
    },

    cv04QuestionCard: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: 0,
        paddingHorizontal: 0,
        paddingVertical: 12,
        gap: 12,
    },

    cv04QuestionText: {
        color: '#FFFFFF',
    },

    cv04QuestionCounter: {
        color: '#F472B6',
    },

    cv04QuestionLabel: {
        color: '#F472B6',
        letterSpacing: 1,
    },
    cv04Question: {
        color: '#F8F4F0',
        marginBottom: 4,
    },
    // <<< CV04-STYLES: AI ORB ASSISTANT — END



    // >>> UNIFIED CAMERA STYLES
    unifiedCameraRoot: {
        ...StyleSheet.absoluteFill,
        backgroundColor: '#080714',
        overflow: 'hidden',
    },

    cv03ReferenceOverlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'transparent',
    },

    cv03Close: {
        position: 'absolute',
        top: 18,
        left: 18,
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 14, 25, 0.78)',
        zIndex: 5,
    },

    cv03Flash: {
        position: 'absolute',
        top: 18,
        right: 18,
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 14, 25, 0.78)',
        zIndex: 5,
    },

    cv03Corners: {
        position: 'absolute',
        top: '20%',
        left: '10%',
        right: '10%',
        height: '34%',
    },

    faceCorner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#FFFFFF',
    },

    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 7,
    },

    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 7,
    },

    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 7,
    },

    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 7,
    },


    cv03InstructionCard: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 105,
        paddingHorizontal: 18,
        paddingTop: 17,
        paddingBottom: 14,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0E4F5',
        gap: 10,
    },

    cv03ReferenceTitle: {
        color: '#171321',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 2,
    },

    cv03InstructionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    cv03InstructionIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },

    cv03ReferenceText: {
        color: '#625D73',
        fontSize: 12,
        flexShrink: 1,
    },

    cv03ReadyButton: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 40,
        height: 52,
        borderRadius: 28,
    },


    cv03ReadyButtonText: {
        color: '#160818',
        fontSize: 14,
        fontWeight: '800',
    },


    cv04UnifiedOverlay: {
        ...StyleSheet.absoluteFill,
        paddingHorizontal: 18,
        paddingTop: 0,
        paddingBottom: 28,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
    },


    cv04UnifiedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },

    cv04UnifiedSpacer: {
        flex: 1,
    },

    cv04UnifiedBottom: {
        width: '100%',
        gap: 8,
        marginTop: 'auto',
        paddingBottom: 8,
    },

    // <<< UNIFIED CAMERA STYLES


    aiBotImage: {
        width: 140,
        height: 140,
        alignSelf: 'center',
        marginBottom: 12,
    },



    cv04RecordControlSection: {
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },

    cv04RecordCircle: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: '#E11D48',
        borderWidth: 4,
        borderColor: '#FDA4AF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },

    cv04RecordCircleActive: {
        backgroundColor: '#BE123C',
        borderColor: '#FB7185',
        transform: [{ scale: 1.05 }],
    },



    cv04TopIntro: {
        position: 'absolute',
        top: 64,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 2,
        gap: 10,
    },


    cv04MessageRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },

    cv04BotFace: {
        width: 52,
        height: 52,
    },

    cv04MessageBox: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#F0E4F5',
    },

    cv04TypewriterText: {
        color: '#171321',
        fontSize: 14,
        lineHeight: 21,
        fontFamily: 'Courier',
    },

    cv04BlinkingCursor: {
        color: '#9333EA',
        fontFamily: 'Courier',
        fontWeight: '700',
    },

    cv04ChallengeInstruction: {
        color: '#171321',
        fontSize: 13,
        lineHeight: 20,
        fontFamily: 'Courier',
    },


    cv04ChallengeSentence: {
        color: '#171321',
        fontWeight: '700',
    },





});
