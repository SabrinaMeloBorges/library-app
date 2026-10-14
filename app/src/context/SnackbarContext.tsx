import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useAppTheme';

export interface SnackbarContextValue {
  showMessage: (message: string) => void;
}

export const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const DISPLAY_DURATION_MS = 3000;
const TAB_BAR_CLEARANCE = 64;

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = useCallback((next: string) => setMessage(next), []);
  const value = useMemo<SnackbarContextValue>(() => ({ showMessage }), [showMessage]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Portal>
        <Snackbar
          visible={message !== null}
          onDismiss={() => setMessage(null)}
          duration={DISPLAY_DURATION_MS}
          wrapperStyle={[styles.wrapper, { bottom: insets.bottom + TAB_BAR_CLEARANCE }]}
          style={{ backgroundColor: theme.appColors.primary }}
          theme={{ colors: { inverseOnSurface: theme.appColors.onPrimary } }}
          accessibilityLiveRegion="polite"
        >
          {message ?? ''}
        </Snackbar>
      </Portal>
    </SnackbarContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'center', maxWidth: 640 },
});
