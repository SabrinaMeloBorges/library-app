import { Linking, Platform, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { spacing } from '../theme/spacing';

const ANDROID_APK_URL =
  'https://github.com/SabrinaMeloBorges/library-app/releases/latest/download/library.apk';

export const DownloadAppButton = () => {
  if (Platform.OS !== 'web') return null;

  return (
    <Button
      mode="outlined"
      icon="android"
      onPress={() => void Linking.openURL(ANDROID_APK_URL)}
      style={styles.button}
    >
      Baixar app para Android
    </Button>
  );
};

const styles = StyleSheet.create({
  button: { marginTop: spacing.md, alignSelf: 'center' },
});
