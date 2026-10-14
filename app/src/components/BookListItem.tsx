import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { LibraryItem } from '../types/api';
import { radius, spacing } from '../theme/spacing';
import { BookCover } from './BookCover';
import { ReadingProgress } from './ReadingProgress';
import { StatusBadge } from './StatusBadge';

interface BookListItemProps {
  item: LibraryItem;
  onPress: (id: string) => void;
}

const BookListItemComponent = ({ item, onPress }: BookListItemProps) => {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`${item.book.title}, de ${item.book.authors}`}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.appColors.border },
        pressed && { backgroundColor: theme.appColors.surfaceMuted },
      ]}
    >
      <BookCover uri={item.book.coverUrl} title={item.book.title} width={52} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
            {item.book.title}
          </Text>
          {item.isFavorite ? (
            <MaterialCommunityIcons
              name="heart"
              size={16}
              color={theme.appColors.highlight}
              accessibilityLabel="Favorito"
            />
          ) : null}
        </View>
        <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.appColors.textMuted }}>
          {item.book.authors}
        </Text>
        <View style={styles.meta}>
          <StatusBadge status={item.status} />
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            {item.currentPage}/{item.totalPages} págs.
          </Text>
        </View>
        <ReadingProgress
          percentage={item.progress}
          compact
          label={`Progresso de ${item.book.title}`}
        />
      </View>
    </Pressable>
  );
};

export const BookListItem = memo(BookListItemComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
  },
  content: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  title: { flex: 1 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
