// @ts-nocheck
/**
 * ClassroomAnalyticsService.ts
 *
 * High-level service for classroom analytics and statistics.
 */

import { ClassroomEngine, MessagingEngine, ChannelManager, MediaManager, VoiceNoteEngine, PresenceEngine } from '../engines';

export interface ClassroomStats {
  classroomId: string;
  totalMembers: number;
  activeMembers: number;
  totalMessages: number;
  totalReplies: number;
  totalMedia: number;
  totalVoiceNotes: number;
  totalChannels: number;
  totalAnnouncements: number;
  avgMessagesPerDay: number;
  mostActiveChannel: string;
  mostActiveHour: number;
  engagementScore: number;
}

export interface MemberStats {
  userId: string;
  userName: string;
  messagesSent: number;
  mediaShared: number;
  voiceNotesSent: number;
  reactionsGiven: number;
  reactionsReceived: number;
  avgResponseTime: number;
  participationRate: number;
  lastActive: string;
  streakDays: number;
}

export interface ActivityStats {
  date: string;
  messages: number;
  membersActive: number;
  mediaUploaded: number;
  voiceNotesSent: number;
}

export interface ChannelStats {
  channelId: string;
  channelName: string;
  totalMessages: number;
  totalMembers: number;
  avgMessagesPerMember: number;
  lastActivity: string;
  pinnedCount: number;
}

class ClassroomAnalyticsService {
  private static instance: ClassroomAnalyticsService;
  private classroomEngine: ClassroomEngine;
  private messagingEngine: MessagingEngine;
  private channelManager: ChannelManager;
  private mediaManager: MediaManager;
  private voiceNoteEngine: VoiceNoteEngine;
  private presenceEngine: PresenceEngine;

  private constructor() {
    this.classroomEngine = ClassroomEngine.getInstance();
    this.messagingEngine = MessagingEngine.getInstance();
    this.channelManager = ChannelManager.getInstance();
    this.mediaManager = MediaManager.getInstance();
    this.voiceNoteEngine = VoiceNoteEngine.getInstance();
    this.presenceEngine = PresenceEngine.getInstance();
  }

  static getInstance(): ClassroomAnalyticsService {
    if (!ClassroomAnalyticsService.instance) {
      ClassroomAnalyticsService.instance = new ClassroomAnalyticsService();
    }
    return ClassroomAnalyticsService.instance;
  }

  async initialize(): Promise<void> {
    await this.classroomEngine.initialize();
  }

