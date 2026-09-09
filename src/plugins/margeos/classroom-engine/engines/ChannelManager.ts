// @ts-nocheck
/**
 * ChannelManager.ts
 *
 * Comprehensive engine for managing classroom channels with support for
 * categories, permissions, templates, analytics, and advanced channel operations.
 */

import { Channel, createChannel, ChannelType, ChannelMember } from '../models';

const STORAGE_KEY = 'channel_manager_data';
const CHANNEL_TEMPLATES_KEY = 'channel_templates';
const CHANNEL_CATEGORIES_KEY = 'channel_categories';
const PERMISSIONS_MATRIX_KEY = 'channel_permissions';

export interface ChannelManagerConfig {
  maxChannelsPerClassroom?: number;
  defaultChannelTypes?: ChannelType[];
  enableChannelArchiving?: boolean;
  enableCategories?: boolean;
  enableChannelTemplates?: boolean;
  enablePermissionsMatrix?: boolean;
  enableChannelAnalytics?: boolean;
}

export interface ChannelFilter {
  classroomId: string;
  type?: ChannelType;
  category?: string;
  isArchived?: boolean;
  searchQuery?: string;
  hasUnread?: boolean;
  isPrivate?: boolean;
  memberId?: string;
  sortBy?: 'name' | 'createdAt' | 'lastActivity' | 'memberCount';
  sortOrder?: 'asc' | 'desc';
}

export interface ChannelCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  order: number;
  classroomId: string;
  isDefault: boolean;
}

export interface ChannelTemplate {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  defaultSettings: Partial<Channel['settings']>;
  defaultPermissions: ChannelPermissions;
  isSystemTemplate: boolean;
  category?: string;
}

export interface ChannelPermissions {
  canView: string[];
  canSendMessages: string[];
  canSendMedia: string[];
  canPinMessages: string[];
  canManageMessages: string[];
  canInviteMembers: string[];
  canRemoveMembers: string[];
  canEditChannel: string[];
  canDeleteChannel: string[];
  canManageRoles: string[];
  canViewHistory: string[];
  canUseThreads: string[];
  canReact: string[];
}

export interface ChannelAnalytics {
  channelId: string;
  totalMessages: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  averageMessagesPerDay: number;
  mostActiveDay: string;
  mostActiveHour: number;
  uniqueParticipants: number;
  totalMediaShared: number;
  totalReactions: number;
  threadParticipation: number;
  peakActivityDate: string;
  growthRate: number;
  engagementScore: number;
}

export interface ChannelInvitation {
  id: string;
  channelId: string;
  invitedBy: string;
  invitedByName: string;
  invitedUserId?: string;
  invitedEmail?: string;
  role: 'admin' | 'moderator' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  message?: string;
}

export interface ChannelBookmark {
  id: string;
  channelId: string;
  userId: string;
  messageId?: string;
  createdAt: string;
  note?: string;
}

export interface ChannelNotificationSettings {
  channelId: string;
  userId: string;
  notifyOnNewMessage: boolean;
  notifyOnMentions: boolean;
  notifyOnReplies: boolean;
  notifyOnPins: boolean;
  muteUntil?: string;
  customKeywords: string[];
}

class ChannelManager {
  private static instance: ChannelManager;
  private channels: Map<string, Channel> = new Map();
  private classroomChannels: Map<string, string[]> = new Map();
  private channelCategories: Map<string, ChannelCategory> = new Map();
  private channelTemplates: Map<string, ChannelTemplate> = new Map();
  private channelAnalytics: Map<string, ChannelAnalytics> = new Map();
  private channelInvitations: Map<string, ChannelInvitation> = new Map();
  private channelBookmarks: Map<string, ChannelBookmark> = new Map();
  private userBookmarks: Map<string, string[]> = new Map();
  private notificationSettings: Map<string, ChannelNotificationSettings> = new Map();
  private config: ChannelManagerConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor(config: ChannelManagerConfig = {}) {
    this.config = {
      maxChannelsPerClassroom: config.maxChannelsPerClassroom || 50,
      defaultChannelTypes: config.defaultChannelTypes || ['general', 'announcements', 'qna', 'resources'],
      enableChannelArchiving: config.enableChannelArchiving !== false,
      enableCategories: config.enableCategories !== false,
      enableChannelTemplates: config.enableChannelTemplates !== false,
      enablePermissionsMatrix: config.enablePermissionsMatrix !== false,
      enableChannelAnalytics: config.enableChannelAnalytics !== false
    };

    if (this.config.enableChannelTemplates) {
      this.initializeDefaultTemplates();
    }

    if (this.config.enableCategories) {
      this.initializeDefaultCategories();
    }
  }

