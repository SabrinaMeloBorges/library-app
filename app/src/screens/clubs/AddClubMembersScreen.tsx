import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { FeedbackBanner } from '../../components/FeedbackBanner';
import { PillButton } from '../../components/PillButton';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { useActionFeedback } from '../../hooks/useActionFeedback';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import type { RootStackScreenProps } from '../../navigation/types';
import { getErrorMessage } from '../../services/apiError';
import { clubService } from '../../services/clubService';
import { socialService } from '../../services/socialService';
import type { UserSummary } from '../../types/social';
import { spacing } from '../../theme/spacing';

const keyExtractor = (friend: UserSummary): string => friend.id;

export const AddClubMembersScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'AddClubMembers'>) => {
  const { clubId } = route.params;
  const theme = useAppTheme();
  const { notifySuccess } = useActionFeedback();
  const loader = useCallback(async () => {
    const [friends, club] = await Promise.all([socialService.friends(), clubService.get(clubId)]);
    const memberIds = new Set(club.members.map((member) => member.id));
    return friends.filter((friend) => !memberIds.has(friend.id));
  }, [clubId]);
  const candidates = useAsyncResource(loader);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = async (friend: UserSummary) => {
    setBusyId(friend.id);
    setError(null);
    try {
      await clubService.addMember(clubId, friend.id);
      notifySuccess(`${friend.name} entrou no clube.`);
      await candidates.refetch();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  };

  const renderEmpty = () => {
    if (candidates.isLoading) return <LoadingState />;
    if (candidates.error)
      return <ErrorState message={candidates.error} onRetry={candidates.reload} />;
    return (
      <EmptyState
        icon="account-heart-outline"
        title="Nenhum amigo disponível"
        description="Só é possível adicionar amigos (pessoas que seguem você de volta). Compartilhe o código de convite com os demais."
        action={
          <PillButton
            icon="account-search-outline"
            onPress={() => navigation.navigate('FindPeople')}
          >
            Encontrar pessoas
          </PillButton>
        }
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <FlatList
        data={candidates.error ? [] : (candidates.data ?? [])}
        keyExtractor={keyExtractor}
        ListHeaderComponent={error ? <FeedbackBanner type="error" message={error} /> : null}
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: theme.appColors.border }]}>
            <Avatar name={item.name} seed={item.id} size={44} />
            <View style={styles.flex}>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                @{item.username}
              </Text>
            </View>
            <PillButton
              variant="contained"
              icon="plus"
              onPress={() => void add(item)}
              loading={busyId === item.id}
              disabled={busyId !== null}
              accessibilityLabel={`Adicionar ${item.name} ao clube`}
            >
              Adicionar
            </PillButton>
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
