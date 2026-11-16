
import React, { useState } from 'react';

import {
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

import { radii, spacing } from '../../../theme';
import { Text } from '../../../components/Text';

import { Ionicons } from '@expo/vector-icons';

type InputProps = TextInputProps & {
    label?: string;
    icon?: React.ReactNode;
    compact?: boolean;
    showPasswordToggle?: boolean;
};

export function ChocolateInput({
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
                    placeholderTextColor="rgba(59, 33, 27, 0.55)"
                />

                {showPasswordToggle ? (
                    <Pressable
                        onPress={() =>
                            setIsPasswordVisible(current => !current)
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
                            color="#3B211B"
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
        color: '#3B211B',
    },

    inputWrapper: {
        height: 40,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 9.5,
        borderWidth: 1,
        borderColor: '#B97848',
        backgroundColor: '#F4DFC3',
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
        backgroundColor: 'rgba(59, 33, 27, 0.22)',
    },

    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: spacing.md,
        paddingVertical: 0,
        color: '#3B211B',
        fontFamily: 'Montserrat_400Regular',
        fontSize: 14,
        textAlignVertical: 'center',
    },

    passwordToggle: {
        width: 44,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

});
