
import React, { useState } from 'react';

import {
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { spacing } from '../../../theme';

type SignUpInputProps = TextInputProps & {
    icon?: React.ReactNode;
    compact?: boolean;
    showPasswordToggle?: boolean;
};

export function SignUpInput({
    icon,
    compact = false,
    showPasswordToggle = false,
    style,
    ...props
}: SignUpInputProps) {

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={[
            styles.wrapper,
            compact && styles.compactWrapper,
        ]}>

            {icon ? (
                <View style={styles.iconArea}>
                    {icon}
                </View>
            ) : null}

            <TextInput
                {...props}
                secureTextEntry={
                    showPasswordToggle
                        ? !isPasswordVisible
                        : props.secureTextEntry
                }
                placeholderTextColor="#704B3A"
                style={[
                    styles.input,
                    compact && styles.compactInput,
                    style,
                ]}
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
                        size={21}
                        color="#542719"
                    />
                </Pressable>
            ) : null}

        </View>
    );
}

const styles = StyleSheet.create({

    wrapper: {
        width: '100%',
        height: 46,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,244,229,0.85)',
        backgroundColor: 'rgba(255,235,216,0.38)',
    },

    compactWrapper: {
        height: 42,
    },

    iconArea: {
        width: 55,
        alignItems: 'center',
        justifyContent: 'center',
    },

    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: spacing.sm,
        paddingVertical: 0,
        color: '#542719',
        fontFamily: 'Montserrat_500Medium',
        fontSize: 14,
        textAlignVertical: 'center',
    },

    compactInput: {
        fontSize: 12,
    },

    passwordToggle: {
        width: 48,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

});
