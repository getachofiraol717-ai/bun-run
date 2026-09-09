import React from 'react';
import { Mic, Square, X, Send } from 'lucide-react';
import { useVoiceNote } from '../hooks/useVoiceNote';
import { formatAudioDuration } from '../utils/mediaUtils';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ onSendVoiceNote, onCancel }) => {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceNote();

  React.useEffect(() => {
    startRecording().catch(() => {
      onCancel();
    });
  }, [startRecording, onCancel]);

  const handleSend = () => {
    if (audioBlob) {
      onSendVoiceNote(audioBlob, recordingTime);
    } else if (isRecording) {
      stopRecording();
      // Send once stopped
    }
  };

  return (
    <div className="p-3 bg-card/90 rounded-2xl border border-primary/40 flex items-center justify-between gap-3 animate-fade-in shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-poppins font-semibold text-rose-400">
          Recording Voice Note
        </span>
        <span className="text-xs font-poppins font-mono text-foreground">
          {formatAudioDuration(recordingTime)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            cancelRecording();
            onCancel();
          }}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Cancel Recording"
        >
          <X className="h-4 w-4" />
        </button>

        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="p-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-colors"
            title="Stop Recording"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-poppins font-medium flex items-center gap-1.5 hover:opacity-90 transition-all shadow-md"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Voice</span>
          </button>
        )}
      </div>
    </div>
  );
};
