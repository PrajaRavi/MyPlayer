import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sun, Volume2, VolumeX, FastForward, Rewind } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';

interface GestureHUDProps {
  volumeHUD: { visible: boolean; value: number } | null;
  brightnessHUD: { visible: boolean; value: number } | null;
  seekHUD: { visible: boolean; diffSeconds: number; targetTime: number; duration: number } | null;
  doubleTapHUD: { visible: boolean; type: 'rewind' | 'forward'; seconds: number } | null;
}

export const GestureHUD: React.FC<GestureHUDProps> = ({
  volumeHUD,
  brightnessHUD,
  seekHUD,
  doubleTapHUD,
}) => {
  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Volume HUD */}
      {volumeHUD && volumeHUD.visible && (
        <View style={styles.hudCard}>
          {volumeHUD.value === 0 ? (
            <VolumeX size={32} color={AppColors.rose} />
          ) : (
            <Volume2 size={32} color={volumeHUD.value > 1.0 ? AppColors.amber : AppColors.primary} />
          )}
          <View style={styles.barBackground}>
            <View
              style={[
                styles.barFill,
                {
                  height: `${Math.min(100, (volumeHUD.value / 2.0) * 100)}%`,
                  backgroundColor: volumeHUD.value > 1.0 ? AppColors.amber : AppColors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.hudText}>
            {Math.round(volumeHUD.value * 100)}%
            {volumeHUD.value > 1.0 ? ' (Boost)' : ''}
          </Text>
        </View>
      )}

      {/* Brightness HUD */}
      {brightnessHUD && brightnessHUD.visible && (
        <View style={styles.hudCard}>
          <Sun size={32} color={AppColors.amber} />
          <View style={styles.barBackground}>
            <View
              style={[
                styles.barFill,
                {
                  height: `${Math.min(100, brightnessHUD.value * 100)}%`,
                  backgroundColor: AppColors.amber,
                },
              ]}
            />
          </View>
          <Text style={styles.hudText}>{Math.round(brightnessHUD.value * 100)}%</Text>
        </View>
      )}

      {/* Fast Seek HUD */}
      {seekHUD && seekHUD.visible && (
        <View style={styles.seekPill}>
          {seekHUD.diffSeconds >= 0 ? (
            <FastForward size={24} color={AppColors.primary} />
          ) : (
            <Rewind size={24} color={AppColors.rose} />
          )}
          <Text style={styles.seekDiffText}>
            {seekHUD.diffSeconds >= 0 ? `+${Math.round(seekHUD.diffSeconds)}s` : `${Math.round(seekHUD.diffSeconds)}s`}
          </Text>
          <Text style={styles.seekTargetText}>
            {formatTime(seekHUD.targetTime)} / {formatTime(seekHUD.duration)}
          </Text>
        </View>
      )}

      {/* Double Tap Skip 10s HUD */}
      {doubleTapHUD && doubleTapHUD.visible && (
        <View
          style={[
            styles.doubleTapCircle,
            doubleTapHUD.type === 'rewind' ? styles.doubleTapLeft : styles.doubleTapRight,
          ]}>
          {doubleTapHUD.type === 'rewind' ? (
            <Rewind size={32} color="#FFF" />
          ) : (
            <FastForward size={32} color="#FFF" />
          )}
          <Text style={styles.doubleTapText}>{doubleTapHUD.seconds}s</Text>
        </View>
      )}
    </View>
  );
};

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  hudCard: {
    width: 90,
    height: 170,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  barBackground: {
    width: 8,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  hudText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  seekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: AppColors.primary,
    gap: 10,
  },
  seekDiffText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  seekTargetText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  doubleTapCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(6, 182, 212, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleTapLeft: {
    left: '15%',
  },
  doubleTapRight: {
    right: '15%',
  },
  doubleTapText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
});
