import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Film, Folder, Play, ArrowRight } from 'lucide-react-native';
import { useMediaContext } from '@/context/MediaContext';
import { AppColors } from '@/constants/colors';
import { Header } from '@/components/common/Header';
import { MediaCard } from '@/components/common/MediaCard';
import { FolderCard } from '@/components/common/FolderCard';
import { MediaActionSheet } from '@/components/common/MediaActionSheet';
import { PlaylistModal } from '@/components/common/PlaylistModal';
import { SortFilterModal } from '@/components/common/SortFilterModal';
import { MediaItem } from '@/types/media';
import { formatDuration } from '@/utils/formatters';

export default function VideosScreen() {
  const router = useRouter();
  const {
    videos,
    videoFolders,
    isLoading,
    refreshLibrary,
    searchQuery,
    selectedFolder,
    setSelectedFolder,
    sortMode,
    sortOrder,
    getResumePosition,
    hasPermission,
    setIsPermissionModalVisible,
  } = useMediaContext();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'folders'>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Filtered and sorted videos
  const processedVideos = useMemo(() => {
    let list = [...videos];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v =>
        v.title.toLowerCase().includes(q) ||
        (v.folderName && v.folderName.toLowerCase().includes(q))
      );
    }

    // Selected folder filter
    if (selectedFolder) {
      list = list.filter(v => v.folderName === selectedFolder);
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortMode === 'name') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortMode === 'date') {
        comparison = (a.modificationTime || 0) - (b.modificationTime || 0);
      } else if (sortMode === 'size') {
        comparison = (a.size || 0) - (b.size || 0);
      } else if (sortMode === 'duration') {
        comparison = (a.duration || 0) - (b.duration || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [videos, searchQuery, selectedFolder, sortMode, sortOrder]);

  // Find most recent video with resume position for "Continue Watching" banner
  const continueWatchingItem = useMemo(() => {
    for (const v of videos) {
      const pos = getResumePosition(v.id);
      if (pos > 10 && v.duration > 0 && pos < v.duration - 10) {
        return { item: v, pos };
      }
    }
    return null;
  }, [videos, getResumePosition]);

  const handlePlayVideo = (item: MediaItem, resume: boolean = true) => {
    router.push({
      pathname: '/player/video',
      params: {
        id: item.id,
        resume: resume ? 'true' : 'false',
      },
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Videos"
        subtitle={`${videos.length} videos available`}
        onOpenSort={() => setShowSortModal(true)}
      />

      {/* Permission Warning Banner if not granted */}
      {!hasPermission && (
        <Pressable
          style={styles.permissionWarningBanner}
          onPress={() => setIsPermissionModalVisible(true)}>
          <View style={styles.permissionWarningIconBox}>
            <Folder size={18} color={AppColors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.permissionWarningTitle}>Access Device Videos</Text>
            <Text style={styles.permissionWarningSubtitle}>
              Grant storage permission to scan and organize your phone's movie folders
            </Text>
          </View>
          <View style={styles.permissionWarningBtn}>
            <Text style={styles.permissionWarningBtnText}>Grant</Text>
          </View>
        </Pressable>
      )}

      {/* Sub-tab switcher: All Videos vs Folders */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeSubTab === 'all' && styles.tabItemActive]}
          onPress={() => {
            setActiveSubTab('all');
            setSelectedFolder(null);
          }}>
          <Film size={16} color={activeSubTab === 'all' ? AppColors.primary : AppColors.textSecondary} />
          <Text style={[styles.tabText, activeSubTab === 'all' && styles.tabTextActive]}>
            All Videos ({videos.length})
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeSubTab === 'folders' && styles.tabItemActive]}
          onPress={() => setActiveSubTab('folders')}>
          <Folder size={16} color={activeSubTab === 'folders' ? AppColors.primary : AppColors.textSecondary} />
          <Text style={[styles.tabText, activeSubTab === 'folders' && styles.tabTextActive]}>
            Folders ({videoFolders.length})
          </Text>
        </Pressable>
      </View>

      {/* Folder Breadcrumb if a folder is selected */}
      {selectedFolder && (
        <View style={styles.folderFilterBanner}>
          <Text style={styles.folderFilterText}>
            Folder: <Text style={styles.folderFilterHighlight}>{selectedFolder}</Text>
          </Text>
          <Pressable onPress={() => setSelectedFolder(null)} hitSlop={8}>
            <Text style={styles.clearFilterText}>Show All</Text>
          </Pressable>
        </View>
      )}

      {/* Continue Watching Banner */}
      {continueWatchingItem && !selectedFolder && activeSubTab === 'all' && !searchQuery && (
        <Pressable
          style={styles.continueCard}
          onPress={() => handlePlayVideo(continueWatchingItem.item, true)}>
          <View style={styles.continueIcon}>
            <Play size={20} color="#000" fill="#000" style={{ marginLeft: 2 }} />
          </View>
          <View style={styles.continueInfo}>
            <Text style={styles.continueLabel}>CONTINUE WATCHING</Text>
            <Text style={styles.continueTitle} numberOfLines={1}>
              {continueWatchingItem.item.title}
            </Text>
            <Text style={styles.continueTime}>
              Resume from {formatDuration(continueWatchingItem.pos)} / {formatDuration(continueWatchingItem.item.duration)}
            </Text>
          </View>
          <ArrowRight size={18} color={AppColors.primary} />
        </Pressable>
      )}

      {/* Main Content */}
      {activeSubTab === 'all' || selectedFolder ? (
        <FlatList
          data={processedVideos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MediaCard
              item={item}
              onPress={() => handlePlayVideo(item, true)}
              onMorePress={() => {
                setSelectedMedia(item);
                setShowActionSheet(true);
              }}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshLibrary}
              tintColor={AppColors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Film size={48} color={AppColors.textMuted} />
              <Text style={styles.emptyText}>No videos found</Text>
              <Text style={styles.emptySubtext}>
                Tap + in the header to import video files from device storage
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={videoFolders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <FolderCard
              folder={item}
              isSelected={selectedFolder === item.name}
              onPress={() => {
                setSelectedFolder(item.name);
                setActiveSubTab('all');
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
        />
      )}

      {/* Action Sheet */}
      <MediaActionSheet
        item={selectedMedia}
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onPlay={resume => {
          if (selectedMedia) {
            handlePlayVideo(selectedMedia, resume);
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.background,
    gap: 12,
  },
  permissionWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  permissionWarningIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
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
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permissionWarningBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
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
  folderFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AppColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  folderFilterText: {
    color: AppColors.textSecondary,
    fontSize: 13,
  },
  folderFilterHighlight: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  clearFilterText: {
    color: AppColors.rose,
    fontSize: 12,
    fontWeight: '600',
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  continueIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueInfo: {
    flex: 1,
    marginLeft: 12,
  },
  continueLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: AppColors.primary,
    letterSpacing: 0.5,
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
    marginTop: 2,
  },
  continueTime: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
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
});
