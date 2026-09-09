/**
 * channelUtils.ts
 *
 * Utility functions for channel operations.
 */

/**
 * Get channel type info
 */
export function getChannelTypeInfo(type: string): { name: string; icon: string; description: string; color: string } {
  const typeInfo: Record<string, { name: string; icon: string; description: string; color: string }> = {
    general: { name: 'General', icon: 'hash', description: 'General discussion', color: '#5865F2' },
    announcements: { name: 'Announcements', icon: 'megaphone', description: 'Important updates', color: '#FAA61A' },
    subject: { name: 'Subject', icon: 'book', description: 'Subject discussions', color: '#43B581' },
    assignment: { name: 'Assignment', icon: 'clipboard', description: 'Assignment discussions', color: '#F04747' },
    project: { name: 'Project', icon: 'folder', description: 'Project collaboration', color: '#9B59B6' },
    study_group: { name: 'Study Group', icon: 'users', description: 'Study group', color: '#3498DB' },
    qna: { name: 'Q&A', icon: 'help-circle', description: 'Questions and answers', color: '#1ABC9C' },
    resources: { name: 'Resources', icon: 'paperclip', description: 'Shared resources', color: '#E67E22' },
    discussion: { name: 'Discussion', icon: 'message-circle', description: 'Open discussions', color: '#95A5A6' },
    voice: { name: 'Voice', icon: 'mic', description: 'Voice channel', color: '#2ECC71' },
    direct: { name: 'Direct', icon: 'user', description: 'Direct message', color: '#7289DA' },
    group: { name: 'Group', icon: 'users', description: 'Group message', color: '#747FDC' }
  };

  return typeInfo[type] || typeInfo.general;
}

/**
 * Sort channels by type and position
 */
export function sortChannels(channels: any[]): any[] {
  const typeOrder = [
    'announcements',
    'general',
    'subject',
    'assignment',
    'project',
    'study_group',
    'qna',
    'resources',
    'discussion',
    'voice',
    'direct',
    'group'
  ];

  return [...channels].sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.type);
    const bIndex = typeOrder.indexOf(b.type);

    if (aIndex !== bIndex) {
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    }

    return a.position - b.position;
  });
}

/**
 * Filter channels by search query
 */
export function filterChannels(channels: any[], query: string): any[] {
  if (!query) return channels;

  const lowerQuery = query.toLowerCase();
  return channels.filter(channel =>
    channel.name.toLowerCase().includes(lowerQuery) ||
    channel.description?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get unread count for channel
 */
export function getChannelUnreadCount(channel: any, userId: string): number {
  return channel.unreadBy?.[userId] || 0;
}

/**
 * Check if channel is muted
 */
export function isChannelMuted(channel: any, userId: string): boolean {
  const member = channel.members?.find((m: any) => m.userId === userId);
  return member?.isMuted || false;
}

/**
 * Get channel member count
 */
export function getChannelMemberCount(channel: any): number {
  return channel.members?.length || 0;
}

/**
 * Check if user has permission to post in channel
 */
export function canPostInChannel(channel: any, userRole: string): boolean {
  if (channel.type === 'announcements' && userRole !== 'teacher' && userRole !== 'admin') {
    return false;
  }
  return true;
}

/**
 * Generate channel slug from name
 */
export function generateChannelSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validate channel name
 */
export function validateChannelName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Channel name is required' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Channel name must be 50 characters or less' };
  }

  if (!/^[a-zA-Z0-9-_ ]+$/.test(name)) {
    return { valid: false, error: 'Channel name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }

  return { valid: true };
}

/**
 * Get channel display name
 */
export function getChannelDisplayName(channel: any): string {
  if (channel.type === 'direct') {
    return channel.members?.[0]?.name || 'Unknown';
  }
  if (channel.type === 'group') {
    return channel.name || 'Group';
  }
  return '#' + channel.name;
}
