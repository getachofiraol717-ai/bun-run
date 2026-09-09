// @ts-nocheck
/**
 * useChannels.ts
 *
 * React hook for channel operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChannelManager } from '../engines';
import { Channel, ChannelType } from '../models';

export interface UseChannelsOptions {
  classroomId?: string;
  includeArchived?: boolean;
}

export interface UseChannelsReturn {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  selectedChannel: Channel | null;
  selectChannel: (channelId: string) => void;
  createChannel: (name: string, type: ChannelType, description?: string, isPrivate?: boolean) => Channel | null;
  updateChannel: (channelId: string, updates: Partial<Channel>) => boolean;
  deleteChannel: (channelId: string) => boolean;
  archiveChannel: (channelId: string) => boolean;
  searchChannels: (query: string) => Channel[];
  getChannelInfo: (type: ChannelType) => { name: string; icon: string; description: string };
}

export function useChannels(
  options: UseChannelsOptions = {}
): UseChannelsReturn {
  const { classroomId } = options;

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const channelManager = ChannelManager.getInstance();

  // Load channels
  const loadChannels = useCallback(async () => {
    if (!classroomId) return;

    setLoading(true);
    setError(null);

    try {
      const loadedChannels = channelManager.getClassroomChannels(classroomId);
      setChannels(loadedChannels);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [classroomId, channelManager]);

  // Initial load
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Subscribe to channel updates
  useEffect(() => {
    if (!classroomId) return;

    const unsubscribeCreated = channelManager.subscribe('channelCreated', (channel) => {
      if (channel.classroomId === classroomId) {
        setChannels(prev => [...prev, channel]);
      }
    });

    const unsubscribeUpdated = channelManager.subscribe('channelUpdated', (channel) => {
      setChannels(prev => prev.map(c => c.id === channel.id ? channel : c));
    });

    const unsubscribeDeleted = channelManager.subscribe('channelDeleted', (data) => {
      if (data.classroomId === classroomId) {
        setChannels(prev => prev.filter(c => c.id !== data.channelId));
      }
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [classroomId, channelManager]);

  // Get selected channel
  const selectedChannel = selectedChannelId
    ? channels.find(c => c.id === selectedChannelId) || null
    : null;

  // Select channel
  const selectChannel = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
  }, []);

  // Create channel
  const createChannel = useCallback((
    name: string,
    type: ChannelType,
    description?: string,
    isPrivate?: boolean
  ): Channel | null => {
    if (!classroomId) return null;

    try {
      const channel = channelManager.createChannel(
        classroomId,
        name,
        type,
        'current-user',
        description,
        isPrivate
      );

      return channel || null;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [classroomId, channelManager]);

  // Update channel
  const updateChannel = useCallback((channelId: string, updates: Partial<Channel>): boolean => {
    try {
      const result = channelManager.updateChannel(channelId, updates);
      return !!result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [channelManager]);

  // Delete channel
  const deleteChannel = useCallback((channelId: string): boolean => {
    try {
      const result = channelManager.deleteChannel(channelId);
      if (result && selectedChannelId === channelId) {
        setSelectedChannelId(null);
      }
      return result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [channelManager, selectedChannelId]);

  // Archive channel
  const archiveChannel = useCallback((channelId: string): boolean => {
    try {
      const result = channelManager.archiveChannel(channelId);
      return !!result;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [channelManager]);

  // Search channels
  const searchChannels = useCallback((query: string): Channel[] => {
    if (!classroomId) return [];
    return channelManager.searchChannels(classroomId, query);
  }, [classroomId, channelManager]);

  // Get channel type info
  const getChannelInfo = useCallback((type: ChannelType) => {
    const typeInfo: Record<ChannelType, { name: string; icon: string; description: string }> = {
      general: { name: 'General', icon: 'hash', description: 'General discussion' },
      announcements: { name: 'Announcements', icon: 'megaphone', description: 'Important updates' },
      subject: { name: 'Subject', icon: 'book', description: 'Subject discussions' },
      assignment: { name: 'Assignment', icon: 'clipboard', description: 'Assignment discussions' },
      project: { name: 'Project', icon: 'folder', description: 'Project collaboration' },
      study_group: { name: 'Study Group', icon: 'users', description: 'Study group' },
      qna: { name: 'Q&A', icon: 'help-circle', description: 'Questions and answers' },
      resources: { name: 'Resources', icon: 'paperclip', description: 'Shared resources' },
      discussion: { name: 'Discussion', icon: 'message-circle', description: 'Open discussions' },
      voice: { name: 'Voice', icon: 'mic', description: 'Voice channel' },
      direct: { name: 'Direct', icon: 'user', description: 'Direct message' },
      group: { name: 'Group', icon: 'users', description: 'Group message' }
    };

    return typeInfo[type] || typeInfo.general;
  }, []);

  return {
    channels,
    loading,
    error,
    selectedChannel,
    selectChannel,
    createChannel,
    updateChannel,
    deleteChannel,
    archiveChannel,
    searchChannels,
    getChannelInfo
  };
}

export default useChannels;
