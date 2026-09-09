// @ts-nocheck
/**
 * ClassroomController.ts
 *
 * Main controller that coordinates all classroom engine operations.
 * Provides a unified API for classroom interactions.
 */

import { ClassroomEngine } from './ClassroomEngine';
import { MessagingEngine } from './MessagingEngine';
import { ChannelManager } from './ChannelManager';
import { MediaManager } from './MediaManager';
import { VoiceNoteEngine } from './VoiceNoteEngine';
import { NotificationEngine } from './NotificationEngine';
import { PresenceEngine } from './PresenceEngine';
import { ModerationEngine } from './ModerationEngine';
import { Channel, Message, MediaAttachment, VoiceNote, EducationalLink } from '../models';

export interface ClassroomControllerConfig {
  enableAnalytics?: boolean;
  enableModeration?: boolean;
}

export class ClassroomController {
  private static instance: ClassroomController;
  private classroomEngine: ClassroomEngine;
  private messagingEngine: MessagingEngine;
  private channelManager: ChannelManager;
  private mediaManager: MediaManager;
  private voiceNoteEngine: VoiceNoteEngine;
  private notificationEngine: NotificationEngine;
  private presenceEngine: PresenceEngine;
  private moderationEngine: ModerationEngine;
  private config: ClassroomControllerConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor(config: ClassroomControllerConfig = {}) {
    this.config = {
      enableAnalytics: config.enableAnalytics !== false,
      enableModeration: config.enableModeration !== false,
    };

    this.classroomEngine = ClassroomEngine.getInstance();
    this.messagingEngine = MessagingEngine.getInstance();
    this.channelManager = ChannelManager.getInstance();
    this.mediaManager = MediaManager.getInstance();
    this.voiceNoteEngine = VoiceNoteEngine.getInstance();
    this.notificationEngine = NotificationEngine.getInstance();
    this.presenceEngine = PresenceEngine.getInstance();
    this.moderationEngine = ModerationEngine.getInstance();
  }

