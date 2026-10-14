import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { radius, spacing } from '../theme/spacing';

interface ShelfCardProps {
  label: string;
  count: number;
  color: string;
  textColor: string;
  onPress?: () => void;
}

export const ShelfCard = ({ label, count, color, textColor, onPress }: ShelfCardProps) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : 'text'}
    accessibilityLabel={`${label}: ${count} livros`}
    style={({ pressed }) => [styles.book, { backgroundColor: color }, pressed && styles.pressed]}
  >
    <View style={[styles.spine, { backgroundColor: textColor }]} />
    <View style={[styles.pages, { borderColor: textColor }]} />
    <Text variant="titleLarge" style={[styles.label, { color: textColor }]} numberOfLines={2}>
      {label}
    </Text>
    <Text variant="labelLarge" style={{ color: textColor }}>
      ({count})
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  book: {
    flex: 1,
    minHeight: 120,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingLeft: spacing.lg,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  spine: { position: 'absolute', left: 8, top: 0, bottom: 0, width: 3, opacity: 0.35 },
  pages: {
    position: 'absolute',
    right: 0,
    top: 6,
    bottom: 6,
    width: 5,
    borderLeftWidth: 1,
    opacity: 0.3,
  },
  label: { textAlign: 'center' },
});
