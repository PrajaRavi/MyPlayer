import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  Sliders,
  Moon,
  ListMusic,
  Gauge,
  Music,
} from 'lucide-react-native';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { useMediaContext } from '@/context/MediaContext';
import { AppColors } from '@/constants/colors';
import { formatDuration } from '@/utils/formatters';
import { EQUALIZER_PRESETS } from '@/constants/demoMedia';
import { CircularVisualizer } from './CircularVisualizer';

export const FullAudioPlayerModal: React.FC = () => {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    position,
    duration,
    playbackRate,
    repeatMode,
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
    setPlaybackRate,
    toggleRepeatMode,
  } = useAudioPlayer();

  const { isFavorite, toggleFavorite } = useMediaContext();

  const [activeTab, setActiveTab] = useState<'cover' | 'lyrics'>('cover');
  const [showEqModal, setShowEqModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);

  // Scrubber drag & interactive thumb tracking
  const [trackWidth, setTrackWidth] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState(0);
  const trackWidthRef = useRef(0);
  const durationRef = useRef(duration);

  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const scrubberPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          setIsScrubbing(true);
          const width = trackWidthRef.current || 300;
          const { locationX } = evt.nativeEvent;
          const ratio = Math.max(0, Math.min(1, locationX / width));
          const target = ratio * durationRef.current;
          setScrubPosition(target);
        },
        onPanResponderMove: (evt, gesture) => {
          const width = trackWidthRef.current || 300;
          const { locationX } = evt.nativeEvent;
          const ratio = Math.max(0, Math.min(1, locationX / width));
          const target = ratio * durationRef.current;
          setScrubPosition(target);
        },
        onPanResponderRelease: evt => {
          const width = trackWidthRef.current || 300;
          const { locationX } = evt.nativeEvent;
          const ratio = Math.max(0, Math.min(1, locationX / width));
          const target = ratio * durationRef.current;
          seekTo(target);
          setIsScrubbing(false);
        },
      }),
    [seekTo]
  );

  if (!currentTrack) return null;

  const favorite = isFavorite(currentTrack.id);
  const displayPos = isScrubbing ? scrubPosition : position;
  const progressPercent = duration > 0 ? Math.min(100, (displayPos / duration) * 100) : 0;

  return (
    <Modal
      visible={isExpanded}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsExpanded(false)}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => setIsExpanded(false)}
            hitSlop={8}>
            <ChevronDown size={28} color={AppColors.text} />
          </Pressable>

          {/* Tab selector */}
          <View style={styles.tabSelector}>
            <Pressable
              style={[styles.tabBtn, activeTab === 'cover' && styles.tabBtnActive]}
              onPress={() => setActiveTab('cover')}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'cover' && styles.tabBtnTextActive,
                ]}>
                Playing
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, activeTab === 'lyrics' && styles.tabBtnActive]}
              onPress={() => setActiveTab('lyrics')}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'lyrics' && styles.tabBtnTextActive,
                ]}>
                Lyrics
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.headerBtn}
            onPress={() => setShowQueueModal(true)}
            hitSlop={8}>
            <ListMusic size={24} color={AppColors.text} />
          </Pressable>
        </View>

        {/* Body View */}
        {activeTab === 'cover' ? (
          <View style={styles.coverViewContainer}>
            <CircularVisualizer
              isPlaying={isPlaying}
              position={position}
              thumbnailUri={currentTrack.thumbnailUri}
              size={290}
              barCount={48}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.lyricsScroll}
            contentContainerStyle={styles.lyricsContent}>
            {parsedLyrics.length > 0 ? (
              parsedLyrics.map((line, index) => {
                const isCurrentLine = index === activeLyricsIndex;
                return (
                  <Pressable
                    key={index}
                    onPress={() => seekTo(line.time)}>
                    <Text
                      style={[
                        styles.lyricsLine,
                        isCurrentLine && styles.activeLyricsLine,
                      ]}>
                      {line.text}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <View style={styles.emptyLyricsBox}>
                <Music size={36} color={AppColors.textMuted} />
                <Text style={styles.emptyLyricsText}>No synchronized lyrics found</Text>
                <Text style={styles.emptyLyricsSubtext}>
                  Enjoy the high fidelity audio!
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Track Info Row */}
        <View style={styles.trackInfoSection}>
          <View style={styles.trackTextContainer}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist || 'Unknown Artist'} • {currentTrack.albumTitle || 'OwnPlayer Music'}
            </Text>
          </View>

          <Pressable
            style={styles.favBtn}
            onPress={() => toggleFavorite(currentTrack.id)}
            hitSlop={8}>
            <Heart
              size={26}
              color={favorite ? AppColors.rose : AppColors.textMuted}
              fill={favorite ? AppColors.rose : 'transparent'}
            />
          </Pressable>
        </View>

        {/* Interactive Scrub Bar with Filled Circle Thumb Button */}
        <View style={styles.scrubberSection}>
          <View
            style={styles.scrubTouchArea}
            onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
            {...scrubberPanResponder.panHandlers}>
            <View style={styles.scrubTrackBg}>
              <View style={[styles.scrubTrackFill, { width: `${progressPercent}%` }]} />
              <View
                style={[
                  styles.scrubThumb,
                  { left: `${progressPercent}%` },
                ]}>
                <View style={styles.scrubThumbInner} />
              </View>
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatDuration(displayPos)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>
        </View>

        {/* Primary Controls */}
        <View style={styles.primaryControlsSection}>
          {/* Repeat mode */}
          <Pressable
            style={styles.subControlBtn}
            onPress={toggleRepeatMode}
            hitSlop={8}>
            {repeatMode === 'one' ? (
              <Repeat1 size={22} color={AppColors.primary} />
            ) : repeatMode === 'shuffle' ? (
              <Shuffle size={22} color={AppColors.primary} />
            ) : repeatMode === 'all' ? (
              <Repeat size={22} color={AppColors.primary} />
            ) : (
              <Repeat size={22} color={AppColors.textMuted} />
            )}
          </Pressable>

          {/* Previous */}
          <Pressable style={styles.controlBtn} onPress={playPrevious} hitSlop={8}>
            <SkipBack size={30} color={AppColors.text} fill={AppColors.text} />
          </Pressable>

          {/* Play / Pause with Neon Accent */}
          <Pressable
            style={styles.playPauseBtn}
            onPress={togglePlayPause}>
            {isPlaying ? (
              <Pause size={34} color="#000" fill="#000" />
            ) : (
              <Play size={34} color="#000" fill="#000" style={{ marginLeft: 4 }} />
            )}
          </Pressable>

          {/* Next */}
          <Pressable style={styles.controlBtn} onPress={playNext} hitSlop={8}>
            <SkipForward size={30} color={AppColors.text} fill={AppColors.text} />
          </Pressable>

          {/* Rewind 10s */}
          <Pressable
            style={styles.subControlBtn}
            onPress={() => seekTo(Math.max(0, position - 10))}
            hitSlop={8}>
            <RotateCcw size={22} color={AppColors.textSecondary} />
          </Pressable>
        </View>

        {/* Bottom Utility Bar */}
        <View style={styles.bottomUtilityBar}>
          <Pressable
            style={styles.utilityItem}
            onPress={() => setShowSpeedModal(true)}>
            <Gauge size={18} color={playbackRate !== 1.0 ? AppColors.primary : AppColors.textSecondary} />
            <Text style={[styles.utilityLabel, playbackRate !== 1.0 && styles.utilityLabelActive]}>
              {playbackRate}x
            </Text>
          </Pressable>

          <Pressable
            style={styles.utilityItem}
            onPress={() => setShowEqModal(true)}>
            <Sliders size={18} color={AppColors.textSecondary} />
            <Text style={styles.utilityLabel}>Equalizer</Text>
          </Pressable>

          <Pressable
            style={styles.utilityItem}
            onPress={() => setShowSleepModal(true)}>
            <Moon size={18} color={sleepTimerMinutes ? AppColors.primary : AppColors.textSecondary} />
            <Text style={[styles.utilityLabel, sleepTimerMinutes ? styles.utilityLabelActive : null]}>
              {sleepTimerMinutes ? `${sleepTimerMinutes}m` : 'Sleep'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.utilityItem}
            onPress={() => setShowQueueModal(true)}>
            <ListMusic size={18} color={AppColors.textSecondary} />
            <Text style={styles.utilityLabel}>Queue ({queue.length})</Text>
          </Pressable>
        </View>

        {/* --- MODALS --- */}

        {/* Equalizer Modal */}
        <Modal
          visible={showEqModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEqModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEqModal(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Audio Equalizer</Text>
              <Text style={styles.modalSubtitle}>Audio presets tailored for your headphones</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {EQUALIZER_PRESETS.map(preset => {
                  const isCur = activePreset.id === preset.id;
                  return (
                    <Pressable
                      key={preset.id}
                      style={[styles.eqItem, isCur && styles.eqItemActive]}
                      onPress={() => {
                        setActivePreset(preset);
                        setShowEqModal(false);
                      }}>
                      <View>
                        <Text style={[styles.eqName, isCur && styles.eqNameActive]}>
                          {preset.name}
                        </Text>
                        <Text style={styles.eqDesc}>{preset.description}</Text>
                      </View>
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
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSpeedModal(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Playback Speed</Text>
              <View style={styles.speedGrid}>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
                  <Pressable
                    key={speed}
                    style={[styles.speedBtn, playbackRate === speed && styles.speedBtnActive]}
                    onPress={() => {
                      setPlaybackRate(speed);
                      setShowSpeedModal(false);
                    }}>
                    <Text
                      style={[
                        styles.speedBtnText,
                        playbackRate === speed && styles.speedBtnTextActive,
                      ]}>
                      {speed}x
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Sleep Timer Modal */}
        <Modal
          visible={showSleepModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSleepModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSleepModal(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Sleep Timer</Text>
              <Text style={styles.modalSubtitle}>Music pauses automatically when timer ends</Text>
              <View style={styles.speedGrid}>
                {[15, 30, 45, 60, 90].map(m => (
                  <Pressable
                    key={m}
                    style={[styles.speedBtn, sleepTimerMinutes === m && styles.speedBtnActive]}
                    onPress={() => {
                      setSleepTimer(m);
                      setShowSleepModal(false);
                    }}>
                    <Text
                      style={[
                        styles.speedBtnText,
                        sleepTimerMinutes === m && styles.speedBtnTextActive,
                      ]}>
                      {m} min
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[styles.speedBtn, !sleepTimerMinutes && styles.speedBtnActive]}
                  onPress={() => {
                    setSleepTimer(null);
                    setShowSleepModal(false);
                  }}>
                  <Text
                    style={[
                      styles.speedBtnText,
                      !sleepTimerMinutes && styles.speedBtnTextActive,
                    ]}>
                    Turn Off
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Queue Modal */}
        <Modal
          visible={showQueueModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowQueueModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowQueueModal(false)}>
            <View style={[styles.modalContent, { maxHeight: '60%' }]} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Playing Queue ({queue.length})</Text>
              <ScrollView style={{ marginTop: 10 }}>
                {queue.map((item, idx) => {
                  const isThis = idx === queueIndex;
                  return (
                    <Pressable
                      key={item.id + idx}
                      style={[styles.queueRow, isThis && styles.queueRowActive]}
                      onPress={() => {
                        playTrack(item, queue);
                        setShowQueueModal(false);
                      }}>
                      <Text style={[styles.queueNumber, isThis && styles.queueNumberActive]}>
                        {idx + 1}
                      </Text>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.queueTitle, isThis && styles.queueTitleActive]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.queueArtist} numberOfLines={1}>
                          {item.artist || 'Unknown Artist'}
                        </Text>
                      </View>
                      {isThis && (
                        <View style={styles.nowPlayingPill}>
                          <Text style={styles.nowPlayingPillText}>NOW</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 48,
  },
  headerBtn: {
    padding: 6,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: 20,
    padding: 3,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  tabBtnActive: {
    backgroundColor: AppColors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  coverViewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artDiscWrapper: {
    width: 260,
    height: 260,
    borderRadius: 130,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  vinylDisc: {
    width: '100%',
    height: '100%',
    borderRadius: 130,
    backgroundColor: '#111827',
    borderWidth: 6,
    borderColor: '#1F2937',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinylArtImage: {
    width: '100%',
    height: '100%',
  },
  placeholderDiscCenter: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerHole: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.background,
    borderWidth: 4,
    borderColor: '#374151',
  },
  visualizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    height: 45,
    marginTop: 28,
  },
  visualizerBar: {
    width: 5,
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },
  lyricsScroll: {
    flex: 1,
    paddingHorizontal: 24,
    marginVertical: 10,
  },
  lyricsContent: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  lyricsLine: {
    fontSize: 16,
    lineHeight: 32,
    color: AppColors.textMuted,
    textAlign: 'center',
    marginVertical: 6,
    fontWeight: '500',
  },
  activeLyricsLine: {
    fontSize: 20,
    color: AppColors.primary,
    fontWeight: '800',
    transform: [{ scale: 1.05 }],
  },
  emptyLyricsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyLyricsText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginTop: 12,
  },
  emptyLyricsSubtext: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  trackInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginTop: 10,
  },
  trackTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.text,
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  favBtn: {
    padding: 6,
  },
  scrubberSection: {
    paddingHorizontal: 28,
    marginTop: 16,
  },
  scrubTouchArea: {
    height: 24,
    justifyContent: 'center',
  },
  scrubTrackBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.borderLight,
    position: 'relative',
  },
  scrubTrackFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: AppColors.primary,
  },
  scrubThumb: {
    position: 'absolute',
    top: -6,
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scrubThumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
    color: AppColors.textMuted,
    fontWeight: '600',
  },
  primaryControlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  controlBtn: {
    padding: 10,
  },
  subControlBtn: {
    padding: 10,
  },
  playPauseBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomUtilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingTop: 14,
  },
  utilityItem: {
    alignItems: 'center',
    gap: 4,
  },
  utilityLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  utilityLabelActive: {
    color: AppColors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  eqItem: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: AppColors.card,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  eqItemActive: {
    borderColor: AppColors.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  eqName: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
  },
  eqNameActive: {
    color: AppColors.primary,
  },
  eqDesc: {
    fontSize: 11,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: AppColors.card,
    borderWidth: 1,
    borderColor: AppColors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  speedBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  speedBtnText: {
    color: AppColors.text,
    fontWeight: '600',
  },
  speedBtnTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  queueRowActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  queueNumber: {
    fontSize: 12,
    color: AppColors.textMuted,
    width: 24,
  },
  queueNumberActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  queueTitleActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  queueArtist: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  nowPlayingPill: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nowPlayingPillText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
});
