// @ts-nocheck
/**
 * NotificationEngine.ts
 *
 * Comprehensive notification system for classroom communications.
 * Supports multiple notification types, templates, scheduling,
 * batching, preferences, and multi-channel delivery.
 */

const STORAGE_KEY = 'notification_engine_data';
const NOTIFICATION_QUEUE_KEY = 'notification_queue';
const NOTIFICATION_PREFERENCES_KEY = 'notification_preferences';

export interface NotificationEngineConfig {
  enablePushNotifications?: boolean;
  enableEmailNotifications?: boolean;
  enableInAppNotifications?: boolean;
  enableNotificationTemplates?: boolean;
  enableNotificationBatching?: boolean;
  enableNotificationScheduling?: boolean;
  enableNotificationAnalytics?: boolean;
  batchIntervalMinutes?: number;
  maxNotificationsPerBatch?: number;
  defaultExpirationHours?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName?: string;
  classroomId?: string;
  channelId?: string;
  messageId?: string;
  resourceId?: string;
  resourceType?: string;
  link?: string;
  actions?: NotificationAction[];
  metadata?: Record<string, any>;
  status: NotificationStatus;
  read: boolean;
  delivered: boolean;
  deliveryChannels: DeliveryChannel[];
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'new_message'
  | 'reply'
  | 'mention'
  | 'direct_message'
  | 'channel_invite'
  | 'classroom_invite'
  | 'assignment_shared'
  | 'assignment_due'
  | 'assignment_submitted'
  | 'grade_posted'
  | 'announcement'
  | 'resource_shared'
  | 'voice_note_received'
  | 'media_shared'
  | 'quiz_available'
  | 'quiz_due'
  | 'exam_scheduled'
  | 'study_reminder'
  | 'achievement'
  | 'system'
  | 'moderation'
  | 'welcome';

export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';
export type NotificationStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'expired';
export type DeliveryChannel = 'in_app' | 'push' | 'email' | 'sms';

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  icon?: string;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string;
  titleTemplate: string;
  messageTemplate: string;
  variables: string[];
  channels: DeliveryChannel[];
  priority: NotificationPriority;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  types: Record<NotificationType, {
    enabled: boolean;
    frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
    emailDigest: boolean;
  }>;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  doNotDisturb: boolean;
  mobileSettings: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    ledEnabled: boolean;
  };
  desktopSettings: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    showPreview: boolean;
  };
  updatedAt: string;
}

export interface NotificationFilter {
  userId: string;
  types?: NotificationType[];
  priority?: NotificationPriority[];
  classroomId?: string;
  channelId?: string;
  read?: boolean;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'priority' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationBatch {
  id: string;
  userId: string;
  notifications: string[];
  scheduledAt: string;
  sentAt?: string;
  count: number;
  status: 'pending' | 'sent' | 'failed';
}

export interface NotificationAnalytics {
  notificationId: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  actionTaken?: string;
  deliveryTime?: number;
  readTime?: number;
  clickThroughRate: boolean;
}

export interface NotificationGroup {
  id: string;
  userId: string;
  name: string;
  filter: NotificationFilter;
  collapsed: boolean;
  notificationIds: string[];
  lastNotificationAt: string;
  createdAt: string;
}

export interface ScheduledNotification {
  id: string;
  notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>;
  scheduledFor: string;
  status: 'scheduled' | 'sent' | 'cancelled' | 'failed';
  createdAt: string;
}

export interface NotificationDigest {
  userId: string;
  period: 'hourly' | 'daily' | 'weekly';
  notifications: string[];
  generatedAt: string;
  subject: string;
  summary: string;
}

class NotificationEngine {
  private static instance: NotificationEngine;
  private notifications: Map<string, Notification> = new Map();
  private userNotifications: Map<string, string[]> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private batches: Map<string, NotificationBatch> = new Map();
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationGroups: Map<string, NotificationGroup> = new Map();
  private notificationAnalytics: Map<string, NotificationAnalytics> = new Map();
  private config: NotificationEngineConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;
  private notificationQueue: string[] = [];