  static getInstance(config?: ChannelManagerConfig): ChannelManager {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager(config);
    }
    return ChannelManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private initializeDefaultTemplates(): void {
    const templates: Omit<ChannelTemplate, 'id'>[] = [
      {
        name: 'General Discussion',
        description: 'A general-purpose channel for everyday conversations',
        type: 'general',
        defaultSettings: {
          allowMedia: true,
          allowVoiceNotes: true,
          allowThreads: true,
          slowModeDelay: 0
        },
        defaultPermissions: {
          canView: ['all'],
          canSendMessages: ['all'],
          canSendMedia: ['all'],
          canPinMessages: ['admin', 'moderator'],
          canManageMessages: ['admin', 'moderator'],
          canInviteMembers: ['admin', 'moderator'],
          canRemoveMembers: ['admin'],
          canEditChannel: ['admin'],
          canDeleteChannel: ['admin'],
          canManageRoles: ['admin'],
          canViewHistory: ['all'],
          canUseThreads: ['all'],
          canReact: ['all']
        },
        isSystemTemplate: true
      },
      {
        name: 'Announcements Only',
        description: 'A read-only channel for important announcements',
        type: 'announcements',
        defaultSettings: {
          allowMedia: true,
          allowVoiceNotes: false,
          allowThreads: false,
          slowModeDelay: 0
        },
        defaultPermissions: {
          canView: ['all'],
          canSendMessages: ['admin'],
          canSendMedia: ['admin'],
          canPinMessages: ['admin'],
          canManageMessages: ['admin'],
          canInviteMembers: ['admin'],
          canRemoveMembers: ['admin'],
          canEditChannel: ['admin'],
          canDeleteChannel: ['admin'],
          canManageRoles: ['admin'],
          canViewHistory: ['all'],
          canUseThreads: ['none'],
          canReact: ['all']
        },
        isSystemTemplate: true
      },
      {
        name: 'Q&A Discussion',
        description: 'Channel for asking and answering questions',
        type: 'qna',
        defaultSettings: {
          allowMedia: true,
          allowVoiceNotes: true,
          allowThreads: true,
          slowModeDelay: 0
        },
        defaultPermissions: {
          canView: ['all'],
          canSendMessages: ['all'],
          canSendMedia: ['all'],
          canPinMessages: ['admin', 'moderator'],
          canManageMessages: ['admin', 'moderator'],
          canInviteMembers: ['admin', 'moderator'],
          canRemoveMembers: ['admin'],
          canEditChannel: ['admin'],
          canDeleteChannel: ['admin'],
          canManageRoles: ['admin'],
          canViewHistory: ['all'],
          canUseThreads: ['all'],
          canReact: ['all']
        },
        isSystemTemplate: true
      },
      {
        name: 'Study Group',
        description: 'Collaborative channel for study sessions',
        type: 'study_group',
        defaultSettings: {
          allowMedia: true,
          allowVoiceNotes: true,
          allowThreads: true,
          slowModeDelay: 30
        },
        defaultPermissions: {
          canView: ['all'],
          canSendMessages: ['all'],
          canSendMedia: ['all'],
          canPinMessages: ['admin', 'moderator'],
          canManageMessages: ['admin', 'moderator'],
          canInviteMembers: ['admin', 'moderator', 'member'],
          canRemoveMembers: ['admin', 'moderator'],
          canEditChannel: ['admin', 'moderator'],
          canDeleteChannel: ['admin'],
          canManageRoles: ['admin'],
          canViewHistory: ['all'],
          canUseThreads: ['all'],
          canReact: ['all']
        },
        isSystemTemplate: true
      },
      {
        name: 'Project Collaboration',
        description: 'Channel for working on group projects',
        type: 'project',
        defaultSettings: {
          allowMedia: true,
          allowVoiceNotes: true,
          allowThreads: true,
          slowModeDelay: 0
        },
        defaultPermissions: {
          canView: ['all'],
          canSendMessages: ['all'],
          canSendMedia: ['all'],
          canPinMessages: ['admin', 'moderator'],
          canManageMessages: ['admin', 'moderator'],
          canInviteMembers: ['admin', 'moderator'],
          canRemoveMembers: ['admin'],
          canEditChannel: ['admin', 'moderator'],
          canDeleteChannel: ['admin'],
          canManageRoles: ['admin'],
          canViewHistory: ['all'],
          canUseThreads: ['all'],
          canReact: ['all']
        },
        isSystemTemplate: true,
        category: 'projects'
      },
      {
        name: 'Resource Library',
        description: 'Share and access learning materials',
        type: 'resources',
        defaultSettings: {
          allowMedia: true,
          allowVoiceNotes: false,
          allowThreads: true,
          slowModeDelay: 60
        },
        defaultPermissions: {
          canView: ['all'],
          canSendMessages: ['all'],
          canSendMedia: ['all'],
          canPinMessages: ['admin', 'moderator'],
          canManageMessages: ['admin', 'moderator'],
          canInviteMembers: ['admin', 'moderator'],
          canRemoveMembers: ['admin'],
          canEditChannel: ['admin'],
          canDeleteChannel: ['admin'],
          canManageRoles: ['admin'],
          canViewHistory: ['all'],
          canUseThreads: ['all'],
          canReact: ['all']
        },
        isSystemTemplate: true,
        category: 'resources'
      }
    ];

    templates.forEach(template => {
      const id = `TEMPLATE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      this.channelTemplates.set(id, { ...template, id });
    });
  }

  private initializeDefaultCategories(): void {
    const defaultCategories: Omit<ChannelCategory, 'id'>[] = [
      { name: 'General', description: 'General channels', icon: 'hash', color: '#5865F2', order: 1, classroomId: 'default', isDefault: true },
      { name: 'Academics', description: 'Subject-specific channels', icon: 'book', color: '#57F287', order: 2, classroomId: 'default', isDefault: true },
      { name: 'Projects', description: 'Project collaboration channels', icon: 'folder', color: '#FEE75C', order: 3, classroomId: 'default', isDefault: true },
      { name: 'Resources', description: 'Learning materials and resources', icon: 'paper', color: '#EB459E', order: 4, classroomId: 'default', isDefault: true },
      { name: 'Social', description: 'Social and casual channels', icon: 'smile', color: '#ED4245', order: 5, classroomId: 'default', isDefault: true }
    ];

    defaultCategories.forEach(category => {
      const id = `CAT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      this.channelCategories.set(id, { ...category, id });
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.channels = new Map(Object.entries(data.channels || {}));
        this.classroomChannels = new Map(Object.entries(data.classroomChannels || {}));
        this.channelCategories = new Map(Object.entries(data.categories || {}));
        this.channelTemplates = new Map(Object.entries(data.templates || {}));
        this.channelAnalytics = new Map(Object.entries(data.analytics || {}));
        this.channelInvitations = new Map(Object.entries(data.invitations || {}));
        this.channelBookmarks = new Map(Object.entries(data.bookmarks || {}));
        this.userBookmarks = new Map(Object.entries(data.userBookmarks || {}));
        this.notificationSettings = new Map(Object.entries(data.notificationSettings || {}));
      }
    } catch (error) {
      console.error('Failed to load channels from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        channels: Object.fromEntries(this.channels),
        classroomChannels: Object.fromEntries(this.classroomChannels),
        categories: Object.fromEntries(this.channelCategories),
        templates: Object.fromEntries(this.channelTemplates),
        analytics: Object.fromEntries(this.channelAnalytics),
        invitations: Object.fromEntries(this.channelInvitations),
        bookmarks: Object.fromEntries(this.channelBookmarks),
        userBookmarks: Object.fromEntries(this.userBookmarks),
        notificationSettings: Object.fromEntries(this.notificationSettings)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save channels to storage:', error);
    }
  }

  // Channel CRUD Operations
  createChannel(
    classroomId: string,
    name: string,
    type: ChannelType,
    createdBy: string,
    description?: string,
    isPrivate?: boolean,
    options?: {
      category?: string;
      templateId?: string;
      icon?: string;
      color?: string;
      settings?: Partial<Channel['settings']>;
    }
  ): Channel | undefined {
    const existingChannels = this.classroomChannels.get(classroomId) || [];

    if (existingChannels.length >= this.config.maxChannelsPerClassroom!) {
      console.error(`Maximum channels per classroom (${this.config.maxChannelsPerClassroom}) reached`);
      return undefined;
    }

    const template = options?.templateId ? this.channelTemplates.get(options.templateId) : undefined;
    const settings = options?.settings || template?.defaultSettings || {};

    const channel = createChannel(classroomId, name, type, createdBy, description, isPrivate);

    if (options?.icon) channel.icon = options.icon;
    if (options?.color) channel.color = options.color;
    if (options?.category) (channel as any).category = options.category;
    channel.settings = { ...channel.settings, ...settings };

    this.channels.set(channel.id, channel);
    existingChannels.push(channel.id);
    this.classroomChannels.set(classroomId, existingChannels);

    if (this.config.enableChannelAnalytics) {
      this.initializeChannelAnalytics(channel.id);
    }

    this.saveToStorage();
    this.emit('channelCreated', channel);
    return channel;
  }

  createChannelFromTemplate(
    classroomId: string,
    templateId: string,
    createdBy: string,
    name?: string,
    description?: string
  ): Channel | undefined {
    const template = this.channelTemplates.get(templateId);
    if (!template) return undefined;

    return this.createChannel(
      classroomId,
      name || template.name,
      template.type,
      createdBy,
      description || template.description,
      false,
      {
        templateId,
        settings: template.defaultSettings,
        category: template.category
      }
    );
  }

  createDefaultChannels(classroomId: string, teacherId: string): Channel[] {
    const defaultChannels: Array<{ name: string; type: ChannelType; description: string }> = [
      { name: 'general', type: 'general', description: 'General discussion for the classroom' },
      { name: 'announcements', type: 'announcements', description: 'Important announcements from the teacher' },
      { name: 'q-and-a', type: 'qna', description: 'Ask questions and get answers' },
      { name: 'resources', type: 'resources', description: 'Shared learning resources and materials' }
    ];

    const createdChannels: Channel[] = [];

    defaultChannels.forEach(channelDef => {
      const channel = this.createChannel(
        classroomId,
        channelDef.name,
        channelDef.type,
        teacherId,
        channelDef.description
      );
      if (channel) {
        createdChannels.push(channel);
      }
    });

    return createdChannels;
  }

  getChannel(channelId: string): Channel | undefined {
    return this.channels.get(channelId);
  }

  getChannels(filter: ChannelFilter): Channel[] {
    let channelIds = this.classroomChannels.get(filter.classroomId) || [];
    let channels = channelIds.map(id => this.channels.get(id)).filter((c): c is Channel => c !== undefined);

    if (filter.type) {
      channels = channels.filter(c => c.type === filter.type);
    }

    if (filter.category) {
      channels = channels.filter(c => (c as any).category === filter.category);
    }

    if (filter.isArchived !== undefined) {
      channels = channels.filter(c => c.isArchived === filter.isArchived);
    }

    if (filter.isPrivate !== undefined) {
      channels = channels.filter(c => c.isPrivate === filter.isPrivate);
    }

    if (filter.memberId) {
      channels = channels.filter(c => c.members.some(m => m.userId === filter.memberId));
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      channels = channels.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }

    const sortBy = filter.sortBy || 'position';
    const sortOrder = filter.sortOrder || 'asc';

    channels.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastActivity':
          comparison = new Date(a.lastActivity || a.createdAt).getTime() - new Date(b.lastActivity || b.createdAt).getTime();
          break;
        case 'memberCount':
          comparison = a.memberCount - b.memberCount;
          break;
        default:
          comparison = a.position - b.position;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return channels;
  }

  getClassroomChannels(classroomId: string, options?: { includeArchived?: boolean; category?: string }): Channel[] {
    return this.getChannels({
      classroomId,
      isArchived: options?.includeArchived ? undefined : false,
      category: options?.category,
      sortBy: 'position',
      sortOrder: 'asc'
    });
  }

  getChannelsByCategory(classroomId: string): Record<string, Channel[]> {
    const channels = this.getClassroomChannels(classroomId);
    const categorized: Record<string, Channel[]> = {
      uncategorized: []
    };

    channels.forEach(channel => {
      const category = (channel as any).category || 'uncategorized';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(channel);
    });

    return categorized;
  }

  updateChannel(
    channelId: string,
    updates: Partial<Pick<Channel, 'name' | 'description' | 'isPrivate' | 'isArchived' | 'settings' | 'icon' | 'color'>>
  ): Channel | undefined {
    const channel = this.channels.get(channelId);
    if (!channel) return undefined;

    if (updates.name !== undefined) channel.name = updates.name;
    if (updates.description !== undefined) channel.description = updates.description;
    if (updates.isPrivate !== undefined) channel.isPrivate = updates.isPrivate;
    if (updates.isArchived !== undefined) channel.isArchived = updates.isArchived;
    if (updates.settings !== undefined) channel.settings = { ...channel.settings, ...updates.settings };
    if (updates.icon !== undefined) channel.icon = updates.icon;
    if (updates.color !== undefined) channel.color = updates.color;

    channel.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.emit('channelUpdated', channel);
    return channel;
  }

  deleteChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const classroomChannelIds = this.classroomChannels.get(channel.classroomId);
    if (classroomChannelIds) {
      const index = classroomChannelIds.indexOf(channelId);
      if (index > -1) {
        classroomChannelIds.splice(index, 1);
      }
    }

    if (this.channelAnalytics.has(channelId)) {
      this.channelAnalytics.delete(channelId);
    }

    this.deleteChannelBookmarks(channelId);

    this.channels.delete(channelId);
    this.saveToStorage();

    this.emit('channelDeleted', { channelId, classroomId: channel.classroomId });
    return true;
  }

