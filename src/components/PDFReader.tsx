import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Sun, Minimize2, Maximize2, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Eye, Upload, Download, WifiOff,
  CheckCircle2, Loader2, Sparkles, Search, List, Settings2,
  BookOpen, X as XIcon,
} from 'lucide-react';
import { cachePDF, getCachedPDFBlobUrl, isPDFCached } from '@/lib/offlineCache';
import { loadPdfDocument, extractPageText, extractPageRangeText, extractOutline, searchDocument, renderPageToCanvas, OutlineEntry } from '@/lib/pdfjs';
import { runAnalysis as runSmartPDFAnalysis, AnalysisPanel, computeDocumentId, getSmartPDFState } from '@/plugins/margeos/smart-pdf-engine';
import LibraryCompanion from './library/LibraryCompanion';
import AccessibilityToolbar, { AccessibilityPrefs, loadPrefs } from './library/AccessibilityToolbar';
import { CompanionContext } from './library/types';

import { downloadEthiopiaGrade9PDF, ETHIOPIA_GRADE_9_CURRICULUM_DATA } from '@/lib/ethiopiaGrade9PDF';

type ReadingMode = 'light' | 'dark' | 'sepia' | 'green' | 'blue';

interface PDFReaderProps {
  bookTitle:   string;
  totalPages:  number;
  initialPage?: number;
  fileUrl?:    string;
  onClose:     () => void;
  onPageChange?: (currentPage: number, totalPages: number) => void;
  contentItemId?: string;
  subject?:    string;
  grade?:      number;
}

const MODES: { id: ReadingMode; label: string; icon: string }[] = [
  { id: 'light', label: 'Light',     icon: '☀️' },
  { id: 'dark',  label: 'Dark',      icon: '🌙' },
  { id: 'sepia', label: 'Sepia',     icon: '📜' },
  { id: 'green', label: 'Eye Care',  icon: '🌿' },
  { id: 'blue',  label: 'Night Blue',icon: '🔵' },
];

const modeStyles: Record<ReadingMode, React.CSSProperties> = {
  light: { backgroundColor: '#ffffff', color: '#1a1a1a' },
  dark:  { backgroundColor: '#111827', color: '#e5e7eb' },
  sepia: { backgroundColor: '#fef3c7', color: '#78350f' },
  green: { backgroundColor: '#ecfdf5', color: '#064e3b' },
  blue:  { backgroundColor: '#1e293b', color: '#93c5fd' },
};
const toolbarCls: Record<ReadingMode, string> = {
  light: 'bg-gray-100 border-gray-200 text-gray-800',
  dark:  'bg-gray-800 border-gray-700 text-gray-200',
  sepia: 'bg-amber-100 border-amber-200 text-amber-900',
  green: 'bg-green-100 border-green-200 text-green-900',
  blue:  'bg-slate-700 border-slate-600 text-blue-200',
};

// ── Sample fallback text (no PDF loaded) ─────────────────────────
const SAMPLE = [
  "Chapter 1: Introduction\n\nWelcome to this comprehensive guide. This chapter introduces the fundamental concepts that will be explored throughout this textbook.\n\nKey Concepts:\n• Definition and scope of the subject\n• Historical development\n• Modern applications and relevance\n• Study methodology and approach",
  "Chapter 1 (continued)\n\nThe scientific method forms the backbone of our approach.\n\n\"The important thing is not to stop questioning.\" — Albert Einstein\n\nIn this course:\n1. Theoretical foundations\n2. Practical applications\n3. Problem-solving techniques\n4. Real-world case studies",
  "Chapter 2: Core Principles\n\n2.1 First Principle\nEvery system tends toward equilibrium.\n\n2.2 Second Principle\nEnergy conservation is universal.\n\n2.3 Third Principle\nFor every action, there is an equal and opposite reaction.",
  "Chapter 2 (continued)\n\nApplications:\n• Engineering\n• Medicine\n• Technology\n• Environment\n\nFormula: F = ma (Newton's Second Law)\n\nPractice Problems:\n1. Calculate the energy required to...\n2. Determine the equilibrium point of...",
  "Chapter 3: Advanced Topics\n\n3.1 Mathematical Framework\n• Differential equations\n• Linear algebra\n• Statistical analysis\n\n3.2 Experimental Methods\n• High-precision sensors\n• Computer simulations\n• Machine learning algorithms",
];

