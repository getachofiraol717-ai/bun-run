// @ts-nocheck
/**
 * ClassroomEngine.ts
 *
 * Core engine for managing classrooms and their lifecycle.
 */

import { Classroom, createClassroom, ClassroomSettings, ClassroomAnalytics } from '../models';
import { ChannelManager } from './ChannelManager';
import { MessagingEngine } from './MessagingEngine';
import { PresenceEngine } from './PresenceEngine';
import { NotificationEngine } from './NotificationEngine';
import { ModerationEngine } from './ModerationEngine';

const STORAGE_KEY = 'classroom_engine_data';

export interface ClassroomEngineConfig {
  maxClassrooms?: number;
  defaultSettings?: Partial<ClassroomSettings>;
  enableAnalytics?: boolean;
  enableModeration?: boolean;
}

export class ClassroomEngine {
  private static instance: ClassroomEngine;
  private classrooms: Map<string, Classroom> = new Map();
  private channelManager: ChannelManager;
  private messagingEngine: MessagingEngine;
  private presenceEngine: PresenceEngine;
  private notificationEngine: NotificationEngine;
  private moderationEngine: ModerationEngine;
  private config: ClassroomEngineConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor(config: ClassroomEngineConfig = {}) {
    this.config = {
      maxClassrooms: config.maxClassrooms || 50,
      defaultSettings: config.defaultSettings,
      enableAnalytics: config.enableAnalytics !== false,
      enableModeration: config.enableModeration !== false
    };
    this.channelManager = ChannelManager.getInstance();
    this.messagingEngine = MessagingEngine.getInstance();
    this.presenceEngine = PresenceEngine.getInstance();
    this.notificationEngine = NotificationEngine.getInstance();
    this.moderationEngine = ModerationEngine.getInstance();
  }

