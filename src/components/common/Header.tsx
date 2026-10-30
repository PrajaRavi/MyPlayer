import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Search, X, FolderSync, PlusCircle, ArrowUpDown, Shield } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { useMediaContext } from '@/context/MediaContext';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  onOpenSort?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showSearch = true,
  onOpenSort,
}) => {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    refreshLibrary,
    pickExternalMedia,
    isLoading,
  } = useMediaContext();

  const [isSearching, setIsSearching] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {!isSearching ? (
          <>
            <View style={styles.titleContainer}>
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoBadgeText}>OWN</Text>
                </View>
                <Text style={styles.title}>{title}</Text>
              </View>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>

            <View style={styles.actionButtons}>
              {showSearch && (
                <Pressable
                  style={styles.iconButton}
                  onPress={() => setIsSearching(true)}
                  hitSlop={8}>
                  <Search size={20} color={AppColors.text} />
                </Pressable>
              )}

              {onOpenSort && (
                <Pressable
                  style={styles.iconButton}
                  onPress={onOpenSort}
                  hitSlop={8}>
                  <ArrowUpDown size={20} color={AppColors.text} />
                </Pressable>
              )}

              <Pressable
                style={styles.iconButton}
                onPress={pickExternalMedia}
                hitSlop={8}>
                <PlusCircle size={20} color={AppColors.primary} />
              </Pressable>

              <Pressable
                style={[styles.iconButton, isLoading && styles.disabledButton]}
                onPress={refreshLibrary}
                disabled={isLoading}
                hitSlop={8}>
                <FolderSync size={20} color={isLoading ? AppColors.textMuted : AppColors.text} />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.searchBarContainer}>
            <Search size={18} color={AppColors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search videos, songs, folders..."
              placeholderTextColor={AppColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={18} color={AppColors.textMuted} />
              </Pressable>
            )}
            <Pressable
              style={styles.cancelSearchBtn}
              onPress={() => {
                setSearchQuery('');
                setIsSearching(false);
              }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  titleContainer: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logoBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: AppColors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  cancelSearchBtn: {
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cancelText: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
