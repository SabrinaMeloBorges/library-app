import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { FeedItemCard } from '../../components/FeedItemCard';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { useActivityList } from '../../hooks/useActivityList';
import { useAppTheme } from '../../hooks/useAppTheme';
import { feedService } from '../../services/feedService';
import type { FeedActivity } from '../../types/social';
import { spacing } from '../../theme/spacing';

interface FeedTabProps {
  onOpenUser: (userId: string) => void;
  onOpenComments: (activityId: string) => void;
  onFindPeople: () => void;
}

const keyExtractor = (activity: FeedActivity): string => activity.id;

export const FeedTab = ({ onOpenUser, onOpenComments, onFindPeople }: FeedTabProps) => {
  const theme = useAppTheme();
  const loadPage = useCallback((before?: string) => feedService.feed(before), []);
  const feed = useActivityList(loadPage);

  const renderEmpty = () => {
    if (feed.isLoading) return <LoadingState message="Carregando novidades..." />;
    if (feed.error) return <ErrorState message={feed.error} onRetry={feed.reload} />;
    return (
      <EmptyState
        icon="account-group-outline"
        title="Seu feed está silencioso"
        description="Siga outros leitores para ver resenhas, livros concluídos, metas batidas e conquistas por aqui."
        action={
          <Button mode="contained" icon="account-search-outline" onPress={onFindPeople}>
            Encontrar pessoas
          </Button>
        }
      />
    );
  };

  return (
    <FlatList
      data={feed.error ? [] : feed.items}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => (
        <FeedItemCard
          activity={item}
          onOpenUser={onOpenUser}
          onOpenComments={onOpenComments}
          onToggleLike={feed.toggleLike}
        />
      )}
      ListHeaderComponent={
        feed.actionError ? <FeedbackBanner type="error" message={feed.actionError} /> : null
      }
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={
        feed.isLoadingMore ? <ActivityIndicator color={theme.appColors.primary} /> : null
      }
      onEndReached={() => void feed.loadMore()}
      onEndReachedThreshold={0.4}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={feed.isRefreshing}
          onRefresh={() => void feed.refresh()}
          tintColor={theme.appColors.primary}
          colors={[theme.appColors.primary]}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, flexGrow: 1 },
});
