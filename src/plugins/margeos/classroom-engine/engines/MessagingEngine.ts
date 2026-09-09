/**
 * MessagingEngine.ts
 *
 * Core engine for managing real-time messaging within classrooms.
 */

import { Message, createMessage, createSystemMessage, createVoiceMessage, Reaction, EducationalLink } from '../models';

const STORAGE_KEY = 'messaging_engine_data';

export interface MessagingEngineConfig {
  maxMessageLength?: number;
  maxAttachments?: number;
  enableThreading?: boolean;
  enableReactions?: boolean;
  enableEdits?: boolean;
  enableDelete?: boolean;
  enableTypingIndicators?: boolean;
}

export interface MessageFilter {
  classroomId?: string;
  channelId?: string;
  senderId?: string;
  contentType?: string;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
  isPinned?: boolean;
  hasAttachments?: boolean;
  hasEducationalLinks?: boolean;
}

export class MessagingEngine {
  private static instance: MessagingEngine;
  private messages: Map<string, Message> = new Map();
  private messageThreads: Map<string, string[]> = new Map(); // parentId -> replyIds
  private config: MessagingEngineConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor(config: MessagingEngineConfig = {}) {
    this.config = {
      maxMessageLength: config.maxMessageLength || 10000,
      maxAttachments: config.maxAttachments || 10,
      enableThreading: config.enableThreading !== false,
      enableReactions: config.enableReactions !== false,
      enableEdits: config.enableEdits !== false,
      enableDelete: config.enableDelete !== false,
      enableTypingIndicators: config.enableTypingIndicators !== false
    };
  }

