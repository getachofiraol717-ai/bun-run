/**
 * Message.ts
 *
 * Model for Message entity with reactions, threads, and educational links.
 */

export type ContentType = 'text' | 'html' | 'markdown' | 'voice' | 'system' | 'notification' | 'announcement';

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface AIContext {
  summary?: string;
  topics?: string[];
  entities?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  suggestedReplies?: string[];
  relatedConcepts?: string[];
}

export interface EducationalLink {
  id: string;
  type: 'pdf' | 'concept' | 'formula' | 'quiz' | 'video' | 'resource' | 'assignment' | 'grade';
  title: string;
  description?: string;
  url?: string;
  contentId?: string;
  relevanceScore?: number;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  classroomId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  contentType: ContentType;
  parentId?: string;
  replyCount: number;
  reactions: Reaction[];
  reactionCount: number;
  attachments: Attachment[];
  isPinned: boolean;
  pinnedAt?: string;
  pinnedBy?: string;
  isEdited: boolean;
  editedAt?: string;
  editedBy?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  readBy: string[];
  readCount: number;
  aiContext?: AIContext;
  educationalLinks: EducationalLink[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Factory functions
 */

export function createMessage(
  classroomId: string,
  channelId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | undefined,
  content: string,
  contentType: ContentType = 'text',
  parentId?: string,
  metadata?: Record<string, any>
): Message {
  return {
    id: `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    classroomId,
    channelId,
    senderId,
    senderName,
    senderAvatar,
    content,
    contentType,
    parentId,
    replyCount: 0,
    reactions: [],
    reactionCount: 0,
    attachments: [],
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: [senderId],
    readCount: 1,
    educationalLinks: [],
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createSystemMessage(
  classroomId: string,
  channelId: string,
  content: string,
  type: 'member_joined' | 'member_left' | 'channel_created' | 'channel_deleted' | 'classroom_archived' | 'role_changed' | 'pin' | 'unpin' = 'member_joined'
): Message {
  return {
    id: `SYS-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    classroomId,
    channelId,
    senderId: 'system',
    senderName: 'System',
    content,
    contentType: 'system',
    replyCount: 0,
    reactions: [],
    reactionCount: 0,
    attachments: [],
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: [],
    readCount: 0,
    educationalLinks: [],
    metadata: { systemType: type },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createVoiceMessage(
  classroomId: string,
  channelId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | undefined,
  audioUrl: string,
  duration: number,
  mimeType: string = 'audio/webm'
): Message {
  const message = createMessage(
    classroomId,
    channelId,
    senderId,
    senderName,
    senderAvatar,
    '',
    'voice'
  );

  message.attachments.push({
    id: `ATT-${Date.now()}`,
    type: 'audio',
    url: audioUrl,
    name: 'Voice Note',
    size: 0,
    mimeType,
    duration
  });

  return message;
}

export function createAnnouncementMessage(
  classroomId: string,
  channelId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | undefined,
  title: string,
  content: string
): Message {
  const message = createMessage(
    classroomId,
    channelId,
    senderId,
    senderName,
    senderAvatar,
    `# ${title}\n\n${content}`,
    'markdown'
  );

  message.contentType = 'announcement';

  return message;
}

export function addReaction(message: Message, emoji: string, userId: string): Message {
  const existing = message.reactions.find(r => r.emoji === emoji && r.userId === userId);
  if (existing) return message;

  message.reactions.push({
    id: `REACT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    emoji,
    userId,
    createdAt: new Date().toISOString()
  });

  message.reactionCount = message.reactions.length;
  message.updatedAt = new Date().toISOString();

  return message;
}

export function removeReaction(message: Message, emoji: string, userId: string): Message {
  const index = message.reactions.findIndex(r => r.emoji === emoji && r.userId === userId);
  if (index > -1) {
    message.reactions.splice(index, 1);
    message.reactionCount = message.reactions.length;
    message.updatedAt = new Date().toISOString();
  }

  return message;
}

export function editMessage(message: Message, newContent: string, editedBy: string): Message {
  message.content = newContent;
  message.isEdited = true;
  message.editedAt = new Date().toISOString();
  message.editedBy = editedBy;
  message.updatedAt = new Date().toISOString();

  return message;
}

export function deleteMessage(message: Message, deletedBy: string): Message {
  message.isDeleted = true;
  message.deletedAt = new Date().toISOString();
  message.deletedBy = deletedBy;
  message.content = '[Message deleted]';
  message.updatedAt = new Date().toISOString();

  return message;
}

export function pinMessage(message: Message, pinnedBy: string): Message {
  message.isPinned = true;
  message.pinnedAt = new Date().toISOString();
  message.pinnedBy = pinnedBy;
  message.updatedAt = new Date().toISOString();

  return message;
}

export function unpinMessage(message: Message): Message {
  message.isPinned = false;
  message.pinnedAt = undefined;
  message.pinnedBy = undefined;
  message.updatedAt = new Date().toISOString();

  return message;
}

export function addEducationalLink(message: Message, link: EducationalLink): Message {
  message.educationalLinks.push(link);
  message.updatedAt = new Date().toISOString();

  return message;
}

export function formatReactionSummary(reactions: Reaction[]): string {
  const emojiCounts: Record<string, number> = {};

  reactions.forEach(r => {
    emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
  });

  return Object.entries(emojiCounts)
    .map(([emoji, count]) => `${emoji}${count > 1 ? ` x${count}` : ''}`)
    .join(' ');
}