  static getInstance(config?: ClassroomControllerConfig): ClassroomController {
    if (!ClassroomController.instance) {
      ClassroomController.instance = new ClassroomController(config);
    }
    return ClassroomController.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await Promise.all([
      this.classroomEngine.initialize(),
      this.messagingEngine.initialize(),
      this.channelManager.initialize(),
      this.mediaManager.initialize(),
      this.voiceNoteEngine.initialize(),
      this.notificationEngine.initialize(),
      this.presenceEngine.initialize()
    ]);

    if (this.config.enableModeration) {
      await this.moderationEngine.initialize();
    }

    this.setupEventListeners();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private setupEventListeners(): void {
    // Forward events from all engines
    const engines = [
      this.classroomEngine,
      this.messagingEngine,
      this.channelManager,
      this.mediaManager,
      this.voiceNoteEngine,
      this.notificationEngine,
      this.presenceEngine,
      this.moderationEngine
    ];

    engines.forEach(engine => {
      engine.subscribe('*', (event: string, data: any) => {
        this.emit(event, data);
      });
    });
  }

  // ============ Classroom Operations ============

  async createClassroom(
    name: string,
    description: string,
    teacherId: string,
    teacherName: string,
    teacherEmail: string,
    options?: { subject?: string; gradeLevel?: string }
  ) {
    return this.classroomEngine.createClassroom(
      name,
      description,
      teacherId,
      teacherName,
      teacherEmail,
      options?.subject,
      options?.gradeLevel
    );
  }

  getClassroom(classroomId: string) {
    return this.classroomEngine.getClassroom(classroomId);
  }

  getAllClassrooms() {
    return this.classroomEngine.getAllClassrooms();
  }

  getUserClassrooms(userId: string) {
    return this.classroomEngine.getClassroomsForUser(userId);
  }

  updateClassroom(classroomId: string, updates: any) {
    return this.classroomEngine.updateClassroom(classroomId, updates);
  }

  deleteClassroom(classroomId: string) {
    return this.classroomEngine.deleteClassroom(classroomId);
  }

  // ============ Member Operations ============

  addMember(classroomId: string, userId: string, name: string, email: string, role: 'teacher' | 'student' | 'ta' | 'assistant') {
    return this.classroomEngine.addMember(classroomId, userId, name, email, role);
  }

  removeMember(classroomId: string, memberId: string) {
    return this.classroomEngine.removeMember(classroomId, memberId);
  }

  getMember(classroomId: string, memberId: string) {
    return this.classroomEngine.getMember(classroomId, memberId);
  }

  getClassroomMembers(classroomId: string) {
    return this.classroomEngine.getClassroomMembers(classroomId);
  }

  updateMemberRole(classroomId: string, memberId: string, newRole: 'teacher' | 'student' | 'ta' | 'assistant') {
    return this.classroomEngine.updateMemberRole(classroomId, memberId, newRole);
  }

  // ============ Channel Operations ============

  createChannel(
    classroomId: string,
    name: string,
    type: string,
    createdBy: string,
    description?: string,
    isPrivate?: boolean
  ) {
    return this.channelManager.createChannel(classroomId, name, type as any, createdBy, description, isPrivate);
  }

  getChannel(channelId: string) {
    return this.channelManager.getChannel(channelId);
  }

  getClassroomChannels(classroomId: string) {
    return this.channelManager.getClassroomChannels(classroomId);
  }

  updateChannel(channelId: string, updates: any) {
    return this.channelManager.updateChannel(channelId, updates);
  }

  deleteChannel(channelId: string) {
    return this.channelManager.deleteChannel(channelId);
  }

  // ============ Messaging Operations ============

  sendMessage(
    classroomId: string,
    channelId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string | undefined,
    content: string,
    options?: { contentType?: 'text' | 'html' | 'markdown'; parentId?: string; metadata?: Record<string, any> }
  ) {
    // Check content moderation
    if (this.config.enableModeration) {
      const check = this.moderationEngine.checkContent(content, senderId);
      if (!check.isAllowed) {
        throw new Error('Message content violates community guidelines');
      }
    }

    const message = this.messagingEngine.sendMessage(
      classroomId,
      channelId,
      senderId,
      senderName,
      senderAvatar,
      content,
      options?.contentType || 'text',
      options?.parentId,
      options?.metadata
    );

    // Update channel stats
    this.channelManager.incrementMessageCount(channelId);

    // Send notifications for mentions
    this.handleMentions(message);

    return message;
  }

  private handleMentions(message: Message): void {
    const mentionPattern = /@(\w+)/g;
    const mentions = message.content.match(mentionPattern);

    if (mentions) {
      const classroom = this.classroomEngine.getClassroom(message.classroomId);
      if (classroom) {
        mentions.forEach(mention => {
          const mentionedMember = classroom.members.find(m =>
            m.name.toLowerCase().includes(mention.slice(1).toLowerCase())
          );

          if (mentionedMember) {
            this.notificationEngine.sendNotification(
              mentionedMember.userId,
              'mention',
              'You were mentioned',
              `${message.senderName} mentioned you in ${this.channelManager.getChannel(message.channelId)?.name}`,
              {
                classroomId: message.classroomId,
                channelId: message.channelId,
                messageId: message.id,
                senderId: message.senderId,
                senderName: message.senderName
              }
            );
          }
        });
      }
    }
  }

  getChannelMessages(channelId: string, limit?: number, before?: string) {
    return this.messagingEngine.getChannelMessages(channelId, limit, before);
  }

  getMessage(messageId: string) {
    return this.messagingEngine.getMessage(messageId);
  }

  getThreadReplies(parentId: string) {
    return this.messagingEngine.getThreadReplies(parentId);
  }

  editMessage(messageId: string, newContent: string, editedBy: string) {
    return this.messagingEngine.editMessage(messageId, newContent, editedBy);
  }

  deleteMessage(messageId: string, deletedBy: string) {
    return this.messagingEngine.deleteMessage(messageId, deletedBy);
  }

  addReaction(messageId: string, userId: string, emoji: string) {
    return this.messagingEngine.toggleReaction(messageId, userId, emoji);
  }

  pinMessage(messageId: string, pinnedBy: string) {
    const message = this.messagingEngine.getMessage(messageId);
    if (!message) return false;

    this.messagingEngine.pinMessage(messageId, pinnedBy);
    this.channelManager.pinMessage(message.channelId, messageId);

    this.notificationEngine.sendNotification(
      message.senderId,
      'pin',
      'Your message was pinned',
      'A message you sent has been pinned in the channel',
      {
        classroomId: message.classroomId,
        channelId: message.channelId,
        messageId: message.id
      }
    );

    return true;
  }

  // ============ Media Operations ============

  async uploadMedia(
    classroomId: string,
    channelId: string,
    file: File,
    uploadedBy: string,
    uploadedByName: string,
    educationalContext?: any
  ) {
    const media = this.mediaManager.addMedia(
      classroomId,
      channelId,
      file,
      uploadedBy,
      uploadedByName,
      educationalContext
    );

    this.notificationEngine.sendNotification(
      uploadedBy,
      'media_shared',
      'Media uploaded',
      `${uploadedByName} shared a file in the channel`,
      {
        classroomId,
        channelId,
        metadata: { mediaId: media.id, fileName: media.name }
      }
    );

    return media;
  }

  getChannelMedia(channelId: string, limit?: number) {
    return this.mediaManager.getChannelMedia(channelId, limit);
  }

  // ============ Voice Note Operations ============

  async recordVoiceNote(
    classroomId: string,
    channelId: string,
    senderId: string,
    senderName: string,
    duration: number,
    audioDataUrl: string,
    mimeType?: string
  ) {
    return this.voiceNoteEngine.createVoiceNote(
      classroomId,
      channelId,
      senderId,
      senderName,
      duration,
      audioDataUrl,
      mimeType
    );
  }

  async transcribeVoiceNote(noteId: string, transcript: string, language?: string) {
    return this.voiceNoteEngine.addTranscription(noteId, transcript, language);
  }

  getChannelVoiceNotes(channelId: string, limit?: number) {
    return this.voiceNoteEngine.getChannelVoiceNotes(channelId, limit);
  }

  // ============ Presence Operations ============

  setUserOnline(userId: string, classroomId: string, channelId?: string) {
    return this.presenceEngine.setUserOnline(userId, classroomId, channelId);
  }

  setUserOffline(userId: string, classroomId: string) {
    return this.presenceEngine.setUserOffline(userId, classroomId);
  }

  updateCurrentChannel(userId: string, classroomId: string, channelId: string) {
    this.presenceEngine.updateCurrentChannel(userId, classroomId, channelId);
  }

  startTyping(userId: string, userName: string, channelId: string) {
    this.presenceEngine.startTyping(userId, userName, channelId);
  }

  stopTyping(userId: string, channelId: string) {
    this.presenceEngine.stopTyping(userId, channelId);
  }

  getTypingUsers(channelId: string) {
    return this.presenceEngine.getTypingUsers(channelId);
  }

  getOnlineUsers(classroomId: string) {
    return this.presenceEngine.getOnlineUsers(classroomId);
  }

  markAsRead(userId: string, channelId: string, messageId: string) {
    this.presenceEngine.markAsRead(userId, channelId, messageId);
  }

  // ============ Notification Operations ============

  getNotifications(userId: string, limit?: number) {
    return this.notificationEngine.getNotifications({ recipientId: userId, limit });
  }

  getUnreadCount(userId: string) {
    return this.notificationEngine.getUnreadCount(userId);
  }

  markNotificationAsRead(notificationId: string) {
    return this.notificationEngine.markAsRead(notificationId);
  }

  markAllNotificationsAsRead(userId: string) {
    return this.notificationEngine.markAllAsRead(userId);
  }

  // ============ Moderation Operations ============

  reportContent(
    reporterId: string,
    reporterName: string,
    channelId: string,
    classroomId: string,
    type: string,
    reason: string,
    options?: { reportedUserId?: string; reportedUserName?: string; messageId?: string; details?: string }
  ) {
    return this.moderationEngine.createReport(reporterId, reporterName, channelId, classroomId, type as any, reason, options);
  }

  takeModerationAction(
    type: string,
    targetUserId: string,
    targetUserName: string,
    moderatorId: string,
    moderatorName: string,
    classroomId: string,
    reason: string,
    options?: { duration?: number }
  ) {
    return this.moderationEngine.takeAction(type as any, targetUserId, targetUserName, moderatorId, moderatorName, classroomId, reason, options);
  }

  getPendingReports(classroomId?: string) {
    return this.moderationEngine.getPendingReports(classroomId);
  }

  // ============ Search Operations ============

  searchClassrooms(query: string) {
    return this.classroomEngine.searchClassrooms(query);
  }

  searchMessages(query: string, options?: { classroomId?: string; channelId?: string; limit?: number }) {
    return this.messagingEngine.searchMessages(query, options);
  }

  searchMedia(query: string, filter?: any) {
    return this.mediaManager.searchMedia(query, filter);
  }

  // ============ Analytics ============

  getClassroomAnalytics(classroomId: string) {
    const classroom = this.classroomEngine.getClassroom(classroomId);
    if (!classroom) return null;

    const channels = this.channelManager.getClassroomChannels(classroomId);
    let totalMessages = 0;
    let totalMedia = 0;
    let totalVoiceNotes = 0;

    channels.forEach(channel => {
      const messageStats = this.messagingEngine.getMessageStats(channel.id);
      totalMessages += messageStats.totalMessages + messageStats.totalReplies;

      const mediaStats = this.mediaManager.getMediaStats(channel.id);
      totalMedia += mediaStats.totalMedia;

      const voiceStats = this.voiceNoteEngine.getVoiceNoteStats(channel.id);
      totalVoiceNotes += voiceStats.totalNotes;
    });

    return {
      classroom,
      channels: channels.length,
      totalMessages,
      totalMedia,
      totalVoiceNotes,
      memberCount: classroom.members.length,
      activeMembers: this.presenceEngine.getOnlineUsers(classroomId).length
    };
  }

  // ============ Event Subscription ============

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

  // ============ Utility ============

  getStats() {
    return {
      classroomEngine: this.classroomEngine.getStats(),
      messaging: this.messagingEngine.getStats(),
      channels: this.channelManager.getStats(),
      media: this.mediaManager.getStats(),
      voiceNotes: this.voiceNoteEngine.getStats(),
      notifications: this.notificationEngine.getStats(),
      presence: this.presenceEngine.getStats(),
      moderation: this.moderationEngine.getStats()
    };
  }
}

export default ClassroomController;