  private constructor(config: NotificationEngineConfig = {}) {
    this.config = {
      enablePushNotifications: config.enablePushNotifications !== false,
      enableEmailNotifications: config.enableEmailNotifications !== false,
      enableInAppNotifications: config.enableInAppNotifications !== false,
      enableNotificationTemplates: config.enableNotificationTemplates !== false,
      enableNotificationBatching: config.enableNotificationBatching !== false,
      enableNotificationScheduling: config.enableNotificationScheduling !== false,
      enableNotificationAnalytics: config.enableNotificationAnalytics !== false,
      batchIntervalMinutes: config.batchIntervalMinutes || 60,
      maxNotificationsPerBatch: config.maxNotificationsPerBatch || 10,
      defaultExpirationHours: config.defaultExpirationHours || 168
    };

    if (this.config.enableNotificationTemplates) {
      this.initializeDefaultTemplates();
    }
  }

  static getInstance(config?: NotificationEngineConfig): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine(config);
    }
    return NotificationEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
    this.emit('initialized', {});
    this.startNotificationProcessor();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'New Message',
        type: 'new_message',
        titleTemplate: 'New message from {{senderName}}',
        messageTemplate: '{{senderName}} sent a message in {{channelName}}: "{{messagePreview}}"',
        variables: ['senderName', 'channelName', 'messagePreview'],
        channels: ['in_app', 'push'],
        priority: 'normal',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Reply to Thread',
        type: 'reply',
        titleTemplate: '{{senderName}} replied to your thread',
        messageTemplate: '{{senderName}} replied to your message: "{{replyPreview}}"',
        variables: ['senderName', 'replyPreview'],
        channels: ['in_app', 'push'],
        priority: 'normal',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Mention',
        type: 'mention',
        titleTemplate: '{{senderName}} mentioned you',
        messageTemplate: '{{senderName}} mentioned you in {{channelName}}: "{{messagePreview}}"',
        variables: ['senderName', 'channelName', 'messagePreview'],
        channels: ['in_app', 'push', 'email'],
        priority: 'high',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Direct Message',
        type: 'direct_message',
        titleTemplate: 'New direct message from {{senderName}}',
        messageTemplate: '{{senderName}}: "{{messagePreview}}"',
        variables: ['senderName', 'messagePreview'],
        channels: ['in_app', 'push', 'email'],
        priority: 'high',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Channel Invite',
        type: 'channel_invite',
        titleTemplate: 'You have been invited to {{channelName}}',
        messageTemplate: '{{senderName}} invited you to join {{channelName}} in {{classroomName}}',
        variables: ['senderName', 'channelName', 'classroomName'],
        channels: ['in_app', 'email'],
        priority: 'normal',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Assignment Due Reminder',
        type: 'assignment_due',
        titleTemplate: 'Assignment "{{assignmentTitle}}" is due soon',
        messageTemplate: 'Reminder: "{{assignmentTitle}}" is due on {{dueDate}}. Don\'t forget to submit!',
        variables: ['assignmentTitle', 'dueDate'],
        channels: ['in_app', 'push', 'email'],
        priority: 'high',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Grade Posted',
        type: 'grade_posted',
        titleTemplate: 'Your grade for "{{assignmentTitle}}" is ready',
        messageTemplate: 'You received {{grade}} on "{{assignmentTitle}}". {{comment}}',
        variables: ['assignmentTitle', 'grade', 'comment'],
        channels: ['in_app', 'push', 'email'],
        priority: 'high',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Announcement',
        type: 'announcement',
        titleTemplate: 'New announcement: {{announcementTitle}}',
        messageTemplate: '{{senderName}} posted a new announcement: {{announcementPreview}}',
        variables: ['senderName', 'announcementTitle', 'announcementPreview'],
        channels: ['in_app', 'push', 'email'],
        priority: 'normal',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Quiz Available',
        type: 'quiz_available',
        titleTemplate: 'New quiz available: {{quizTitle}}',
        messageTemplate: 'A new quiz "{{quizTitle}}" is now available in {{classroomName}}. Due: {{dueDate}}',
        variables: ['quizTitle', 'classroomName', 'dueDate'],
        channels: ['in_app', 'push', 'email'],
        priority: 'normal',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Study Reminder',
        type: 'study_reminder',
        titleTemplate: 'Time to study: {{topic}}',
        messageTemplate: 'Your scheduled study reminder for "{{topic}}" is here. Keep up the great work!',
        variables: ['topic'],
        channels: ['in_app', 'push'],
        priority: 'low',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Achievement Unlocked',
        type: 'achievement',
        titleTemplate: 'Achievement Unlocked!',
        messageTemplate: 'Congratulations! You\'ve earned the "{{achievementName}}" badge for {{achievementReason}}',
        variables: ['achievementName', 'achievementReason'],
        channels: ['in_app', 'push', 'email'],
        priority: 'normal',
        isSystem: true,
        isActive: true
      },
      {
        name: 'Welcome',
        type: 'welcome',
        subject: 'Welcome to {{classroomName}}!',
        titleTemplate: 'Welcome to {{classroomName}}!',
        messageTemplate: 'Hello {{userName}}! You\'ve joined {{classroomName}}. Explore the channels and start collaborating with your classmates!',
        variables: ['userName', 'classroomName'],
        channels: ['in_app', 'email'],
        priority: 'normal',
        isSystem: true,
        isActive: true
      }
    ];

    defaultTemplates.forEach(template => {
      const id = `TEMPLATE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      this.templates.set(id, {
        ...template,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.notifications = new Map(Object.entries(data.notifications || {}));
        this.userNotifications = new Map(Object.entries(data.userNotifications || {}));
        this.templates = new Map(Object.entries(data.templates || {}));
        this.preferences = new Map(Object.entries(data.preferences || {}));
        this.batches = new Map(Object.entries(data.batches || {}));
        this.scheduledNotifications = new Map(Object.entries(data.scheduled || {}));
        this.notificationGroups = new Map(Object.entries(data.groups || {}));
        this.notificationAnalytics = new Map(Object.entries(data.analytics || {}));
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        notifications: Object.fromEntries(this.notifications),
        userNotifications: Object.fromEntries(this.userNotifications),
        templates: Object.fromEntries(this.templates),
        preferences: Object.fromEntries(this.preferences),
        batches: Object.fromEntries(this.batches),
        scheduled: Object.fromEntries(this.scheduledNotifications),
        groups: Object.fromEntries(this.notificationGroups),
        analytics: Object.fromEntries(this.notificationAnalytics)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  private startNotificationProcessor(): void {
    setInterval(() => {
      this.processNotificationQueue();
    }, this.config.batchIntervalMinutes! * 60 * 1000);

    setInterval(() => {
      this.processScheduledNotifications();
    }, 60000);
  }

  private processNotificationQueue(): void {
    if (!this.config.enableNotificationBatching) return;

    const queuedNotifications = this.notificationQueue.splice(0, this.config.maxNotificationsPerBatch!);
    queuedNotifications.forEach(notificationId => {
      const notification = this.notifications.get(notificationId);
      if (notification) {
        this.deliverNotification(notification);
      }
    });
  }

  private processScheduledNotifications(): void {
    const now = new Date().getTime();

    this.scheduledNotifications.forEach((scheduled, id) => {
      if (scheduled.status === 'scheduled' && new Date(scheduled.scheduledFor).getTime() <= now) {
        this.sendNotification(scheduled.notification as any);
        scheduled.status = 'sent';
        this.saveToStorage();
      }
    });
  }

  createNotification(
    type: NotificationType,
    recipientId: string,
    senderId: string,
    senderName: string,
    title: string,
    message: string,
    options?: {
      priority?: NotificationPriority;
      classroomId?: string;
      channelId?: string;
      messageId?: string;
      resourceId?: string;
      resourceType?: string;
      link?: string;
      actions?: NotificationAction[];
      metadata?: Record<string, any>;
      channels?: DeliveryChannel[];
      expiresIn?: number;
      sendNow?: boolean;
    }
  ): Notification {
    const preferences = this.getPreferences(recipientId);

    if (!preferences.enabled) {
      throw new Error('Notifications are disabled for this user');
    }

    const notification: Notification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      message,
      priority: options?.priority || 'normal',
      senderId,
      senderName,
      recipientId,
      classroomId: options?.classroomId,
      channelId: options?.channelId,
      messageId: options?.messageId,
      resourceId: options?.resourceId,
      resourceType: options?.resourceType,
      link: options?.link,
      actions: options?.actions,
      metadata: options?.metadata,
      status: 'pending',
      read: false,
      delivered: false,
      deliveryChannels: options?.channels || this.getDefaultChannels(preferences),
      sentAt: new Date().toISOString(),
      expiresAt: options?.expiresIn
        ? new Date(Date.now() + options?.expiresIn * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + this.config.defaultExpirationHours! * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notifications.set(notification.id, notification);

    const userNotifs = this.userNotifications.get(recipientId) || [];
    userNotifs.push(notification.id);
    this.userNotifications.set(recipientId, userNotifs);

    if (this.config.enableNotificationAnalytics) {
      this.initializeAnalytics(notification.id);
    }

    this.saveToStorage();

    if (options?.sendNow || !this.config.enableNotificationBatching) {
      this.deliverNotification(notification);
    } else {
      this.notificationQueue.push(notification.id);
      notification.status = 'queued';
    }

    this.emit('notificationCreated', notification);
    return notification;
  }

  createFromTemplate(
    templateId: string,
    recipientId: string,
    variables: Record<string, string>,
    options?: {
      senderId?: string;
      senderName?: string;
      priority?: NotificationPriority;
      channels?: DeliveryChannel[];
      sendNow?: boolean;
    }
  ): Notification | undefined {
    const template = this.templates.get(templateId);
    if (!template || !template.isActive) return undefined;

    const title = this.interpolateTemplate(template.titleTemplate, variables);
    const message = this.interpolateTemplate(template.messageTemplate, variables);
    const subject = template.subject ? this.interpolateTemplate(template.subject, variables) : undefined;

    return this.createNotification(
      template.type,
      recipientId,
      options?.senderId || 'system',
      options?.senderName || 'System',
      subject || title,
      message,
      {
        priority: options?.priority || template.priority,
        channels: options?.channels || template.channels,
        sendNow: options?.sendNow
      }
    );
  }

  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  }

  private getDefaultChannels(preferences: NotificationPreferences): DeliveryChannel[] {
    const channels: DeliveryChannel[] = [];
    if (preferences.channels.inApp && this.config.enableInAppNotifications) {
      channels.push('in_app');
    }
    if (preferences.channels.push && this.config.enablePushNotifications) {
      channels.push('push');
    }
    if (preferences.channels.email && this.config.enableEmailNotifications) {
      channels.push('email');
    }
    return channels;
  }

  private initializeAnalytics(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    this.notificationAnalytics.set(notificationId, {
      notificationId,
      sentAt: notification.sentAt,
      clickThroughRate: false
    });
  }

  private deliverNotification(notification: Notification): void {
    notification.status = 'sent';

    this.emit('notificationSent', notification);
    this.emit(`notification:${notification.type}`, notification);
    this.saveToStorage();
  }

  getNotification(notificationId: string): Notification | undefined {
    return this.notifications.get(notificationId);
  }

  getUserNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: NotificationType[];
    }
  ): Notification[] {
    let notificationIds = this.userNotifications.get(userId) || [];
    let notifications = notificationIds.map(id => this.notifications.get(id)).filter((n): n is Notification => n !== undefined);

    if (options?.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (options?.type && options.type.length > 0) {
      notifications = notifications.filter(n => options.type!.includes(n.type));
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.offset) {
      notifications = notifications.slice(options.offset);
    }

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  getNotifications(filter: NotificationFilter): Notification[] {
    let notificationIds = this.userNotifications.get(filter.userId) || [];
    let notifications = notificationIds.map(id => this.notifications.get(id)).filter((n): n is Notification => n !== undefined);

    if (filter.types && filter.types.length > 0) {
      notifications = notifications.filter(n => filter.types!.includes(n.type));
    }

    if (filter.priority && filter.priority.length > 0) {
      notifications = notifications.filter(n => filter.priority!.includes(n.priority));
    }

    if (filter.classroomId) {
      notifications = notifications.filter(n => n.classroomId === filter.classroomId);
    }

    if (filter.channelId) {
      notifications = notifications.filter(n => n.channelId === filter.channelId);
    }

    if (filter.read !== undefined) {
      notifications = notifications.filter(n => n.read === filter.read);
    }

    if (filter.startDate) {
      notifications = notifications.filter(n => n.createdAt >= filter.startDate!);
    }

    if (filter.endDate) {
      notifications = notifications.filter(n => n.createdAt <= filter.endDate!);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      notifications = notifications.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';

    notifications.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return notifications;
  }

  getUnreadCount(userId: string): number {
    const notifications = this.getUserNotifications(userId, { unreadOnly: true });
    return notifications.length;
  }

  getUnreadByType(userId: string): Record<NotificationType, number> {
    const notifications = this.getUserNotifications(userId, { unreadOnly: true });
    const byType: Record<NotificationType, number> = {} as Record<NotificationType, number>;

    notifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return byType;
  }

  markAsRead(notificationId: string, userId?: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    if (userId && notification.recipientId !== userId) return false;

    notification.read = true;
    notification.readAt = new Date().toISOString();
    notification.updatedAt = new Date().toISOString();

    if (this.config.enableNotificationAnalytics) {
      const analytics = this.notificationAnalytics.get(notificationId);
      if (analytics) {
        analytics.readAt = notification.readAt;
        analytics.readTime = new Date(notification.readAt).getTime() - new Date(notification.sentAt).getTime();
      }
    }

    this.saveToStorage();
    this.emit('notificationRead', notification);
    return true;
  }

  markAsUnread(notificationId: string, userId?: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    if (userId && notification.recipientId !== userId) return false;

    notification.read = false;
    notification.readAt = undefined;
    notification.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.emit('notificationUnread', notification);
    return true;
  }

  markAllAsRead(userId: string, options?: { type?: NotificationType[]; classroomId?: string }): number {
    const notifications = this.getUserNotifications(userId, { unreadOnly: true });
    let markedCount = 0;

    notifications.forEach(notification => {
      if (options?.type && !options.type.includes(notification.type)) return;
      if (options?.classroomId && notification.classroomId !== options.classroomId) return;

      notification.read = true;
      notification.readAt = new Date().toISOString();
      notification.updatedAt = new Date().toISOString();
      markedCount++;
    });

    if (markedCount > 0) {
      this.saveToStorage();
      this.emit('allNotificationsRead', { userId, count: markedCount });
    }

    return markedCount;
  }

  deleteNotification(notificationId: string, userId?: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    if (userId && notification.recipientId !== userId) return false;

    const userNotifs = this.userNotifications.get(notification.recipientId) || [];
    const index = userNotifs.indexOf(notificationId);
    if (index > -1) {
      userNotifs.splice(index, 1);
      this.userNotifications.set(notification.recipientId, userNotifs);
    }

    this.notifications.delete(notificationId);
    this.notificationAnalytics.delete(notificationId);

    this.saveToStorage();
    this.emit('notificationDeleted', { notificationId, userId: notification.recipientId });
    return true;
  }

  deleteUserNotifications(userId: string, options?: { olderThan?: string; type?: NotificationType[] }): number {
    const userNotifs = this.userNotifications.get(userId) || [];
    let deletedCount = 0;

    const toDelete = userNotifs.filter(notifId => {
      const notification = this.notifications.get(notifId);
      if (!notification) return true;

      if (options?.olderThan && notification.createdAt >= options.olderThan) return false;
      if (options?.type && !options.type.includes(notification.type)) return false;

      return true;
    });

    toDelete.forEach(notifId => {
      this.notifications.delete(notifId);
      this.notificationAnalytics.delete(notifId);
      deletedCount++;
    });

    const remaining = userNotifs.filter(id => !toDelete.includes(id));
    this.userNotifications.set(userId, remaining);

    if (deletedCount > 0) {
      this.saveToStorage();
      this.emit('notificationsDeleted', { userId, count: deletedCount });
    }

    return deletedCount;
  }

  createTemplate(template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): NotificationTemplate {
    const id = `TEMPLATE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTemplate: NotificationTemplate = {
      ...template,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.templates.set(id, newTemplate);
    this.saveToStorage();

    this.emit('templateCreated', newTemplate);
    return newTemplate;
  }

  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  getTemplatesByType(type: NotificationType): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type && t.isActive);
  }

  getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  updateTemplate(templateId: string, updates: Partial<Omit<NotificationTemplate, 'id' | 'isSystem'>>): NotificationTemplate | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    Object.assign(template, updates, { updatedAt: new Date().toISOString() });
    this.saveToStorage();

    this.emit('templateUpdated', template);
    return template;
  }

  deleteTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template || template.isSystem) return false;

    this.templates.delete(templateId);
    this.saveToStorage();

    this.emit('templateDeleted', { templateId });
    return true;
  }

  getPreferences(userId: string): NotificationPreferences {
    let prefs = this.preferences.get(userId);

    if (!prefs) {
      prefs = this.createDefaultPreferences(userId);
      this.preferences.set(userId, prefs);
      this.saveToStorage();
    }

    return prefs;
  }

  private createDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      enabled: true,
      channels: {
        inApp: true,
        push: true,
        email: true,
        sms: false
      },
      types: {} as Record<NotificationType, { enabled: boolean; frequency: 'instant' | 'hourly' | 'daily' | 'weekly'; emailDigest: boolean }>,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      doNotDisturb: false,
      mobileSettings: {
        notificationsEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
        ledEnabled: false
      },
      desktopSettings: {
        notificationsEnabled: true,
        soundEnabled: true,
        showPreview: true
      },
      updatedAt: new Date().toISOString()
    };
  }

  updatePreferences(userId: string, updates: Partial<NotificationPreferences>): NotificationPreferences {
    const prefs = this.getPreferences(userId);
    Object.assign(prefs, updates, { updatedAt: new Date().toISOString() });
    this.preferences.set(userId, prefs);
    this.saveToStorage();

    this.emit('preferencesUpdated', prefs);
    return prefs;
  }

  updateChannelPreferences(userId: string, channel: 'inApp' | 'push' | 'email' | 'sms', enabled: boolean): NotificationPreferences {
    const prefs = this.getPreferences(userId);
    prefs.channels[channel] = enabled;
    prefs.updatedAt = new Date().toISOString();
    this.preferences.set(userId, prefs);
    this.saveToStorage();

    this.emit('preferencesUpdated', prefs);
    return prefs;
  }

  updateTypePreferences(
    userId: string,
    type: NotificationType,
    updates: { enabled?: boolean; frequency?: 'instant' | 'hourly' | 'daily' | 'weekly'; emailDigest?: boolean }
  ): NotificationPreferences {
    const prefs = this.getPreferences(userId);

    if (!prefs.types[type]) {
      prefs.types[type] = { enabled: true, frequency: 'instant', emailDigest: false };
    }

    Object.assign(prefs.types[type], updates);
    prefs.updatedAt = new Date().toISOString();
    this.preferences.set(userId, prefs);
    this.saveToStorage();

    this.emit('preferencesUpdated', prefs);
    return prefs;
  }

  enableDoNotDisturb(userId: string, durationMinutes?: number): void {
    const prefs = this.getPreferences(userId);
    prefs.doNotDisturb = true;
    prefs.updatedAt = new Date().toISOString();
    this.preferences.set(userId, prefs);
    this.saveToStorage();

    if (durationMinutes) {
      setTimeout(() => {
        this.disableDoNotDisturb(userId);
      }, durationMinutes * 60 * 1000);
    }

    this.emit('doNotDisturbEnabled', prefs);
  }

  disableDoNotDisturb(userId: string): void {
    const prefs = this.getPreferences(userId);
    prefs.doNotDisturb = false;
    prefs.updatedAt = new Date().toISOString();
    this.preferences.set(userId, prefs);
    this.saveToStorage();

    this.emit('doNotDisturbDisabled', prefs);
  }

  isInQuietHours(userId: string): boolean {
    const prefs = this.getPreferences(userId);

    if (!prefs.quietHours.enabled) return false;

    const now = new Date();
    const [startHour, startMin] = prefs.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = prefs.quietHours.endTime.split(':').map(Number);

    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour * 60 + currentMin;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  scheduleNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>,
    scheduledFor: string
  ): ScheduledNotification | undefined {
    if (!this.config.enableNotificationScheduling) return undefined;

    const scheduled: ScheduledNotification = {
      id: `SCHED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      notification: notification as any,
      scheduledFor,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    this.scheduledNotifications.set(scheduled.id, scheduled);
    this.saveToStorage();

    this.emit('notificationScheduled', scheduled);
    return scheduled;
  }

  cancelScheduledNotification(scheduledId: string): boolean {
    const scheduled = this.scheduledNotifications.get(scheduledId);
    if (!scheduled || scheduled.status !== 'scheduled') return false;

    scheduled.status = 'cancelled';
    this.saveToStorage();

    this.emit('notificationCancelled', { scheduledId });
    return true;
  }

  getScheduledNotifications(userId: string): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values())
      .filter(s => s.notification.recipientId === userId && s.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());
  }

  createGroup(userId: string, name: string, filter: NotificationFilter): NotificationGroup {
    const group: NotificationGroup = {
      id: `GROUP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      name,
      filter,
      collapsed: false,
      notificationIds: [],
      lastNotificationAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.notificationGroups.set(group.id, group);
    this.saveToStorage();

    this.emit('groupCreated', group);
    return group;
  }

  getGroup(groupId: string): NotificationGroup | undefined {
    return this.notificationGroups.get(groupId);
  }

  getUserGroups(userId: string): NotificationGroup[] {
    return Array.from(this.notificationGroups.values())
      .filter(g => g.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  refreshGroupNotifications(groupId: string): void {
    const group = this.notificationGroups.get(groupId);
    if (!group) return;

    const notifications = this.getNotifications({ ...group.filter, userId: group.userId });
    group.notificationIds = notifications.slice(0, 50).map(n => n.id);
    group.lastNotificationAt = new Date().toISOString();

    this.saveToStorage();
    this.emit('groupRefreshed', group);
  }

  toggleGroupCollapse(groupId: string): boolean {
    const group = this.notificationGroups.get(groupId);
    if (!group) return false;

    group.collapsed = !group.collapsed;
    this.saveToStorage();

    this.emit('groupToggled', group);
    return true;
  }

  deleteGroup(groupId: string): boolean {
    const deleted = this.notificationGroups.delete(groupId);
    if (deleted) {
      this.saveToStorage();
      this.emit('groupDeleted', { groupId });
    }
    return deleted;
  }

  generateDigest(userId: string, period: 'hourly' | 'daily' | 'weekly'): NotificationDigest | undefined {
    const preferences = this.getPreferences(userId);
    if (!preferences.enabled) return undefined;

    let notifications: Notification[] = [];
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'hourly':
        periodStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'daily':
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const userNotifs = this.userNotifications.get(userId) || [];
    notifications = userNotifs
      .map(id => this.notifications.get(id))
      .filter((n): n is Notification => n !== undefined && new Date(n.createdAt) >= periodStart && !n.read)
      .slice(0, 20);

    if (notifications.length === 0) return undefined;

    const digest: NotificationDigest = {
      userId,
      period,
      notifications: notifications.map(n => n.id),
      generatedAt: new Date().toISOString(),
      subject: this.getDigestSubject(notifications, period),
      summary: this.getDigestSummary(notifications)
    };

    notifications.forEach(n => {
      this.markAsRead(n.id);
    });

    this.emit('digestGenerated', digest);
    return digest;
  }

  private getDigestSubject(notifications: Notification[], period: string): string {
    const count = notifications.length;
    const periodStr = period === 'hourly' ? 'hour' : period === 'daily' ? 'day' : 'week';
    return `You have ${count} notification${count !== 1 ? 's' : ''} this ${periodStr}`;
  }

  private getDigestSummary(notifications: Notification[]): string {
    const byType: Record<string, number> = {};
    notifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    const parts: string[] = [];
    Object.entries(byType).forEach(([type, count]) => {
      const typeName = type.replace(/_/g, ' ');
      parts.push(`${count} ${typeName}`);
    });

    return parts.join(', ');
  }

  recordClick(notificationId: string): void {
    const analytics = this.notificationAnalytics.get(notificationId);
    if (analytics) {
      analytics.clickThroughRate = true;
      this.saveToStorage();
      this.emit('notificationClicked', { notificationId });
    }
  }

  getNotificationAnalytics(notificationId: string): NotificationAnalytics | undefined {
    return this.notificationAnalytics.get(notificationId);
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

  sendMessageNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    channelName: string,
    messagePreview: string,
    messageId: string
  ): Notification {
    return this.createNotification(
      'new_message',
      recipientId,
      senderId,
      senderName,
      `New message from ${senderName}`,
      `${senderName}: ${messagePreview}`,
      { messageId, metadata: { channelName } }
    );
  }

  sendMentionNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    channelName: string,
    messagePreview: string,
    messageId: string,
    channelId: string
  ): Notification {
    return this.createNotification(
      'mention',
      recipientId,
      senderId,
      senderName,
      `${senderName} mentioned you`,
      `${senderName} mentioned you in ${channelName}: ${messagePreview}`,
      { priority: 'high', messageId, channelId, metadata: { channelName } }
    );
  }

  sendAssignmentDueNotification(
    recipientId: string,
    assignmentTitle: string,
    dueDate: string
  ): Notification {
    return this.createNotification(
      'assignment_due',
      recipientId,
      'system',
      'Classroom',
      `Assignment "${assignmentTitle}" is due soon`,
      `Reminder: "${assignmentTitle}" is due on ${dueDate}. Don't forget to submit!`,
      { priority: 'high' }
    );
  }

  sendGradePostedNotification(
    recipientId: string,
    assignmentTitle: string,
    grade: string,
    comment?: string
  ): Notification {
    return this.createNotification(
      'grade_posted',
      recipientId,
      'system',
      'Classroom',
      `Your grade for "${assignmentTitle}" is ready`,
      `You received ${grade} on "${assignmentTitle}"${comment ? `. ${comment}` : ''}`,
      { priority: 'high' }
    );
  }

  sendAnnouncementNotification(
    recipientId: string,
    senderId: string,
    senderName: string,
    announcementTitle: string,
    announcementPreview: string,
    classroomId: string,
    link?: string
  ): Notification {
    return this.createNotification(
      'announcement',
      recipientId,
      senderId,
      senderName,
      `New announcement: ${announcementTitle}`,
      `${senderName}: ${announcementPreview}`,
      { classroomId, link }
    );
  }

  sendStudyReminderNotification(
    recipientId: string,
    topic: string
  ): Notification {
    return this.createNotification(
      'study_reminder',
      recipientId,
      'system',
      'Study Assistant',
      `Time to study: ${topic}`,
      `Your scheduled study reminder for "${topic}" is here. Keep up the great work!`,
      { priority: 'low' }
    );
  }

  getStats(): {
    totalNotifications: number;
    unreadCount: number;
    templatesCount: number;
    scheduledCount: number;
    byType: Record<string, number>;
  } {
    const allNotifications = Array.from(this.notifications.values());
    const unreadCount = allNotifications.filter(n => !n.read).length;

    const byType: Record<string, number> = {};
    allNotifications.forEach(n => {
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      totalNotifications: allNotifications.length,
      unreadCount,
      templatesCount: this.templates.size,
      scheduledCount: Array.from(this.scheduledNotifications.values()).filter(s => s.status === 'scheduled').length,
      byType
    };
  }
}

export default NotificationEngine;
