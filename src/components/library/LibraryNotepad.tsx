import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StickyNote, Plus, Trash2, Sparkles, Loader2, Share2, Check, Mic, MicOff,
  Pencil, Pin, Search, Filter, Download, Copy, Bot, HelpCircle, Sigma,
  Code as CodeIcon, ListTodo, FileText, Bookmark, ArrowRight, CornerDownRight,
  ChevronDown, ExternalLink, RefreshCw, X, Layers
} from 'lucide-react';
import { libraryAiJSON } from './libraryAiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CompanionContext } from './types';
import { Markdown } from './Markdown';
import { toast } from 'sonner';
import {
  fetchLibraryNotes,
  insertLibraryNote,
  updateLibraryNote,
  deleteLibraryNote,
  toggleShareLibraryNote,
  LibraryNoteItem,
  NoteKind
} from './libraryNotesStore';

const db = supabase as any;

interface LibraryNotepadProps {
  ctx: CompanionContext;
  language?: string;
  onAskAITutor?: (prompt: string) => void;
  initialSourceText?: string;
}

const COLORS = ['#fbbf24', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa', '#fb923c'];

const KIND_CONFIG: Record<NoteKind, { emoji: string; label: string; desc: string; icon: any }> = {
  note:      { emoji: '📝', label: 'Note',      desc: 'Standard note',          icon: StickyNote },
  quick:     { emoji: '⚡', label: 'Quick',     desc: 'Fast thought',           icon: Bookmark },
  formula:   { emoji: '🧮', label: 'Formula',   desc: 'Math/science formula',   icon: Sigma },
  code:      { emoji: '💻', label: 'Code',      desc: 'Code snippet',           icon: CodeIcon },
  question:  { emoji: '❓', label: 'Question',  desc: 'Question to investigate',icon: HelpCircle },
  summary:   { emoji: '📌', label: 'Summary',   desc: 'Page or chapter summary',icon: FileText },
  todo:      { emoji: '☑️', label: 'Todo',      desc: 'Learning action item',   icon: ListTodo },
  flashcard: { emoji: '🃏', label: 'Flashcard', desc: 'Card candidate',         icon: Layers },
  ai:        { emoji: '🤖', label: 'AI Note',   desc: 'AI Tutor explanation',   icon: Bot },
  voice:     { emoji: '🎙️', label: 'Voice',     desc: 'Audio transcript',       icon: Mic },
  highlight: { emoji: '🖊️', label: 'Highlight', desc: 'Excerpt highlight',      icon: Pencil },
  drawing:   { emoji: '🖌️', label: 'Drawing',   desc: 'Visual diagram',         icon: Pencil },
};

const SUGGESTED_TAGS = ['#exam', '#important', '#formula', '#review', '#key-concept', '#definition', '#homework'];

export default function LibraryNotepad({
  ctx,
  language = 'en',
  onAskAITutor,
  initialSourceText = '',
}: LibraryNotepadProps) {
  const { user } = useAuth();
  const [notes, setNotes]                 = useState<LibraryNoteItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const [viewMode, setViewMode]           = useState<'list' | 'editor' | 'organize'>('list');
  const [scopeFilter, setScopeFilter]     = useState<'page' | 'all' | 'general'>('page');
  const [typeFilter, setTypeFilter]       = useState<string>('all');
  const [searchQuery, setSearchQuery]     = useState('');

  // ── Editor State ─────────────────────────────────────────────────────────
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [title, setTitle]                 = useState('');
  const [text, setText]                   = useState('');
  const [kind, setKind]                   = useState<NoteKind>('note');
  const [color, setColor]                 = useState(COLORS[0]);
  const [tags, setTags]                   = useState<string[]>([]);
  const [tagInput, setTagInput]           = useState('');
  const [isPinned, setIsPinned]           = useState(false);
  const [sourceText, setSourceText]       = useState(initialSourceText);
  const [codeLang, setCodeLang]           = useState('javascript');
  const [recording, setRecording]         = useState(false);
  const [isAutosaving, setIsAutosaving]   = useState(false);
  const autosaveTimerRef = useRef<any>(null);
  const recRef = useRef<any>(null);

  // ── AI Organize State ────────────────────────────────────────────────────
  const [organizeOut, setOrganizeOut]     = useState('');
  const [suggestedCards, setSuggestedCards] = useState<{ front: string; back: string }[]>([]);
  const [organizeBusy, setOrganizeBusy]   = useState(false);
  const [savingCards, setSavingCards]    = useState<Set<number>>(new Set());

  // ── Load Notes ───────────────────────────────────────────────────────────
  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLibraryNotes(user?.id, ctx.contentItemId);
      setNotes(data);
    } catch (e) {
      console.error('Error loading notes:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, ctx.contentItemId]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  useEffect(() => {
    if (initialSourceText) {
      setSourceText(initialSourceText);
      setViewMode('editor');
    }
  }, [initialSourceText]);

  // ── Open Editor for New or Existing Note ─────────────────────────────────
  const startNewNote = (presetKind: NoteKind = 'note') => {
    setEditingId(null);
    setTitle('');
    setText('');
    setKind(presetKind);
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setTags([]);
    setIsPinned(false);
    setSourceText(initialSourceText || '');
    setCodeLang('javascript');
    setViewMode('editor');
  };

  const editNote = (note: LibraryNoteItem) => {
    setEditingId(note.id);
    setTitle(note.title || '');
    setText(note.text || '');
    setKind(note.kind || 'note');
    setColor(note.color || COLORS[0]);
    setTags(note.tags || []);
    setIsPinned(note.is_pinned || false);
    setSourceText(note.source_text || '');
    setCodeLang(note.code_lang || 'javascript');
    setViewMode('editor');
  };

  // ── Save / Autosave ──────────────────────────────────────────────────────
  const handleSaveNote = async () => {
    if (!text.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    try {
      if (editingId) {
        const updated = await updateLibraryNote(editingId, {
          title: title.trim(),
          text: text.trim(),
          kind,
          color,
          tags,
          is_pinned: isPinned,
          source_text: sourceText,
          code_lang: codeLang,
        }, user?.id);
        if (updated) {
          setNotes(prev => prev.map(n => n.id === editingId ? updated : n));
        }
        toast.success('Note updated');
      } else {
        const created = await insertLibraryNote({
          user_id: user?.id,
          content_item_id: ctx.contentItemId ?? null,
          page: ctx.currentPage,
          kind,
          title: title.trim(),
          text: text.trim(),
          color,
          tags,
          is_pinned: isPinned,
          chapter_title: ctx.subject || '',
          source_text: sourceText,
          code_lang: codeLang,
        });
        setNotes(prev => [created, ...prev]);
        toast.success('Note saved');
      }
      setViewMode('list');
      setEditingId(null);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save note');
    }
  };

  // ── Delete Note ──────────────────────────────────────────────────────────
  const handleDeleteNote = async (id: string) => {
    await deleteLibraryNote(id, user?.id);
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Note deleted');
  };

  // ── Toggle Pin ───────────────────────────────────────────────────────────
  const handleTogglePin = async (note: LibraryNoteItem) => {
    const updated = await updateLibraryNote(note.id, { is_pinned: !note.is_pinned }, user?.id);
    if (updated) {
      setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
    }
  };

  // ── Toggle Todo Checkbox ─────────────────────────────────────────────────
  const handleToggleTodo = async (note: LibraryNoteItem) => {
    const updated = await updateLibraryNote(note.id, { completed: !note.completed }, user?.id);
    if (updated) {
      setNotes(prev => prev.map(n => n.id === note.id ? updated : n));
    }
  };

  // ── Voice Recording ──────────────────────────────────────────────────────
  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = language === 'am' ? 'am-ET' : 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const txt = e.results[0][0].transcript;
      setText(p => p + (p ? ' ' : '') + txt);
      setKind('voice');
    };
    rec.onerror = () => {
      setRecording(false);
      toast.error('Voice recognition error');
    };
    rec.onend = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  };

  // ── Tag Management ───────────────────────────────────────────────────────
  const addTag = (t: string) => {
    const clean = t.trim().startsWith('#') ? t.trim() : `#${t.trim()}`;
    if (clean.length > 1 && !tags.includes(clean)) {
      setTags(p => [...p, clean]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    setTags(p => p.filter(x => x !== t));
  };

  // ── Formatting Helpers ──────────────────────────────────────────────────
  const applyFormat = (prefix: string, suffix: string = '') => {
    setText(prev => `${prev}${prefix}selected text${suffix}`);
  };

  // ── Convert Note Actions ─────────────────────────────────────────────────
  const convertToFlashcard = async (note: LibraryNoteItem) => {
    if (!user) {
      toast.error('Please sign in to save flashcards');
      return;
    }
    try {
      const front = note.title || `Key Concept (p. ${note.page})`;
      const back = note.text;
      await db.from('library_flashcards').insert({
        user_id: user.id,
        content_item_id: ctx.contentItemId ?? null,
        front,
        back,
        difficulty: 'medium',
        source: 'notepad',
        box: 1,
        ease: 2.5,
        next_review_at: new Date().toISOString(),
      });
      toast.success('Flashcard created in Flashcards Tab!');
    } catch (e: any) {
      toast.error('Could not create flashcard');
    }
  };

  const askAIAboutNote = (note: LibraryNoteItem) => {
    const prompt = `Can you explain or elaborate on this note from page ${note.page} of "${ctx.bookTitle}"?\n\nNote: "${note.text}"${note.source_text ? `\nSource text: "${note.source_text}"` : ''}`;
    if (onAskAITutor) {
      onAskAITutor(prompt);
    } else {
      navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard for AI Tutor!');
    }
  };

  // ── Export Notes ─────────────────────────────────────────────────────────
  const exportNotesMarkdown = () => {
    if (notes.length === 0) {
      toast.error('No notes to export');
      return;
    }
    let md = `# Notes for "${ctx.bookTitle}"\n\n`;
    notes.forEach((n, idx) => {
      md += `## ${idx + 1}. ${n.title || n.kind.toUpperCase()} (Page ${n.page})\n`;
      if (n.tags && n.tags.length > 0) md += `Tags: ${n.tags.join(', ')}\n`;
      if (n.source_text) md += `> Source: "${n.source_text}"\n\n`;
      md += `${n.text}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ctx.bookTitle.replace(/[^a-z0-9]/gi, '_')}_Notes.md`;
    a.click();
    toast.success('Notes exported as Markdown');
  };

  // ── AI Organize ──────────────────────────────────────────────────────────
  const runAIOrganize = async () => {
    if (notes.length < 2) {
      toast.error('Add at least 2 notes first');
      return;
    }
    setOrganizeBusy(true);
    setOrganizeOut('');
    setSuggestedCards([]);
    try {
      const res = await libraryAiJSON<{ summary: string; flashcards: { front: string; back: string }[] }>({
        action: 'notes_organize',
        notes: notes.map(n => ({ page: n.page, text: n.text ?? '', title: n.title, kind: n.kind })),
        bookTitle: ctx.bookTitle,
        subject: ctx.subject,
        language,
      });
      setOrganizeOut(res.summary ?? '');
      setSuggestedCards(res.flashcards ?? []);
      setViewMode('organize');
    } catch (e: any) {
      toast.error(e.message || 'AI organization failed');
    } finally {
      setOrganizeBusy(false);
    }
  };

  // ── Filtered Notes List ─────────────────────────────────────────────────
  const filteredNotes = notes.filter(n => {
    // Scope filter
    if (scopeFilter === 'page' && n.page !== ctx.currentPage) return false;
    if (scopeFilter === 'general' && n.page > 0 && n.page !== 1) return false;

    // Type filter
    if (typeFilter !== 'all' && n.kind !== typeFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = n.text.toLowerCase().includes(q);
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchTag = (n.tags || []).some(t => t.toLowerCase().includes(q));
      return matchText || matchTitle || matchTag;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card/30">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0 bg-background/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 rounded-lg text-xs font-poppins transition-colors flex items-center gap-1.5 ${
              viewMode === 'list' ? 'bg-primary/20 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <StickyNote className="h-3.5 w-3.5" /> Notes ({notes.length})
          </button>
          <button
            onClick={() => startNewNote()}
            className={`px-2.5 py-1 rounded-lg text-xs font-poppins transition-colors flex items-center gap-1.5 ${
              viewMode === 'editor' ? 'bg-primary/20 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Plus className="h-3.5 w-3.5" /> Add Note
          </button>
        </div>

        {notes.length >= 2 && (
          <button
            onClick={runAIOrganize}
            disabled={organizeBusy}
            className="px-2.5 py-1 rounded-lg border border-accent/40 text-accent text-xs font-poppins flex items-center gap-1.5 hover:bg-accent/10 disabled:opacity-50"
          >
            {organizeBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Organize
          </button>
        )}
      </div>

      {/* ── EDITOR VIEW ──────────────────────────────────────────────────── */}
      {viewMode === 'editor' && (
        <div className="flex-1 overflow-auto p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-xs font-orbitron font-bold text-primary flex items-center gap-1.5">
              {editingId ? 'Edit Learning Note' : `New Note (Page ${ctx.currentPage})`}
            </span>
            <button
              onClick={() => setViewMode('list')}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Source Text Context Banner */}
          {sourceText && (
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-xs relative">
              <span className="text-[10px] uppercase font-mono text-primary font-bold block mb-1">
                📌 Context from Page {ctx.currentPage}
              </span>
              <p className="text-muted-foreground italic line-clamp-2">"{sourceText}"</p>
              <button
                onClick={() => setSourceText('')}
                className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-destructive text-[10px]"
              >
                Clear
              </button>
            </div>
          )}

          {/* Note Type Selection */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Note Type</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(Object.keys(KIND_CONFIG) as NoteKind[]).slice(0, 8).map(k => {
                const conf = KIND_CONFIG[k];
                return (
                  <button
                    key={k}
                    onClick={() => setKind(k)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-poppins shrink-0 flex items-center gap-1 border transition-all ${
                      kind === k
                        ? 'bg-primary/20 border-primary text-primary font-bold'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <span>{conf.emoji}</span>
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note Title (Optional)..."
            className="w-full bg-background/60 border border-border rounded-xl px-3 py-1.5 text-sm focus:border-primary outline-none font-medium"
          />

          {/* Toolbar for Quick Formatting */}
          <div className="flex items-center gap-1 flex-wrap bg-background/40 p-1 rounded-lg border border-border/40">
            <button onClick={() => applyFormat('**', '**')} className="p-1 text-xs hover:bg-black/10 rounded font-bold" title="Bold">B</button>
            <button onClick={() => applyFormat('*', '*')} className="p-1 text-xs hover:bg-black/10 rounded italic" title="Italic">I</button>
            <button onClick={() => applyFormat('### ')} className="p-1 text-xs hover:bg-black/10 rounded font-mono" title="Heading">H3</button>
            <button onClick={() => applyFormat('- ')} className="p-1 text-xs hover:bg-black/10 rounded" title="Bullet List">• List</button>
            <button onClick={() => applyFormat('- [ ] ')} className="p-1 text-xs hover:bg-black/10 rounded" title="Checklist">☑ Todo</button>
            <button onClick={() => applyFormat('```\n', '\n```')} className="p-1 text-xs hover:bg-black/10 rounded font-mono" title="Code Block">&lt;/&gt;</button>
            <button onClick={() => applyFormat('$ ', ' $')} className="p-1 text-xs hover:bg-black/10 rounded font-mono" title="Formula">∑</button>
          </div>

          {/* Main Textarea */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={
              kind === 'formula'
                ? 'e.g. F = m * a  or  E = mc^2'
                : kind === 'code'
                ? 'Paste code block here...'
                : kind === 'question'
                ? 'What question do you want to research or ask AI?'
                : 'Write your notes...'
            }
            rows={6}
            className="w-full bg-background/60 border border-border rounded-xl p-3 text-sm focus:border-primary outline-none resize-none font-poppins"
          />

          {/* Tags Section */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-accent text-[11px] flex items-center gap-1">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-destructive">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                placeholder="Add tag (e.g. #exam)..."
                className="flex-1 bg-background/50 border border-border/60 rounded-lg px-2.5 py-1 text-xs focus:border-primary outline-none"
              />
              <button
                onClick={() => addTag(tagInput)}
                disabled={!tagInput.trim()}
                className="px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs disabled:opacity-40"
              >
                + Tag
              </button>
            </div>
            {/* Quick suggested tags */}
            <div className="flex gap-1 flex-wrap">
              {SUGGESTED_TAGS.map(st => (
                <button
                  key={st}
                  onClick={() => addTag(st)}
                  className="text-[10px] text-muted-foreground hover:text-accent font-mono"
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Colors & Options */}
          <div className="flex items-center justify-between border-t border-border/40 pt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase">Color:</span>
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`w-5 h-5 rounded-full border ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                />
              ))}
            </div>

            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                isPinned ? 'bg-primary/20 border-primary text-primary' : 'border-border text-muted-foreground'
              }`}
            >
              <Pin className="h-3.5 w-3.5" /> {isPinned ? 'Pinned' : 'Pin'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={toggleVoice}
              className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-1.5 ${
                recording ? 'border-destructive text-destructive bg-destructive/10 animate-pulse' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {recording ? <><MicOff className="h-3.5 w-3.5" /> Stop</> : <><Mic className="h-3.5 w-3.5" /> Voice</>}
            </button>

            <button
              onClick={handleSaveNote}
              disabled={!text.trim()}
              className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-orbitron font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md"
            >
              <Check className="h-4 w-4" /> Save Note
            </button>
          </div>
        </div>
      )}

      {/* ── NOTES LIST VIEW ───────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filters & Search */}
          <div className="p-2 border-b border-border/40 space-y-2 bg-background/30 shrink-0">
            {/* Scope Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 bg-background/60 p-0.5 rounded-lg border border-border/50">
                <button
                  onClick={() => setScopeFilter('page')}
                  className={`px-2 py-0.5 rounded text-[11px] font-poppins transition-colors ${
                    scopeFilter === 'page' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  Page {ctx.currentPage}
                </button>
                <button
                  onClick={() => setScopeFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-poppins transition-colors ${
                    scopeFilter === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  All Book ({notes.length})
                </button>
              </div>

              {notes.length > 0 && (
                <button
                  onClick={exportNotesMarkdown}
                  title="Export notes to Markdown"
                  className="p-1 text-muted-foreground hover:text-primary transition-colors text-xs flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes, tags..."
                className="w-full bg-background/60 border border-border/60 rounded-lg pl-8 pr-3 py-1 text-xs focus:border-primary outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1.5 text-muted-foreground text-xs">×</button>
              )}
            </div>
          </div>

          {/* Notes Feed */}
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {loading && (
              <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading learning notes...
              </div>
            )}

            {!loading && filteredNotes.length === 0 && (
              <div className="p-8 text-center space-y-2">
                <StickyNote className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery ? 'No notes matching search.' : scopeFilter === 'page' ? `No notes on Page ${ctx.currentPage}.` : 'No notes yet.'}
                </p>
                <button
                  onClick={() => startNewNote()}
                  className="px-3 py-1.5 rounded-xl bg-primary/20 text-primary border border-primary/40 text-xs font-poppins hover:bg-primary/30 inline-flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add First Note
                </button>
              </div>
            )}

            {filteredNotes.map(n => {
              const kindConf = KIND_CONFIG[n.kind || 'note'];
              return (
                <div
                  key={n.id}
                  style={{ borderLeft: `4px solid ${n.color || '#fbbf24'}` }}
                  className="rounded-r-xl border border-border/50 bg-background/50 p-3 text-sm group hover:border-primary/40 transition-all space-y-1.5 relative shadow-sm"
                >
                  {/* Note Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground">{kindConf.emoji} {kindConf.label}</span>
                      <span>·</span>
                      <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded font-mono text-[10px]">p.{n.page}</span>
                      {n.is_pinned && <span className="text-amber-500 font-bold">📌 Pinned</span>}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleTogglePin(n)} title="Pin note" className="p-1 text-muted-foreground hover:text-amber-500">
                        <Pin className={`h-3.5 w-3.5 ${n.is_pinned ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                      <button onClick={() => editNote(n)} title="Edit note" className="p-1 text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDeleteNote(n.id)} title="Delete note" className="p-1 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  {n.title && (
                    <h5 className="font-semibold text-foreground text-xs leading-snug">{n.title}</h5>
                  )}

                  {/* Todo Item Interactive Checkbox */}
                  {n.kind === 'todo' ? (
                    <label className="flex items-start gap-2 cursor-pointer my-1">
                      <input
                        type="checkbox"
                        checked={!!n.completed}
                        onChange={() => handleToggleTodo(n)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className={`text-xs ${n.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {n.text}
                      </span>
                    </label>
                  ) : n.kind === 'code' ? (
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto relative">
                      <pre>{n.text}</pre>
                      <button
                        onClick={() => { navigator.clipboard.writeText(n.text); toast.success('Code copied'); }}
                        className="absolute top-1.5 right-1.5 text-[10px] text-slate-400 hover:text-white bg-slate-800 px-1.5 py-0.5 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{n.text}</p>
                  )}

                  {/* Source text excerpt */}
                  {n.source_text && (
                    <p className="text-[11px] text-muted-foreground italic bg-black/10 p-1.5 rounded border-l-2 border-primary/40">
                      "{n.source_text}"
                    </p>
                  )}

                  {/* Tags */}
                  {n.tags && n.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap pt-0.5">
                      {n.tags.map(t => (
                        <span key={t} className="text-[10px] font-mono text-accent">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between border-t border-border/30 pt-1.5 text-[10px] text-muted-foreground">
                    <span className="font-mono">{new Date(n.created_at).toLocaleDateString()}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => askAIAboutNote(n)}
                        className="hover:text-primary transition-colors flex items-center gap-1"
                        title="Ask AI Tutor to explain or quiz you on this note"
                      >
                        <Bot className="h-3 w-3 text-primary" /> Ask AI
                      </button>
                      <button
                        onClick={() => convertToFlashcard(n)}
                        className="hover:text-accent transition-colors flex items-center gap-1"
                        title="Convert into flashcard"
                      >
                        <Layers className="h-3 w-3 text-accent" /> + Card
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AI ORGANIZE VIEW ─────────────────────────────────────────────── */}
      {viewMode === 'organize' && (
        <div className="flex-1 overflow-auto p-3 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-xs font-orbitron font-bold text-accent flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> AI Note Synthesis & Study Guide
            </span>
            <button onClick={() => setViewMode('list')} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {organizeBusy && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-accent" /> Synthesizing your notes into a master study guide...
            </div>
          )}

          {organizeOut && (
            <div className="bg-background/50 border border-border/50 rounded-xl p-3 text-xs leading-relaxed">
              <Markdown text={organizeOut} />
            </div>
          )}

          {suggestedCards.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider block">
                💡 AI Recommended Flashcards ({suggestedCards.length})
              </span>
              {suggestedCards.map((c, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-background/50 p-2.5 text-xs">
                  <p className="font-semibold text-foreground">{c.front}</p>
                  <p className="text-muted-foreground mt-1 border-t border-border/30 pt-1">{c.back}</p>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      setSavingCards(p => new Set(p).add(i));
                      await db.from('library_flashcards').insert({
                        user_id: user.id,
                        content_item_id: ctx.contentItemId ?? null,
                        front: c.front,
                        back: c.back,
                        difficulty: 'medium',
                        source: 'ai_organize',
                        box: 1,
                        ease: 2.5,
                        next_review_at: new Date().toISOString(),
                      });
                      toast.success('Card saved');
                    }}
                    disabled={savingCards.has(i)}
                    className="text-[10px] text-accent hover:underline mt-1.5 flex items-center gap-1 disabled:opacity-50"
                  >
                    {savingCards.has(i) ? <><Check className="h-3 w-3" /> Saved</> : '+ Add to Flashcards'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
