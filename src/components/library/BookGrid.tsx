import React from 'react';
import { BookOpen, Box, Sparkles, RefreshCw } from 'lucide-react';
import BookCard, { BookItem } from './BookCard';
import { ViewMode } from './BookFilter';
import { Button } from '@/components/ui/button';

export interface BookGridProps {
  books: BookItem[];
  getReadingProgress?: (bookId: string) => number;
  isPremiumUser?: boolean;
  viewMode?: ViewMode;
  onReadBook: (book: BookItem) => void;
  on3DPreviewBook: (book: BookItem) => void;
  onDownloadBook: (book: BookItem) => void;
  onResetFilters?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  getReadingProgress = () => 0,
  isPremiumUser = false,
  viewMode = 'grid',
  onReadBook,
  on3DPreviewBook,
  onDownloadBook,
  onResetFilters,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-12 text-center my-6 space-y-3 animate-fade-in">
        <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-poppins">Loading curriculum textbooks & reference materials...</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center my-6 space-y-4 border border-border/80 animate-fade-in">
        <div className="p-4 rounded-2xl bg-muted/40 w-fit mx-auto text-muted-foreground">
          <BookOpen className="h-12 w-12" />
        </div>
        <div>
          <h3 className="font-orbitron text-lg font-bold text-foreground">No Books Found</h3>
          <p className="text-xs text-muted-foreground font-poppins mt-1 max-w-sm mx-auto">
            No textbooks or study materials match your search criteria. Try adjusting your subject or grade filters.
          </p>
        </div>
        {onResetFilters && (
          <Button
            size="sm"
            onClick={onResetFilters}
            className="text-xs font-poppins bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
          >
            Reset Filters
          </Button>
        )}
      </div>
    );
  }

  // 1. 3D Bookshelf View Mode
  if (viewMode === 'bookshelf') {
    // Group books into shelf rows (4 books per shelf)
    const shelfRows: BookItem[][] = [];
    for (let i = 0; i < books.length; i += 5) {
      shelfRows.push(books.slice(i, i + 5));
    }

    return (
      <div className={`space-y-12 my-6 ${className}`}>
        {shelfRows.map((row, rowIndex) => (
          <div key={`shelf-${rowIndex}`} className="relative pt-4">
            {/* Shelf Label Header */}
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5" /> 3D Library Shelf Row #{rowIndex + 1}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {row.length} Volumes On Shelf
              </span>
            </div>

            {/* Books Array standing on shelf */}
            <div className="flex items-end justify-center sm:justify-start gap-4 sm:gap-6 px-4 overflow-x-auto no-scrollbar pb-3">
              {row.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  progress={getReadingProgress(book.id)}
                  isPremiumUser={isPremiumUser}
                  viewMode="bookshelf"
                  onRead={onReadBook}
                  on3DPreview={on3DPreviewBook}
                  onDownload={onDownloadBook}
                />
              ))}
            </div>

            {/* Glowing 3D Wooden/Glass Shelf Bar */}
            <div className="relative w-full h-4 rounded-xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-t border-cyan-500/40 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/20 to-cyan-500/10" />
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-cyan-300/60 shadow-[0_0_10px_#00f0ff]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Compact List View Mode
  if (viewMode === 'list') {
    return (
      <div className={`space-y-3 my-6 ${className}`}>
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            progress={getReadingProgress(book.id)}
            isPremiumUser={isPremiumUser}
            viewMode="list"
            onRead={onReadBook}
            on3DPreview={on3DPreviewBook}
            onDownload={onDownloadBook}
          />
        ))}
      </div>
    );
  }

  // 3. Standard 2D / 3D Grid Layout Mode
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 my-6 ${className}`}>
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          progress={getReadingProgress(book.id)}
          isPremiumUser={isPremiumUser}
          viewMode="grid"
          onRead={onReadBook}
          on3DPreview={on3DPreviewBook}
          onDownload={onDownloadBook}
        />
      ))}
    </div>
  );
};

export default BookGrid;