  static getInstance(config?: MessagingEngineConfig): MessagingEngine {
    if (!MessagingEngine.instance) {
      MessagingEngine.instance = new MessagingEngine(config);
    }
    return MessagingEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.messages = new Map(Object.entries(data.messages || {}));
        this.messageThreads = new Map(Object.entries(data.threads || {}));
      }
    } catch (error) {
      console.error('Failed to load messages from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        messages: Object.fromEntries(this.messages),
        threads: Object.fromEntries(this.messageThreads)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save messages to storage:', error);
    }
  }

  sendMessage(
    classroomId: string,
    channelId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string | undefined,
    content: string,
    contentType: 'text' | 'html' | 'markdown' = 'text',
    parentId?: string,
    metadata?: Record<string, any>
  ): Message {
    const trimmedContent = content.trim();

    if (trimmedContent.length > this.config.maxMessageLength!) {
      throw new Error(`Message exceeds maximum length of ${this.config.maxMessageLength} characters`);
    }

    const message = createMessage(
      classroomId,
      channelId,
      senderId,
      senderName,
      senderAvatar,
      trimmedContent,
      contentType,
      parentId,
      metadata
    );

    this.messages.set(message.id, message);

    // Handle threading
    if (parentId && this.config.enableThreading) {
      const thread = this.messageThreads.get(parentId) || [];
      thread.push(message.id);
      this.messageThreads.set(parentId, thread);
    }

    this.saveToStorage();
    this.emit('messageSent', message);

    if (parentId) {
      this.emit('threadReply', { parentId, reply: message });
    }

    return message;
  }

  getMessage(messageId: string): Message | undefined {
    return this.messages.get(messageId);
  }

  getMessages(filter: MessageFilter = {}): Message[] {
    let messages = Array.from(this.messages.values());

    if (filter.classroomId) {
      messages = messages.filter(m => m.classroomId === filter.classroomId);
    }
    if (filter.channelId) {
      messages = messages.filter(m => m.channelId === filter.channelId);
    }
    if (filter.senderId) {
      messages = messages.filter(m => m.senderId === filter.senderId);
    }
    if (filter.contentType) {
      messages = messages.filter(m => m.contentType === filter.contentType);
    }
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      messages = messages.filter(m =>
        m.content.toLowerCase().includes(query) ||
        m.senderName.toLowerCase().includes(query)
      );
    }
    if (filter.startDate) {
      messages = messages.filter(m => m.createdAt >= filter.startDate!);
    }
    if (filter.endDate) {
      messages = messages.filter(m => m.createdAt <= filter.endDate!);
    }
    if (filter.isPinned !== undefined) {
      messages = messages.filter(m => m.isPinned === filter.isPinned);
    }
    if (filter.hasAttachments !== undefined) {
      messages = messages.filter(m =>
        filter.hasAttachments ? m.attachments.length > 0 : m.attachments.length === 0
      );
    }
    if (filter.hasEducationalLinks !== undefined) {
      messages = messages.filter(m =>
        filter.hasEducationalLinks ? m.educationalLinks.length > 0 : m.educationalLinks.length === 0
      );
    }

    // Sort by createdAt descending (newest first for regular messages, oldest first for threads)
    return messages.sort((a, b) => {
      if (!filter.channelId) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  getChannelMessages(channelId: string, limit?: number, before?: string): Message[] {
    let messages = Array.from(this.messages.values())
      .filter(m => m.channelId === channelId && !m.parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (before) {
      const beforeDate = new Date(before);
      messages = messages.filter(m => new Date(m.createdAt) < beforeDate);
    }

    if (limit) {
      messages = messages.slice(0, limit);
    }

    return messages;
  }

  getThreadReplies(parentId: string): Message[] {
    const replyIds = this.messageThreads.get(parentId) || [];
    return replyIds
      .map(id => this.messages.get(id))
      .filter((m): m is Message => m !== undefined)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getThreadCount(parentId: string): number {
    return this.countThreadReplies(parentId);
  }

  private countThreadReplies(parentId: string): number {
    const replyIds = this.messageThreads.get(parentId) || [];
    let count = replyIds.length;
    replyIds.forEach(replyId => {
      count += this.countThreadReplies(replyId);
    });
    return count;
  }

  editMessage(messageId: string, newContent: string, editedBy: string): Message | undefined {
    if (!this.config.enableEdits) return undefined;

    const message = this.messages.get(messageId);
    if (!message) return undefined;

    if (newContent.length > this.config.maxMessageLength!) {
      throw new Error(`Message exceeds maximum length of ${this.config.maxMessageLength} characters`);
    }

    message.content = newContent.trim();
    message.editedAt = new Date().toISOString();
    message.editedBy = editedBy;
    message.isEdited = true;

    this.saveToStorage();
    this.emit('messageEdited', message);
    return message;
  }

  deleteMessage(messageId: string, deletedBy: string): boolean {
    if (!this.config.enableDelete) return false;

    const message = this.messages.get(messageId);
    if (!message) return false;

    // Mark as deleted rather than removing
    message.isDeleted = true;
    message.deletedAt = new Date().toISOString();
    message.deletedBy = deletedBy;
    message.content = '[Message deleted]';

    this.saveToStorage();
    this.emit('messageDeleted', { messageId, deletedBy });
    return true;
  }

  permanentlyDeleteMessage(messageId: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    // Remove from thread if it's a reply
    if (message.parentId) {
      const thread = this.messageThreads.get(message.parentId);
      if (thread) {
        const index = thread.indexOf(messageId);
        if (index > -1) {
          thread.splice(index, 1);
          if (thread.length === 0) {
            this.messageThreads.delete(message.parentId);
          }
        }
      }
    }

    // Delete all replies recursively
    const replyIds = this.messageThreads.get(messageId);
    if (replyIds) {
      replyIds.forEach(replyId => this.permanentlyDeleteMessage(replyId));
      this.messageThreads.delete(messageId);
    }

    this.messages.delete(messageId);
    this.saveToStorage();
    this.emit('messagePermanentlyDeleted', { messageId });
    return true;
  }

  addReaction(messageId: string, userId: string, emoji: string): boolean {
    if (!this.config.enableReactions) return false;

    const message = this.messages.get(messageId);
    if (!message) return false;

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.userId === userId && r.emoji === emoji
    );

    if (existingReaction) {
      return false; // Already reacted
    }

    const reaction: Reaction = {
      id: `REACT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      emoji,
      userId,
      createdAt: new Date().toISOString()
    };

    message.reactions.push(reaction);
    message.reactionCount = message.reactions.length;
    this.saveToStorage();

    this.emit('reactionAdded', { messageId, reaction });
    return true;
  }

  removeReaction(messageId: string, userId: string, emoji: string): boolean {
    if (!this.config.enableReactions) return false;

    const message = this.messages.get(messageId);
    if (!message) return false;

    const reactionIndex = message.reactions.findIndex(
      r => r.userId === userId && r.emoji === emoji
    );

    if (reactionIndex === -1) {
      return false; // Reaction not found
    }

    message.reactions.splice(reactionIndex, 1);
    message.reactionCount = message.reactions.length;
    this.saveToStorage();

    this.emit('reactionRemoved', { messageId, userId, emoji });
    return true;
  }

  toggleReaction(messageId: string, userId: string, emoji: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    const existingReaction = message.reactions.find(
      r => r.userId === userId && r.emoji === emoji
    );

    if (existingReaction) {
      return this.removeReaction(messageId, userId, emoji);
    } else {
      return this.addReaction(messageId, userId, emoji);
    }
  }

  pinMessage(messageId: string, pinnedBy: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    message.isPinned = true;
    message.pinnedAt = new Date().toISOString();
    message.pinnedBy = pinnedBy;
    this.saveToStorage();

    this.emit('messagePinned', { messageId, pinnedBy });
    return true;
  }

  unpinMessage(messageId: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    message.isPinned = false;
    message.pinnedAt = undefined;
    message.pinnedBy = undefined;
    this.saveToStorage();

    this.emit('messageUnpinned', { messageId });
    return true;
  }

  markAsRead(messageId: string, userId: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      message.readCount = message.readBy.length;
      this.saveToStorage();
      this.emit('messageRead', { messageId, userId });
    }

    return true;
  }

  addEducationalLink(messageId: string, link: EducationalLink): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    message.educationalLinks.push(link);
    this.saveToStorage();
    this.emit('educationalLinkAdded', { messageId, link });
    return true;
  }

  addAIContext(messageId: string, context: any): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    message.aiContext = { ...message.aiContext, ...context };
    this.saveToStorage();
    this.emit('aiContextAdded', { messageId, context });
    return true;
  }

  createSystemMessage(
    classroomId: string,
    channelId: string,
    content: string,
    type: 'member_joined' | 'member_left' | 'channel_created' | 'channel_deleted' | 'classroom_archived' | 'role_changed' | 'pin' | 'unpin' = 'member_joined'
  ): Message {
    const message = createSystemMessage(classroomId, channelId, content, type);
    this.messages.set(message.id, message);
    this.saveToStorage();
    this.emit('systemMessageCreated', message);
    return message;
  }

  searchMessages(query: string, options: { classroomId?: string; channelId?: string; limit?: number } = {}): Message[] {
    const messages = this.getMessages({
      classroomId: options.classroomId,
      channelId: options.channelId,
      searchQuery: query
    });

    // Filter out deleted messages from search results
    const filtered = messages.filter(m => !m.isDeleted);

    if (options.limit) {
      return filtered.slice(0, options.limit);
    }

    return filtered;
  }

  getMessageStats(channelId: string): {
    totalMessages: number;
    totalReplies: number;
    totalReactions: number;
    averageReactions: number;
    mostActiveHour: number;
  } {
    const messages = Array.from(this.messages.values()).filter(m => m.channelId === channelId);
    const threadMessages = messages.filter(m => !!m.parentId);
    const parentMessages = messages.filter(m => !m.parentId);

    const totalReactions = messages.reduce((sum, m) => sum + m.reactions.length, 0);
    const hourCounts: number[] = new Array(24).fill(0);

    messages.forEach(m => {
      const hour = new Date(m.createdAt).getHours();
      hourCounts[hour]++;
    });

    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      totalMessages: parentMessages.length,
      totalReplies: threadMessages.length,
      totalReactions: totalReactions,
      averageReactions: messages.length > 0 ? totalReactions / messages.length : 0,
      mostActiveHour
    };
  }

  deleteMessagesForClassroom(classroomId: string): void {
    const messageIds = Array.from(this.messages.values())
      .filter(m => m.classroomId === classroomId)
      .map(m => m.id);

    messageIds.forEach(id => {
      this.permanentlyDeleteMessage(id);
    });
  }

  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  getStats(): { totalMessages: number; totalThreads: number } {
    const parentMessages = Array.from(this.messages.values()).filter(m => !m.parentId);
    return {
      totalMessages: parentMessages.length,
      totalThreads: this.messageThreads.size
    };
  }
}

export default MessagingEngine;
