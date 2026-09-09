import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { X, Sparkles, Loader2, Send, MessageCircle, FileText, Sigma, Layers, ListChecks, StickyNote, BookOpen, Bot, Compass } from 'lucide-react';
import { Markdown } from './Markdown';
import { libraryAiStream, LIBRARY_LANGUAGES, COMPANION_MODES } from './libraryAiClient';
import { CompanionContext, SecondBookRef, resolveScopeText, Scope } from './types';
import LibrarySummaryTab from './LibrarySummaryTab';
import LibraryFormulaTab from './LibraryFormulaTab';
import LibraryFlashcardsTab from './LibraryFlashcardsTab';
import LibraryQuizTab from './LibraryQuizTab';
import LibraryNotesTab from './LibraryNotesTab';
import LibraryAITutorTab from './LibraryAITutorTab';
import LibraryStudyCompanionTab from './LibraryStudyCompanionTab';

type Tab = 'tutor' | 'hub' | 'ask' | 'summary' | 'formula' | 'flashcards' | 'quiz' | 'notes';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'tutor',      label: 'AI Tutor',  icon: Bot },
  { id: 'hub',        label: 'Study Hub', icon: Compass },
  { id: 'ask',        label: 'Quick Ask', icon: MessageCircle },
  { id: 'summary',    label: 'Summary',   icon: FileText },
  { id: 'formula',    label: 'Formulas',  icon: Sigma },
  { id: 'flashcards', label: 'Cards',     icon: Layers },
  { id: 'quiz',       label: 'Quiz',      icon: ListChecks },
  { id: 'notes',      label: 'Notes',     icon: StickyNote },
];

const QUICK_PROMPTS = [
  'What does this mean?',
  "Explain like I'm 10",
  'Give examples',
  'Why is this important?',
];

interface AIMsg { id: string; role: 'user' | 'assistant'; content: string; }

