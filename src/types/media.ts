export type MediaType = 'video' | 'audio';

export interface AudioTrack {
  id: string;
  label: string;
  language: string;
  index: number;
  uri?: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  uri: string;
  isCustom?: boolean;
}

export interface SubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface MediaItem {
  id: string;
  title: string;
  filename: string;
  uri: string;
  duration: number; // in seconds
  size: number;     // in bytes
  modificationTime: number; // timestamp ms
  mediaType: MediaType;
  width?: number;
  height?: number;
  thumbnailUri?: string;
  albumId?: string;
  albumTitle?: string;
  artist?: string;
  folderName?: string;
  isFavorite?: boolean;
  isHidden?: boolean;
  lastPosition?: number; // in seconds
  lastPlayedTime?: number; // timestamp ms
  audioTracks?: AudioTrack[];
  subtitleTracks?: SubtitleTrack[];
  qualityTag?: string; // '4K' | '1080p' | '720p' | 'HD'
  isLive?: boolean;
  sampleLyrics?: string;
}

export interface Playlist {
  id: string;
  title: string;
  createdAt: number;
  mediaIds: string[];
  type: MediaType;
}

export interface FolderGroup {
  id: string;
  name: string;
  path?: string;
  itemCount: number;
  totalSize: number;
  coverUri?: string;
  mediaType: MediaType;
}

export type ResizeModeType = 'contain' | 'cover' | 'stretch' | '16:9' | '4:3';
export type OrientationLockType = 'auto' | 'portrait' | 'landscape';

export interface ABRepeatSettings {
  a: number | null;
  b: number | null;
  enabled: boolean;
}

export interface PlayerSettings {
  playbackSpeed: number;
  resizeMode: ResizeModeType;
  orientation: OrientationLockType;
  sleepTimerMinutes: number | null;
  abRepeat: ABRepeatSettings;
  backgroundAudio: boolean;
  audioBoost: number; // 1.0 to 2.0 (100% to 200%)
  subtitleDelay: number; // in seconds
  subtitleFontSize: number;
  selectedSubtitleId: string | null;
  selectedAudioTrackIndex: number;
}

export interface LyricsLine {
  time: number; // in seconds
  text: string;
}

export interface StreamBookmark {
  id: string;
  title: string;
  url: string;
  type: 'hls' | 'mp4' | 'mp3' | 'live';
  addedAt: number;
}

export type AudioRepeatMode = 'off' | 'all' | 'one' | 'shuffle';

export interface EqualizerPreset {
  id: string;
  name: string;
  description: string;
  gainBass: number;
  gainMid: number;
  gainTreble: number;
}
