import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { CelebrationProvider } from './src/context/CelebrationContext';
import { SnackbarProvider } from './src/context/SnackbarContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { useThemeMode } from './src/hooks/useThemeMode';
import { RootNavigator } from './src/navigation/RootNavigator';
import { configureNotificationHandler } from './src/services/notificationService';
import { reconcileReminders } from './src/services/reminderService';
import { palette } from './src/theme/colors';

configureNotificationHandler();

const ThemedApp = () => {
  const { theme, themeMode, isThemeReady } = useThemeMode();
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    reconcileReminders().catch(() => undefined);
  }, []);

  if (!isThemeReady || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={palette.beige} />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <SnackbarProvider>
        <AuthProvider>
          <CelebrationProvider>
            <RootNavigator />
          </CelebrationProvider>
        </AuthProvider>
      </SnackbarProvider>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.forest,
  },
});
