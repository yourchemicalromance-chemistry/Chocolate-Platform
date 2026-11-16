import React from 'react';

import {
    Pressable,
    PressableProps,
    PressableStateCallbackType,
    StyleSheet,
    Text as RNText,
    View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type LoginButtonProps = PressableProps & {
    title: string;
};

export function LoginButton({
    title,
    style,
    ...props
}: LoginButtonProps) {
    return (
        <Pressable
            {...props}
            style={(state: PressableStateCallbackType) => [
                styles.button,
                props.disabled && styles.disabled,
                typeof style === 'function'
                    ? style(state)
                    : style,
            ]}
        >
            <LinearGradient
                colors={['#FFE6D2', '#F8DCC6', '#F2C9A8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <RNText style={styles.label}>
                        {title}
                    </RNText>

                    <Ionicons
                        name="arrow-forward"
                        size={22}
                        color="#4B2017"
                    />
                </View>
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({

    button: {
        height: 48,
        width: '100%',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    gradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },

    label: {
        fontFamily: 'Montserrat_600SemiBold',
        fontSize: 16,
        color: '#4B2017',
    },

    disabled: {
        opacity: 1,
    },

});
