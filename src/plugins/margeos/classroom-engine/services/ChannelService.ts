// @ts-nocheck
/**
 * ChannelService.ts
 *
 * High-level service for channel operations.
 */

import { ChannelManager } from '../engines';
import { Channel, ChannelType } from '../models';

export interface CreateChannelOptions {
  name: string;
  type: ChannelType;
  description?: string;
  isPrivate?: boolean;
  icon?: string;
}

class ChannelService {
  private static instance: ChannelService;
  private channelManager: ChannelManager;

  private constructor() {
    this.channelManager = ChannelManager.getInstance();
  }

  static getInstance(): ChannelService {
    if (!ChannelService.instance) {
      ChannelService.instance = new ChannelService();
    }
    return ChannelService.instance;
  }

  async initialize(): Promise<void> {
    await this.channelManager.initialize();
  }

  // Create a new channel
  createChannel(
    classroomId: string,
    options: CreateChannelOptions,
    createdBy: string
  ): Channel | undefined {
    return this.channelManager.createChannel(
      classroomId,
      options.name,
      options.type,
      createdBy,
      options.description,
      options.isPrivate
    );
  }

  // Get channel by ID
  getChannel(channelId: string): Channel | undefined {
    return this.channelManager.getChannel(channelId);
  }

  // Get all channels for a classroom
  getClassroomChannels(classroomId: string): Channel[] {
    return this.channelManager.getClassroomChannels(classroomId);
  }

  // Get channels by type
  getChannelsByType(classroomId: string, type: ChannelType): Channel[] {
    return this.channelManager.getChannels({ classroomId, type });
  }

  // Update channel
  updateChannel(
    channelId: string,
    updates: Partial<Pick<Channel, 'name' | 'description' | 'isPrivate' | 'icon'>>
  ): Channel | undefined {
    return this.channelManager.updateChannel(channelId, updates);
  }

  // Delete channel
  deleteChannel(channelId: string): boolean {
    return this.channelManager.deleteChannel(channelId);
  }

  // Archive channel
  archiveChannel(channelId: string): boolean {
    return this.channelManager.archiveChannel(channelId);
  }

  // Unarchive channel
  unarchiveChannel(channelId: string): boolean {
    return this.channelManager.unarchiveChannel(channelId);
  }

  // Add member to channel
  addMember(channelId: string, member: { userId: string; userName: string; role: 'admin' | 'moderator' | 'member' }): boolean {
    return this.channelManager.addMember(channelId, {
      id: `CH-M-${Date.now()}`,
      userId: member.userId,
      name: member.userName,
      role: member.role,
      isMuted: false,
      isHidden: false,
      notificationsEnabled: true,
      joinedAt: new Date().toISOString()
    });
  }

  // Remove member from channel
  removeMember(channelId: string, memberId: string): boolean {
    return this.channelManager.removeMember(channelId, memberId);
  }

  // Update member role
  updateMemberRole(channelId: string, memberId: string, newRole: 'admin' | 'moderator' | 'member'): boolean {
    return this.channelManager.updateMemberRole(channelId, memberId, newRole);
  }

  // Pin message
  pinMessage(channelId: string, messageId: string): boolean {
    return this.channelManager.pinMessage(channelId, messageId);
  }

  // Unpin message
  unpinMessage(channelId: string, messageId: string): boolean {
    return this.channelManager.unpinMessage(channelId, messageId);
  }

  // Reorder channels
  reorderChannels(classroomId: string, channelOrder: string[]): boolean {
    return this.channelManager.reorderChannels(classroomId, channelOrder);
  }

  // Search channels
  searchChannels(classroomId: string, query: string): Channel[] {
    return this.channelManager.searchChannels(classroomId, query);
  }

  // Get channel type info
  getChannelTypeInfo(type: ChannelType): { name: string; icon: string; description: string; defaultRole: string } {
    const typeInfo: Record<ChannelType, { name: string; icon: string; description: string; defaultRole: string }> = {
      general: {
        name: 'General',
        icon: 'hash',
        description: 'General discussion channel',
        defaultRole: 'member'
      },
      announcements: {
        name: 'Announcements',
        icon: 'megaphone',
        description: 'Important announcements and updates',
        defaultRole: 'admin'
      },
      subject: {
        name: 'Subject',
        icon: 'book',
        description: 'Subject-specific discussions',
        defaultRole: 'member'
      },
      assignment: {
        name: 'Assignment',
        icon: 'clipboard-list',
        description: 'Assignment discussions and submissions',
        defaultRole: 'member'
      },
      project: {
        name: 'Project',
        icon: 'folder',
        description: 'Project collaboration channel',
        defaultRole: 'member'
      },
      study_group: {
        name: 'Study Group',
        icon: 'users',
        description: 'Study group discussions',
        defaultRole: 'member'
      },
      qna: {
        name: 'Q&A',
        icon: 'question-mark-circle',
        description: 'Questions and answers',
        defaultRole: 'member'
      },
      resources: {
        name: 'Resources',
        icon: 'paper-clip',
        description: 'Shared learning resources',
        defaultRole: 'member'
      },
      discussion: {
        name: 'Discussion',
        icon: 'chat',
        description: 'Open discussions',
        defaultRole: 'member'
      },
      voice: {
        name: 'Voice',
        icon: 'microphone',
        description: 'Voice discussions',
        defaultRole: 'member'
      },
      direct: {
        name: 'Direct Message',
        icon: 'user',
        description: 'Direct message channel',
        defaultRole: 'member'
      },
      group: {
        name: 'Group',
        icon: 'user-group',
        description: 'Group message channel',
        defaultRole: 'member'
      }
    };

    return typeInfo[type] || typeInfo.general;
  }

  // Get all channel types
  getAllChannelTypes(): Array<{ type: ChannelType; info: { name: string; icon: string; description: string } }> {
    const types: ChannelType[] = [
      'general', 'announcements', 'subject', 'assignment', 'project',
      'study_group', 'qna', 'resources', 'discussion', 'voice', 'direct', 'group'
    ];

    return types.map(type => ({
      type,
      info: this.getChannelTypeInfo(type)
    }));
  }

  // Check if channel type allows messages
  canPostMessages(type: ChannelType): boolean {
    const noPostTypes: ChannelType[] = ['announcements', 'resources'];
    return !noPostTypes.includes(type);
  }

  // Check if channel is announcement-only
  isAnnouncementOnly(type: ChannelType): boolean {
    return type === 'announcements';
  }
}

export default ChannelService;
