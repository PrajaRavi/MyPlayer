import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Check, X, ArrowUp, ArrowDown } from 'lucide-react-native';
import { AppColors } from '@/constants/colors';
import { useMediaContext, SortMode } from '@/context/MediaContext';

interface SortFilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SortFilterModal: React.FC<SortFilterModalProps> = ({ visible, onClose }) => {
  const { sortMode, setSortMode, sortOrder, setSortOrder } = useMediaContext();

  const options: { label: string; mode: SortMode }[] = [
    { label: 'Date Modified', mode: 'date' },
    { label: 'File Name', mode: 'name' },
    { label: 'File Size', mode: 'size' },
    { label: 'Duration / Length', mode: 'duration' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Sort Media</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={AppColors.textMuted} />
            </Pressable>
          </View>

          {/* Sort order toggle (Ascending vs Descending) */}
          <View style={styles.orderToggleRow}>
            <Pressable
              style={[
                styles.orderBtn,
                sortOrder === 'desc' && styles.orderBtnActive,
              ]}
              onPress={() => setSortOrder('desc')}>
              <ArrowDown size={16} color={sortOrder === 'desc' ? '#000' : AppColors.text} />
              <Text
                style={[
                  styles.orderText,
                  sortOrder === 'desc' && styles.orderTextActive,
                ]}>
                Descending
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.orderBtn,
                sortOrder === 'asc' && styles.orderBtnActive,
              ]}
              onPress={() => setSortOrder('asc')}>
              <ArrowUp size={16} color={sortOrder === 'asc' ? '#000' : AppColors.text} />
              <Text
                style={[
                  styles.orderText,
                  sortOrder === 'asc' && styles.orderTextActive,
                ]}>
                Ascending
              </Text>
            </Pressable>
          </View>

          {/* Options */}
          <View style={styles.optionList}>
            {options.map(opt => {
              const isSelected = sortMode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  style={styles.optionItem}
                  onPress={() => {
                    setSortMode(opt.mode);
                    onClose();
                  }}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={18} color={AppColors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.text,
  },
  orderToggleRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.card,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  orderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  orderBtnActive: {
    backgroundColor: AppColors.primary,
  },
  orderText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  orderTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  optionList: {
    gap: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  optionLabel: {
    fontSize: 15,
    color: AppColors.text,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },
});
