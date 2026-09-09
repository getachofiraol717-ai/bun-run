import { useEffect, useState } from 'react';
import CreatorLayout from './CreatorLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { aiStream } from './aiClient';
import { FlaskConical, Plus, Loader2, Sparkles, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const db = supabase as any;

export default function CreatorLab() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiOut, setAiOut] = useState('');

  const load = async () => {
    if (!user) return;
    const { data } = await db.from('research_notes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    setNotes(data ?? []);
  };
  useEffect(() => { load(); }, [user]);
  useEffect(() => { if (active) { setTitle(active.title); setBody(active.body); } }, [active]);

  const create = async () => {
    if (!user) return;
    const { data } = await db.from('research_notes').insert({ user_id: user.id, title: 'Untitled note', body: '' }).select().single();
    if (data) { setNotes(p => [data, ...p]); setActive(data); }
  };

  const save = async () => {
    if (!active) return;
    await db.from('research_notes').update({ title, body, updated_at: new Date().toISOString() }).eq('id', active.id);
    setNotes(p => p.map(n => n.id === active.id ? { ...n, title, body } : n));
    toast.success('Saved');
  };

  const del = async (id: string) => {
    await db.from('research_notes').delete().eq('id', id);
    setNotes(p => p.filter(n => n.id !== id));
    if (active?.id === id) setActive(null);
  };

  const research = async () => {
    if (!title.trim()) return toast.error('Add a topic first');
    setBusy(true); setAiOut('');
    try {
      await aiStream({
        mode: 'research',
        messages: [{ role: 'user', content: `Write a structured research brief about: ${title}. Include: introduction, core analysis with evidence, multiple perspectives, conclusion, and a list of 5 suggested citations (in APA format) at the end.` }],
        onToken: (t) => setAiOut(s => s + t),
      });
    } catch (e: any) { setAiOut('Error: ' + e.message); }
    setBusy(false);
  };

  const insert = () => { setBody(b => (b ? b + '\n\n' : '') + aiOut); toast.success('Inserted into note'); };

  return (
    <CreatorLayout>
      <div className="flex items-center gap-2 text-primary text-sm font-poppins"><FlaskConical className="h-4 w-4" /> Research & Innovation Lab</div>
      <h1 className="font-orbitron text-3xl text-primary neon-text mb-6">Think. Research. Cite.</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_1fr] gap-4">
        <aside className="space-y-1.5">
          <button onClick={create} className="w-full px-3 py-2 rounded-xl border border-primary/40 text-primary text-sm inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> New note</button>
          {notes.length === 0 && <div className="text-xs text-muted-foreground mt-3">No notes yet.</div>}
          {notes.map(n => (
            <div key={n.id} onClick={() => setActive(n)} className={`group rounded-xl px-3 py-2 cursor-pointer border ${active?.id === n.id ? 'border-primary/50 bg-primary/10' : 'border-border/60 hover:border-primary/30'}`}>
              <div className="flex items-start justify-between">
                <div className="text-sm truncate flex-1">{n.title || 'Untitled'}</div>
                <button onClick={(e) => { e.stopPropagation(); del(n.id); }} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-3 w-3" /></button>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.updated_at).toLocaleDateString()}</div>
            </div>
          ))}
        </aside>

        {active ? (
          <section className="rounded-2xl border border-border/60 bg-card/30 backdrop-blur p-4 flex flex-col">
            <input value={title} onChange={e => setTitle(e.target.value)} className="bg-transparent text-xl font-orbitron text-primary outline-none mb-3 border-b border-border/40 pb-2" />
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={20} placeholder="Write your research notes\u2026"
              className="flex-1 bg-background/40 border border-border rounded p-3 text-sm focus:border-primary outline-none resize-none" />
            <button onClick={save} className="mt-3 self-end px-4 py-1.5 rounded bg-primary text-primary-foreground text-sm">Save</button>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">
            Select a note or create a new one.
          </section>
        )}

        <section className="rounded-2xl border border-accent/30 bg-card/30 backdrop-blur p-4 flex flex-col">
          <div className="flex items-center gap-2 text-accent mb-2"><BookOpen className="h-4 w-4" /><span className="text-sm font-poppins">AI Research Assistant</span></div>
          <p className="text-xs text-muted-foreground mb-3">Type a topic in the note title, then click Research.</p>
          <button disabled={busy} onClick={research} className="w-full py-2 rounded bg-accent text-accent-foreground text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Research this topic
          </button>
          <div className="flex-1 mt-3 overflow-auto rounded bg-background/40 border border-border p-3 text-xs whitespace-pre-wrap min-h-[200px]">
            {aiOut || <span className="text-muted-foreground italic">AI output will stream here\u2026</span>}
          </div>
          {aiOut && <button onClick={insert} className="mt-2 text-xs text-primary hover:underline self-end">↳ Insert into note</button>}
        </section>
      </div>
    </CreatorLayout>
  );
}