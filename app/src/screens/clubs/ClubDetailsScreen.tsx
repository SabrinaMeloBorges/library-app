import { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { Avatar } from '../../components/Avatar';
import { BookCover } from '../../components/BookCover';
import { BookStackIllustration } from '../../components/BookStackIllustration';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { PillButton } from '../../components/PillButton';
import { ReadingProgress } from '../../components/ReadingProgress';
import { ScreenContainer } from '../../components/ScreenContainer';
import { SectionHeader } from '../../components/SectionHeader';
import { ErrorState, LoadingState } from '../../components/StateViews';
import { useActionFeedback } from '../../hooks/useActionFeedback';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { useAuth } from '../../hooks/useAuth';
import type { RootStackScreenProps } from '../../navigation/types';
import { getErrorMessage } from '../../services/apiError';
import { clubService } from '../../services/clubService';
import type { ClubGoal } from '../../types/social';
import { formatDateKey } from '../../utils/dates';
import { GOAL_STATE_LABELS, GOAL_TYPE_LABELS, GOAL_UNITS } from '../../utils/labels';
import { radius, spacing } from '../../theme/spacing';

type PendingAction =
  | { kind: 'leave' }
  | { kind: 'delete' }
  | { kind: 'removeMember'; userId: string; name: string }
  | { kind: 'removeGoal'; goal: ClubGoal };

const CONFIRM_COPY: Record<PendingAction['kind'], { title: string; confirm: string }> = {
  leave: { title: 'Sair do clube', confirm: 'Sair' },
  delete: { title: 'Excluir clube', confirm: 'Excluir' },
  removeMember: { title: 'Remover membro', confirm: 'Remover' },
  removeGoal: { title: 'Excluir meta do clube', confirm: 'Excluir' },
};

const describePending = (action: PendingAction): string => {
  switch (action.kind) {
    case 'leave':
      return 'Você deixará de ver as metas e a conversa deste clube.';
    case 'delete':
      return 'O clube, suas metas coletivas e a conversa serão excluídos para todos.';
    case 'removeMember':
      return `${action.name} deixará de participar do clube.`;
    case 'removeGoal':
      return `A meta "${action.goal.title}" será removida.`;
  }
};

export const ClubDetailsScreen = ({ navigation, route }: RootStackScreenProps<'ClubDetails'>) => {
  const { clubId } = route.params;
  const theme = useAppTheme();
  const { user } = useAuth();
  const { notifySuccess } = useActionFeedback();
  const loader = useCallback(() => clubService.get(clubId), [clubId]);
  const details = useAsyncResource(loader);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const club = details.data;
  const isOwner = club?.viewerRole === 'OWNER';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: club?.name ?? 'Clube',
      headerRight: isOwner
        ? () => (
            <IconButton
              icon="pencil-outline"
              onPress={() => navigation.navigate('ClubForm', { clubId })}
              accessibilityLabel="Editar clube"
            />
          )
        : undefined,
    });
  }, [navigation, club?.name, isOwner, clubId]);

  if (details.isLoading) return <LoadingState message="Abrindo clube..." />;
  if (details.error || !club) {
    return (
      <ScreenContainer>
        <ErrorState message={details.error ?? 'Clube não encontrado.'} onRetry={details.reload} />
      </ScreenContainer>
    );
  }

  const shareInvite = () =>
    Share.share({
      message: `Entre no clube "${club.name}" no Library usando o código ${club.inviteCode}.`,
    });

  const confirmPending = async () => {
    if (!pending) return;
    setIsProcessing(true);
    setError(null);
    try {
      switch (pending.kind) {
        case 'leave':
          await clubService.removeMember(clubId, user?.id ?? '');
          notifySuccess('Você saiu do clube.');
          navigation.goBack();
          return;
        case 'delete':
          await clubService.remove(clubId);
          notifySuccess('Clube excluído.');
          navigation.goBack();
          return;
        case 'removeMember':
          await clubService.removeMember(clubId, pending.userId);
          notifySuccess(`${pending.name} foi removida(o) do clube.`);
          break;
        case 'removeGoal':
          await clubService.removeGoal(clubId, pending.goal.id);
          notifySuccess('Meta do clube excluída.');
          break;
      }
      await details.refetch();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsProcessing(false);
      setPending(null);
    }
  };

  return (
    <ScreenContainer refreshing={details.isRefreshing} onRefresh={details.refresh}>
      {error ? <FeedbackBanner type="error" message={error} /> : null}
      <View style={[styles.hero, { backgroundColor: theme.appColors.hero }]}>
        <View style={styles.flex}>
          <Text variant="headlineSmall" style={{ color: theme.appColors.onHero }}>
            {club.name}
          </Text>
          {club.description ? (
            <Text variant="bodyMedium" style={{ color: theme.appColors.onHero, opacity: 0.85 }}>
              {club.description}
            </Text>
          ) : null}
          <Text variant="labelMedium" style={{ color: theme.appColors.onHero, opacity: 0.85 }}>
            {club.members.length} {club.members.length === 1 ? 'membro' : 'membros'}
          </Text>
        </View>
        <BookStackIllustration books={5} width={60} seed={5} />
      </View>

      {club.currentBook ? (
        <View style={[styles.currentBook, { backgroundColor: theme.appColors.accentSoft }]}>
          <BookCover uri={club.currentBook.coverUrl} title={club.currentBook.title} width={52} />
          <View style={styles.flex}>
            <Text variant="labelMedium" style={{ color: theme.appColors.highlight }}>
              Leitura do momento
            </Text>
            <Text variant="titleMedium">{club.currentBook.title}</Text>
            <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
              por {club.currentBook.authors}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {club.conversationId ? (
          <PillButton
            variant="contained"
            icon="chat-outline"
            onPress={() =>
              navigation.navigate('Chat', {
                conversationId: club.conversationId ?? '',
                title: club.name,
              })
            }
          >
            Conversa do clube
          </PillButton>
        ) : null}
        <PillButton icon="share-variant-outline" onPress={() => void shareInvite()}>
          Convidar
        </PillButton>
        {isOwner ? (
          <PillButton
            variant="soft"
            icon="account-plus-outline"
            onPress={() => navigation.navigate('AddClubMembers', { clubId })}
          >
            Adicionar amigos
          </PillButton>
        ) : null}
      </View>

      <View style={[styles.invite, { borderColor: theme.appColors.border }]}>
        <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
          Código de convite
        </Text>
        <Text
          variant="headlineSmall"
          selectable
          style={styles.code}
          accessibilityLabel={`Código ${club.inviteCode.split('').join(' ')}`}
        >
          {club.inviteCode}
        </Text>
      </View>

      <SectionHeader
        title="Metas coletivas"
        subtitle="O progresso soma a leitura de todos os membros"
        action={
          isOwner ? (
            <Button compact icon="plus" onPress={() => navigation.navigate('GoalForm', { clubId })}>
              Nova
            </Button>
          ) : undefined
        }
      />
      {club.goals.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
          {isOwner ? 'Crie uma meta para o grupo ler junto.' : 'Ainda não há metas no clube.'}
        </Text>
      ) : (
        club.goals.map((goal) => (
          <View
            key={goal.id}
            style={[
              styles.goal,
              { borderColor: theme.appColors.border, backgroundColor: theme.appColors.surface },
            ]}
          >
            <View style={styles.goalHeader}>
              <View style={styles.flex}>
                <Text variant="titleMedium">{goal.title}</Text>
                <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                  {GOAL_TYPE_LABELS[goal.type]} · {formatDateKey(goal.startDate)} –{' '}
                  {formatDateKey(goal.endDate)}
                </Text>
              </View>
              {isOwner ? (
                <>
                  <IconButton
                    icon="pencil-outline"
                    size={18}
                    onPress={() => navigation.navigate('GoalForm', { clubId, goalId: goal.id })}
                    accessibilityLabel={`Editar meta ${goal.title}`}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    size={18}
                    onPress={() => setPending({ kind: 'removeGoal', goal })}
                    accessibilityLabel={`Excluir meta ${goal.title}`}
                  />
                </>
              ) : null}
            </View>
            <ReadingProgress
              percentage={goal.percentage}
              label={`${goal.currentValue} de ${goal.targetValue} ${GOAL_UNITS[goal.type]} · ${GOAL_STATE_LABELS[goal.state]}`}
            />
            {goal.contributions.map((contribution) => (
              <View key={contribution.user.id} style={styles.contribution}>
                <Avatar name={contribution.user.name} seed={contribution.user.id} size={24} />
                <Text variant="bodySmall" style={styles.flex}>
                  {contribution.user.name}
                </Text>
                <Text variant="labelMedium">{contribution.value}</Text>
              </View>
            ))}
          </View>
        ))
      )}

      <SectionHeader title="Membros" />
      {club.members.map((member) => (
        <View
          key={member.id}
          style={[styles.member, { borderBottomColor: theme.appColors.border }]}
        >
          <Pressable
            onPress={() =>
              member.id === user?.id
                ? undefined
                : navigation.navigate('UserProfile', { userId: member.id })
            }
            style={styles.memberOpener}
            accessibilityRole="button"
            accessibilityLabel={`${member.name}, ${member.role === 'OWNER' ? 'organiza o clube' : 'membro'}`}
          >
            <Avatar name={member.name} seed={member.id} size={40} />
            <View style={styles.flex}>
              <Text variant="titleSmall">
                {member.id === user?.id ? `${member.name} (você)` : member.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                {member.role === 'OWNER' ? 'Organiza o clube' : `@${member.username}`}
              </Text>
            </View>
          </Pressable>
          {isOwner && member.role !== 'OWNER' ? (
            <IconButton
              icon="account-remove-outline"
              size={20}
              onPress={() =>
                setPending({ kind: 'removeMember', userId: member.id, name: member.name })
              }
              accessibilityLabel={`Remover ${member.name}`}
            />
          ) : null}
        </View>
      ))}

      <Button
        mode="outlined"
        icon={isOwner ? 'trash-can-outline' : 'exit-to-app'}
        textColor={theme.appColors.danger}
        style={[styles.danger, { borderColor: theme.appColors.danger }]}
        onPress={() => setPending({ kind: isOwner ? 'delete' : 'leave' })}
      >
        {isOwner ? 'Excluir clube' : 'Sair do clube'}
      </Button>

      <ConfirmDialog
        visible={pending !== null}
        title={pending ? CONFIRM_COPY[pending.kind].title : ''}
        message={pending ? describePending(pending) : ''}
        confirmLabel={pending ? CONFIRM_COPY[pending.kind].confirm : ''}
        destructive
        isProcessing={isProcessing}
        onDismiss={() => setPending(null)}
        onConfirm={confirmPending}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  currentBook: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  invite: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  code: { letterSpacing: 4 },
  goal: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  contribution: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberOpener: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  danger: { marginTop: spacing.xxl },
});
