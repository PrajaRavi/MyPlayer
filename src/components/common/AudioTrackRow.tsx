import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Music, MoreVertical, Heart, Volume2 } from 'lucide-react-native';
import { MediaItem } from '@/types/media';
import { AppColors } from '@/constants/colors';
import { formatDuration } from '@/utils/formatters';
import { useMediaContext } from '@/context/MediaContext';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

interface AudioTrackRowProps {
  item: MediaItem;
  onPress: () => void;
  onMorePress: () => void;
}

export const AudioTrackRow: React.FC<AudioTrackRowProps> = ({ item, onPress, onMorePress }) => {
  const { isFavorite, toggleFavorite } = useMediaContext();
  const { currentTrack, isPlaying } = useAudioPlayer();

  const favorite = isFavorite(item.id);
  const isCurrent = currentTrack?.id === item.id;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isCurrent && styles.activeContainer,
        pressed && styles.pressed,
      ]}
      onPress={onPress}>
      {/* Cover / Icon */}
      <View style={styles.artContainer}>
        {item.thumbnailUri ? (
          <Image source={{ uri: item.thumbnailUri }} style={styles.artImage} />
        ) : (
          <View style={[styles.artImage, styles.placeholderArt]}>
            <Music size={20} color={isCurrent ? AppColors.primary : AppColors.textMuted} />
          </View>
        )}

        {isCurrent && isPlaying && (
          <View style={styles.playingIndicatorOverlay}>
            <Volume2 size={16} color="#FFF" />
          </View>
        )}
      </View>

      {/* Track Info */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.title, isCurrent && styles.activeTitle]}
          numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.artist} numberOfLines={1}>
            {item.artist || 'Unknown Artist'}
          </Text>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
          {item.qualityTag && (
            <View style={styles.qualityTag}>
              <Text style={styles.qualityTagText}>{item.qualityTag}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionContainer}>
        <Pressable
          style={styles.actionBtn}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item.id);
          }}
          hitSlop={8}>
          <Heart
            size={18}
            color={favorite ? AppColors.rose : AppColors.textMuted}
            fill={favorite ? AppColors.rose : 'transparent'}
          />
        </Pressable>

        <Pressable
          style={styles.actionBtn}
          onPress={(e) => {
            e.stopPropagation();
            onMorePress();
          }}
          hitSlop={8}>
          <MoreVertical size={18} color={AppColors.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 3,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  activeContainer: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: AppColors.primary,
  },
  pressed: {
    backgroundColor: AppColors.cardHover,
  },
  artContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: AppColors.surface,
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  placeholderArt: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
  },
  playingIndicatorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6, 182, 212, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  activeTitle: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artist: {
    fontSize: 12,
    color: AppColors.textSecondary,
    maxWidth: 130,
  },
  bulletDot: {
    fontSize: 10,
    color: AppColors.textMuted,
  },
  metaText: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  qualityTag: {
    backgroundColor: AppColors.surface,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  qualityTagText: {
    fontSize: 9,
    color: AppColors.primary,
    fontWeight: '700',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
});
