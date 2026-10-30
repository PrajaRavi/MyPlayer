import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { MediaItem, FolderGroup, Playlist, MediaType } from '@/types/media';
import { DEMO_VIDEOS, DEMO_AUDIOS } from '@/constants/demoMedia';
import { StorageService } from '@/services/storage';
import { MediaScanner } from '@/services/mediaScanner';

export type SortMode = 'name' | 'date' | 'size' | 'duration';
export type SortOrder = 'asc' | 'desc';

interface MediaContextType {
  videos: MediaItem[];
  audios: MediaItem[];
  videoFolders: FolderGroup[];
  audioFolders: FolderGroup[];
  playlists: Playlist[];
  favorites: string[];
  resumePositions: Record<string, number>;
  vaultItems: MediaItem[];
  isVaultUnlocked: boolean;
  hasVaultPin: boolean;

  isLoading: boolean;
  isScanning: boolean;
  hasPermission: boolean;
  isPermissionModalVisible: boolean;
  setIsPermissionModalVisible: (visible: boolean) => void;
  requestStoragePermission: () => Promise<boolean>;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;

  refreshLibrary: () => Promise<void>;
  pickExternalMedia: () => Promise<MediaItem | null>;
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  updateResumePosition: (id: string, positionSeconds: number) => Promise<void>;
  getResumePosition: (id: string) => number;

  createPlaylist: (title: string, type: MediaType) => Promise<Playlist>;
  addToPlaylist: (playlistId: string, mediaId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, mediaId: string) => Promise<void>;

