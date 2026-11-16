import React, { useState } from 'react';

import {

    ImageBackground,

    Modal,

    Pressable,

    ScrollView,

    StyleSheet,

    View,

} from 'react-native';

import { VideoVerificationFlow } from './ChocolateVideoVerificationFlow';

import { Input } from '../../components/Input';

import { Text } from '../../components/Text';

import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import { LoginButton } from '../components/Button/LoginButton';

import { radii, spacing } from '../../theme';

type VerificationMethod = 'governmentId' | 'mobile' | 'card';

type AgeVerificationScreenProps = {

    onBack: () => void;

    onContinueToLogin: () => void;

};

const CHOCOLATE = '#3B211B';

const IVORY = '#FFF4E5';

const CARAMEL = '#D9A879';

export function ChocolateAgeVerificationScreen({

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

    const [isVideoVerificationCompleted, setIsVideoVerificationCompleted] =

        useState(false);

    const [isVideoVerificationFlowVisible, setIsVideoVerificationFlowVisible] =

        useState(false);

    const verificationMethods = [

        {

            id: 'governmentId' as const,

            title: 'Verify your phone number',

            subtitle: 'Get an OTP to confirm your number.',

            icon: 'phone-portrait-outline' as const,

        },

        {

            id: 'mobile' as const,

            title: 'Verify with Email Address',

            subtitle: 'Get a verification link to confirm your email.',

            icon: 'mail-outline' as const,

        },

        {

            id: 'card' as const,

            title: 'Verify with a Selfie',

            subtitle: 'Take a quick selfie to confirm you are a real person.',

            icon: 'person-circle-outline' as const,

        },

    ];

    const handleContinue = () => {

        onContinueToLogin();

    };

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

                    style={styles.contentScroll}

                    contentContainerStyle={styles.scrollContent}

                    showsVerticalScrollIndicator={false}

                    keyboardShouldPersistTaps="handled"

                    bounces={false}

                >

                    <View style={styles.content}>

                        {/* Heading — follows the Chocolate Login screen */}

                        <View style={styles.heading}>

                            <Text style={styles.headingText}>

                                Let's Make It <Text style={styles.ageText}>Real</Text>

                            </Text>

                            <Text style={styles.description}>

                                Complete verification to create your account.

                            </Text>

                        </View>

                        {/* Verification methods */}

                        <View style={styles.chooseHeading}>

                            <View style={styles.chooseLine} />

                            <Text style={styles.chooseTitle}>Choose a verification method</Text>

                            <View style={styles.chooseLine} />

                        </View>

                        <View style={styles.methods}>

                            {verificationMethods.map((method) => {

                                const selected = selectedMethod === method.id;

                                return (

                                    <Pressable

                                        key={method.id}

                                        onPress={() => setSelectedMethod(method.id)}

                                        style={[

                                            styles.methodCard,

                                            selected && styles.methodCardSelected,

                                        ]}

                                    >

                                        <LinearGradient
                                            colors={
                                                selected
                                                    ? ['rgba(59,31,20,0.98)', 'rgba(42,20,12,0.98)', 'rgba(29,14,8,0.98)']
                                                    : ['rgba(42,22,13,0.96)', 'rgba(29,14,8,0.97)', 'rgba(22,9,5,0.98)']
                                            }
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={[StyleSheet.absoluteFill, { borderRadius: 25 }]}
                                            pointerEvents="none"
                                        />

                                        <View style={styles.methodIconBox}>

                                            <Ionicons

                                                name={method.icon}

                                                size={25}

                                                color="#542719"

                                            />

                                        </View>

                                        <View style={styles.methodText}>

                                            <Text style={styles.methodTitle}>{method.title}</Text>

                                            <Text style={styles.methodSubtitle}>{method.subtitle}</Text>

                                        </View>

                                        {method.id === 'governmentId' && (

                                            <Pressable

                                                onPress={() => {

                                                    setIsModalVisible(true);

                                                    setIsOtpStep(false);

                                                }}

                                                hitSlop={10}

                                                style={styles.methodArrow}

                                            >

                                                <Ionicons name="chevron-forward" size={25} color="#E9C69F" />

                                            </Pressable>

                                        )}

                                        {method.id === 'mobile' && (

                                            <Pressable

                                                onPress={() => {

                                                    setIsEmailModalVisible(true);

                                                    setIsEmailOtpStep(false);

                                                }}

                                                hitSlop={10}

                                                style={styles.methodArrow}

                                            >

                                                <Ionicons name="chevron-forward" size={25} color="#E9C69F" />

                                            </Pressable>

                                        )}

                                        {method.id === 'card' && (

                                            <Pressable

                                                onPress={() => {

                                                    setSelectedMethod(method.id);

                                                    setIsVideoVerificationFlowVisible(true);

                                                }}

                                                hitSlop={10}

                                                style={styles.methodArrow}

                                            >

                                                <Ionicons name="chevron-forward" size={25} color="#E9C69F" />

                                            </Pressable>

                                        )}

                                    </Pressable>

                                );

                            })}

                        </View>

                        {/* Continue */}

                        <View style={styles.continueButton}>
                            <LoginButton
                                title="Verify & Continue"
                                onPress={handleContinue}
                                disabled={!isVideoVerificationCompleted}
                            />
                        </View>

                        {/* Privacy */}

                        <View style={styles.privacy}>

                            <Ionicons name="lock-closed" size={17} color="#E9C69F" />

                            <Text style={styles.privacyText}>

                                Your information is safe and private.

                            </Text>

                        </View>

                    </View>

                </ScrollView>

                {/* Existing video verification component — unchanged */}

                <VideoVerificationFlow

                    visible={isVideoVerificationFlowVisible}

                    onComplete={(videoUri) => {

                        setIsVideoVerificationCompleted(true);

                        setIsVideoVerificationFlowVisible(false);

                    }}

                    onClose={() => setIsVideoVerificationFlowVisible(false)}

                />

                {/* Phone verification modal */}

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

                                <Text style={styles.modalTitleAccent}>

                                    {isEmailModal ? 'Email' : 'Phone'}

                                </Text>

                            </Text>

                            {!isOtpStep && (

                                <>

                                    <Text style={styles.modalSubtitle}>

                                        Enter your mobile number.

                                    </Text>

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

                                    <View style={styles.sendOtpButton}>

                                        <Pressable

                                            disabled={!/^[6-9]\d{9}$/.test(phoneNumber)}

                                            onPress={() => {

                                                setOtp('');

                                                setIsOtpStep(true);

                                            }}

                                            style={{ opacity: /^[6-9]\d{9}$/.test(phoneNumber) ? 1 : 0.48 }}

                                        >

                                            <LinearGradient

                                                colors={['#F8DCC6', '#F1C9A9']}

                                                start={{ x: 0, y: 0.5 }}

                                                end={{ x: 1, y: 0.5 }}

                                                style={styles.modalActionGradient}

                                            >

                                                <Text style={styles.modalActionText}>Send OTP</Text>

                                                <Ionicons name="arrow-forward" size={19} color="#542719" />

                                            </LinearGradient>

                                        </Pressable>

                                    </View>

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

                                        <Pressable

                                            disabled={!/^\d{6}$/.test(otp)}

                                            onPress={() => { }}

                                            style={{ opacity: /^\d{6}$/.test(otp) ? 1 : 0.48 }}

                                        >

                                            <LinearGradient

                                                colors={['#F8DCC6', '#F1C9A9']}

                                                start={{ x: 0, y: 0.5 }}

                                                end={{ x: 1, y: 0.5 }}

                                                style={styles.modalActionGradient}

                                            >

                                                <Text style={styles.modalActionText}>Verify OTP</Text>

                                                <Ionicons name="arrow-forward" size={19} color="#542719" />

                                            </LinearGradient>

                                        </Pressable>

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

                                    size={23}

                                    color={IVORY}

                                />

                            </Pressable>

                        </View>

                    </View>

                </Modal>

                {/* Email verification modal */}

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

                                <Text style={styles.modalTitleAccent}>

                                    Email

                                </Text>

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

                                        <Pressable

                                            disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}

                                            onPress={() => {

                                                setEmailOtp('');

                                                setIsEmailOtpStep(true);

                                            }}

                                            style={{

                                                opacity: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 1 : 0.48

                                            }}

                                        >

                                            <LinearGradient

                                                colors={['#F8DCC6', '#F1C9A9']}

                                                start={{ x: 0, y: 0.5 }}

                                                end={{ x: 1, y: 0.5 }}

                                                style={styles.modalActionGradient}

                                            >

                                                <Text style={styles.modalActionText}>Send Email OTP</Text>

                                                <Ionicons name="arrow-forward" size={19} color="#542719" />

                                            </LinearGradient>

                                        </Pressable>

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

                                        <Pressable

                                            disabled={!/^\d{6}$/.test(emailOtp.trim())}

                                            onPress={() => {

                                                // Real email OTP verification will be connected later.

                                            }}

                                            style={{ opacity: /^\d{6}$/.test(emailOtp.trim()) ? 1 : 0.48 }}

                                        >

                                            <LinearGradient

                                                colors={['#F8DCC6', '#F1C9A9']}

                                                start={{ x: 0, y: 0.5 }}

                                                end={{ x: 1, y: 0.5 }}

                                                style={styles.modalActionGradient}

                                            >

                                                <Text style={styles.modalActionText}>Verify Email OTP</Text>

                                                <Ionicons name="arrow-forward" size={19} color="#542719" />

                                            </LinearGradient>

                                        </Pressable>

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

                                <Ionicons

                                    name="close"

                                    size={23}

                                    color={IVORY}

                                />

                            </Pressable>

                        </View>

                    </View>

                </Modal>

            </ImageBackground>

        </View>

    );

}

const styles = StyleSheet.create({

    container: { flex: 1, backgroundColor: '#210902' },

    background: { flex: 1, width: '100%' },

    contentScroll: { flex: 1, backgroundColor: 'transparent' },

    scrollContent: {

        flexGrow: 1,

        paddingHorizontal: 28,

        paddingTop: 34,

        paddingBottom: 42,

    },

    content: { flex: 1, width: '100%' },

    heading: {

        alignItems: 'flex-start',

        marginTop: 190,

        marginBottom: 14,

    },

    headingText: {

        fontFamily: 'CormorantGaramond_600SemiBold',

        fontSize: 46,

        lineHeight: 52,

        color: '#FFF0DF',

        textAlign: 'left',

    },

    ageText: {

        fontFamily: 'CormorantGaramond_600SemiBold',

        fontSize: 46,

        lineHeight: 52,

        fontStyle: 'italic',

        color: '#D99552',

    },

    description: {

        marginTop: 5,

        textAlign: 'left',

        fontSize: 13,

        lineHeight: 20,

        fontFamily: 'Montserrat_400Regular',

        color: '#F8E3CE',

    },

    chooseHeading: {

        flexDirection: 'row',

        alignItems: 'center',

        gap: 9,

        marginTop: 18,

        marginBottom: 13,

    },

    chooseLine: {

        flex: 1,

        height: 1,

        backgroundColor: 'rgba(248,227,206,0.38)',

    },

    chooseTitle: {

        color: '#F8E3CE',

        fontSize: 12,

        fontFamily: 'Montserrat_500Medium',

        textAlign: 'center',

    },

    methods: { gap: 10 },

    methodCard: {

        minHeight: 78,

        flexDirection: 'row',

        alignItems: 'center',

        gap: 11,

        paddingVertical: 11,

        paddingHorizontal: 12,

        borderRadius: 25,

        borderWidth: 1,

        borderColor: 'rgba(248,220,198,0.34)',


    },

    methodCardSelected: {

        borderColor: '#F8DCC6',


    },

    methodIconBox: {

        width: 46,

        height: 46,

        borderRadius: 23,

        alignItems: 'center',

        justifyContent: 'center',

        backgroundColor: '#F8E3CE',

    },

    methodText: { flex: 1, gap: 4 },

    methodTitle: {

        color: '#FFF0DF',

        fontSize: 12,

        fontFamily: 'Montserrat_600SemiBold',

    },

    methodSubtitle: {

        color: 'rgba(248,227,206,0.72)',

        fontSize: 10,

        lineHeight: 15,

        fontFamily: 'Montserrat_400Regular',

    },

    methodArrow: { padding: 3 },

    continueButton: {
        marginTop: 22,
    },

    privacy: {

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 9,

        marginTop: 20,

        paddingHorizontal: 5,

    },

    privacyText: {

        color: '#F1D7BF',

        fontSize: 11,

        lineHeight: 17,

        fontFamily: 'Montserrat_500Medium',

    },

    modalOverlay: {

        flex: 1,

        justifyContent: 'center',

        alignItems: 'center',

        paddingHorizontal: 20,

        backgroundColor: 'rgba(16,7,4,0.86)',

    },

    modalCard: {

        width: '90%',

        paddingHorizontal: 24,

        paddingTop: 28,

        paddingBottom: 26,

        borderRadius: 23,

        backgroundColor: 'rgba(35,19,13,0.96)',

        borderWidth: 1,

        borderColor: 'rgba(248,220,198,0.42)',

        shadowColor: '#000000',

        shadowOffset: { width: 0, height: 12 },

        shadowOpacity: 0.3,

        shadowRadius: 18,

        elevation: 14,

    },

    modalTitle: {

        fontFamily: 'CormorantGaramond_600SemiBold',

        fontSize: 34,

        lineHeight: 40,

        color: '#FFF0DF',

        textAlign: 'center',

        marginTop: 2,

    },

    modalTitleAccent: {

        color: '#D99552',

        fontFamily: 'CormorantGaramond_600SemiBold',

        fontSize: 34,

        lineHeight: 40,

    },

    modalSubtitle: {

        marginTop: 5,

        color: '#E9C69F',

        fontSize: 13,

        lineHeight: 20,

        fontFamily: 'Montserrat_400Regular',

        textAlign: 'center',

    },

    modalClose: {

        position: 'absolute',

        top: 12,

        right: 12,

        padding: 6,

        zIndex: 1,

    },

    phoneInputRow: {

        width: '100%',

        flexDirection: 'row',

        alignItems: 'center',

        gap: spacing.sm,

        marginTop: 22,

    },

    phoneNumberField: {

        flex: 1,

    },

    countryCodeText: {

        color: '#E9C69F',

        fontFamily: 'Montserrat_500Medium',

        fontSize: 14,

    },

    sendOtpButton: {

        width: '100%',

        marginTop: 22,

    },

    modalActionGradient: {

        minHeight: 54,

        borderRadius: 32,

        borderWidth: 1.2,

        borderColor: 'rgba(248,220,198,0.72)',

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 10,

        paddingHorizontal: 18,

    },

    modalActionText: {

        fontFamily: 'Montserrat_600SemiBold',

        fontSize: 14,

        color: '#542719',

    },

    otpActionsRow: {

        width: '100%',

        flexDirection: 'row',

        justifyContent: 'center',

        alignItems: 'center',

        marginTop: spacing.md,

        gap: 24,

    },

    otpAction: {

        paddingVertical: spacing.xs,

    },

    otpBackButtonText: {

        color: '#E9C69F',

        fontSize: 12,

        fontFamily: 'Montserrat_500Medium',

        textDecorationLine: 'underline',

    },

    otpInputField: {

        width: '100%',

        marginTop: 22,

    },

});
