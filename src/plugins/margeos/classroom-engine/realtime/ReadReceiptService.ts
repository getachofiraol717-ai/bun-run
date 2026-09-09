// @ts-nocheck
/**
 * ReadReceiptService.ts
 *
 * Service for managing read receipts and message read status.
 */

import { PresenceEngine } from '../engines';

export interface ReadReceipt {
  messageId: string;
  userId: string;
  userName: string;
  readAt: string;
}

export interface ChannelReadStatus {
  channelId: string;
  lastReadMessageId?: string;
  unreadCount: number;
  unreadMessageIds: string[];
}

type ReadReceiptCallback = (receipt: ReadReceipt) => void;

class ReadReceiptService {
  private static instance: ReadReceiptService;
  private presenceEngine: PresenceEngine;
  private channelStatuses: Map<string, ChannelReadStatus> = new Map();
  private callbacks: Set<ReadReceiptCallback> = new Set();
  private localUserId?: string;
  private localUserName?: string;
  private messageIdMap: Map<string, { channelId: string; createdAt: string }> = new Map();

  private constructor() {
    this.presenceEngine = PresenceEngine.getInstance();
  }

  static getInstance(): ReadReceiptService {
    if (!ReadReceiptService.instance) {
      ReadReceiptService.instance = new ReadReceiptService();
    }
    return ReadReceiptService.instance;
  }

  async initialize(): Promise<void> {
    await this.presenceEngine.initialize();
  }

  setLocalUser(userId: string, userName: string): void {
    this.localUserId = userId;
    this.localUserName = userName;
  }

  // Track messages for read receipt calculation
  trackMessage(messageId: string, channelId: string, createdAt: string): void {
    this.messageIdMap.set(messageId, { channelId, createdAt });

    // Auto-cleanup old messages (keep last 1000)
    if (this.messageIdMap.size > 1000) {
      const entries = Array.from(this.messageIdMap.entries());
      entries.sort((a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime());

      const toRemove = entries.slice(0, entries.length - 1000);
      toRemove.forEach(([id]) => this.messageIdMap.delete(id));
    }
  }

  // Mark a specific message as read
  markAsRead(messageId: string, channelId: string): void {
    if (!this.localUserId || !this.localUserName) return;

    // Update presence engine
    this.presenceEngine.markAsRead(this.localUserId, channelId, messageId);

    // Update local status
    let status = this.channelStatuses.get(channelId);
    if (!status) {
      status = {
        channelId,
        unreadCount: 0,
        unreadMessageIds: []
      };
      this.channelStatuses.set(channelId, status);
    }

    status.lastReadMessageId = messageId;

    // Remove from unread
    const unreadIndex = status.unreadMessageIds.indexOf(messageId);
    if (unreadIndex > -1) {
      status.unreadMessageIds.splice(unreadIndex, 1);
    }
    status.unreadCount = status.unreadMessageIds.length;

    // Notify callbacks
    const receipt: ReadReceipt = {
      messageId,
      userId: this.localUserId,
      userName: this.localUserName,
      readAt: new Date().toISOString()
    };

    this.notifyCallbacks(receipt);
  }

  // Mark all messages in a channel as read
  markChannelAsRead(channelId: string, lastMessageId?: string): void {
    const status = this.channelStatuses.get(channelId);
    if (!status) return;

    // Mark all unread as read
    status.unreadMessageIds.forEach(messageId => {
      if (this.localUserId && this.localUserName) {
        this.presenceEngine.markAsRead(this.localUserId, channelId, messageId);
      }
    });

    status.lastReadMessageId = lastMessageId || status.unreadMessageIds[status.unreadMessageIds.length - 1];
    status.unreadMessageIds = [];
    status.unreadCount = 0;
  }

  // Get read receipt for a specific message
  getReadReceipt(messageId: string, userId: string): ReadReceipt | undefined {
    const message = this.messageIdMap.get(messageId);
    if (!message) return undefined;

    const lastReadId = this.presenceEngine.getLastReadMessageId(message.channelId, userId);
    if (!lastReadId) return undefined;

    // Check if last read is at or after this message
    const messageInfo = this.messageIdMap.get(lastReadId);
    if (!messageInfo) return undefined;

    if (new Date(messageInfo.createdAt) >= new Date(message.createdAt)) {
      return {
        messageId,
        userId,
        userName: userId, // Would need to resolve
        readAt: messageInfo.createdAt
      };
    }

    return undefined;
  }

  // Get all users who have read a message
  getMessageReaders(messageId: string, userIds: string[]): ReadReceipt[] {
    const readers: ReadReceipt[] = [];

    userIds.forEach(userId => {
      const receipt = this.getReadReceipt(messageId, userId);
      if (receipt) {
        readers.push(receipt);
      }
    });

    return readers;
  }

  // Get channel read status
  getChannelStatus(channelId: string): ChannelReadStatus {
    return this.channelStatuses.get(channelId) || {
      channelId,
      unreadCount: 0,
      unreadMessageIds: []
    };
  }

  // Add unread message to a channel
  addUnreadMessage(messageId: string, channelId: string): void {
    // Don't add own messages as unread
    if (this.localUserId) return;

    let status = this.channelStatuses.get(channelId);
    if (!status) {
      status = {
        channelId,
        unreadCount: 0,
        unreadMessageIds: []
      };
      this.channelStatuses.set(channelId, status);
    }

    if (!status.unreadMessageIds.includes(messageId)) {
      status.unreadMessageIds.push(messageId);
      status.unreadCount = status.unreadMessageIds.length;
    }
  }

  // Get unread count for a channel
  getUnreadCount(channelId: string): number {
    return this.channelStatuses.get(channelId)?.unreadCount || 0;
  }

  // Get total unread count across all channels
  getTotalUnreadCount(): number {
    let total = 0;
    this.channelStatuses.forEach(status => {
      total += status.unreadCount;
    });
    return total;
  }

  // Subscribe to read receipt updates
  subscribe(callback: ReadReceiptCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(receipt: ReadReceipt): void {
    this.callbacks.forEach(callback => {
      try {
        callback(receipt);
      } catch (error) {
        console.error('Error in read receipt callback:', error);
      }
    });
  }

  // Clear channel status
  clearChannel(channelId: string): void {
    this.channelStatuses.delete(channelId);
  }

  // Clear all status
  clearAll(): void {
    this.channelStatuses.clear();
    this.messageIdMap.clear();
  }
}

export default ReadReceiptService;
