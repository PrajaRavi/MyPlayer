import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Radio,
  Play,
  Bookmark,
  Trash2,
  Globe,
  Tv,
  Film,
  Music,
  ExternalLink,
} from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { Header } from '@/components/common/Header';
import { StorageService } from '@/services/storage';
import { DEMO_STREAM_BOOKMARKS } from '@/constants/demoMedia';
import { StreamBookmark } from '@/types/media';

export default function StreamScreen() {
  const router = useRouter();
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [bookmarks, setBookmarks] = useState<StreamBookmark[]>([]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    const list = await StorageService.getStreamBookmarks();
    if (list.length === 0) {
      setBookmarks(DEMO_STREAM_BOOKMARKS);
    } else {
      setBookmarks(list);
    }
  };

  const handlePlayStream = (url: string, title?: string) => {
    if (!url.trim()) {
      Alert.alert('Required', 'Please enter a valid video/audio stream URL');
      return;
    }

    router.push({
      pathname: '/player/video',
      params: {
        uri: url.trim(),
        title: title || 'Network Stream',
        resume: 'false',
      },
    });
  };

  const handleSaveBookmark = async () => {
    if (!streamUrl.trim()) {
      Alert.alert('Required', 'Please enter a stream URL');
      return;
    }
    const title = streamTitle.trim() || 'Online Stream';
    const isHls = streamUrl.includes('.m3u8');
    const isAudio = streamUrl.includes('.mp3') || streamUrl.includes('.aac');
    const type = isHls ? 'hls' : isAudio ? 'mp3' : 'mp4';

    const saved = await StorageService.saveStreamBookmark({
      title,
      url: streamUrl.trim(),
      type,
    });
    setBookmarks(prev => [saved, ...prev]);
    setStreamUrl('');
    setStreamTitle('');
    Alert.alert('Saved', `Bookmark "${title}" saved successfully!`);
  };

  const handleDeleteBookmark = async (id: string) => {
    await StorageService.deleteStreamBookmark(id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <View style={styles.container}>
      <Header
        title="Network Stream"
        subtitle="Play live M3U8, HLS, MP4 & MP3 streams"
        showSearch={false}
      />

      <FlatList
        data={bookmarks}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.inputSection}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Radio size={20} color={AppColors.primary} />
                <Text style={styles.cardTitle}>Play from URL or M3U8 Stream</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Stream URL (e.g. https://.../stream.m3u8)"
                placeholderTextColor={AppColors.textMuted}
                value={streamUrl}
                onChangeText={setStreamUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Optional Stream Title (e.g. Live Sports / Cinema)"
                placeholderTextColor={AppColors.textMuted}
                value={streamTitle}
                onChangeText={setStreamTitle}
              />

              <View style={styles.btnRow}>
                <Pressable
                  style={styles.bookmarkBtn}
                  onPress={handleSaveBookmark}>
                  <Bookmark size={18} color={AppColors.text} />
                  <Text style={styles.bookmarkBtnText}>Bookmark</Text>
                </Pressable>

                <Pressable
                  style={styles.playBtn}
                  onPress={() => handlePlayStream(streamUrl, streamTitle)}>
                  <Play size={18} color="#000" fill="#000" />
                  <Text style={styles.playBtnText}>Play Now</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Stream Bookmarks & Channels</Text>
              <Text style={styles.sectionBadge}>{bookmarks.length} channels</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.bookmarkRow}
            onPress={() => handlePlayStream(item.url, item.title)}>
            <View style={styles.streamTypeBadge}>
              {item.type === 'hls' ? (
                <Tv size={18} color={AppColors.primary} />
              ) : item.type === 'mp3' ? (
                <Music size={18} color={AppColors.accent} />
              ) : (
                <Film size={18} color={AppColors.emerald} />
              )}
            </View>

            <View style={styles.bookmarkInfo}>
              <Text style={styles.bookmarkTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.bookmarkUrl} numberOfLines={1}>
                {item.url}
              </Text>
            </View>

            <Pressable
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteBookmark(item.id);
              }}
              hitSlop={8}>
              <Trash2 size={16} color={AppColors.textMuted} />
            </Pressable>

            <View style={styles.playIconBox}>
              <Play size={16} color="#000" fill="#000" />
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  listContent: {
    paddingBottom: 90,
  },
  inputSection: {
    padding: 16,
  },
  card: {
    backgroundColor: AppColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.text,
  },
  input: {
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: AppColors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  bookmarkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.surface,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  bookmarkBtnText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  playBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    borderRadius: 10,
  },
  playBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.text,
  },
  sectionBadge: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.card,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  streamTypeBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  bookmarkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.text,
  },
  bookmarkUrl: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
    marginRight: 8,
  },
  playIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
