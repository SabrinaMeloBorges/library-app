import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/apiError';
import { chatService } from '../services/chatService';
import type { ChatMessage } from '../types/social';

const POLL_INTERVAL_MS = 4000;

const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const known = new Set(current.map((message) => message.id));
  const fresh = incoming.filter((message) => !known.has(message.id));
  return fresh.length > 0 ? [...current, ...fresh] : current;
};

export const useChat = (conversationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const fetchNew = useCallback(async () => {
    const last = messagesRef.current[messagesRef.current.length - 1];
    try {
      const incoming = await chatService.messages(conversationId, last?.createdAt);
      setMessages((current) => mergeMessages(current, incoming));
      setError(null);
      if (incoming.length > 0) await chatService.markRead(conversationId);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      void fetchNew();
      const timer = setInterval(() => void fetchNew(), POLL_INTERVAL_MS);
      return () => clearInterval(timer);
    }, [fetchNew]),
  );

  const send = useCallback(
    async (body: string): Promise<boolean> => {
      const text = body.trim();
      if (!text || isSending) return false;
      setIsSending(true);
      try {
        const message = await chatService.send(conversationId, text);
        setMessages((current) => mergeMessages(current, [message]));
        setError(null);
        return true;
      } catch (caught) {
        setError(getErrorMessage(caught));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, isSending],
  );

  return { messages, isLoading, error, isSending, send, retry: fetchNew };
};
