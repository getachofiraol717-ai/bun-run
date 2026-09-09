/**
 * ClassroomProvider.ts
 *
 * Interface for classroom management providers.
 */

import { Classroom, Channel, ClassroomMember, ClassroomSession } from '../models';

export interface ClassroomProviderConfig {
  maxClassrooms?: number;
  maxMembersPerClassroom?: number;
  maxChannelsPerClassroom?: number;
  enableAnalytics?: boolean;
  enableModeration?: boolean;
  enableSessions?: boolean;
  defaultSettings?: Partial<ClassroomSettings>;
}

export interface ClassroomSettings {
  allowStudentMessages: boolean;
  allowStudentChannels: boolean;
  requireApproval: boolean;
  enableTypingIndicators: boolean;
  enableReadReceipts: boolean;
  enableReactions: boolean;
  enableThreads: boolean;
  allowFileSharing: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  enableVoiceNotes: boolean;
  maxVoiceNoteDuration: number;
  enableAIAssistant: boolean;
  enableAnnouncements: boolean;
  requireTopicForChannels: boolean;
}

export interface ClassroomListener {
  onClassroomCreated?: (classroom: Classroom) => void;
  onClassroomUpdated?: (classroom: Classroom) => void;
  onClassroomDeleted?: (classroomId: string) => void;
  onMemberAdded?: (classroomId: string, member: ClassroomMember) => void;
  onMemberRemoved?: (classroomId: string, memberId: string) => void;
  onMemberUpdated?: (classroomId: string, member: ClassroomMember) => void;
  onMemberRoleChanged?: (classroomId: string, memberId: string, newRole: string) => void;
  onChannelCreated?: (classroomId: string, channel: Channel) => void;
  onChannelDeleted?: (classroomId: string, channelId: string) => void;
  onChannelUpdated?: (classroomId: string, channel: Channel) => void;
  onSessionStarted?: (classroomId: string, session: ClassroomSession) => void;
  onSessionEnded?: (classroomId: string, sessionId: string) => void;
  onSettingsChanged?: (classroomId: string, settings: Partial<ClassroomSettings>) => void;
  onArchived?: (classroomId: string) => void;
  onUnarchived?: (classroomId: string) => void;
}

export interface ClassroomProvider {
  // Configuration
  configure(config: ClassroomProviderConfig): void;
  getConfig(): ClassroomProviderConfig;

  // Classroom CRUD
  createClassroom(
    name: string,
    description: string,
    teacherId: string,
    teacherName: string,
    teacherEmail: string,
    subject?: string,
    gradeLevel?: string
  ): Promise<Classroom>;

  getClassroom(classroomId: string): Promise<Classroom | null>;
  getAllClassrooms(): Promise<Classroom[]>;
  getClassroomsForUser(userId: string): Promise<Classroom[]>;
  getClassroomsByTeacher(teacherId: string): Promise<Classroom[]>;

  updateClassroom(
    classroomId: string,
    updates: {
      name?: string;
      description?: string;
      subject?: string;
      gradeLevel?: string;
      settings?: Partial<ClassroomSettings>;
      isArchived?: boolean;
    }
  ): Promise<Classroom | null>;

  deleteClassroom(classroomId: string): Promise<boolean>;
  archiveClassroom(classroomId: string): Promise<boolean>;
  unarchiveClassroom(classroomId: string): Promise<boolean>;
  getArchivedClassrooms(): Promise<Classroom[]>;

  // Member Management
  addMember(
    classroomId: string,
    userId: string,
    name: string,
    email: string,
    role: 'teacher' | 'student' | 'ta' | 'assistant'
  ): Promise<boolean>;

  removeMember(classroomId: string, memberId: string): Promise<boolean>;
  updateMemberRole(
    classroomId: string,
    memberId: string,
    newRole: 'teacher' | 'student' | 'ta' | 'assistant'
  ): Promise<boolean>;

  updateMemberSettings(
    classroomId: string,
    memberId: string,
    settings: {
      notificationsEnabled?: boolean;
      emailNotifications?: boolean;
      soundEnabled?: boolean;
      desktopNotifications?: boolean;
      showOnlineStatus?: boolean;
      showReadReceipts?: boolean;
    }
  ): Promise<boolean>;

  updateMemberPresence(
    classroomId: string,
    memberId: string,
    presence: {
      status?: 'online' | 'offline' | 'away' | 'busy';
      lastSeen?: string;
      isTyping?: boolean;
    }
  ): Promise<boolean>;

  getMember(classroomId: string, memberId: string): Promise<ClassroomMember | null>;
  getClassroomMembers(classroomId: string): Promise<ClassroomMember[]>;
  getOnlineMembers(classroomId: string): Promise<ClassroomMember[]>;

  // Channel Management
  getChannelManager(): any; // ChannelManager type

  // Settings
  updateSettings(
    classroomId: string,
    settings: Partial<ClassroomSettings>
  ): Promise<boolean>;
  getSettings(classroomId: string): Promise<ClassroomSettings | null>;

  // Search
  searchClassrooms(query: string): Promise<Classroom[]>;
  searchMembers(classroomId: string, query: string): Promise<ClassroomMember[]>;

  // Analytics
  updateAnalytics(
    classroomId: string,
    analytics: {
      totalMessages?: number;
      activeMembers?: number;
      engagementScore?: number;
      averageResponseTime?: number;
      mostActiveHour?: number;
    }
  ): Promise<boolean>;
  getAnalytics(classroomId: string): Promise<ClassroomAnalytics | null>;

  // Sessions
  createSession(
    classroomId: string,
    hostId: string,
    hostName: string,
    title: string,
    type: 'live' | 'study_group' | 'office_hours' | 'recording' | 'collaboration'
  ): Promise<ClassroomSession | null>;

  endSession(classroomId: string, sessionId: string): Promise<boolean>;
  getActiveSession(classroomId: string): Promise<ClassroomSession | null>;

  // Listeners
  subscribe(listener: ClassroomListener): () => void;

  // Initialization
  initialize(): Promise<void>;
  isInitialized(): boolean;
}

export interface ClassroomAnalytics {
  totalMessages: number;
  totalChannels: number;
  totalMediaShared: number;
  totalVoiceNotes: number;
  activeMembers: number;
  engagementScore: number;
  averageResponseTime: number;
  mostActiveHour: number;
  lastActivityAt: string;
  memberActivity: Record<string, {
    messagesSent: number;
    mediaShared: number;
    voiceNotesSent: number;
    lastActive: string;
    participationScore: number;
  }>;
}

export interface MemberPermission {
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

export default ClassroomProvider;
