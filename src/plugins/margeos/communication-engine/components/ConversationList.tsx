import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Users, Hash, Bot, Plus, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { Conversation, UserProfile } from '../types';
import { ConversationService } from '../services/ConversationService';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeTab: 'dms' | 'groups' | 'channels' | 'ai';
  searchQuery: string;
  onSelectConversation: (id: string) => void;
  onSelectTab: (tab: 'dms' | 'groups' | 'channels' | 'ai') => void;
  onSearchChange: (query: string) => void;
  onCreateGroup?: () => void;
  onStartDirectMessage?: (user: UserProfile) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  activeTab,
  searchQuery,
  onSelectConversation,
  onSelectTab,
  onSearchChange,
  onCreateGroup,
  onStartDirectMessage,
}) => {
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Debounced search for real user profiles when in DMs tab or global search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || activeTab !== 'dms') {
      setSearchedUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    let isMounted = true;
    setIsSearchingUsers(true);

    const timer = setTimeout(async () => {
      try {
        const results = await ConversationService.searchUsers(trimmed);
        if (isMounted) {
          setSearchedUsers(results);
        }
      } catch (err) {
        if (isMounted) {
          setSearchedUsers([]);
        }
      } finally {
        if (isMounted) {
          setIsSearchingUsers(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, activeTab]);

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'dms') return matchesSearch && c.type === 'dm';
    if (activeTab === 'groups') return matchesSearch && c.type === 'group';
    if (activeTab === 'channels') return matchesSearch && c.type === 'channel';
    if (activeTab === 'ai') return matchesSearch && c.type === 'ai';
    return matchesSearch;
  });

  return (
    <div className="w-80 border-r border-border bg-card/60 flex flex-col h-full font-poppins">
      {/* Header & Tabs */}
      <div className="p-3.5 border-b border-border/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Communication
          </h3>
          {onCreateGroup && (
            <button
              type="button"
              onClick={onCreateGroup}
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Create Study Group"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Group</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={activeTab === 'dms' ? 'Search real peers by name...' : 'Search messages, peers, channels...'}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-muted/60 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {isSearchingUsers && (
            <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Navigation Filter Tabs */}
        <div className="grid grid-cols-4 p-1 rounded-xl bg-muted/60 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => onSelectTab('dms')}
            className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'dms' ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground'
            }`}
          >
            DMs
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('groups')}
            className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'groups' ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground'
            }`}
          >
            Groups
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('channels')}
            className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'channels' ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground'
            }`}
          >
            Channels
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('ai')}
            className={`py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'ai' ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground'
            }`}
          >
            AI
          </button>
        </div>
      </div>

      {/* Conversation Item Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* User Search Results Section in DMs Tab */}
        {activeTab === 'dms' && searchQuery.trim().length > 0 && (
          <div className="mb-3 border-b border-border/60 pb-2">
            <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1 flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-primary" />
              <span>Matching Profiles</span>
            </div>
            {isSearchingUsers ? (
              <div className="text-center py-3 text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" /> Searching directory...
              </div>
            ) : searchedUsers.length === 0 ? (
              <div className="text-center py-3 text-xs text-muted-foreground">
                No user profiles found matching "{searchQuery}".
              </div>
            ) : (
              searchedUsers.map((u) => (
                <div
                  key={u.id}
                  className="w-full p-2 rounded-xl flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.role || 'Explorer'}</p>
                    </div>
                  </div>
                  {onStartDirectMessage && (
                    <button
                      type="button"
                      onClick={() => onStartDirectMessage(u)}
                      className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-semibold transition-colors shrink-0"
                    >
                      Message
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {filtered.length === 0 && (activeTab !== 'dms' || searchedUsers.length === 0) ? (
          <div className="text-center py-8 text-xs text-muted-foreground px-4">
            {activeTab === 'dms'
              ? searchQuery
                ? 'No matching DM conversations.'
                : 'No direct messages yet. Search for a peer above to start chatting.'
              : 'No active conversations found in this view.'}
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.id === activeConversationId;

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-2.5 rounded-2xl text-left transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-primary/10 border border-primary/30 text-foreground'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold shadow-sm ${
                    conv.type === 'ai'
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                      : conv.type === 'group'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-primary/20 text-primary'
                  }`}
                >
                  {conv.type === 'ai' ? (
                    <Bot className="h-4 w-4" />
                  ) : conv.type === 'group' ? (
                    <Users className="h-4 w-4" />
                  ) : conv.type === 'channel' ? (
                    <Hash className="h-4 w-4" />
                  ) : (
                    conv.title.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground truncate">{conv.title}</span>
                    {conv.subject && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                        {conv.subject}
                      </span>
                    )}
                  </div>
                  {conv.description && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{conv.description}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
