import React, { useState } from 'react';
import { Reply, Smile, MoreHorizontal, Pin, Trash2, Check, CheckCheck } from 'lucide-react';
import { Message } from '../types';
import { formatMessageTime, isAIMessage } from '../utils/messageUtils';
import { AttachmentPreview } from './AttachmentPreview';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { AIChatMessage } from './AIChatMessage';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  onReply?: (msg: Message) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onOpenLibraryDoc?: (url: string, name: string) => void;
}

const EMOJI_OPTIONS = ['👍', '❤️', '💡', '🔥', '🚀', '🧠'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  onReply,
  onReaction,
  onDelete,
  onOpenLibraryDoc,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const isSelf = message.sender_id === currentUserId;
  const isAI = isAIMessage(message);

  if (isAI) {
    return <AIChatMessage content={message.content} senderName={message.sender_name} />;
  }

  return (
    <div
      className={`group relative flex gap-3 my-2 font-poppins ${
        isSelf ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 shadow-sm ${
          isSelf ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}
      >
        {message.sender_avatar ? (
          <img
            src={message.sender_avatar}
            alt=""
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== window.location.origin + '/placeholder.svg') {
                target.src = '/placeholder.svg';
              }
            }}
          />
        ) : (
          message.sender_name.substring(0, 2).toUpperCase()
        )}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[80%] space-y-1 ${isSelf ? 'items-end text-right' : 'items-start text-left'}`}>
        {/* Sender Name & Time */}
        <div className={`flex items-center gap-2 text-[11px] text-muted-foreground ${isSelf ? 'justify-end' : ''}`}>
          <span className="font-semibold text-foreground">{message.sender_name}</span>
          <span>{formatMessageTime(message.created_at)}</span>
        </div>

        {/* Reply indicator */}
        {message.reply_to && (
          <div className="p-1.5 rounded-lg bg-muted/60 text-[11px] text-muted-foreground border-l-2 border-primary truncate max-w-xs">
            <span className="font-semibold text-foreground">Replying to {message.reply_to.sender_name}: </span>
            {message.reply_to.content_preview}
          </div>
        )}

        {/* Message Content Bubble */}
        <div
          className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
            isSelf
              ? 'bg-primary text-primary-foreground rounded-tr-none'
              : 'bg-card text-foreground border border-border/80 rounded-tl-none'
          }`}
        >
          {message.content}

          {/* Voice Notes */}
          {message.message_type === 'voice_note' && message.attachments?.[0] && (
            <VoiceNotePlayer audioUrl={message.attachments[0].url} />
          )}

          {/* Attachments */}
          {message.attachments &&
            message.attachments.length > 0 &&
            message.message_type !== 'voice_note' &&
            message.attachments.map((att) => (
              <AttachmentPreview
                key={att.id}
                attachment={att}
                onOpenLibraryDoc={onOpenLibraryDoc}
              />
            ))}
        </div>

        {/* Reactions List */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReaction?.(message.id, emoji)}
                className="px-2 py-0.5 rounded-full bg-muted/80 text-[11px] border border-border hover:bg-muted font-medium transition-colors flex items-center gap-1"
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground text-[10px]">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover Action Toolbar */}
      <div
        className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 border border-border rounded-xl p-1 shadow-md flex items-center gap-1 z-10 ${
          isSelf ? 'right-[85%]' : 'left-[85%]'
        }`}
      >
        <button
          type="button"
          onClick={() => setShowReactions(!showReactions)}
          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
          title="React"
        >
          <Smile className="h-3.5 w-3.5" />
        </button>

        {onReply && (
          <button
            type="button"
            onClick={() => onReply(message)}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
            title="Reply"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>
        )}

        {isSelf && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-muted-foreground"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Reaction Quick Picker Overlay */}
        {showReactions && (
          <div className="absolute bottom-full mb-1 left-0 bg-card border border-border p-1.5 rounded-xl shadow-xl flex items-center gap-1 z-20 animate-fade-in">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onReaction?.(message.id, e);
                  setShowReactions(false);
                }}
                className="p-1.5 hover:bg-muted rounded-lg text-sm hover:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
