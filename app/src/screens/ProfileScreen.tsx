import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider, List, Switch, Text } from 'react-native-paper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { useThemeMode } from '../hooks/useThemeMode';
import type { MainTabScreenProps } from '../navigation/types';
import { API_BASE_URL } from '../services/apiConfig';
import { formatDate } from '../utils/dates';
import { spacing } from '../theme/spacing';

export const ProfileScreen = ({ navigation }: MainTabScreenProps<'Profile'>) => {
  const theme = useAppTheme();
  const { user, logout } = useAuth();
  const { themeMode, toggleTheme } = useThemeMode();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <ScreenContainer>
      <View style={styles.identity}>
        <Text variant="headlineSmall">{user?.name}</Text>
        <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
          {user?.email}
        </Text>
        {user ? (
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            Leitor desde {formatDate(user.createdAt)}
          </Text>
        ) : null}
      </View>

      <List.Section>
        <List.Subheader>Preferências</List.Subheader>
        <List.Item
          title="Tema escuro"
          description="A preferência fica salva neste dispositivo"
          left={(props) => <List.Icon {...props} icon="weather-night" />}
          right={() => (
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              accessibilityLabel="Tema escuro"
            />
          )}
        />
        <List.Item
          title="Lembretes de leitura"
          description="Horário, dias e notificação de teste"
          left={(props) => <List.Icon {...props} icon="bell-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('ReminderSettings')}
        />
        <Divider />
        <List.Subheader>Leituras</List.Subheader>
        <List.Item
          title="Estatísticas"
          description="Páginas, tempo e livros por status"
          left={(props) => <List.Icon {...props} icon="chart-box-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Statistics')}
        />
      </List.Section>

      <Button
        mode="outlined"
        icon="logout"
        onPress={() => setConfirmLogout(true)}
        style={styles.logout}
        disabled={isLoggingOut}
      >
        Sair da conta
      </Button>
      <Text variant="bodySmall" style={[styles.apiInfo, { color: theme.appColors.textMuted }]}>
        API: {API_BASE_URL}
      </Text>

      <ConfirmDialog
        visible={confirmLogout}
        title="Sair da conta"
        message="Sua sessão será encerrada neste dispositivo."
        confirmLabel="Sair"
        isProcessing={isLoggingOut}
        onDismiss={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  identity: { gap: spacing.xs, marginBottom: spacing.md },
  logout: { marginTop: spacing.xl },
  apiInfo: { marginTop: spacing.lg, textAlign: 'center' },
});
