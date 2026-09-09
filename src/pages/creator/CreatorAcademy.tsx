import { useEffect, useState } from 'react';
import CreatorLayout from './CreatorLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { aiStream } from './aiClient';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import { GraduationCap, Play, CheckCircle2, Loader2, Sparkles, Trophy, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { runInSandbox, formatSandboxOutput } from '@/plugins/margeos/sandboxRunner';

const db = supabase as any;

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  track: string;
  level: string;
  body_md: string;
  starter_code: string;
  language: string;
  xp: number;
};

export type LanguageRuntimeStatus = {
  supported: boolean;
  runtimeName: string;
  reason?: string;
};

/**
 * Honest language runtime auditor for browser environment.
 * JavaScript runs in an isolated, secure Web Worker sandbox with timeouts.
 * Other languages without in-browser runtimes are honestly disabled and labeled.
 */
export function getLanguageRuntimeStatus(language: string): LanguageRuntimeStatus {
  const norm = (language || '').toLowerCase().trim();
  if (norm === 'javascript' || norm === 'js') {
    return {
      supported: true,
      runtimeName: 'JavaScript (Web Worker Isolated Sandbox)',
    };
  }
  if (norm === 'python' || norm === 'py') {
    return {
      supported: false,
      runtimeName: 'Python 3',
      reason: 'Python execution runtime is unavailable in browser environment',
    };
  }
  if (norm === 'html' || norm === 'html5') {
    return {
      supported: false,
      runtimeName: 'HTML / Markup',
      reason: 'HTML markup preview only — script execution runtime disabled',
    };
  }
  if (norm === 'plaintext' || norm === 'text' || norm === 'prompt') {
    return {
      supported: false,
      runtimeName: 'Plain Text / AI Prompt',
      reason: 'Plaintext prompt does not require a code execution runtime',
    };
  }
  return {
    supported: false,
    runtimeName: language || 'Unknown',
    reason: `${language} runtime is currently unavailable`,
  };
}

export const DEFAULT_LESSONS: Lesson[] = [
  {
    id: 'lesson-js-1',
    slug: 'js-hello',
    title: 'Hello, JavaScript',
    track: 'web',
    level: 'beginner',
    body_md: '# Hello, JavaScript\n\nWrite your first line of code.\n\n**Task:** Use `console.log` to print `Hello, KU!`.',
    starter_code: 'console.log("Hello, KU!");\n',
    language: 'javascript',
    xp: 50,
  },
  {
    id: 'lesson-js-2',
    slug: 'js-variables',
    title: 'Variables & Types',
    track: 'web',
    level: 'beginner',
    body_md: '# Variables\n\nDeclare a variable `name` and log a greeting.',
    starter_code: 'const name = "Galaxy Builder";\nconsole.log("Hi", name);\n',
    language: 'javascript',
    xp: 75,
  },
  {
    id: 'lesson-html-1',
    slug: 'html-page',
    title: 'Your First Web Page',
    track: 'web',
    level: 'beginner',
    body_md: '# HTML basics\n\nBuild a page with an h1 and a p tag. Note: Direct script/code execution is disabled for static markup.',
    starter_code: '<!doctype html>\n<html><body>\n  <h1>My KU Page</h1>\n  <p>Built inside Knowledge Universe.</p>\n</body></html>\n',
    language: 'html',
    xp: 75,
  },
  {
    id: 'lesson-py-1',
    slug: 'py-hello',
    title: 'Python: Hello Universe',
    track: 'python',
    level: 'beginner',
    body_md: '# Python\n\nUse print() to greet the universe.\n\n*Note: Python execution runtime is currently not available in the browser client.*',
    starter_code: 'print("Hello, Universe!")\n',
    language: 'python',
    xp: 50,
  },
  {
    id: 'lesson-py-2',
    slug: 'py-loops',
    title: 'Python: Loops',
    track: 'python',
    level: 'beginner',
    body_md: '# Loops\n\nPrint numbers 1..5 using a for loop.\n\n*Note: Python execution runtime is currently not available in the browser client.*',
    starter_code: 'for i in range(1, 6):\n    print(i)\n',
    language: 'python',
    xp: 100,
  },
  {
    id: 'lesson-ai-1',
    slug: 'ai-prompt',
    title: 'AI Prompting 101',
    track: 'ai',
    level: 'beginner',
    body_md: '# Prompting\n\nLearn to craft effective prompts. Edit the prompt and click Ask AI.',
    starter_code: 'Explain recursion to a 12-year-old using a cosmic analogy.',
    language: 'plaintext',
    xp: 80,
  },
];