const PDFReader: React.FC<PDFReaderProps> = ({
  bookTitle, totalPages, initialPage, fileUrl, onClose, onPageChange,
  contentItemId, subject, grade,
}) => {
  // ── Existing state ───────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(initialPage && initialPage > 0 ? initialPage : 1);
  const [mode,  setMode]  = useState<ReadingMode>('light');
  const [zoom,  setZoom]  = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModePanel, setShowModePanel] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [fontSize, setFontSize] = useState(16);
  const [localPdfUrl,   setLocalPdfUrl]   = useState<string | null>(null);
  const [cachedBlobUrl, setCachedBlobUrl] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [caching, setCaching]   = useState(false);

  // ── New state ────────────────────────────────────────────────
  const [analysisOpen, setAnalysisOpen]   = useState(false);
  const [analysisTab, setAnalysisTab]     = useState<'overview'|'chapters'|'topics'|'formulas'|'diagrams'|'tables'|'path'|'tutor'|'companion'>('overview');
  const [analysisView, setAnalysisView]   = useState<'split'|'full'>('split');
  const companionOpen = analysisOpen && analysisTab === 'companion';
  const setCompanionOpen = (v: boolean | ((p: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(companionOpen) : v;
    if (next) { setAnalysisOpen(true); setAnalysisTab('companion'); if (!pdfDoc) loadDoc(); }
    else if (companionOpen) { setAnalysisOpen(false); }
  };
  const [a11yOpen, setA11yOpen]           = useState(false);
  const [a11yPrefs, setA11yPrefs]         = useState<AccessibilityPrefs>(loadPrefs());

  // pdf.js doc, text, outline, search, canvas rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc,   setPdfDoc]   = useState<any>(null);
  const [pageText, setPageText] = useState('');
  const [outline,  setOutline]  = useState<OutlineEntry[]>([]);
  const [showOutline, setShowOutline] = useState(false);
  const [textCache] = useState(() => new Map<number, string>());
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadError, setLoadError]   = useState(false);
  const [docTotalPages, setDocTotalPages] = useState(totalPages);

  // Search
  const [searchMode,    setSearchMode]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<{page:number;snippet:string}[]>([]);
  const [searching,     setSearching]     = useState(false);

  // Mobile detection
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid   = /Android/i.test(ua);
  const isCapacitor = typeof (window as any)?.Capacitor !== 'undefined';
  const isMobile    = isAndroid || /iPhone|iPad|iPod/i.test(ua) || isCapacitor;

  // ── Load cached blob ──────────────────────
  useEffect(() => {
    let active = true;
    if (!fileUrl) { setCachedBlobUrl(null); setIsCached(false); return; }
    (async () => {
      const cached = await isPDFCached(fileUrl);
      if (!active) return;
      setIsCached(cached);
      if (cached) {
        const blobUrl = await getCachedPDFBlobUrl(fileUrl);
        if (active && blobUrl) setCachedBlobUrl(blobUrl);
      }
    })();
    return () => { active = false; };
  }, [fileUrl]);

  // ── Load pdf.js document ──────────────────
  const loadDoc = useCallback(async () => {
    const src = cachedBlobUrl || localPdfUrl || fileUrl;
    if (!src || loadingDoc) return;
    setLoadingDoc(true);
    setLoadError(false);
    try {
      const doc = await loadPdfDocument(src);
      setPdfDoc(doc);
      if (doc.numPages && doc.numPages > 0) {
        setDocTotalPages(doc.numPages);
      }
      const ol = await extractOutline(doc);
      setOutline(ol);
      runSmartPDFAnalysis({ doc, source: src, subject }).catch(() => { /* non-critical */ });
    } catch (err) {
      console.warn('[PDFReader] Could not load PDF document:', err);
      setLoadError(true);
    }
    setLoadingDoc(false);
  }, [cachedBlobUrl, localPdfUrl, fileUrl, loadingDoc, subject]);

  // Eager load whenever src is available
  useEffect(() => {
    const src = cachedBlobUrl || localPdfUrl || fileUrl;
    if (src && !pdfDoc) {
      loadDoc();
    }
  }, [cachedBlobUrl, localPdfUrl, fileUrl]);

  // ── Render page onto canvas ─────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let active = true;
    (async () => {
      try {
        const scale = (zoom / 100) * 1.5;
        await renderPageToCanvas(pdfDoc, currentPage, canvasRef.current!, scale);
      } catch (err) {
        console.warn('[PDFReader] Canvas render error:', err);
      }
    })();
    return () => { active = false; };
  }, [pdfDoc, currentPage, zoom]);

  // ── Extract current page text ────────────────
  useEffect(() => {
    if (!pdfDoc) return;
    let active = true;
    (async () => {
      const text = await extractPageText(pdfDoc, currentPage);
      if (active) {
        setPageText(text);
        textCache.set(currentPage, text);
      }
    })();
    return () => { active = false; };
  }, [pdfDoc, currentPage]);


  // ── Open companion → trigger doc load ────────────────────────
  useEffect(() => {
    if (companionOpen) loadDoc();
  }, [companionOpen]);

  // ── Local file load ───────────────────────────────────────────
  const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setLocalPdfUrl(url); setPdfDoc(null); setPageText(''); setOutline([]); textCache.clear();
    }
  };
  useEffect(() => () => { if (localPdfUrl) URL.revokeObjectURL(localPdfUrl); }, [localPdfUrl]);

  const handleCacheOffline = async () => {
    if (!fileUrl || caching) return;
    setCaching(true);
    const entry = await cachePDF(`pdf_${btoa(fileUrl).slice(0, 16)}`, bookTitle, fileUrl);
    if (entry) {
      setIsCached(true);
      const blobUrl = await getCachedPDFBlobUrl(fileUrl);
      if (blobUrl) setCachedBlobUrl(blobUrl);
    }
    setCaching(false);
  };

  const pdfSrc = cachedBlobUrl || localPdfUrl || fileUrl;
  const effectiveTotalPages = (docTotalPages && docTotalPages > 0) ? docTotalPages : totalPages;

  // ── Auto report reading progress when currentPage or total pages change ──
  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onPageChangeRef.current?.(currentPage, effectiveTotalPages);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, effectiveTotalPages]);

  // ── Page navigation ───────────────────────────────────────────
  const goTo = useCallback((p: number) => {
    const maxP = (docTotalPages && docTotalPages > 0) ? docTotalPages : totalPages;
    const pg = Math.max(1, Math.min(p, maxP));
    setCurrentPage(pg);
  }, [totalPages, docTotalPages]);

  const nextPage = () => goTo(currentPage + 1);
  const prevPage = () => goTo(currentPage - 1);

  // ── Chapter nav from outline ─────────────────────────────────
  const currentChapterIdx = outline.reduce((found, entry, i) => {
    return entry.pageNumber <= currentPage ? i : found;
  }, -1);

  // ── In-PDF search ─────────────────────────────────────────────
  const runSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    if (!pdfDoc) { await loadDoc(); return; }
    setSearching(true);
    const hits = await searchDocument(pdfDoc, searchQuery, textCache);
    setSearchResults(hits);
    setSearching(false);
  };

  // ── CompanionContext ──────────────────────────────────────────
  const getChapterText = useCallback(async (): Promise<string> => {
    if (!pdfDoc) return pageText;
    const start = outline[currentChapterIdx]?.pageNumber ?? currentPage;
    const end   = outline[currentChapterIdx + 1]?.pageNumber
      ? outline[currentChapterIdx + 1].pageNumber - 1
      : Math.min(currentPage + 9, totalPages);
    return extractPageRangeText(pdfDoc, start, end, 12000);
  }, [pdfDoc, outline, currentChapterIdx, currentPage, totalPages, pageText]);

  const getBookSampleText = useCallback(async (): Promise<string> => {
    if (!pdfDoc) return pageText;
    // Sample evenly across the book: first 5 + middle 5 + last 5 pages
    const step = Math.max(1, Math.floor(totalPages / 5));
    const pages: number[] = [];
    for (let p = 1; p <= totalPages; p += step) pages.push(p);
    pages.push(totalPages);
    const texts = await Promise.all([...new Set(pages)].slice(0, 15).map(p => extractPageText(pdfDoc, p)));
    return texts.filter(Boolean).join('\n\n[...]\n\n').slice(0, 14000);
  }, [pdfDoc, totalPages, pageText]);

  const docId = pdfDoc && pdfSrc ? computeDocumentId(pdfDoc, pdfSrc) : null;
  const docState = docId ? getSmartPDFState(docId) : null;
  const analysisData = docState?.analysis;

  const companionCtx: CompanionContext = {
    contentItemId, bookTitle, subject, grade,
    currentPage, totalPages,
    pageText: pageText || SAMPLE[(currentPage - 1) % SAMPLE.length],
    getChapterText,
    getBookSampleText,
    onJumpToPage: goTo,
    analysis: analysisData ? {
      topics: analysisData.topics?.nodes?.map(n => ({ label: n.label, pages: n.pages, definition: n.definition })),
      formulas: analysisData.formulas?.map(f => ({ formula: f.formula, explanation: f.explanation, pageNumber: f.pageNumber })),
      chapters: analysisData.chapters?.flatIndex?.map(c => ({ title: c.title, pageStart: c.pageStart })),
      learningPath: analysisData.learningPath ? [
        ...(analysisData.learningPath.beginner || []),
        ...(analysisData.learningPath.intermediate || []),
        ...(analysisData.learningPath.advanced || []),
      ].map(s => ({ title: s.title, pageStart: s.pageStart })) : undefined,
    } : undefined,
  };

  // ── Render ────────────────────────────────────────────────────
  const tb = toolbarCls[mode];

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${isFullscreen ? '' : 'pt-16'}`}
      style={{ filter: `brightness(${brightness}%)` }}>

      {/* ── TOP TOOLBAR ── */}
      <div className={`flex items-center justify-between px-3 py-2 border-b gap-2 ${tb} shrink-0`}>
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 shrink-0"><X className="h-5 w-5" /></button>
          <span className="font-orbitron text-sm font-bold truncate">{bookTitle}</span>
          {loadingDoc && <Loader2 className="h-3.5 w-3.5 animate-spin opacity-50 shrink-0" />}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.max(z - 10, 50))} className="p-1.5 rounded hover:bg-black/10"><ZoomOut className="h-4 w-4" /></button>
          <span className="text-xs w-9 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(z + 10, 200))} className="p-1.5 rounded hover:bg-black/10"><ZoomIn className="h-4 w-4" /></button>

          <div className="w-px h-5 bg-current opacity-20 mx-0.5" />

          {/* Reading mode */}
          <button onClick={() => setShowModePanel(p => !p)} className="p-1.5 rounded hover:bg-black/10"><Eye className="h-4 w-4" /></button>

          {/* Chapter outline */}
          {outline.length > 0 && (
            <button onClick={() => setShowOutline(p => !p)} className={`p-1.5 rounded hover:bg-black/10 ${showOutline ? 'ring-1 ring-current' : ''}`} title="Chapter navigation">
              <List className="h-4 w-4" />
            </button>
          )}

          {/* Search */}
          <button onClick={() => { setSearchMode(p => !p); if (!pdfDoc) loadDoc(); }} className={`p-1.5 rounded hover:bg-black/10 ${searchMode ? 'ring-1 ring-current' : ''}`} title="Search inside PDF">
            <Search className="h-4 w-4" />
          </button>

          {/* ── Reading Companion + Smart Analysis (unified) ── */}
          <div className={`flex items-center rounded-lg overflow-hidden border ${analysisOpen ? 'border-primary/60' : 'border-current/20'}`}>
            <button
              onClick={() => { setAnalysisOpen(true); setAnalysisTab('companion'); if (!pdfDoc) loadDoc(); }}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-poppins transition-colors ${companionOpen ? 'bg-purple-600 text-white' : 'hover:bg-black/10'}`}
              title="Marge Reading Companion — ask, summarize, quiz"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Marge</span>
            </button>
            <div className="w-px h-5 bg-current opacity-20" />
            <button
              onClick={() => {
                if (analysisOpen && analysisTab !== 'companion') { setAnalysisOpen(false); }
                else { setAnalysisOpen(true); setAnalysisTab('overview'); if (!pdfDoc) loadDoc(); }
              }}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-poppins transition-colors ${analysisOpen && analysisTab !== 'companion' ? 'bg-primary text-white' : 'hover:bg-black/10'}`}
              title="Smart PDF Analysis — chapters, topics, formulas, AI tutor & learning path"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analysis</span>
            </button>
          </div>

          {/* Accessibility */}
          <button onClick={() => setA11yOpen(p => !p)} className="p-1.5 rounded hover:bg-black/10" title="Accessibility settings">
            <Settings2 className="h-4 w-4" />
          </button>

          <div className="w-px h-5 bg-current opacity-20 mx-0.5" />

          {/* PDF Download Trigger */}
          <button
            onClick={() => {
              if (fileUrl && !fileUrl.includes('ethiopia')) {
                window.open(fileUrl, '_blank');
              } else {
                downloadEthiopiaGrade9PDF();
              }
            }}
            className="p-1.5 rounded hover:bg-black/10 text-primary transition-colors"
            title="Download PDF Document"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Offline cache */}
          {fileUrl && (
            <button onClick={handleCacheOffline} disabled={caching || isCached} title={isCached ? 'Saved offline' : 'Save for offline'} className="p-1.5 rounded hover:bg-black/10 disabled:opacity-50">
              {caching ? <Loader2 className="h-4 w-4 animate-spin" /> : isCached ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4" />}
            </button>
          )}

          {/* Upload local PDF */}
          {!pdfSrc && (
            <label className="p-1.5 rounded hover:bg-black/10 cursor-pointer" title="Load local PDF">
              <Upload className="h-4 w-4" />
              <input type="file" accept="application/pdf" onChange={handleLocalFile} className="hidden" />
            </label>
          )}

          <button onClick={() => setIsFullscreen(p => !p)} className="p-1.5 rounded hover:bg-black/10">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ── EYE PROTECTION PANEL ── */}
      {showModePanel && (
        <div className={`px-4 py-3 border-b ${tb} space-y-3 shrink-0`}>
          <div className="flex gap-2 flex-wrap">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-poppins border transition-all ${
                  mode === m.id ? 'border-blue-500 ring-2 ring-blue-500/30 font-bold' : 'border-current/20 hover:border-current/40'
                }`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5" />
              <span className="text-xs">Brightness</span>
              <input type="range" min={50} max={100} value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="w-24 h-1 accent-blue-500" />
              <span className="text-xs w-8">{brightness}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Font</span>
              <button onClick={() => setFontSize(s => Math.max(s - 2, 12))} className="px-1.5 py-0.5 rounded border border-current/20 text-xs">A-</button>
              <span className="text-xs w-6 text-center">{fontSize}</span>
              <button onClick={() => setFontSize(s => Math.min(s + 2, 28))} className="px-1.5 py-0.5 rounded border border-current/20 text-xs">A+</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAPTER OUTLINE PANEL ── */}
      {showOutline && outline.length > 0 && (
        <div className={`px-3 py-2 border-b ${tb} shrink-0 max-h-48 overflow-auto`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Chapters</span>
            <button onClick={() => setShowOutline(false)}><XIcon className="h-3.5 w-3.5" /></button>
          </div>
          {outline.map((entry, i) => (
            <button key={i} onClick={() => { goTo(entry.pageNumber); setShowOutline(false); }}
              style={{ paddingLeft: `${8 + entry.depth * 12}px` }}
              className={`block w-full text-left py-1 text-xs rounded hover:bg-black/10 truncate ${
                i === currentChapterIdx ? 'font-semibold opacity-100' : 'opacity-70'
              }`}>
              {i === currentChapterIdx ? '▶ ' : ''}{entry.title}
              <span className="ml-2 opacity-50">p.{entry.pageNumber}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── SEARCH BAR ── */}
      {searchMode && (
        <div className={`px-3 py-2 border-b ${tb} shrink-0`}>
          <div className="flex items-center gap-2">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(); }}
              placeholder="Search inside this PDF…"
              className="flex-1 bg-black/10 rounded-lg px-3 py-1.5 text-sm outline-none" />
            <button onClick={runSearch} disabled={searching || !pdfDoc}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs disabled:opacity-50">
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
            </button>
            {!pdfDoc && !loadingDoc && <span className="text-[11px] opacity-50">Loading PDF engine…</span>}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-36 overflow-auto space-y-1">
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => goTo(r.page)} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-black/10">
                  <span className="font-semibold">p.{r.page} — </span>
                  <span className="opacity-70">{r.snippet}</span>
                </button>
              ))}
            </div>
          )}
          {searchQuery && !searching && searchResults.length === 0 && pdfDoc && (
            <p className="text-xs opacity-50 mt-1">No results found</p>
          )}
        </div>
      )}

      {/* ── MAIN BODY (PDF + Companion side panel) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* PDF viewer area — hidden when analysis is fullscreen */}
        {!(analysisOpen && analysisView === 'full') && (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden transition-all duration-300" style={modeStyles[mode]}>
          <div className="flex-1 overflow-auto p-4">
            {pdfSrc && pdfDoc && !loadError ? (
              <div className="flex flex-col items-center justify-center min-h-full py-4">
                <canvas ref={canvasRef} className="mx-auto block shadow-2xl rounded-xl max-w-full border border-border/40 transition-transform" />
              </div>
            ) : pdfSrc && loadingDoc ? (
              <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                <p className="font-orbitron text-sm font-semibold text-foreground">Loading PDF Document & Rendering Pages...</p>
                <p className="text-xs text-muted-foreground font-poppins mt-1">Extracting chapters, text & search index</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-6 py-6" style={{ fontSize: `${fontSize * zoom / 100}px` }}>
                {bookTitle.toLowerCase().includes('ethiopi') || bookTitle.toLowerCase().includes('grade 9') || grade === 9 ? (
                  <div className="space-y-6 font-poppins leading-relaxed">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <span className="text-xs font-bold text-primary tracking-wider uppercase">Ethiopian Ministry of Education (MoE)</span>
                        <h3 className="text-lg font-bold font-orbitron text-foreground mt-0.5">{bookTitle}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Grade 9 New Curriculum • Student Textbook Edition</p>
                      </div>
                    </div>

                    {(() => {
                      const subj = ETHIOPIA_GRADE_9_CURRICULUM_DATA.find(s => 
                        s.title.toLowerCase().includes((subject || bookTitle).toLowerCase()) ||
                        bookTitle.toLowerCase().includes(s.title.toLowerCase().split(' ')[2] || '')
                      ) || ETHIOPIA_GRADE_9_CURRICULUM_DATA[0];

                      const chap = subj.chapters[(currentPage - 1) % subj.chapters.length];

                      return (
                        <div className="space-y-4">
                          <div className="border-b border-border/60 pb-3">
                            <span className="text-xs font-semibold text-secondary font-orbitron">CHAPTER {chap.number}</span>
                            <h4 className="text-xl font-bold font-orbitron text-foreground mt-1">{chap.title}</h4>
                          </div>

                          <div className="bg-muted/40 p-4 rounded-xl border border-border/50">
                            <h5 className="text-sm font-bold text-primary mb-2 font-orbitron">Chapter Objectives & Key Competencies</h5>
                            <ul className="list-disc list-inside text-sm text-foreground/90 space-y-1">
                              {chap.topics.map((t, idx) => (
                                <li key={idx}><span className="font-semibold text-foreground">{t}</span> — Core competency for Grade 9 Ethiopian national standard.</li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3 text-sm text-foreground/90">
                            <p className="font-semibold text-primary">Key Subject Notes:</p>
                            <p>
                              Under the new Ministry of Education Grade 9 curriculum framework, students develop practical inquiry, mathematical modeling, scientific reasoning, and language competencies.
                            </p>
                            <p>
                              Students are encouraged to work through practice questions at the end of each section, utilize peer discussion groups, and test their understanding with the Knowledge Universe AI Tutor.
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                            <h5 className="text-sm font-bold text-secondary mb-1">Practice & Revision Question</h5>
                            <p className="text-xs text-foreground/80 font-mono">
                              Q: Define the main concepts of {chap.topics[0] || 'this chapter'} and give a real-life Ethiopian contextual application.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-poppins leading-relaxed" style={{ fontFamily: 'inherit' }}>
                    {SAMPLE[(currentPage - 1) % SAMPLE.length]}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="sticky bottom-0 py-2 px-4" style={modeStyles[mode]}>
            <div className="h-1.5 rounded-full bg-black/10 max-w-md mx-auto overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.round((currentPage / totalPages) * 100)}%` }} />
            </div>
            <p className="text-xs mt-1 opacity-50 text-center">{Math.round((currentPage / totalPages) * 100)}% complete</p>
          </div>
        </div>
        )}

        {/* ── SMART PDF ANALYSIS SIDE PANEL (with Reading Companion + AI Tutor tabs) ── */}
        {analysisOpen && (
          <div className={analysisView === 'full' ? 'flex-1 flex' : 'flex'}>
            <AnalysisPanel
              pdfDoc={pdfDoc}
              source={pdfSrc}
              onClose={() => setAnalysisOpen(false)}
              onJumpToPage={goTo}
              companionCtx={companionCtx}
              activeTab={analysisTab}
              onTabChange={(t) => setAnalysisTab(t as any)}
              viewMode={analysisView}
              onViewModeChange={setAnalysisView}
            />
          </div>
        )}
      </div>


      {/* ── BOTTOM NAVIGATION ── */}
      <div className={`flex items-center justify-between px-4 py-2 border-t ${toolbarCls[mode]} shrink-0`}>
        <button onClick={prevPage} disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-poppins disabled:opacity-30 hover:bg-black/10">
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        {/* Page jump input */}
        <div className="flex items-center gap-2">
          <input
            type="number" min={1} max={totalPages}
            value={currentPage}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) goTo(v); }}
            className="w-14 text-center text-xs rounded bg-black/10 border border-current/20 px-1 py-1 outline-none"
          />
          <span className="text-xs opacity-60">/ {totalPages}</span>
        </div>

        <button onClick={nextPage} disabled={currentPage >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-poppins disabled:opacity-30 hover:bg-black/10">
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── ACCESSIBILITY OVERLAY ── */}
      {a11yOpen && (
        <AccessibilityToolbar
          pageText={companionCtx.pageText}
          onJumpToPage={goTo}
          onExplainPage={() => { setCompanionOpen(true); setA11yOpen(false); }}
          onCreateQuiz={() => { setCompanionOpen(true); setA11yOpen(false); }}
          onClose={() => setA11yOpen(false)}
          prefs={a11yPrefs}
          setPrefs={setA11yPrefs}
        />
      )}
    </div>
  );
};

export default PDFReader;
