import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { Plus, ListMusic, Check, X } from 'lucide-react-native';
import { MediaItem } from '@/types/media';
import { AppColors } from '@/constants/colors';
import { useMediaContext } from '@/context/MediaContext';

interface PlaylistModalProps {
  item: MediaItem | null;
  visible: boolean;
  onClose: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ item, visible, onClose }) => {
  const { playlists, createPlaylist, addToPlaylist } = useMediaContext();
  const [newTitle, setNewTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  if (!item) return null;

  const relevantPlaylists = playlists.filter(p => p.type === item.mediaType);

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a playlist name');
      return;
    }
    const pl = await createPlaylist(newTitle.trim(), item.mediaType);
    await addToPlaylist(pl.id, item.id);
    setNewTitle('');
    setShowCreate(false);
    Alert.alert('Added', `Added to playlist "${pl.title}"`);
    onClose();
  };

  const handleSelect = async (playlistId: string, title: string) => {
    await addToPlaylist(playlistId, item.id);
    Alert.alert('Added', `Added to playlist "${title}"`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to Playlist</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={AppColors.textMuted} />
            </Pressable>
          </View>

          {showCreate ? (
            <View style={styles.createBox}>
              <TextInput
                style={styles.input}
                placeholder="Playlist name..."
                placeholderTextColor={AppColors.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
              <View style={styles.btnRow}>
                <Pressable
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setShowCreate(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.saveBtn]}
                  onPress={handleCreate}>
                  <Text style={styles.saveBtnText}>Create & Add</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.newPlaylistBtn}
              onPress={() => setShowCreate(true)}>
              <Plus size={18} color={AppColors.primary} />
              <Text style={styles.newPlaylistText}>New Playlist</Text>
            </Pressable>
          )}

          <ScrollView style={styles.list}>
            {relevantPlaylists.map(p => {
              const contains = p.mediaIds.includes(item.id);
              return (
                <Pressable
                  key={p.id}
                  style={styles.playlistItem}
                  onPress={() => handleSelect(p.id, p.title)}>
                  <ListMusic size={20} color={contains ? AppColors.primary : AppColors.textSecondary} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{p.title}</Text>
                    <Text style={styles.itemCount}>{p.mediaIds.length} items</Text>
                  </View>
                  {contains && <Check size={18} color={AppColors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  newPlaylistText: {
    color: AppColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  createBox: {
    backgroundColor: AppColors.card,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  input: {
    backgroundColor: AppColors.surface,
    color: AppColors.text,
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: AppColors.surface,
  },
  cancelBtnText: {
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: AppColors.primary,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
  },
  list: {
    maxHeight: 250,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.text,
  },
  itemCount: {
    fontSize: 12,
    color: AppColors.textMuted,
    marginTop: 2,
  },
});
