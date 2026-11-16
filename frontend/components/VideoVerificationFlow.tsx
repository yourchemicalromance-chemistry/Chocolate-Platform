
import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Button } from './Button';
import { Text } from './Text';
import { RecordingButton } from './RecordingButton';
import { colors, radii, spacing } from '../theme';

type VideoVerificationFlowProps = {
    visible: boolean;
    onComplete: (videoUri: string) => void;
    onClose: () => void;
};

export function VideoVerificationFlow({ visible, onComplete, onClose }: VideoVerificationFlowProps) {
    const [isSelfieIntroVisible, setIsSelfieIntroVisible] = useState(visible);


    // >>> CV02-STATE: CAMERA PERMISSION — START
    const [isCameraPermissionVisible, setIsCameraPermissionVisible] = useState(false);
    // <<< CV02-STATE: CAMERA PERMISSION — END


    // >>> CV03-STATE: CAMERA READY — START
    const [isCameraReadyVisible, setIsCameraReadyVisible] = useState(false);

    const [isTorchEnabled, setIsTorchEnabled] = useState(false);
    // <<< CV03-STATE: CAMERA READY — END

    const [, requestCameraPermission] = useCameraPermissions();
    const [, requestMicrophonePermission] = useMicrophonePermissions();

    // >>> CV04-RECORDING-STATE: LOCAL VIDEO CAPTURE — START
    const cameraRef = useRef<CameraView>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
    const [isVideoVerificationCompleted, setIsVideoVerificationCompleted] =
        useState(false);
    const [recordingStatus, setRecordingStatus] = useState('Not recording yet');

    const startRecording = async () => {
        if (!cameraRef.current) {
            Alert.alert('Camera not ready', 'Please wait for the camera preview, then try again.');
            return;
        }

        try {
            const microphonePermission = await requestMicrophonePermission();
            if (!microphonePermission.granted) {
                Alert.alert(
                    'Microphone permission needed',
                    'Allow microphone access to record your verification video with audio.',
                );
                return;
            }

            setRecordedVideoUri(null);
            setRecordingStatus('Recording…');
            setIsRecording(true);

            const result = await cameraRef.current.recordAsync({ maxDuration: 60 });
            if (result?.uri) {
                setRecordedVideoUri(result.uri);
                setIsVideoVerificationCompleted(true);
                setRecordingStatus('Recording saved temporarily on this device.');
                setIsRecordingCompleteModalVisible(true);
            }
            else {
                setRecordingStatus('Recording stopped without a video file. Please try again.');
            }


        } catch (error) {
            console.error('[CV04] Recording failed:', error);

            const errorMessage =
                error instanceof Error ? error.message : String(error);

            setRecordingStatus(`Recording failed: ${errorMessage}`);
            Alert.alert('Recording failed', errorMessage);
        } finally {
            setIsRecording(false);
        }


    };

    const stopRecording = () => {
        if (isRecording) {
            cameraRef.current?.stopRecording();
        }
    };
    // <<< CV04-RECORDING-STATE: LOCAL VIDEO CAPTURE — END


    // >>> CV04-STATE: VERIFICATION INSTRUCTIONS — START
    const [isAiAssistantVisible, setIsAiAssistantVisible] = useState(false);
    const [assistantQuestionIndex, setAssistantQuestionIndex] = useState(0);

    const [introText, setIntroText] = useState('');
    const [challengeIntroText, setChallengeIntroText] = useState('');
    const [challengeOutroText, setChallengeOutroText] = useState('');
    const [cursorVisible, setCursorVisible] = useState(true);
    const [showNextInstruction, setShowNextInstruction] = useState(false);
    const [challengeSentence, setChallengeSentence] = useState('');
    const [isRecordingCompleteModalVisible, setIsRecordingCompleteModalVisible] =
        useState(false);
    // <<< CV04-STATE: VERIFICATION INSTRUCTIONS — END



    // >>> CV06-STATE: RECORDING PREVIEW — START
    const [isRecordingPreviewVisible, setIsRecordingPreviewVisible] =
        useState(false);
    // <<< CV06-STATE: RECORDING PREVIEW — END

    // >>> CV07-STATE: SUBMISSION RESULT — START
    const [isSubmissionResultVisible, setIsSubmissionResultVisible] =
        useState(false);
    // <<< CV07-STATE: SUBMISSION RESULT — END


    const handleVerificationBack = () => {
        if (isSubmissionResultVisible) {
            setIsSubmissionResultVisible(false);
            setIsRecordingPreviewVisible(true);
            return;
        }
        if (isRecordingPreviewVisible) {
            setIsRecordingPreviewVisible(false);
            setIsAiAssistantVisible(true);
            setAssistantQuestionIndex(2);
            return;
        }
        if (isAiAssistantVisible) {
            if (isRecording) {
                cameraRef.current?.stopRecording();
            }
            setIsAiAssistantVisible(false);
            setIsCameraReadyVisible(true);
            return;
        }
        if (isCameraReadyVisible) {
            setIsCameraReadyVisible(false);
            setIsSelfieIntroVisible(true);
            return;
        }
        if (isCameraPermissionVisible) {
            setIsCameraPermissionVisible(false);
            return;
        }
        if (isSelfieIntroVisible) {
            setIsSelfieIntroVisible(false);
            return;
        }
        onClose();
    };

    useEffect(() => {
        const subscription = BackHandler.addEventListener(
            'hardwareBackPress',
            () => {
                const verificationFlowOpen =
                    isSelfieIntroVisible ||
                    isCameraPermissionVisible ||
                    isCameraReadyVisible ||
                    isAiAssistantVisible ||
                    isRecordingPreviewVisible ||
                    isSubmissionResultVisible;

                if (!verificationFlowOpen) return false;
                handleVerificationBack();
                return true;
            },
        );
        return () => subscription.remove();
    }, [
        isSelfieIntroVisible,
        isCameraPermissionVisible,
        isCameraReadyVisible,
        isAiAssistantVisible,
        isRecordingPreviewVisible,
        isSubmissionResultVisible,
        assistantQuestionIndex,
        isRecording,
    ]);


    // >>> CV04-TYPEWRITER: INTRO TEXT — START

    useEffect(() => {
        if (!isAiAssistantVisible) {
            setIntroText('');
            setShowNextInstruction(false);
            setCursorVisible(true);
            return;
        }

        const message =
            'Please verify your account with this simple request.';

        let index = 0;
        let delayTimeout: ReturnType<typeof setTimeout> | undefined;

        setIntroText('');
        setShowNextInstruction(false);

        const typingInterval = setInterval(() => {
            index += 1;
            setIntroText(message.slice(0, index));

            if (index >= message.length) {
                clearInterval(typingInterval);


                delayTimeout = setTimeout(() => {
                    setChallengeIntroText('');
                    setChallengeOutroText('');
                    setShowNextInstruction(true);

                    let challengeIndex = 0;
                    const challengePrefix = 'Please record your video and say ';
                    const challengeSuffix =
                        ' into the camera, then press the Stop Recording button.';

                    const challengeInterval = setInterval(() => {
                        challengeIndex += 1;

                        if (challengeIndex <= challengePrefix.length) {
                            setChallengeIntroText(
                                challengePrefix.slice(0, challengeIndex)
                            );
                        } else {
                            const suffixIndex =
                                challengeIndex - challengePrefix.length - challengeSentence.length - 2;

                            if (suffixIndex >= 0) {
                                setChallengeOutroText(
                                    challengeSuffix.slice(0, suffixIndex)
                                );
                            }
                        }

                        if (
                            challengeIndex >=
                            challengePrefix.length + challengeSentence.length + 2 + challengeSuffix.length
                        ) {
                            clearInterval(challengeInterval);
                        }
                    }, 35);
                }, 1200);

            }
        }, 45);

        return () => {
            clearInterval(typingInterval);

            if (delayTimeout !== undefined) {
                clearTimeout(delayTimeout);
            }
        };
    }, [isAiAssistantVisible]);



    useEffect(() => {
        if (!isAiAssistantVisible) {
            return;
        }

        const cursorInterval = setInterval(() => {
            setCursorVisible((visible) => !visible);
        }, 500);

        return () => clearInterval(cursorInterval);
    }, [isAiAssistantVisible]);

    {/* Ends */ }



    const challengeSentences = [
        'The blue kite is flying above the garden.',
        'Seven silver stars shine in the night sky.',
        'A little bird is sitting beside the window.',
        'Fresh flowers are growing near the old house.',
    ];

    const assignChallengeSentence = () => {
        const randomIndex = Math.floor(
            Math.random() * challengeSentences.length
        );
        setChallengeSentence(challengeSentences[randomIndex]);
    };

    useEffect(() => {
        if (visible) setIsSelfieIntroVisible(true);
        else {
            setIsSelfieIntroVisible(false);
            setIsCameraPermissionVisible(false);
            setIsCameraReadyVisible(false);
            setIsAiAssistantVisible(false);
            setIsRecordingPreviewVisible(false);
            setIsSubmissionResultVisible(false);
            setIsRecordingCompleteModalVisible(false);
        }
    }, [visible]);

    return (
        <>
            {/* >>> CV01: CHEMISTREE LIVE INTRODUCTION — START */}
            <Modal

                visible={visible && (
                    isSelfieIntroVisible ||
                    isCameraPermissionVisible ||
                    isCameraReadyVisible ||
                    isAiAssistantVisible ||
                    isRecordingPreviewVisible ||
                    isSubmissionResultVisible
                )}

                transparent={false}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={handleVerificationBack}
            >

                {/* >>> CV01: CHEMISTREE LIVE INTRODUCTION — START */}
                {isSelfieIntroVisible &&
                    !isCameraReadyVisible &&
                    !isAiAssistantVisible &&
                    !isRecordingPreviewVisible &&
                    !isSubmissionResultVisible && (
                        <View style={styles.selfieModalRoot}>


                            <View style={styles.selfieHeader}>
                                <Text variant="heading2" style={styles.selfieHeaderTitle}>
                                    CHEMISTREE <Text style={styles.selfieHeaderPink}>LIVE</Text>
                                </Text>
                                <Text variant="caption" style={styles.selfieHeaderSubtitle}>
                                    Authenticity & age verification
                                </Text>
                            </View>

                            {/* Assistant */}
                            <View style={styles.selfieContent}>

                                <Image
                                    source={require('../assets/branding/chemistree-ai-bot.png')}
                                    style={styles.aiBotImage}
                                    resizeMode="contain"
                                />

                                <Text variant="heading1" style={styles.selfieTitle}>
                                    Let's make sure{"\n"}it's really you.
                                </Text>

                                <Text variant="body" style={styles.selfieDescription}>
                                    I'll ask you a few quick questions on video.
                                    Just answer naturally, looking at your camera.
                                </Text>

                                <View style={styles.selfieInfoRow}>
                                    <Ionicons name="camera-outline" size={25} color="#F472B6" />
                                    <View style={styles.selfieInfoText}>
                                        <Text variant="label" style={styles.selfieInfoTitle}>
                                            Front camera required
                                        </Text>
                                        <Text variant="bodySmall" style={styles.selfieInfoSubtitle}>
                                            Find a well-lit place.
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.selfieInfoRow}>
                                    <Ionicons name="mic-outline" size={25} color="#D879F9" />
                                    <View style={styles.selfieInfoText}>
                                        <Text variant="label" style={styles.selfieInfoTitle}>
                                            Answer a few questions
                                        </Text>
                                        <Text variant="bodySmall" style={styles.selfieInfoSubtitle}>
                                            Speak clearly and naturally.
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.selfieInfoRow}>
                                    <Ionicons name="shield-checkmark-outline" size={25} color="#A78BFA" />
                                    <View style={styles.selfieInfoText}>
                                        <Text variant="label" style={styles.selfieInfoTitle}>
                                            Your recording is secure
                                        </Text>
                                        <Text variant="bodySmall" style={styles.selfieInfoSubtitle}>
                                            Used for verification.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Actions — shared Button component */}
                            <View style={styles.selfieActions}>
                                <Button
                                    title="Start Verification"
                                    variant="primary"
                                    onPress={() => {
                                        setIsCameraPermissionVisible(true);
                                    }}
                                />

                                <Pressable
                                    onPress={() => setIsSelfieIntroVisible(false)}
                                    style={styles.selfieNotNow}
                                    hitSlop={10}
                                >
                                    <Text variant="label" style={styles.selfieNotNowText}>
                                        Not Now
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                {/* <<< CV01: CHEMISTREE LIVE INTRODUCTION — END */}

                {/* >>> CV02: CAMERA PERMISSION POPUP — START */}
                {isCameraPermissionVisible && (
                    <View style={styles.cameraPermissionOverlay}>
                        <View style={styles.cameraPermissionCard}>
                            <View style={styles.cameraPermissionIcon}>
                                <Ionicons
                                    name="camera"
                                    size={32}
                                    color="#7C3AED"
                                />
                            </View>

                            <Text
                                variant="body"
                                style={styles.cameraPermissionPopupTitle}
                            >
                                Allow CHEMISTREE to{"\n"}access your camera?
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={styles.cameraPermissionPopupDescription}
                            >
                                We need camera access to record
                                {"\n"}your video for verification.
                            </Text>

                            <View style={styles.cameraPermissionPopupActions}>
                                <Button
                                    title="Allow"
                                    variant="primary"
                                    onPress={async () => {
                                        const permission =
                                            await requestCameraPermission();

                                        if (permission.granted) {
                                            setIsCameraPermissionVisible(false);
                                            setIsCameraReadyVisible(true);
                                        }
                                    }}
                                />

                                <Pressable
                                    onPress={() => {
                                        setIsCameraPermissionVisible(false);
                                    }}
                                    style={styles.cameraPermissionNotNow}
                                    hitSlop={10}
                                >
                                    <Text
                                        variant="label"
                                        style={styles.cameraPermissionNotNowText}
                                    >
                                        Not Now
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}
                {/* <<< CV02: CAMERA PERMISSION POPUP — END */}



                {/* >>> UNIFIED CAMERA: CV03 + CV04 — START */}
                {(isCameraReadyVisible || isAiAssistantVisible) && (
                    <View style={styles.unifiedCameraRoot}>
                        {/* ONE camera instance shared by both stages */}
                        <CameraView
                            ref={cameraRef}
                            style={StyleSheet.absoluteFill}
                            facing="front"
                            mode="video"
                            enableTorch={isTorchEnabled}
                            onCameraReady={() => {
                                console.log('[CHEMISTREE] Shared camera ready');
                            }}
                            onMountError={(event) => {
                                console.error(
                                    '[CHEMISTREE] Camera error:',
                                    event.message
                                );
                            }}
                        />

                        {/* CV03 — Reference design */}
                        {isCameraReadyVisible && (
                            <View style={styles.cv03ReferenceOverlay}>
                                <Pressable
                                    style={styles.cv03Close}


                                    onPress={() => {
                                        setIsCameraReadyVisible(false);
                                        setIsSelfieIntroVisible(false);
                                    }}


                                    hitSlop={12}
                                >
                                    <Ionicons name="close" size={24} color="#FFFFFF" />
                                </Pressable>

                                <Pressable
                                    style={styles.cv03Flash}
                                    onPress={() => setIsTorchEnabled((value) => !value)}
                                    hitSlop={12}
                                >
                                    <Ionicons
                                        name={isTorchEnabled ? 'flash' : 'flash-outline'}
                                        size={22}
                                        color="#FFFFFF"
                                    />
                                </Pressable>

                                {/* Four L-shaped face guides */}
                                <View
                                    pointerEvents="none"
                                    style={styles.cv03Corners}
                                >
                                    <View style={[styles.faceCorner, styles.cornerTL]} />
                                    <View style={[styles.faceCorner, styles.cornerTR]} />
                                    <View style={[styles.faceCorner, styles.cornerBL]} />
                                    <View style={[styles.faceCorner, styles.cornerBR]} />
                                </View>

                                {/* Instructions floating over the live preview */}
                                <View style={styles.cv03InstructionCard}>
                                    <Text style={styles.cv03ReferenceTitle}>
                                        Position your face in the frame
                                    </Text>

                                    <View style={styles.cv03InstructionRow}>
                                        <View style={[styles.cv03InstructionIcon, { backgroundColor: '#168B55' }]}>
                                            <Ionicons name="sunny" size={14} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.cv03ReferenceText}>
                                            Find a well-lit place
                                        </Text>
                                    </View>

                                    <View style={styles.cv03InstructionRow}>
                                        <View style={[styles.cv03InstructionIcon, { backgroundColor: '#168B55' }]}>
                                            <Ionicons name="person" size={14} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.cv03ReferenceText}>
                                            Keep your face visible
                                        </Text>
                                    </View>

                                    <View style={styles.cv03InstructionRow}>
                                        <View style={[styles.cv03InstructionIcon, { backgroundColor: '#168B55' }]}>
                                            <Ionicons name="glasses-outline" size={14} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.cv03ReferenceText}>
                                            Remove glasses if possible
                                        </Text>
                                    </View>

                                    <View style={styles.cv03InstructionRow}>
                                        <View style={[styles.cv03InstructionIcon, { backgroundColor: '#7C3AED' }]}>
                                            <Ionicons name="eye" size={14} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.cv03ReferenceText}>
                                            Look at the camera
                                        </Text>
                                    </View>
                                </View>


                                <Button
                                    title="I'm Ready"
                                    variant="primary"

                                    onPress={() => {
                                        assignChallengeSentence();
                                        setIsCameraReadyVisible(false);
                                        setIsAiAssistantVisible(true);
                                    }}

                                    style={styles.cv03ReadyButton}
                                />
                            </View>
                        )}

                        {/* CV04 — Assistant and recording controls.
            The CameraView above remains mounted. */}



                        {isAiAssistantVisible && (
                            <View style={styles.cv04UnifiedOverlay}>


                                {/* Top intro and AI bot */}



                                {/* Sequential bot dialogue */}
                                <View style={styles.cv04TopIntro}>
                                    {!showNextInstruction ? (
                                        <View style={styles.cv04MessageRow}>
                                            <Image
                                                source={require('../assets/branding/chemistree-ai-bot.png')}
                                                style={styles.cv04BotFace}
                                                resizeMode="contain"
                                            />

                                            <View style={styles.cv04MessageBox}>
                                                <Text style={styles.cv04TypewriterText}>
                                                    {introText}
                                                    <Text style={styles.cv04BlinkingCursor}>
                                                        {cursorVisible ? '|' : ' '}
                                                    </Text>
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.cv04MessageRow}>
                                            <Image
                                                source={require('../assets/branding/chemistree-ai-bot.png')}
                                                style={styles.cv04BotFace}
                                                resizeMode="contain"
                                            />

                                            <View style={styles.cv04MessageBox}>

                                                <Text style={styles.cv04ChallengeInstruction}>
                                                    {challengeIntroText}
                                                    {challengeSentence && (
                                                        <Text style={styles.cv04ChallengeSentence}>
                                                            "{challengeSentence}"
                                                        </Text>
                                                    )}
                                                    {challengeOutroText}
                                                    <Text style={styles.cv04BlinkingCursor}>
                                                        {cursorVisible ? '|' : ' '}
                                                    </Text>
                                                </Text>


                                            </View>
                                        </View>
                                    )}
                                </View>


                                {/* Flexible space between intro and question */}
                                <View style={styles.cv04UnifiedSpacer} />

                                {/* Question and recording controls */}
                                <View style={styles.cv04UnifiedBottom}>
                                    <View style={styles.cv04QuestionCard}>
                                        <RecordingButton
                                            isRecording={isRecording}
                                            onPress={isRecording ? stopRecording : startRecording}
                                        />

                                        <Text style={styles.cv04RecordingStatus}>
                                            {recordingStatus}
                                        </Text>


                                    </View>
                                </View>
                            </View>
                        )}

                    </View>
                )}
                {/* <<< UNIFIED CAMERA: CV03 + CV04 — END */}


            </Modal>

            <Modal
                visible={visible && isRecordingCompleteModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsRecordingCompleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.recordingCompleteCard}>
                        <Ionicons name="checkmark-circle" size={54} color="#16A34A" />
                        <Text style={styles.recordingCompleteTitle}>
                            Video recorded successfully
                        </Text>
                        <Text style={styles.recordingCompleteDescription}>
                            Your video has been saved and is ready for review.
                        </Text>
                        <Button
                            title="Continue"
                            variant="primary"
                            style={{ width: '100%', minHeight: 52 }}
                            onPress={() => {
                                setIsRecordingCompleteModalVisible(false);
                                if (recordedVideoUri) onComplete(recordedVideoUri);
                                onClose();
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </>
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
        top: 5,
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
        fontSize: 15,
        lineHeight: 23,
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






    recordingCompleteCard: {
        width: '90%',
        alignItems: 'center',
        gap: 16,
        padding: 24,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
    },
    recordingCompleteTitle: {
        color: '#171321',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
    recordingCompleteDescription: {
        color: '#625D73',
        textAlign: 'center',
        lineHeight: 21,
    },

});
