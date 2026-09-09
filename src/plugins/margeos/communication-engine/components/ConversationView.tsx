import React, { useState, useRef, useEffect } from 'react';
import { Bot, Users, Sparkles, Pin, Search, PhoneCall, Video } from 'lucide-react';
import { Conversation, Message, MessageAttachment } from '../types';
import { MessageItem } from './MessageItem';
import { MessageComposer } from './MessageComposer';

interface ConversationViewProps {
  conversation: Conversation | null;
  messages: Message[];
  typingUsers: string[];
  currentUserId: string;
  onSendMessage: (
    content: string,
    messageType?: any,
    replyTo?: any,
    attachments?: MessageAttachment[]
  ) => Promise<void>;
  onSendVoiceNote: (blob: Blob, duration: number) => Promise<void>;
  onUploadFile: (file: File) => Promise<MessageAttachment>;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onOpenLibraryDoc?: (url: string, name: string) => void;
  isMediaUploading?: boolean;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  messages,
  typingUsers,
  currentUserId,
  onSendMessage,
  onSendVoiceNote,
  onUploadFile,
  onToggleReaction,
  onDeleteMessage,
  onOpenLibraryDoc,
  isMediaUploading = false,
}) => {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground font-poppins">
        <Bot className="h-12 w-12 text-primary/40 mb-3 animate-pulse" />
        <h3 className="font-semibold text-base text-foreground">Knowledge Universe Communication Hub</h3>
        <p className="text-xs max-w-sm mt-1">
          Select a Peer Direct Message, Guild Study Group, Classroom Channel, or AI Assistant to start collaborating.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background font-poppins overflow-hidden">
      {/* Active Conversation Header */}
      <div className="p-3.5 border-b border-border/80 bg-card/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-base">
            {conversation.type === 'ai' ? (
              <Bot className="h-5 w-5 text-purple-400" />
            ) : conversation.type === 'group' ? (
              <Users className="h-5 w-5 text-emerald-400" />
            ) : (
              conversation.title.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              {conversation.title}
              {conversation.type === 'ai' && <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate max-w-md">
              {conversation.description || conversation.subject || 'Realtime Educational Channel'}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSendMessage('@AI Explain the recent discussion summary')}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Summary</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No messages yet. Send a note or use <strong className="text-primary">@AI</strong> to start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              currentUserId={currentUserId}
              onReply={(m) => setReplyingTo(m)}
              onReaction={onToggleReaction}
              onDelete={onDeleteMessage}
              onOpenLibraryDoc={onOpenLibraryDoc}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="text-[11px] text-muted-foreground italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>{typingUsers.join(', ')} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Section */}
      <div className="p-3 border-t border-border/80 bg-card/20 shrink-0">
        <MessageComposer
          onSendMessage={onSendMessage}
          onSendVoiceNote={onSendVoiceNote}
          onUploadFile={onUploadFile}
          replyingToMessage={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          isUploading={isMediaUploading}
        />
      </div>
    </div>
  );
};
