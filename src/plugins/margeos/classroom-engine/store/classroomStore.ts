// @ts-nocheck
/**
 * classroomStore.ts
 *
 * Zustand store for classroom state management.
 */

import { create } from 'zustand';
import { Classroom, Channel, Message, Notification } from '../models';
import { ClassroomEngine } from '../engines';

export interface ClassroomState {
  // Current user
  currentUserId: string | null;
  currentUserName: string | null;
  currentClassroomId: string | null;
  currentChannelId: string | null;

  // Classrooms
  classrooms: Classroom[];
  selectedClassroom: Classroom | null;

  // Channels
  channels: Channel[];
  selectedChannel: Channel | null;

  // Messages
  messages: Message[];
  pinnedMessages: Message[];
  messageDraft: string;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // UI State
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  showSettings: boolean;
  showUserList: boolean;

  // Actions
  setCurrentUser: (userId: string, userName: string) => void;
  setCurrentClassroom: (classroomId: string | null) => void;
  setCurrentChannel: (channelId: string | null) => void;

  // Classroom actions
  loadClassrooms: () => Promise<void>;
  createClassroom: (name: string, description: string, teacherEmail: string, subject?: string, gradeLevel?: string) => Promise<Classroom | null>;
  selectClassroom: (classroomId: string) => void;
  archiveClassroom: (classroomId: string) => void;

  // Channel actions
  loadChannels: (classroomId: string) => Promise<void>;
  createChannel: (name: string, type: string, description?: string, isPrivate?: boolean) => Promise<Channel | null>;
  selectChannel: (channelId: string) => void;

