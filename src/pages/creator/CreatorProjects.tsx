import { useEffect, useMemo, useState } from 'react';
import CreatorLayout from './CreatorLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { aiStream } from './aiClient';
import { KanbanSquare, Plus, Sparkles, Loader2, Trash2, Calendar, AlertTriangle, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const db = supabase as any;
const COLUMNS = [
  { key: 'todo',  label: 'To-do',  accent: 'border-muted-foreground/30' },
  { key: 'doing', label: 'Doing',  accent: 'border-accent/40' },
  { key: 'done',  label: 'Done',   accent: 'border-primary/40' },
] as const;

type Task = { id: string; title: string; status: string; milestone?: string; due_at?: string | null };

const isOverdue = (t: Task) => t.due_at && t.status !== 'done' && new Date(t.due_at) < new Date();
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;

export default function CreatorProjects() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [milestone, setMilestone] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [riskBusy, setRiskBusy] = useState(false);
  const [riskReport, setRiskReport] = useState('');
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!user) return;
    const { data } = await db.from('creator_tasks').select('*').eq('user_id', user.id).order('sort_order').order('created_at');
    setTasks(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const add = async (preset?: { title: string; milestone?: string; due_at?: string | null }) => {
    if (!user) return;
    const t = preset?.title ?? title.trim();
    if (!t) return;
    const payload = {
      user_id: user.id,
      title: t,
      status: 'todo',
      milestone: preset?.milestone ?? milestone.trim(),
      due_at: preset?.due_at ?? (dueAt ? new Date(dueAt).toISOString() : null),
    };
    const { data } = await db.from('creator_tasks').insert(payload).select().single();
    if (data) setTasks(prev => [...prev, data]);
    if (!preset) { setTitle(''); setDueAt(''); }
  };

  const move = async (task: Task, status: string) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t));
    await db.from('creator_tasks').update({ status }).eq('id', task.id);
  };

  const del = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await db.from('creator_tasks').delete().eq('id', id);
  };

  const updateDue = async (task: Task, value: string) => {
    const due_at = value ? new Date(value).toISOString() : null;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, due_at } : t));
    await db.from('creator_tasks').update({ due_at }).eq('id', task.id);
  };

  // ── AI: break a goal into tasks (existing) ─────────────────────────
  const aiPlan = async () => {
    if (!aiPrompt.trim() || !user) return;
    setBusy(true);
    let full = '';
    try {
      full = await aiStream({
        mode: 'study_planner',
        messages: [{ role: 'user', content: `Break this project goal into 5-10 concrete tasks. Return ONLY a JSON array like ["task 1","task 2"]. Goal: ${aiPrompt}` }],
      });
    } catch (e: any) { toast.error(e.message); setBusy(false); return; }
    const m = full.match(/\[[\s\S]*\]/);
    if (m) {
      try {
        const arr: string[] = JSON.parse(m[0]);
        for (const t of arr) await add({ title: t, milestone: aiPrompt.slice(0, 60) });
        toast.success(`Added ${arr.length} tasks`);
      } catch { toast.error('Could not parse AI plan'); }
    } else toast.error('AI did not return a list');
    setAiPrompt('');
    setBusy(false);
  };

  // ── AI: risk analysis + recommended next tasks ─────────────────────
  const analyzeRisks = async () => {
    if (tasks.length === 0) { toast.error('Add some tasks first'); return; }
    setRiskBusy(true); setRiskReport('');
    const now = new Date().toISOString();
    const summary = tasks.map(t =>
      `- [${t.status}] "${t.title}"${t.milestone ? ` (milestone: ${t.milestone})` : ''}${t.due_at ? ` — due ${fmtDate(t.due_at)}${isOverdue(t) ? ' [OVERDUE]' : ''}` : ' — no deadline'}`
    ).join('\n');
    try {
      await aiStream({
        mode: 'expert',
        messages: [{ role: 'user', content:
`You are a project manager AI. Today is ${new Date().toDateString()}. Here is the current task board:

${summary}

Give a short report with three sections:
1. ⚠️ Risks — overdue items, bottlenecks, milestones at risk (be specific, reference task names)
2. 🎯 Recommended next 3 tasks — what to work on next and why
3. 📅 Suggested deadlines — for tasks missing due dates, suggest realistic ones

Keep it concise and actionable.` }],
        onToken: t => setRiskReport(prev => prev + t),
      });
    } catch (e: any) { toast.error(e.message); }
    setRiskBusy(false);
  };

  // ── Group tasks by milestone for the summary view ──────────────────
  const milestones = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const key = t.milestone?.trim() || '(No milestone)';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).map(([name, ts]) => {
      const done = ts.filter(t => t.status === 'done').length;
      const dueDates = ts.map(t => t.due_at).filter(Boolean) as string[];
      const latestDue = dueDates.length ? dueDates.sort().slice(-1)[0] : null;
      const overdueCount = ts.filter(isOverdue).length;
      return { name, tasks: ts, done, total: ts.length, latestDue, overdueCount };
    });
  }, [tasks]);

  const toggleMilestone = (name: string) => {
    setCollapsedMilestones(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const overdueTotal = tasks.filter(isOverdue).length;

  return (
    <CreatorLayout>
      <div className="flex items-center gap-2 text-primary text-sm font-poppins"><KanbanSquare className="h-4 w-4" /> Project Manager</div>
      <h1 className="font-orbitron text-3xl text-primary neon-text mb-2">Plan. Track. Ship.</h1>
      {overdueTotal > 0 && (
        <div className="mb-4 flex items-center gap-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> {overdueTotal} task{overdueTotal > 1 ? 's' : ''} overdue
        </div>
      )}

      {/* ── Add task + AI plan ── */}
      <div className="grid md:grid-cols-2 gap-3 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex flex-wrap gap-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add a task…"
            className="flex-1 min-w-[140px] bg-background/60 border border-border rounded p-2 text-sm focus:border-primary outline-none" />
          <input value={milestone} onChange={e => setMilestone(e.target.value)} placeholder="Milestone (optional)"
            className="w-32 bg-background/60 border border-border rounded p-2 text-sm focus:border-primary outline-none" />
          <input type="date" value={dueAt} onChange={e => setDueAt(e.target.value)}
            className="bg-background/60 border border-border rounded p-2 text-sm focus:border-primary outline-none" />
          <button className="px-3 rounded bg-primary text-primary-foreground text-sm inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button>
        </form>
        <div className="flex gap-2">
          <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. Launch a science blog"
            className="flex-1 bg-background/60 border border-accent/30 rounded p-2 text-sm focus:border-accent outline-none" />
          <button onClick={aiPlan} disabled={busy} className="px-3 rounded border border-accent/40 text-accent text-sm inline-flex items-center gap-1 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} AI plan
          </button>
        </div>
      </div>

      {/* ── Milestones overview ── */}
      {milestones.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-card/30 backdrop-blur p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Milestones
            </div>
            <button onClick={analyzeRisks} disabled={riskBusy}
              className="px-2 py-1 rounded border border-accent/40 text-accent text-xs inline-flex items-center gap-1.5 hover:bg-accent/10 disabled:opacity-50">
              {riskBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Risk Analysis
            </button>
          </div>
          <div className="space-y-1.5">
            {milestones.map(m => {
              const collapsed = collapsedMilestones.has(m.name);
              const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
              return (
                <div key={m.name}>
                  <button onClick={() => toggleMilestone(m.name)} className="w-full flex items-center gap-2 text-left py-1.5 px-2 rounded hover:bg-muted/20">
                    {collapsed ? <ChevronRight className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-sm flex-1">{m.name}</span>
                    {m.overdueCount > 0 && (
                      <span className="text-[10px] text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {m.overdueCount} overdue</span>
                    )}
                    {m.latestDue && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(m.latestDue)}</span>}
                    <span className="text-[10px] text-muted-foreground">{m.done}/{m.total}</span>
                    <div className="w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── AI risk report ── */}
      {riskReport && (
        <div className="mb-6 p-4 rounded-2xl border border-accent/30 bg-accent/5 text-sm whitespace-pre-wrap">
          <div className="text-[10px] text-accent mb-2 font-mono flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> AI Risk Analysis & Recommendations</div>
          {riskReport}
        </div>
      )}

      {/* ── Kanban board ── */}
      <div className="grid md:grid-cols-3 gap-4">
        {COLUMNS.map(col => (
          <div key={col.key} className={`rounded-2xl border ${col.accent} bg-card/30 backdrop-blur p-3 min-h-[300px]`}
            onDragOver={e => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData('text/task');
              const t = tasks.find(x => x.id === id);
              if (t) move(t, col.key);
            }}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">{col.label} · {tasks.filter(t => t.status === col.key).length}</div>
            <div className="space-y-2">
              {tasks.filter(t => t.status === col.key).map(t => (
                <div key={t.id} draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/task', t.id)}
                  className={`group rounded-lg border bg-background/50 p-3 cursor-grab text-sm ${isOverdue(t) ? 'border-destructive/50' : 'border-border/60'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">{t.title}</div>
                    <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 text-destructive shrink-0"><Trash2 className="h-3 w-3" /></button>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    {t.milestone ? <div className="text-[10px] text-muted-foreground truncate">{t.milestone}</div> : <div />}
                    <input
                      type="date"
                      value={t.due_at ? t.due_at.slice(0,10) : ''}
                      onChange={e => updateDue(t, e.target.value)}
                      className={`text-[10px] bg-transparent border rounded px-1 py-0.5 outline-none cursor-pointer ${
                        isOverdue(t) ? 'border-destructive/50 text-destructive' : 'border-border/40 text-muted-foreground'
                      }`}
                    />
                  </div>
                  {isOverdue(t) && (
                    <div className="text-[10px] text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</div>
                  )}
                </div>
              ))}
              {tasks.filter(t => t.status === col.key).length === 0 && (
                <div className="text-xs text-muted-foreground/60 italic px-1">Drop tasks here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </CreatorLayout>
  );
}
