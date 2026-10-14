import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const LoadingState = ({ message = 'Carregando...' }: { message?: string }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator color={theme.appColors.primary} />
      <Text variant="bodyMedium" style={[styles.message, { color: theme.appColors.textMuted }]}>
        {message}
      </Text>
    </View>
  );
};

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorState = ({
  message,
  onRetry,
  title = 'Algo não saiu como esperado',
}: ErrorStateProps) => {
  const theme = useAppTheme();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={36}
        color={theme.appColors.danger}
      />
      <Text variant="titleLarge" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.appColors.textMuted }]}>
        {message}
      </Text>
      {onRetry ? (
        <Button mode="outlined" icon="refresh" onPress={onRetry} style={styles.action}>
          Tentar novamente
        </Button>
      ) : null}
    </View>
  );
};

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconFrame, { borderColor: theme.appColors.border }]}>
        <MaterialCommunityIcons name={icon} size={32} color={theme.appColors.accent} />
      </View>
      <Text variant="titleLarge" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.appColors.textMuted }]}>
        {description}
      </Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', maxWidth: 360 },
  action: { marginTop: spacing.md },
});
