import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { GENRES, type GenreShortcut } from '../utils/genres';
import { radius, spacing } from '../theme/spacing';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TILE_SIZE = 64;

export const GenreShortcuts = ({ onSelect }: { onSelect: (genre: GenreShortcut) => void }) => {
  const theme = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel="Explorar por gênero"
    >
      {GENRES.map((genre, index) => (
        <Pressable
          key={genre.subject}
          onPress={() => onSelect(genre)}
          accessibilityRole="button"
          accessibilityLabel={`Explorar ${genre.label}`}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View
            style={[
              styles.tile,
              {
                backgroundColor:
                  index % 2 === 0 ? theme.appColors.primary : theme.appColors.highlight,
              },
            ]}
          >
            <View style={[styles.spine, { backgroundColor: theme.appColors.onPrimary }]} />
            <MaterialCommunityIcons
              name={genre.icon as IconName}
              size={28}
              color={index % 2 === 0 ? theme.appColors.onPrimary : theme.appColors.background}
            />
          </View>
          <Text variant="labelSmall" numberOfLines={2} style={styles.label}>
            {genre.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: { gap: spacing.md, paddingVertical: spacing.xs },
  item: { width: TILE_SIZE + 8, alignItems: 'center', gap: spacing.xs },
  pressed: { opacity: 0.7 },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  spine: { position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, opacity: 0.35 },
  label: { textAlign: 'center' },
});
