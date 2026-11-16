import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

export function LoginBackground() {
    return (
        <ImageBackground
            source={require('../assets/backgrounds/Sakura-bg.png')}
            style={styles.container}
            resizeMode="cover"
        />
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
    },
});