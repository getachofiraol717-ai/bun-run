import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowUp, ArrowDown, Search, Maximize2, Minimize2, Copy, Check, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

export interface ScrollableCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  content?: string;
  items?: Array<{ id: string | number; title: string; text: string; category?: string }>;
  maxHeight?: string; // e.g. 'max-h-64', 'max-h-96', '300px'
  enableSearch?: boolean;
  enableCopy?: boolean;
  tone?: 'default' | 'info' | 'success' | 'warning' | 'purple';
  className?: string;
  children?: React.ReactNode;
}

export const ScrollableCard: React.FC<ScrollableCardProps> = ({
  title = "Interactive Concept Reference",
  subtitle = "Scroll through detailed lesson materials and topic notes",
  badge = "Scrollable",
  icon = <BookOpen className="h-4 w-4 text-primary" />,
  content,
  items,
  maxHeight = "max-h-80",
  enableSearch = true,
  enableCopy = true,
  tone = "default",
  className = "",
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight <= clientHeight) {
      setScrollProgress(100);
      return;
    }
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  const scrollTo = (direction: 'top' | 'bottom') => {
    if (!contentRef.current) return;
    contentRef.current.scrollTo({
      top: direction === 'top' ? 0 : contentRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleCopy = () => {
    let textToCopy = content || '';
    if (items) {
      textToCopy = items.map(i => `${i.title}: ${i.text}`).join('\n\n');
    }
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Card content copied to clipboard!");
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Tone styling mapping
  const toneClasses = tone === 'info'
    ? 'border-cyan-500/40 bg-cyan-950/10'
    : tone === 'success'
    ? 'border-emerald-500/40 bg-emerald-950/10'
    : tone === 'warning'
    ? 'border-amber-500/40 bg-amber-950/10'
    : tone === 'purple'
    ? 'border-purple-500/40 bg-purple-950/10'
    : 'border-border/80 bg-card/80';

  const filteredItems = items?.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card className={`glass-strong rounded-2xl border shadow-lg transition-all ${toneClasses} ${className}`}>
      {/* Header */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/50 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
            <div>
              <CardTitle className="font-orbitron text-sm font-bold text-foreground flex items-center gap-2">
                {title}
              </CardTitle>
              {subtitle && (
                <CardDescription className="text-xs text-muted-foreground font-poppins mt-0.5">
                  {subtitle}
                </CardDescription>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {badge && (
              <Badge variant="secondary" className="text-[10px] font-mono uppercase bg-primary/10 text-primary border border-primary/20">
                {badge}
              </Badge>
            )}

            {/* Copy Button */}
            {enableCopy && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
                title="Copy card text"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            )}

            {/* Expand / Collapse Height Button */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? "Collapse card" : "Expand card"}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Search input inside card */}
        {enableSearch && (items && items.length > 2) && (
          <div className="relative mt-2">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search inside this card..."
              className="w-full bg-muted/40 border border-border/60 rounded-xl pl-8 pr-3 py-1.5 text-xs font-poppins text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        )}

        {/* Scroll indicator bar */}
        <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </CardHeader>

      {/* Scrollable Body Content */}
      <CardContent className="p-0 relative">
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className={`p-4 sm:p-5 overflow-y-auto space-y-3 font-poppins text-xs sm:text-sm text-foreground/90 leading-relaxed scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent ${
            isExpanded ? 'max-h-[550px]' : maxHeight
          }`}
        >
          {children ? (
            children
          ) : content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : filteredItems && filteredItems.length > 0 ? (
            <div className="space-y-2.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl glass border border-border/60 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-orbitron font-semibold text-xs text-foreground">
                      {item.title}
                    </span>
                    {item.category && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground uppercase">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground font-poppins">
              No matching items found.
            </div>
          )}
        </div>

        {/* Scroll Quick Buttons Bar */}
        <div className="p-2 bg-muted/20 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-poppins px-4">
          <span className="font-mono text-[10px]">
            Scroll: {Math.round(scrollProgress)}%
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollTo('top')}
              className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              title="Scroll to top"
            >
              <ArrowUp className="h-3 w-3" />
              <span>Top</span>
            </button>
            <span className="text-border">|</span>
            <button
              onClick={() => scrollTo('bottom')}
              className="p-1 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
              title="Scroll to bottom"
            >
              <ArrowDown className="h-3 w-3" />
              <span>Bottom</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScrollableCard;
