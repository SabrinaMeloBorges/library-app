import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'library.auth.token';

const isWeb = Platform.OS === 'web';

export const tokenStorage = {
  async read(): Promise<string | null> {
    try {
      return isWeb
        ? await AsyncStorage.getItem(TOKEN_KEY)
        : await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async save(token: string): Promise<void> {
    if (isWeb) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async clear(): Promise<void> {
    try {
      if (isWeb) await AsyncStorage.removeItem(TOKEN_KEY);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      return;
    }
  },
};
