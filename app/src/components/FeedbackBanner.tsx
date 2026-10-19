import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { radius, spacing } from '../theme/spacing';

interface FeedbackBannerProps {
  type: 'success' | 'error' | 'info';
  message: string;
}

const ICONS = {
  success: 'check-circle-outline',
  error: 'alert-circle-outline',
  info: 'information-outline',
} as const;

export const FeedbackBanner = ({ type, message }: FeedbackBannerProps) => {
  const theme = useAppTheme();
  const color = type === 'error' ? theme.appColors.danger : theme.appColors.accent;
  const background = type === 'error' ? theme.appColors.dangerSoft : theme.appColors.surfaceMuted;
  return (
    <View
      style={[styles.banner, { backgroundColor: background, borderColor: color }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <MaterialCommunityIcons name={ICONS[type]} size={20} color={color} />
      <Text variant="bodyMedium" style={[styles.text, { color: theme.appColors.text }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: { flex: 1 },
});
