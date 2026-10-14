import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={styles.texts}>
        <Text variant="titleLarge" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  texts: { flex: 1 },
});
