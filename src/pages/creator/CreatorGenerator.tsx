import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorLayout from './CreatorLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { aiStream } from './aiClient';
import { parseProjectManifest } from './projectParser';
import { Sparkles, Loader2, Rocket, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

const db = supabase as any;

const EXAMPLES = [
  'A physics learning website with interactive simulations',
  'A quiz app about Ethiopian history with a scoreboard',
  'A personal portfolio with a contact form',
  'A landing page for an AI chatbot startup',
  'A pomodoro study timer with sound effects',
];

const SYSTEM_INSTR = `You are Knowledge Universe Project Generator. Given the user's idea, you MUST output ONLY a valid JSON object (no markdown surrounding text, no conversational banter) conforming strictly to this format:
{"name":"Project Name","description":"Short summary","files":[{"path":"index.html","content":"<!DOCTYPE html>..."},{"path":"style.css","content":"..."},{"path":"app.js","content":"..."},{"path":"README.md","content":"..."}]}

Rules:
- 3 to 8 files max.
- Use vanilla HTML/CSS/JS unless user requests another stack.
- index.html must reference style.css and app.js with relative paths.
- Make the design beautiful, modern, responsive, and functional.
- ALL file content must be valid JSON strings with properly escaped characters.`;

export default function CreatorGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [stream, setStream] = useState('');

  const generate = async () => {
    if (!prompt.trim()) return;
    setBusy(true); setStream('');
    let full = '';
    try {
      full = await aiStream({
        mode: 'coding',
        messages: [
          { role: 'system', content: SYSTEM_INSTR },
          { role: 'user', content: `Scaffold a complete, functional web project for: "${prompt}". Output ONLY the JSON object conforming to the schema.` },
        ],
        onToken: (t) => { setStream(s => s + t); },
      });
    } catch (e: any) {
      toast.error('AI error: ' + (e?.message || 'AI service unavailable'));
      setBusy(false);
      return;
    }

    let manifest: any = null;
    try {
      manifest = parseProjectManifest(full, 'AI Project', prompt.slice(0, 150));
    } catch (err: any) {
      toast.error(err?.message || 'Could not parse project structure. Please try again.');
      setBusy(false);
      return;
    }

    if (!manifest || !manifest.files || manifest.files.length === 0) {
      toast.error('The AI did not return valid project files. Please refine your prompt and try again.');
      setBusy(false);
      return;
    }

    let projObj: any = null;
    const projName = manifest.name || 'AI Project';

    if (user) {
      try {
        const { data: p, error } = await db.from('creator_projects').insert({
          user_id: user.id,
          name: projName,
          description: manifest.description || prompt.slice(0, 200),
          language: 'web', template: 'ai-generated',
        }).select().single();

        if (!error && p) {
          projObj = p;
          const files = (manifest.files || []).slice(0, 12).map((f: any) => ({
            project_id: p.id,
            path: String(f.path).replace(/^\/+/, ''),
            content: String(f.content || ''),
            language: 'plaintext',
          }));
          await db.from('creator_files').insert(files);
        }
      } catch (e) {
        console.warn('Supabase insert failed, fallback to local:', e);
      }
    }

    if (!projObj) {
      const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      projObj = {
        id,
        user_id: user?.id || 'guest_user',
        name: projName,
        description: manifest.description || prompt.slice(0, 200),
        language: 'web',
        template: 'ai-generated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Save project & files locally so Workspace can load it immediately
    try {
      const existingProjs = JSON.parse(localStorage.getItem('ku_creator_projects_local') || '[]');
      localStorage.setItem('ku_creator_projects_local', JSON.stringify([projObj, ...existingProjs.filter((x: any) => x.id !== projObj.id)]));

      const formattedFiles = (manifest.files || []).slice(0, 12).map((f: any, idx: number) => ({
        id: `f_${Date.now()}_${idx}`,
        path: String(f.path).replace(/^\/+/, ''),
        content: String(f.content || ''),
        language: 'plaintext',
      }));
      localStorage.setItem(`ku_creator_files_${projObj.id}`, JSON.stringify(formattedFiles));
    } catch { /* ignore */ }

    toast.success('Project generated!');
    setBusy(false);
    navigate(`/creator/workspace/${projObj.id}`);
  };

  return (
    <CreatorLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-accent text-sm font-poppins mb-2">
          <Wand2 className="h-4 w-4" /> AI Project Generator
        </div>
        <h1 className="font-orbitron text-3xl md:text-4xl text-primary neon-text mb-3">Describe it. We\u2019ll build it.</h1>
        <p className="text-muted-foreground mb-8">Type any idea. The AI will scaffold a real, editable project in your workspace.</p>

        <div className="rounded-2xl border border-primary/30 bg-card/40 backdrop-blur p-5">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Build a physics learning website with interactive simulations and a quiz."
            rows={4}
            className="w-full bg-background/60 border border-border rounded-lg p-3 text-sm focus:border-primary outline-none resize-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map(e => (
              <button key={e} onClick={() => setPrompt(e)} className="text-xs px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40">
                {e}
              </button>
            ))}
          </div>
          <button disabled={busy || !prompt.trim()} onClick={generate}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-poppins neon-glow hover:brightness-110 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? 'Building your universe\u2026' : 'Generate Project'}
          </button>
        </div>

        {busy && (
          <div className="mt-6 rounded-xl border border-border/60 bg-card/30 p-4">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5"><Rocket className="h-3 w-3" /> Streaming</div>
            <pre className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap max-h-64 overflow-auto">{stream}</pre>
          </div>
        )}
      </div>
    </CreatorLayout>
  );
}