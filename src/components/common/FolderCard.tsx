import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Folder, Film, Music2, ChevronRight } from 'lucide-react-native';
import { FolderGroup } from '@/types/media';
import { AppColors } from '@/constants/colors';
import { formatFileSize } from '@/utils/formatters';

interface FolderCardProps {
  folder: FolderGroup;
  isSelected: boolean;
  onPress: () => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, isSelected, onPress }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isSelected && styles.selectedContainer,
        pressed && styles.pressed,
      ]}
      onPress={onPress}>
      <View style={styles.iconContainer}>
        {folder.coverUri ? (
          <Image source={{ uri: folder.coverUri }} style={styles.coverImage} />
        ) : (
          <View style={styles.fallbackIcon}>
            <Folder size={24} color={AppColors.primary} />
          </View>
        )}
        <View style={styles.typeBadge}>
          {folder.mediaType === 'video' ? (
            <Film size={10} color="#FFF" />
          ) : (
            <Music2 size={10} color="#FFF" />
          )}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.folderName} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={styles.folderMeta}>
          {folder.itemCount} {folder.itemCount === 1 ? 'item' : 'items'}
          {folder.totalSize > 0 && ` • ${formatFileSize(folder.totalSize)}`}
        </Text>
      </View>

      <ChevronRight size={18} color={AppColors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.card,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  selectedContainer: {
    borderColor: AppColors.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  pressed: {
    backgroundColor: AppColors.cardHover,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: AppColors.surface,
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  fallbackIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    padding: 2,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  folderName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 4,
  },
  folderMeta: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
});
