/**
 * ClassroomMember.ts
 *
 * Classroom member model for managing participants.
 */

export interface ClassroomMember {
  id: string;
  userId: string;
  classroomId: string;
  name: string;
  email: string;
  avatar?: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  lastActive: string;
  permissions: MemberPermissions;
  stats: MemberStats;
  settings: MemberSettings;
  presence: PresenceInfo;
  unreadMessages: number;
  unreadChannels: string[];
}

export type MemberRole = 'teacher' | 'student' | 'ta' | 'assistant';
export type MemberStatus = 'active' | 'inactive' | 'banned' | 'pending';

export interface MemberPermissions {
  canPostMessages: boolean;
  canCreateChannels: boolean;
  canDeleteMessages: boolean;
  canPinMessages: boolean;
  canManageMembers: boolean;
  canEditClassroom: boolean;
  canShareMedia: boolean;
  canUseVoiceNotes: boolean;
  canUseAIAssistant: boolean;
  canExportData: boolean;
}

export interface MemberStats {
  messagesSent: number;
  mediaShared: number;
  voiceNotesSent: number;
  participationScore: number;
  lastContribution: string;
  streakDays: number;
  avgResponseTime: number;
}

export interface MemberSettings {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
}

export interface PresenceInfo {
  status: PresenceStatus;
  lastSeen: string;
  isTyping: boolean;
  typingChannelId?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export function createMember(
  userId: string,
  classroomId: string,
  name: string,
  email: string,
  role: MemberRole
): ClassroomMember {
  const now = new Date().toISOString();
  return {
    id: `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId,
    classroomId,
    name,
    email,
    role,
    status: 'active',
    joinedAt: now,
    lastActive: now,
    permissions: getDefaultPermissions(role),
    stats: { messagesSent: 0, mediaShared: 0, voiceNotesSent: 0, participationScore: 0, lastContribution: '', streakDays: 0, avgResponseTime: 0 },
    settings: { notificationsEnabled: true, emailNotifications: true, soundEnabled: true, desktopNotifications: true, showOnlineStatus: true, showReadReceipts: true },
    presence: { status: 'offline', lastSeen: now, isTyping: false },
    unreadMessages: 0,
    unreadChannels: []
  };
}

function getDefaultPermissions(role: MemberRole): MemberPermissions {
  const base: MemberPermissions = { canPostMessages: true, canCreateChannels: false, canDeleteMessages: false, canPinMessages: false, canManageMembers: false, canEditClassroom: false, canShareMedia: true, canUseVoiceNotes: true, canUseAIAssistant: true, canExportData: false };
  if (role === 'teacher') return { ...base, canCreateChannels: true, canDeleteMessages: true, canPinMessages: true, canManageMembers: true, canEditClassroom: true, canExportData: true };
  if (role === 'ta') return { ...base, canCreateChannels: true, canDeleteMessages: true, canPinMessages: true, canManageMembers: true, canExportData: true };
  return base;
}

export default ClassroomMember;
