import React from 'react';

import {
    StyleSheet,
    View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from 'react-native';

const features = [
    { icon: 'people-outline' as const, key: 'friendship' },
    { icon: 'heart-outline' as const, key: 'love' },
    { icon: 'infinite-outline' as const, key: 'marriage' },
    { icon: 'leaf-outline' as const, key: 'partnership' },
];

export function ChocolateFeatures() {

    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            {features.map((feature) => (
                <View
                    key={feature.key}
                    style={styles.feature}
                >
                    <Ionicons
                        name={feature.icon}
                        size={25}
                        color="#542719"
                    />

                    <Text style={styles.title}>
                        {t(`features.${feature.key}`)}
                    </Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        width: '100%',
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: 8,
    },

    feature: {
        flex: 1,
        height: 78,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        backgroundColor: '#FCE5D3',
        borderWidth: 1,
        borderColor: '#85432A',
        borderRadius: 17,
    },

    title: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 11,
        lineHeight: 15,
        color: '#542719',
        textAlign: 'center',
    },

});