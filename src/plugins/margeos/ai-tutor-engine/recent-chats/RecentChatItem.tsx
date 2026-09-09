// @ts-nocheck
/**
 * Knowledge Universe — Recent Chat Item Component
 * Renders individual recent conversation items with dynamic 7-color LEFT -> RIGHT RGB flow,
 * time-persistent phase calculation, and AI response status integration.
 */

import React, { useState } from 'react';
import { Edit3, Trash2, Check, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { useRecentChatVisual } from './useRecentChatVisual';
import { PROVIDERS } from './RecentChatTheme'; // Provider definition helper

interface RecentChatItemProps {
  chat: {
    id: string;
    title: string;
    provider: string;
    subject: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string; retryText?: string | null }>;
    createdAt: number;
    updatedAt: number;
  };
  isActive: boolean;
  itemIndex: number;
  isStreaming: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export const RecentChatItem: React.FC<RecentChatItemProps> = ({
  chat,
  isActive,
  itemIndex,
  isStreaming,
  onSelect,
  onRename,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [renameValue, setRenameValue] = useState(chat.title);

  const {
    identity,
    phaseStyles,
    gradientCss,
    prefersReducedMotion,
  } = useRecentChatVisual({
    chatId: chat.id,
    createdAt: chat.createdAt,
    messages: chat.messages,
    isCurrentlyStreaming: isStreaming,
    isActiveChat: isActive,
    itemIndex,
  });

  const handleSaveRename = (e?: React.FormEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const trimmed = renameValue.trim();
    if (trimmed) {
      onRename(chat.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(chat.title);
    setIsEditing(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(chat.id);
  };

  // Provider badge helper
  const providerName =
    chat.provider === 'all3'
      ? 'Tri-AI'
      : chat.provider === 'chatgpt'
      ? 'ChatGPT'
      : chat.provider === 'claude'
      ? 'Claude'
      : 'Gemini';

  const { responseState, baseColor, secondaryColor } = identity;

  return (
    <div
      onClick={() => onSelect(chat.id)}
      style={{
        ...phaseStyles,
      }}
      className={`group relative rounded-xl p-2.5 cursor-pointer transition-all duration-300 overflow-hidden ${
        isActive
          ? 'bg-card/90 shadow-md ring-1 ring-primary/40'
          : 'bg-card/30 hover:bg-card/60'
      }`}
    >
      {/* ── LEFT-TO-RIGHT DYNAMIC 7-COLOR RGB FLOW BEAM ── */}
      {responseState === 'completed' && (
        <div
          aria-hidden="true"
          style={{
            backgroundImage: gradientCss,
            backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
            backgroundPositionX: prefersReducedMotion ? '0%' : 'var(--rgb-bg-position-x)',
          }}
          className={`absolute top-0 left-0 right-0 h-[2.5px] z-10 transition-opacity duration-500 ${
            prefersReducedMotion ? 'opacity-80' : 'opacity-100'
          }`}
        />
      )}

      {/* Generating State Flow Bar */}
      {responseState === 'generating' && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500 animate-pulse z-10" />
      )}

      {/* Subtle Glow Backdrop for Completed State */}
      {responseState === 'completed' && (
        <div
          aria-hidden="true"
          style={{
            backgroundImage: gradientCss,
            backgroundSize: prefersReducedMotion ? '100% 100%' : '200% 100%',
            backgroundPositionX: prefersReducedMotion ? '0%' : 'var(--rgb-bg-position-x)',
          }}
          className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity pointer-events-none"
        />
      )}

      {/* Main Content Layout */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {isEditing ? (
          <form
            onSubmit={handleSaveRename}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 flex-1 min-w-0"
          >
            <input
              type="text"
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="w-full bg-background/90 text-xs font-poppins px-2 py-1 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Dynamic 7-Color Icon Dot / Response Status */}
              <div className="relative flex-shrink-0 flex items-center justify-center">
                {responseState === 'generating' ? (
                  <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                ) : responseState === 'failed' ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                ) : responseState === 'completed' ? (
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{
                      backgroundColor: baseColor.hex,
                      boxShadow: `0 0 8px ${baseColor.borderGlow}`,
                    }}
                  />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full opacity-60"
                    style={{ backgroundColor: baseColor.hex }}
                  />
                )}
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-poppins font-medium text-foreground truncate">
                    {chat.title}
                  </p>
                  {responseState === 'completed' && (
                    <Sparkles
                      className="h-3 w-3 shrink-0 text-amber-400 opacity-80"
                      title="New AI response completed"
                    />
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-poppins truncate">
                  <span
                    className="font-semibold text-[9px] px-1 rounded"
                    style={{
                      color: baseColor.hex,
                      backgroundColor: `rgba(${baseColor.rgb}, 0.12)`,
                    }}
                  >
                    {providerName}
                  </span>
                  <span>·</span>
                  <span className="truncate">{chat.subject || 'General'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons (Hover / Focus) */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleStartRename}
                title="Rename chat"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                title="Delete chat"
                className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
