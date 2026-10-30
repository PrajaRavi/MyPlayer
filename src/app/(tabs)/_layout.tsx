import React from 'react';
import { StyleSheet, Platform, View, Text, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Film, Music2, Radio, ShieldCheck } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { MiniPlayerBar } from '@/components/audio/MiniPlayerBar';
import { FullAudioPlayerModal } from '@/components/audio/FullAudioPlayerModal';
import { StoragePermissionModal } from '@/components/common/StoragePermissionModal';
import { useMediaContext } from '@/context/MediaContext';

export default function TabLayout() {
  const {
    isPermissionModalVisible,
    setIsPermissionModalVisible,
    requestStoragePermission,
    isScanning,
  } = useMediaContext();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Scanning status banner when background scan is running */}
      {isScanning && (
        <View style={styles.scanningBanner}>
          <ActivityIndicator size="small" color="#000" />
          <Text style={styles.scanningBannerText}>
            Scanning internal storage folders for media files...
          </Text>
        </View>
      )}

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: AppColors.primary,
          tabBarInactiveTintColor: AppColors.textMuted,
          tabBarStyle: {
            backgroundColor: AppColors.card,
            borderTopColor: AppColors.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Videos',
            tabBarIcon: ({ color, size }) => <Film size={size - 2} color={color} />,
          }}
        />
        <Tabs.Screen
          name="music"
          options={{
            title: 'Music',
            tabBarIcon: ({ color, size }) => <Music2 size={size - 2} color={color} />,
          }}
        />
        <Tabs.Screen
          name="stream"
          options={{
            title: 'Stream',
            tabBarIcon: ({ color, size }) => <Radio size={size - 2} color={color} />,
          }}
        />
        <Tabs.Screen
          name="tools"
          options={{
            title: 'Vault & Tools',
            tabBarIcon: ({ color, size }) => <ShieldCheck size={size - 2} color={color} />,
          }}
        />
      </Tabs>

      {/* Docked persistent Mini Player Bar */}
      <MiniPlayerBar />

      {/* Full Screen Audio Player Modal */}
      <FullAudioPlayerModal />

      {/* First-time Storage Permission & Scan Modal (MX Player & PLAYit style) */}
      <StoragePermissionModal
        visible={isPermissionModalVisible}
        onRequestPermission={requestStoragePermission}
        onDismiss={() => setIsPermissionModalVisible(false)}
        isScanning={isScanning}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scanningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  scanningBannerText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
});
