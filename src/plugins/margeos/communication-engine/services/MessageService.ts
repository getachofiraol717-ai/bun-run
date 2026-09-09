/**
 * Knowledge Universe — Message Service
 * Unified message operations using Supabase realtime & fallback persistence.
 */

import { supabase } from '@/integrations/supabase/client';
import { Message, MessageAttachment, MessageReaction, MessageType } from '../types';

export class MessageService {
  /**
   * Fetch messages for a conversation
   */
  static async fetchMessages(conversationId: string, limit = 50): Promise<Message[]> {
    try {
      // 1. Try study_room_messages or guild_messages depending on ID format
      if (conversationId.startsWith('room_') || conversationId.includes('study')) {
        const roomId = conversationId.replace('room_', '');
        const { data, error } = await (supabase as any)
          .from('study_room_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })
          .limit(limit);

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            conversation_id: conversationId,
            sender_id: row.user_id,
            sender_name: row.sender_name || 'Explorer',
            content: row.content,
            message_type: row.message_type || 'text',
            created_at: row.created_at,
            status: 'delivered',
          }));
        }
      } else if (conversationId.startsWith('guild_') || conversationId.includes('guild')) {
        const guildId = conversationId.replace('guild_', '');
        const { data, error } = await (supabase as any)
          .from('guild_messages')
          .select('*')
          .eq('guild_id', guildId)
          .order('created_at', { ascending: true })
          .limit(limit);

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            conversation_id: conversationId,
            sender_id: row.user_id,
            sender_name: row.sender_name || 'Guild Member',
            content: row.content,
            message_type: 'text',
            created_at: row.created_at,
            status: 'delivered',
          }));
        }
      }

      // Fallback local memory or cached array
      const localKey = `ku_messages_${conversationId}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error fetching messages:', e);
    }

    return [];
  }

  /**
   * Send a message to a conversation
   */
  static async sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    messageType?: MessageType;
    replyTo?: any;
    attachments?: MessageAttachment[];
  }): Promise<Message> {
    const {
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      content,
      messageType = 'text',
      replyTo,
      attachments = [],
    } = params;

    const newMessage: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName,
      sender_avatar: senderAvatar,
      content,
      message_type: messageType,
      created_at: new Date().toISOString(),
      status: 'sent',
      reply_to: replyTo,
      attachments,
      reactions: [],
    };

    try {
      if (conversationId.startsWith('room_')) {
        const roomId = conversationId.replace('room_', '');
        await (supabase as any).from('study_room_messages').insert({
          room_id: roomId,
          user_id: senderId,
          sender_name: senderName,
          content,
          message_type: messageType,
        });
      } else if (conversationId.startsWith('guild_')) {
        const guildId = conversationId.replace('guild_', '');
        await (supabase as any).from('guild_messages').insert({
          guild_id: guildId,
          user_id: senderId,
          sender_name: senderName,
          content,
        });
      }
    } catch (err) {
      console.warn('Failed to persist to Supabase, falling back to local store:', err);
    }

    // Persist to local storage fallback
    const localKey = `ku_messages_${conversationId}`;
    const saved = localStorage.getItem(localKey);
    const existing: Message[] = saved ? JSON.parse(saved) : [];
    existing.push(newMessage);
    localStorage.setItem(localKey, JSON.stringify(existing.slice(-100)));

    return newMessage;
  }

  /**
   * Toggle reaction on a message
   */
  static async toggleReaction(
    conversationId: string,
    messageId: string,
    userId: string,
    userName: string,
    emoji: string
  ): Promise<MessageReaction[]> {
    const localKey = `ku_messages_${conversationId}`;
    const saved = localStorage.getItem(localKey);
    if (!saved) return [];

    const messages: Message[] = JSON.parse(saved);
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return [];

    const reactions = msg.reactions || [];
    const existingIdx = reactions.findIndex((r) => r.user_id === userId && r.emoji === emoji);

    if (existingIdx >= 0) {
      reactions.splice(existingIdx, 1);
    } else {
      reactions.push({
        id: 'rx_' + Date.now(),
        message_id: messageId,
        user_id: userId,
        user_name: userName,
        emoji,
        created_at: new Date().toISOString(),
      });
    }

    msg.reactions = reactions;
    localStorage.setItem(localKey, JSON.stringify(messages));
    return reactions;
  }
}
