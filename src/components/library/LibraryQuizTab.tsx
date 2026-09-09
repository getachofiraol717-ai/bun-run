import { useState } from 'react';
import { ListChecks, Loader2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import { libraryAiJSON } from './libraryAiClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CompanionContext, Scope, Difficulty, SCOPE_LABELS, resolveScopeText } from './types';
import { toast } from 'sonner';

interface Question {
  type: 'mcq' | 'true_false' | 'fill_blank' | 'essay' | 'formula';
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

type QuizView = 'config' | 'quiz' | 'results';
const QTYPES = ['mcq','true_false','fill_blank','essay','formula'] as const;
const QTYPE_LABELS: Record<string, string> = { mcq:'Multiple Choice', true_false:'True / False', fill_blank:'Fill in Blank', essay:'Essay', formula:'Formula' };

export default function LibraryQuizTab({ ctx, language }: { ctx: CompanionContext; language: string }) {
  const { user } = useAuth();
  const [scope, setScope]       = useState<Scope>('page');
  const [difficulty, setDifficulty] = useState<Difficulty>('adaptive');
  const [count, setCount]       = useState(5);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['mcq','true_false']));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers]   = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [view, setView]         = useState<QuizView>('config');
  const [expandedExp, setExpandedExp] = useState<Set<number>>(new Set());

  const toggleType = (t: string) => setSelectedTypes(p => { const n = new Set(p); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const generate = async () => {
    if (busy || !selectedTypes.size) { toast.error('Select at least one question type'); return; }
    setBusy(true);
    try {
      const contextText = await resolveScopeText(ctx, scope);
      const res = await libraryAiJSON<{ questions: Question[] }>({
        action: 'quiz', count, difficulty, language, scope,
        questionTypes: Array.from(selectedTypes),
        contextText, pageText: ctx.pageText, bookTitle: ctx.bookTitle, subject: ctx.subject, grade: ctx.grade,
      });
      const list = res.questions ?? [];
      if (!list.length) { toast.error('Could not generate questions. Try a different page.'); setBusy(false); return; }
      setQuestions(list); setAnswers({}); setSubmitted(false); setExpandedExp(new Set()); setView('quiz');
    } catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  const score = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      const given = (answers[i] ?? '').trim().toLowerCase();
      const expected = String(q.answer).trim().toLowerCase();
      if (q.type === 'mcq' || q.type === 'true_false') { if (given === expected || given.startsWith(expected.charAt(0))) correct++; }
      else if (q.type === 'fill_blank') { if (given.includes(expected.slice(0, 8))) correct++; }
      else correct += 0; // essay/formula: manual grading
    });
    return correct;
  };

  const submit = async () => {
    setSubmitted(true);
    setExpandedExp(new Set(questions.map((_, i) => i)));
    const sc = score();
    const total = questions.filter(q => q.type !== 'essay').length;
    if (user && ctx.contentItemId) {
      const details = questions.map((q, i) => ({
        question: q.question, type: q.type,
        correct: String(q.answer).toLowerCase(), given: (answers[i] ?? ''),
        explanation: q.explanation ?? '',
      }));
      await (supabase as any).from('library_quiz_results').insert({
        user_id: user.id, content_item_id: ctx.contentItemId,
        scope, score: sc, total, details,
      });
    }
    setView('results');
  };

  const isCorrect = (q: Question, idx: number): boolean | null => {
    if (!submitted) return null;
    const given = (answers[idx] ?? '').trim().toLowerCase();
    const expected = String(q.answer).trim().toLowerCase();
    if (q.type === 'essay') return null;
    if (q.type === 'formula') return null;
    if (q.type === 'fill_blank') return given.includes(expected.slice(0, 8));
    return given === expected || given.startsWith(expected.charAt(0));
  };

  if (view === 'results') {
    const sc = score();
    const autograded = questions.filter(q => q.type !== 'essay' && q.type !== 'formula').length;
    const pct = autograded ? Math.round((sc / autograded) * 100) : 0;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border/50 text-center shrink-0">
          <div className="text-4xl font-bold text-primary">{pct}%</div>
          <div className="text-sm text-muted-foreground mt-1">{sc}/{autograded} auto-graded correct</div>
          {questions.some(q => q.type === 'essay' || q.type === 'formula') && <div className="text-xs text-muted-foreground">Essay & formula questions shown with model answers</div>}
          <button onClick={() => setView('config')} className="mt-3 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm">Try Again</button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {questions.map((q, idx) => {
            const correct = isCorrect(q, idx);
            return (
              <div key={idx} className={`rounded-xl border p-2.5 text-sm ${correct === true ? 'border-green-500/30 bg-green-500/5' : correct === false ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-background/50'}`}>
                <div className="flex items-start gap-2">
                  {correct === true && <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />}
                  {correct === false && <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                  {correct === null && <span className="text-[10px] text-accent font-mono mt-0.5">ℹ</span>}
                  <div className="flex-1">
                    <p className="font-medium">{q.question}</p>
                    <p className="text-muted-foreground text-xs mt-1">Your answer: {answers[idx] || '(blank)'}</p>
                    <p className={`text-xs mt-0.5 ${correct === false ? 'text-green-400' : 'text-muted-foreground'}`}>Correct: {q.answer}</p>
                    {q.explanation && <p className="text-xs text-muted-foreground mt-1 border-t border-border/30 pt-1">{q.explanation}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'quiz') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-3 py-2 border-b border-border/50 shrink-0 flex items-center justify-between">
          <span className="text-sm font-semibold">{questions.length} questions · {SCOPE_LABELS[scope]}</span>
          <button onClick={() => setView('config')} className="text-xs text-muted-foreground hover:text-primary">← Back</button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-3">
          {questions.map((q, idx) => {
            const correct = isCorrect(q, idx);
            return (
              <div key={idx} className={`rounded-xl border p-3 ${correct === true ? 'border-green-500/30' : correct === false ? 'border-destructive/30' : 'border-border/50 bg-background/50'}`}>
                <p className="text-sm font-medium mb-2"><span className="text-muted-foreground mr-1">{idx+1}.</span>{q.question}</p>

                {q.type === 'mcq' && (q.options ?? []).map((opt, oi) => {
                  const optKey = String.fromCharCode(65 + oi);
                  const selected = answers[idx] === optKey;
                  const isCorrectOpt = submitted && optKey.toLowerCase() === String(q.answer).charAt(0).toLowerCase();
                  return (
                    <label key={oi} className={`flex items-center gap-2 text-sm py-1 px-2 rounded cursor-pointer ${selected ? 'bg-primary/15' : ''} ${isCorrectOpt && submitted ? 'text-green-400' : ''} ${submitted ? 'cursor-default' : 'hover:bg-muted/30'}`}>
                      <input type="radio" name={`q-${idx}`} value={optKey} checked={selected} disabled={submitted} onChange={() => setAnswers(p => ({ ...p, [idx]: optKey }))} />
                      <span className="font-mono text-xs text-muted-foreground">{optKey}.</span> {opt}
                    </label>
                  );
                })}

                {q.type === 'true_false' && ['True','False'].map(opt => {
                  const selected = answers[idx] === opt.toLowerCase();
                  return (
                    <label key={opt} className={`flex items-center gap-2 text-sm py-1 px-2 rounded cursor-pointer ${selected ? 'bg-primary/15' : ''} ${submitted ? 'cursor-default' : 'hover:bg-muted/30'}`}>
                      <input type="radio" name={`q-${idx}`} value={opt.toLowerCase()} checked={selected} disabled={submitted} onChange={() => setAnswers(p => ({ ...p, [idx]: opt.toLowerCase() }))} />
                      {opt}
                    </label>
                  );
                })}

                {(q.type === 'fill_blank' || q.type === 'formula' || q.type === 'essay') && (
                  <textarea value={answers[idx] ?? ''} disabled={submitted} onChange={e => setAnswers(p => ({ ...p, [idx]: e.target.value }))}
                    rows={q.type === 'essay' ? 4 : 2} placeholder={q.type === 'essay' ? 'Write your answer…' : 'Fill in the blank…'}
                    className="w-full bg-background/60 border border-border rounded-lg p-2 text-sm focus:border-primary outline-none resize-none mt-1" />
                )}

                {submitted && q.explanation && (
                  <button onClick={() => setExpandedExp(p => { const n = new Set(p); n.has(idx) ? n.delete(idx) : n.add(idx); return n; })} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1">
                    {expandedExp.has(idx) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} Explanation
                  </button>
                )}
                {submitted && expandedExp.has(idx) && q.explanation && (
                  <p className="text-xs text-muted-foreground mt-1 bg-muted/20 rounded p-2">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
        {!submitted && (
          <div className="p-2 border-t border-border/50 shrink-0">
            <button onClick={submit} className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-poppins">Submit Answers</button>
          </div>
        )}
      </div>
    );
  }

  // Config view
  return (
    <div className="flex flex-col h-full overflow-hidden p-3 space-y-3">
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Scope</div>
        <div className="flex gap-1.5">
          {(['page','chapter','book'] as Scope[]).map(s => (
            <button key={s} onClick={() => setScope(s)} className={`flex-1 py-1.5 rounded text-xs font-poppins border ${scope === s ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>{SCOPE_LABELS[s]}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Question Types</div>
        <div className="flex flex-wrap gap-1.5">
          {QTYPES.map(t => (
            <button key={t} onClick={() => toggleType(t)} className={`px-2 py-1 rounded text-xs font-poppins border ${selectedTypes.has(t) ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>{QTYPE_LABELS[t]}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Difficulty</div>
        <div className="flex gap-1.5">
          {(['easy','medium','hard','adaptive'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-1 rounded text-[10px] font-poppins border capitalize ${difficulty === d ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground'}`}>{d}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Number of questions</div>
        <div className="flex gap-1.5">
          {[3,5,10,15].map(n => (
            <button key={n} onClick={() => setCount(n)} className={`flex-1 py-1.5 rounded text-xs border font-poppins ${count === n ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}>{n}</button>
          ))}
        </div>
      </div>
      <button onClick={generate} disabled={busy} className="w-full py-2 rounded-xl bg-primary text-primary-foreground font-poppins flex items-center justify-center gap-2 disabled:opacity-50 mt-auto">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
        {busy ? 'Generating quiz…' : 'Generate Quiz'}
      </button>
    </div>
  );
}
