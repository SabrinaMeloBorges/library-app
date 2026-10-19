import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { LibraryItem } from '../types/api';
import { spacing } from '../theme/spacing';
import { BookCover } from './BookCover';
import { ReadingProgress } from './ReadingProgress';

interface BookGridItemProps {
  item: LibraryItem;
  width: number;
  onPress: (id: string) => void;
}

const BookGridItemComponent = ({ item, width, onPress }: BookGridItemProps) => {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`${item.book.title}, de ${item.book.authors}`}
      style={({ pressed }) => [styles.cell, { width }, pressed && styles.pressed]}
    >
      <BookCover uri={item.book.coverUrl} title={item.book.title} width={width} />
      <Text variant="labelLarge" numberOfLines={2} style={styles.title}>
        {item.book.title}
      </Text>
      <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.appColors.textMuted }}>
        {item.book.authors}
      </Text>
      <ReadingProgress
        percentage={item.progress}
        compact
        label={`Progresso de ${item.book.title}`}
      />
    </Pressable>
  );
};

export const BookGridItem = memo(BookGridItemComponent);

const styles = StyleSheet.create({
  cell: { gap: spacing.xs, marginBottom: spacing.lg },
  pressed: { opacity: 0.7 },
  title: { marginTop: spacing.xs },
});
