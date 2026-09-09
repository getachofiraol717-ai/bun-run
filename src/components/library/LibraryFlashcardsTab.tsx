import { useState, useEffect } from 'react';
import { Layers, Loader2, RefreshCw, ChevronLeft, ChevronRight, Check, X, Minus } from 'lucide-react';
import { libraryAiJSON } from './libraryAiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CompanionContext, Scope, Difficulty, SCOPE_LABELS, resolveScopeText } from './types';
import { toast } from 'sonner';

const db = supabase as any;

interface Flashcard {
  id?: string;
  front: string;
  back: string;
  difficulty: string;
  box?: number;
  ease?: number;
  next_review_at?: string;
}

// SM-2 lite: rating 1-4 → next interval
function sm2(card: Flashcard, rating: 1 | 2 | 3 | 4): { box: number; ease: number; next_review_at: string } {
  const ease = Math.max(1.3, Math.min(3, (card.ease ?? 2.5) + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02))));
  let box = card.box ?? 1;
  if (rating < 3) { box = 1; }
  else { box = Math.min(box + 1, 8); }
  const intervals = [0, 1, 3, 7, 14, 30, 60, 90, 180];
  const days = intervals[Math.min(box, intervals.length - 1)];
  const next = new Date(Date.now() + days * 86400000).toISOString();
  return { box, ease, next_review_at: next };
}

