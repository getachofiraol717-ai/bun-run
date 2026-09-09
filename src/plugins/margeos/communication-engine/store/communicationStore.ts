/**
 * Knowledge Universe — Communication Store
 */

import { create } from 'zustand';
import {
  Conversation,
  Message,
  UserProfile,
  Presence,
  CommunicationNotification,
  Group,
  Channel,
} from '../types';

interface CommunicationStore {
  // Active state
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>; // conversation_id -> Message[]
  pinnedMessages: Record<string, Message[]>;
  
  // Realtime & Presence
  presences: Record<string, Presence>;
  typingUsers: Record<string, string[]>; // conversation_id -> user_names[]
  
  // Channels & Groups
  groups: Group[];
  channels: Channel[];
  
  // UI State
  activeTab: 'dms' | 'groups' | 'channels' | 'ai';
  searchQuery: string;
  isMediaUploading: boolean;
  uploadProgress: number;
  notifications: CommunicationNotification[];
  
  // Actions
  setActiveConversationId: (id: string | null) => void;
  setActiveTab: (tab: 'dms' | 'groups' | 'channels' | 'ai') => void;
  setSearchQuery: (query: string) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  setGroups: (groups: Group[]) => void;
  setChannels: (channels: Channel[]) => void;
  setTyping: (conversationId: string, userName: string, isTyping: boolean) => void;
  setUserPresence: (presence: Presence) => void;
  setMediaUploading: (isUploading: boolean, progress?: number) => void;
  addNotification: (notification: CommunicationNotification) => void;
  markNotificationRead: (id: string) => void;
}

export const useCommunicationStore = create<CommunicationStore>((set) => ({
  activeConversationId: null,
  activeConversation: null,
  conversations: [],
  messages: {},
  pinnedMessages: {},
  presences: {},
  typingUsers: {},
  groups: [],
  channels: [],
  activeTab: 'dms',
  searchQuery: '',
  isMediaUploading: false,
  uploadProgress: 0,
  notifications: [],

  setActiveConversationId: (id) =>
    set((state) => ({
      activeConversationId: id,
      activeConversation: state.conversations.find((c) => c.id === id) || null,
    })),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setConversations: (conversations) =>
    set((state) => ({
      conversations,
      activeConversation: state.activeConversationId
        ? conversations.find((c) => c.id === state.activeConversationId) || null
        : state.activeConversation,
    })),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations.filter((c) => c.id !== conversation.id)],
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      };
    }),

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: existing.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
        },
      };
    }),

  deleteMessage: (conversationId, messageId) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: existing.filter((m) => m.id !== messageId),
        },
      };
    }),

  setGroups: (groups) => set({ groups }),

  setChannels: (channels) => set({ channels }),

  setTyping: (conversationId, userName, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? [...new Set([...current, userName])]
        : current.filter((name) => name !== userName);
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updated,
        },
      };
    }),

  setUserPresence: (presence) =>
    set((state) => ({
      presences: {
        ...state.presences,
        [presence.user_id]: presence,
      },
    })),

  setMediaUploading: (isUploading, progress = 0) =>
    set({ isMediaUploading: isUploading, uploadProgress: progress }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    })),
}));