export default function LibraryCompanion({
  ctx, onClose, secondBook, initialTab = 'ask', hideHeader = false,
}: {
  ctx: CompanionContext;
  onClose: () => void;
  secondBook?: SecondBookRef | null;
  initialTab?: Tab;
  hideHeader?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [language, setLanguage] = useState('en');
  const [teachMode, setTeachMode] = useState('student');
  const [compareOn, setCompareOn] = useState(false);

  // ── Ask tab state ──────────────────────────────────────────────
  const [msgs, setMsgs] = useState<AIMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const msgsRef = useRef<AIMsg[]>(msgs);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { msgsRef.current = msgs; }, [msgs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);
  useEffect(() => {
    if (taRef.current) { taRef.current.style.height = 'auto'; taRef.current.style.height = Math.min(taRef.current.scrollHeight, 80) + 'px'; }
  }, [input]);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || busyRef.current) return;
    const aiId = `ai_${Date.now()}`;
    setMsgs(p => [...p, { id: `u_${Date.now()}`, role: 'user', content: text }, { id: aiId, role: 'assistant', content: '' }]);
    if (!overrideText) setInput('');
    busyRef.current = true; setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (compareOn && secondBook) {
        const [textA, textB] = await Promise.all([
          resolveScopeText(ctx, 'page'),
          secondBook.getText(),
        ]);
        await libraryAiStream(
          { action: 'compare', messages: [{ role: 'user', content: text }], textA, textB, titleA: ctx.bookTitle, titleB: secondBook.title, language },
          t => setMsgs(p => p.map(m => m.id === aiId ? { ...m, content: m.content + t } : m)),
          { signal: controller.signal }
        );
      } else {
        // Build valid history: start with user, merge consecutive same-role
        const raw = msgsRef.current.filter(m => m.content.trim()).slice(-10).map(m => ({ role: m.role, content: m.content }));
        while (raw.length > 0 && raw[0].role === 'assistant') raw.shift();
        const hist: { role: string; content: string }[] = [];
        for (const m of raw) {
          const last = hist[hist.length - 1];
          if (last && last.role === m.role) last.content += '\n\n' + m.content;
          else hist.push({ ...m });
        }
        hist.push({ role: 'user', content: text });

        await libraryAiStream(
          { action: 'companion', messages: hist, mode: teachMode, language, pageText: ctx.pageText, bookTitle: ctx.bookTitle, subject: ctx.subject, grade: ctx.grade },
          t => setMsgs(p => p.map(m => m.id === aiId ? { ...m, content: m.content + t } : m)),
          { signal: controller.signal }
        );
      }
    } catch (e: any) {
      const msg = e?.name === 'AbortError' ? '⚠️ Stopped.' : `⚠️ ${e.message || 'Something went wrong.'}`;
      setMsgs(p => p.map(m => m.id === aiId ? { ...m, content: m.content + '\n' + msg } : m));
    } finally {
      busyRef.current = false; setBusy(false); abortRef.current = null;
    }
  }, [input, compareOn, secondBook, ctx, teachMode, language]);

  return (
    <aside className={`w-full sm:w-[26rem] shrink-0 border-l border-border/50 bg-card/60 backdrop-blur flex flex-col h-full overflow-hidden ${hideHeader ? 'border-l-0 sm:w-full' : ''}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="h-10 px-3 flex items-center justify-between border-b border-border/50 shrink-0">
          <span className="text-xs uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Reading Companion
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Language + Teaching mode (shared) */}
      <div className="px-3 py-2 border-b border-border/50 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mr-1">Mode</span>
          {COMPANION_MODES.map(m => (
            <button key={m.id} onClick={() => setTeachMode(m.id)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-poppins transition-colors ${
                teachMode === m.id ? 'bg-primary/20 border border-primary/50 text-primary' : 'border border-border/50 text-muted-foreground hover:text-foreground'
              }`}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest mr-1">Language</span>
          {LIBRARY_LANGUAGES.map(l => (
            <button key={l.id} onClick={() => setLanguage(l.id)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-poppins transition-colors ${
                language === l.id ? 'bg-accent/20 border border-accent/50 text-accent' : 'border border-border/50 text-muted-foreground hover:text-foreground'
              }`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/50 overflow-x-auto shrink-0">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[3.2rem] py-2 flex flex-col items-center gap-0.5 text-[10px] font-poppins border-b-2 transition-colors ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === 'tutor' && <LibraryAITutorTab ctx={ctx} language={language} secondBook={secondBook} />}
        {tab === 'hub' && <LibraryStudyCompanionTab ctx={ctx} language={language} />}

        {tab === 'ask' && (
          <>
            {secondBook && (
              <div className="px-3 py-2 border-b border-border/50 shrink-0">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={compareOn} onChange={e => setCompareOn(e.target.checked)} />
                  <BookOpen className="h-3.5 w-3.5" />
                  Compare with "{secondBook.title}"
                </label>
              </div>
            )}
            <div className="flex-1 overflow-auto p-3 space-y-3">
              {msgs.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Ask me anything about page {ctx.currentPage} of "{ctx.bookTitle}". I read the page so I can explain, translate, or quiz you on it.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map(p => (
                      <button key={p} onClick={() => send(p)} className="px-2 py-1 rounded-full border border-border/60 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/40">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, idx) => (
                <div key={m.id} className={`rounded-xl p-2.5 ${m.role === 'user' ? 'bg-primary/10 border border-primary/20' : 'bg-background/50 border border-border/50'}`}>
                  {m.role === 'assistant' && (
                    <div className="flex items-center justify-between text-[10px] text-accent font-mono mb-1">
                      <span>🤖 Companion</span>
                      {m.content && (
                        <button
                          onClick={async () => {
                            const { insertLibraryNote } = await import('./libraryNotesStore');
                            await insertLibraryNote({
                              content_item_id: ctx.contentItemId ?? null,
                              page: ctx.currentPage,
                              kind: 'ai',
                              title: `AI Tutor Note (Page ${ctx.currentPage})`,
                              text: m.content,
                              color: '#a78bfa',
                            });
                            toast.success('Saved AI explanation to Notepad!');
                          }}
                          className="hover:underline flex items-center gap-1 text-primary"
                        >
                          <StickyNote className="h-3 w-3" /> Save to Notepad
                        </button>
                      )}
                    </div>
                  )}
                  {m.content
                    ? (m.role === 'assistant' ? <Markdown text={m.content} /> : <span className="text-sm whitespace-pre-wrap">{m.content}</span>)
                    : <span className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-3 w-3 animate-spin" /> Thinking…</span>}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-2 border-t border-border/50 flex gap-2 items-end shrink-0">
              <textarea ref={taRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                disabled={busy} rows={1} placeholder="Ask about this page…"
                className="flex-1 bg-background/60 border border-border rounded-lg p-2 text-sm focus:border-primary outline-none resize-none max-h-20" />
              {busy
                ? <button onClick={() => abortRef.current?.abort()} className="px-2.5 py-2 rounded-lg border border-destructive/50 text-destructive text-sm">⏹</button>
                : <button onClick={() => send()} disabled={!input.trim()} className="px-2.5 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40"><Send className="h-4 w-4" /></button>}
            </div>
          </>
        )}

        {tab === 'summary'    && <LibrarySummaryTab ctx={ctx} language={language} />}
        {tab === 'formula'    && <LibraryFormulaTab ctx={ctx} language={language} />}
        {tab === 'flashcards' && <LibraryFlashcardsTab ctx={ctx} language={language} />}
        {tab === 'quiz'       && <LibraryQuizTab ctx={ctx} language={language} />}
        {tab === 'notes'      && (
          <LibraryNotesTab
            ctx={ctx}
            language={language}
            onAskAITutor={(prompt) => {
              setTab('ask');
              send(prompt);
            }}
          />
        )}
      </div>
    </aside>
  );
}

