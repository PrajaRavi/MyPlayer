import AsyncStorage from '@react-native-async-storage/async-storage';
import { Playlist, StreamBookmark, MediaItem } from '@/types/media';

const KEYS = {
  RESUME_POSITIONS: 'ownplayer_resume_positions',
  PLAYLISTS: 'ownplayer_playlists',
  FAVORITES: 'ownplayer_favorites',
  VAULT_PIN: 'ownplayer_vault_pin',
  VAULT_ITEMS: 'ownplayer_vault_items',
  STREAM_BOOKMARKS: 'ownplayer_stream_bookmarks',
  SETTINGS: 'ownplayer_settings',
  RECENT_SEARCHES: 'ownplayer_recent_searches',
};

export const StorageService = {
  // --- Resume positions ---
  async getResumePositions(): Promise<Record<string, number>> {
    try {
      const data = await AsyncStorage.getItem(KEYS.RESUME_POSITIONS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  async saveResumePosition(mediaId: string, positionSeconds: number): Promise<void> {
    try {
      const positions = await this.getResumePositions();
      positions[mediaId] = positionSeconds;
      await AsyncStorage.setItem(KEYS.RESUME_POSITIONS, JSON.stringify(positions));
    } catch (e) {
      console.warn('Failed to save resume position', e);
    }
  },

  async clearResumePosition(mediaId: string): Promise<void> {
    try {
      const positions = await this.getResumePositions();
      delete positions[mediaId];
      await AsyncStorage.setItem(KEYS.RESUME_POSITIONS, JSON.stringify(positions));
    } catch (e) {
      console.warn('Failed to clear resume position', e);
    }
  },

  // --- Playlists ---
  async getPlaylists(): Promise<Playlist[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PLAYLISTS);
      if (data) return JSON.parse(data);
      // Default initial playlists
      const initial: Playlist[] = [
        { id: 'pl_favorites_v', title: 'Favorite Videos', createdAt: Date.now(), mediaIds: ['demo_video_1'], type: 'video' },
        { id: 'pl_chill_audio', title: 'Night Vibes', createdAt: Date.now(), mediaIds: ['demo_audio_1', 'demo_audio_3'], type: 'audio' },
      ];
      await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  },

  async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.warn('Failed to save playlists', e);
    }
  },

  async createPlaylist(title: string, type: 'video' | 'audio'): Promise<Playlist> {
    const playlists = await this.getPlaylists();
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      createdAt: Date.now(),
      mediaIds: [],
      type,
    };
    playlists.push(newPlaylist);
    await this.savePlaylists(playlists);
    return newPlaylist;
  },

  async addMediaToPlaylist(playlistId: string, mediaId: string): Promise<void> {
    const playlists = await this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist && !playlist.mediaIds.includes(mediaId)) {
      playlist.mediaIds.push(mediaId);
      await this.savePlaylists(playlists);
    }
  },

  async removeMediaFromPlaylist(playlistId: string, mediaId: string): Promise<void> {
    const playlists = await this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      playlist.mediaIds = playlist.mediaIds.filter(id => id !== mediaId);
      await this.savePlaylists(playlists);
    }
  },

  // --- Favorites ---
  async getFavorites(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : ['demo_video_1', 'demo_audio_1'];
    } catch {
      return [];
    }
  },

  async toggleFavorite(mediaId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const exists = favorites.includes(mediaId);
      const updated = exists ? favorites.filter(id => id !== mediaId) : [...favorites, mediaId];
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
      return !exists;
    } catch {
      return false;
    }
  },

  // --- Private Vault ---
  async getVaultPin(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.VAULT_PIN);
    } catch {
      return null;
    }
  },

  async setVaultPin(pin: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.VAULT_PIN, pin);
    } catch (e) {
      console.warn('Failed to set vault pin', e);
    }
  },

  async getVaultItems(): Promise<MediaItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.VAULT_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addVaultItem(item: MediaItem): Promise<void> {
    try {
      const items = await this.getVaultItems();
      if (!items.some(i => i.id === item.id)) {
        items.push({ ...item, isHidden: true });
        await AsyncStorage.setItem(KEYS.VAULT_ITEMS, JSON.stringify(items));
      }
    } catch (e) {
      console.warn('Failed to add vault item', e);
    }
  },

  async removeVaultItem(itemId: string): Promise<void> {
    try {
      const items = await this.getVaultItems();
      const updated = items.filter(i => i.id !== itemId);
      await AsyncStorage.setItem(KEYS.VAULT_ITEMS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to remove vault item', e);
    }
  },

  // --- Stream Bookmarks ---
  async getStreamBookmarks(): Promise<StreamBookmark[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.STREAM_BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveStreamBookmark(bookmark: Omit<StreamBookmark, 'id' | 'addedAt'>): Promise<StreamBookmark> {
    const list = await this.getStreamBookmarks();
    const newBookmark: StreamBookmark = {
      ...bookmark,
      id: `stream_${Date.now()}`,
      addedAt: Date.now(),
    };
    list.unshift(newBookmark);
    await AsyncStorage.setItem(KEYS.STREAM_BOOKMARKS, JSON.stringify(list));
    return newBookmark;
  },

  async deleteStreamBookmark(id: string): Promise<void> {
    const list = await this.getStreamBookmarks();
    const updated = list.filter(item => item.id !== id);
    await AsyncStorage.setItem(KEYS.STREAM_BOOKMARKS, JSON.stringify(updated));
  },
};
