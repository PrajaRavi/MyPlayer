import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Play, Pause, SkipForward, X, Music } from 'lucide-react-native';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AppColors } from '@/constants/colors';

export const MiniPlayerBar: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    closePlayer,
    setIsExpanded,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <Pressable
      style={styles.container}
      onPress={() => setIsExpanded(true)}>
      {/* Top micro progress bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.contentRow}>
        {/* Cover thumbnail */}
        <View style={styles.coverWrapper}>
          {currentTrack.thumbnailUri ? (
            <Image
              source={{ uri: currentTrack.thumbnailUri }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.placeholderCover}>
              <Music size={18} color={AppColors.primary} />
            </View>
          )}
        </View>

        {/* Track Title and Artist */}
        <View style={styles.infoWrapper}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist || 'Unknown Artist'}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsWrapper}>
          <Pressable
            style={styles.controlBtn}
            onPress={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            hitSlop={8}>
            {isPlaying ? (
              <Pause size={20} color={AppColors.text} fill={AppColors.text} />
            ) : (
              <Play size={20} color={AppColors.text} fill={AppColors.text} />
            )}
          </Pressable>

          <Pressable
            style={styles.controlBtn}
            onPress={(e) => {
              e.stopPropagation();
              playNext();
            }}
            hitSlop={8}>
            <SkipForward size={20} color={AppColors.text} />
          </Pressable>

          <Pressable
            style={styles.controlBtn}
            onPress={(e) => {
              e.stopPropagation();
              closePlayer();
            }}
            hitSlop={8}>
            <X size={18} color={AppColors.textMuted} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coverWrapper: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: AppColors.card,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.card,
  },
  infoWrapper: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
  },
  artist: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  controlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlBtn: {
    padding: 6,
  },
});
