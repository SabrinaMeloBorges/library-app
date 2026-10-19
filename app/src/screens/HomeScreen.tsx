import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, FAB, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookStackIllustration } from '../components/BookStackIllustration';
import { CurrentlyReadingCarousel } from '../components/CurrentlyReadingCarousel';
import { FeedItemCard } from '../components/FeedItemCard';
import { GenreShortcuts } from '../components/GenreShortcuts';
import { PillButton } from '../components/PillButton';
import { ReadingProgress } from '../components/ReadingProgress';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { StatGrid, StatTile } from '../components/StatTile';
import { useActivityList } from '../hooks/useActivityList';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { useStatistics } from '../hooks/useStatistics';
import type { MainTabScreenProps } from '../navigation/types';
import { feedService } from '../services/feedService';
import type { RecentActivity, StatisticsOverview } from '../types/api';
import { formatDateTime, formatMinutes, greetingFor } from '../utils/dates';
import { radius, spacing } from '../theme/spacing';

const FEED_PREVIEW_SIZE = 3;

const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

const describeActivity = (activity: RecentActivity): string =>
  activity.type === 'SESSION'
    ? `${activity.pagesRead} páginas em ${formatMinutes(activity.durationMinutes)}`
    : 'Leitura concluída';

const isNewReader = (overview: StatisticsOverview): boolean =>
  overview.totalBooks === 0 && overview.goals.total === 0;

