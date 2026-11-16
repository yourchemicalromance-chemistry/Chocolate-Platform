import React from 'react';
import { StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

export function MoonlightBackground() {
  const player = useVideoPlayer(
    require('../../assets/backgrounds/City-Cosmiclight-Rom.mp4'),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  return (
    <VideoView
      player={player}
      style={styles.container}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
  ...StyleSheet.absoluteFill,
},
});