  static getInstance(config?: ClassroomEngineConfig): ClassroomEngine {
    if (!ClassroomEngine.instance) {
      ClassroomEngine.instance = new ClassroomEngine(config);
    }
    return ClassroomEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    await this.channelManager.initialize();
    await this.messagingEngine.initialize();
    await this.presenceEngine.initialize();
    await this.notificationEngine.initialize();
    if (this.config.enableModeration) {
      await this.moderationEngine.initialize();
    }
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.classrooms = new Map(Object.entries(data.classrooms || {}));
      }
    } catch (error) {
      console.error('Failed to load classrooms from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        classrooms: Object.fromEntries(this.classrooms)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save classrooms to storage:', error);
    }
  }

  createClassroom(
    name: string,
    description: string,
    teacherId: string,
    teacherName: string,
    teacherEmail: string,
    subject?: string,
    gradeLevel?: string
  ): Classroom {
    if (this.classrooms.size >= this.config.maxClassrooms!) {
      throw new Error(`Maximum number of classrooms (${this.config.maxClassrooms}) reached`);
    }

    const classroom = createClassroom(name, description, teacherId, teacherName, teacherEmail, subject, gradeLevel);

    if (this.config.defaultSettings) {
      classroom.settings = { ...classroom.settings, ...this.config.defaultSettings };
    }

    this.classrooms.set(classroom.id, classroom);
    this.saveToStorage();

    // Create default channels for the classroom
    this.channelManager.createDefaultChannels(classroom.id);

    // Notify about new classroom
    this.notificationEngine.sendClassroomNotification(classroom.id, 'classroom_created', {
      classroomId: classroom.id,
      name: classroom.name,
      teacherName: classroom.teacherName
    });

    this.emit('classroomCreated', classroom);
    return classroom;
  }

  getClassroom(classroomId: string): Classroom | undefined {
    return this.classrooms.get(classroomId);
  }

  getAllClassrooms(): Classroom[] {
    return Array.from(this.classrooms.values());
  }

  getClassroomsForUser(userId: string): Classroom[] {
    return Array.from(this.classrooms.values()).filter(
      classroom => classroom.members.some(m => m.userId === userId)
    );
  }

  getClassroomsByTeacher(teacherId: string): Classroom[] {
    return Array.from(this.classrooms.values()).filter(
      classroom => classroom.teacherId === teacherId
    );
  }

  updateClassroom(
    classroomId: string,
    updates: Partial<Pick<Classroom, 'name' | 'description' | 'subject' | 'gradeLevel' | 'settings' | 'isArchived'>>
  ): Classroom | undefined {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return undefined;

    if (updates.name !== undefined) classroom.name = updates.name;
    if (updates.description !== undefined) classroom.description = updates.description;
    if (updates.subject !== undefined) classroom.subject = updates.subject;
    if (updates.gradeLevel !== undefined) classroom.gradeLevel = updates.gradeLevel;
    if (updates.isArchived !== undefined) classroom.isArchived = updates.isArchived;
    if (updates.settings !== undefined) {
      classroom.settings = { ...classroom.settings, ...updates.settings };
    }

    classroom.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.emit('classroomUpdated', classroom);
    return classroom;
  }

  deleteClassroom(classroomId: string): boolean {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return false;

    // Clean up related data
    this.channelManager.deleteChannelsForClassroom(classroomId);
    this.messagingEngine.deleteMessagesForClassroom(classroomId);
    this.presenceEngine.clearPresenceForClassroom(classroomId);
    this.moderationEngine.clearModerationForClassroom(classroomId);

    this.classrooms.delete(classroomId);
    this.saveToStorage();
    this.emit('classroomDeleted', { classroomId });
    return true;
  }

  addMember(
    classroomId: string,
    userId: string,
    name: string,
    email: string,
    role: 'teacher' | 'student' | 'ta' | 'assistant'
  ): boolean {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return false;

    // Check if member already exists
    if (classroom.members.some(m => m.userId === userId)) {
      return false;
    }

    const member = {
      id: `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId,
      classroomId,
      name,
      email,
      role,
      status: 'active' as const,
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      permissions: this.getPermissionsForRole(role, classroom.teacherId === userId),
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
        status: 'offline' as const,
        lastSeen: new Date().toISOString(),
        isTyping: false
      },
      unreadMessages: 0,
      unreadChannels: []
    };

    classroom.members.push(member);
    classroom.memberCount = classroom.members.length;
    classroom.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.notificationEngine.sendClassroomNotification(classroomId, 'member_added', {
      classroomId,
      memberId: member.id,
      name,
      role
    });

    this.emit('memberAdded', { classroomId, member });
    return true;
  }

  private getPermissionsForRole(role: string, isOwner: boolean): any {
    const base = {
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

    if (role === 'teacher' || isOwner) {
      return {
        ...base,
        canCreateChannels: true,
        canDeleteMessages: true,
        canPinMessages: true,
        canManageMembers: true,
        canEditClassroom: true,
        canExportData: true
      };
    }
    if (role === 'ta') {
      return {
        ...base,
        canCreateChannels: true,
        canDeleteMessages: true,
        canPinMessages: true,
        canManageMembers: true,
        canExportData: true
      };
    }
    return base;
  }

  removeMember(classroomId: string, memberId: string): boolean {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return false;

    const memberIndex = classroom.members.findIndex(m => m.userId === memberId || m.id === memberId);
    if (memberIndex === -1) return false;

    const member = classroom.members[memberIndex];
    classroom.members.splice(memberIndex, 1);
    classroom.memberCount = classroom.members.length;
    classroom.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.presenceEngine.clearUserPresence(memberId, classroomId);
    this.emit('memberRemoved', { classroomId, memberId });
    return true;
  }

  updateMemberRole(classroomId: string, memberId: string, newRole: 'teacher' | 'student' | 'ta' | 'assistant'): boolean {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return false;

    const member = classroom.members.find(m => m.userId === memberId || m.id === memberId);
    if (!member) return false;

    member.role = newRole;
    member.permissions = this.getPermissionsForRole(newRole, classroom.teacherId === member.userId);
    member.lastActive = new Date().toISOString();
    classroom.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.emit('memberRoleUpdated', { classroomId, memberId, newRole });
    return true;
  }

  updateMemberSettings(classroomId: string, memberId: string, settings: any): boolean {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return false;

    const member = classroom.members.find(m => m.userId === memberId || m.id === memberId);
    if (!member) return false;

    member.settings = { ...member.settings, ...settings };
    member.lastActive = new Date().toISOString();
    this.saveToStorage();

    this.emit('memberSettingsUpdated', { classroomId, memberId, settings });
    return true;
  }

  updateMemberPresence(classroomId: string, memberId: string, presence: any): boolean {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return false;

    const member = classroom.members.find(m => m.userId === memberId || m.id === memberId);
    if (!member) return false;

    member.presence = { ...member.presence, ...presence };
    member.lastActive = new Date().toISOString();
    this.saveToStorage();

    this.emit('memberPresenceUpdated', { classroomId, memberId, presence });
    return true;
  }

  getMember(classroomId: string, memberId: string): any | undefined {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return undefined;
    return classroom.members.find(m => m.userId === memberId || m.id === memberId);
  }

  getClassroomMembers(classroomId: string): any[] {
    const classroom = this.classrooms.get(classroomId);
    return classroom ? classroom.members : [];
  }

  updateAnalytics(classroomId: string, analytics: Partial<ClassroomAnalytics>): Classroom | undefined {
    const classroom = this.classrooms.get(classroomId);
    if (!classroom) return undefined;

    classroom.analytics = { ...classroom.analytics, ...analytics };
    classroom.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.emit('analyticsUpdated', { classroomId, analytics });
    return classroom;
  }

  archiveClassroom(classroomId: string): boolean {
    const classroom = this.updateClassroom(classroomId, { isArchived: true });
    return !!classroom;
  }

  unarchiveClassroom(classroomId: string): boolean {
    const classroom = this.updateClassroom(classroomId, { isArchived: false });
    return !!classroom;
  }

  getArchivedClassrooms(): Classroom[] {
    return Array.from(this.classrooms.values()).filter(c => c.isArchived);
  }

  searchClassrooms(query: string): Classroom[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.classrooms.values()).filter(
      classroom =>
        classroom.name.toLowerCase().includes(lowerQuery) ||
        classroom.description.toLowerCase().includes(lowerQuery) ||
        classroom.subject?.toLowerCase().includes(lowerQuery) ||
        classroom.members.some(m => m.name.toLowerCase().includes(lowerQuery))
    );
  }

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

  getChannelManager(): ChannelManager {
    return this.channelManager;
  }

  getMessagingEngine(): MessagingEngine {
    return this.messagingEngine;
  }

  getPresenceEngine(): PresenceEngine {
    return this.presenceEngine;
  }

  getNotificationEngine(): NotificationEngine {
    return this.notificationEngine;
  }

  getModerationEngine(): ModerationEngine {
    return this.moderationEngine;
  }

  getStats(): { totalClassrooms: number; totalMembers: number; totalChannels: number } {
    let totalMembers = 0;
    let totalChannels = 0;

    this.classrooms.forEach(classroom => {
      totalMembers += classroom.members.length;
      totalChannels += classroom.channels.length;
    });

    return {
      totalClassrooms: this.classrooms.size,
      totalMembers,
      totalChannels
    };
  }
}

export default ClassroomEngine;
