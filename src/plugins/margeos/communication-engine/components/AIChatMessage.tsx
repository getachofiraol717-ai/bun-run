import React from 'react';
import { Bot, Sparkles, Copy, Check } from 'lucide-react';

interface AIChatMessageProps {
  content: string;
  senderName?: string;
  isStreaming?: boolean;
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({
  content,
  senderName = 'Knowledge AI Tutor',
  isStreaming = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-card/90 to-accent/10 border border-primary/30 font-poppins space-y-2 animate-fade-in shadow-sm">
      <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Bot className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {senderName}
            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
          </span>
        </div>

        <button
          type="button"
          onClick={copyToClipboard}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 transition-colors"
          title="Copy AI Response"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>

      <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-sans">
        {content}
        {isStreaming && <span className="inline-block w-2 h-3 ml-1 bg-primary animate-pulse" />}
      </div>
    </div>
  );
};