  deleteChannelsForClassroom(classroomId: string): void {
    const channelIds = this.classroomChannels.get(classroomId) || [];
    channelIds.forEach(id => {
      this.channels.delete(id);
      this.channelAnalytics.delete(id);
    });
    this.classroomChannels.delete(classroomId);
    this.saveToStorage();
  }

  archiveChannel(channelId: string): boolean {
    const channel = this.updateChannel(channelId, { isArchived: true });
    return !!channel;
  }

  unarchiveChannel(channelId: string): boolean {
    const channel = this.updateChannel(channelId, { isArchived: false });
    return !!channel;
  }

  duplicateChannel(channelId: string, newName: string, createdBy: string): Channel | undefined {
    const original = this.channels.get(channelId);
    if (!original) return undefined;

    return this.createChannel(
      original.classroomId,
      newName,
      original.type,
      createdBy,
      original.description,
      original.isPrivate,
      {
        icon: original.icon,
        color: original.color,
        category: (original as any).category,
        settings: original.settings
      }
    );
  }

  // Member Management
  addMember(channelId: string, member: Omit<ChannelMember, 'joinedAt'>): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    if (channel.members.some(m => m.userId === member.userId)) {
      return false;
    }

    channel.members.push({
      ...member,
      joinedAt: new Date().toISOString()
    });

