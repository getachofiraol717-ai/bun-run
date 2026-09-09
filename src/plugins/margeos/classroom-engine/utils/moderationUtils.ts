// @ts-nocheck
/**
 * moderationUtils.ts
 *
 * Utility functions for classroom moderation operations.
 */

import { ModerationAction, ModerationActionType } from '../engines/ModerationEngine';

/**
 * Format moderation action time for display
 */
export function formatModerationTime(timestamp: string): string {
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
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Get moderation action display name
 */
export function getModerationActionName(actionType: ModerationActionType): string {
  const actionNames: Record<ModerationActionType, string> = {
    warning: 'Warning Issued',
    mute: 'Member Muted',
    unmute: 'Member Unmuted',
    kick: 'Member Removed',
    ban: 'Member Banned',
    unban: 'Ban Lifted',
    message_deleted: 'Message Deleted',
    channel_locked: 'Channel Locked',
    channel_unlocked: 'Channel Unlocked',
    content_flagged: 'Content Flagged',
    report_handled: 'Report Resolved'
  };
  return actionNames[actionType] || actionType;
}

/**
 * Get moderation action icon
 */
export function getModerationActionIcon(actionType: ModerationActionType): string {
  const iconMap: Record<ModerationActionType, string> = {
    warning: '⚠️',
    mute: '🔇',
    unmute: '🔊',
    kick: '👢',
    ban: '🚫',
    unban: '✅',
    message_deleted: '🗑️',
    channel_locked: '🔒',
    channel_unlocked: '🔓',
    content_flagged: '🚩',
    report_handled: '📋'
  };
  return iconMap[actionType] || '⚙️';
}

/**
 * Get moderation action color
 */
export function getModerationActionColor(actionType: ModerationActionType): string {
  const colorMap: Record<ModerationActionType, string> = {
    warning: '#f59e0b', // amber
    mute: '#6366f1', // indigo
    unmute: '#10b981', // green
    kick: '#f97316', // orange
    ban: '#ef4444', // red
    unban: '#22c55e', // green
    message_deleted: '#64748b', // slate
    channel_locked: '#dc2626', // red
    channel_unlocked: '#16a34a', // green
    content_flagged: '#eab308', // yellow
    report_handled: '#8b5cf6' // violet
  };
  return colorMap[actionType] || '#64748b';
}

/**
 * Check if action requires notification to affected user
 */
export function requiresUserNotification(actionType: ModerationActionType): boolean {
  return [
    'warning',
    'mute',
    'unmute',
    'kick',
    'ban',
    'unban'
  ].includes(actionType);
}

/**
 * Check if action affects content
 */
export function affectsContent(actionType: ModerationActionType): boolean {
  return [
    'message_deleted',
    'content_flagged'
  ].includes(actionType);
}

/**
 * Check if action is reversible
 */
export function isReversibleAction(actionType: ModerationActionType): boolean {
  return [
    'unmute',
    'unban',
    'channel_unlocked',
    'report_handled'
  ].includes(actionType);
}

/**
 * Get inverse action type
 */
export function getInverseAction(actionType: ModerationActionType): ModerationActionType | null {
  const inverseMap: Record<ModerationActionType, ModerationActionType> = {
    mute: 'unmute',
    unmute: 'mute',
    ban: 'unban',
    unban: 'ban',
    channel_locked: 'channel_unlocked',
    channel_unlocked: 'channel_locked'
  };
  return inverseMap[actionType] || null;
}

/**
 * Group moderation actions by moderator
 */
export function groupActionsByModerator(
  actions: ModerationAction[]
): Map<string, ModerationAction[]> {
  const groups = new Map<string, ModerationAction[]>();

  actions.forEach(action => {
    if (!groups.has(action.moderatorId)) {
      groups.set(action.moderatorId, []);
    }
    groups.get(action.moderatorId)!.push(action);
  });

  return groups;
}

/**
 * Group moderation actions by target
 */
export function groupActionsByTarget(
  actions: ModerationAction[]
): Map<string, ModerationAction[]> {
  const groups = new Map<string, ModerationAction[]>();

  actions.forEach(action => {
    if (!groups.has(action.targetId)) {
      groups.set(action.targetId, []);
    }
    groups.get(action.targetId)!.push(action);
  });

  return groups;
}

/**
 * Group moderation actions by date
 */
export function groupActionsByDate(
  actions: ModerationAction[]
): Map<string, ModerationAction[]> {
  const groups = new Map<string, ModerationAction[]>();

  actions.forEach(action => {
    const date = new Date(action.timestamp);
    const dateKey = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(action);
  });

  return groups;
}

/**
 * Sort moderation actions by time
 */
export function sortModerationActions(
  actions: ModerationAction[],
  newestFirst: boolean = true
): ModerationAction[] {
  return [...actions].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return newestFirst ? timeB - timeA : timeA - timeB;
  });
}

/**
 * Get action summary text
 */
