import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  Music,
  ListMusic,
  User,
  Folder,
  Play,
  Shuffle,
} from 'lucide-react-native';
import { useMediaContext } from '@/context/MediaContext';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { AppColors } from '@/constants/colors';
import { Header } from '@/components/common/Header';
import { AudioTrackRow } from '@/components/common/AudioTrackRow';
import { FolderCard } from '@/components/common/FolderCard';
import { MediaActionSheet } from '@/components/common/MediaActionSheet';
import { PlaylistModal } from '@/components/common/PlaylistModal';
import { SortFilterModal } from '@/components/common/SortFilterModal';
import { MediaItem } from '@/types/media';

export default function MusicScreen() {
  const {
    audios,
    audioFolders,
    playlists,
    isLoading,
    refreshLibrary,
    searchQuery,
    sortMode,
    sortOrder,
    hasPermission,
    setIsPermissionModalVisible,
  } = useMediaContext();

  const { playTrack } = useAudioPlayer();

  const [activeSubTab, setActiveSubTab] = useState<'tracks' | 'playlists' | 'artists' | 'folders'>('tracks');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Filtered and sorted audios
  const processedAudios = useMemo(() => {
    let list = [...audios];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.artist && a.artist.toLowerCase().includes(q)) ||
        (a.albumTitle && a.albumTitle.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let comp = 0;
      if (sortMode === 'name') {
        comp = a.title.localeCompare(b.title);
      } else if (sortMode === 'date') {
        comp = (a.modificationTime || 0) - (b.modificationTime || 0);
      } else if (sortMode === 'size') {
        comp = (a.size || 0) - (b.size || 0);
      } else if (sortMode === 'duration') {
        comp = (a.duration || 0) - (b.duration || 0);
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

    return list;
  }, [audios, searchQuery, sortMode, sortOrder]);

  // Group by Artist
  const artistGroups = useMemo(() => {
    const map: Record<string, MediaItem[]> = {};
    for (const a of audios) {
      const artist = a.artist || 'Unknown Artist';
      if (!map[artist]) map[artist] = [];
      map[artist].push(a);
    }
    return Object.entries(map).map(([artist, tracks]) => ({
      artist,
      tracks,
      count: tracks.length,
    }));
  }, [audios]);

  const handlePlayAll = (shuffle: boolean = false) => {
    if (processedAudios.length === 0) return;
    const queue = [...processedAudios];
    if (shuffle) {
      queue.sort(() => Math.random() - 0.5);
    }
    playTrack(queue[0], queue);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Music"
        subtitle={`${audios.length} tracks in library`}
        onOpenSort={() => setShowSortModal(true)}
      />

      {/* Permission Warning Banner if not granted */}
      {!hasPermission && (
        <Pressable
          style={styles.permissionWarningBanner}
          onPress={() => setIsPermissionModalVisible(true)}>
          <View style={styles.permissionWarningIconBox}>
            <Folder size={18} color={AppColors.rose} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permissionWarningTitle}>Access Device Music</Text>
            <Text style={styles.permissionWarningSubtitle}>
              Grant storage permission to scan and play songs from your music folders
            </Text>
          </View>
          <View style={[styles.permissionWarningBtn, { backgroundColor: AppColors.rose }]}>
            <Text style={styles.permissionWarningBtnText}>Grant</Text>
          </View>
        </Pressable>
      )}

      {/* Sub tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          <Pressable
            style={[styles.tabItem, activeSubTab === 'tracks' && styles.tabItemActive]}
            onPress={() => setActiveSubTab('tracks')}>
            <Music size={15} color={activeSubTab === 'tracks' ? AppColors.primary : AppColors.textSecondary} />
            <Text style={[styles.tabText, activeSubTab === 'tracks' && styles.tabTextActive]}>
              Tracks ({audios.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeSubTab === 'playlists' && styles.tabItemActive]}
            onPress={() => setActiveSubTab('playlists')}>
            <ListMusic size={15} color={activeSubTab === 'playlists' ? AppColors.primary : AppColors.textSecondary} />
            <Text style={[styles.tabText, activeSubTab === 'playlists' && styles.tabTextActive]}>
              Playlists ({playlists.filter(p => p.type === 'audio').length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeSubTab === 'artists' && styles.tabItemActive]}
            onPress={() => setActiveSubTab('artists')}>
            <User size={15} color={activeSubTab === 'artists' ? AppColors.primary : AppColors.textSecondary} />
            <Text style={[styles.tabText, activeSubTab === 'artists' && styles.tabTextActive]}>
              Artists ({artistGroups.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabItem, activeSubTab === 'folders' && styles.tabItemActive]}
            onPress={() => setActiveSubTab('folders')}>
            <Folder size={15} color={activeSubTab === 'folders' ? AppColors.primary : AppColors.textSecondary} />
            <Text style={[styles.tabText, activeSubTab === 'folders' && styles.tabTextActive]}>
              Folders ({audioFolders.length})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Quick Play & Shuffle Bar */}
      {activeSubTab === 'tracks' && processedAudios.length > 0 && (
        <View style={styles.quickPlayRow}>
          <Pressable
            style={styles.playAllBtn}
            onPress={() => handlePlayAll(false)}>
            <Play size={16} color="#000" fill="#000" />
            <Text style={styles.playAllText}>Play All</Text>
          </Pressable>

          <Pressable
            style={styles.shuffleBtn}
            onPress={() => handlePlayAll(true)}>
            <Shuffle size={16} color={AppColors.text} />
            <Text style={styles.shuffleText}>Shuffle</Text>
          </Pressable>
        </View>
      )}

      {/* Tab Content */}
      {activeSubTab === 'tracks' && (
        <FlatList
          data={processedAudios}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <AudioTrackRow
              item={item}
              onPress={() => playTrack(item, processedAudios)}
              onMorePress={() => {
                setSelectedMedia(item);
                setShowActionSheet(true);
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshLibrary}
              tintColor={AppColors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Music size={48} color={AppColors.textMuted} />
              <Text style={styles.emptyText}>No songs found</Text>
              <Text style={styles.emptySubtext}>
                Tap + in header to add audio files from local storage
              </Text>
            </View>
          }
        />
      )}

      {activeSubTab === 'playlists' && (
        <FlatList
          data={playlists.filter(p => p.type === 'audio')}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.playlistRow}
              onPress={() => {
                const tracks = audios.filter(a => item.mediaIds.includes(a.id));
                if (tracks.length > 0) {
                  playTrack(tracks[0], tracks);
                }
              }}>
              <View style={styles.playlistIcon}>
                <ListMusic size={22} color={AppColors.primary} />
              </View>
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistTitle}>{item.title}</Text>
                <Text style={styles.playlistCount}>{item.mediaIds.length} tracks</Text>
              </View>
              <Play size={18} color={AppColors.textSecondary} />
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeSubTab === 'artists' && (
        <FlatList
          data={artistGroups}
          keyExtractor={item => item.artist}
          renderItem={({ item }) => (
            <Pressable
              style={styles.artistRow}
              onPress={() => {
                if (item.tracks.length > 0) {
                  playTrack(item.tracks[0], item.tracks);
                }
              }}>
              <View style={styles.artistAvatar}>
                <User size={22} color={AppColors.accent} />
              </View>
              <View style={styles.artistInfo}>
                <Text style={styles.artistName}>{item.artist}</Text>
                <Text style={styles.artistTrackCount}>{item.count} {item.count === 1 ? 'song' : 'songs'}</Text>
              </View>
              <Play size={18} color={AppColors.textSecondary} />
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeSubTab === 'folders' && (
        <FlatList
          data={audioFolders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <FolderCard
              folder={item}
              isSelected={false}
              onPress={() => {
                const tracks = audios.filter(a => a.folderName === item.name || a.albumTitle === item.name);
                if (tracks.length > 0) {
                  playTrack(tracks[0], tracks);
                }
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Action Sheet */}
      <MediaActionSheet
        item={selectedMedia}
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onPlay={() => {
          if (selectedMedia) {
            playTrack(selectedMedia, processedAudios);
          }
        }}
        onAddToPlaylist={() => setShowPlaylistModal(true)}
      />

      {/* Playlist Modal */}
      <PlaylistModal
        item={selectedMedia}
        visible={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
      />

      {/* Sort Filter Modal */}
      <SortFilterModal
        visible={showSortModal}
        onClose={() => setShowSortModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  tabBar: {
    backgroundColor: AppColors.background,
    paddingVertical: 10,
  },
  permissionWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  permissionWarningIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionWarningTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  permissionWarningSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  permissionWarningBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permissionWarningBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  tabItemActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: AppColors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  tabTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  quickPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  playAllText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  shuffleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.card,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  shuffleText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 13,
    color: AppColors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: AppColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
  },
  playlistCount: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: AppColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  artistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  artistName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
  },
  artistTrackCount: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
});