  unlockVault: (pin: string) => Promise<boolean>;
  lockVault: () => void;
  setupVaultPin: (pin: string) => Promise<void>;
  moveToVault: (item: MediaItem) => Promise<void>;
  restoreFromVault: (item: MediaItem) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | null>(null);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<MediaItem[]>(DEMO_VIDEOS);
  const [audios, setAudios] = useState<MediaItem[]>(DEMO_AUDIOS);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [resumePositions, setResumePositions] = useState<Record<string, number>>({});
  const [vaultItems, setVaultItems] = useState<MediaItem[]>([]);
  const [hasVaultPin, setHasVaultPin] = useState(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const scanInternalMedia = useCallback(async (currentVault: MediaItem[]) => {
    setIsScanning(true);
    try {
      const [deviceVids, deviceAuds] = await Promise.all([
        MediaScanner.scanDeviceVideos(),
        MediaScanner.scanDeviceAudios(),
      ]);

      const vaultIds = new Set(currentVault.map(v => v.id));
      setVideos(deviceVids.filter(v => !vaultIds.has(v.id)));
      setAudios(deviceAuds.filter(a => !vaultIds.has(a.id)));
    } catch (e) {
      console.warn('Error during media scan:', e);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pos, pl, favs, vault, pin, permissionGranted] = await Promise.all([
        StorageService.getResumePositions(),
        StorageService.getPlaylists(),
        StorageService.getFavorites(),
        StorageService.getVaultItems(),
        StorageService.getVaultPin(),
        MediaScanner.checkPermissions(),
      ]);

      setResumePositions(pos);
      setPlaylists(pl);
      setFavorites(favs);
      setVaultItems(vault);
      setHasVaultPin(!!pin);
      setHasPermission(permissionGranted);

      if (!permissionGranted) {
        // First launch or permission not yet granted -> Show MX Player / PLAYit style prompt
        setIsPermissionModalVisible(true);
      } else {
        // Permission already granted -> scan internal storage
        await scanInternalMedia(vault);
      }
    } catch (e) {
      console.warn('Failed to load initial media data', e);
    } finally {
      setIsLoading(false);
    }
  }, [scanInternalMedia]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const requestStoragePermission = async (): Promise<boolean> => {
    setIsScanning(true);
    try {
      const granted = await MediaScanner.requestPermissions();
      setHasPermission(granted);

      if (granted) {
        const vault = await StorageService.getVaultItems();
        await scanInternalMedia(vault);
        setIsPermissionModalVisible(false);
        return true;
      }
      return false;
    } finally {
      setIsScanning(false);
    }
  };

  const refreshLibrary = async () => {
    setIsLoading(true);
    try {
      const vault = await StorageService.getVaultItems();
      setVaultItems(vault);
      await scanInternalMedia(vault);
    } finally {
      setIsLoading(false);
    }
  };

  const pickExternalMedia = async (): Promise<MediaItem | null> => {
    const item = await MediaScanner.pickMediaFile();
    if (item) {
      if (item.mediaType === 'video') {
        setVideos(prev => [item, ...prev]);
      } else {
        setAudios(prev => [item, ...prev]);
      }
    }
    return item;
  };

  const toggleFavorite = async (id: string) => {
    await StorageService.toggleFavorite(id);
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  const updateResumePosition = async (id: string, positionSeconds: number) => {
    await StorageService.saveResumePosition(id, positionSeconds);
    setResumePositions(prev => ({ ...prev, [id]: positionSeconds }));
  };

  const getResumePosition = useCallback(
    (id: string) => resumePositions[id] || 0,
    [resumePositions]
  );

  const createPlaylist = async (title: string, type: MediaType) => {
    const pl = await StorageService.createPlaylist(title, type);
    setPlaylists(prev => [...prev, pl]);
    return pl;
  };

  const addToPlaylist = async (playlistId: string, mediaId: string) => {
    await StorageService.addMediaToPlaylist(playlistId, mediaId);
    setPlaylists(prev =>
      prev.map(p =>
        p.id === playlistId && !p.mediaIds.includes(mediaId)
          ? { ...p, mediaIds: [...p.mediaIds, mediaId] }
          : p
      )
    );
  };

  const removeFromPlaylist = async (playlistId: string, mediaId: string) => {
    await StorageService.removeMediaFromPlaylist(playlistId, mediaId);
    setPlaylists(prev =>
      prev.map(p =>
        p.id === playlistId
          ? { ...p, mediaIds: p.mediaIds.filter(id => id !== mediaId) }
          : p
      )
    );
  };

  // --- Vault operations ---
  const unlockVault = async (pin: string): Promise<boolean> => {
    const savedPin = await StorageService.getVaultPin();
    if (!savedPin) {
      // First time setting PIN
      await StorageService.setVaultPin(pin);
      setHasVaultPin(true);
      setIsVaultUnlocked(true);
      return true;
    }
    if (savedPin === pin) {
      setIsVaultUnlocked(true);
      return true;
    }
    return false;
  };

  const lockVault = () => {
    setIsVaultUnlocked(false);
  };

  const setupVaultPin = async (pin: string) => {
    await StorageService.setVaultPin(pin);
    setHasVaultPin(true);
    setIsVaultUnlocked(true);
  };

  const moveToVault = async (item: MediaItem) => {
    await StorageService.addVaultItem(item);
    setVaultItems(prev => [...prev, { ...item, isHidden: true }]);
    if (item.mediaType === 'video') {
      setVideos(prev => prev.filter(v => v.id !== item.id));
    } else {
      setAudios(prev => prev.filter(a => a.id !== item.id));
    }
  };

  const restoreFromVault = async (item: MediaItem) => {
    await StorageService.removeVaultItem(item.id);
    setVaultItems(prev => prev.filter(i => i.id !== item.id));
    const restored = { ...item, isHidden: false };
    if (restored.mediaType === 'video') {
      setVideos(prev => [restored, ...prev]);
    } else {
      setAudios(prev => [restored, ...prev]);
    }
  };

  const deleteMedia = async (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    setAudios(prev => prev.filter(a => a.id !== id));
    await StorageService.removeVaultItem(id);
    await StorageService.clearResumePosition(id);
  };

  // Folders calculated from videos
  const videoFolders = useMemo(() => {
    const folderMap: Record<string, { count: number; totalSize: number; coverUri?: string }> = {};
    for (const v of videos) {
      const folder = v.folderName || 'Internal Storage';
      if (!folderMap[folder]) {
        folderMap[folder] = { count: 0, totalSize: 0, coverUri: v.thumbnailUri };
      }
      folderMap[folder].count++;
      folderMap[folder].totalSize += v.size || 0;
    }
    return Object.entries(folderMap).map(([name, data]) => ({
      id: `folder_${name}`,
      name,
      itemCount: data.count,
      totalSize: data.totalSize,
      coverUri: data.coverUri,
      mediaType: 'video' as MediaType,
    }));
  }, [videos]);

  // Audio folders
  const audioFolders = useMemo(() => {
    const folderMap: Record<string, { count: number; totalSize: number; coverUri?: string }> = {};
    for (const a of audios) {
      const folder = a.folderName || a.albumTitle || 'All Tracks';
      if (!folderMap[folder]) {
        folderMap[folder] = { count: 0, totalSize: 0, coverUri: a.thumbnailUri };
      }
      folderMap[folder].count++;
      folderMap[folder].totalSize += a.size || 0;
    }
    return Object.entries(folderMap).map(([name, data]) => ({
      id: `audio_folder_${name}`,
      name,
      itemCount: data.count,
      totalSize: data.totalSize,
      coverUri: data.coverUri,
      mediaType: 'audio' as MediaType,
    }));
  }, [audios]);

  return (
    <MediaContext.Provider
      value={{
        videos,
        audios,
        videoFolders,
        audioFolders,
        playlists,
        favorites,
        resumePositions,
        vaultItems,
        isVaultUnlocked,
        hasVaultPin,
        isLoading,
        isScanning,
        hasPermission,
        isPermissionModalVisible,
        setIsPermissionModalVisible,
        requestStoragePermission,
        searchQuery,
        setSearchQuery,
        selectedFolder,
        setSelectedFolder,
        sortMode,
        setSortMode,
        sortOrder,
        setSortOrder,
        refreshLibrary,
        pickExternalMedia,
        toggleFavorite,
        isFavorite,
        updateResumePosition,
        getResumePosition,
        createPlaylist,
        addToPlaylist,
        removeFromPlaylist,
        unlockVault,
        lockVault,
        setupVaultPin,
        moveToVault,
        restoreFromVault,
        deleteMedia,
      }}>
      {children}
    </MediaContext.Provider>
  );
};

export const useMediaContext = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMediaContext must be used within a MediaProvider');
  }
  return context;
};