export const HomeScreen = ({ navigation }: MainTabScreenProps<'Home'>) => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const statistics = useStatistics();
  const loadFeed = useCallback((before?: string) => feedService.feed(before), []);
  const feed = useActivityList(loadFeed);
  const { data } = statistics;

  const openBook = (bookId: string) => navigation.navigate('BookDetails', { bookId });
  const addBook = () => navigation.navigate('CatalogSearch');
  const refreshAll = () => {
    void statistics.refresh();
    void feed.refresh();
  };

  const renderOverview = () => {
    if (statistics.isLoading) return <LoadingState message="Preparando sua estante..." />;
    if (statistics.error || !data) {
      return <ErrorState message={statistics.error ?? 'Sem dados.'} onRetry={statistics.reload} />;
    }
    if (isNewReader(data)) {
      return (
        <EmptyState
          icon="bookshelf"
          title="Sua estante está à espera"
          description="Comece adicionando um livro que você está lendo ou quer ler. Depois registre sessões de leitura e crie uma meta para acompanhar seu progresso."
          action={
            <Button mode="contained" icon="plus" onPress={addBook}>
              Adicionar primeiro livro
            </Button>
          }
        />
      );
    }

    return (
      <>
        <SectionHeader
          title="Lendo agora"
          action={
            <Button
              compact
              onPress={() =>
                navigation.navigate('Main', { screen: 'Library', params: { status: 'READING' } })
              }
            >
              Ver todos
            </Button>
          }
        />
        {data.continueReading.length > 0 ? (
          <CurrentlyReadingCarousel
            items={data.continueReading}
            onOpen={openBook}
            onUpdate={(bookId) => navigation.navigate('SessionForm', { userBookId: bookId })}
          />
        ) : (
          <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
            Nenhum livro em andamento. Marque um livro como “Lendo” para vê-lo aqui.
          </Text>
        )}

        <SectionHeader title="O que ler a seguir?" />
        <GenreShortcuts
          onSelect={(genre) =>
            navigation.navigate('CatalogSearch', {
              subject: genre.subject,
              subjectLabel: genre.label,
            })
          }
        />

        <SectionHeader title={`Seu ${data.year}`} />
        <StatGrid>
          <StatTile label="Lendo agora" value={String(data.readingNowCount)} />
          <StatTile label="Concluídos no ano" value={String(data.thisYear.booksFinished)} />
          <StatTile label="Páginas lidas no ano" value={String(data.thisYear.pagesRead)} />
          <StatTile label="Tempo de leitura" value={formatMinutes(data.thisYear.minutesRead)} />
        </StatGrid>

        <SectionHeader title={`Desafio de ${data.year}`} />
        <View style={[styles.challenge, { backgroundColor: theme.appColors.accentSoft }]}>
          <View style={styles.challengeText}>
            {data.annualGoal ? (
              <>
                <Text variant="titleMedium">{data.annualGoal.title}</Text>
                <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                  {data.annualGoal.currentValue} de {data.annualGoal.targetValue}
                </Text>
                <ReadingProgress
                  percentage={data.annualGoal.percentage}
                  label="Progresso da meta"
                />
                <Button
                  compact
                  style={styles.challengeAction}
                  onPress={() => navigation.navigate('GoalForm', { goalId: data.annualGoal?.id })}
                >
                  Editar meta
                </Button>
              </>
            ) : (
              <>
                <Text variant="titleMedium">Defina sua meta anual</Text>
                <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                  Quantos livros você quer ler este ano?
                </Text>
                <PillButton
                  icon="flag-outline"
                  style={styles.challengeAction}
                  onPress={() => navigation.navigate('GoalForm')}
                >
                  Criar desafio
                </PillButton>
              </>
            )}
          </View>
          <BookStackIllustration books={5} width={64} seed={2} />
        </View>

        <SectionHeader
          title="Novidades dos amigos"
          action={
            <Button compact onPress={() => navigation.navigate('Main', { screen: 'Community' })}>
              Ver feed
            </Button>
          }
        />
        {feed.items.filter((activity) => activity.user.id !== user?.id).length === 0 ? (
          <View style={[styles.invite, { borderColor: theme.appColors.border }]}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={28}
              color={theme.appColors.accent}
            />
            <Text variant="bodyMedium" style={styles.flex}>
              Siga outros leitores para acompanhar resenhas, livros concluídos e conquistas.
            </Text>
            <PillButton onPress={() => navigation.navigate('FindPeople')}>Encontrar</PillButton>
          </View>
        ) : (
          feed.items
            .filter((activity) => activity.user.id !== user?.id)
            .slice(0, FEED_PREVIEW_SIZE)
            .map((activity) => (
              <FeedItemCard
                key={activity.id}
                activity={activity}
                onOpenUser={(userId) => navigation.navigate('UserProfile', { userId })}
                onOpenComments={(activityId) =>
                  navigation.navigate('ActivityComments', { activityId })
                }
                onToggleLike={feed.toggleLike}
              />
            ))
        )}

        <SectionHeader title="Sua atividade recente" />
        {data.recentActivity.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
            Registre uma sessão de leitura para acompanhar sua atividade.
          </Text>
        ) : (
          data.recentActivity.map((activity) => (
            <View
              key={activity.id}
              style={[styles.activity, { borderBottomColor: theme.appColors.border }]}
            >
              <MaterialCommunityIcons
                name={activity.type === 'SESSION' ? 'book-clock-outline' : 'check-decagram-outline'}
                size={20}
                color={theme.appColors.accent}
              />
              <View style={styles.flex}>
                <Text
                  variant="bodyMedium"
                  numberOfLines={1}
                  onPress={() => openBook(activity.userBookId)}
                >
                  {activity.bookTitle}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                  {describeActivity(activity)} · {formatDateTime(activity.occurredAt)}
                </Text>
              </View>
            </View>
          ))
        )}

        <Button
          mode="text"
          icon="chart-box-outline"
          onPress={() => navigation.navigate('Statistics')}
          style={styles.inlineAction}
        >
          Ver estatísticas completas
        </Button>
      </>
    );
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScreenContainer refreshing={statistics.isRefreshing} onRefresh={refreshAll}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text variant="headlineMedium" accessibilityRole="header">
              {greetingFor()}, {user ? firstName(user.name) : 'leitor'}!
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
              Um resumo das suas leituras.
            </Text>
          </View>
          <IconButton
            icon="account-search-outline"
            onPress={() => navigation.navigate('FindPeople')}
            accessibilityLabel="Encontrar pessoas"
          />
          <IconButton
            icon="cog-outline"
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Configurações"
          />
        </View>
        {renderOverview()}
      </ScreenContainer>
      <FAB
        icon="plus"
        label="Livro"
        onPress={addBook}
        style={[styles.fab, { backgroundColor: theme.appColors.primary }]}
        color={theme.appColors.onPrimary}
        accessibilityLabel="Adicionar livro"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  challenge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  challengeText: { flex: 1, gap: spacing.xs },
  challengeAction: { alignSelf: 'flex-start', marginTop: spacing.xs },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inlineAction: { marginTop: spacing.md, alignSelf: 'flex-start' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});
