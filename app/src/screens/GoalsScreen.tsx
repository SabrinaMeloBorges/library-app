import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, FAB } from 'react-native-paper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { GoalCard } from '../components/GoalCard';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useReadingGoals } from '../hooks/useReadingGoals';
import type { MainTabScreenProps } from '../navigation/types';
import type { ReadingGoal } from '../types/api';
import { spacing } from '../theme/spacing';

const MAX_CONTENT_WIDTH = 640;

const keyExtractor = (goal: ReadingGoal): string => goal.id;

export const GoalsScreen = ({ navigation }: MainTabScreenProps<'Goals'>) => {
  const theme = useAppTheme();
  const {
    goals,
    isLoading,
    isRefreshing,
    error,
    reload,
    refresh,
    removeGoal,
    deletingId,
    actionError,
  } = useReadingGoals();
  const [goalToDelete, setGoalToDelete] = useState<ReadingGoal | null>(null);

  const openForm = (goalId?: string) =>
    navigation.navigate('GoalForm', goalId ? { goalId } : undefined);

  const renderEmpty = () => {
    if (isLoading) return <LoadingState message="Carregando metas..." />;
    if (error) return <ErrorState message={error} onRetry={reload} />;
    return (
      <EmptyState
        icon="flag-outline"
        title="Nenhuma meta ainda"
        description="Defina metas de livros, páginas, minutos ou dias de leitura. O progresso é calculado a partir das suas sessões e livros concluídos."
        action={
          <Button mode="contained" icon="plus" onPress={() => openForm()}>
            Criar meta
          </Button>
        }
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['left', 'right']}
    >
      <FlatList
        data={error ? [] : goals}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onEdit={openForm}
            onDelete={setGoalToDelete}
            isDeleting={deletingId === item.id}
          />
        )}
        ListHeaderComponent={
          actionError ? <FeedbackBanner type="error" message={actionError} /> : null
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.appColors.primary}
            colors={[theme.appColors.primary]}
          />
        }
      />
      <View pointerEvents="box-none" style={styles.fabContainer}>
        <FAB
          icon="plus"
          label="Meta"
          onPress={() => openForm()}
          style={{ backgroundColor: theme.appColors.primary }}
          color={theme.appColors.onPrimary}
          accessibilityLabel="Criar meta"
        />
      </View>
      <ConfirmDialog
        visible={goalToDelete !== null}
        title="Excluir meta"
        message={`A meta "${goalToDelete?.title ?? ''}" será removida. Suas sessões e livros não serão afetados.`}
        confirmLabel="Excluir"
        destructive
        isProcessing={deletingId !== null}
        onDismiss={() => setGoalToDelete(null)}
        onConfirm={async () => {
          if (goalToDelete) await removeGoal(goalToDelete.id);
          setGoalToDelete(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: 96,
    flexGrow: 1,
  },
  fabContainer: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
});
