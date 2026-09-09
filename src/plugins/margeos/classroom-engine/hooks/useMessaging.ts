// @ts-nocheck
/**
 * useMessaging.ts
 *
 * React hook for messaging operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessagingEngine } from '../engines';
import { RealtimeMessaging } from '../realtime';
import { TypingIndicator } from '../realtime';
import { Message } from '../models';

export interface UseMessagingOptions {
  channelId?: string;
  classroomId?: string;
  limit?: number;
  autoScroll?: boolean;
}

export interface UseMessagingReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  sendMessage: (content: string, contentType?: 'text' | 'html' | 'markdown', parentId?: string) => Promise<Message | null>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  toggleReaction: (messageId: string, emoji: string) => void;
  pinMessage: (messageId: string) => void;
  unpinMessage: (messageId: string) => void;
  loadMore: () => void;
  refreshMessages: () => void;
  typingUsers: Array<{ userId: string; userName: string }>;
  startTyping: () => void;
  stopTyping: () => void;
}

export function useMessaging(
  options: UseMessagingOptions = {}
): UseMessagingReturn {
  const { channelId, limit = 50 } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);

  const messagingEngine = MessagingEngine.getInstance();
  const realtime = RealtimeMessaging.getInstance();
  const typingIndicator = TypingIndicator.getInstance();

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!channelId) return;

    setLoading(true);
    setError(null);

    try {
      const loadedMessages = messagingEngine.getChannelMessages(channelId, limit);
      setMessages(loadedMessages);
      setHasMore(loadedMessages.length === limit);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [channelId, limit, messagingEngine]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!channelId) return;

    // Subscribe to channel
    realtime.subscribeToChannel(channelId);

    // Listen for new messages
    const unsubscribeMessage = realtime.on('message', (event) => {
      if (event.channelId === channelId && event.data?.action === 'new') {
        setMessages(prev => [event.data.message, ...prev]);
      }
    });

    // Listen for typing
    const unsubscribeTyping = typingIndicator.subscribe((data) => {
      if (data.channelId === channelId) {
        if (data.isTyping) {
          setTypingUsers(prev => {
            if (prev.some(u => u.userId === data.userId)) return prev;
            return [...prev, { userId: data.userId, userName: data.userName }];
          });
        } else {
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        }
      }
    });

    return () => {
      realtime.unsubscribeFromChannel(channelId);
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [channelId, realtime, typingIndicator]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    contentType: 'text' | 'html' | 'markdown' = 'text',
    parentId?: string
  ): Promise<Message | null> => {
    if (!channelId) return null;

    try {
      // Get current user info (would come from auth context in real app)
      const userId = 'current-user';
      const userName = 'Current User';

      const message = messagingEngine.sendMessage(
        channelId, // classroomId
        channelId, // channelId
        userId,
        userName,
        undefined,
        content,
        contentType,
        parentId
      );

      return message;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [channelId, messagingEngine]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string): Promise<boolean> => {
    try {
      const userId = 'current-user';
      const result = messagingEngine.editMessage(messageId, newContent, userId);
      return !!result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [messagingEngine]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const userId = 'current-user';
      const result = messagingEngine.deleteMessage(messageId, userId);
      if (result) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
      return result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [messagingEngine]);

  // Toggle reaction
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    const userId = 'current-user';
    messagingEngine.toggleReaction(messageId, userId, emoji);
  }, [messagingEngine]);

  // Pin message
  const pinMessage = useCallback((messageId: string) => {
    const userId = 'current-user';
    messagingEngine.pinMessage(messageId, userId);
  }, [messagingEngine]);

  // Unpin message
  const unpinMessage = useCallback((messageId: string) => {
    messagingEngine.unpinMessage(messageId);
  }, [messagingEngine]);

  // Load more messages
  const loadMore = useCallback(() => {
    if (!hasMore || !channelId) return;

    const lastMessage = messages[messages.length - 1];
    const olderMessages = messagingEngine.getChannelMessages(channelId, limit, lastMessage?.createdAt);

    if (olderMessages.length < limit) {
      setHasMore(false);
    }

    setMessages(prev => [...prev, ...olderMessages]);
  }, [hasMore, channelId, messages, limit, messagingEngine]);

  // Refresh messages
  const refreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  // Start typing
  const startTyping = useCallback(() => {
    if (!channelId) return;

    typingIndicator.startTyping(channelId, 'current-user', 'Current User');

    // Auto-stop after 5 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      typingIndicator.stopTyping(channelId, 'current-user');
    }, 5000);
  }, [channelId, typingIndicator]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!channelId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingIndicator.stopTyping(channelId, 'current-user');
  }, [channelId, typingIndicator]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    pinMessage,
    unpinMessage,
    loadMore,
    refreshMessages,
    typingUsers,
    startTyping,
    stopTyping
  };
}

export default useMessaging;
