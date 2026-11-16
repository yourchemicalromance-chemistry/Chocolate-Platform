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
            {features.map((feature, index) => (
                <React.Fragment key={feature.key}>
                    <View style={styles.feature}>
                        <Ionicons
                            name={feature.icon}
                            size={23}
                            color="#542719"
                        />

                        <Text style={styles.title}>
                            {t(`features.${feature.key}`)}
                        </Text>
                    </View>

                    {index < features.length - 1 && (
                        <View style={styles.separator} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    feature: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },

    title: {
        fontFamily: 'Montserrat_500Medium',
        fontSize: 11,
        lineHeight: 15,
        color: '#542719',
        textAlign: 'center',
    },

    separator: {
        width: 1,
        height: 34,
        backgroundColor: 'rgba(84, 39, 25, 0.35)',
    },

});