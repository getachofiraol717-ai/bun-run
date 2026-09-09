/**
 * ClassroomSession.ts
 *
 * Session model for classroom activities.
 */

export interface ClassroomSession {
  id: string;
  classroomId: string;
  channelId?: string;
  type: SessionType;
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  participants: SessionParticipant[];
  startedAt: string;
  endedAt?: string;
  status: SessionStatus;
  settings: SessionSettings;
  analytics: SessionAnalytics;
  recording?: SessionRecording;
  metadata: Record<string, any>;
}

export type SessionType = 'live' | 'study_group' | 'office_hours' | 'recording' | 'collaboration';
export type SessionStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface SessionParticipant {
  userId: string;
  name: string;
  avatar?: string;
  role: 'host' | 'participant' | 'observer';
  joinedAt: string;
  leftAt?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  handRaised: boolean;
  permissions: SessionPermissions;
}

export interface SessionPermissions {
  canSpeak: boolean;
  canShareScreen: boolean;
  canShareMedia: boolean;
  canPinMessage: boolean;
  canManageParticipants: boolean;
  canEndSession: boolean;
}

export interface SessionSettings {
  maxParticipants: number;
  isPublic: boolean;
  requireApproval: boolean;
  enableChat: boolean;
  enableReactions: boolean;
  enableRecording: boolean;
  enableBreakoutRooms: boolean;
  allowGuests: boolean;
  muteOnJoin: boolean;
  videoOnByDefault: boolean;
}

export interface SessionAnalytics {
  peakParticipants: number;
  totalMessages: number;
  totalDuration: number;
  engagementScore: number;
  participationRate: number;
  avgActiveTime: number;
}

export interface SessionRecording {
  id: string;
  url: string;
  duration: number;
  status: 'recording' | 'processing' | 'ready' | 'failed';
  startedAt: string;
  completedAt?: string;
  fileSize?: number;
  participantsCount: number;
}

export function createSession(
  classroomId: string,
  hostId: string,
  hostName: string,
  title: string,
  type: SessionType
): ClassroomSession {
  const now = new Date().toISOString();
  return {
    id: `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    classroomId,
    hostId,
    hostName,
    type,
    title,
    startedAt: now,
    status: 'active',
    participants: [{ userId: hostId, name: hostName, role: 'host', joinedAt: now, isMuted: false, isVideoOn: false, isScreenSharing: false, handRaised: false, permissions: { canSpeak: true, canShareScreen: true, canShareMedia: true, canPinMessage: true, canManageParticipants: true, canEndSession: true } }],
    settings: { maxParticipants: 100, isPublic: true, requireApproval: false, enableChat: true, enableReactions: true, enableRecording: false, enableBreakoutRooms: false, allowGuests: false, muteOnJoin: true, videoOnByDefault: false },
    analytics: { peakParticipants: 1, totalMessages: 0, totalDuration: 0, engagementScore: 0, participationRate: 0, avgActiveTime: 0 },
    metadata: {}
  };
}

export default ClassroomSession;
