import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';

export const AuthHeader = ({ subtitle }: { subtitle: string }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.header}>
      <View style={[styles.emblem, { borderColor: theme.appColors.accent }]}>
        <MaterialCommunityIcons name="bookshelf" size={32} color={theme.appColors.primary} />
      </View>
      <Text
        variant="displaySmall"
        style={{ color: theme.appColors.primary }}
        accessibilityRole="header"
      >
        Library
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.appColors.textMuted }]}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  emblem: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { textAlign: 'center', maxWidth: 300 },
});
