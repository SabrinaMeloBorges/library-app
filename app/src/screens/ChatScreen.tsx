import { useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { EmptyState, LoadingState } from '../components/StateViews';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import type { RootStackScreenProps } from '../navigation/types';
import type { ChatMessage } from '../types/social';
import { formatDateTime } from '../utils/dates';
import { radius, spacing } from '../theme/spacing';

const MAX_LENGTH = 1000;
const keyExtractor = (message: ChatMessage): string => message.id;

export const ChatScreen = ({ navigation, route }: RootStackScreenProps<'Chat'>) => {
  const { conversationId, title } = route.params;
  const theme = useAppTheme();
  const { user } = useAuth();
  const chat = useChat(conversationId);
  const [draft, setDraft] = useState('');
  const reversed = useMemo(() => [...chat.messages].reverse(), [chat.messages]);

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  const send = async () => {
    if (await chat.send(draft)) setDraft('');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const mine = item.sender.id === user?.id;
    return (
      <View
        style={[
          styles.bubble,
          mine
            ? [styles.mine, { backgroundColor: theme.appColors.primary }]
            : [styles.theirs, { backgroundColor: theme.appColors.surfaceMuted }],
        ]}
        accessible
        accessibilityLabel={`${mine ? 'Você' : item.sender.name}: ${item.body}`}
      >
        {!mine ? (
          <Text variant="labelSmall" style={{ color: theme.appColors.highlight }}>
            {item.sender.name}
          </Text>
        ) : null}
        <Text
          variant="bodyMedium"
          style={{ color: mine ? theme.appColors.onPrimary : theme.appColors.text }}
        >
          {item.body}
        </Text>
        <Text
          variant="labelSmall"
          style={[
            styles.time,
            { color: mine ? theme.appColors.onPrimary : theme.appColors.textMuted },
          ]}
        >
          {formatDateTime(item.createdAt)}
        </Text>
      </View>
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
        {chat.error ? (
          <View style={styles.banner}>
            <FeedbackBanner type="error" message={chat.error} />
          </View>
        ) : null}
        {chat.isLoading ? (
          <LoadingState message="Carregando mensagens..." />
        ) : (
          <FlatList
            data={reversed}
            keyExtractor={keyExtractor}
            renderItem={renderMessage}
            inverted={reversed.length > 0}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                icon="chat-outline"
                title="Comece a conversa"
                description="Envie a primeira mensagem."
              />
            }
          />
        )}
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
            placeholder="Escreva uma mensagem"
            accessibilityLabel="Mensagem"
            multiline
            maxLength={MAX_LENGTH}
            style={styles.input}
            dense
          />
          <IconButton
            icon="send"
            mode="contained"
            containerColor={theme.appColors.primary}
            iconColor={theme.appColors.onPrimary}
            disabled={!draft.trim() || chat.isSending}
            onPress={send}
            accessibilityLabel="Enviar mensagem"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg, gap: 2 },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  time: { alignSelf: 'flex-end', opacity: 0.75 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, maxHeight: 120, backgroundColor: 'transparent' },
});
