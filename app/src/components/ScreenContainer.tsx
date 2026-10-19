import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';
import { spacing } from '../theme/spacing';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
}

const MAX_CONTENT_WIDTH = 640;

export const ScreenContainer = ({
  children,
  scroll = true,
  edges = ['left', 'right'],
  refreshing = false,
  onRefresh,
  footer,
}: ScreenContainerProps) => {
  const theme = useAppTheme();
  const background = { backgroundColor: theme.appColors.background };

  return (
    <SafeAreaView style={[styles.safeArea, background]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.appColors.primary}
                  colors={[theme.appColors.primary]}
                />
              ) : undefined
            }
          >
            <View style={styles.inner}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.inner, styles.fixedContent]}>{children}</View>
        )}
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  fixedContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
