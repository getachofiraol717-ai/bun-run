import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
  Sun, Moon, BookOpen, Download, Sparkles, Volume2, Maximize2,
  Minimize2, Check, FileText, Layers, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadPdfDocument, renderPageToCanvas, extractPageText } from '@/lib/pdfjs';
import { downloadEthiopiaGrade9PDF } from '@/lib/ethiopiaGrade9PDF';
import LibraryCompanion from './LibraryCompanion';

export interface Book3DViewerProps {
  bookTitle: string;
  totalPages?: number;
  fileUrl?: string;
  subject?: string;
  grade?: number;
  contentItemId?: string;
  onClose: () => void;
  onPageChange?: (page: number, total: number) => void;
  className?: string;
}

const SAMPLE_PAGES = [
  {
    page: 1,
    title: "Chapter 1: Overview & Foundation",
    text: `# Chapter 1: Overview & Foundation

Welcome to **${'Book Title'}**. This textbook covers fundamental principles and practical problem solving tailored to grade requirements.

### Key Objectives
* Master primary equations and physical laws.
* Apply concepts to everyday scenarios and laboratory experiments.
* Develop intuitive models for problem solving.

> *"Education is not the learning of facts, but the training of the mind to think."* — Albert Einstein`,
  },
  {
    page: 2,
    title: "Chapter 1.2: Core Principles & Definitions",
    text: `### Core Principles & Definitions

When studying physical systems, we partition behavior into **Kinematics** and **Dynamics**.

#### Key Equations:
1. **Velocity**: $v = \\frac{\\Delta x}{\\Delta t}$
2. **Acceleration**: $a = \\frac{\\Delta v}{\\Delta t}$
3. **Newton's Second Law**: $F = m \\cdot a$

#### Example Problem:
A car accelerates from rest at $2.5\\text{ m/s}^2$ for $4\\text{ seconds}$. Calculate final velocity:
$$v = u + a \\cdot t = 0 + (2.5)(4) = 10\\text{ m/s}$$`,
  },
  {
    page: 3,
    title: "Chapter 2: Energy & Conservation Laws",
    text: `# Chapter 2: Energy & Conservation Laws

Energy cannot be created or destroyed, only transformed from one state to another.

### Forms of Energy:
* **Kinetic Energy ($E_k$)**: $E_k = \\frac{1}{2}m v^2$
* **Potential Energy ($E_p$)**: $E_p = m g h$

### Real World Case Study:
Consider a roller coaster at height $h = 20\\text{m}$. All potential energy converts to kinetic energy at the bottom!`,
  },
  {
    page: 4,
    title: "Chapter 3: Problem Solving & Practice Test",
    text: `# Chapter 3: Practice Test

1. What is the unit of force in the SI system?
   - A) Joule
   - B) Newton (N)
   - C) Watt
2. State the Law of Conservation of Energy.
3. Calculate the kinetic energy of a $1000\\text{kg}$ car moving at $20\\text{m/s}$.`,
  },
];

