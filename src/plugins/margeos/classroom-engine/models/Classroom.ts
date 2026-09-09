/**
 * Classroom.ts
 *
 * Model for Classroom entity with channels, members, and settings.
 */

export interface ClassroomSettings {
  allowMemberInvites: boolean;
  requireApproval: boolean;
  allowMemberMessages: boolean;
  allowVoiceNotes: boolean;
  allowFileSharing: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  enableAIAssistant: boolean;
  enableTypingIndicators: boolean;
  enableReadReceipts: boolean;
  enableMessageReactions: boolean;
  moderationLevel: 'none' | 'basic' | 'strict';
}

export interface ClassroomAnalytics {
  totalMessages: number;
  totalMediaShared: number;
  totalVoiceNotes: number;
  activeMembers: number;
  avgDailyActiveUsers: number;
  avgMessagesPerDay: number;
  topContributors: string[];
  peakHours: number[];
  lastUpdated: string;
}

export interface Classroom {
  id: string;
  name: string;
  description: string;
  subject?: string;
  gradeLevel?: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  coverImage?: string;
  avatar?: string;
  members: any[];
  memberCount: number;
  channels: any[];
  resources: any[];
  settings: ClassroomSettings;
  analytics: ClassroomAnalytics;
  isArchived: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomMember {
  id: string;
  userId: string;
  classroomId: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'ta' | 'assistant';
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  lastActive: string;
  permissions: MemberPermissions;
  stats: MemberStats;
  settings: MemberSettings;
  presence: PresenceInfo;
  unreadMessages: number;
  unreadChannels: string[];
}

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
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
  isTyping: boolean;
}

export interface ClassroomSession {
  id: string;
  classroomId: string;
  type: 'live' | 'recording' | 'breakout' | 'study_hall';
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  participants: SessionParticipant[];
  participantCount: number;
  maxParticipants?: number;
  settings: SessionSettings;
  analytics: SessionAnalytics;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface SessionParticipant {
  id: string;
  odcupy;
  userId: string;
  userName: string;
  joinedAt: string;
  leftAt?: string;
  duration: number;
  isHost: boolean;
  isActive: boolean;
  role: 'participant' | 'presenter' | 'moderator';
}

export interface SessionSettings {
  enableChat: boolean;
  enableVideo: boolean;
  enableScreenShare: boolean;
  enableRecording: boolean;
  enableBreakoutRooms: boolean;
  muteOnJoin: boolean;
  requireApproval: boolean;
}

export interface SessionAnalytics {
  totalDuration: number;
  avgParticipants: number;
  peakParticipants: number;
  totalMessages: number;
  totalReactions: number;
}

/**
 * Factory functions
 */

export function getDefaultSettings(): ClassroomSettings {
  return {
    allowMemberInvites: true,
    requireApproval: false,
    allowMemberMessages: true,
    allowVoiceNotes: true,
    allowFileSharing: true,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/msword'],
    enableAIAssistant: true,
    enableTypingIndicators: true,
    enableReadReceipts: true,
    enableMessageReactions: true,
    moderationLevel: 'basic'
  };
}

export function getDefaultAnalytics(): ClassroomAnalytics {
  return {
    totalMessages: 0,
    totalMediaShared: 0,
    totalVoiceNotes: 0,
    activeMembers: 0,
    avgDailyActiveUsers: 0,
    avgMessagesPerDay: 0,
    topContributors: [],
    peakHours: [],
    lastUpdated: new Date().toISOString()
  };
}

export function getDefaultPermissions(): MemberPermissions {
  return {
    canPostMessages: true,
    canCreateChannels: false,
    canDeleteMessages: false,
    canPinMessages: false,
    canManageMembers: false,
    canEditClassroom: false,
    canShareMedia: true,
    canUseVoiceNotes: true,
    canUseAIAssistant: true,
    canExportData: false
  };
}

export function createClassroom(
  name: string,
  description: string,
  teacherId: string,
  teacherName: string,
  teacherEmail: string,
  subject?: string,
  gradeLevel?: string
): Classroom {
  return {
    id: `CLASS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name,
    description,
    subject,
    gradeLevel,
    teacherId,
    teacherName,
    teacherEmail,
    members: [],
    memberCount: 0,
    channels: [],
    resources: [],
    settings: getDefaultSettings(),
    analytics: getDefaultAnalytics(),
    isArchived: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createClassroomMember(
  userId: string,
  classroomId: string,
  name: string,
  email: string,
  role: 'teacher' | 'student' | 'ta' | 'assistant'
): ClassroomMember {
  const isTeacher = role === 'teacher';

  return {
    id: `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    userId,
    classroomId,
    name,
    email,
    role,
    status: 'active',
    joinedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    permissions: isTeacher ? {
      ...getDefaultPermissions(),
      canCreateChannels: true,
      canDeleteMessages: true,
      canPinMessages: true,
      canManageMembers: true,
      canEditClassroom: true,
      canExportData: true
    } : getDefaultPermissions(),
    stats: {
      messagesSent: 0,
      mediaShared: 0,
      voiceNotesSent: 0,
      participationScore: 0,
      lastContribution: '',
      streakDays: 0,
      avgResponseTime: 0
    },
    settings: {
      notificationsEnabled: true,
      emailNotifications: true,
      soundEnabled: true,
      desktopNotifications: true,
      showOnlineStatus: true,
      showReadReceipts: true
    },
    presence: {
      status: 'offline',
      lastSeen: new Date().toISOString(),
      isTyping: false
    },
    unreadMessages: 0,
    unreadChannels: []
  };
}

export function createSession(
  classroomId: string,
  type: 'live' | 'recording' | 'breakout' | 'study_hall',
  title: string,
  hostId: string,
  hostName: string
): ClassroomSession {
  return {
    id: `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    classroomId,
    type,
    status: 'scheduled',
    title,
    hostId,
    hostName,
    participants: [],
    participantCount: 0,
    settings: {
      enableChat: true,
      enableVideo: true,
      enableScreenShare: true,
      enableRecording: false,
      enableBreakoutRooms: false,
      muteOnJoin: false,
      requireApproval: false
    },
    analytics: {
      totalDuration: 0,
      avgParticipants: 0,
      peakParticipants: 0,
      totalMessages: 0,
      totalReactions: 0
    },
    createdAt: new Date().toISOString()
  };
}
