import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Alert, Platform } from 'react-native';
import {
  Play,
  RotateCcw,
  ListPlus,
  Shield,
  Share2,
  Info,
  Trash2,
  X,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { MediaItem } from '@/types/media';
import { AppColors } from '@/constants/colors';
import { formatDuration, formatFileSize, formatDate } from '@/utils/formatters';
import { useMediaContext } from '@/context/MediaContext';

interface MediaActionSheetProps {
  item: MediaItem | null;
  visible: boolean;
  onClose: () => void;
  onPlay: (resume: boolean) => void;
  onAddToPlaylist: () => void;
}

export const MediaActionSheet: React.FC<MediaActionSheetProps> = ({
  item,
  visible,
  onClose,
  onPlay,
  onAddToPlaylist,
}) => {
  const { getResumePosition, moveToVault, deleteMedia } = useMediaContext();
  const [showInfo, setShowInfo] = React.useState(false);

  if (!item) return null;

  const resumePos = getResumePosition(item.id);

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        alert(`Sharing URL: ${item.uri}`);
        return;
      }
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable && item.uri) {
        await Sharing.shareAsync(item.uri);
      } else {
        Alert.alert('Share', `Media URL: ${item.uri}`);
      }
    } catch (e) {
      console.warn('Share error', e);
    }
  };

  const handleMoveToVault = () => {
    Alert.alert(
      'Move to Private Vault',
      'This item will be hidden from the library and protected with your security PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide & Lock',
          style: 'destructive',
          onPress: async () => {
            await moveToVault(item);
            onClose();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete Media', `Are you sure you want to remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMedia(item.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.sheetHandle} />
            <View style={styles.titleRow}>
              <View style={styles.titleInfo}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle}>
                  {formatDuration(item.duration)} • {formatFileSize(item.size)}
                  {item.qualityTag ? ` • ${item.qualityTag}` : ''}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <X size={20} color={AppColors.textMuted} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.actionList}>
            {/* Resume button if position > 0 */}
            {resumePos > 5 && (
              <Pressable
                style={styles.actionItem}
                onPress={() => {
                  onPlay(true);
                  onClose();
                }}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                  <Play size={18} color={AppColors.primary} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={[styles.actionText, { color: AppColors.primary }]}>
                    Resume from {formatDuration(resumePos)}
                  </Text>
                  <Text style={styles.actionSubtext}>Continue where you left off</Text>
                </View>
              </Pressable>
            )}

            {/* Play from beginning */}
            <Pressable
              style={styles.actionItem}
              onPress={() => {
                onPlay(false);
                onClose();
              }}>
              <View style={styles.actionIcon}>
                <RotateCcw size={18} color={AppColors.text} />
              </View>
              <Text style={styles.actionText}>Play from beginning</Text>
            </Pressable>

            {/* Add to Playlist */}
            <Pressable
              style={styles.actionItem}
              onPress={() => {
                onAddToPlaylist();
                onClose();
              }}>
              <View style={styles.actionIcon}>
                <ListPlus size={18} color={AppColors.text} />
              </View>
              <Text style={styles.actionText}>Add to Playlist</Text>
            </Pressable>

            {/* Move to Vault */}
            <Pressable
              style={styles.actionItem}
              onPress={handleMoveToVault}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Shield size={18} color={AppColors.accent} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionText, { color: AppColors.accent }]}>
                  Move to Private Vault
                </Text>
                <Text style={styles.actionSubtext}>Hide & lock with security PIN</Text>
              </View>
            </Pressable>

            {/* Share */}
            <Pressable style={styles.actionItem} onPress={handleShare}>
              <View style={styles.actionIcon}>
                <Share2 size={18} color={AppColors.text} />
              </View>
              <Text style={styles.actionText}>Share</Text>
            </Pressable>

            {/* File Info */}
            <Pressable
              style={styles.actionItem}
              onPress={() => setShowInfo(!showInfo)}>
              <View style={styles.actionIcon}>
                <Info size={18} color={AppColors.text} />
              </View>
              <Text style={styles.actionText}>Media Information</Text>
            </Pressable>

            {showInfo && (
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Filename: <Text style={styles.infoValue}>{item.filename}</Text></Text>
                <Text style={styles.infoLabel}>Duration: <Text style={styles.infoValue}>{formatDuration(item.duration)}</Text></Text>
                <Text style={styles.infoLabel}>Size: <Text style={styles.infoValue}>{formatFileSize(item.size)}</Text></Text>
                {item.width && item.height && (
                  <Text style={styles.infoLabel}>Resolution: <Text style={styles.infoValue}>{item.width} x {item.height} ({item.qualityTag})</Text></Text>
                )}
                <Text style={styles.infoLabel}>Folder: <Text style={styles.infoValue}>{item.folderName || 'Default'}</Text></Text>
                <Text style={styles.infoLabel}>Modified: <Text style={styles.infoValue}>{formatDate(item.modificationTime)}</Text></Text>
                <Text style={styles.infoLabel} numberOfLines={2}>URI: <Text style={styles.infoValue}>{item.uri}</Text></Text>
              </View>
            )}

            {/* Delete */}
            <Pressable style={[styles.actionItem, styles.deleteItem]} onPress={handleDelete}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Trash2 size={18} color={AppColors.rose} />
              </View>
              <Text style={[styles.actionText, { color: AppColors.rose }]}>Delete file</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 28,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: AppColors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
  },
  subtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  actionList: {
    paddingTop: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  deleteItem: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingTop: 14,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
  },
  actionSubtext: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: AppColors.card,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: AppColors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    color: AppColors.text,
    fontWeight: '600',
  },
});