    channel.memberCount = channel.members.length;
    channel.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.emit('memberAdded', { channelId, member });
    return true;
  }

  addMembersBulk(channelId: string, members: Omit<ChannelMember, 'joinedAt'>[]): { successful: string[]; failed: string[] } {
    const result = { successful: [] as string[], failed: [] as string[] };

    members.forEach(member => {
      if (this.addMember(channelId, member)) {
        result.successful.push(member.userId);
      } else {
        result.failed.push(member.userId);
      }
    });

    return result;
  }

  removeMember(channelId: string, memberId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const memberIndex = channel.members.findIndex(m => m.userId === memberId || m.id === memberId);
    if (memberIndex === -1) return false;

    channel.members.splice(memberIndex, 1);
    channel.memberCount = channel.members.length;
    channel.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.emit('memberRemoved', { channelId, memberId });
    return true;
  }

  removeMembersBulk(channelId: string, memberIds: string[]): number {
    let removed = 0;
    memberIds.forEach(id => {
      if (this.removeMember(channelId, id)) {
        removed++;
      }
    });
    return removed;
  }

  getMember(channelId: string, memberId: string): ChannelMember | undefined {
    const channel = this.channels.get(channelId);
    return channel?.members.find(m => m.userId === memberId || m.id === memberId);
  }

  getChannelMembers(channelId: string, role?: 'admin' | 'moderator' | 'member'): ChannelMember[] {
    const channel = this.channels.get(channelId);
    if (!channel) return [];

    if (role) {
      return channel.members.filter(m => m.role === role);
    }

    return channel.members;
  }

  updateMemberRole(channelId: string, memberId: string, newRole: 'admin' | 'moderator' | 'member'): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const member = channel.members.find(m => m.userId === memberId || m.id === memberId);
    if (!member) return false;

    member.role = newRole;
    channel.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.emit('memberRoleUpdated', { channelId, memberId, newRole });
    return true;
  }

  isMemberOfChannel(channelId: string, userId: string): boolean {
    const channel = this.channels.get(channelId);
    return channel?.members.some(m => m.userId === userId) || false;
  }

  getUserChannels(userId: string, classroomId?: string): Channel[] {
    const channels: Channel[] = [];

    this.channels.forEach(channel => {
      if (classroomId && channel.classroomId !== classroomId) return;
      if (channel.members.some(m => m.userId === userId)) {
        channels.push(channel);
      }
    });

    return channels;
  }

  // Pin Management
  pinMessage(channelId: string, messageId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    if (!channel.pinnedMessages.includes(messageId)) {
      channel.pinnedMessages.push(messageId);
      channel.pinnedCount = channel.pinnedMessages.length;
      channel.updatedAt = new Date().toISOString();
      this.saveToStorage();
      this.emit('messagePinned', { channelId, messageId });
    }

    return true;
  }

  unpinMessage(channelId: string, messageId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const index = channel.pinnedMessages.indexOf(messageId);
    if (index > -1) {
      channel.pinnedMessages.splice(index, 1);
      channel.pinnedCount = channel.pinnedMessages.length;
      channel.updatedAt = new Date().toISOString();
      this.saveToStorage();
      this.emit('messageUnpinned', { channelId, messageId });
    }

    return true;
  }

  getPinnedMessages(channelId: string): string[] {
    return this.channels.get(channelId)?.pinnedMessages || [];
  }

  // Channel Ordering
  reorderChannels(classroomId: string, channelOrder: string[]): boolean {
    const channelIds = this.classroomChannels.get(classroomId);
    if (!channelIds) return false;

    channelOrder.forEach((channelId, index) => {
      const channel = this.channels.get(channelId);
      if (channel) {
        channel.position = index;
      }
    });

    this.saveToStorage();
    this.emit('channelsReordered', { classroomId, channelOrder });
    return true;
  }

  // Channel Search
  searchChannels(classroomId: string, query: string, options?: { includeArchived?: boolean }): Channel[] {
    return this.getChannels({
      classroomId,
      searchQuery: query,
      isArchived: options?.includeArchived ? undefined : false
    });
  }

  searchChannelsGlobal(query: string, classroomIds?: string[]): Channel[] {
    const results: Channel[] = [];
    const lowerQuery = query.toLowerCase();

    this.channels.forEach(channel => {
      if (classroomIds && !classroomIds.includes(channel.classroomId)) return;

      if (
        channel.name.toLowerCase().includes(lowerQuery) ||
        channel.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push(channel);
      }
    });

    return results;
  }

  // Category Management
  createCategory(classroomId: string, name: string, description: string, options?: { icon?: string; color?: string }): ChannelCategory {
    const category: ChannelCategory = {
      id: `CAT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      description,
      classroomId,
      isDefault: false,
      order: this.getCategoryCount(classroomId) + 1
    };

    if (options?.icon) category.icon = options.icon;
    if (options?.color) category.color = options.color;

    this.channelCategories.set(category.id, category);
    this.saveToStorage();

    this.emit('categoryCreated', category);
    return category;
  }

  getCategory(categoryId: string): ChannelCategory | undefined {
    return this.channelCategories.get(categoryId);
  }

  getClassroomCategories(classroomId: string): ChannelCategory[] {
    return Array.from(this.channelCategories.values())
      .filter(c => c.classroomId === classroomId || c.isDefault)
      .sort((a, b) => a.order - b.order);
  }

  private getCategoryCount(classroomId: string): number {
    return Array.from(this.channelCategories.values())
      .filter(c => c.classroomId === classroomId && !c.isDefault).length;
  }

  updateCategory(categoryId: string, updates: Partial<Omit<ChannelCategory, 'id' | 'classroomId'>>): ChannelCategory | undefined {
    const category = this.channelCategories.get(categoryId);
    if (!category) return undefined;

    Object.assign(category, updates);
    this.saveToStorage();

    this.emit('categoryUpdated', category);
    return category;
  }

  deleteCategory(categoryId: string): boolean {
    const category = this.channelCategories.get(categoryId);
    if (!category || category.isDefault) return false;

    this.channelCategories.delete(categoryId);
    this.saveToStorage();

    this.emit('categoryDeleted', { categoryId });
    return true;
  }

  assignChannelToCategory(channelId: string, categoryId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    (channel as any).category = categoryId;
    channel.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.emit('channelCategoryChanged', { channelId, categoryId });
    return true;
  }

  // Template Management
  createTemplate(template: Omit<ChannelTemplate, 'id'>): ChannelTemplate {
    const id = `TEMPLATE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTemplate: ChannelTemplate = { ...template, id };

    this.channelTemplates.set(id, newTemplate);
    this.saveToStorage();

    this.emit('templateCreated', newTemplate);
    return newTemplate;
  }

  getTemplate(templateId: string): ChannelTemplate | undefined {
    return this.channelTemplates.get(templateId);
  }

  getAllTemplates(): ChannelTemplate[] {
    return Array.from(this.channelTemplates.values());
  }

  getTemplatesByCategory(category?: string): ChannelTemplate[] {
    return Array.from(this.channelTemplates.values())
      .filter(t => !category || t.category === category);
  }

  updateTemplate(templateId: string, updates: Partial<Omit<ChannelTemplate, 'id' | 'isSystemTemplate'>>): ChannelTemplate | undefined {
    const template = this.channelTemplates.get(templateId);
    if (!template || template.isSystemTemplate) return undefined;

    Object.assign(template, updates);
    this.saveToStorage();

    this.emit('templateUpdated', template);
    return template;
  }

  deleteTemplate(templateId: string): boolean {
    const template = this.channelTemplates.get(templateId);
    if (!template || template.isSystemTemplate) return false;

    this.channelTemplates.delete(templateId);
    this.saveToStorage();

    this.emit('templateDeleted', { templateId });
    return true;
  }

  // Channel Analytics
  private initializeChannelAnalytics(channelId: string): void {
    const analytics: ChannelAnalytics = {
      channelId,
      totalMessages: 0,
      messagesThisWeek: 0,
      messagesThisMonth: 0,
      averageMessagesPerDay: 0,
      mostActiveDay: '',
      mostActiveHour: 0,
      uniqueParticipants: 0,
      totalMediaShared: 0,
      totalReactions: 0,
      threadParticipation: 0,
      peakActivityDate: new Date().toISOString(),
      growthRate: 0,
      engagementScore: 0
    };

    this.channelAnalytics.set(channelId, analytics);
  }

  getChannelAnalytics(channelId: string): ChannelAnalytics | undefined {
    return this.channelAnalytics.get(channelId);
  }

  updateChannelAnalytics(channelId: string, updates: Partial<ChannelAnalytics>): boolean {
    let analytics = this.channelAnalytics.get(channelId);

    if (!analytics) {
      this.initializeChannelAnalytics(channelId);
      analytics = this.channelAnalytics.get(channelId);
    }

    if (!analytics) return false;

    Object.assign(analytics, updates);
    this.saveToStorage();

    return true;
  }

  recordMessage(channelId: string, userId: string): void {
    const analytics = this.channelAnalytics.get(channelId);
    if (!analytics) return;

    analytics.totalMessages++;
    analytics.messagesThisWeek++;
    analytics.messagesThisMonth++;

    const today = new Date();
    analytics.mostActiveDay = today.toLocaleDateString('en-US', { weekday: 'long' });
    analytics.mostActiveHour = today.getHours();

    const uniqueUsers = new Set([userId]);
    analytics.uniqueParticipants = Math.max(analytics.uniqueParticipants, uniqueUsers.size);

    this.updateChannelAnalytics(channelId, analytics);
  }

  // Channel Invitations
  createInvitation(
    channelId: string,
    invitedBy: string,
    invitedByName: string,
    options?: {
      invitedUserId?: string;
      invitedEmail?: string;
      role?: 'admin' | 'moderator' | 'member';
      expiresIn?: number;
      message?: string;
    }
  ): ChannelInvitation {
    const invitation: ChannelInvitation = {
      id: `INVITE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      invitedBy,
      invitedByName,
      invitedUserId: options?.invitedUserId,
      invitedEmail: options?.invitedEmail,
      role: options?.role || 'member',
      status: 'pending',
      expiresAt: new Date(Date.now() + (options?.expiresIn || 7 * 24 * 60 * 60 * 1000)).toISOString(),
      createdAt: new Date().toISOString(),
      message: options?.message
    };

    this.channelInvitations.set(invitation.id, invitation);
    this.saveToStorage();

    this.emit('invitationCreated', invitation);
    return invitation;
  }

  getInvitation(invitationId: string): ChannelInvitation | undefined {
    return this.channelInvitations.get(invitationId);
  }

  getChannelInvitations(channelId: string, status?: 'pending' | 'accepted' | 'declined' | 'expired'): ChannelInvitation[] {
    let invitations = Array.from(this.channelInvitations.values())
      .filter(i => i.channelId === channelId);

    if (status) {
      invitations = invitations.filter(i => i.status === status);
    }

    return invitations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getPendingInvitationsForUser(userId: string): ChannelInvitation[] {
    return Array.from(this.channelInvitations.values())
      .filter(i =>
        i.invitedUserId === userId &&
        i.status === 'pending' &&
        new Date(i.expiresAt).getTime() > Date.now()
      );
  }

  respondToInvitation(invitationId: string, accept: boolean): boolean {
    const invitation = this.channelInvitations.get(invitationId);
    if (!invitation || invitation.status !== 'pending') return false;

    invitation.status = accept ? 'accepted' : 'declined';

    if (accept) {
      const channel = this.channels.get(invitation.channelId);
      if (channel) {
        this.addMember(invitation.channelId, {
          id: invitation.invitedUserId || invitation.invitedEmail || 'unknown',
          userId: invitation.invitedUserId || '',
          name: invitation.invitedByName,
          role: invitation.role
        });
      }
    }

    this.saveToStorage();
    this.emit('invitationResponded', invitation);
    return true;
  }

  cancelInvitation(invitationId: string): boolean {
    const invitation = this.channelInvitations.get(invitationId);
    if (!invitation || invitation.status !== 'pending') return false;

    invitation.status = 'expired';
    this.saveToStorage();

    this.emit('invitationCancelled', { invitationId });
    return true;
  }

  // Channel Bookmarks
  addBookmark(channelId: string, userId: string, messageId?: string, note?: string): ChannelBookmark {
    const bookmark: ChannelBookmark = {
      id: `BOOKMARK-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channelId,
      userId,
      messageId,
      createdAt: new Date().toISOString(),
      note
    };

    this.channelBookmarks.set(bookmark.id, bookmark);

    const userBookmarkIds = this.userBookmarks.get(userId) || [];
    userBookmarkIds.push(bookmark.id);
    this.userBookmarks.set(userId, userBookmarkIds);

    this.saveToStorage();
    this.emit('bookmarkAdded', bookmark);
    return bookmark;
  }

  removeBookmark(bookmarkId: string, userId: string): boolean {
    const bookmark = this.channelBookmarks.get(bookmarkId);
    if (!bookmark || bookmark.userId !== userId) return false;

    this.channelBookmarks.delete(bookmarkId);

    const userBookmarkIds = this.userBookmarks.get(userId) || [];
    const index = userBookmarkIds.indexOf(bookmarkId);
    if (index > -1) {
      userBookmarkIds.splice(index, 1);
    }

    this.saveToStorage();
    this.emit('bookmarkRemoved', { bookmarkId, userId });
    return true;
  }

  getUserBookmarks(userId: string): ChannelBookmark[] {
    const bookmarkIds = this.userBookmarks.get(userId) || [];
    return bookmarkIds
      .map(id => this.channelBookmarks.get(id))
      .filter((b): b is ChannelBookmark => b !== undefined)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getChannelBookmarks(channelId: string, userId: string): ChannelBookmark[] {
    return this.getUserBookmarks(userId).filter(b => b.channelId === channelId);
  }

  private deleteChannelBookmarks(channelId: string): void {
    const bookmarksToDelete: string[] = [];

    this.channelBookmarks.forEach((bookmark, id) => {
      if (bookmark.channelId === channelId) {
        bookmarksToDelete.push(id);
      }
    });

    bookmarksToDelete.forEach(id => this.channelBookmarks.delete(id));
    this.saveToStorage();
  }

  // Notification Settings
  getNotificationSettings(channelId: string, userId: string): ChannelNotificationSettings {
    const key = `${channelId}:${userId}`;
    let settings = this.notificationSettings.get(key);

    if (!settings) {
      settings = {
        channelId,
        userId,
        notifyOnNewMessage: true,
        notifyOnMentions: true,
        notifyOnReplies: true,
        notifyOnPins: true,
        customKeywords: []
      };
      this.notificationSettings.set(key, settings);
    }

    return settings;
  }

  updateNotificationSettings(channelId: string, userId: string, updates: Partial<ChannelNotificationSettings>): ChannelNotificationSettings {
    const key = `${channelId}:${userId}`;
    const settings = this.getNotificationSettings(channelId, userId);

    Object.assign(settings, updates);
    this.notificationSettings.set(key, settings);
    this.saveToStorage();

    this.emit('notificationSettingsUpdated', settings);
    return settings;
  }

  muteChannel(channelId: string, userId: string, durationMinutes?: number): ChannelNotificationSettings {
    const muteUntil = durationMinutes
      ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
      : undefined;

    return this.updateNotificationSettings(channelId, userId, {
      notifyOnNewMessage: false,
      notifyOnMentions: false,
      notifyOnReplies: false,
      notifyOnPins: false,
      muteUntil
    });
  }

  unmuteChannel(channelId: string, userId: string): ChannelNotificationSettings {
    return this.updateNotificationSettings(channelId, userId, {
      notifyOnNewMessage: true,
      notifyOnMentions: true,
      notifyOnReplies: true,
      notifyOnPins: true,
      muteUntil: undefined
    });
  }

  // Stats
  incrementMessageCount(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    channel.stats.totalMessages++;
    channel.lastActivity = new Date().toISOString();
    this.saveToStorage();

    this.recordMessage(channelId, '');

    return true;
  }

  updateStats(channelId: string, stats: Partial<Channel['stats']>): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    channel.stats = { ...channel.stats, ...stats };
    channel.updatedAt = new Date().toISOString();
    this.saveToStorage();

    this.emit('statsUpdated', { channelId, stats });
    return true;
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

  getStats(): { totalChannels: number; totalClassrooms: number; totalCategories: number; totalTemplates: number } {
    return {
      totalChannels: this.channels.size,
      totalClassrooms: this.classroomChannels.size,
      totalCategories: this.channelCategories.size,
      totalTemplates: this.channelTemplates.size
    };
  }
}

export default ChannelManager;
