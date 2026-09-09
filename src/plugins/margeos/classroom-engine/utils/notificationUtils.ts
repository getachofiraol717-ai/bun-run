// @ts-nocheck
/**
 * notificationUtils.ts
 *
 * Utility functions for notification operations.
 */

import { Notification, NotificationType, NotificationPriority } from '../models';

/**
 * Format notification time for display
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get notification type display name
 */
export function getNotificationTypeName(type: NotificationType): string {
  const typeNames: Record<NotificationType, string> = {
    message: 'New Message',
    mention: 'Mentioned You',
    reply: 'Reply',
    reaction: 'Reaction',
    channel: 'Channel Update',
    classroom: 'Classroom Update',
    assignment: 'Assignment',
    announcement: 'Announcement',
    member: 'Member Update',
    system: 'System',
    ai_recommendation: 'AI Recommendation',
    reminder: 'Reminder',
    due_date: 'Due Date',
    grade: 'Grade Posted',
    study_group: 'Study Group'
  };
  return typeNames[type] || type;
}

/**
 * Get notification priority level
 */
export function getNotificationPriority(type: NotificationType): NotificationPriority {
  const priorityMap: Record<NotificationType, NotificationPriority> = {
    mention: 'high',
    reply: 'medium',
    announcement: 'high',
    assignment: 'high',
    due_date: 'high',
    grade: 'high',
    message: 'medium',
    reaction: 'low',
    channel: 'low',
    classroom: 'medium',
    member: 'low',
    system: 'medium',
    ai_recommendation: 'medium',
    reminder: 'medium',
    study_group: 'low'
  };
  return priorityMap[type] || 'medium';
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const iconMap: Record<NotificationType, string> = {
    message: '💬',
    mention: '@',
    reply: '↩️',
    reaction: '👍',
    channel: '#',
    classroom: '🏫',
    assignment: '📝',
    announcement: '📢',
    member: '👤',
    system: '⚙️',
    ai_recommendation: '🤖',
    reminder: '⏰',
    due_date: '📅',
    grade: '✅',
    study_group: '👥'
  };
  return iconMap[type] || '🔔';
}

/**
 * Check if notification should be shown as badge
 */
export function shouldShowBadge(notification: Notification): boolean {
  if (notification.isRead) return false;
  if (notification.priority === 'high') return true;
  if (notification.type === 'mention' || notification.type === 'announcement') return true;
  return false;
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: NotificationType): string {
  const colorMap: Record<NotificationType, string> = {
    message: '#3b82f6', // blue
    mention: '#ef4444', // red
    reply: '#8b5cf6', // purple
    reaction: '#f59e0b', // amber
    channel: '#10b981', // green
    classroom: '#6366f1', // indigo
    assignment: '#ec4899', // pink
    announcement: '#f97316', // orange
    member: '#14b8a6', // teal
    system: '#64748b', // slate
    ai_recommendation: '#a855f7', // violet
    reminder: '#f59e0b', // amber
    due_date: '#ef4444', // red
    grade: '#22c55e', // green
    study_group: '#06b6d4' // cyan
  };
  return colorMap[type] || '#64748b';
}

/**
 * Filter notifications by type
 */
export function filterNotificationsByType(
  notifications: Notification[],
  types: NotificationType[]
): Notification[] {
  return notifications.filter(n => types.includes(n.type));
}

/**
 * Filter notifications by priority
 */
export function filterNotificationsByPriority(
  notifications: Notification[],
  priorities: NotificationPriority[]
): Notification[] {
  return notifications.filter(n => priorities.includes(n.priority));
}

/**
 * Group notifications by date
 */
export function groupNotificationsByDate(
  notifications: Notification[]
): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>();

  notifications.forEach(notification => {
    const date = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(notification);
  });

  return groups;
}

/**
 * Sort notifications by priority and time
 */
export function sortNotifications(
  notifications: Notification[],
  prioritizeUnread: boolean = true
): Notification[] {
  return [...notifications].sort((a, b) => {
    // Unread first if prioritizing
    if (prioritizeUnread) {
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
    }

    // High priority first
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    // Then by time (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Get notification summary text
 */
export function getNotificationSummary(notification: Notification): string {
  const maxLength = 100;
  if (notification.message.length <= maxLength) {
    return notification.message;
  }
  return notification.message.substring(0, maxLength).trim() + '...';
}

/**
 * Check if notification is actionable
 */
export function isActionableNotification(notification: Notification): boolean {
  return [
    'message',
    'reply',
    'mention',
    'assignment',
    'due_date',
    'grade',
    'study_group'
  ].includes(notification.type);
}

/**
 * Get notification action label
 */
export function getNotificationActionLabel(type: NotificationType): string {
  const actionLabels: Record<NotificationType, string> = {
    message: 'Reply',
    mention: 'View',
    reply: 'View Reply',
    reaction: 'View',
    channel: 'Open',
    classroom: 'View',
    assignment: 'View Assignment',
    announcement: 'Read More',
    member: 'View',
    system: 'View',
    ai_recommendation: 'Learn More',
    reminder: 'View',
    due_date: 'View',
    grade: 'View Grade',
    study_group: 'Join'
  };
  return actionLabels[type] || 'View';
}

/**
 * Batch mark notifications as read
 */
export function batchMarkAsRead(
  notifications: Notification[],
  maxCount: number = 50
): string[] {
  return notifications
    .filter(n => !n.isRead)
    .slice(0, maxCount)
    .map(n => n.id);
}

/**
 * Check if notification is still relevant (not too old)
 */
export function isNotificationRelevant(
  notification: Notification,
  maxAgeDays: number = 30
): boolean {
  const createdAt = new Date(notification.createdAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / 86400000);
  return diffDays < maxAgeDays;
}

/**
 * Generate unique notification ID
 */
export function generateNotificationId(): string {
  return `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create notification metadata
 */
export function createNotificationMetadata(
  notification: Partial<Notification>
): Record<string, any> {
  return {
    ...notification.metadata,
    generatedAt: new Date().toISOString(),
    source: 'classroom-engine'
  };
}

/**
 * Parse notification data for links
 */
export function parseNotificationLinks(notification: Notification): {
  classroomId?: string;
  channelId?: string;
  messageId?: string;
} {
  const data = notification.data || {};
  return {
    classroomId: data.classroomId,
    channelId: data.channelId,
    messageId: data.messageId
  };
}
