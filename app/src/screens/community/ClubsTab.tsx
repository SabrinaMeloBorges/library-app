import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { FormTextField } from '../../components/FormTextField';
import { PillButton } from '../../components/PillButton';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { useActionFeedback } from '../../hooks/useActionFeedback';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { getErrorMessage } from '../../services/apiError';
import { clubService } from '../../services/clubService';
import type { ClubSummary } from '../../types/social';
import { radius, spacing } from '../../theme/spacing';

interface ClubsTabProps {
  onOpenClub: (clubId: string) => void;
  onCreateClub: () => void;
}

const INVITE_PATTERN = /^[A-Z0-9]{8}$/;

const keyExtractor = (club: ClubSummary): string => club.id;

export const ClubsTab = ({ onOpenClub, onCreateClub }: ClubsTabProps) => {
  const theme = useAppTheme();
  const { notifySuccess } = useActionFeedback();
  const loader = useCallback(() => clubService.list(), []);
  const clubs = useAsyncResource(loader);
  const [joinVisible, setJoinVisible] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const closeJoin = () => {
    setJoinVisible(false);
    setInviteCode('');
    setJoinError(null);
  };

  const join = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (!INVITE_PATTERN.test(code)) {
      setJoinError('O código tem 8 letras ou números.');
      return;
    }
    setIsJoining(true);
    try {
      const club = await clubService.join(code);
      closeJoin();
      notifySuccess(`Você entrou no ${club.name}.`);
      onOpenClub(club.id);
    } catch (error) {
      setJoinError(getErrorMessage(error));
    } finally {
      setIsJoining(false);
    }
  };

  const renderEmpty = () => {
    if (clubs.isLoading) return <LoadingState message="Carregando clubes..." />;
    if (clubs.error) return <ErrorState message={clubs.error} onRetry={clubs.reload} />;
    return (
      <EmptyState
        icon="account-group-outline"
        title="Leia em companhia"
        description="Crie um clube do livro com seus amigos, definam metas coletivas e conversem sobre a leitura."
      />
    );
  };

  return (
    <>
      <FlatList
        data={clubs.error ? [] : (clubs.data ?? [])}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <View style={styles.actions}>
            <PillButton variant="contained" icon="plus" onPress={onCreateClub}>
              Criar clube
            </PillButton>
            <PillButton icon="ticket-confirmation-outline" onPress={() => setJoinVisible(true)}>
              Entrar com código
            </PillButton>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onOpenClub(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir clube ${item.name}`}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: theme.appColors.accentSoft },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.emblem, { backgroundColor: theme.appColors.primary }]}>
              <MaterialCommunityIcons
                name="book-multiple-outline"
                size={26}
                color={theme.appColors.onPrimary}
              />
            </View>
            <View style={styles.flex}>
              <Text variant="titleMedium">{item.name}</Text>
              {item.description ? (
                <Text
                  variant="bodySmall"
                  numberOfLines={2}
                  style={{ color: theme.appColors.textMuted }}
                >
                  {item.description}
                </Text>
              ) : null}
              <Text variant="labelSmall" style={{ color: theme.appColors.highlight }}>
                {item.memberCount} {item.memberCount === 1 ? 'membro' : 'membros'}
                {item.isOwner ? ' · você organiza' : ''}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={theme.appColors.textMuted}
            />
          </Pressable>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={clubs.isRefreshing}
            onRefresh={clubs.refresh}
            tintColor={theme.appColors.primary}
            colors={[theme.appColors.primary]}
          />
        }
      />
      <Portal>
        <Dialog
          visible={joinVisible}
          onDismiss={closeJoin}
          style={{ backgroundColor: theme.appColors.surface }}
        >
          <Dialog.Title>Entrar em um clube</Dialog.Title>
          <Dialog.Content>
            {joinError ? <FeedbackBanner type="error" message={joinError} /> : null}
            <FormTextField
              label="Código de convite"
              value={inviteCode}
              onChangeText={(text) => {
                setInviteCode(text.toUpperCase());
                setJoinError(null);
              }}
              autoCapitalize="characters"
              maxLength={8}
              hint="Peça o código para quem organiza o clube."
              disabled={isJoining}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeJoin} disabled={isJoining}>
              Cancelar
            </Button>
            <Button onPress={join} loading={isJoining} disabled={isJoining}>
              Entrar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, flexGrow: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.8 },
  emblem: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
});