export default function LibraryFlashcardsTab({ ctx, language }: { ctx: CompanionContext; language: string }) {
  const { user } = useAuth();
  const [scope, setScope]         = useState<Scope>('page');
  const [difficulty, setDifficulty] = useState<Difficulty>('adaptive');
  const [count, setCount]         = useState(8);
  const [cards, setCards]         = useState<Flashcard[]>([]);
  const [dueCards, setDueCards]   = useState<Flashcard[]>([]);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [busy, setBusy]           = useState(false);
  const [view, setView]           = useState<'generate' | 'review'>('generate');

  useEffect(() => { if (user) loadDue(); }, [user, ctx.contentItemId]);

  const loadDue = async () => {
    if (!user) return;
    const { data } = await db.from('library_flashcards').select('*')
      .eq('user_id', user.id)
      .eq('content_item_id', ctx.contentItemId ?? '')
      .lte('next_review_at', new Date().toISOString());
    setDueCards(data ?? []);
  };

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const contextText = await resolveScopeText(ctx, scope);
      const res = await libraryAiJSON<{ flashcards: Flashcard[] }>({
        action: 'flashcards', count, difficulty, language, contextText, pageText: ctx.pageText,
        bookTitle: ctx.bookTitle, subject: ctx.subject, grade: ctx.grade,
      });
      const list = (res.flashcards ?? []).map(c => ({ ...c, box: 1, ease: 2.5, next_review_at: new Date().toISOString() }));
      setCards(list);
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  const saveAll = async () => {
    if (!user || !cards.length) return;
    const rows = cards.map(c => ({
      user_id: user.id,
      content_item_id: ctx.contentItemId ?? null,
      front: c.front, back: c.back, difficulty: c.difficulty,
      source: 'ai', box: 1, ease: 2.5, next_review_at: new Date().toISOString(),
    }));
    const { error } = await db.from('library_flashcards').insert(rows);
    if (error) toast.error(error.message);
    else { toast.success(`Saved ${rows.length} flashcards`); setCards([]); loadDue(); }
  };

  const rateCard = async (rating: 1 | 2 | 3 | 4) => {
    const card = dueCards[reviewIdx];
    if (!card?.id) return;
    const upd = sm2(card, rating);
    await db.from('library_flashcards').update(upd).eq('id', card.id);
    await db.from('library_flashcard_reviews').insert({ flashcard_id: card.id, user_id: user!.id, rating });
    const next = reviewIdx + 1;
    if (next >= dueCards.length) {
      toast.success('Review session complete! 🎉');
      setReviewMode(false); setReviewIdx(0); setFlipped(false); loadDue();
    } else {
      setReviewIdx(next); setFlipped(false);
    }
  };

  const RATE_BUTTONS: { rating: 1 | 2 | 3 | 4; label: string; color: string; icon: any }[] = [
    { rating: 1, label: 'Again',  color: 'text-destructive border-destructive/40',   icon: X },
    { rating: 2, label: 'Hard',   color: 'text-orange-400 border-orange-400/40',      icon: Minus },
    { rating: 3, label: 'Good',   color: 'text-primary border-primary/40',            icon: Check },
    { rating: 4, label: 'Easy',   color: 'text-green-400 border-green-400/40',        icon: ChevronRight },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border/50 shrink-0">
        {(['generate','review'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className={`flex-1 py-2 text-xs font-poppins capitalize border-b-2 ${view === v ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
            {v === 'review' ? `Review${dueCards.length > 0 ? ` (${dueCards.length})` : ''}` : 'Generate'}
          </button>
        ))}
      </div>

      {view === 'generate' ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Controls */}
          <div className="p-3 border-b border-border/50 space-y-2 shrink-0">
            <div className="flex gap-1.5">
              {(['page','chapter','book'] as Scope[]).map(s => (
                <button key={s} onClick={() => setScope(s)} className={`flex-1 py-1 rounded text-xs font-poppins border ${scope === s ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>{SCOPE_LABELS[s]}</button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(['easy','medium','hard','adaptive'] as Difficulty[]).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-1 rounded text-[10px] font-poppins border capitalize ${difficulty === d ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground'}`}>{d}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Cards:</span>
              {[5,8,12,20].map(n => (
                <button key={n} onClick={() => setCount(n)} className={`px-2 py-1 rounded text-xs border ${count === n ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>{n}</button>
              ))}
            </div>
            <button onClick={generate} disabled={busy} className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-poppins flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
              {busy ? 'Generating…' : 'Generate Flashcards'}
            </button>
          </div>

          {/* Card list */}
          <div className="flex-1 overflow-auto p-2 space-y-1.5">
            {cards.length === 0 && <p className="text-sm text-muted-foreground p-2">Generate flashcards from page, chapter, or book content. Then save them to review later with spaced repetition.</p>}
            {cards.map((c, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-background/50 p-2.5 text-sm">
                <p className="font-medium">{c.front}</p>
                <p className="text-muted-foreground mt-1 text-xs border-t border-border/30 pt-1">{c.back}</p>
                <span className={`text-[10px] mt-1 inline-block capitalize ${c.difficulty === 'hard' ? 'text-destructive' : c.difficulty === 'easy' ? 'text-green-400' : 'text-muted-foreground'}`}>{c.difficulty}</span>
              </div>
            ))}
          </div>

          {cards.length > 0 && (
            <div className="p-2 border-t border-border/50 shrink-0">
              <button onClick={saveAll} className="w-full py-1.5 rounded-lg border border-accent/40 text-accent text-sm flex items-center justify-center gap-2 hover:bg-accent/10">
                <Check className="h-3.5 w-3.5" /> Save All {cards.length} Cards
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Review mode */
        <div className="flex flex-col h-full items-center justify-center p-4">
          {dueCards.length === 0 ? (
            <div className="text-center space-y-2">
              <p className="text-3xl">🎉</p>
              <p className="font-semibold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground">No cards due for review. Generate more cards or come back later.</p>
              <button onClick={loadDue} className="mt-2 px-3 py-1.5 rounded-lg border border-border text-sm flex items-center gap-1.5 mx-auto"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
            </div>
          ) : reviewMode ? (
            <div className="w-full max-w-sm space-y-4">
              <div className="text-xs text-muted-foreground text-center">{reviewIdx + 1} / {dueCards.length}</div>
              {/* Card */}
              <div onClick={() => setFlipped(p => !p)} className="min-h-[10rem] rounded-2xl border border-border/60 bg-background/50 p-6 cursor-pointer flex flex-col items-center justify-center text-center gap-3">
                <p className={`font-semibold ${flipped ? 'text-muted-foreground text-sm' : 'text-foreground'}`}>{dueCards[reviewIdx].front}</p>
                {flipped && <><div className="w-full border-t border-border/40" /><p className="text-primary">{dueCards[reviewIdx].back}</p></>}
                {!flipped && <p className="text-[11px] text-muted-foreground">Tap to reveal answer</p>}
              </div>
              {/* Rating buttons */}
              {flipped && (
                <div className="grid grid-cols-4 gap-1.5">
                  {RATE_BUTTONS.map(({ rating, label, color, icon: Icon }) => (
                    <button key={rating} onClick={() => rateCard(rating)}
                      className={`py-2 rounded-lg border text-xs font-poppins flex flex-col items-center gap-1 ${color} hover:bg-white/5`}>
                      <Icon className="h-3.5 w-3.5" />{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-primary">{dueCards.length}</div>
              <p className="text-sm text-muted-foreground">cards due for review</p>
              <button onClick={() => { setReviewMode(true); setReviewIdx(0); setFlipped(false); }} className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-poppins">Start Review →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
