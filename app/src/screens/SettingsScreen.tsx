import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Divider, List, Switch, Text } from 'react-native-paper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { useSnackbar } from '../hooks/useSnackbar';
import { useThemeMode } from '../hooks/useThemeMode';
import type { RootStackScreenProps } from '../navigation/types';
import { API_BASE_URL } from '../services/apiConfig';
import { getErrorMessage } from '../services/apiError';
import { socialService } from '../services/socialService';
import { spacing } from '../theme/spacing';

export const SettingsScreen = ({ navigation }: RootStackScreenProps<'Settings'>) => {
  const theme = useAppTheme();
  const { user, logout, updateUser } = useAuth();
  const { showMessage } = useSnackbar();
  const { themeMode, toggleTheme } = useThemeMode();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingShare, setIsSavingShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleShare = async (shareActivity: boolean) => {
    setIsSavingShare(true);
    setError(null);
    try {
      updateUser(await socialService.updateMe({ shareActivity }));
      showMessage(
        shareActivity ? 'Suas atividades voltarão ao feed.' : 'Novas atividades ficarão privadas.',
      );
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSavingShare(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <ScreenContainer>
      {error ? <FeedbackBanner type="error" message={error} /> : null}
      <List.Section>
        <List.Subheader>Conta</List.Subheader>
        <List.Item
          title="Editar perfil"
          description={user ? `${user.name} · @${user.username}` : undefined}
          left={(props) => <List.Icon {...props} icon="account-edit-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('EditProfile')}
        />
        <List.Item
          title="Compartilhar atividades no feed"
          description="Livros iniciados e concluídos, resenhas, metas e conquistas"
          left={(props) => <List.Icon {...props} icon="account-group-outline" />}
          right={() => (
            <Switch
              value={user?.shareActivity ?? true}
              disabled={isSavingShare}
              onValueChange={(value) => void toggleShare(value)}
              accessibilityLabel="Compartilhar atividades no feed"
            />
          )}
        />
        <Divider />
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
        <List.Item
          title="Conquistas"
          description="Medalhas de bronze, prata e ouro"
          left={(props) => <List.Icon {...props} icon="medal-outline" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Achievements')}
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
  logout: { marginTop: spacing.xl },
  apiInfo: { marginTop: spacing.lg, textAlign: 'center' },
});
