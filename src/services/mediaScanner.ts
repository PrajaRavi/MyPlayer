import * as MediaLibrary from 'expo-media-library/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { MediaItem } from '@/types/media';
import { DEMO_VIDEOS, DEMO_AUDIOS } from '@/constants/demoMedia';

function extractFolderName(uri: string, filename: string, albumName?: string): string {
  if (albumName && albumName.trim().length > 0) {
    return albumName.trim();
  }

  try {
    const decoded = decodeURIComponent(uri).replace(/\\/g, '/');
    const parts = decoded.split('/').filter(Boolean);

    // If filename is at the end, the folder is the preceding segment
    if (parts.length >= 2) {
      const folderCandidate = parts[parts.length - 2];
      const ignored = new Set(['0', 'emulated', 'storage', 'sdcard', 'media', 'files']);
      if (!ignored.has(folderCandidate.toLowerCase())) {
        return folderCandidate;
      }
    }
  } catch {
    // fallback
  }

  return 'Internal Storage';
}

function computeQualityTag(width?: number, height?: number): string {
  if (!width || !height) return 'HD';
  const maxDim = Math.max(width, height);
  if (maxDim >= 3840) return '4K';
  if (maxDim >= 1920) return '1080p';
  if (maxDim >= 1280) return '720p';
  if (maxDim >= 720) return '480p';
  return 'SD';
}

export const MediaScanner = {
  async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return true;
      const { status } = await MediaLibrary.getPermissionsAsync(false);
      return status === 'granted';
    } catch {
      return false;
    }
  },

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return true;
      const { status } = await MediaLibrary.requestPermissionsAsync(false);
      return status === 'granted';
    } catch {
      return false;
    }
  },

  async scanDeviceVideos(): Promise<MediaItem[]> {
    const scannedList: MediaItem[] = [];

    try {
      if (Platform.OS !== 'web') {
        const hasPermission = await this.checkPermissions();
        if (hasPermission) {
          // Build album title lookup map for folder names
          const albumMap = new Map<string, string>();
          try {
            const albums = await MediaLibrary.getAlbumsAsync();
            for (const album of albums) {
              if (album.id && album.title) {
                albumMap.set(album.id, album.title);
              }
            }
          } catch (albumErr) {
            console.warn('Failed to query albums', albumErr);
          }

          // Paginate through videos up to 1000 items
          let hasMore = true;
          let after: string | undefined = undefined;
          let totalScanned = 0;
          const maxAssets = 1000;

          while (hasMore && totalScanned < maxAssets) {
            const page = await MediaLibrary.getAssetsAsync({
              mediaType: [MediaLibrary.MediaType.video],
              first: 100,
              after,
              sortBy: [MediaLibrary.SortBy.modificationTime],
            });

            if (!page.assets || page.assets.length === 0) break;

            for (const asset of page.assets) {
              const albumTitle = asset.albumId ? albumMap.get(asset.albumId) : undefined;
              const folderName = extractFolderName(asset.uri, asset.filename, albumTitle);
              const cleanTitle = asset.filename.replace(/\.[^/.]+$/, '');
              const qualityTag = computeQualityTag(asset.width, asset.height);

              const item: MediaItem = {
                id: `device_vid_${asset.id}`,
                title: cleanTitle || 'Video',
                filename: asset.filename,
                uri: asset.uri,
                duration: Math.round(asset.duration || 0),
                size: 0,
                modificationTime: asset.modificationTime || Date.now(),
                mediaType: 'video',
                width: asset.width,
                height: asset.height,
                thumbnailUri: asset.uri,
                folderName,
                qualityTag,
              };

              scannedList.push(item);
            }

            totalScanned += page.assets.length;
            hasMore = page.hasNextPage;
            after = page.endCursor;

            if (!page.hasNextPage) break;
          }
        }
      }
    } catch (e) {
      console.warn('Error scanning device videos:', e);
    }

    // If real videos were found on phone, return them; otherwise fallback to DEMO_VIDEOS
    if (scannedList.length > 0) {
      return scannedList;
    }

    return [...DEMO_VIDEOS];
  },

  async scanDeviceAudios(): Promise<MediaItem[]> {
    const scannedList: MediaItem[] = [];

    try {
      if (Platform.OS !== 'web') {
        const hasPermission = await this.checkPermissions();
        if (hasPermission) {
          const albumMap = new Map<string, string>();
          try {
            const albums = await MediaLibrary.getAlbumsAsync();
            for (const album of albums) {
              if (album.id && album.title) {
                albumMap.set(album.id, album.title);
              }
            }
          } catch (albumErr) {
            console.warn('Failed to query audio albums', albumErr);
          }

          let hasMore = true;
          let after: string | undefined = undefined;
          let totalScanned = 0;
          const maxAssets = 1000;

          while (hasMore && totalScanned < maxAssets) {
            const page = await MediaLibrary.getAssetsAsync({
              mediaType: [MediaLibrary.MediaType.audio],
              first: 100,
              after,
              sortBy: [MediaLibrary.SortBy.modificationTime],
            });

            if (!page.assets || page.assets.length === 0) break;

            for (const asset of page.assets) {
              const albumTitle = asset.albumId ? albumMap.get(asset.albumId) : undefined;
              const folderName = extractFolderName(asset.uri, asset.filename, albumTitle || 'Music');
              const cleanTitle = asset.filename.replace(/\.[^/.]+$/, '');

              const item: MediaItem = {
                id: `device_aud_${asset.id}`,
                title: cleanTitle || 'Audio Track',
                filename: asset.filename,
                uri: asset.uri,
                duration: Math.round(asset.duration || 0),
                size: 0,
                modificationTime: asset.modificationTime || Date.now(),
                mediaType: 'audio',
                artist: 'Device Music',
                albumTitle: folderName,
                folderName,
                thumbnailUri: undefined,
                qualityTag: 'HQ Audio',
              };

              scannedList.push(item);
            }

            totalScanned += page.assets.length;
            hasMore = page.hasNextPage;
            after = page.endCursor;

            if (!page.hasNextPage) break;
          }
        }
      }
    } catch (e) {
      console.warn('Error scanning device audios:', e);
    }

    if (scannedList.length > 0) {
      return scannedList;
    }

    return [...DEMO_AUDIOS];
  },

  async pickMediaFile(): Promise<MediaItem | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const isVideo =
        (asset.mimeType && asset.mimeType.startsWith('video')) ||
        /\.(mp4|mkv|mov|webm|avi|flv|3gp|m4v)$/i.test(asset.name);

      const newItem: MediaItem = {
        id: `picked_${Date.now()}`,
        title: asset.name.replace(/\.[^/.]+$/, ''),
        filename: asset.name,
        uri: asset.uri,
        duration: 0,
        size: asset.size || 0,
        modificationTime: Date.now(),
        mediaType: isVideo ? 'video' : 'audio',
        folderName: 'Imported Files',
        qualityTag: isVideo ? 'HD' : 'HQ',
      };

      return newItem;
    } catch (e) {
      console.warn('Error picking media file:', e);
      return null;
    }
  },

  async pickSubtitleFile(): Promise<{ name: string; uri: string; content?: string } | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'application/x-subrip', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      return {
        name: asset.name,
        uri: asset.uri,
      };
    } catch (e) {
      console.warn('Error picking subtitle file:', e);
      return null;
    }
  },
};
