import React, { useState } from 'react';
import { BookOpen, Eye, Download, Lock, Sparkles, Box, Check, Bookmark, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBookCover } from '@/data/bookCovers';

export interface BookItem {
  id: string;
  title: string;
  subject?: string;
  grade?: number;
  description?: string;
  file_url?: string;
  cover_image_url?: string;
  access_level?: 'free' | 'premium' | string;
  content_type?: string;
  pages?: number;
}

export interface BookCardProps {
  book: BookItem;
  progress?: number;
  isPremiumUser?: boolean;
  viewMode?: 'grid' | 'bookshelf' | 'list';
  onRead: (book: BookItem) => void;
  on3DPreview: (book: BookItem) => void;
  onDownload: (book: BookItem) => void;
  className?: string;
}

const GRADIENTS = [
  'from-cyan-600/30 via-blue-700/30 to-purple-800/40 border-cyan-500/30',
  'from-purple-600/30 via-pink-700/30 to-indigo-800/40 border-purple-500/30',
  'from-emerald-600/30 via-teal-700/30 to-blue-800/40 border-emerald-500/30',
  'from-amber-600/30 via-orange-700/30 to-red-800/40 border-amber-500/30',
];

export const BookCard: React.FC<BookCardProps> = ({
  book,
  progress = 0,
  isPremiumUser = false,
  viewMode = 'grid',
  onRead,
  on3DPreview,
  onDownload,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isLocked = book.access_level === 'premium' && !isPremiumUser;
  
  // Pick deterministic gradient index based on title length
  const gradIndex = Math.abs(book.title.length) % GRADIENTS.length;
  const gradient = GRADIENTS[gradIndex];
  const coverSrc = getBookCover(book);

  if (viewMode === 'list') {
    return (
      <div className={`glass rounded-2xl p-4 border border-border/70 hover:border-primary/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${className}`}>
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className={`w-14 h-20 rounded-xl bg-gradient-to-br ${gradient} border flex items-center justify-center shrink-0 shadow-md relative overflow-hidden group-hover:scale-105 transition-transform`}>
            <img
              src={coverSrc}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = getBookCover({ title: book.title, subject: book.subject, grade: book.grade });
              }}
            />
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary/40" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-orbitron text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              {book.subject && (
                <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/30">
                  {book.subject}
                </Badge>
              )}
              {book.grade && (
                <Badge variant="outline" className="text-[10px] font-mono bg-muted text-muted-foreground">
                  Grade {book.grade}
                </Badge>
              )}
            </div>

            {book.description && (
              <p className="text-xs text-muted-foreground font-poppins line-clamp-1 mb-1.5">
                {book.description}
              </p>
            )}

            {/* Reading progress */}
            <div className="flex items-center gap-3 max-w-xs">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-neon-cyan transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-semibold text-primary">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-poppins gap-1 rounded-xl glass hover:bg-primary/20 border-primary/30"
            onClick={() => on3DPreview(book)}
          >
            <Box className="h-3.5 w-3.5 text-neon-cyan" />
            <span className="hidden sm:inline">3D Flip</span>
          </Button>

          {isLocked ? (
            <Button size="sm" variant="secondary" disabled className="text-xs font-poppins gap-1 rounded-xl">
              <Lock className="h-3.5 w-3.5" />
              <span>Premium</span>
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-xs font-poppins gap-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => onRead(book)}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Read</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => onDownload(book)}
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (viewMode === 'bookshelf') {
    return (
      <div
        className="relative group cursor-pointer flex flex-col items-center select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onRead(book)}
      >
        {/* 3D Book Spine & Cover standing on shelf */}
        <div
          className={`w-32 h-44 rounded-r-lg rounded-l-sm bg-gradient-to-br ${gradient} border shadow-2xl relative transition-all duration-300 transform group-hover:-translate-y-3 group-hover:rotate-y-12 group-hover:scale-105 flex flex-col justify-between p-2 overflow-hidden`}
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1000px',
            boxShadow: isHovered
              ? '0 20px 30px -10px rgba(0, 240, 255, 0.3), 8px 0 15px -2px rgba(0,0,0,0.5)'
              : '5px 5px 15px rgba(0,0,0,0.4)',
          }}
        >
          {/* 3D Spine Fold Effect */}
          <div className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-black/60 via-black/30 to-transparent border-r border-white/10" />

          {/* Book Header info */}
          <div className="pl-2">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 border border-cyan-400/30">
              Grade {book.grade || 9}
            </span>
          </div>

          {/* Book Center Illustration or Cover */}
          <div className="my-auto text-center flex justify-center w-full px-1">
            <img
              src={coverSrc}
              alt={book.title}
              className="h-28 w-full object-cover rounded shadow-md border border-cyan-500/20"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = getBookCover({ title: book.title, subject: book.subject, grade: book.grade });
              }}
            />
          </div>

          {/* Book Footer info */}
          <div className="pl-2 flex items-center justify-between text-[9px] font-mono text-white/80">
            <span className="truncate max-w-[70px]">{book.subject || 'Textbook'}</span>
            <span className="text-cyan-300">{progress}%</span>
          </div>
        </div>

        {/* Shelf Shadow / Reflection */}
        <div className="w-28 h-2 bg-black/40 rounded-full filter blur-sm mt-2 transition-all duration-300 group-hover:w-32 group-hover:bg-cyan-500/20" />

        {/* Quick hover badge */}
        {isHovered && (
          <div className="absolute -top-10 bg-background/95 backdrop-blur border border-primary/50 text-foreground text-[11px] font-poppins px-3 py-1 rounded-xl shadow-xl z-20 flex items-center gap-1.5 whitespace-nowrap animate-fade-in">
            <Box className="h-3 w-3 text-cyan-400 animate-spin" />
            <span>Click to 3D Read</span>
          </div>
        )}
      </div>
    );
  }

  // Standard 2D / 3D Hybrid Grid Card
  return (
    <div
      className={`glass rounded-2xl overflow-hidden border border-border/70 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1.5 group flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-primary/10 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header Cover */}
      <div className={`h-48 bg-gradient-to-br ${gradient} border-b relative flex items-center justify-center p-3 overflow-hidden`}>
        {/* Decorative 3D Book Grid lines background */}
        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <Badge variant="outline" className="text-[10px] font-mono bg-black/50 text-cyan-300 border-cyan-400/40 backdrop-blur">
            {book.subject || 'Textbook'}
          </Badge>

          <span
            className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase backdrop-blur ${
              book.access_level === 'premium'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {book.access_level || 'free'}
          </span>
        </div>

        {/* Center High-Fidelity Cover Visual */}
        <div className="relative z-10 h-36 w-24 rounded-lg overflow-hidden shadow-xl border border-white/20 group-hover:scale-105 transition-all duration-300">
          <img
            src={coverSrc}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.src = getBookCover({ title: book.title, subject: book.subject, grade: book.grade });
            }}
          />
        </div>

        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-white/90 z-10">
          <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur">Grade {book.grade || 9}</span>
          <span className="px-1.5 py-0.5 rounded bg-black/40 backdrop-blur">{book.pages || 20} Pages</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-orbitron text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-muted-foreground font-poppins line-clamp-2 leading-relaxed">
            {book.description || 'Interactive Ethiopian Curriculum textbook with 3D flip reader, formula detection, and AI Tutor.'}
          </p>
        </div>

        {/* Reading progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-muted-foreground">Reading Progress</span>
            <span className="text-primary font-bold">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-neon-cyan transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-border/40 flex items-center gap-2">
          {/* 3D Flip Preview */}
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs font-poppins gap-1.5 rounded-xl glass hover:bg-primary/20 border-primary/30"
            onClick={() => on3DPreview(book)}
            title="Open 3D PDF Page-Flip Preview"
          >
            <Box className="h-3.5 w-3.5 text-neon-cyan" />
            <span>3D Flip</span>
          </Button>

          {/* Full Read */}
          {isLocked ? (
            <Button size="sm" variant="secondary" disabled className="flex-1 text-xs font-poppins gap-1 rounded-xl">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>Locked</span>
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 text-xs font-poppins gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow"
              onClick={() => onRead(book)}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Read</span>
            </Button>
          )}

          {/* Download button */}
          <Button
            size="sm"
            variant="ghost"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => onDownload(book)}
            title="Download PDF file"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
