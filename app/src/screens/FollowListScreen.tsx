import { useCallback, useLayoutEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { PersonRow } from '../components/PersonRow';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useFollowToggle } from '../hooks/useFollowToggle';
import type { RootStackScreenProps } from '../navigation/types';
import { socialService } from '../services/socialService';
import type { UserWithRelationship } from '../types/social';
import { spacing } from '../theme/spacing';

const keyExtractor = (person: UserWithRelationship): string => person.id;

export const FollowListScreen = ({ navigation, route }: RootStackScreenProps<'FollowList'>) => {
  const { userId, mode } = route.params;
  const theme = useAppTheme();
  const loader = useCallback(
    () =>
      mode === 'followers' ? socialService.followers(userId) : socialService.following(userId),
    [userId, mode],
  );
  const people = useAsyncResource(loader);
  const follow = useFollowToggle();

  useLayoutEffect(() => {
    navigation.setOptions({ title: mode === 'followers' ? 'Seguidores' : 'Seguindo' });
  }, [navigation, mode]);

  const renderEmpty = () => {
    if (people.isLoading) return <LoadingState />;
    if (people.error) return <ErrorState message={people.error} onRetry={people.reload} />;
    return (
      <EmptyState
        icon="account-multiple-outline"
        title={mode === 'followers' ? 'Ainda sem seguidores' : 'Ainda não segue ninguém'}
        description="Conexões aparecem aqui assim que alguém seguir ou for seguido."
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        data={people.error ? [] : follow.apply(people.data ?? [])}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          follow.error ? <FeedbackBanner type="error" message={follow.error} /> : null
        }
        renderItem={({ item }) => (
          <PersonRow
            person={item}
            onOpen={(id) => navigation.push('UserProfile', { userId: id })}
            onToggleFollow={follow.toggle}
            isBusy={follow.busyId === item.id}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, flexGrow: 1 },
});
