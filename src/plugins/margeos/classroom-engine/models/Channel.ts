/**
 * Channel.ts
 *
 * Model for Channel entity with types, members, and settings.
 */

export type ChannelType =
  | 'general'
  | 'announcements'
  | 'subject'
  | 'assignment'
  | 'project'
  | 'study_group'
  | 'qna'
  | 'resources'
  | 'discussion'
  | 'voice'
  | 'direct'
  | 'group';

export interface ChannelPermissions {
  canView: boolean;
  canPost: boolean;
  canReact: boolean;
  canEditOwn: boolean;
  canDeleteOwn: boolean;
  canPin: boolean;
  canManage: boolean;
}

export interface ChannelStats {
  totalMessages: number;
  totalMembers: number;
  totalMedia: number;
  totalVoiceNotes: number;
  lastActivity: string;
}

export interface ChannelSettings {
  isPrivate: boolean;
  requireApproval: boolean;
  allowMedia: boolean;
  allowVoiceNotes: boolean;
  allowLinks: boolean;
  allowMentions: boolean;
  slowMode?: number; // seconds between messages
  maxMessageLength: number;
}

export interface ChannelMember {
  id: string;
  odcupy;
  userId: string;
  name: string;
  role: 'admin' | 'moderator' | 'member';
  isMuted: boolean;
  isHidden: boolean;
  notificationsEnabled: boolean;
  joinedAt: string;
}

export interface Channel {
  id: string;
  classroomId: string;
  name: string;
  description?: string;
  type: ChannelType;
  icon?: string;
  position: number;
  isPrivate: boolean;
  isArchived: boolean;
  members: ChannelMember[];
  memberCount: number;
  pinnedMessages: string[];
  pinnedCount: number;
  permissions: ChannelPermissions;
  settings: ChannelSettings;
  stats: ChannelStats;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Factory functions
 */

export function getDefaultPermissions(): ChannelPermissions {
  return {
    canView: true,
    canPost: true,
    canReact: true,
    canEditOwn: true,
    canDeleteOwn: true,
    canPin: false,
    canManage: false
  };
}

export function getTeacherPermissions(): ChannelPermissions {
  return {
    canView: true,
    canPost: true,
    canReact: true,
    canEditOwn: true,
    canDeleteOwn: true,
    canPin: true,
    canManage: true
  };
}

export function getChannelSettings(type: ChannelType, isPrivate: boolean = false): ChannelSettings {
  const baseSettings: ChannelSettings = {
    isPrivate,
    requireApproval: false,
    allowMedia: true,
    allowVoiceNotes: true,
    allowLinks: true,
    allowMentions: true,
    maxMessageLength: 10000
  };

  switch (type) {
    case 'announcements':
      return { ...baseSettings, allowVoiceNotes: false };
    case 'resources':
      return { ...baseSettings, allowVoiceNotes: false };
    case 'voice':
      return { ...baseSettings, allowMedia: false };
    case 'direct':
      return { ...baseSettings, isPrivate: true };
    default:
      return baseSettings;
  }
}

export function createChannel(
  classroomId: string,
  name: string,
  type: ChannelType,
  createdBy: string,
  description?: string,
  isPrivate: boolean = false
): Channel {
  return {
    id: `CHAN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    classroomId,
    name: name.toLowerCase().replace(/\s+/g, '-'),
    description,
    type,
    position: 0,
    isPrivate,
    isArchived: false,
    members: [],
    memberCount: 0,
    pinnedMessages: [],
    pinnedCount: 0,
    permissions: getDefaultPermissions(),
    settings: getChannelSettings(type, isPrivate),
    stats: {
      totalMessages: 0,
      totalMembers: 0,
      totalMedia: 0,
      totalVoiceNotes: 0,
      lastActivity: new Date().toISOString()
    },
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function pinMessage(channel: Channel, messageId: string): Channel {
  if (!channel.pinnedMessages.includes(messageId)) {
    channel.pinnedMessages.push(messageId);
    channel.pinnedCount = channel.pinnedMessages.length;
  }
  return channel;
}

export function unpinMessage(channel: Channel, messageId: string): Channel {
  const index = channel.pinnedMessages.indexOf(messageId);
  if (index > -1) {
    channel.pinnedMessages.splice(index, 1);
    channel.pinnedCount = channel.pinnedMessages.length;
  }
  return channel;
}

export function getChannelTypeName(type: ChannelType): string {
  const names: Record<ChannelType, string> = {
    general: 'General',
    announcements: 'Announcements',
    subject: 'Subject',
    assignment: 'Assignment',
    project: 'Project',
    study_group: 'Study Group',
    qna: 'Q&A',
    resources: 'Resources',
    discussion: 'Discussion',
    voice: 'Voice',
    direct: 'Direct Message',
    group: 'Group'
  };
  return names[type] || 'Channel';
}

export function getChannelTypeIcon(type: ChannelType): string {
  const icons: Record<ChannelType, string> = {
    general: 'hash',
    announcements: 'megaphone',
    subject: 'book',
    assignment: 'clipboard',
    project: 'folder',
    study_group: 'users',
    qna: 'help-circle',
    resources: 'paperclip',
    discussion: 'message-circle',
    voice: 'mic',
    direct: 'user',
    group: 'users'
  };
  return icons[type] || 'hash';
}
