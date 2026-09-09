/**
 * Knowledge Universe — Conversation Service
 * Manages DMs, Groups, Channels, and AI conversations.
 */

import { supabase } from '@/integrations/supabase/client';
import { Conversation, Group, Channel, UserProfile } from '../types';

export class ConversationService {
  /**
   * Fetch all conversations for the active user
   */
  static async fetchConversations(userId: string): Promise<Conversation[]> {
    const list: Conversation[] = [];

    try {
      // 1. Fetch study rooms as active group conversations
      const { data: rooms } = await (supabase as any)
        .from('study_rooms')
        .select('*')
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false })
        .limit(10);

      if (rooms) {
        rooms.forEach((r: any) => {
          list.push({
            id: `room_${r.id}`,
            type: 'group',
            title: r.name,
            subject: r.subject,
            created_at: r.created_at,
            updated_at: r.last_activity_at || r.created_at,
            created_by: r.created_by,
            is_private: false,
          });
        });
      }

      // 2. Fetch guilds
      const { data: guilds } = await (supabase as any)
        .from('guilds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (guilds) {
        guilds.forEach((g: any) => {
          list.push({
            id: `guild_${g.id}`,
            type: 'group',
            title: `${g.emoji || '🛡️'} ${g.name}`,
            description: g.description,
            subject: g.subject,
            created_at: g.created_at,
            updated_at: g.created_at,
            created_by: g.created_by,
            is_private: false,
          });
        });
      }

      // 3. AI Tutor Companion conversation
      list.push({
        id: 'ai_tutor_main',
        type: 'ai',
        title: '🤖 Knowledge Universe AI Tutor',
        description: 'Personalized AI Learning Assistant',
        subject: 'General Science & Math',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_private: true,
      });

      // 4. Load persisted real Direct Message conversations for this user
      const dmStorageKey = `ku_dm_conversations_${userId}`;
      const savedDMs = localStorage.getItem(dmStorageKey);
      if (savedDMs) {
        try {
          const parsedDMs: Conversation[] = JSON.parse(savedDMs);
          if (Array.isArray(parsedDMs)) {
            parsedDMs.forEach((dm) => {
              if (dm && dm.id && !list.some((existing) => existing.id === dm.id)) {
                list.push(dm);
              }
            });
          }
        } catch {
          // ignore corrupted local storage
        }
      }
    } catch (e) {
      console.warn('Error loading conversations:', e);
    }

    return list;
  }

  /**
   * Search real authenticated users for Direct Messages
   */
  static async searchUsers(query: string): Promise<UserProfile[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, subscription')
        .ilike('name', `%${trimmed}%`)
        .limit(10);

      if (error) {
        console.warn('User profile search error:', error.message);
        return [];
      }

      if (data && Array.isArray(data)) {
        return data.map((p) => ({
          id: p.user_id,
          name: p.name || 'Explorer',
          avatar_url: p.avatar_url || undefined,
          role: p.subscription || 'Explorer',
          presence: 'online',
        }));
      }
    } catch (e) {
      console.warn('User search error:', e);
    }

    // Honest empty array when no results or backend is unreachable
    return [];
  }

  /**
   * Start or retrieve a Direct Message conversation with a real authenticated user
   */
  static async startDirectMessage(
    currentUserId: string,
    targetUser: UserProfile
  ): Promise<Conversation> {
    const dmId = `dm_${[currentUserId, targetUser.id].sort().join('_')}`;
    const newDM: Conversation = {
      id: dmId,
      type: 'dm',
      title: targetUser.name,
      description: targetUser.role ? `${targetUser.role} • Direct Message` : 'Peer Direct Message',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_private: true,
      metadata: {
        targetUserId: targetUser.id,
        avatarUrl: targetUser.avatar_url,
      },
    };

    // Persist to user's saved DMs
    const dmStorageKey = `ku_dm_conversations_${currentUserId}`;
    try {
      const existingStr = localStorage.getItem(dmStorageKey);
      const existing: Conversation[] = existingStr ? JSON.parse(existingStr) : [];
      if (!existing.some((c) => c.id === dmId)) {
        existing.unshift(newDM);
        localStorage.setItem(dmStorageKey, JSON.stringify(existing.slice(0, 50)));
      }
    } catch (e) {
      console.warn('Failed to save DM locally:', e);
    }

    return newDM;
  }

  /**
   * Create a new group or channel conversation
   */
  static async createGroup(name: string, subject: string, description?: string): Promise<Conversation> {
    const id = 'group_' + Date.now();
    const newConv: Conversation = {
      id,
      type: 'group',
      title: name,
      subject,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_private: false,
    };
    return newConv;
  }
}
