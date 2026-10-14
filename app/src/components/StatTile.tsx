import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { fontFamilies, radius, spacing } from '../theme/spacing';

interface StatTileProps {
  label: string;
  value: string;
}

export const StatTile = ({ label, value }: StatTileProps) => {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.tile,
        { borderColor: theme.appColors.border, backgroundColor: theme.appColors.surface },
      ]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={[styles.value, { color: theme.appColors.primary }]}>{value}</Text>
      <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
        {label}
      </Text>
    </View>
  );
};

export const StatGrid = ({ children }: { children: ReactNode }) => (
  <View style={styles.grid}>{children}</View>
);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  value: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
});
