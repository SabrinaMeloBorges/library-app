import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Badge, Text } from 'react-native-paper';
import { Avatar } from '../../components/Avatar';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { useAuth } from '../../hooks/useAuth';
import { chatService } from '../../services/chatService';
import type { Conversation } from '../../types/social';
import { formatRelative } from '../../utils/dates';
import { radius, spacing } from '../../theme/spacing';

interface ConversationsTabProps {
  onOpenConversation: (conversationId: string, title: string) => void;
}

const keyExtractor = (conversation: Conversation): string => conversation.id;

export const conversationTitle = (conversation: Conversation, myId: string | undefined): string => {
  if (conversation.club) return conversation.club.name;
  const other = conversation.participants.find((participant) => participant.id !== myId);
  return other?.name ?? 'Conversa';
};

export const ConversationsTab = ({ onOpenConversation }: ConversationsTabProps) => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const loader = useCallback(() => chatService.list(), []);
  const conversations = useAsyncResource(loader);

  const renderEmpty = () => {
    if (conversations.isLoading) return <LoadingState message="Carregando conversas..." />;
    if (conversations.error)
      return <ErrorState message={conversations.error} onRetry={conversations.reload} />;
    return (
      <EmptyState
        icon="chat-outline"
        title="Nenhuma conversa ainda"
        description="Converse com amigos (pessoas que seguem você de volta) pelo perfil delas, ou use o chat do seu clube do livro."
      />
    );
  };

  return (
    <FlatList
      data={conversations.error ? [] : (conversations.data ?? [])}
      keyExtractor={keyExtractor}
      renderItem={({ item }) => {
        const title = conversationTitle(item, user?.id);
        const other = item.participants.find((participant) => participant.id !== user?.id);
        return (
          <Pressable
            onPress={() => onOpenConversation(item.id, title)}
            accessibilityRole="button"
            accessibilityLabel={`Conversa com ${title}${item.unreadCount ? `, ${item.unreadCount} não lidas` : ''}`}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: theme.appColors.border },
              pressed && { backgroundColor: theme.appColors.surfaceMuted },
            ]}
          >
            {item.club ? (
              <View style={[styles.clubIcon, { backgroundColor: theme.appColors.primary }]}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={22}
                  color={theme.appColors.onPrimary}
                />
              </View>
            ) : (
              <Avatar name={title} seed={other?.id ?? item.id} size={44} />
            )}
            <View style={styles.flex}>
              <View style={styles.titleRow}>
                <Text variant="titleMedium" numberOfLines={1} style={styles.flex}>
                  {title}
                </Text>
                {item.lastMessage ? (
                  <Text variant="labelSmall" style={{ color: theme.appColors.textMuted }}>
                    {formatRelative(item.lastMessage.createdAt)}
                  </Text>
                ) : null}
              </View>
              <Text
                variant="bodySmall"
                numberOfLines={1}
                style={{ color: theme.appColors.textMuted }}
              >
                {item.lastMessage
                  ? `${item.lastMessage.sender.id === user?.id ? 'Você' : item.lastMessage.sender.name}: ${item.lastMessage.body}`
                  : 'Comece a conversa'}
              </Text>
            </View>
            {item.unreadCount > 0 ? (
              <Badge style={{ backgroundColor: theme.appColors.highlight }}>
                {item.unreadCount}
              </Badge>
            ) : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={conversations.isRefreshing}
          onRefresh={conversations.refresh}
          tintColor={theme.appColors.primary}
          colors={[theme.appColors.primary]}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl * 2, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  clubIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
