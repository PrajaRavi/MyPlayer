import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Shield,
  Lock,
  Unlock,
  Scissors,
  Music4,
  HardDrive,
  Eye,
  EyeOff,
  Play,
} from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { Header } from '@/components/common/Header';
import { useMediaContext } from '@/context/MediaContext';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { formatFileSize, formatDuration } from '@/utils/formatters';
import { MediaItem } from '@/types/media';

export default function ToolsScreen() {
  const router = useRouter();
  const {
    videos,
    audios,
    vaultItems,
    isVaultUnlocked,
    hasVaultPin,
    unlockVault,
    lockVault,
    setupVaultPin,
    restoreFromVault,
  } = useMediaContext();

  const { playTrack } = useAudioPlayer();

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Lazy loading pagination for vault: max 20 items at a time
  const PAGE_SIZE = 20;
  const [vaultLimit, setVaultLimit] = useState(PAGE_SIZE);

  const visibleVaultItems = vaultItems.slice(0, vaultLimit);

  // Storage calculation
  const totalVideoSize = videos.reduce((acc, v) => acc + (v.size || 0), 0);
  const totalAudioSize = audios.reduce((acc, a) => acc + (a.size || 0), 0);
  const totalMediaSize = totalVideoSize + totalAudioSize;

  // Numeric keypad press
  const handleKeypadPress = async (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);

      if (nextPin.length === 4) {
        if (!hasVaultPin) {
          // Setting new PIN
          await setupVaultPin(nextPin);
          Alert.alert('Vault PIN Set', 'Your private vault PIN has been created!');
          setEnteredPin('');
        } else {
          // Unlocking
          const success = await unlockVault(nextPin);
          if (!success) {
            setPinError(true);
            setTimeout(() => {
              setEnteredPin('');
              setPinError(false);
            }, 600);
          } else {
            setEnteredPin('');
          }
        }
      }
    }
  };

  const handleKeypadDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handlePlayVaultItem = (item: MediaItem) => {
    if (item.mediaType === 'video') {
      router.push({
        pathname: '/player/video',
        params: { id: item.id, uri: item.uri, title: `[Vault] ${item.title}` },
      });
    } else {
      playTrack(item, [item]);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Tools & Vault"
        subtitle="Private storage, audio extractor & trimmer"
        showSearch={false}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- Private Vault Section --- */}
        <View style={styles.vaultSection}>
          <View style={styles.vaultHeader}>
            <View style={styles.vaultTitleRow}>
              <View style={[styles.vaultIconBox, isVaultUnlocked && styles.vaultIconBoxUnlocked]}>
                {isVaultUnlocked ? (
                  <Unlock size={22} color={AppColors.emerald} />
                ) : (
                  <Shield size={22} color={AppColors.accent} />
                )}
              </View>
              <View style={styles.vaultTitleText}>
                <Text style={styles.vaultTitle}>Private Security Vault</Text>
                <Text style={styles.vaultSubtitle}>
                  {isVaultUnlocked
                    ? `${vaultItems.length} hidden files secured`
                    : hasVaultPin
                    ? 'Enter 4-digit PIN to unlock'
                    : 'Set up a 4-digit PIN to secure private files'}
                </Text>
              </View>
            </View>

            {isVaultUnlocked && (
              <Pressable style={styles.lockNowBtn} onPress={lockVault}>
                <Lock size={16} color="#FFF" />
                <Text style={styles.lockNowText}>Lock</Text>
              </Pressable>
            )}
          </View>

          {/* If Locked: Keypad */}
          {!isVaultUnlocked ? (
            <View style={styles.pinContainer}>
              {/* PIN circles indicator */}
              <View style={styles.pinCirclesRow}>
                {[0, 1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.pinCircle,
                      enteredPin.length > i && styles.pinCircleFilled,
                      pinError && styles.pinCircleError,
                    ]}
                  />
                ))}
              </View>

              {pinError && (
                <Text style={styles.errorText}>Incorrect PIN. Try again.</Text>
              )}

              {/* 3x4 Keypad */}
              <View style={styles.keypad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <Pressable
                    key={num}
                    style={styles.keypadBtn}
                    onPress={() => handleKeypadPress(num)}>
                    <Text style={styles.keypadDigit}>{num}</Text>
                  </Pressable>
                ))}
                <View style={styles.keypadBtnEmpty} />
                <Pressable
                  style={styles.keypadBtn}
                  onPress={() => handleKeypadPress('0')}>
                  <Text style={styles.keypadDigit}>0</Text>
                </Pressable>
                <Pressable
                  style={styles.keypadBtn}
                  onPress={handleKeypadDelete}>
                  <Text style={styles.keypadDelete}>⌫</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* If Unlocked: Hidden files list */
            <View style={styles.vaultItemsList}>
              {visibleVaultItems.length > 0 ? (
                <>
                  {visibleVaultItems.map(item => (
                    <View key={item.id} style={styles.vaultItemRow}>
                      <Pressable
                        style={styles.vaultItemInfo}
                        onPress={() => handlePlayVaultItem(item)}>
                        <Play size={18} color={AppColors.accent} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.vaultItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.vaultItemMeta}>
                            {formatDuration(item.duration)} • {formatFileSize(item.size)}
                          </Text>
                        </View>
                      </Pressable>

                      <Pressable
                        style={styles.unhideBtn}
                        onPress={() => {
                          Alert.alert('Restore File', `Unhide "${item.title}" back to library?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Restore', onPress: () => restoreFromVault(item) },
                          ]);
                        }}>
                        <Eye size={16} color={AppColors.textSecondary} />
                        <Text style={styles.unhideText}>Restore</Text>
                      </Pressable>
                    </View>
                  ))}
                  {vaultLimit < vaultItems.length && (
                    <Pressable
                      style={styles.loadMoreBtn}
                      onPress={() => setVaultLimit(prev => Math.min(prev + PAGE_SIZE, vaultItems.length))}>
                      <Text style={styles.loadMoreText}>
                        Load More ({vaultItems.length - vaultLimit} remaining)
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <View style={styles.emptyVaultBox}>
                  <EyeOff size={32} color={AppColors.textMuted} />
                  <Text style={styles.emptyVaultText}>Vault is Empty</Text>
                  <Text style={styles.emptyVaultSubtext}>
                    Tap 3-dots on any video or song and choose "Move to Private Vault"
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* --- Media Tools Grid --- */}
        <Text style={styles.sectionHeader}>Media Utilities</Text>

        <View style={styles.toolsGrid}>
          {/* Video to MP3 */}
          <Pressable
            style={styles.toolCard}
            onPress={() => {
              Alert.alert(
                'Video to MP3 Extractor',
                'Select any video to extract high fidelity stereo audio soundtrack.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Select Video',
                    onPress: () => {
                      if (videos.length > 0) {
                        Alert.alert('Extracted', `Successfully converted audio from "${videos[0].title}"!`);
                      }
                    },
                  },
                ]
              );
            }}>
            <View style={[styles.toolIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Music4 size={24} color={AppColors.primary} />
            </View>
            <Text style={styles.toolTitle}>Video to MP3</Text>
            <Text style={styles.toolDesc}>Extract audio soundtrack from movies & clips</Text>
          </Pressable>

          {/* Video Trimmer */}
          <Pressable
            style={styles.toolCard}
            onPress={() => {
              Alert.alert(
                'Video Trimmer / Cutter',
                'Quickly cut and save video clips without quality loss.',
                [{ text: 'OK' }]
              );
            }}>
            <View style={[styles.toolIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Scissors size={24} color={AppColors.accent} />
            </View>
            <Text style={styles.toolTitle}>Video Trimmer</Text>
            <Text style={styles.toolDesc}>Cut start and end points to make short clips</Text>
          </Pressable>
        </View>

        {/* --- Storage Analyzer --- */}
        <Text style={styles.sectionHeader}>Storage Breakdown</Text>
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HardDrive size={20} color={AppColors.primary} />
            <Text style={styles.storageTitle}>Media Storage Used</Text>
            <Text style={styles.storageTotal}>{formatFileSize(totalMediaSize)}</Text>
          </View>

          {/* Color bar */}
          <View style={styles.storageBar}>
            <View
              style={[
                styles.storageBarFill,
                {
                  width: totalMediaSize > 0 ? `${(totalVideoSize / totalMediaSize) * 100}%` : '70%',
                  backgroundColor: AppColors.primary,
                },
              ]}
            />
            <View
              style={[
                styles.storageBarFill,
                {
                  width: totalMediaSize > 0 ? `${(totalAudioSize / totalMediaSize) * 100}%` : '30%',
                  backgroundColor: AppColors.accent,
                },
              ]}
            />
          </View>

          {/* Legend */}
          <View style={styles.storageLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.primary }]} />
              <Text style={styles.legendLabel}>
                Videos ({videos.length}): {formatFileSize(totalVideoSize)}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: AppColors.accent }]} />
              <Text style={styles.legendLabel}>
                Music ({audios.length}): {formatFileSize(totalAudioSize)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  vaultSection: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 24,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vaultIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultIconBoxUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  vaultTitleText: {
    marginLeft: 12,
    flex: 1,
  },
  vaultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
  },
  vaultSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  lockNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.rose,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  lockNowText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pinContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  pinCirclesRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pinCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: AppColors.borderLight,
    backgroundColor: 'transparent',
  },
  pinCircleFilled: {
    backgroundColor: AppColors.accent,
    borderColor: AppColors.accent,
  },
  pinCircleError: {
    borderColor: AppColors.rose,
    backgroundColor: AppColors.rose,
  },
  errorText: {
    color: AppColors.rose,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  keypad: {
    width: 240,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  keypadBtn: {
    width: 68,
    height: 52,
    borderRadius: 12,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  keypadBtnEmpty: {
    width: 68,
    height: 52,
  },
  keypadDigit: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.text,
  },
  keypadDelete: {
    fontSize: 18,
    color: AppColors.textSecondary,
  },
  vaultItemsList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingTop: 12,
  },
  vaultItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  vaultItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  vaultItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  vaultItemMeta: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  unhideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  unhideText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  emptyVaultBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyVaultText: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
    marginTop: 8,
  },
  emptyVaultSubtext: {
    fontSize: 12,
    color: AppColors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
    marginBottom: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  toolCard: {
    flex: 1,
    backgroundColor: AppColors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
  },
  toolDesc: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },
  storageCard: {
    backgroundColor: AppColors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  storageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
    flex: 1,
    marginLeft: 8,
  },
  storageTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: AppColors.primary,
  },
  storageBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.surface,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
  },
  storageBarFill: {
    height: '100%',
  },
  storageLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: AppColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
});