  // Message actions
  loadMessages: (channelId: string) => Promise<void>;
  sendMessage: (content: string, contentType?: 'text' | 'html' | 'markdown') => Promise<Message | null>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  setMessageDraft: (draft: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  pinMessage: (messageId: string) => void;

  // Notification actions
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;

  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  toggleUserList: () => void;
}

const classroomEngine = ClassroomEngine.getInstance();

export const useClassroomStore = create<ClassroomState>((set, get) => ({
  // Initial state
  currentUserId: null,
  currentUserName: null,
  currentClassroomId: null,
  currentChannelId: null,

  classrooms: [],
  selectedClassroom: null,

  channels: [],
  selectedChannel: null,

  messages: [],
  pinnedMessages: [],
  messageDraft: '',

  notifications: [],
  unreadCount: 0,

  isLoading: false,
  error: null,
  sidebarOpen: true,
  showSettings: false,
  showUserList: false,

  // Set current user
  setCurrentUser: (userId, userName) => {
    set({ currentUserId: userId, currentUserName: userName });
  },

  // Set current classroom
  setCurrentClassroom: (classroomId) => {
    set({ currentClassroomId: classroomId, currentChannelId: null });
    if (classroomId) {
      get().loadChannels(classroomId);
    }
  },

  // Set current channel
  setCurrentChannel: (channelId) => {
    set({ currentChannelId: channelId });
    if (channelId) {
      get().loadMessages(channelId);
    }
  },

  // Load classrooms
  loadClassrooms: async () => {
    set({ isLoading: true, error: null });
    try {
      await classroomEngine.initialize();
      const classrooms = classroomEngine.getAllClassrooms();
      set({ classrooms, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Create classroom
  createClassroom: async (name, description, teacherEmail, subject, gradeLevel) => {
    const { currentUserId, currentUserName } = get();
    if (!currentUserId || !currentUserName) return null;

    try {
      const classroom = classroomEngine.createClassroom(
        name,
        description,
        currentUserId,
        currentUserName,
        teacherEmail,
        subject,
        gradeLevel
      );

      set(state => ({
        classrooms: [...state.classrooms, classroom]
      }));

      return classroom;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  // Select classroom
  selectClassroom: (classroomId) => {
    const { classrooms } = get();
    const classroom = classrooms.find(c => c.id === classroomId) || null;
    set({ selectedClassroom: classroom, currentClassroomId: classroomId, currentChannelId: null });
    if (classroomId) {
      get().loadChannels(classroomId);
    }
  },

  // Archive classroom
  archiveClassroom: (classroomId) => {
    classroomEngine.archiveClassroom(classroomId);
    set(state => ({
      classrooms: state.classrooms.map(c =>
        c.id === classroomId ? { ...c, isArchived: true } : c
      )
    }));
  },

  // Load channels
  loadChannels: async (classroomId) => {
    try {
      const channelManager = classroomEngine.getChannelManager();
      const channels = channelManager.getClassroomChannels(classroomId);
      set({ channels });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Create channel
  createChannel: async (name, type, description, isPrivate) => {
    const { currentClassroomId } = get();
    if (!currentClassroomId) return null;

    try {
      const channelManager = classroomEngine.getChannelManager();
      const channel = channelManager.createChannel(
        currentClassroomId,
        name,
        type as any,
        get().currentUserId || 'unknown',
        description,
        isPrivate
      );

      if (channel) {
        set(state => ({
          channels: [...state.channels, channel]
        }));
      }

      return channel || null;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  // Select channel
  selectChannel: (channelId) => {
    const { channels } = get();
    const channel = channels.find(c => c.id === channelId) || null;
    set({ selectedChannel: channel, currentChannelId: channelId, messageDraft: '' });
    if (channelId) {
      get().loadMessages(channelId);
    }
  },

  // Load messages
  loadMessages: async (channelId) => {
    try {
      const messagingEngine = classroomEngine.getMessagingEngine();
      const messages = messagingEngine.getChannelMessages(channelId);
      const pinned = messages.filter(m => m.isPinned);
      set({ messages, pinnedMessages: pinned });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Send message
  sendMessage: async (content, contentType = 'text') => {
    const { currentClassroomId, currentChannelId, currentUserId, currentUserName } = get();
    if (!currentClassroomId || !currentChannelId || !currentUserId || !currentUserName) return null;

    try {
      const messagingEngine = classroomEngine.getMessagingEngine();
      const message = messagingEngine.sendMessage(
        currentClassroomId,
        currentChannelId,
        currentUserId,
        currentUserName,
        undefined,
        content,
        contentType
      );

      set(state => ({
        messages: [message, ...state.messages],
        messageDraft: ''
      }));

      return message;
    } catch (error) {
      set({ error: (error as Error).message });
      return null;
    }
  },

  // Edit message
  editMessage: async (messageId, newContent) => {
    const { currentUserId } = get();
    if (!currentUserId) return false;

    try {
      const messagingEngine = classroomEngine.getMessagingEngine();
      const result = messagingEngine.editMessage(messageId, newContent, currentUserId);

      if (result) {
        set(state => ({
          messages: state.messages.map(m => m.id === messageId ? result : m)
        }));
      }

      return !!result;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const { currentUserId } = get();
    if (!currentUserId) return false;

    try {
      const messagingEngine = classroomEngine.getMessagingEngine();
      const result = messagingEngine.deleteMessage(messageId, currentUserId);

      if (result) {
        set(state => ({
          messages: state.messages.filter(m => m.id !== messageId),
          pinnedMessages: state.pinnedMessages.filter(m => m.id !== messageId)
        }));
      }

      return result;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    }
  },

  // Set message draft
  setMessageDraft: (draft) => {
    set({ messageDraft: draft });
  },

  // Toggle reaction
  toggleReaction: (messageId, emoji) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    const messagingEngine = classroomEngine.getMessagingEngine();
    messagingEngine.toggleReaction(messageId, currentUserId, emoji);

    // Refresh messages
    const { currentChannelId } = get();
    if (currentChannelId) {
      get().loadMessages(currentChannelId);
    }
  },

  // Pin message
  pinMessage: (messageId) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    const messagingEngine = classroomEngine.getMessagingEngine();
    messagingEngine.pinMessage(messageId, currentUserId);

    const { currentChannelId } = get();
    if (currentChannelId) {
      get().loadMessages(currentChannelId);
    }
  },

  // Load notifications
  loadNotifications: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    try {
      const notificationEngine = classroomEngine.getNotificationEngine();
      const notifications = notificationEngine.getNotifications({ recipientId: currentUserId });
      const unreadCount = notificationEngine.getUnreadCount(currentUserId);
      set({ notifications, unreadCount });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Mark notification as read
  markNotificationAsRead: (notificationId) => {
    const notificationEngine = classroomEngine.getNotificationEngine();
    notificationEngine.markAsRead(notificationId);
    get().loadNotifications();
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: () => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    const notificationEngine = classroomEngine.getNotificationEngine();
    notificationEngine.markAllAsRead(currentUserId);
    get().loadNotifications();
  },

  // UI actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSettings: () => set(state => ({ showSettings: !state.showSettings })),
  toggleUserList: () => set(state => ({ showUserList: !state.showUserList }))
}));

export default useClassroomStore;
