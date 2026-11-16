
import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

import { colors, radii, spacing } from '../../theme';
import { Text } from '../Text';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';



type InputProps = TextInputProps & {
    label?: string;
    icon?: React.ReactNode;
    compact?: boolean;
    showPasswordToggle?: boolean;


};
export function Input({
    label,
    icon,
    style,
    compact = false,
    showPasswordToggle = false,
    ...props
}: InputProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    return (
        <View style={styles.container}>
            {label ? (
                <Text variant="label" style={styles.label}>
                    {label}
                </Text>
            ) : null}

            <View
                style={[
                    styles.inputWrapper,
                    compact && styles.compactInputWrapper,
                ]}
            >
                {icon ? (
                    <>
                        <View style={styles.iconArea}>
                            {icon}
                        </View>

                        <View style={styles.divider} />
                    </>
                ) : null}

                <TextInput
                    {...props}
                    secureTextEntry={
                        showPasswordToggle
                            ? !isPasswordVisible
                            : props.secureTextEntry
                    }
                    style={[
                        styles.input,
                        compact && styles.compactInput,
                        style,
                    ]}
                    placeholderTextColor="rgba(199, 203, 217, 0.55)"
                />
                {showPasswordToggle ? (
                    <Pressable
                        onPress={() =>
                            setIsPasswordVisible((current) => !current)
                        }
                        style={styles.passwordToggle}
                        hitSlop={8}
                    >
                        <Ionicons
                            name={
                                isPasswordVisible
                                    ? 'eye-off-outline'
                                    : 'eye-outline'
                            }
                            size={20}
                            color="rgba(199, 203, 217, 0.55)"
                        />
                    </Pressable>
                ) : null}

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },

    label: {
        marginBottom: spacing.sm,
    },

    inputBorder: {
        width: '100%',
        height: 46,
        borderRadius: radii.md,
        padding: 1,
    },
    inputWrapper: {
        height: 40,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9.5,
        borderWidth: 1,
        borderColor: 'rgba(199, 203, 217, 0.23)',
        backgroundColor: 'rgba(16, 11, 22, 0.72)',
    },

    compactInputWrapper: {
        height: 34,
    },

    compactInput: {
        fontSize: 12,
        paddingHorizontal: spacing.sm,
    },

    iconArea: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },

    divider: {
        width: 1,
        height: 22,
        backgroundColor: 'rgba(199, 203, 217, 0.22)',
    },

    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: spacing.md,
        paddingVertical: 0,
        color: colors.ivory,
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        textAlignVertical: 'center',
    },

    // pasward toggle button eye
    passwordToggle: {
        width: 44,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

});