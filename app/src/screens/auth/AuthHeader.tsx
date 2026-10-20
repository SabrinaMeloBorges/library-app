import { Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';

export const AuthHeader = ({ subtitle }: { subtitle: string }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.header}>
      <Image
        source={require('../../../assets/logo.png')}
        style={styles.logo}
        accessibilityIgnoresInvertColors
      />
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
  logo: { width: 88, height: 88 },
  subtitle: { textAlign: 'center', maxWidth: 300 },
});
