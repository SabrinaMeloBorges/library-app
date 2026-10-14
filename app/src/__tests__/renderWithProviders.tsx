import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SnackbarProvider } from '../context/SnackbarContext';
import { lightTheme } from '../theme/paperTheme';

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export const renderWithProviders = (element: ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <PaperProvider theme={lightTheme}>
        <SnackbarProvider>{element}</SnackbarProvider>
      </PaperProvider>
    </SafeAreaProvider>,
  );
