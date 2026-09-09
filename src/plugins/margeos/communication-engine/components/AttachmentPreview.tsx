import React from 'react';
import { FileText, Image as ImageIcon, Film, FileCode, Download, ExternalLink } from 'lucide-react';
import { MessageAttachment } from '../types';
import { formatFileSize } from '../utils/attachmentUtils';

interface AttachmentPreviewProps {
  attachment: MessageAttachment;
  onOpenLibraryDoc?: (url: string, name: string) => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onOpenLibraryDoc }) => {
  const isImage = attachment.file_type === 'image' || attachment.mime_type?.startsWith('image/');
  const isPDF = attachment.mime_type === 'application/pdf' || attachment.name.endsWith('.pdf');

  if (isImage) {
    return (
      <div className="mt-1.5 overflow-hidden rounded-xl border border-border/60 bg-muted/30 max-w-sm group relative">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-full max-h-64 object-cover rounded-xl transition-transform group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="p-2 bg-background/80 backdrop-blur-sm text-[11px] font-poppins flex items-center justify-between border-t border-border/40">
          <span className="truncate font-medium">{attachment.name}</span>
          <a
            href={attachment.url}
            download={attachment.name}
            className="p-1 hover:text-primary transition-colors"
            title="Download Image"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1.5 p-2.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm flex items-center justify-between gap-3 max-w-sm group">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          {isPDF ? (
            <FileText className="h-4 w-4" />
          ) : attachment.file_type === 'video' ? (
            <Film className="h-4 w-4" />
          ) : attachment.file_type === 'code' ? (
            <FileCode className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-poppins font-medium truncate text-foreground">{attachment.name}</p>
          <p className="text-[10px] text-muted-foreground font-poppins">{formatFileSize(attachment.file_size)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {isPDF && onOpenLibraryDoc && (
          <button
            type="button"
            onClick={() => onOpenLibraryDoc(attachment.url, attachment.name)}
            className="p-1.5 rounded-lg hover:bg-primary/15 text-primary text-[10px] font-poppins font-medium flex items-center gap-1"
            title="Open in Library with AI Explain"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Library</span>
          </button>
        )}
        <a
          href={attachment.url}
          download={attachment.name}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Download File"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
