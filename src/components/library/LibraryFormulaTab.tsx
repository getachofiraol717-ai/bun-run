import { useState } from 'react';
import { Sigma, Loader2, ChevronDown, ChevronRight, Save, Check } from 'lucide-react';
import { libraryAiJSON } from './libraryAiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CompanionContext } from './types';
import { toast } from 'sonner';

interface Formula {
  formula: string;
  name?: string;
  symbols: { symbol: string; meaning: string }[];
  explanation: string;
  example: string;
  practice: { question: string; answer: string }[];
}

import { insertLibraryNote } from './libraryNotesStore';

export default function LibraryFormulaTab({ ctx, language }: { ctx: CompanionContext; language: string }) {
  const { user } = useAuth();
  const [formulas, setFormulas]   = useState<Formula[]>([]);
  const [busy, setBusy]           = useState(false);
  const [expanded, setExpanded]   = useState<Set<number>>(new Set());
  const [savedIdx, setSavedIdx]   = useState<Set<number>>(new Set());

  const detect = async () => {
    if (busy || !ctx.pageText.trim()) { toast.error('No page text to scan. Make sure the PDF is loaded.'); return; }
    setBusy(true); setFormulas([]); setExpanded(new Set());
    try {
      const res = await libraryAiJSON<{ formulas: Formula[] }>({ action: 'formula', pageText: ctx.pageText, language });
      const list = res.formulas || [];
      setFormulas(list);
      if (list.length === 0) toast.info('No formulas detected on this page');
      else setExpanded(new Set(list.map((_, i) => i)));
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  const saveFormula = async (f: Formula, idx: number) => {
    const text = `### Formula: ${f.formula}${f.name ? ` — ${f.name}` : ''}\n\n**Symbols:** ${f.symbols.map(s => `${s.symbol} = ${s.meaning}`).join(', ')}\n\n**Explanation:** ${f.explanation}\n\n**Example:** ${f.example}\n\n**Practice:**\n${f.practice.map((p, i) => `${i+1}. ${p.question}\n   → ${p.answer}`).join('\n')}`;
    try {
      await insertLibraryNote({
        user_id: user?.id,
        content_item_id: ctx.contentItemId ?? null,
        page: ctx.currentPage,
        kind: 'ai',
        text,
      });
      setSavedIdx(p => new Set(p).add(idx));
      toast.success('Formula saved to notes');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save formula to notes');
    }
  };

  const toggle = (i: number) => setExpanded(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Detect button */}
      <div className="p-3 border-b border-border/50 shrink-0">
        <button onClick={detect} disabled={busy}
          className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-poppins flex items-center justify-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sigma className="h-3.5 w-3.5" />}
          {busy ? 'Scanning page…' : 'Detect Formulas on This Page'}
        </button>
        {formulas.length > 0 && <p className="text-[11px] text-muted-foreground mt-1.5 text-center">{formulas.length} formula{formulas.length !== 1 ? 's' : ''} found</p>}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {formulas.length === 0 && !busy && (
          <p className="text-sm text-muted-foreground p-2">
            The AI scans the current page for mathematical and scientific formulas, then explains every symbol, provides worked examples, and generates practice problems.
          </p>
        )}
        {formulas.map((f, idx) => (
          <div key={idx} className="rounded-xl border border-border/60 bg-background/50 overflow-hidden">
            {/* Formula header */}
            <button onClick={() => toggle(idx)} className="w-full flex items-center justify-between p-3 text-left">
              <div>
                <span className="font-mono text-primary font-bold text-base">{f.formula}</span>
                {f.name && <span className="text-xs text-muted-foreground ml-2">— {f.name}</span>}
              </div>
              <div className="flex items-center gap-2">
                {savedIdx.has(idx) && <Check className="h-3.5 w-3.5 text-green-400" />}
                {expanded.has(idx) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </button>

            {expanded.has(idx) && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/40">
                {/* Symbols */}
                {f.symbols.length > 0 && (
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Symbols</div>
                    <div className="flex flex-wrap gap-1.5">
                      {f.symbols.map((s, si) => (
                        <span key={si} className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                          <span className="font-mono text-primary font-bold">{s.symbol}</span>
                          <span className="text-muted-foreground ml-1">= {s.meaning}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Explanation</div>
                  <p className="text-sm text-foreground">{f.explanation}</p>
                </div>

                {/* Example */}
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Worked Example</div>
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-2 text-sm">{f.example}</div>
                </div>

                {/* Practice */}
                {f.practice.length > 0 && (
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Practice Problems</div>
                    {f.practice.map((p, pi) => (
                      <PracticeCard key={pi} question={p.question} answer={p.answer} />
                    ))}
                  </div>
                )}

                {/* Save */}
                <button onClick={() => saveFormula(f, idx)} disabled={savedIdx.has(idx)}
                  className="w-full py-1 rounded border border-accent/40 text-accent text-xs flex items-center justify-center gap-1.5 hover:bg-accent/10 disabled:opacity-50">
                  {savedIdx.has(idx) ? <><Check className="h-3 w-3" /> Saved</> : <><Save className="h-3 w-3" /> Save to Notes</>}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PracticeCard({ question, answer }: { question: string; answer: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-lg border border-border/50 p-2 mb-1.5 text-sm">
      <p className="font-medium mb-1">{question}</p>
      {show
        ? <p className="text-muted-foreground border-t border-border/30 pt-1 mt-1">→ {answer}</p>
        : <button onClick={() => setShow(true)} className="text-xs text-primary hover:underline">Show answer</button>
      }
    </div>
  );
}
