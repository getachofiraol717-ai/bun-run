/**
 * MessagingProvider.ts
 *
 * Interface for messaging providers in the classroom communication system.
 */

import { Message, Channel, Reaction, EducationalLink } from '../models';

export interface MessagingProviderConfig {
  enableRealTime?: boolean;
  enableTypingIndicators?: boolean;
  enableReadReceipts?: boolean;
  maxMessageLength?: number;
  maxAttachments?: number;
  enableThreading?: boolean;
}

export interface MessageListener {
  onMessageSent?: (message: Message) => void;
  onMessageEdited?: (message: Message) => void;
  onMessageDeleted?: (messageId: string) => void;
  onReactionAdded?: (messageId: string, reaction: Reaction) => void;
  onReactionRemoved?: (messageId: string, userId: string, emoji: string) => void;
  onTypingStart?: (userId: string, channelId: string) => void;
  onTypingStop?: (userId: string, channelId: string) => void;
  onReadReceipt?: (messageId: string, userId: string) => void;
  onEducationalLinkAdded?: (messageId: string, link: EducationalLink) => void;
}

export interface MessagingProvider {
  // Configuration
  configure(config: MessagingProviderConfig): void;
  getConfig(): MessagingProviderConfig;

  // Message Operations
  sendMessage(
    classroomId: string,
    channelId: string,
    senderId: string,
    senderName: string,
    content: string,
    contentType?: 'text' | 'html' | 'markdown',
    parentId?: string,
    metadata?: Record<string, any>
  ): Promise<Message>;

  getMessage(messageId: string): Promise<Message | null>;
  getChannelMessages(channelId: string, limit?: number, before?: string): Promise<Message[]>;
  getThreadReplies(parentId: string): Promise<Message[]>;

  editMessage(messageId: string, newContent: string, editedBy: string): Promise<Message | null>;
  deleteMessage(messageId: string, deletedBy: string): Promise<boolean>;
  permanentlyDeleteMessage(messageId: string): Promise<boolean>;

  // Reactions
  addReaction(messageId: string, userId: string, emoji: string): Promise<boolean>;
  removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean>;
  toggleReaction(messageId: string, userId: string, emoji: string): Promise<boolean>;
  getMessageReactions(messageId: string): Promise<Reaction[]>;

  // Threading
  getThreadCount(parentId: string): Promise<number>;
  getThreadMessages(parentId: string): Promise<Message[]>;

  // Pinning
  pinMessage(messageId: string, pinnedBy: string): Promise<boolean>;
  unpinMessage(messageId: string): Promise<boolean>;
  getPinnedMessages(channelId: string): Promise<Message[]>;

  // Read Status
  markAsRead(messageId: string, userId: string): Promise<boolean>;
  getReadReceipts(messageId: string): Promise<string[]>;

  // Educational Links
  addEducationalLink(messageId: string, link: EducationalLink): Promise<boolean>;
  getEducationalLinks(messageId: string): Promise<EducationalLink[]>;

  // Search
  searchMessages(
    query: string,
    options?: {
      classroomId?: string;
      channelId?: string;
      senderId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<Message[]>;

  // System Messages
  createSystemMessage(
    classroomId: string,
    channelId: string,
    content: string,
    type?: 'member_joined' | 'member_left' | 'channel_created' | 'channel_deleted' | 'classroom_archived' | 'role_changed' | 'pin' | 'unpin'
  ): Promise<Message>;

  // Listeners
  subscribe(listener: MessageListener): () => void;

  // Real-time Status
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface ConversationLink {
  type: 'pdf' | 'concept' | 'formula' | 'reference_book' | 'knowledge_node' | 'quiz' | 'lesson';
  id: string;
  title: string;
  pageNumber?: number;
  position?: { x: number; y: number };
  context?: string;
}

export interface MessageContext {
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student' | 'ta' | 'assistant';
  classroomId: string;
  channelId: string;
  parentId?: string;
  replyToId?: string;
  mentionedUsers?: string[];
  linkedContent?: ConversationLink[];
  educationalTags?: string[];
}

export interface TypingStatus {
  userId: string;
  userName: string;
  channelId: string;
  isTyping: boolean;
  startedAt?: string;
}

export interface DeliveryStatus {
  messageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  deliveredAt?: string;
  readAt?: string;
  failedReason?: string;
}

export default MessagingProvider;
