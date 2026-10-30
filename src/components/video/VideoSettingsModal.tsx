import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import {
  X,
  Volume2,
  Subtitles,
  Repeat,
  Moon,
  Headphones,
  Sliders,
  FolderOpen,
} from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { PlayerSettings } from '@/types/media';
import { formatDuration } from '@/utils/formatters';

interface VideoSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  updateSettings: (updater: Partial<PlayerSettings>) => void;
  currentTime: number;
  onPickSubtitleFile: () => void;
}

export const VideoSettingsModal: React.FC<VideoSettingsModalProps> = ({
  visible,
  onClose,
  settings,
  updateSettings,
  currentTime,
  onPickSubtitleFile,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.headerTitleRow}>
                <Sliders size={20} color={AppColors.primary} />
                <Text style={styles.headerTitle}>Player Settings & Tools</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={20} color={AppColors.textMuted} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {/* Audio Boost (up to 200%) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Volume2 size={18} color={AppColors.primary} />
                <Text style={styles.sectionTitle}>Audio Boost (Volume Max)</Text>
                <Text style={styles.badge}>{Math.round(settings.audioBoost * 100)}%</Text>
              </View>
              <View style={styles.btnRow}>
                {[1.0, 1.25, 1.5, 1.75, 2.0].map(boost => (
                  <Pressable
                    key={boost}
                    style={[
                      styles.choiceBtn,
                      settings.audioBoost === boost && styles.choiceBtnActive,
                    ]}
                    onPress={() => updateSettings({ audioBoost: boost })}>
                    <Text
                      style={[
                        styles.choiceText,
                        settings.audioBoost === boost && styles.choiceTextActive,
                      ]}>
                      {Math.round(boost * 100)}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* A-B Repeat Mode */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Repeat size={18} color={AppColors.primary} />
                <Text style={styles.sectionTitle}>A-B Repeat (Loop Interval)</Text>
              </View>
              <View style={styles.abRow}>
                <Pressable
                  style={[
                    styles.abBtn,
                    settings.abRepeat.a !== null && styles.abBtnSet,
                  ]}
                  onPress={() =>
                    updateSettings({
                      abRepeat: { ...settings.abRepeat, a: currentTime },
                    })
                  }>
                  <Text style={styles.abBtnText}>
                    Point A: {settings.abRepeat.a !== null ? formatDuration(settings.abRepeat.a) : 'Set Current'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.abBtn,
                    settings.abRepeat.b !== null && styles.abBtnSet,
                  ]}
                  onPress={() =>
                    updateSettings({
                      abRepeat: { ...settings.abRepeat, b: currentTime },
                    })
                  }>
                  <Text style={styles.abBtnText}>
                    Point B: {settings.abRepeat.b !== null ? formatDuration(settings.abRepeat.b) : 'Set Current'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.abControlsRow}>
                <Pressable
                  style={[
                    styles.abToggleBtn,
                    settings.abRepeat.enabled && styles.abToggleBtnActive,
                  ]}
                  onPress={() =>
                    updateSettings({
                      abRepeat: {
                        ...settings.abRepeat,
                        enabled: !settings.abRepeat.enabled,
                      },
                    })
                  }>
                  <Text
                    style={[
                      styles.abToggleText,
                      settings.abRepeat.enabled && styles.abToggleTextActive,
                    ]}>
                    {settings.abRepeat.enabled ? 'Repeat Loop: ON' : 'Turn Loop ON'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.abClearBtn}
                  onPress={() =>
                    updateSettings({
                      abRepeat: { a: null, b: null, enabled: false },
                    })
                  }>
                  <Text style={styles.abClearText}>Clear</Text>
                </Pressable>
              </View>
            </View>

            {/* Subtitle Timing & Size */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Subtitles size={18} color={AppColors.primary} />
                <Text style={styles.sectionTitle}>Subtitle Delay Adjustment</Text>
                <Text style={styles.badge}>
                  {settings.subtitleDelay > 0 ? `+${settings.subtitleDelay}s` : `${settings.subtitleDelay}s`}
                </Text>
              </View>
              <View style={styles.btnRow}>
                {[-1.0, -0.5, 0, 0.5, 1.0].map(delay => (
                  <Pressable
                    key={delay}
                    style={[
                      styles.choiceBtn,
                      settings.subtitleDelay === delay && styles.choiceBtnActive,
                    ]}
                    onPress={() => updateSettings({ subtitleDelay: delay })}>
                    <Text
                      style={[
                        styles.choiceText,
                        settings.subtitleDelay === delay && styles.choiceTextActive,
                      ]}>
                      {delay > 0 ? `+${delay}s` : `${delay}s`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Font Size */}
              <Text style={styles.subLabel}>Subtitle Font Size</Text>
              <View style={styles.btnRow}>
                {[14, 18, 22, 26].map(size => (
                  <Pressable
                    key={size}
                    style={[
                      styles.choiceBtn,
                      settings.subtitleFontSize === size && styles.choiceBtnActive,
                    ]}
                    onPress={() => updateSettings({ subtitleFontSize: size })}>
                    <Text
                      style={[
                        styles.choiceText,
                        settings.subtitleFontSize === size && styles.choiceTextActive,
                      ]}>
                      {size}px
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Pick Subtitle File */}
              <Pressable
                style={styles.pickSubBtn}
                onPress={() => {
                  onClose();
                  onPickSubtitleFile();
                }}>
                <FolderOpen size={16} color={AppColors.primary} />
                <Text style={styles.pickSubText}>Load External Subtitles (.srt / .vtt)</Text>
              </Pressable>
            </View>

            {/* Sleep Timer */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Moon size={18} color={AppColors.primary} />
                <Text style={styles.sectionTitle}>Sleep Timer</Text>
                <Text style={styles.badge}>
                  {settings.sleepTimerMinutes ? `${settings.sleepTimerMinutes}m` : 'Off'}
                </Text>
              </View>
              <View style={styles.btnRow}>
                {[15, 30, 45, 60].map(m => (
                  <Pressable
                    key={m}
                    style={[
                      styles.choiceBtn,
                      settings.sleepTimerMinutes === m && styles.choiceBtnActive,
                    ]}
                    onPress={() => updateSettings({ sleepTimerMinutes: m })}>
                    <Text
                      style={[
                        styles.choiceText,
                        settings.sleepTimerMinutes === m && styles.choiceTextActive,
                      ]}>
                      {m}m
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[
                    styles.choiceBtn,
                    settings.sleepTimerMinutes === null && styles.choiceBtnActive,
                  ]}
                  onPress={() => updateSettings({ sleepTimerMinutes: null })}>
                  <Text
                    style={[
                      styles.choiceText,
                      settings.sleepTimerMinutes === null && styles.choiceTextActive,
                    ]}>
                    Off
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Background Audio Playback */}
            <View style={[styles.section, { marginBottom: 20 }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Headphones size={18} color={AppColors.primary} />
                    <Text style={styles.sectionTitle}>Background Audio Play</Text>
                  </View>
                  <Text style={styles.switchDesc}>
                    Keep audio playing when app is minimized or screen is locked
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.toggleSwitch,
                    settings.backgroundAudio && styles.toggleSwitchActive,
                  ]}
                  onPress={() =>
                    updateSettings({ backgroundAudio: !settings.backgroundAudio })
                  }>
                  <View
                    style={[
                      styles.toggleKnob,
                      settings.backgroundAudio && styles.toggleKnobActive,
                    ]}
                  />
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.borderLight,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  section: {
    marginBottom: 20,
    backgroundColor: AppColors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    color: AppColors.primary,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  choiceBtn: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  choiceBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  choiceTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  abRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  abBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  abBtnSet: {
    borderColor: AppColors.primary,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  abBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.text,
  },
  abControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  abToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
  },
  abToggleBtnActive: {
    backgroundColor: AppColors.emerald,
    borderColor: AppColors.emerald,
  },
  abToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.text,
  },
  abToggleTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  abClearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
  },
  abClearText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.rose,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textMuted,
    marginTop: 10,
    marginBottom: 6,
  },
  pickSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  pickSubText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchDesc: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.borderLight,
    padding: 3,
  },
  toggleSwitchActive: {
    backgroundColor: AppColors.primary,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
});
