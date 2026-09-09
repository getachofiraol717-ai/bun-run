// @ts-nocheck
/**
 * MessagingService.ts
 *
 * High-level service for messaging operations.
 */

import { MessagingEngine } from '../engines';
import { RealtimeMessaging } from '../realtime';
import { DeliveryService } from '../realtime';
import { TypingIndicator } from '../realtime';
import { Message } from '../models';

export interface SendMessageOptions {
  content: string;
  contentType?: 'text' | 'html' | 'markdown';
  parentId?: string;
  metadata?: Record<string, any>;
  replyTo?: string;
}

class MessagingService {
  private static instance: MessagingService;
  private messagingEngine: MessagingEngine;
  private realtime: RealtimeMessaging;
  private deliveryService: DeliveryService;
  private typingIndicator: TypingIndicator;
  private localUserId?: string;
  private localUserName?: string;

  private constructor() {
    this.messagingEngine = MessagingEngine.getInstance();
    this.realtime = RealtimeMessaging.getInstance();
    this.deliveryService = DeliveryService.getInstance();
    this.typingIndicator = TypingIndicator.getInstance();
  }

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  async initialize(): Promise<void> {
    await this.messagingEngine.initialize();
    await this.realtime.connect();
  }

  setLocalUser(userId: string, userName: string): void {
    this.localUserId = userId;
    this.localUserName = userName;
    this.typingIndicator.setLocalUser(userId);
  }

  // Send a message
  async sendMessage(
    classroomId: string,
    channelId: string,
    options: SendMessageOptions
  ): Promise<Message> {
    if (!this.localUserId || !this.localUserName) {
      throw new Error('Local user not set');
    }

    // Create delivery state
    const tempMessageId = `TEMP-${Date.now()}`;
    this.deliveryService.createDelivery(tempMessageId);

    // Attempt to send
    try {
      const message = this.messagingEngine.sendMessage(
        classroomId,
        channelId,
        this.localUserId,
        this.localUserName,
        undefined, // avatar
        options.content,
        options.contentType || 'text',
        options.parentId,
        options.metadata
      );

      // Mark delivery
      this.deliveryService.markSent(message.id);
      setTimeout(() => this.deliveryService.markDelivered(message.id), 500);

      // Broadcast to realtime
      this.realtime.broadcastMessage(message, channelId, classroomId);

      // Stop typing
      this.typingIndicator.stopTyping(channelId, this.localUserId);

      // Clean up temp delivery
      this.deliveryService.clear(tempMessageId);

      return message;
    } catch (error) {
      this.deliveryService.markFailed(tempMessageId, (error as Error).message);
      throw error;
    }
  }

  // Reply to a message
  async sendReply(
    classroomId: string,
    channelId: string,
    parentId: string,
    content: string,
    contentType?: 'text' | 'html' | 'markdown'
  ): Promise<Message> {
    return this.sendMessage(classroomId, channelId, {
      content,
      contentType,
      parentId
    });
  }

  // Edit a message
  async editMessage(messageId: string, newContent: string): Promise<Message | undefined> {
    if (!this.localUserId) {
      throw new Error('Local user not set');
    }

    const message = this.messagingEngine.editMessage(messageId, newContent, this.localUserId);

    if (message) {
      this.realtime.broadcastMessage(message, message.channelId, message.classroomId);
    }

    return message;
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<boolean> {
    if (!this.localUserId) {
      throw new Error('Local user not set');
    }

    const message = this.messagingEngine.getMessage(messageId);
    if (!message) return false;

    const success = this.messagingEngine.deleteMessage(messageId, this.localUserId);

    if (success) {
      this.realtime.broadcastMessage(message, message.channelId, message.classroomId);
    }

    return success;
  }

  // Get messages for a channel
  getChannelMessages(channelId: string, limit?: number, before?: string): Message[] {
    return this.messagingEngine.getChannelMessages(channelId, limit, before);
  }

  // Get thread replies
  getThreadReplies(parentId: string): Message[] {
    return this.messagingEngine.getThreadReplies(parentId);
  }

  // Add reaction
  toggleReaction(messageId: string, emoji: string): boolean {
    if (!this.localUserId) return false;

    const message = this.messagingEngine.getMessage(messageId);
    if (!message) return false;

    const added = this.messagingEngine.toggleReaction(messageId, this.localUserId, emoji);

    this.realtime.broadcastReaction(
      messageId,
      this.localUserId,
      emoji,
      added ? 'add' : 'remove',
      message.channelId
    );

    return added;
  }

  // Pin/unpin message
  pinMessage(messageId: string, pinnedBy: string): boolean {
    const message = this.messagingEngine.getMessage(messageId);
    if (!message) return false;

    const success = this.messagingEngine.pinMessage(messageId, pinnedBy);

    if (success) {
      this.realtime.broadcastMessage(message, message.channelId, message.classroomId);
    }

    return success;
  }

  unpinMessage(messageId: string): boolean {
    const message = this.messagingEngine.getMessage(messageId);
    if (!message) return false;

    const success = this.messagingEngine.unpinMessage(messageId);

    if (success) {
      this.realtime.broadcastMessage(message, message.channelId, message.classroomId);
    }

    return success;
  }

  // Typing indicators
  startTyping(channelId: string): void {
    if (!this.localUserId || !this.localUserName) return;
    this.typingIndicator.startTyping(channelId, this.localUserId, this.localUserName);

    this.realtime.broadcastTyping(
      this.localUserId,
      this.localUserName,
      channelId,
      '', // classroomId would be set elsewhere
      true
    );
  }

  stopTyping(channelId: string): void {
    if (!this.localUserId || !this.localUserName) return;
    this.typingIndicator.stopTyping(channelId, this.localUserId);

    this.realtime.broadcastTyping(
      this.localUserId,
      this.localUserName,
      channelId,
      '',
      false
    );
  }

  getTypingUsers(channelId: string): Array<{ userId: string; userName: string }> {
    return this.typingIndicator.getTypingUsers(channelId);
  }

  // Get message delivery status
  getDeliveryStatus(messageId: string): any {
    return this.deliveryService.getDeliveryState(messageId);
  }

  // Subscribe to messages
  subscribeToMessages(channelId: string, callback: (message: Message) => void): () => void {
    return this.realtime.on('message', (event) => {
      if (event.channelId === channelId && event.data?.action === 'new') {
        callback(event.data.message);
      }
    });
  }

  // Search messages
  searchMessages(query: string, options?: { classroomId?: string; channelId?: string; limit?: number }): Message[] {
    return this.messagingEngine.searchMessages(query, options);
  }
}

export default MessagingService;
