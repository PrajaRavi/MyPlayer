import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  AudioPlayer,
  AudioStatus,
} from 'expo-audio';
import { MediaItem, AudioRepeatMode, EqualizerPreset } from '@/types/media';
import { EQUALIZER_PRESETS } from '@/constants/demoMedia';
import { parseLrcLyrics, getCurrentLyricsIndex } from '@/services/lyricsParser';

interface AudioPlayerContextType {
  currentTrack: MediaItem | null;
  queue: MediaItem[];
  queueIndex: number;
  isPlaying: boolean;
  position: number; // in seconds
  duration: number; // in seconds
  volume: number;   // 0 to 1
  playbackRate: number;
  repeatMode: AudioRepeatMode;
  isBuffering: boolean;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  sleepTimerMinutes: number | null;
  setSleepTimer: (m: number | null) => void;
  activePreset: EqualizerPreset;
  setActivePreset: (preset: EqualizerPreset) => void;
  activeLyricsIndex: number;
  parsedLyrics: { time: number; text: string }[];

  playTrack: (track: MediaItem, playlist?: MediaItem[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  setVolume: (val: number) => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
  toggleRepeatMode: () => void;
  closePlayer: () => Promise<void>;
}

const getRandomIndex = (length: number, currentIdx: number): number => {
  if (length <= 1) return 0;
  const next = Math.floor(Math.random() * length);
  return next === currentIdx ? (currentIdx + 1) % length : next;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const playerRef = useRef<AudioPlayer | null>(null);
  const statusSubscriptionRef = useRef<{ remove: () => void } | null>(null);

  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1.0);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [repeatMode, setRepeatMode] = useState<AudioRepeatMode>('all');
  const [isBuffering, setIsBuffering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sleepTimerMinutes, setSleepTimer] = useState<number | null>(null);
  const [activePreset, setActivePreset] = useState<EqualizerPreset>(EQUALIZER_PRESETS[0]);
  const sleepTimerRef = useRef<any>(null);

  const repeatModeRef = useRef(repeatMode);
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const positionRef = useRef(position);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // Setup background audio mode & notification controls
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(e => console.warn('Audio mode error', e));

    requestNotificationPermissionsAsync().catch(e => console.warn('Notification permission error', e));

    return () => {
      if (statusSubscriptionRef.current) {
        statusSubscriptionRef.current.remove();
        statusSubscriptionRef.current = null;
      }
      if (playerRef.current) {
        try {
          if (typeof (playerRef.current as any).clearLockScreenControls === 'function') {
            (playerRef.current as any).clearLockScreenControls();
          }
        } catch {}
        playerRef.current.remove();
        playerRef.current = null;
      }
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, []);

  // Sleep timer handler
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (sleepTimerMinutes && sleepTimerMinutes > 0) {
      sleepTimerRef.current = setTimeout(async () => {
        if (playerRef.current) {
          playerRef.current.pause();
          setIsPlaying(false);
        }
        setSleepTimer(null);
      }, sleepTimerMinutes * 60 * 1000);
    }
  }, [sleepTimerMinutes]);

  const handleTrackEnd = () => {
    const currentRepeat = repeatModeRef.current;
    const currentQueue = queueRef.current;
    const currentIdx = queueIndexRef.current;

    if (currentRepeat === 'one') {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      }
      return;
    }

    if (currentRepeat === 'shuffle') {
      if (currentQueue.length > 1) {
        const randomIndex = getRandomIndex(currentQueue.length, currentIdx);
        playTrack(currentQueue[randomIndex], currentQueue);
        return;
      }
    }

    // Default or repeat all
    if (currentIdx < currentQueue.length - 1) {
      playTrack(currentQueue[currentIdx + 1], currentQueue);
    } else if (currentRepeat === 'all' && currentQueue.length > 0) {
      playTrack(currentQueue[0], currentQueue);
    } else {
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const playTrack = async (track: MediaItem, newQueue?: MediaItem[]) => {
    try {
      // First pause and tear down any running player
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {}
        try {
          if (typeof (playerRef.current as any).clearLockScreenControls === 'function') {
            (playerRef.current as any).clearLockScreenControls();
          }
        } catch {}
        playerRef.current.remove();
        playerRef.current = null;
      }
      if (statusSubscriptionRef.current) {
        statusSubscriptionRef.current.remove();
        statusSubscriptionRef.current = null;
      }

      setCurrentTrack(track);

      let targetQueue = queueRef.current;
      if (newQueue && newQueue.length > 0) {
        targetQueue = newQueue;
        setQueue(newQueue);
        const idx = newQueue.findIndex(item => item.id === track.id);
        setQueueIndex(idx !== -1 ? idx : 0);
      } else if (!targetQueue.some(item => item.id === track.id)) {
        targetQueue = [track];
        setQueue(targetQueue);
        setQueueIndex(0);
      } else {
        const idx = targetQueue.findIndex(item => item.id === track.id);
        if (idx !== -1) setQueueIndex(idx);
      }

      const player = createAudioPlayer({ uri: track.uri });
      player.volume = volume;
      if (typeof (player as any).setPlaybackRate === 'function') {
        (player as any).setPlaybackRate(playbackRate);
      } else {
        try {
          (player as any).playbackRate = playbackRate;
        } catch {
          // ignore if getter-only on native platform
        }
      }
      player.loop = repeatModeRef.current === 'one';

      // Setup lock screen & notification controls (seek bar, previous, next, play/pause)
      try {
        if (typeof (player as any).setActiveForLockScreen === 'function') {
          (player as any).setActiveForLockScreen(
            true,
            {
              title: track.title,
              artist: track.artist || 'Unknown Artist',
              album: track.albumTitle || 'OwnPlayer',
              artworkUrl: track.thumbnailUri || undefined,
            },
            {
              showNextTrack: true,
              showPreviousTrack: true,
              showSeekForward: true,
              showSeekBackward: true,
              seekForwardIntervalSeconds: 10,
              seekBackwardIntervalSeconds: 10,
            }
          );
        }
      } catch (err) {
        console.warn('Notification controls setup error', err);
      }

      const sub = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        setIsPlaying(status.playing);
        setIsBuffering(status.isBuffering);
        setPosition(status.currentTime);

        if (status.duration && status.duration > 0) {
          setDuration(status.duration);
        }

        if (status.didJustFinish) {
          handleTrackEnd();
        }
      });

      statusSubscriptionRef.current = sub;
      playerRef.current = player;
      player.play();
      setIsPlaying(true);
    } catch (e) {
      console.warn('Failed to play audio track:', e);
    }
  };

  const togglePlayPause = async () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Error toggling play/pause:', e);
    }
  };

  const seekTo = async (seconds: number) => {
    if (!playerRef.current) return;
    try {
      await playerRef.current.seekTo(Math.max(0, seconds));
      setPosition(seconds);
    } catch (e) {
      console.warn('Error seeking audio:', e);
    }
  };

  const playNext = async () => {
    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) return;

    // 1. FIRST PAUSE the current playing song
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        setIsPlaying(false);
      } catch {}
    }

    // 2. Determine next track and play
    if (repeatModeRef.current === 'shuffle' && currentQueue.length > 1) {
      const nextIdx = Math.floor(Math.random() * currentQueue.length);
      await playTrack(currentQueue[nextIdx], currentQueue);
      return;
    }
    const nextIdx = (queueIndexRef.current + 1) % currentQueue.length;
    await playTrack(currentQueue[nextIdx], currentQueue);
  };

  const playPrevious = async () => {
    const currentQueue = queueRef.current;
    if (currentQueue.length === 0) return;

    // 1. FIRST PAUSE the current playing song
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        setIsPlaying(false);
      } catch {}
    }

    // If played more than 3s, restart current song
    if (positionRef.current > 3 && playerRef.current) {
      await playTrack(currentQueue[queueIndexRef.current], currentQueue);
      return;
    }
    const prevIdx = (queueIndexRef.current - 1 + currentQueue.length) % currentQueue.length;
    await playTrack(currentQueue[prevIdx], currentQueue);
  };

  const setVolume = async (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (playerRef.current) {
      playerRef.current.volume = clamped;
    }
  };

  const setPlaybackRate = async (rate: number) => {
    setPlaybackRateState(rate);
    if (playerRef.current) {
      if (typeof (playerRef.current as any).setPlaybackRate === 'function') {
        (playerRef.current as any).setPlaybackRate(rate);
      } else {
        try {
          (playerRef.current as any).playbackRate = rate;
        } catch {
          // ignore if getter-only
        }
      }
    }
  };

  const toggleRepeatMode = () => {
    setRepeatMode(prev => {
      let next: AudioRepeatMode = 'all';
      if (prev === 'all') next = 'one';
      else if (prev === 'one') next = 'shuffle';
      else if (prev === 'shuffle') next = 'off';
      else next = 'all';

      if (playerRef.current) {
        playerRef.current.loop = next === 'one';
      }
      return next;
    });
  };

  const closePlayer = async () => {
    if (statusSubscriptionRef.current) {
      statusSubscriptionRef.current.remove();
      statusSubscriptionRef.current = null;
    }
    if (playerRef.current) {
      try {
        if (typeof (playerRef.current as any).clearLockScreenControls === 'function') {
          (playerRef.current as any).clearLockScreenControls();
        }
      } catch {}
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setPosition(0);
  };

  // Synced lyrics calculation
  const parsedLyrics = currentTrack?.sampleLyrics
    ? parseLrcLyrics(currentTrack.sampleLyrics)
    : [];

  const activeLyricsIndex = getCurrentLyricsIndex(parsedLyrics, position);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        position,
        duration: duration || currentTrack?.duration || 0,
        volume,
        playbackRate,
        repeatMode,
        isBuffering,
        isExpanded,
        setIsExpanded,
        sleepTimerMinutes,
        setSleepTimer,
        activePreset,
        setActivePreset,
        activeLyricsIndex,
        parsedLyrics,
        playTrack,
        togglePlayPause,
        seekTo,
        playNext,
        playPrevious,
        setVolume,
        setPlaybackRate,
        toggleRepeatMode,
        closePlayer,
      }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};