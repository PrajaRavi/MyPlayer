import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import {
  FolderSync,
  Film,
  Music2,
  FolderTree,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react-native';
import { AppColors } from '@/constants/colors';

interface StoragePermissionModalProps {
  visible: boolean;
  onRequestPermission: () => Promise<boolean>;
  onDismiss: () => void;
  isScanning?: boolean;
}

export const StoragePermissionModal: React.FC<StoragePermissionModalProps> = ({
  visible,
  onRequestPermission,
  onDismiss,
  isScanning = false,
}) => {
  const [deniedPermanently, setDeniedPermanently] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleGrant = async () => {
    setRequesting(true);
    try {
      const granted = await onRequestPermission();
      if (!granted) {
        setDeniedPermanently(true);
      }
    } catch {
      setDeniedPermanently(true);
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (e) {
      console.warn('Failed to open settings', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Glowing Icon Header */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <FolderSync size={34} color={AppColors.primary} />
            </View>
            <View style={styles.sparkleBadge}>
              <Sparkles size={14} color="#000" />
            </View>
          </View>

          {/* Titles */}
          <Text style={styles.title}>Access Internal Storage</Text>
          <Text style={styles.subtitle}>
            OwnPlayer needs storage permission to automatically scan, organize, and play movies,
            videos, and songs from your phone folders — just like MX Player & PLAYit.
          </Text>

          {/* Features Checklist */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                <Film size={18} color={AppColors.primary} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Scan All Videos & Movies</Text>
                <Text style={styles.featureDesc}>Full HD & 4K video playback with gesture controls</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <FolderTree size={18} color={AppColors.emerald} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Keep Folders Organized</Text>
                <Text style={styles.featureDesc}>Auto-detects Downloads, Movies, WhatsApp, Camera folders</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
                <Music2 size={18} color={AppColors.rose} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Music Library & Audio Player</Text>
                <Text style={styles.featureDesc}>Background play, equalizer, playlists, and synced lyrics</Text>
              </View>
            </View>
          </View>

          {/* Scanning Indicator */}
          {isScanning ? (
            <View style={styles.scanningBox}>
              <ActivityIndicator size="small" color={AppColors.primary} />
              <Text style={styles.scanningText}>Scanning internal storage for media files...</Text>
            </View>
          ) : (
            <>
              {/* Primary Action Button */}
              {deniedPermanently ? (
                <View style={{ width: '100%', gap: 10 }}>
                  <Text style={styles.deniedNotice}>
                    Permission is blocked. Please enable Storage / Photos & Media in your phone's App Settings.
                  </Text>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={handleOpenSettings}>
                    <ExternalLink size={18} color="#000" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryBtnText}>Open App Settings</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[styles.primaryBtn, requesting && styles.btnDisabled]}
                  onPress={handleGrant}
                  disabled={requesting}>
                  {requesting ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#000" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryBtnText}>Grant Permission & Scan</Text>
                    </>
                  )}
                </Pressable>
              )}

              {/* Secondary Option */}
              <Pressable style={styles.secondaryBtn} onPress={onDismiss}>
                <Text style={styles.secondaryBtnText}>Explore with Demo Media</Text>
              </Pressable>
            </>
          )}

          {/* Privacy Note */}
          <View style={styles.privacyRow}>
            <ShieldCheck size={13} color={AppColors.textMuted} />
            <Text style={styles.privacyText}>
              Your files stay 100% on your device. Never uploaded.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1.5,
    borderColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: AppColors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: AppColors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  featuresList: {
    width: '100%',
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    color: AppColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  featureDesc: {
    color: AppColors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  scanningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  scanningText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  deniedNotice: {
    color: AppColors.rose,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  privacyText: {
    color: AppColors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});

