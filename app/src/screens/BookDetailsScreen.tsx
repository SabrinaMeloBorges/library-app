import { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text } from 'react-native-paper';
import { BookCover } from '../components/BookCover';
import { BookStackIllustration } from '../components/BookStackIllustration';
import { PillButton } from '../components/PillButton';
import { RatingStars } from '../components/RatingStars';
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
import { useActionFeedback } from '../hooks/useActionFeedback';
import type { RootStackScreenProps } from '../navigation/types';
import type { LibraryItemUpdate, ReadingSession } from '../types/api';
import { formatDate } from '../utils/dates';
import { STATUS_OPTIONS } from '../utils/labels';
import { radius, spacing } from '../theme/spacing';

type PendingDeletion = { kind: 'book' } | { kind: 'session'; session: ReadingSession };

export const BookDetailsScreen = ({ navigation, route }: RootStackScreenProps<'BookDetails'>) => {
  const { bookId } = route.params;
  const theme = useAppTheme();
  const { notifySuccess } = useActionFeedback();
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

  const updateWithFeedback = async (changes: LibraryItemUpdate, message: string) => {
    if (await details.update(changes)) notifySuccess(message);
  };

  const confirmDeletion = async () => {
    if (!pendingDeletion) return;
    if (pendingDeletion.kind === 'book') {
      const removed = await details.removeBook();
      setPendingDeletion(null);
      if (removed) {
        notifySuccess('Livro removido da biblioteca.');
        navigation.goBack();
      }
      return;
    }
    const removed = await details.removeSession(pendingDeletion.session.id);
    setPendingDeletion(null);
    if (removed) notifySuccess('Sessão excluída. Progresso recalculado.');
  };

  return (
    <ScreenContainer refreshing={details.isRefreshing} onRefresh={details.refresh}>
      {details.mutationError ? (
        <FeedbackBanner type="error" message={details.mutationError} />
      ) : null}

      <View style={[styles.band, { backgroundColor: theme.appColors.hero }]}>
        <View style={styles.bandStacks}>
          <BookStackIllustration books={4} width={56} seed={1} />
          <BookStackIllustration books={3} width={50} seed={4} />
        </View>
      </View>
      <View style={styles.coverWrap}>
        <View style={[styles.coverFrame, { backgroundColor: theme.appColors.background }]}>
          <BookCover uri={item.book.coverUrl} title={item.book.title} width={136} />
        </View>
      </View>
      <View style={styles.heroText}>
        {item.book.subjects ? (
          <Text variant="labelMedium" style={[styles.center, { color: theme.appColors.textMuted }]}>
            {item.book.subjects.split(',').slice(0, 2).join(' | ')}
          </Text>
        ) : null}
        <Text variant="headlineMedium" style={styles.center}>
          {item.book.title}
        </Text>
        <Text variant="bodyLarge" style={[styles.center, { color: theme.appColors.textMuted }]}>
          por {item.book.authors}
        </Text>
        <Text variant="bodySmall" style={[styles.center, { color: theme.appColors.textMuted }]}>
          {[item.book.publisher, `${item.totalPages} páginas`].filter(Boolean).join(' · ')}
        </Text>
        {item.rating ? <RatingStars rating={item.rating} size={18} /> : null}
      </View>

      <View style={styles.pills}>
        <PillButton
          variant="soft"
          icon="book-clock-outline"
          onPress={() => navigation.navigate('SessionForm', { userBookId: item.id })}
          disabled={details.isMutating}
        >
          Registrar leitura
        </PillButton>
        <PillButton
          variant="soft"
          icon={item.isFavorite ? 'heart' : 'heart-outline'}
          onPress={() =>
            void updateWithFeedback(
              { isFavorite: !item.isFavorite },
              item.isFavorite ? 'Removido dos favoritos.' : 'Adicionado aos favoritos.',
            )
          }
          disabled={details.isMutating}
        >
          {item.isFavorite ? 'Favorito' : 'Favoritar'}
        </PillButton>
      </View>

      <ReadingProgress
        percentage={item.progress}
        label={`Página ${item.currentPage} de ${item.totalPages}`}
      />

      {item.book.description ? (
        <>
          <SectionHeader title="Sobre o livro" />
          <Text variant="bodyMedium" style={styles.description}>
            {item.book.description}
          </Text>
        </>
      ) : null}

      <SectionHeader title="Status" />
      <OptionChips
        options={STATUS_OPTIONS}
        selected={item.status}
        onSelect={(status) => {
          if (status !== item.status) void updateWithFeedback({ status }, 'Status atualizado.');
        }}
        accessibilityLabel="Status de leitura"
      />

      <SectionHeader title="Avaliação" />
      <RatingInput
        value={item.rating}
        disabled={details.isMutating}
        onChange={(rating) =>
          void updateWithFeedback({ rating }, rating ? 'Avaliação salva.' : 'Avaliação removida.')
        }
      />

      <SectionHeader
        title="Resenha"
        action={
          <Button
            compact
            icon="pencil-outline"
            onPress={() => navigation.navigate('BookForm', { bookId })}
            disabled={details.isMutating}
          >
            {item.review ? 'Editar' : 'Escrever'}
          </Button>
        }
      />
      <Text
        variant="bodyMedium"
        style={item.review ? styles.review : { color: theme.appColors.textMuted }}
      >
        {item.review ?? 'Você ainda não escreveu uma resenha para este livro.'}
      </Text>

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
  band: {
    height: 150,
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    borderBottomLeftRadius: radius.lg * 2,
    borderBottomRightRadius: radius.lg * 2,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  bandStacks: { flexDirection: 'row', justifyContent: 'space-between' },
  coverWrap: { alignItems: 'center', marginTop: -114 },
  coverFrame: {
    padding: 4,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  heroText: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  center: { textAlign: 'center' },
  pills: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  description: { lineHeight: 22 },
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
  review: { lineHeight: 22 },
  deleteButton: { marginTop: spacing.xxl },
});
