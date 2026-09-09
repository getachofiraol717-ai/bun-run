// @ts-nocheck
/**
 * NotificationService.ts
 *
 * High-level service for notification operations.
 */

import { NotificationEngine, Notification, NotificationType } from '../engines';

export interface NotificationPreferences {
  messageNotifications: boolean;
  mentionNotifications: boolean;
  replyNotifications: boolean;
  reactionNotifications: boolean;
  announcementNotifications: boolean;
  assignmentNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  quietHours: { enabled: boolean; start: number; end: number };
}

class NotificationService {
  private static instance: NotificationService;
  private notificationEngine: NotificationEngine;
  private localUserId?: string;
  private preferences: NotificationPreferences = {
    messageNotifications: true,
    mentionNotifications: true,
    replyNotifications: true,
    reactionNotifications: true,
    announcementNotifications: true,
    assignmentNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    quietHours: { enabled: false, start: 22, end: 7 }
  };

  private constructor() {
    this.notificationEngine = NotificationEngine.getInstance();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    await this.notificationEngine.initialize();
  }

  setLocalUser(userId: string): void {
    this.localUserId = userId;
  }

  // Get notification preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Update notification preferences
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  // Check if notification is allowed
  private shouldNotify(type: NotificationType): boolean {
    if (this.isInQuietHours()) return false;

    const typeMapping: Partial<Record<NotificationType, keyof NotificationPreferences>> = {
      message: 'messageNotifications',
      mention: 'mentionNotifications',
      reply: 'replyNotifications',
      reaction: 'reactionNotifications',
      announcement: 'announcementNotifications',
      assignment_due: 'assignmentNotifications',
      grade_posted: 'assignmentNotifications'
    };

    const prefKey = typeMapping[type];
    if (prefKey) {
      return this.preferences[prefKey] as boolean;
    }

    return true;
  }

  // Check if in quiet hours
  private isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const hour = now.getHours();
    const { start, end } = this.preferences.quietHours;

    if (start < end) {
      return hour >= start && hour < end;
    } else {
      return hour >= start || hour < end;
    }
  }

  // Get notifications
  getNotifications(limit?: number): Notification[] {
    if (!this.localUserId) return [];
    return this.notificationEngine.getNotifications({ recipientId: this.localUserId, limit });
  }

  // Get notifications by type
  getNotificationsByType(type: NotificationType, limit?: number): Notification[] {
    if (!this.localUserId) return [];
    return this.notificationEngine.getNotifications({
      recipientId: this.localUserId,
      type,
      limit
    });
  }

  // Get unread count
  getUnreadCount(): number {
    if (!this.localUserId) return 0;
    return this.notificationEngine.getUnreadCount(this.localUserId);
  }

  // Get unread by type
  getUnreadByType(): Record<NotificationType, number> {
    if (!this.localUserId) return {} as Record<NotificationType, number>;
    return this.notificationEngine.getUnreadByType(this.localUserId);
  }

  // Mark notification as read
  markAsRead(notificationId: string): boolean {
    return this.notificationEngine.markAsRead(notificationId);
  }

  // Mark all as read
  markAllAsRead(): number {
    if (!this.localUserId) return 0;
    return this.notificationEngine.markAllAsRead(this.localUserId);
  }

  // Archive notification
  archiveNotification(notificationId: string): boolean {
    return this.notificationEngine.archiveNotification(notificationId);
  }

  // Delete notification
  deleteNotification(notificationId: string): boolean {
    return this.notificationEngine.deleteNotification(notificationId);
  }

  // Clear all notifications
  clearAll(): number {
    if (!this.localUserId) return 0;
    return this.notificationEngine.clearAllNotifications(this.localUserId);
  }

  // Request notification permission (for push)
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  // Check push permission status
  getPushPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as 'granted' | 'denied' | 'default';
  }

  // Show browser notification
  showBrowserNotification(title: string, options?: NotificationOptions): Notification | null {
    if (this.getPushPermissionStatus() !== 'granted') {
      return null;
    }

    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }

  // Format notification text
  formatNotification(notification: Notification): { title: string; body: string; icon?: string } {
    switch (notification.type) {
      case 'message':
        return {
          title: notification.title,
          body: notification.message,
          icon: 'message'
        };
      case 'mention':
        return {
          title: 'You were mentioned',
          body: `${notification.senderName} mentioned you`,
          icon: 'at-sign'
        };
      case 'reply':
        return {
          title: 'New reply',
          body: `${notification.senderName} replied to your message`,
          icon: 'corner-down-left'
        };
      case 'reaction':
        return {
          title: 'New reaction',
          body: `${notification.senderName} reacted to your message`,
          icon: 'smile'
        };
      case 'announcement':
        return {
          title: 'New announcement',
          body: notification.message,
          icon: 'megaphone'
        };
      case 'assignment_due':
        return {
          title: 'Assignment due',
          body: notification.message,
          icon: 'clipboard'
        };
      case 'grade_posted':
        return {
          title: 'Grade posted',
          body: notification.message,
          icon: 'check-circle'
        };
      default:
        return {
          title: notification.title,
          body: notification.message
        };
    }
  }

  // Get notification icon
  getNotificationIcon(type: NotificationType): string {
    const icons: Partial<Record<NotificationType, string>> = {
      message: 'message-circle',
      mention: 'at-sign',
      reply: 'corner-down-left',
      reaction: 'smile',
      channel_invite: 'user-plus',
      member_joined: 'user-check',
      member_left: 'user-minus',
      announcement: 'megaphone',
      assignment_due: 'clipboard',
      grade_posted: 'award',
      pin: 'flag',
      voice_note: 'mic',
      media_shared: 'paperclip'
    };

    return icons[type] || 'bell';
  }

  // Group notifications by date
  groupNotificationsByDate(notifications: Notification[]): Map<string, Notification[]> {
    const groups = new Map<string, Notification[]>();

    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return groups;
  }
}

export default NotificationService;
