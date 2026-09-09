import React, { useState, useRef } from 'react';
import { Send, Mic, Paperclip, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { Message, MessageAttachment } from '../types';
import { MediaPicker } from './MediaPicker';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';

interface MessageComposerProps {
  onSendMessage: (
    content: string,
    messageType?: any,
    replyTo?: any,
    attachments?: MessageAttachment[]
  ) => Promise<void>;
  onSendVoiceNote: (blob: Blob, duration: number) => Promise<void>;
  onUploadFile: (file: File) => Promise<MessageAttachment>;
  replyingToMessage?: Message | null;
  onCancelReply?: () => void;
  isUploading?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onSendVoiceNote,
  onUploadFile,
  replyingToMessage,
  onCancelReply,
  isUploading = false,
}) => {
  const [content, setContent] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!content.trim() && pendingAttachments.length === 0) || isUploading) return;

    const replyObj = replyingToMessage
      ? {
          reply_to_id: replyingToMessage.id,
          sender_name: replyingToMessage.sender_name,
          content_preview: replyingToMessage.content.substring(0, 50),
        }
      : undefined;

    const attachmentsToSend = [...pendingAttachments];
    const textToSend = content;

    setContent('');
    setPendingAttachments([]);
    if (onCancelReply) onCancelReply();

    await onSendMessage(
      textToSend,
      attachmentsToSend.length > 0 ? 'file' : 'text',
      replyObj,
      attachmentsToSend
    );
  };

  const handleFilePicked = async (file: File) => {
    try {
      const att = await onUploadFile(file);
      setPendingAttachments((prev) => [...prev, att]);
      setShowMediaPicker(false);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    }
  };

  const handleAIMentionClick = () => {
    setContent((prev) => (prev ? `${prev} @AI ` : '@AI '));
    if (inputRef.current) inputRef.current.focus();
  };

  if (showVoiceRecorder) {
    return (
      <VoiceNoteRecorder
        onSendVoiceNote={async (blob, duration) => {
          await onSendVoiceNote(blob, duration);
          setShowVoiceRecorder(false);
        }}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <div className="space-y-2 font-poppins relative">
      {/* Replying banner */}
      {replyingToMessage && (
        <div className="px-3 py-1.5 rounded-xl bg-muted/80 border border-primary/30 text-xs flex items-center justify-between text-muted-foreground animate-fade-in">
          <span className="truncate">
            Replying to <strong className="text-foreground">{replyingToMessage.sender_name}</strong>:{' '}
            {replyingToMessage.content}
          </span>
          <button type="button" onClick={onCancelReply} className="p-1 hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Pending Attachments */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/40 rounded-xl border border-border">
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="px-2.5 py-1 rounded-lg bg-card text-xs flex items-center gap-2 border border-border"
            >
              <ImageIcon className="h-3.5 w-3.5 text-primary" />
              <span className="truncate max-w-[120px]">{att.name}</span>
              <button
                type="button"
                onClick={() => setPendingAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                className="hover:text-rose-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media Picker Popup */}
      {showMediaPicker && (
        <div className="absolute bottom-full mb-2 left-0 z-30 animate-fade-in">
          <MediaPicker onFileSelect={handleFilePicked} onClose={() => setShowMediaPicker(false)} />
        </div>
      )}

      {/* Primary Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-2 rounded-2xl bg-card border border-border/80 shadow-md flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowMediaPicker(!showMediaPicker)}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Attach Files / Media"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleAIMentionClick}
          className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
          title="Ask AI Tutor in conversation (@AI)"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>@AI</span>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message or use @AI to ask the tutor..."
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <button
          type="button"
          onClick={() => setShowVoiceRecorder(true)}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Record Voice Note"
        >
          <Mic className="h-4 w-4" />
        </button>

        <button
          type="submit"
          disabled={(!content.trim() && pendingAttachments.length === 0) || isUploading}
          className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all shrink-0 shadow-md cursor-pointer disabled:cursor-not-allowed"
          title="Send Message"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
