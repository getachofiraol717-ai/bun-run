/**
 * Knowledge Universe — Communication Hub Types
 */

export type ConversationType = 'dm' | 'group' | 'channel' | 'ai';

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice_note'
  | 'file'
  | 'code'
  | 'system'
  | 'ai';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member';

export type UserPresenceState = 'online' | 'offline' | 'away' | 'busy' | 'studying';

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  role?: string;
  presence?: UserPresenceState;
  last_seen?: string;
  bio?: string;
  grade?: number;
  subject_interest?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;
  description?: string;
  avatar_url?: string;
  subject?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  unread_count?: number;
  pinned_message_id?: string;
  is_archived?: boolean;
  is_private?: boolean;
  group_id?: string;
  classroom_id?: string;
  last_message?: Message;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  role: UserRole;
  joined_at: string;
  last_read_at?: string;
  is_muted?: boolean;
}

export interface DirectMessage {
  id: string;
  recipient: UserProfile;
  created_at: string;
  last_active: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  icon?: string;
  member_count: number;
  is_private: boolean;
  created_by: string;
  created_at: string;
  rules?: string[];
}

export interface Channel {
  id: string;
  group_id?: string;
  classroom_id?: string;
  name: string;
  description?: string;
  type: 'text' | 'announcement' | 'voice' | 'ai_discussion';
  is_private: boolean;
  is_readonly: boolean;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  message_id?: string;
  name: string;
  url: string;
  file_type: 'image' | 'video' | 'audio' | 'voice_note' | 'document' | 'code' | 'other';
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  user_name?: string;
  emoji: string;
  created_at: string;
}

export interface MessageReply {
  reply_to_id: string;
  sender_name: string;
  content_preview: string;
  message_type?: MessageType;
}

export interface Message {
  id: string;
  conversation_id: string;
  channel_id?: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_role?: string;
  content: string;
  message_type: MessageType;
  created_at: string;
  updated_at?: string;
  is_edited?: boolean;
  status: MessageStatus;
  reply_to?: MessageReply;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  is_pinned?: boolean;
  ai_context?: {
    model?: string;
    sources?: string[];
    is_explanation?: boolean;
  };
}

export interface VoiceNote {
  id: string;
  audio_url: string;
  duration: number;
  waveform_data?: number[];
  file_size: number;
  created_at: string;
}

export interface Presence {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  state: UserPresenceState;
  last_seen: string;
  current_page?: string;
  current_activity?: string;
}

export interface CommunicationNotification {
  id: string;
  user_id: string;
  type: 'dm' | 'mention' | 'announcement' | 'reply' | 'group_invite';
  title: string;
  body: string;
  link?: string;
  conversation_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ModerationReport {
  id: string;
  message_id: string;
  conversation_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: string;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_user_id: string;
  created_at: string;
}

export interface CommunicationAIState {
  isStreaming: boolean;
  activeModel: string;
  contextDocument?: {
    title: string;
    file_url: string;
    content_snippet?: string;
  };
}
