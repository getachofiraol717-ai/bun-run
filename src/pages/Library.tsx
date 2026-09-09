import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import SEO from '@/components/SEO';
import { BookOpen, Search, Eye, Download, Lock, Languages, BookMarked, GraduationCap, Video, Sparkles, Box } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PDFReader from '@/components/PDFReader';
import { useContentItems, useReadingProgress, useUpsertReadingProgress, trackEvent } from '@/hooks/useAdminData';
import { ETHIOPIA_GRADE_9_LIBRARY_ITEMS } from '@/data/defaultLibraryItems';
import { downloadEthiopiaGrade9PDF, downloadSubjectBook } from '@/lib/ethiopiaGrade9PDF';

import BookFilter, { ContentType, ViewMode, SortOption } from '@/components/library/BookFilter';
import BookGrid from '@/components/library/BookGrid';
import Book3DViewer from '@/components/library/Book3DViewer';
import { BookItem } from '@/components/library/BookCard';

const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geography', 'History', 'Economics', 'English', 'Afan Oromo'];

const Library = () => {
  const { t } = useLanguage();
  const { isPremium, isAuthenticated } = useAuth();

  // Filters & View mode states
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState(0);
  const [contentType, setContentType] = useState<ContentType>('books');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Active Reading/Preview states
  const [readingBook, setReadingBook] = useState<{
    id: string; title: string; pages: number; initialPage?: number; fileUrl?: string; subject?: string; grade?: number;
  } | null>(null);

  const [preview3DBook, setPreview3DBook] = useState<{
    id: string; title: string; pages: number; fileUrl?: string; subject?: string; grade?: number;
  } | null>(null);

  const { data: dbContentItems, isLoading } = useContentItems(contentType);
  const { data: readingProgress } = useReadingProgress();
  const upsertProgress = useUpsertReadingProgress();

  // Merge database items with Grade 9 Ethiopian Curriculum default books
  const allContentItems: BookItem[] = useMemo(() => {
    const dbItems = (dbContentItems || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      subject: item.subject,
      grade: item.grade,
      description: item.description,
      file_url: item.file_url,
      cover_image_url: item.cover_image_url,
      access_level: item.access_level || 'free',
      content_type: item.content_type || 'books',
      pages: item.pages || 20,
    }));

    const defaultItems = ETHIOPIA_GRADE_9_LIBRARY_ITEMS.filter((item) => item.content_type === contentType).map((item) => ({
      id: item.id,
      title: item.title,
      subject: item.subject,
      grade: item.grade,
      description: item.description,
      file_url: item.file_url,
      cover_image_url: item.cover_image_url,
      access_level: item.access_level || 'free',
      content_type: item.content_type || 'books',
      pages: 20,
    }));

    return [...dbItems, ...defaultItems];
  }, [dbContentItems, contentType]);

  const getProgress = (contentId: string) => {
    const rp = (readingProgress || []).find((r) => r.content_item_id === contentId);
    return rp ? Number(rp.progress_percent) : 0;
  };

  // Filter & Sort
  const filtered = useMemo(() => {
    let result = allContentItems.filter((b) => {
      if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !(b.description || '').toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedSubject !== 'All' && b.subject !== selectedSubject) return false;
      if (selectedGrade > 0 && b.grade !== selectedGrade) return false;
      return true;
    });

    if (sortOption === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'progress') {
      result = [...result].sort((a, b) => getProgress(b.id) - getProgress(a.id));
    } else if (sortOption === 'grade') {
      result = [...result].sort((a, b) => (b.grade || 0) - (a.grade || 0));
    }

    return result;
  }, [allContentItems, search, selectedSubject, selectedGrade, sortOption, readingProgress]);

  const handleOpenBook = (item: BookItem) => {
    const existingProgress = (readingProgress || []).find((r) => r.content_item_id === item.id);
    const initialPage = existingProgress?.current_page || 1;
    const pages = existingProgress?.total_pages || item.pages || 20;
    setReadingBook({
      id: item.id,
      title: item.title,
      pages,
      initialPage,
      fileUrl: item.file_url || undefined,
      subject: item.subject || undefined,
      grade: item.grade || undefined,
    });
    upsertProgress.mutate({
      content_item_id: item.id,
      current_page: initialPage,
      total_pages: pages,
      title: item.title,
    });
    trackEvent('book_read', 'Library', { content_id: item.id, title: item.title });
  };

  const handle3DPreviewBook = (item: BookItem) => {
    const existingProgress = (readingProgress || []).find((r) => r.content_item_id === item.id);
    const pages = existingProgress?.total_pages || item.pages || 20;
    setPreview3DBook({
      id: item.id,
      title: item.title,
      pages,
      fileUrl: item.file_url || undefined,
      subject: item.subject || undefined,
      grade: item.grade || undefined,
    });
    trackEvent('book_3d_preview', 'Library', { content_id: item.id, title: item.title });
  };

  const handleDownloadBook = (item: BookItem) => {
    if (item.id === 'ethiopia-g9-curriculum-guide-reference' || item.subject?.toLowerCase().includes('guide')) {
      downloadEthiopiaGrade9PDF();
    } else if (item.subject || item.title) {
      downloadSubjectBook(item.subject || item.title, item.grade || 9);
    } else if (item.file_url) {
      window.open(item.file_url, '_blank');
    } else {
      downloadEthiopiaGrade9PDF();
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSubject('All');
    setSelectedGrade(0);
    setSortOption('default');
  };

  if (readingBook) {
    return (
      <PDFReader
        bookTitle={readingBook.title}
        totalPages={readingBook.pages}
        initialPage={readingBook.initialPage}
        fileUrl={readingBook.fileUrl}
        contentItemId={readingBook.id}
        subject={readingBook.subject}
        grade={readingBook.grade}
        onClose={() => setReadingBook(null)}
        onPageChange={(page: number, total: number) => {
          if (readingBook) {
            upsertProgress.mutate({
              content_item_id: readingBook.id,
              current_page: page,
              total_pages: total,
              title: readingBook.title,
            });
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <SEO
        title="Digital Library — Books, Videos & Study Materials | Knowledge Universe"
        description="Browse Grade 1–12 books, vocabulary, grammar, reference materials, and educational videos. Interactive 3D PDF reader with dark mode and offline access."
        path="/library"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Digital Library',
          description: 'Curated K–12 books and study materials.',
          url: '/library',
        }}
      />
      <GalaxyBackground />

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        {/* Header Title */}
        <div className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-primary" />
              {t('library')}
            </h1>
            <p className="text-muted-foreground font-poppins mt-1 text-xs sm:text-sm">
              Grade 1–12 Ethiopian Curriculum Textbooks, Interactive 3D Page Flip Reader & Reference Materials
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl glass border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
              <Box className="h-3.5 w-3.5 text-cyan-400" />
              <span>3D Reader Engine Ready</span>
            </span>
          </div>
        </div>

        {/* Modular Filter Component */}
        <BookFilter
          search={search}
          onSearchChange={setSearch}
          selectedSubject={selectedSubject}
          onSubjectChange={setSelectedSubject}
          subjects={subjects}
          selectedGrade={selectedGrade}
          onGradeChange={setSelectedGrade}
          contentType={contentType}
          onContentTypeChange={setContentType}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOption={sortOption}
          onSortChange={setSortOption}
          totalResults={filtered.length}
          onResetFilters={handleResetFilters}
        />

        {/* Content Section */}
        {contentType === 'books' && (
          <BookGrid
            books={filtered}
            getReadingProgress={getProgress}
            isPremiumUser={isPremium}
            viewMode={viewMode}
            onReadBook={handleOpenBook}
            on3DPreviewBook={handle3DPreviewBook}
            onDownloadBook={handleDownloadBook}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        )}

        {/* Vocabulary */}
        {contentType === 'vocabulary' && (
          <div className="space-y-3 animate-slide-up my-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground font-poppins py-8">Loading vocabulary...</p>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-border/80">
                <Languages className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-poppins">No vocabulary content found matching filters.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="glass rounded-2xl p-5 border border-border/70 hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-orbitron text-base font-bold text-primary">{item.title}</h3>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-poppins">
                        {item.subject}
                      </span>
                    </div>
                    <Languages className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground font-poppins mt-2">{item.description || 'Vocabulary unit module.'}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Grammar */}
        {contentType === 'grammar' && (
          <div className="space-y-4 animate-slide-up my-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground font-poppins py-8">Loading grammar modules...</p>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-border/80">
                <BookMarked className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-poppins">No grammar content found matching filters.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="glass rounded-2xl p-5 border border-border/70 hover:border-primary/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-orbitron text-base font-bold text-foreground">{item.title}</h3>
                    <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-poppins">
                      {item.subject}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-poppins">{item.description || 'Grammar exercise reference.'}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Reference Books */}
        {contentType === 'reference' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up my-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground font-poppins py-8 col-span-2">Loading reference books...</p>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center col-span-2 border border-border/80">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-poppins">No reference materials found.</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div key={item.id} className="glass rounded-2xl p-5 border border-border/70 hover:border-primary/50 transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-orbitron text-sm font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground font-poppins mt-0.5">{item.subject} • Grade {item.grade}</p>
                    <p className="text-xs text-muted-foreground font-poppins mt-2 line-clamp-2">{item.description || ''}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleOpenBook(item)}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-poppins hover:bg-primary/20 flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> Read Reference
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Videos */}
        {contentType === 'videos' && (
          <div className="animate-slide-up my-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground font-poppins py-8">Loading video catalog...</p>
            ) : !isPremium ? (
              <div className="glass rounded-2xl p-12 text-center border border-border/80">
                <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-orbitron text-lg text-foreground mb-2">Premium Video Lessons</h3>
                <p className="text-sm text-muted-foreground font-poppins mb-4">Video explanations and animations are available for premium subscribers.</p>
                <a href="/pricing" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-orbitron text-sm neon-glow inline-block">
                  Upgrade Now
                </a>
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-border/80">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-poppins">No video lessons found matching criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <div key={item.id} className="glass rounded-2xl overflow-hidden border border-border/70 hover:border-primary/50 transition-all">
                    <div className="h-36 bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                      <Video className="h-12 w-12 text-primary/50" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-orbitron text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground font-poppins mt-1">{item.subject} • Grade {item.grade}</p>
                      {item.file_url ? (
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-orbitron neon-glow block text-center"
                        >
                          ▶ Watch Lesson
                        </a>
                      ) : (
                        <button className="mt-3 w-full py-2 rounded-xl bg-muted text-muted-foreground text-xs font-orbitron cursor-not-allowed">
                          No video stream
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3D Page Flip Viewer Modal */}
      {preview3DBook && (
        <Book3DViewer
          bookTitle={preview3DBook.title}
          totalPages={preview3DBook.pages}
          fileUrl={preview3DBook.fileUrl}
          subject={preview3DBook.subject}
          grade={preview3DBook.grade}
          contentItemId={preview3DBook.id}
          onClose={() => setPreview3DBook(null)}
          onPageChange={(page, total) => {
            if (preview3DBook && isAuthenticated) {
              upsertProgress.mutate({
                content_item_id: preview3DBook.id,
                current_page: page,
                total_pages: total,
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default Library;
