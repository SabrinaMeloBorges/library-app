import { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Switch, Text } from 'react-native-paper';
import { BookCover } from '../components/BookCover';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { OptionChips } from '../components/OptionChips';
import { RatingInput } from '../components/RatingInput';
import { ReadingProgress } from '../components/ReadingProgress';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { SessionListItem } from '../components/SessionListItem';
import { ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useLibraryItem } from '../hooks/useLibraryItem';
import type { RootStackScreenProps } from '../navigation/types';
import type { ReadingSession } from '../types/api';
import { formatDate } from '../utils/dates';
import { STATUS_OPTIONS } from '../utils/labels';
import { spacing } from '../theme/spacing';

type PendingDeletion = { kind: 'book' } | { kind: 'session'; session: ReadingSession };

export const BookDetailsScreen = ({ navigation, route }: RootStackScreenProps<'BookDetails'>) => {
  const { bookId } = route.params;
  const theme = useAppTheme();
  const details = useLibraryItem(bookId);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const item = details.data?.item;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: item?.book.title ?? 'Detalhes',
      headerRight: item
        ? () => (
            <IconButton
              icon="pencil-outline"
              onPress={() => navigation.navigate('BookForm', { bookId })}
              accessibilityLabel="Editar livro"
            />
          )
        : undefined,
    });
  }, [navigation, item, bookId]);

  if (!details.isValidId) {
    return (
      <ScreenContainer>
        <ErrorState title="Livro inválido" message="O identificador informado não é válido." />
        <Button onPress={() => navigation.goBack()}>Voltar</Button>
      </ScreenContainer>
    );
  }
  if (details.isLoading) return <LoadingState message="Abrindo livro..." />;
  if (details.error || !details.data || !item) {
    return (
      <ScreenContainer>
        <ErrorState message={details.error ?? 'Livro não encontrado.'} onRetry={details.reload} />
        <Button onPress={() => navigation.goBack()}>Voltar</Button>
      </ScreenContainer>
    );
  }

  const { sessions } = details.data;

  const confirmDeletion = async () => {
    if (!pendingDeletion) return;
    if (pendingDeletion.kind === 'book') {
      const removed = await details.removeBook();
      setPendingDeletion(null);
      if (removed) navigation.goBack();
      return;
    }
    await details.removeSession(pendingDeletion.session.id);
    setPendingDeletion(null);
  };

  return (
    <ScreenContainer refreshing={details.isRefreshing} onRefresh={details.refresh}>
      {details.mutationError ? (
        <FeedbackBanner type="error" message={details.mutationError} />
      ) : null}

      <View style={styles.hero}>
        <BookCover uri={item.book.coverUrl} title={item.book.title} width={110} />
        <View style={styles.heroText}>
          <Text variant="headlineSmall">{item.book.title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
            {item.book.authors}
          </Text>
          {item.book.publisher ? (
            <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
              {item.book.publisher}
            </Text>
          ) : null}
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            {item.totalPages} páginas
          </Text>
        </View>
      </View>

      <ReadingProgress
        percentage={item.progress}
        label={`Página ${item.currentPage} de ${item.totalPages}`}
      />
      <Button
        mode="contained"
        icon="book-clock-outline"
        onPress={() => navigation.navigate('SessionForm', { userBookId: item.id })}
        style={styles.primaryAction}
        disabled={details.isMutating}
      >
        Registrar sessão de leitura
      </Button>

      <SectionHeader title="Status" />
      <OptionChips
        options={STATUS_OPTIONS}
        selected={item.status}
        onSelect={(status) => {
          if (status !== item.status) void details.update({ status });
        }}
        accessibilityLabel="Status de leitura"
      />

      <View style={[styles.preferenceRow, { borderColor: theme.appColors.border }]}>
        <Text variant="bodyLarge">Favorito</Text>
        <Switch
          value={item.isFavorite}
          disabled={details.isMutating}
          onValueChange={(isFavorite) => void details.update({ isFavorite })}
          accessibilityLabel="Marcar como favorito"
        />
      </View>

      <SectionHeader title="Avaliação" />
      <RatingInput
        value={item.rating}
        disabled={details.isMutating}
        onChange={(rating) => void details.update({ rating })}
      />

      <View style={styles.dates}>
        {item.startedAt ? (
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            Iniciado em {formatDate(item.startedAt)}
          </Text>
        ) : null}
        {item.finishedAt ? (
          <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
            Concluído em {formatDate(item.finishedAt)}
          </Text>
        ) : null}
      </View>

      <SectionHeader title="Histórico de sessões" subtitle={`${sessions.length} registradas`} />
      {sessions.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
          Nenhuma sessão registrada para este livro ainda.
        </Text>
      ) : (
        sessions.map((session) => (
          <SessionListItem
            key={session.id}
            session={session}
            disabled={details.isMutating}
            onEdit={(selected) =>
              navigation.navigate('SessionForm', { userBookId: item.id, sessionId: selected.id })
            }
            onDelete={(selected) => setPendingDeletion({ kind: 'session', session: selected })}
          />
        ))
      )}

      <Button
        mode="outlined"
        icon="trash-can-outline"
        textColor={theme.appColors.danger}
        style={[styles.deleteButton, { borderColor: theme.appColors.danger }]}
        onPress={() => setPendingDeletion({ kind: 'book' })}
        disabled={details.isMutating}
      >
        Remover da biblioteca
      </Button>

      <ConfirmDialog
        visible={pendingDeletion !== null}
        title={pendingDeletion?.kind === 'book' ? 'Remover livro' : 'Excluir sessão'}
        message={
          pendingDeletion?.kind === 'book'
            ? 'O livro e todas as sessões registradas para ele serão removidos. Esta ação não pode ser desfeita.'
            : 'A sessão será excluída e o progresso do livro será recalculado.'
        }
        confirmLabel={pendingDeletion?.kind === 'book' ? 'Remover' : 'Excluir'}
        destructive
        isProcessing={details.isMutating}
        onDismiss={() => setPendingDeletion(null)}
        onConfirm={confirmDeletion}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  heroText: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
  primaryAction: { marginTop: spacing.lg },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dates: { marginTop: spacing.sm, gap: 2 },
  deleteButton: { marginTop: spacing.xxl },
});
