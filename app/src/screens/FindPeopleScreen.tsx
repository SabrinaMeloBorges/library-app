import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { PersonRow } from '../components/PersonRow';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useFollowToggle } from '../hooks/useFollowToggle';
import type { RootStackScreenProps } from '../navigation/types';
import { socialService } from '../services/socialService';
import type { UserWithRelationship } from '../types/social';
import { spacing } from '../theme/spacing';

const MIN_QUERY_LENGTH = 2;
const keyExtractor = (person: UserWithRelationship): string => person.id;

export const FindPeopleScreen = ({ navigation }: RootStackScreenProps<'FindPeople'>) => {
  const theme = useAppTheme();
  const [query, setQuery] = useState('');
  const term = useDebouncedValue(query.trim(), 400);
  const enabled = term.length >= MIN_QUERY_LENGTH;
  const loader = useCallback(() => socialService.search(term), [term]);
  const results = useAsyncResource(loader, { enabled, refetchOnFocus: true });
  const follow = useFollowToggle();

  const renderEmpty = () => {
    if (!enabled) {
      return (
        <EmptyState
          icon="account-search-outline"
          title="Encontre leitores"
          description="Busque amigos pelo nome ou nome de usuário. Quando vocês se seguem, podem conversar e montar clubes do livro."
        />
      );
    }
    if (results.isLoading) return <LoadingState message="Buscando pessoas..." />;
    if (results.error) return <ErrorState message={results.error} onRetry={results.reload} />;
    return (
      <EmptyState
        icon="account-question-outline"
        title="Ninguém encontrado"
        description="Confira a grafia ou tente pelo nome de usuário."
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <View style={styles.header}>
        <Searchbar
          placeholder="Nome ou @usuário"
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="none"
          accessibilityLabel="Pesquisar pessoas"
          style={[
            styles.search,
            { backgroundColor: theme.appColors.surface, borderColor: theme.appColors.border },
          ]}
        />
        {follow.error ? <FeedbackBanner type="error" message={follow.error} /> : null}
      </View>
      <FlatList
        data={enabled && !results.error ? follow.apply(results.data ?? []) : []}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => (
          <PersonRow
            person={item}
            onOpen={(userId) => navigation.navigate('UserProfile', { userId })}
            onToggleFollow={follow.toggle}
            isBusy={follow.busyId === item.id}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  search: { borderWidth: 1, elevation: 0 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
});