export const Book3DViewer: React.FC<Book3DViewerProps> = ({
  bookTitle,
  totalPages = 20,
  fileUrl,
  subject = "Curriculum",
  grade = 9,
  contentItemId,
  onClose,
  onPageChange,
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [readingMode, setReadingMode] = useState<'light' | 'dark' | 'sepia'>('dark');
  const [zoom, setZoom] = useState(100);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [showCompanion, setShowCompanion] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PDF.js rendering states
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfPageText, setPdfPageText] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load PDF if URL exists
  useEffect(() => {
    let active = true;
    if (fileUrl) {
      setLoadingPdf(true);
      loadPdfDocument(fileUrl)
        .then((doc) => {
          if (active && doc) {
            setPdfDoc(doc);
            setLoadingPdf(false);
          }
        })
        .catch(() => {
          if (active) setLoadingPdf(false);
        });
    }
    return () => {
      active = false;
    };
  }, [fileUrl]);

  // Render Page to Canvas
  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPageToCanvas(pdfDoc, currentPage, canvasRef.current, zoom / 100);
      extractPageText(pdfDoc, currentPage).then((txt) => {
        setPdfPageText(txt);
      });
    }
  }, [pdfDoc, currentPage, zoom]);

  const maxPages = pdfDoc ? pdfDoc.numPages : totalPages;

  const handlePageTurn = (newPage: number, dir: 'next' | 'prev') => {
    if (newPage < 1 || newPage > maxPages) return;
    setFlipDirection(dir);
    setIsFlipping(true);
    setCurrentPage(newPage);
    if (onPageChange) onPageChange(newPage, maxPages);

    setTimeout(() => {
      setIsFlipping(false);
    }, 400);
  };

  const currentSample = SAMPLE_PAGES[(currentPage - 1) % SAMPLE_PAGES.length];

  // ── CompanionContext helpers ──────────────────────────────────
  const getChapterText = useCallback(async (): Promise<string> => {
    if (!pdfDoc) return pdfPageText || currentSample.text;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(maxPages, currentPage + 2);
    const texts = await Promise.all(
      Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => extractPageText(pdfDoc, p))
    );
    return texts.filter(Boolean).join('\n\n').slice(0, 12000);
  }, [pdfDoc, currentPage, maxPages, pdfPageText, currentSample]);

  const getBookSampleText = useCallback(async (): Promise<string> => {
    if (!pdfDoc) return SAMPLE_PAGES.map((s) => s.text).join('\n\n').slice(0, 14000);
    const step = Math.max(1, Math.floor(maxPages / 5));
    const pages: number[] = [];
    for (let p = 1; p <= maxPages; p += step) pages.push(p);
    pages.push(maxPages);
    const texts = await Promise.all([...new Set(pages)].slice(0, 15).map((p) => extractPageText(pdfDoc, p)));
    return texts.filter(Boolean).join('\n\n[...]\n\n').slice(0, 14000);
  }, [pdfDoc, maxPages]);

  const jumpToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > maxPages) return;
      handlePageTurn(page, page > currentPage ? 'next' : 'prev');
    },
    [maxPages, currentPage]
  );

  // Colors for background modes
  const modeBg =
    readingMode === 'light'
      ? 'bg-slate-50 text-slate-900 border-slate-300'
      : readingMode === 'sepia'
      ? 'bg-amber-100/90 text-amber-950 border-amber-300/60'
      : 'bg-slate-950 text-slate-100 border-slate-800';

  return (
    <div className={`fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col ${className}`}>
      {/* 1. Header Navigation Bar */}
      <header className="p-3 sm:p-4 bg-muted/40 border-b border-border/80 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-primary/20 text-primary shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron font-bold text-sm sm:text-base text-foreground truncate">
                {bookTitle}
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary">
                Grade {grade} • {subject}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-poppins hidden sm:block">
              Interactive 3D PDF Reader & Page-Flip Engine
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 glass p-1 rounded-xl">
            <button
              onClick={() => setZoom((z) => Math.max(70, z - 10))}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono px-1 font-semibold">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Reading Theme Toggle */}
          <div className="flex items-center gap-1 glass p-1 rounded-xl">
            <button
              onClick={() => setReadingMode('light')}
              className={`p-1.5 rounded-lg text-xs ${readingMode === 'light' ? 'bg-white text-black shadow' : 'text-muted-foreground'}`}
              title="Light theme"
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setReadingMode('sepia')}
              className={`p-1.5 rounded-lg text-xs ${readingMode === 'sepia' ? 'bg-amber-200 text-amber-900 shadow' : 'text-muted-foreground'}`}
              title="Sepia theme"
            >
              📜
            </button>
            <button
              onClick={() => setReadingMode('dark')}
              className={`p-1.5 rounded-lg text-xs ${readingMode === 'dark' ? 'bg-slate-800 text-white shadow' : 'text-muted-foreground'}`}
              title="Dark theme"
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* AI Tutor Toggle Button */}
          <Button
            size="sm"
            onClick={() => setShowCompanion((v) => !v)}
            className={`text-xs font-orbitron font-semibold gap-1.5 rounded-xl ${
              showCompanion ? 'bg-primary text-primary-foreground shadow-lg' : 'glass hover:bg-primary/20 text-foreground'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Tutor</span>
          </Button>

          {/* Download PDF */}
          <Button
            size="sm"
            variant="ghost"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={downloadEthiopiaGrade9PDF}
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Close button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive"
            title="Close viewer"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* 2. Main 3D Book Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="flex gap-4 w-full h-full max-w-6xl mx-auto">
          {/* 3D Page Flip Viewport */}
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center relative perspective-[1200px] transition-all duration-300">
            {/* Page Navigation Left Arrow */}
            <button
              onClick={() => handlePageTurn(currentPage - 1, 'prev')}
              disabled={currentPage <= 1}
              className="absolute left-2 sm:left-4 z-30 p-3 rounded-full bg-background/80 border border-border shadow-xl text-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Page Navigation Right Arrow */}
            <button
              onClick={() => handlePageTurn(currentPage + 1, 'next')}
              disabled={currentPage >= maxPages}
              className="absolute right-2 sm:right-4 z-30 p-3 rounded-full bg-background/80 border border-border shadow-xl text-foreground hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* 3D Book Bookfold Canvas / Container */}
            <div
              className={`w-full max-w-2xl h-[520px] rounded-2xl border shadow-2xl p-6 sm:p-8 overflow-y-auto relative transition-transform duration-500 ease-out ${modeBg} ${
                isFlipping
                  ? flipDirection === 'next'
                    ? '-rotate-y-12 scale-95 opacity-80'
                    : 'rotate-y-12 scale-95 opacity-80'
                  : 'rotate-y-0 scale-100 opacity-100'
              }`}
              style={{
                transformStyle: 'preserve-3d',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 240, 255, 0.1)',
              }}
            >
              {/* Book Spine Crease Visual Effect */}
              <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-black/20 via-black/10 to-transparent pointer-events-none border-r border-black/10" />

              {/* PDF Canvas Rendering Mode */}
              {fileUrl && (
                <div className="flex flex-col items-center justify-center my-auto min-h-full">
                  <canvas ref={canvasRef} className="max-w-full rounded shadow-md border border-border/40" />
                  {loadingPdf && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground my-4 font-poppins">
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      <span>Loading PDF page rendering...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback Sample Book Content if No Canvas or standard fallback */}
              {(!fileUrl || !pdfDoc) && (
                <div className="prose prose-sm dark:prose-invert max-w-none font-poppins space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="text-xs font-mono font-bold text-primary">
                      {currentSample.title}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Page {currentPage} of {maxPages}
                    </span>
                  </div>

                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentSample.text}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Page Footer Navigation Slider */}
            <div className="mt-4 flex items-center gap-3 bg-muted/40 px-4 py-2 rounded-2xl border border-border/60">
              <span className="text-xs font-mono text-muted-foreground">Page {currentPage} / {maxPages}</span>
              <input
                type="range"
                min={1}
                max={maxPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="w-36 sm:w-48 accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* AI Tutor Drawer Panel if Open */}
          {showCompanion && (
            <div className="w-[40%] min-w-[16rem] max-w-md shrink-0 h-full glass-strong rounded-2xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
              <LibraryCompanion
                ctx={{
                  bookTitle,
                  currentPage,
                  totalPages: maxPages,
                  pageText: pdfPageText || currentSample.text,
                  subject,
                  grade,
                  getChapterText,
                  getBookSampleText,
                  onJumpToPage: jumpToPage,
                }}
                onClose={() => setShowCompanion(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Book3DViewer;
