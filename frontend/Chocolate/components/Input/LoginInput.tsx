import React, { useState } from 'react';

import {
    Pressable,
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';

import { spacing } from '../../../theme';
import { Text } from '../../../components/Text';
import { Ionicons } from '@expo/vector-icons';

type InputProps = TextInputProps & {
    label?: string;
    icon?: React.ReactNode;
    compact?: boolean;
    showPasswordToggle?: boolean;
};

export function LoginInput({
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

            <View style={[styles.inputWrapper, compact && styles.compactInputWrapper]}>
                {icon ? (
                    <>
                        <View style={styles.iconArea}>{icon}</View>
                        <View style={styles.divider} />
                    </>
                ) : null}

                <TextInput
                    {...props}
                    secureTextEntry={
                        showPasswordToggle ? !isPasswordVisible : props.secureTextEntry
                    }
                    style={[
                        styles.input,
                        compact && styles.compactInput,
                        style,
                    ]}
                    placeholderTextColor="#F8DCC6"
                />

                {showPasswordToggle ? (
                    <Pressable
                        onPress={() => setIsPasswordVisible(current => !current)}
                        style={styles.passwordToggle}
                        hitSlop={8}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#F8DCC6"
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
        color: '#F8DCC6',
    },
    inputWrapper: {
        height: 40,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(248,220,198,0.24)',
        backgroundColor: 'rgba(35,19,13,0.78)',
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
        backgroundColor: 'rgba(248,220,198,0.24)',
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: spacing.md,
        paddingVertical: 0,
        color: '#FFF0DF',
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
