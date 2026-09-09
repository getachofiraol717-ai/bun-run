/**
 * Knowledge Universe — Primary Communication Hook
 * Provides high-level interface for loading, sending, replying, reactions, media uploads, and @AI mentions.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useCommunicationStore } from '../store/communicationStore';
import { MessageService } from '../services/MessageService';
import { ConversationService } from '../services/ConversationService';
import { MediaService } from '../services/MediaService';
import { AIChatService } from '../services/AIChatService';
import { Message, MessageType, MessageAttachment, UserProfile } from '../types';

export function useCommunication(userId = 'current_user', userName = 'Explorer') {
  const {
    activeConversationId,
    activeConversation,
    conversations,
    messages,
    typingUsers,
    activeTab,
    searchQuery,
    isMediaUploading,
    uploadProgress,
    setActiveConversationId,
    setActiveTab,
    setSearchQuery,
    setConversations,
    addConversation,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    setMediaUploading,
  } = useCommunicationStore();

  const isSendingRef = useRef(false);

  // Initial load
  useEffect(() => {
    async function loadData() {
      const list = await ConversationService.fetchConversations(userId);
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    }
    loadData();
  }, [userId]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;

    async function loadMsgs() {
      const msgs = await MessageService.fetchMessages(activeConversationId!);
      setMessages(activeConversationId!, msgs);
    }

    loadMsgs();
  }, [activeConversationId]);

  // Start or open a direct message with a real user
  const startDirectMessage = useCallback(
    async (targetUser: UserProfile) => {
      const dm = await ConversationService.startDirectMessage(userId, targetUser);
      addConversation(dm);
      setActiveConversationId(dm.id);
      setActiveTab('dms');
      return dm;
    },
    [userId, addConversation, setActiveConversationId, setActiveTab]
  );

  // Send message with automatic @AI detection and duplicate prevention
  const sendMessage = useCallback(
    async (
      content: string,
      messageType: MessageType = 'text',
      replyTo?: any,
      attachments: MessageAttachment[] = []
    ) => {
      if (!activeConversationId || !content.trim()) return;
      if (isSendingRef.current) return; // Prevent duplicate rapid submission
      isSendingRef.current = true;

      try {
        // 1. Send user message
        const msg = await MessageService.sendMessage({
          conversationId: activeConversationId,
          senderId: userId,
          senderName: userName,
          content: content.trim(),
          messageType,
          replyTo,
          attachments,
        });

        addMessage(activeConversationId, msg);

        // 2. Check for @AI mention or AI conversation type
        const isAIConv = activeConversation?.type === 'ai';
        const hasAIMention = content.toLowerCase().includes('@ai');

        if (isAIConv || hasAIMention) {
          const aiMsgId = 'ai_resp_' + Date.now();
          const placeholderAIMsg: Message = {
            id: aiMsgId,
            conversation_id: activeConversationId,
            sender_id: 'ai-tutor',
            sender_name: '🤖 Knowledge AI Tutor',
            sender_avatar: '🤖',
            content: '...thinking...',
            message_type: 'ai',
            created_at: new Date().toISOString(),
            status: 'sending',
          };

          addMessage(activeConversationId, placeholderAIMsg);

          const recentMsgs = messages[activeConversationId] || [];
          let accumulatedText = '';

          try {
            await AIChatService.processAIMention({
              prompt: content.replace(/@ai/gi, '').trim() || content,
              conversationTitle: activeConversation?.title || 'Learning Session',
              conversationSubject: activeConversation?.subject,
              recentMessages: recentMsgs,
              onChunk: (chunk) => {
                accumulatedText += chunk;
                updateMessage(activeConversationId, aiMsgId, {
                  content: accumulatedText,
                  status: 'delivered',
                });
              },
              onComplete: (fullText) => {
                updateMessage(activeConversationId, aiMsgId, {
                  content: fullText || accumulatedText || 'Explanation completed.',
                  status: 'delivered',
                });
              },
              onError: (err) => {
                // Ensure placeholder is replaced with honest failure state
                updateMessage(activeConversationId, aiMsgId, {
                  content: '⚠️ AI tutor temporary connection issue: ' + (err.message || 'Service unavailable'),
                  status: 'failed',
                });
              },
            });
          } catch (err: any) {
            updateMessage(activeConversationId, aiMsgId, {
              content: '⚠️ AI tutor temporary connection issue: ' + (err?.message || 'Service unavailable'),
              status: 'failed',
            });
          }
        }
      } finally {
        isSendingRef.current = false;
      }
    },
    [activeConversationId, activeConversation, userId, userName, messages, addMessage, updateMessage]
  );

  // Reaction toggle
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!activeConversationId) return;
      const updated = await MessageService.toggleReaction(
        activeConversationId,
        messageId,
        userId,
        userName,
        emoji
      );
      updateMessage(activeConversationId, messageId, { reactions: updated });
    },
    [activeConversationId, userId, userName]
  );

  // Upload attachment file
  const uploadFile = useCallback(
    async (file: File) => {
      setMediaUploading(true, 20);
      try {
        const att = await MediaService.uploadAttachment(file, userId);
        setMediaUploading(false, 100);
        return att;
      } catch (err: any) {
        setMediaUploading(false, 0);
        throw err;
      }
    },
    [userId]
  );

  return {
    activeConversationId,
    activeConversation,
    conversations,
    currentMessages: activeConversationId ? messages[activeConversationId] || [] : [],
    typingUsers: activeConversationId ? typingUsers[activeConversationId] || [] : [],
    activeTab,
    searchQuery,
    isMediaUploading,
    uploadProgress,
    setActiveConversationId,
    setActiveTab,
    setSearchQuery,
    startDirectMessage,
    sendMessage,
    toggleReaction,
    uploadFile,
    deleteMessage: (msgId: string) =>
      activeConversationId && deleteMessage(activeConversationId, msgId),
  };
}
