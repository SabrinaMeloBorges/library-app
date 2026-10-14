import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Button, FAB, Text } from 'react-native-paper';
import { BookListItem } from '../components/BookListItem';
import { ReadingProgress } from '../components/ReadingProgress';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { StatGrid, StatTile } from '../components/StatTile';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { useStatistics } from '../hooks/useStatistics';
import type { MainTabScreenProps } from '../navigation/types';
import type { RecentActivity, StatisticsOverview } from '../types/api';
import { formatDateTime, formatMinutes, greetingFor } from '../utils/dates';
import { spacing } from '../theme/spacing';

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
  const { data, error, isLoading, isRefreshing, reload, refresh } = useStatistics();
  const openBook = (bookId: string) => navigation.navigate('BookDetails', { bookId });
  const addBook = () => navigation.navigate('CatalogSearch');

  const renderContent = () => {
    if (isLoading) return <LoadingState message="Preparando sua estante..." />;
    if (error || !data) return <ErrorState message={error ?? 'Sem dados.'} onRetry={reload} />;
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
        <StatGrid>
          <StatTile label="Lendo agora" value={String(data.readingNowCount)} />
          <StatTile
            label={`Concluídos em ${data.year}`}
            value={String(data.thisYear.booksFinished)}
          />
          <StatTile
            label={`Páginas lidas em ${data.year}`}
            value={String(data.thisYear.pagesRead)}
          />
          <StatTile
            label="Tempo de leitura no ano"
            value={formatMinutes(data.thisYear.minutesRead)}
          />
        </StatGrid>

        <SectionHeader
          title="Meta anual"
          action={
            <Button compact onPress={() => navigation.navigate('Main', { screen: 'Goals' })}>
              Metas
            </Button>
          }
        />
        {data.annualGoal ? (
          <View style={[styles.goalBox, { borderColor: theme.appColors.border }]}>
            <Text variant="titleMedium">{data.annualGoal.title}</Text>
            <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
              {data.annualGoal.currentValue} de {data.annualGoal.targetValue}
            </Text>
            <ReadingProgress percentage={data.annualGoal.percentage} label="Progresso da meta" />
          </View>
        ) : (
          <Button
            mode="outlined"
            icon="flag-outline"
            onPress={() => navigation.navigate('GoalForm')}
            style={styles.inlineAction}
          >
            Definir uma meta anual
          </Button>
        )}

        <SectionHeader title="Continue lendo" />
        {data.continueReading.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
            Nenhum livro em andamento. Marque um livro como “Lendo” para vê-lo aqui.
          </Text>
        ) : (
          data.continueReading.map((item) => (
            <BookListItem key={item.id} item={item} onPress={openBook} />
          ))
        )}

        <SectionHeader title="Atividade recente" />
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
              <View style={styles.activityText}>
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
    <View style={styles.flex}>
      <ScreenContainer refreshing={isRefreshing} onRefresh={refresh}>
        <Text variant="headlineMedium" accessibilityRole="header">
          {greetingFor()}, {user ? firstName(user.name) : 'leitor'}
        </Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.appColors.textMuted }]}>
          Um resumo das suas leituras.
        </Text>
        {renderContent()}
      </ScreenContainer>
      <FAB
        icon="plus"
        label="Livro"
        onPress={addBook}
        style={[styles.fab, { backgroundColor: theme.appColors.primary }]}
        color={theme.appColors.onPrimary}
        accessibilityLabel="Adicionar livro"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  subtitle: { marginBottom: spacing.lg },
  goalBox: { borderWidth: 1, borderRadius: 10, padding: spacing.lg, gap: spacing.xs },
  inlineAction: { marginTop: spacing.md, alignSelf: 'flex-start' },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  activityText: { flex: 1 },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});
