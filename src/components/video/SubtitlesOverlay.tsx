import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SubtitlesOverlayProps {
  currentSubtitle: string | null;
  fontSize?: number;
}

export const SubtitlesOverlay: React.FC<SubtitlesOverlayProps> = ({
  currentSubtitle,
  fontSize = 18,
}) => {
  if (!currentSubtitle) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.pill}>
        <Text style={[styles.text, { fontSize }]}>
          {currentSubtitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  pill: {
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '92%',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
