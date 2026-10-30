import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
  Dimensions,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView, VideoContentFit } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Brightness from 'expo-brightness';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Lock,
  Unlock,
  Subtitles,
  AudioLines,
  Maximize2,
  Sliders,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { useMediaContext } from '@/context/MediaContext';
import { MediaItem, PlayerSettings, SubtitleCue } from '@/types/media';
import { formatDuration } from '@/utils/formatters';
import { GestureHUD } from '@/components/video/GestureHUD';
import { SubtitlesOverlay } from '@/components/video/SubtitlesOverlay';
import { VideoSettingsModal } from '@/components/video/VideoSettingsModal';
import { SAMPLE_SUBTITLES } from '@/constants/demoMedia';
import { getCurrentSubtitleCue } from '@/services/subtitleParser';
import { MediaScanner } from '@/services/mediaScanner';

export default function VideoPlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; uri?: string; resume?: string; title?: string }>();
  const { videos, updateResumePosition, getResumePosition } = useMediaContext();

  // Active video item
  const currentVideo: MediaItem = (params.id && videos.find(v => v.id === params.id)) || {
    id: params.id || 'custom_stream',
    title: params.title || 'Video Playback',
    filename: 'video.mp4',
    uri: params.uri || videos[0]?.uri || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 0,
    size: 0,
    modificationTime: Date.now(),
    mediaType: 'video',
    qualityTag: '1080p',
    audioTracks: [
      { id: 'track_1', label: 'Default Audio (Stereo)', language: 'en', index: 0 },
      { id: 'track_2', label: 'Commentary / Second Track', language: 'en', index: 1 },
    ],
    subtitleTracks: [
      { id: 'sub_en', label: 'English Subtitles', language: 'en', uri: 'sample_en' },
      { id: 'sub_es', label: 'Spanish Subtitles', language: 'es', uri: 'sample_es' },
    ],
  };

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(currentVideo.duration || 0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // Settings
  const [settings, setSettings] = useState<PlayerSettings>({
    playbackSpeed: 1.0,
    resizeMode: 'contain',
    orientation: 'auto',
    sleepTimerMinutes: null,
    abRepeat: { a: null, b: null, enabled: false },
    backgroundAudio: true,
    audioBoost: 1.0,
    subtitleDelay: 0,
    subtitleFontSize: 18,
    selectedSubtitleId: 'sub_en',
    selectedAudioTrackIndex: 0,
  });

  // Memoized video source with progressive/hls caching options to prevent buffering on long videos
  const videoSource = useMemo(() => {
    const uri = currentVideo.uri;
    const isHls = uri.includes('.m3u8');
    return {
      uri,
      useCaching: !isHls,
      contentType: isHls ? ('hls' as const) : ('progressive' as const),
    };
  }, [currentVideo.uri]);

  // expo-video player instance with optimized buffer and update interval
  const player = useVideoPlayer(videoSource, p => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.5; // Reduced re-render overhead from 0.25 to 0.5s
    try {
      p.bufferOptions = {
        preferredForwardBufferDuration: 60, // buffer 60s ahead for long video stability
        minBufferForPlayback: 2.0,          // resume immediately once 2s is buffered
        prioritizeTimeOverSizeThreshold: true,
        waitsToMinimizeStalling: true,
      };
    } catch {
      // safe fallback if not supported on platform
    }
    p.play();
  });

  // HUD overlays state
  const [volumeHUD, setVolumeHUD] = useState<{ visible: boolean; value: number } | null>(null);
  const [brightnessHUD, setBrightnessHUD] = useState<{ visible: boolean; value: number } | null>(null);
  const [seekHUD, setSeekHUD] = useState<{ visible: boolean; diffSeconds: number; targetTime: number; duration: number } | null>(null);
  const [doubleTapHUD, setDoubleTapHUD] = useState<{ visible: boolean; type: 'rewind' | 'forward'; seconds: number } | null>(null);

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAudioTrackModal, setShowAudioTrackModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);

  // Subtitles cues
  const subtitleCues = useMemo<SubtitleCue[]>(() => {
    if (settings.selectedSubtitleId && SAMPLE_SUBTITLES[settings.selectedSubtitleId]) {
      return SAMPLE_SUBTITLES[settings.selectedSubtitleId].map((c, i) => ({
        id: `cue_${i}`,
        startTime: c.startTime,
        endTime: c.endTime,
        text: c.text,
      }));
    }
    return [];
  }, [settings.selectedSubtitleId]);

  const activeSubtitleText = useMemo(() => {
    if (subtitleCues.length > 0) {
      const cue = getCurrentSubtitleCue(subtitleCues, position, settings.subtitleDelay);
      return cue ? cue.text : null;
    }
    return null;
  }, [position, subtitleCues, settings.subtitleDelay]);

  // Refs for gestures & timeouts
  const controlsTimeoutRef = useRef<any>(null);
  const hudTimeoutRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const currentVolumeRef = useRef<number>(1.0);
  const currentBrightnessRef = useRef<number>(0.7);
  const initialGestureXRef = useRef<number>(0);
  const initialGestureYRef = useRef<number>(0);
  const initialBrightnessRef = useRef<number>(0.7);
  const initialVolumeRef = useRef<number>(1.0);
  const gestureTypeRef = useRef<'vertical' | 'horizontal' | null>(null);
  const isLandscapeRef = useRef<boolean>(false);
  const isLockedRef = useRef(isLocked);
  const positionRef = useRef(position);
  const durationRef = useRef(duration);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // A-B Repeat loop check
  const handleABRepeatCheck = useCallback((posSec: number) => {
    const { a, b, enabled } = settings.abRepeat;
    if (enabled && a !== null && b !== null && b > a) {
      if (posSec >= b) {
        player.currentTime = a;
      }
    }
  }, [settings.abRepeat, player]);

  // Sync player events
  useEffect(() => {
    const timeSub = player.addListener('timeUpdate', event => {
      setPosition(event.currentTime);
      if (player.duration) {
        setDuration(player.duration);
      }
      handleABRepeatCheck(event.currentTime);
    });

    const playingSub = player.addListener('playingChange', event => {
      setIsPlaying(event.isPlaying);
    });

    const statusSub = player.addListener('statusChange', event => {
      if (player.duration) {
        setDuration(player.duration);
      }
      setIsBuffering(event.status === 'loading');
    });

    const endSub = player.addListener('playToEnd', () => {
      setIsPlaying(false);
    });

    return () => {
      timeSub.remove();
      playingSub.remove();
      statusSub.remove();
      endSub.remove();
    };
  }, [player, handleABRepeatCheck]);

  // Sync playback speed
  useEffect(() => {
    if (player) {
      player.playbackRate = settings.playbackSpeed;
    }
  }, [player, settings.playbackSpeed]);

  // Sync volume / audio boost
  useEffect(() => {
    if (player) {
      player.volume = Math.min(1.0, settings.audioBoost);
    }
  }, [player, settings.audioBoost]);


  // Initial resume position
  useEffect(() => {
    if (params.resume === 'true' && player) {
      const saved = getResumePosition(currentVideo.id);
      if (saved > 0) {
        player.currentTime = saved;
      }
    }
  }, [params.resume, player, currentVideo.id, getResumePosition]);

  // Save resume position on unmount / every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      const pos = positionRef.current;
      const dur = durationRef.current;
      if (pos > 5 && dur > 0 && pos < dur - 10) {
        updateResumePosition(currentVideo.id, Math.floor(pos));
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      const pos = positionRef.current;
      if (pos > 5) {
        updateResumePosition(currentVideo.id, Math.floor(pos));
      }
    };
  }, [currentVideo.id, updateResumePosition]);

  // Sleep timer check
  useEffect(() => {
    let timer: any = null;
    if (settings.sleepTimerMinutes && settings.sleepTimerMinutes > 0) {
      timer = setTimeout(() => {
        if (player) {
          player.pause();
          setIsPlaying(false);
          Alert.alert('Sleep Timer', 'Video playback paused by sleep timer.');
        }
      }, settings.sleepTimerMinutes * 60 * 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [settings.sleepTimerMinutes, player]);

  // Controls auto-hide timer
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isLocked) {
        setShowControls(false);
      }
    }, 4000);
  }, [isLocked]);

  useEffect(() => {
    if (showControls && !isLocked) {
      resetControlsTimer();
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, isLocked, resetControlsTimer]);

  // Toggle Orientation (Landscape lock vs Portrait)
  const toggleOrientation = async () => {
    try {
      if (Platform.OS === 'web') return;
      if (isLandscapeRef.current) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        isLandscapeRef.current = false;
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
        isLandscapeRef.current = true;
      }
    } catch (e) {
      console.warn('Orientation error', e);
    }
  };

  // Aspect ratio toggle
  const cycleResizeMode = () => {
    setSettings(prev => {
      const nextMode =
        prev.resizeMode === 'contain' ? 'cover' : prev.resizeMode === 'cover' ? 'stretch' : 'contain';
      return { ...prev, resizeMode: nextMode };
    });
  };

  // Convert resize mode to expo-video contentFit
  const getContentFit = (): VideoContentFit => {
    if (settings.resizeMode === 'cover') return 'cover';
    if (settings.resizeMode === 'stretch') return 'fill';
    return 'contain';
  };

  // --- Gesture Handling (Stepped discrete levels of 10: 10%, 20%, 30%...) ---
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => {
          return Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10;
        },
        onPanResponderGrant: evt => {
          if (isLockedRef.current) return;

          const now = Date.now();
          const { pageX, pageY } = evt.nativeEvent;
          const screenWidth = Dimensions.get('window').width;

          initialGestureXRef.current = pageX;
          initialGestureYRef.current = pageY;
          initialBrightnessRef.current = currentBrightnessRef.current;
          initialVolumeRef.current = currentVolumeRef.current;
          gestureTypeRef.current = null;

          // Double tap check (< 300ms)
          if (now - lastTapRef.current < 300) {
            if (pageX < screenWidth * 0.4) {
              // Double tap Left: -10s
              const newPos = Math.max(0, positionRef.current - 10);
              player.currentTime = newPos;
              setDoubleTapHUD({ visible: true, type: 'rewind', seconds: 10 });
              setTimeout(() => setDoubleTapHUD(null), 800);
            } else if (pageX > screenWidth * 0.6) {
              // Double tap Right: +10s
              const newPos = Math.min(durationRef.current, positionRef.current + 10);
              player.currentTime = newPos;
              setDoubleTapHUD({ visible: true, type: 'forward', seconds: 10 });
              setTimeout(() => setDoubleTapHUD(null), 800);
            }
          }
          lastTapRef.current = now;
        },
        onPanResponderMove: (evt, gesture) => {
          if (isLockedRef.current) return;
          const screenWidth = Dimensions.get('window').width;

          // Lock gesture mode to avoid diagonal accidental inputs
          if (!gestureTypeRef.current) {
            if (Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 15) {
              gestureTypeRef.current = 'horizontal';
            } else if (Math.abs(gesture.dy) > 10) {
              gestureTypeRef.current = 'vertical';
            }
          }

          // Horizontal gesture -> Fast Seek
          if (gestureTypeRef.current === 'horizontal') {
            const dur = durationRef.current;
            const pos = positionRef.current;
            const seekSensFactor = dur > 600 ? 0.8 : 0.4;
            const diffSeconds = gesture.dx * seekSensFactor;
            const targetTime = Math.max(0, Math.min(dur, pos + diffSeconds));
            setSeekHUD({
              visible: true,
              diffSeconds,
              targetTime,
              duration: dur,
            });
            return;
          }

          // Vertical gesture -> Stepped level 10 (10%, 20%, 30%...)
          if (gestureTypeRef.current === 'vertical') {
            // Moving finger UP (-gesture.dy > 0) increases value
            // Moving finger DOWN (-gesture.dy < 0) decreases value
            const PIXELS_PER_STEP = 26; // 26px of swipe per 10% increment
            const stepDelta = Math.trunc((-gesture.dy) / PIXELS_PER_STEP);

            if (initialGestureXRef.current < screenWidth * 0.5) {
              // Left side of view: Brightness control
              const base = Math.round(initialBrightnessRef.current * 10) / 10;
              const stepped = Math.max(0, Math.min(1.0, base + stepDelta * 0.1));
              const roundedBright = Math.round(stepped * 10) / 10; // 0.0, 0.1, 0.2 ... 1.0

              if (currentBrightnessRef.current !== roundedBright || !brightnessHUD?.visible) {
                currentBrightnessRef.current = roundedBright;
                setBrightnessHUD({ visible: true, value: roundedBright });
                if (Platform.OS !== 'web') {
                  Brightness.setBrightnessAsync(roundedBright).catch(() => {});
                }
              }
            } else {
              // Right side of view: Volume control
              const base = Math.round(initialVolumeRef.current * 10) / 10;
              // Allows audio boost up to 2.0 (200%) in steps of 0.1 (10%)
              const stepped = Math.max(0, Math.min(2.0, base + stepDelta * 0.1));
              const roundedVol = Math.round(stepped * 10) / 10; // 0.0, 0.1, 0.2 ... 2.0

              if (currentVolumeRef.current !== roundedVol || !volumeHUD?.visible) {
                currentVolumeRef.current = roundedVol;
                setVolumeHUD({ visible: true, value: roundedVol });
                player.volume = Math.min(1.0, roundedVol);
              }
            }
          }
        },
        onPanResponderRelease: (_, gesture) => {
          gestureTypeRef.current = null;
          if (isLockedRef.current) {
            setShowControls(prev => !prev);
            return;
          }

          // Apply fast seek if seek HUD was active
          if (seekHUD && seekHUD.visible) {
            player.currentTime = seekHUD.targetTime;
            setSeekHUD(null);
          }

          // Dismiss HUDs after 800ms
          if (volumeHUD) {
            if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
            hudTimeoutRef.current = setTimeout(() => setVolumeHUD(null), 800);
          }

          if (brightnessHUD) {
            if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
            hudTimeoutRef.current = setTimeout(() => setBrightnessHUD(null), 800);
          }

          // If tap without drag, toggle controls
          if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
            setShowControls(prev => !prev);
          }
        },
      }),
    [player, seekHUD, volumeHUD, brightnessHUD]
  );

  // External subtitle file loader
  const handlePickSubtitle = async () => {
    const file = await MediaScanner.pickSubtitleFile();
    if (file) {
      Alert.alert('Subtitle Loaded', `Loaded subtitle: ${file.name}`);
    }
  };

  const currentVideoIdx = videos.findIndex(v => v.id === currentVideo.id);

  const handleNextVideo = () => {
    if (videos.length > 0) {
      const nextIdx = (currentVideoIdx + 1) % videos.length;
      router.replace({
        pathname: '/player/video',
        params: { id: videos[nextIdx].id, resume: 'false' },
      });
    }
  };

  const handlePrevVideo = () => {
    if (videos.length > 0) {
      const prevIdx = (currentVideoIdx - 1 + videos.length) % videos.length;
      router.replace({
        pathname: '/player/video',
        params: { id: videos[prevIdx].id, resume: 'false' },
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video View */}
      <VideoView
        player={player}
        style={styles.videoSurface}
        contentFit={getContentFit()}
        nativeControls={false}
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      )}

      {/* Gesture Capturing Surface */}
      <View style={styles.gestureSurface} {...panResponder.panHandlers} />

      {/* Gestures HUD (Volume, Brightness, Seek, Double Tap) */}
      <GestureHUD
        volumeHUD={volumeHUD}
        brightnessHUD={brightnessHUD}
        seekHUD={seekHUD}
        doubleTapHUD={doubleTapHUD}
      />

      {/* Subtitles Cue Renderer */}
      <SubtitlesOverlay
        currentSubtitle={activeSubtitleText}
        fontSize={settings.subtitleFontSize}
      />

      {/* Screen Lock Floating Padlock (when locked) */}
      {isLocked && (
        <Pressable
          style={styles.floatingLockBtn}
          onPress={() => setIsLocked(false)}>
          <Lock size={24} color={AppColors.rose} />
          <Text style={styles.floatingLockText}>Tap to Unlock</Text>
        </Pressable>
      )}

      {/* Full HUD Controls Overlay (When not locked and visible) */}
      {showControls && !isLocked && (
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.back()}
              hitSlop={8}>
              <ArrowLeft size={22} color="#FFF" />
            </Pressable>

            <View style={styles.videoTitleBox}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {currentVideo.title}
              </Text>
              <View style={styles.metaRow}>
                {currentVideo.qualityTag && (
                  <View style={styles.qualityPill}>
                    <Text style={styles.qualityPillText}>{currentVideo.qualityTag}</Text>
                  </View>
                )}
                {settings.abRepeat.enabled && (
                  <View style={[styles.qualityPill, { backgroundColor: AppColors.emerald }]}>
                    <Text style={[styles.qualityPillText, { color: '#000' }]}>A-B LOOP</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.topActions}>
              {/* Audio Track Selector */}
              <Pressable
                style={styles.iconBtn}
                onPress={() => setShowAudioTrackModal(true)}
                hitSlop={8}>
                <AudioLines size={20} color="#FFF" />
              </Pressable>

              {/* Subtitles Selector */}
              <Pressable
                style={[
                  styles.iconBtn,
                  settings.selectedSubtitleId ? styles.activeIconBtn : null,
                ]}
                onPress={() => setShowSubtitleModal(true)}
                hitSlop={8}>
                <Subtitles size={20} color={settings.selectedSubtitleId ? AppColors.primary : '#FFF'} />
              </Pressable>

              {/* Aspect Ratio */}
              <Pressable style={styles.iconBtn} onPress={cycleResizeMode} hitSlop={8}>
                <Maximize2 size={20} color="#FFF" />
              </Pressable>

              {/* Lock screen */}
              <Pressable
                style={styles.iconBtn}
                onPress={() => {
                  setIsLocked(true);
                  setShowControls(false);
                }}
                hitSlop={8}>
                <Unlock size={20} color="#FFF" />
              </Pressable>

              {/* Settings */}
              <Pressable
                style={styles.iconBtn}
                onPress={() => setShowSettingsModal(true)}
                hitSlop={8}>
                <Sliders size={20} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {/* Center Playback Buttons */}
          <View style={styles.centerControls} pointerEvents="box-none">
            <Pressable style={styles.centerBtn} onPress={handlePrevVideo} hitSlop={10}>
              <SkipBack size={36} color="#FFF" fill="#FFF" />
            </Pressable>

            <Pressable
              style={styles.centerPlayBtn}
              onPress={() => {
                if (isPlaying) {
                  player.pause();
                } else {
                  player.play();
                }
              }}>
              {isPlaying ? (
                <Pause size={42} color="#000" fill="#000" />
              ) : (
                <Play size={42} color="#000" fill="#000" style={{ marginLeft: 4 }} />
              )}
            </Pressable>

            <Pressable style={styles.centerBtn} onPress={handleNextVideo} hitSlop={10}>
              <SkipForward size={36} color="#FFF" fill="#FFF" />
            </Pressable>
          </View>

          {/* Bottom Bar Controls */}
          <View style={styles.bottomBar}>
            {/* Scrubber */}
            <View style={styles.scrubberRow}>
              <Text style={styles.timeLabel}>{formatDuration(position)}</Text>

              <Pressable
                style={styles.scrubTrackTouch}
                onPress={evt => {
                  const { locationX } = evt.nativeEvent;
                  const ratio = Math.max(0, Math.min(1, locationX / 240));
                  player.currentTime = ratio * duration;
                }}>
                <View style={styles.scrubTrack}>
                  <View
                    style={[
                      styles.scrubFill,
                      {
                        width: `${duration > 0 ? (position / duration) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
              </Pressable>

              <Text style={styles.timeLabel}>{formatDuration(duration)}</Text>
            </View>

            {/* Bottom Actions Row */}
            <View style={styles.bottomActionsRow}>
              {/* Playback speed */}
              <Pressable
                style={styles.speedPill}
                onPress={() => setShowSpeedModal(true)}>
                <Text style={styles.speedPillText}>{settings.playbackSpeed}x</Text>
              </Pressable>

              {/* Aspect mode label */}
              <Pressable style={styles.aspectPill} onPress={cycleResizeMode}>
                <Text style={styles.aspectPillText}>{settings.resizeMode.toUpperCase()}</Text>
              </Pressable>

              {/* Fullscreen / Orientation lock */}
              <Pressable
                style={styles.bottomToolBtn}
                onPress={toggleOrientation}>
                <RotateCcw size={18} color="#FFF" />
                <Text style={styles.bottomToolText}>Rotate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* --- MODALS --- */}

      {/* Audio Track Modal */}
      <Modal
        visible={showAudioTrackModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAudioTrackModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowAudioTrackModal(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Audio Track</Text>
            <ScrollView style={{ marginTop: 10 }}>
              {(currentVideo.audioTracks || [
                { id: 'def', label: 'Default Audio (Stereo)', language: 'en', index: 0 },
              ]).map(track => {
                const isCur = settings.selectedAudioTrackIndex === track.index;
                return (
                  <Pressable
                    key={track.id}
                    style={[styles.trackRow, isCur && styles.trackRowActive]}
                    onPress={() => {
                      setSettings(prev => ({ ...prev, selectedAudioTrackIndex: track.index }));
                      setShowAudioTrackModal(false);
                    }}>
                    <Text style={[styles.trackLabel, isCur && styles.trackLabelActive]}>
                      {track.label}
                    </Text>
                    {isCur && <Check size={18} color={AppColors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Subtitles Modal */}
      <Modal
        visible={showSubtitleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubtitleModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSubtitleModal(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Subtitles / Closed Captions</Text>
            <ScrollView style={{ marginTop: 10 }}>
              {/* Off option */}
              <Pressable
                style={[
                  styles.trackRow,
                  settings.selectedSubtitleId === null && styles.trackRowActive,
                ]}
                onPress={() => {
                  setSettings(prev => ({ ...prev, selectedSubtitleId: null }));
                  setShowSubtitleModal(false);
                }}>
                <Text
                  style={[
                    styles.trackLabel,
                    settings.selectedSubtitleId === null && styles.trackLabelActive,
                  ]}>
                  Subtitles Off
                </Text>
                {settings.selectedSubtitleId === null && (
                  <Check size={18} color={AppColors.primary} />
                )}
              </Pressable>

              {(currentVideo.subtitleTracks || []).map(sub => {
                const isCur = settings.selectedSubtitleId === sub.id;
                return (
                  <Pressable
                    key={sub.id}
                    style={[styles.trackRow, isCur && styles.trackRowActive]}
                    onPress={() => {
                      setSettings(prev => ({ ...prev, selectedSubtitleId: sub.id }));
                      setShowSubtitleModal(false);
                    }}>
                    <Text style={[styles.trackLabel, isCur && styles.trackLabelActive]}>
                      {sub.label}
                    </Text>
                    {isCur && <Check size={18} color={AppColors.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Speed Modal */}
      <Modal
        visible={showSpeedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpeedModal(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowSpeedModal(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Playback Speed</Text>
            <View style={styles.speedGrid}>
              {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map(s => (
                <Pressable
                  key={s}
                  style={[
                    styles.speedItem,
                    settings.playbackSpeed === s && styles.speedItemActive,
                  ]}
                  onPress={() => {
                    setSettings(prev => ({ ...prev, playbackSpeed: s }));
                    setShowSpeedModal(false);
                  }}>
                  <Text
                    style={[
                      styles.speedItemText,
                      settings.playbackSpeed === s && styles.speedItemTextActive,
                    ]}>
                    {s}x
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Settings Modal (AB Repeat, Audio Boost, Delay, Sleep) */}
      <VideoSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        currentTime={position}
        updateSettings={updater => setSettings(prev => ({ ...prev, ...updater }))}
        onPickSubtitleFile={handlePickSubtitle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  videoSurface: {
    ...StyleSheet.absoluteFill,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
  },
  gestureSurface: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
  },
  floatingLockBtn: {
    position: 'absolute',
    top: 36,
    left: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.rose,
    zIndex: 30,
  },
  floatingLockText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBtn: {
    borderColor: AppColors.primary,
    borderWidth: 1.5,
  },
  videoTitleBox: {
    flex: 1,
    marginHorizontal: 12,
  },
  videoTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  qualityPill: {
    backgroundColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: AppColors.primary,
  },
  qualityPillText: {
    color: AppColors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  centerBtn: {
    padding: 12,
  },
  centerPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomBar: {
    paddingBottom: 4,
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  timeLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 44,
  },
  scrubTrackTouch: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  scrubTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  scrubFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 2,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedPill: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  speedPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aspectPill: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  aspectPillText: {
    color: AppColors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  bottomToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bottomToolText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 10,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  trackRowActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  trackLabel: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: '500',
  },
  trackLabelActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  speedItem: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  speedItemActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  speedItemText: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  speedItemTextActive: {
    color: '#000',
    fontWeight: '800',
  },
});