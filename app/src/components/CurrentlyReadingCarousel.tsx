import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import type { LibraryItem } from '../types/api';
import { radius, spacing } from '../theme/spacing';
import { BookCover } from './BookCover';
import { PillButton } from './PillButton';
import { ReadingProgress } from './ReadingProgress';

interface CurrentlyReadingCarouselProps {
  items: LibraryItem[];
  onOpen: (bookId: string) => void;
  onUpdate: (bookId: string) => void;
}

const keyExtractor = (item: LibraryItem): string => item.id;

export const CurrentlyReadingCarousel = ({
  items,
  onOpen,
  onUpdate,
}: CurrentlyReadingCarouselProps) => {
  const theme = useAppTheme();
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View onLayout={handleLayout}>
      {width > 0 ? (
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => (
            <View style={[styles.card, { width, backgroundColor: theme.appColors.accentSoft }]}>
              <Pressable
                onPress={() => onOpen(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${item.book.title}, ${item.progress}% lido`}
                style={styles.opener}
              >
                <BookCover uri={item.book.coverUrl} title={item.book.title} width={74} />
                <View style={styles.info}>
                  <Text variant="titleMedium" numberOfLines={2}>
                    {item.book.title}
                  </Text>
                  <Text
                    variant="bodySmall"
                    numberOfLines={1}
                    style={{ color: theme.appColors.textMuted }}
                  >
                    por {item.book.authors}
                  </Text>
                  <ReadingProgress
                    percentage={item.progress}
                    label={`Página ${item.currentPage} de ${item.totalPages}`}
                  />
                </View>
              </Pressable>
              <PillButton
                icon="bookmark-plus-outline"
                onPress={() => onUpdate(item.id)}
                style={styles.update}
                accessibilityLabel={`Registrar leitura de ${item.book.title}`}
              >
                Atualizar
              </PillButton>
            </View>
          )}
        />
      ) : null}
      {items.length > 1 ? (
        <View
          style={styles.dots}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex ? theme.appColors.highlight : theme.appColors.border,
                  width: index === activeIndex ? 16 : 6,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, borderRadius: radius.lg },
  opener: { flexDirection: 'row', gap: spacing.lg },
  info: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
  update: { alignSelf: 'flex-end', marginTop: spacing.xs },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dot: { height: 6, borderRadius: 3 },
});