export default function CreatorAcademy() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>(DEFAULT_LESSONS);
  const [active, setActive] = useState<Lesson | null>(DEFAULT_LESSONS[0]);
  const [code, setCode] = useState(DEFAULT_LESSONS[0]?.starter_code || '');
  const [out, setOut] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHint, setAiHint] = useState('');
  const [progress, setProgress] = useState<Record<string, { status: string; xp_earned: number }>>({});
  const totalXp = Object.values(progress).reduce((s, p) => s + (p.xp_earned || 0), 0);

  useEffect(() => {
    db.from('creator_lessons').select('*').order('sort_order').then(({ data }: any) => {
      if (data && data.length > 0) {
        setLessons(data);
        setActive(data[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (active) {
      setCode(active.starter_code || '');
    }
    setOut('');
    setAiHint('');
  }, [active]);

  useEffect(() => {
    if (!user) return;
    db.from('creator_progress').select('*').eq('user_id', user.id).then(({ data }: any) => {
      const m: any = {};
      (data ?? []).forEach((p: any) => { m[p.lesson_id] = p; });
      setProgress(m);
    });
  }, [user]);

  const runtimeStatus = active ? getLanguageRuntimeStatus(active.language) : { supported: false, runtimeName: 'None' };

  const run = async () => {
    if (!active) return;

    if (!runtimeStatus.supported) {
      setOut(`⚠️ ${runtimeStatus.reason || 'Runtime unavailable for this language.'}`);
      return;
    }

    setIsRunning(true);
    setOut('');

    try {
      // Execute in isolated Web Worker with strict timeout & security isolation
      const result = await runInSandbox(code, { timeoutMs: 3000 });

      if (result.ok) {
        const formatted = formatSandboxOutput(result);
        setOut(formatted || '(Execution completed with no console output)');
      } else {
        const errorText = result.error || 'Execution error';
        const formattedLogs = result.logs.length > 0 ? formatSandboxOutput(result) + '\n' : '';
        setOut(`${formattedLogs}Error: ${errorText}`);
      }
    } catch (err: any) {
      setOut('Execution failed: ' + (err?.message || String(err)));
    } finally {
      setIsRunning(false);
    }
  };

  const complete = async () => {
    if (!user || !active) return;
    const payload = {
      user_id: user.id,
      lesson_id: active.id,
      status: 'completed',
      code,
      xp_earned: active.xp,
      completed_at: new Date().toISOString(),
    };
    await db.from('creator_progress').upsert(payload, { onConflict: 'user_id,lesson_id' });
    setProgress(p => ({ ...p, [active.id]: payload }));
    toast.success(`+${active.xp} XP ✨`);
  };

  const askHint = async () => {
    if (!active) return;
    setAiBusy(true);
    setAiHint('');
    try {
      await aiStream({
        mode: 'coding',
        messages: [{
          role: 'user',
          content: `I'm doing the lesson "${active.title}". My current code:\n\n\`\`\`${active.language}\n${code}\n\`\`\`\n\nGive me a small, encouraging hint to make progress — do NOT give the full solution.`,
        }],
        onToken: t => setAiHint(s => s + t),
      });
    } catch (e: any) {
      setAiHint('AI error: ' + (e?.message || 'Unable to fetch hint'));
    }
    setAiBusy(false);
  };

  return (
    <CreatorLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-primary text-sm font-poppins">
            <GraduationCap className="h-4 w-4" /> Programming Academy
          </div>
          <h1 className="font-orbitron text-3xl text-primary neon-text">Learn by building</h1>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="font-orbitron text-lg">{totalXp}</span>
          <span className="text-xs text-muted-foreground">XP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-1.5">
          {lessons.map(l => {
            const done = progress[l.id]?.status === 'completed';
            const langStatus = getLanguageRuntimeStatus(l.language);
            return (
              <button
                key={l.id}
                onClick={() => setActive(l)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  active?.id === l.id ? 'border-primary/50 bg-primary/10' : 'border-border/60 hover:border-primary/30 hover:bg-card/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />}
                  <span className="text-sm font-poppins">{l.title}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>{l.track} · {l.level}</span>
                  <span className={langStatus.supported ? 'text-primary font-medium' : 'text-muted-foreground/70'}>
                    +{l.xp} xp
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        {active && (
          <section className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{active.track} · {active.level}</div>
                <h2 className="font-orbitron text-2xl text-primary mt-1">{active.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full border ${
                  runtimeStatus.supported
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border/60 bg-muted/30 text-muted-foreground'
                }`}>
                  {runtimeStatus.runtimeName}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2">
              <div className="p-5 prose prose-invert prose-sm max-w-none border-b lg:border-b-0 lg:border-r border-border/50">
                <ReactMarkdown>{active.body_md}</ReactMarkdown>
              </div>

              <div className="flex flex-col">
                <div className="h-72">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={active.language === 'plaintext' ? 'markdown' : active.language}
                    value={code}
                    onChange={(v) => setCode(v ?? '')}
                    options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }}
                  />
                </div>

                {!runtimeStatus.supported && (
                  <div className="px-4 py-2 bg-muted/40 border-t border-border/50 text-xs text-muted-foreground flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{runtimeStatus.reason}</span>
                  </div>
                )}

                <div className="flex gap-2 p-3 border-t border-border/50 items-center">
                  {runtimeStatus.supported ? (
                    <button
                      type="button"
                      onClick={run}
                      disabled={isRunning}
                      className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm inline-flex items-center gap-1.5 hover:opacity-90 transition disabled:opacity-50"
                    >
                      {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      {isRunning ? 'Running...' : 'Run'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title={runtimeStatus.reason}
                      className="px-3 py-1.5 rounded bg-muted/50 text-muted-foreground text-sm inline-flex items-center gap-1.5 opacity-60 cursor-not-allowed border border-border/40"
                    >
                      <Play className="h-3.5 w-3.5" /> Run (Unavailable)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={askHint}
                    disabled={aiBusy}
                    className="px-3 py-1.5 rounded border border-accent/40 text-accent text-sm inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-accent/10 transition"
                  >
                    {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} AI Hint
                  </button>

                  <div className="flex-1" />

                  <button
                    type="button"
                    onClick={complete}
                    className="px-3 py-1.5 rounded border border-primary/40 text-primary text-sm inline-flex items-center gap-1.5 hover:bg-primary/10 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                  </button>
                </div>

                {out && (
                  <pre className="px-4 py-3 text-xs font-mono text-green-300 bg-black/50 border-t border-border/50 whitespace-pre-wrap max-h-32 overflow-auto">
                    {out}
                  </pre>
                )}

                {aiHint && (
                  <div className="px-4 py-3 text-xs text-accent bg-accent/5 border-t border-border/50 whitespace-pre-wrap max-h-40 overflow-auto">
                    💡 {aiHint}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </CreatorLayout>
  );
}
