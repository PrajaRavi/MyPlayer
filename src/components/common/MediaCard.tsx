import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Play, MoreVertical, Heart, Folder } from 'lucide-react-native';
import { MediaItem } from '@/types/media';
import { AppColors } from '@/constants/colors';
import { formatDuration, formatFileSize, formatDate } from '@/utils/formatters';
import { useMediaContext } from '@/context/MediaContext';

interface MediaCardProps {
  item: MediaItem;
  onPress: () => void;
  onMorePress: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onPress, onMorePress }) => {
  const { isFavorite, toggleFavorite, getResumePosition } = useMediaContext();
  const favorite = isFavorite(item.id);
  const resumePos = getResumePosition(item.id);
  const progressPercent = item.duration > 0 && resumePos > 0
    ? Math.min(100, Math.round((resumePos / item.duration) * 100))
    : 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}>
      {/* Thumbnail with overlay badges */}
      <View style={styles.thumbnailWrapper}>
        {item.thumbnailUri ? (
          <Image
            source={{ uri: item.thumbnailUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
            <Play size={28} color={AppColors.primary} />
          </View>
        )}

        {/* Quality tag (4K / 1080p / 720p) */}
        {item.qualityTag && (
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityText}>{item.qualityTag}</Text>
          </View>
        )}

        {/* Duration badge */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>

        {/* Resume progress bar */}
        {progressPercent > 0 && (
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        )}
      </View>

      {/* Info section */}
      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.folderRow}>
            <Folder size={12} color={AppColors.textMuted} />
            <Text style={styles.folderText} numberOfLines={1}>
              {item.folderName || 'Videos'}
            </Text>
          </View>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.metaText}>{formatFileSize(item.size)}</Text>
          {resumePos > 0 && (
            <>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.resumeHighlight}>{progressPercent}% watched</Text>
            </>
          )}
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.cardActions}>
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
  card: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cardPressed: {
    backgroundColor: AppColors.cardHover,
    opacity: 0.95,
  },
  thumbnailWrapper: {
    width: 110,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: AppColors.surface,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1526',
  },
  qualityBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: AppColors.primary,
  },
  qualityText: {
    color: AppColors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
  },
  infoSection: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleRow: {
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  folderText: {
    fontSize: 11,
    color: AppColors.textMuted,
    maxWidth: 70,
  },
  bulletDot: {
    fontSize: 10,
    color: AppColors.textMuted,
  },
  metaText: {
    fontSize: 11,
    color: AppColors.textMuted,
  },
  resumeHighlight: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 6,
  },
  actionBtn: {
    padding: 6,
  },
});