export function getActionSummary(action: ModerationAction): string {
  const targetName = action.targetName || 'Unknown User';

  switch (action.actionType) {
    case 'warning':
      return `Warning issued to ${targetName}`;
    case 'mute':
      return `${targetName} has been muted`;
    case 'unmute':
      return `${targetName} has been unmuted`;
    case 'kick':
      return `${targetName} has been removed`;
    case 'ban':
      return `${targetName} has been banned`;
    case 'unban':
      return `Ban lifted for ${targetName}`;
    case 'message_deleted':
      return `Message deleted in ${action.channelName || 'channel'}`;
    case 'channel_locked':
      return `${action.channelName || 'Channel'} has been locked`;
    case 'channel_unlocked':
      return `${action.channelName || 'Channel'} has been unlocked`;
    case 'content_flagged':
      return 'Content flagged for review';
    case 'report_handled':
      return 'Report has been resolved';
    default:
      return `Moderation action: ${action.actionType}`;
  }
}

/**
 * Check if moderator has required permissions
 */
export function hasModerationPermission(
  role: 'teacher' | 'student' | 'ta' | 'assistant'
): boolean {
  return ['teacher', 'ta'].includes(role);
}

/**
 * Get action severity level
 */
export function getActionSeverity(actionType: ModerationActionType): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap: Record<ModerationActionType, 'low' | 'medium' | 'high' | 'critical'> = {
    warning: 'low',
    unmute: 'low',
    channel_unlocked: 'low',
    message_deleted: 'medium',
    mute: 'medium',
    report_handled: 'medium',
    content_flagged: 'medium',
    channel_locked: 'high',
    kick: 'high',
    ban: 'critical',
    unban: 'low'
  };
  return severityMap[actionType] || 'medium';
}

/**
 * Generate moderation report
 */
export function generateModerationReport(
  actions: ModerationAction[],
  options?: {
    startDate?: string;
    endDate?: string;
    moderatorId?: string;
    classroomId?: string;
  }
): {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByModerator: Record<string, number>;
  actionsByTarget: Record<string, number>;
  severityBreakdown: Record<string, number>;
  dateRange: { start: string; end: string };
  generatedAt: string;
} {
  let filteredActions = [...actions];

  if (options?.startDate) {
    const start = new Date(options.startDate);
    filteredActions = filteredActions.filter(a => new Date(a.timestamp) >= start);
  }

  if (options?.endDate) {
    const end = new Date(options.endDate);
    filteredActions = filteredActions.filter(a => new Date(a.timestamp) <= end);
  }

  if (options?.moderatorId) {
    filteredActions = filteredActions.filter(a => a.moderatorId === options.moderatorId);
  }

  if (options?.classroomId) {
    filteredActions = filteredActions.filter(a => a.classroomId === options.classroomId);
  }

  const actionsByType: Record<string, number> = {};
  const actionsByModerator: Record<string, number> = {};
  const actionsByTarget: Record<string, number> = {};
  const severityBreakdown: Record<string, number> = {};

  filteredActions.forEach(action => {
    // Count by type
    actionsByType[action.actionType] = (actionsByType[action.actionType] || 0) + 1;

    // Count by moderator
    actionsByModerator[action.moderatorId] = (actionsByModerator[action.moderatorId] || 0) + 1;

    // Count by target
    if (action.targetId) {
      actionsByTarget[action.targetId] = (actionsByTarget[action.targetId] || 0) + 1;
    }

    // Count by severity
    const severity = getActionSeverity(action.actionType);
    severityBreakdown[severity] = (severityBreakdown[severity] || 0) + 1;
  });

  const dates = filteredActions.map(a => new Date(a.timestamp).getTime());
  const startDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : '';
  const endDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : '';

  return {
    totalActions: filteredActions.length,
    actionsByType,
    actionsByModerator,
    actionsByTarget,
    severityBreakdown,
    dateRange: { start: startDate, end: endDate },
    generatedAt: new Date().toISOString()
  };
}

/**
 * Check if content is appropriate
 */
export function checkContentAppropriateness(
  content: string,
  bannedWords: string[] = []
): {
  isAppropriate: boolean;
  foundBannedWords: string[];
  flaggedPatterns: string[];
} {
  const lowerContent = content.toLowerCase();
  const foundBannedWords: string[] = [];
  const flaggedPatterns: string[] = [];

  // Check for banned words
  bannedWords.forEach(word => {
    if (lowerContent.includes(word.toLowerCase())) {
      foundBannedWords.push(word);
    }
  });

  // Check for patterns (example patterns)
  const patterns = [
    /[A-Z]{10,}/g, // Excessive caps
    /(.)\1{4,}/g,  // Repeated characters
    /https?:\/\/[^\s]+\.[^\s]+/gi // URLs (could be flagged)
  ];

  patterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      flaggedPatterns.push(`Pattern ${index + 1}`);
    }
  });

  return {
    isAppropriate: foundBannedWords.length === 0 && flaggedPatterns.length === 0,
    foundBannedWords,
    flaggedPatterns
  };
}

/**
 * Generate moderation action ID
 */
export function generateModerationActionId(): string {
  return `MOD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create audit log entry
 */
export function createAuditLogEntry(
  action: ModerationAction,
  additionalInfo?: Record<string, any>
): {
  id: string;
  timestamp: string;
  action: ModerationAction;
  additionalInfo?: Record<string, any>;
} {
  return {
    id: `AUDIT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    additionalInfo
  };
}