  // Get comprehensive classroom statistics
  getClassroomStats(classroomId: string): ClassroomStats | null {
    const classroom = this.classroomEngine.getClassroom(classroomId);
    if (!classroom) return null;

    const channels = this.channelManager.getClassroomChannels(classroomId);
    const onlineUsers = this.presenceEngine.getOnlineUsers(classroomId);

    let totalMessages = 0;
    let totalReplies = 0;
    let totalMedia = 0;
    let totalVoiceNotes = 0;
    let mostActiveChannel = '';
    let mostActiveCount = 0;
    let totalAnnouncements = 0;

    channels.forEach(channel => {
      const messageStats = this.messagingEngine.getMessageStats(channel.id);
      totalMessages += messageStats.totalMessages;
      totalReplies += messageStats.totalReplies;

      const mediaStats = this.mediaManager.getMediaStats(channel.id);
      totalMedia += mediaStats.totalMedia;

      const voiceStats = this.voiceNoteEngine.getVoiceNoteStats(channel.id);
      totalVoiceNotes += voiceStats.totalNotes;

      if (channel.type === 'announcements') {
        totalAnnouncements += messageStats.totalMessages;
      }

      if (messageStats.totalMessages > mostActiveCount) {
        mostActiveCount = messageStats.totalMessages;
        mostActiveChannel = channel.name;
      }
    });

    const engagementScore = this.calculateEngagementScore(classroomId, classroom.members.length, totalMessages);

    // Calculate average messages per day (assuming 30 day window)
    const daysActive = 30;
    const avgMessagesPerDay = totalMessages / daysActive;

    // Calculate most active hour from message stats
    let hourCounts: number[] = new Array(24).fill(0);
    channels.forEach(channel => {
      const stats = this.messagingEngine.getMessageStats(channel.id);
      hourCounts[stats.mostActiveHour]++;
    });
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      classroomId,
      totalMembers: classroom.members.length,
      activeMembers: onlineUsers.length,
      totalMessages,
      totalReplies,
      totalMedia,
      totalVoiceNotes,
      totalChannels: channels.length,
      totalAnnouncements,
      avgMessagesPerDay,
      mostActiveChannel,
      mostActiveHour,
      engagementScore
    };
  }

  // Calculate engagement score
  private calculateEngagementScore(classroomId: string, memberCount: number, totalMessages: number): number {
    if (memberCount === 0) return 0;

    const participationRate = Math.min(totalMessages / (memberCount * 10), 1); // Assume 10 messages per member is good
    const baseScore = participationRate * 100;

    // Add factors for variety (channels used, etc.)
    const channels = this.channelManager.getClassroomChannels(classroomId);
    const channelFactor = Math.min(channels.length / 5, 1) * 20;

    return Math.min(Math.round(baseScore + channelFactor), 100);
  }

  // Get member statistics
  getMemberStats(classroomId: string): MemberStats[] {
    const classroom = this.classroomEngine.getClassroom(classroomId);
    if (!classroom) return [];

    const channels = this.channelManager.getClassroomChannels(classroomId);

    return classroom.members.map(member => {
      let messagesSent = 0;
      let mediaShared = 0;
      let voiceNotesSent = 0;
      let reactionsGiven = 0;
      let reactionsReceived = 0;

      channels.forEach(channel => {
        const messages = this.messagingEngine.getChannelMessages(channel.id);
        const memberMessages = messages.filter(m => m.senderId === member.userId);
        messagesSent += memberMessages.length;

        memberMessages.forEach(message => {
          reactionsGiven += message.reactions.length;
          reactionsReceived += message.reactions.filter(r => r.userId !== member.userId).length;
        });

        const media = this.mediaManager.getChannelMedia(channel.id);
        mediaShared += media.filter(m => m.uploadedBy === member.userId).length;

        const voiceNotes = this.voiceNoteEngine.getChannelVoiceNotes(channel.id);
        voiceNotesSent += voiceNotes.filter(n => n.senderId === member.userId).length;
      });

      const avgResponseTime = member.stats.avgResponseTime || 0;
      const participationRate = memberCount => {
        const expectedMessages = 30; // 30 day expectation
        return Math.min(messagesSent / expectedMessages, 1) * 100;
      };

      return {
        userId: member.userId,
        userName: member.name,
        messagesSent,
        mediaShared,
        voiceNotesSent,
        reactionsGiven,
        reactionsReceived,
        avgResponseTime,
        participationRate: participationRate(memberCount),
        lastActive: member.lastActive,
        streakDays: member.stats.streakDays || 0
      };
    }).sort((a, b) => b.messagesSent - a.messagesSent);
  }

  // Get activity over time
  getActivityStats(classroomId: string, days: number = 30): ActivityStats[] {
    const channels = this.channelManager.getClassroomChannels(classroomId);
    const stats: ActivityStats[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      let messages = 0;
      let mediaUploaded = 0;
      let voiceNotesSent = 0;
      const membersActive = new Set<string>();

      channels.forEach(channel => {
        const channelMessages = this.messagingEngine.getChannelMessages(channel.id);
        const dayMessages = channelMessages.filter(m => m.createdAt.startsWith(dateStr));

        messages += dayMessages.length;
        dayMessages.forEach(m => membersActive.add(m.senderId));

        const media = this.mediaManager.getChannelMedia(channel.id);
        mediaUploaded += media.filter(m => m.createdAt.startsWith(dateStr)).length;

        const voiceNotes = this.voiceNoteEngine.getChannelVoiceNotes(channel.id);
        voiceNotesSent += voiceNotes.filter(n => n.createdAt.startsWith(dateStr)).length;
      });

      stats.push({
        date: dateStr,
        messages,
        membersActive: membersActive.size,
        mediaUploaded,
        voiceNotesSent
      });
    }

    return stats.reverse();
  }

  // Get channel statistics
  getChannelStats(classroomId: string): ChannelStats[] {
    const channels = this.channelManager.getClassroomChannels(classroomId);

    return channels.map(channel => {
      const stats = this.messagingEngine.getMessageStats(channel.id);

      return {
        channelId: channel.id,
        channelName: channel.name,
        totalMessages: stats.totalMessages,
        totalMembers: channel.members.length,
        avgMessagesPerMember: channel.members.length > 0
          ? stats.totalMessages / channel.members.length
          : 0,
        lastActivity: channel.lastActivity || channel.createdAt,
        pinnedCount: channel.pinnedCount
      };
    }).sort((a, b) => b.totalMessages - a.totalMessages);
  }

  // Get top contributors
  getTopContributors(classroomId: string, limit: number = 10): MemberStats[] {
    return this.getMemberStats(classroomId)
      .slice(0, limit);
  }

  // Get most used reactions
  getMostUsedReactions(classroomId: string): Array<{ emoji: string; count: number }> {
    const channels = this.channelManager.getClassroomChannels(classroomId);
    const reactionCounts: Map<string, number> = new Map();

    channels.forEach(channel => {
      const messages = this.messagingEngine.getChannelMessages(channel.id);
      messages.forEach(message => {
        message.reactions.forEach(reaction => {
          const count = reactionCounts.get(reaction.emoji) || 0;
          reactionCounts.set(reaction.emoji, count + 1);
        });
      });
    });

    return Array.from(reactionCounts.entries())
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Get engagement trends
  getEngagementTrends(classroomId: string, weeks: number = 4): number[] {
    const trends: number[] = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const startStr = weekStart.toISOString();
      const endStr = weekEnd.toISOString();

      const channels = this.channelManager.getClassroomChannels(classroomId);
      let weekMessages = 0;

      channels.forEach(channel => {
        const messages = this.messagingEngine.getChannelMessages(channel.id);
        weekMessages += messages.filter(m =>
          m.createdAt >= startStr && m.createdAt < endStr
        ).length;
      });

      trends.unshift(weekMessages);
    }

    return trends;
  }

  // Format hour for display
  formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  }
}

export default ClassroomAnalyticsService;
