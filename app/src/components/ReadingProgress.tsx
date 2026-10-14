import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';

interface ReadingProgressProps {
  percentage: number;
  label?: string;
  compact?: boolean;
}

export const ReadingProgress = ({ percentage, label, compact = false }: ReadingProgressProps) => {
  const theme = useAppTheme();
  const clamped = Math.max(0, Math.min(100, percentage));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      accessibilityLabel={label}
    >
      {!compact ? (
        <View style={styles.header}>
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            {label}
          </Text>
          <Text variant="labelMedium" style={{ color: theme.appColors.text }}>
            {clamped}%
          </Text>
        </View>
      ) : null}
      <ProgressBar
        progress={clamped / 100}
        color={theme.appColors.accent}
        style={[styles.bar, { backgroundColor: theme.appColors.surfaceMuted }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  bar: { height: 6, borderRadius: 3 },
});
