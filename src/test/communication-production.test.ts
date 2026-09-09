import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationService } from '@/plugins/margeos/communication-engine/services/ConversationService';
import { MessageService } from '@/plugins/margeos/communication-engine/services/MessageService';
import { AIChatService } from '@/plugins/margeos/communication-engine/services/AIChatService';
import { useCommunicationStore } from '@/plugins/margeos/communication-engine/store/communicationStore';
import { supabase } from '@/integrations/supabase/client';
import * as aiClientModule from '@/pages/creator/aiClient';

describe('KU PHASE 7 — Real User Communication & AI Lifecycle Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    useCommunicationStore.setState({
      activeConversationId: null,
      activeConversation: null,
      conversations: [],
      messages: {},
      typingUsers: {},
      searchQuery: '',
      activeTab: 'dms',
    });
  });

  describe('1. User Search & Profile Integrity', () => {
    it('user search: queries real profiles table and returns authenticated users', async () => {
      vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { user_id: 'usr_real_1', name: 'Dr. Sarah Connor', avatar_url: 'https://example.com/avatar.jpg', subscription: 'Pro' }
                ],
                error: null,
              }),
            }),
          };
        }
        return {} as any;
      }) as any);

      const results = await ConversationService.searchUsers('Sarah');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('usr_real_1');
      expect(results[0].name).toBe('Dr. Sarah Connor');
      expect(results[0].role).toBe('Pro');
    });

    it('no results: returns honest empty array when no user profiles match query', async () => {
      vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {} as any;
      }) as any);

      const results = await ConversationService.searchUsers('NonexistentPerson');
      expect(results).toEqual([]);
      // Ensure none of the hardcoded mock users (Alex Rivera, Sophia Chen, Liam Vance, Elena Rostova) are returned
      expect(results.some((u) => u.name.includes('Alex Rivera'))).toBe(false);
      expect(results.some((u) => u.name.includes('Sophia Chen'))).toBe(false);
      expect(results.some((u) => u.name.includes('Liam Vance'))).toBe(false);
      expect(results.some((u) => u.name.includes('Elena Rostova'))).toBe(false);
    });

    it('backend error: returns honest empty array without substituting fictional users', async () => {
      vi.spyOn(supabase, 'from').mockImplementation(((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection timeout' },
              }),
            }),
          };
        }
        return {} as any;
      }) as any);

      const results = await ConversationService.searchUsers('Physics');
      expect(results).toEqual([]);
      expect(results.some((u) => u.name.includes('Alex Rivera'))).toBe(false);
    });
  });

  describe('2. Direct Messaging Real Users', () => {
    it('messaging real user: starts a DM conversation and stores messages', async () => {
      const targetUser = {
        id: 'usr_peer_42',
        name: 'Dawit Abebe',
        role: 'Astrophysics Student',
        presence: 'online' as const,
      };

      const dmConv = await ConversationService.startDirectMessage('current_user_1', targetUser);
      expect(dmConv.type).toBe('dm');
      expect(dmConv.title).toBe('Dawit Abebe');
      expect(dmConv.id).toContain('usr_peer_42');

      // Send a message
      const msg = await MessageService.sendMessage({
        conversationId: dmConv.id,
        senderId: 'current_user_1',
        senderName: 'Test Explorer',
        content: 'Hello Dawit, let us study orbital mechanics!',
      });

      expect(msg.content).toBe('Hello Dawit, let us study orbital mechanics!');
      expect(msg.conversation_id).toBe(dmConv.id);

      // Verify fetchMessages returns the sent message
      const fetched = await MessageService.fetchMessages(dmConv.id);
      expect(fetched).toHaveLength(1);
      expect(fetched[0].content).toBe('Hello Dawit, let us study orbital mechanics!');
    });
  });

  describe('3. AI Response & Temporary State Lifecycle', () => {
    it('AI response: replaces thinking placeholder with complete streamed response', async () => {
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      vi.spyOn(aiClientModule, 'aiStream').mockImplementation(async (opts: any) => {
        opts.onToken?.('Here is the ');
        opts.onToken?.('solution: E=mc²');
        return 'Here is the solution: E=mc²';
      });

      await AIChatService.processAIMention({
        prompt: 'Explain mass energy equivalence',
        conversationTitle: 'Physics Lounge',
        recentMessages: [],
        onChunk,
        onComplete,
        onError,
      });

      expect(onChunk).toHaveBeenCalledWith('Here is the ');
      expect(onChunk).toHaveBeenCalledWith('solution: E=mc²');
      expect(onComplete).toHaveBeenCalledWith('Here is the solution: E=mc²');
      expect(onError).not.toHaveBeenCalled();
    });

    it('AI failure: replaces thinking placeholder with honest failure error and does not leave permanent thinking state', async () => {
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onError = vi.fn();

      vi.spyOn(aiClientModule, 'aiStream').mockRejectedValue(new Error('Rate limit reached on AI gateway'));

      await AIChatService.processAIMention({
        prompt: 'Analyze thermodynamics',
        conversationTitle: 'Physics Lounge',
        recentMessages: [],
        onChunk,
        onComplete,
        onError,
      });

      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0][0].message).toContain('Rate limit reached on AI gateway');
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('4. Store Message Deduplication & Refresh Lifecycle', () => {
    it('duplicate messages: addMessage in communicationStore rejects duplicate message IDs', () => {
      const store = useCommunicationStore.getState();
      const testMsg = {
        id: 'msg_unique_123',
        conversation_id: 'conv_1',
        sender_id: 'usr_1',
        sender_name: 'Explorer',
        content: 'Hello universe',
        message_type: 'text' as const,
        created_at: new Date().toISOString(),
      };

      store.addMessage('conv_1', testMsg);
      expect(useCommunicationStore.getState().messages['conv_1']).toHaveLength(1);

      // Attempt to add duplicate message
      store.addMessage('conv_1', testMsg);
      expect(useCommunicationStore.getState().messages['conv_1']).toHaveLength(1);
    });

    it('refresh: fetchConversations loads AI companion and persisted real user DMs on restart', async () => {
      // Seed a persisted real user DM in localStorage
      const realDM = {
        id: 'dm_current_usr_88',
        type: 'dm' as const,
        title: 'Bethlehem Tadesse',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_private: true,
      };
      localStorage.setItem('ku_dm_conversations_user_abc', JSON.stringify([realDM]));

      const conversations = await ConversationService.fetchConversations('user_abc');
      
      // Must contain AI tutor
      expect(conversations.some((c) => c.id === 'ai_tutor_main')).toBe(true);
      // Must contain Bethlehem Tadesse
      expect(conversations.some((c) => c.title === 'Bethlehem Tadesse')).toBe(true);
      // Must NOT contain fictional Alex Rivera or Sophia Chen
      expect(conversations.some((c) => c.id === 'dm_peer_alex')).toBe(false);
      expect(conversations.some((c) => c.id === 'dm_peer_sophia')).toBe(false);
    });
  });
});
