import { useCallback, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAsyncResource } from '../hooks/useAsyncResource';
import { useAuth } from '../hooks/useAuth';
import type { RootStackScreenProps } from '../navigation/types';
import { getErrorMessage } from '../services/apiError';
import { feedService } from '../services/feedService';
import type { ActivityComment } from '../types/social';
import { formatRelative } from '../utils/dates';
import { spacing } from '../theme/spacing';

const MAX_LENGTH = 500;
const keyExtractor = (comment: ActivityComment): string => comment.id;

export const ActivityCommentsScreen = ({
  navigation,
  route,
}: RootStackScreenProps<'ActivityComments'>) => {
  const { activityId } = route.params;
  const theme = useAppTheme();
  const { user } = useAuth();
  const loader = useCallback(() => feedService.comments(activityId), [activityId]);
  const comments = useAsyncResource(loader);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setIsSending(true);
    setError(null);
    try {
      await action();
      await comments.refetch();
      return true;
    } catch (caught) {
      setError(getErrorMessage(caught));
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    if (await run(() => feedService.addComment(activityId, body))) setDraft('');
  };

  const renderEmpty = () => {
    if (comments.isLoading) return <LoadingState />;
    if (comments.error) return <ErrorState message={comments.error} onRetry={comments.reload} />;
    return (
      <EmptyState
        icon="comment-outline"
        title="Sem comentários"
        description="Seja a primeira pessoa a comentar."
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.appColors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={comments.error ? [] : (comments.data ?? [])}
          keyExtractor={keyExtractor}
          ListHeaderComponent={error ? <FeedbackBanner type="error" message={error} /> : null}
          renderItem={({ item }) => (
            <View style={[styles.comment, { borderBottomColor: theme.appColors.border }]}>
              <Pressable
                onPress={() => navigation.navigate('UserProfile', { userId: item.user.id })}
                accessibilityRole="button"
                accessibilityLabel={`Ver perfil de ${item.user.name}`}
              >
                <Avatar name={item.user.name} seed={item.user.id} size={36} />
              </Pressable>
              <View style={styles.flex}>
                <Text variant="titleSmall">
                  {item.user.name}{' '}
                  <Text variant="bodySmall" style={{ color: theme.appColors.textMuted }}>
                    {formatRelative(item.createdAt)}
                  </Text>
                </Text>
                <Text variant="bodyMedium">{item.body}</Text>
              </View>
              {item.user.id === user?.id ? (
                <IconButton
                  icon="trash-can-outline"
                  size={18}
                  disabled={isSending}
                  onPress={() => void run(() => feedService.deleteComment(activityId, item.id))}
                  accessibilityLabel="Excluir comentário"
                />
              ) : null}
            </View>
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.list}
        />
        <View
          style={[
            styles.composer,
            { borderTopColor: theme.appColors.border, backgroundColor: theme.appColors.surface },
          ]}
        >
          <TextInput
            mode="outlined"
            value={draft}
            onChangeText={setDraft}
            placeholder="Escreva um comentário"
            accessibilityLabel="Comentário"
            maxLength={MAX_LENGTH}
            multiline
            dense
            style={styles.input}
          />
          <IconButton
            icon="send"
            mode="contained"
            containerColor={theme.appColors.primary}
            iconColor={theme.appColors.onPrimary}
            disabled={!draft.trim() || isSending}
            onPress={send}
            accessibilityLabel="Enviar comentário"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.lg, flexGrow: 1 },
  comment: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, maxHeight: 120, backgroundColor: 'transparent' },
});
