/**
 * Knowledge Universe — Recent Chats List Panel Component
 * Wraps recent conversations, subjects, companion information, and search with the dynamic 7-color RGB experience.
 */

import React, { useState, useMemo } from 'react';
import {
  MessageSquare, Plus, Search, BookOpen, Crown, Settings2, X,
  Flame, Target, AlertTriangle
} from 'lucide-react';
import { RecentChatItem } from './RecentChatItem';

export interface ChatRecord {
  id: string;
  title: string;
  provider: string;
  subject: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; retryText?: string | null }>;
  createdAt: number;
  updatedAt: number;
}

export interface RecentChatsProps {
  chats: ChatRecord[];
  activeChatId: string;
  isStreaming: boolean;
  maxChats: number;
  isPremium: boolean;
  subjects: string[];
  activeSubject?: string;
  companion?: {
    name: string;
    auraColor: string;
    catchphrase: string;
  };
  memory?: {
    streakDays: number;
    goals: string[];
    weakSubjects: string[];
  } | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  onSubjectChange: (subject: string) => void;
  onOpenCompanionSettings?: () => void;
  onClosePanel?: () => void;
}

export const RecentChats: React.FC<RecentChatsProps> = ({
  chats,
  activeChatId,
  isStreaming,
  maxChats,
  isPremium,
  subjects,
  activeSubject = 'General',
  companion,
  memory,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onSubjectChange,
  onOpenCompanionSettings,
  onClosePanel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [chats, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-md border-l border-border select-none">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-orbitron font-bold text-sm flex items-center gap-2 text-foreground">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span>Recent Chats</span>
        </h2>
        {onClosePanel && (
          <button
            type="button"
            onClick={onClosePanel}
            className="p-1 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New Chat Button & Chat Count */}
      <div className="p-3 space-y-2 border-b border-border">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-poppins font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </button>
        <p className="text-[10px] text-center text-muted-foreground font-poppins">
          {chats.length}/{maxChats} chats saved
        </p>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search recent chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 text-foreground text-xs rounded-lg pl-8 pr-3 py-1.5 border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary font-poppins"
          />
        </div>
      </div>

      {/* Subject Selector */}
      <div className="p-3 border-b border-border">
        <label className="text-[10px] text-muted-foreground font-poppins flex items-center gap-1 mb-1">
          <BookOpen className="h-3 w-3" /> Subject
        </label>
        <select
          value={activeSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full bg-muted text-foreground text-xs rounded-lg px-2 py-1.5 border border-border font-poppins focus:ring-1 focus:ring-primary"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* AI Companion Card */}
      {companion && (
        <div className="p-3 border-b border-border">
          <div
            onClick={onOpenCompanionSettings}
            className="glass rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base border shrink-0"
              style={{
                borderColor: `${companion.auraColor || '#8b5cf6'}60`,
                backgroundColor: `${companion.auraColor || '#8b5cf6'}15`,
              }}
            >
              🤖
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-orbitron font-bold truncate"
                style={{ color: companion.auraColor || '#8b5cf6' }}
              >
                {companion.name || 'AI Tutor Companion'}
              </p>
              <p className="text-[9px] text-muted-foreground font-poppins truncate">
                {companion.catchphrase || 'Always ready to help'}
              </p>
            </div>
            {onOpenCompanionSettings && (
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
          </div>
        </div>
      )}

      {/* Memory Context Summary */}
      {memory && (memory.goals.length > 0 || memory.streakDays > 0 || memory.weakSubjects.length > 0) && (
        <div className="p-3 border-b border-border space-y-1">
          <p className="text-[9px] text-muted-foreground font-poppins uppercase tracking-wider font-semibold">
            🧠 Memory Context
          </p>
          <div className="space-y-1 text-[10px] font-poppins text-foreground">
            {memory.streakDays > 0 && (
              <p className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-500" />
                <span>{memory.streakDays}-day study streak</span>
              </p>
            )}
            {memory.goals[0] && (
              <p className="flex items-center gap-1 truncate">
                <Target className="h-3 w-3 text-cyan-400" />
                <span className="truncate">{memory.goals[0]}</span>
              </p>
            )}
            {memory.weakSubjects[0] && (
              <p className="flex items-center gap-1 text-yellow-400 truncate">
                <AlertTriangle className="h-3 w-3" />
                <span className="truncate">Focus: {memory.weakSubjects[0]}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Chat List with Dynamic 7-Color RGB System */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
        {filteredChats.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs font-poppins">
            No chats found.
          </div>
        ) : (
          filteredChats.map((chat, idx) => (
            <RecentChatItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              itemIndex={idx}
              isStreaming={isStreaming && chat.id === activeChatId}
              onSelect={onSelectChat}
              onRename={onRenameChat}
              onDelete={onDeleteChat}
            />
          ))
        )}
      </div>

      {/* Bottom Footer / Plan Badge */}
      <div className="p-3 border-t border-border">
        {isPremium ? (
          <div className="text-[10px] font-poppins flex items-center justify-center gap-1 text-yellow-500 font-medium">
            <Crown className="h-3.5 w-3.5" /> Premium · Unlimited AI Tutor
          </div>
        ) : (
          <div className="text-[10px] text-center font-poppins text-muted-foreground">
            Free Plan · {maxChats} Chats Max
          </div>
        )}
      </div>
    </div>
  );
};
