import { useState, useRef } from 'react';
import { Loader2, FileText, Save, Check } from 'lucide-react';
import { Markdown } from './Markdown';
import { libraryAiStream } from './libraryAiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CompanionContext, Scope, SummaryLevel, SCOPE_LABELS, resolveScopeText } from './types';
import { toast } from 'sonner';

const LEVELS: { id: SummaryLevel; label: string; sub: string }[] = [
  { id: '30s',  label: '30-second', sub: 'Ultra-brief key idea' },
  { id: '5min', label: '5-minute',  sub: 'Key concepts & points' },
  { id: 'full', label: 'Full',      sub: 'Comprehensive coverage' },
];

import { insertLibraryNote } from './libraryNotesStore';

export default function LibrarySummaryTab({ ctx, language }: { ctx: CompanionContext; language: string }) {
  const { user } = useAuth();
  const [scope, setScope]     = useState<Scope>('page');
  const [level, setLevel]     = useState<SummaryLevel>('5min');
  const [output, setOutput]   = useState('');
  const [busy, setBusy]       = useState(false);
  const [saved, setSaved]     = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    if (busy) return;
    setOutput(''); setSaved(false); setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const contextText = await resolveScopeText(ctx, scope);
      await libraryAiStream(
        { action: 'summary', scope, summaryLevel: level, language, contextText, pageText: ctx.pageText, bookTitle: ctx.bookTitle, subject: ctx.subject, grade: ctx.grade },
        t => setOutput(p => p + t),
        { signal: controller.signal }
      );
    } catch (e: any) {
      if (e?.name !== 'AbortError') setOutput(p => p + `\n\n⚠️ ${e.message}`);
    } finally {
      setBusy(false); abortRef.current = null;
    }
  };

  const saveAsNote = async () => {
    if (!output) return;
    try {
      await insertLibraryNote({
        user_id: user?.id,
        content_item_id: ctx.contentItemId ?? null,
        page: ctx.currentPage,
        kind: 'ai',
        text: `### AI Summary (${SCOPE_LABELS[scope]}, ${level})\n\n${output}`,
      });
      setSaved(true);
      toast.success('Summary saved to your notes');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save summary note');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Controls */}
      <div className="p-3 border-b border-border/50 space-y-2 shrink-0">
        {/* Scope */}
        <div className="flex gap-1.5">
          {(['page','chapter','book'] as Scope[]).map(s => (
            <button key={s} onClick={() => setScope(s)}
              className={`flex-1 py-1 rounded text-xs font-poppins border ${scope === s ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-primary'}`}>
              {SCOPE_LABELS[s]}
            </button>
          ))}
        </div>
        {/* Level */}
        <div className="flex gap-1.5">
          {LEVELS.map(l => (
            <button key={l.id} onClick={() => setLevel(l.id)}
              className={`flex-1 py-1 rounded text-[10px] font-poppins border ${level === l.id ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground hover:text-accent'}`}>
              {l.label}
            </button>
          ))}
        </div>
        <button onClick={busy ? () => abortRef.current?.abort() : generate}
          className={`w-full py-1.5 rounded-lg text-sm font-poppins flex items-center justify-center gap-2 ${busy ? 'border border-destructive/50 text-destructive' : 'bg-primary text-primary-foreground hover:brightness-110'}`}>
          {busy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Stop</> : <><FileText className="h-3.5 w-3.5" /> Generate Summary</>}
        </button>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-auto p-3">
        {output
          ? <Markdown text={output} />
          : <p className="text-sm text-muted-foreground">Choose scope + depth, then click Generate Summary. The AI reads the {SCOPE_LABELS[scope].toLowerCase()} and produces structured study notes.</p>
        }
      </div>

      {/* Save button */}
      {output && !busy && (
        <div className="p-2 border-t border-border/50 shrink-0">
          <button onClick={saveAsNote} className="w-full py-1.5 rounded-lg border border-accent/40 text-accent text-sm flex items-center justify-center gap-2 hover:bg-accent/10">
            {saved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save to Notes</>}
          </button>
        </div>
      )}
    </div>
  );
}
