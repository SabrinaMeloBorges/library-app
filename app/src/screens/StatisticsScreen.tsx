import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ReadingProgress } from '../components/ReadingProgress';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { StatGrid, StatTile } from '../components/StatTile';
import { useAppTheme } from '../hooks/useAppTheme';
import { useReadingGoals } from '../hooks/useReadingGoals';
import { useStatistics } from '../hooks/useStatistics';
import type { ReadingStatus } from '../types/api';
import { formatMinutes } from '../utils/dates';
import { STATUS_OPTIONS } from '../utils/labels';
import { spacing } from '../theme/spacing';

const StatusDistribution = ({
  distribution,
  total,
}: {
  distribution: Record<ReadingStatus, number>;
  total: number;
}) => {
  const theme = useAppTheme();
  return (
    <View style={styles.distribution}>
      {STATUS_OPTIONS.map((option) => {
        const count = distribution[option.value];
        const share = total > 0 ? count / total : 0;
        return (
          <View
            key={option.value}
            style={styles.distributionRow}
            accessible
            accessibilityLabel={`${option.label}: ${count}`}
          >
            <Text variant="bodyMedium" style={styles.distributionLabel}>
              {option.label}
            </Text>
            <View style={[styles.barTrack, { backgroundColor: theme.appColors.surfaceMuted }]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.round(share * 100)}%`, backgroundColor: theme.appColors.accent },
                ]}
              />
            </View>
            <Text variant="labelLarge" style={styles.distributionCount}>
              {count}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export const StatisticsScreen = () => {
  const theme = useAppTheme();
  const statistics = useStatistics();
  const goals = useReadingGoals();

  if (statistics.isLoading) return <LoadingState message="Calculando estatísticas..." />;
  if (statistics.error || !statistics.data) {
    return (
      <ScreenContainer>
        <ErrorState message={statistics.error ?? 'Sem dados.'} onRetry={statistics.reload} />
      </ScreenContainer>
    );
  }

  const data = statistics.data;
  const activeGoals = goals.goals.filter(
    (goal) => goal.state === 'ACTIVE' || goal.state === 'COMPLETED',
  );

  if (data.totalBooks === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="chart-box-outline"
          title="Ainda sem estatísticas"
          description="Adicione livros e registre sessões de leitura para ver seus indicadores aqui."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer refreshing={statistics.isRefreshing} onRefresh={statistics.refresh}>
      <SectionHeader title={`Em ${data.year}`} />
      <StatGrid>
        <StatTile label="Livros concluídos" value={String(data.thisYear.booksFinished)} />
        <StatTile label="Páginas lidas" value={String(data.thisYear.pagesRead)} />
        <StatTile label="Tempo de leitura" value={formatMinutes(data.thisYear.minutesRead)} />
        <StatTile label="Dias com leitura" value={String(data.thisYear.readingDays)} />
      </StatGrid>

      <SectionHeader title="Desde o início" />
      <StatGrid>
        <StatTile label="Livros na biblioteca" value={String(data.totalBooks)} />
        <StatTile label="Livros concluídos" value={String(data.allTime.booksFinished)} />
        <StatTile label="Páginas lidas" value={String(data.allTime.pagesRead)} />
        <StatTile label="Tempo de leitura" value={formatMinutes(data.allTime.minutesRead)} />
      </StatGrid>
      <Text variant="bodySmall" style={[styles.note, { color: theme.appColors.textMuted }]}>
        Páginas e tempo são calculados a partir das sessões registradas. Páginas relidas contam uma
        vez.
      </Text>

      <SectionHeader title="Livros por status" />
      <StatusDistribution distribution={data.statusDistribution} total={data.totalBooks} />

      <SectionHeader
        title="Progresso das metas"
        subtitle={`${data.goals.completed} de ${data.goals.total} concluídas`}
      />
      {goals.isLoading ? <LoadingState /> : null}
      {goals.error ? <ErrorState message={goals.error} onRetry={goals.reload} /> : null}
      {!goals.isLoading && !goals.error && activeGoals.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: theme.appColors.textMuted }}>
          Nenhuma meta em andamento.
        </Text>
      ) : null}
      {activeGoals.map((goal) => (
        <View key={goal.id} style={styles.goalRow}>
          <ReadingProgress
            percentage={goal.percentage}
            label={`${goal.title} (${goal.currentValue}/${goal.targetValue})`}
          />
        </View>
      ))}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  note: { marginTop: spacing.sm },
  distribution: { gap: spacing.sm },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  distributionLabel: { width: 96 },
  distributionCount: { width: 28, textAlign: 'right' },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  goalRow: { marginBottom: spacing.md },
});
