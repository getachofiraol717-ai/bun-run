import React, { useRef } from 'react';
import { Paperclip, Image as ImageIcon, FileText, FileCode, X } from 'lucide-react';

interface MediaPickerProps {
  onFileSelect: (file: File) => void;
  onClose?: () => void;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({ onFileSelect, onClose }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      if (onClose) onClose();
    }
  };

  return (
    <div className="p-3 bg-card border border-border rounded-2xl shadow-xl space-y-2 font-poppins min-w-[200px]">
      <div className="flex items-center justify-between pb-1 border-b border-border/60">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5 text-primary" /> Attach Media
        </span>
        {onClose && (
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*,application/pdf,.ts,.tsx,.js,.json,.txt"
      />

      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.accept = 'image/*';
              inputRef.current.click();
            }
          }}
          className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted text-xs text-foreground transition-colors"
        >
          <ImageIcon className="h-4 w-4 text-emerald-400" />
          <span>Image</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.accept = 'application/pdf,.doc,.docx';
              inputRef.current.click();
            }
          }}
          className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted text-xs text-foreground transition-colors"
        >
          <FileText className="h-4 w-4 text-amber-400" />
          <span>Document</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.accept = '.ts,.tsx,.js,.py,.cpp,.json';
              inputRef.current.click();
            }
          }}
          className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted text-xs text-foreground transition-colors"
        >
          <FileCode className="h-4 w-4 text-cyan-400" />
          <span>Code File</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.accept = '*/*';
              inputRef.current.click();
            }
          }}
          className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted text-xs text-foreground transition-colors"
        >
          <Paperclip className="h-4 w-4 text-purple-400" />
          <span>Any File</span>
        </button>
      </div>
    </div>
  );
};
