import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CreatorLayout from './CreatorLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Rocket, Code2, Sparkles, GraduationCap, KanbanSquare, Store, FlaskConical, Users, Map, Plus, ArrowRight } from 'lucide-react';

const db = supabase as any;

const tiles = [
  { to: '/creator/workspace',   icon: Code2,         title: 'Workspace',    desc: 'VS Code-style IDE with live preview', live: true },
  { to: '/creator/generator',   icon: Sparkles,      title: 'AI Generator', desc: 'Type an idea, get a real project',     live: true },
  { to: '/creator/academy',     icon: GraduationCap, title: 'Academy',      desc: 'Lessons, challenges, XP',              live: true },
  { to: '/creator/projects',    icon: KanbanSquare,  title: 'Projects',     desc: 'Kanban, tasks, milestones',            live: true },
  { to: '/creator/marketplace', icon: Store,         title: 'Marketplace',  desc: 'Browse & publish creations',           live: true },
  { to: '/creator/lab',         icon: FlaskConical,  title: 'Research Lab', desc: 'Notes, citations, AI research',        live: true },
  { to: '/creator/collab',      icon: Users,         title: 'Collab',       desc: 'Team workspaces',                       live: false },
  { to: '/creator/roadmap',     icon: Map,           title: 'Roadmap',      desc: 'What’s live · what’s next', live: true },
];

export default function CreatorHub() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, lessons: 0, xp: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    (async () => {
      try {
        const [{ count: p }, { count: l }, { data: prog }, { data: rec }] = await Promise.all([
          db.from('creator_projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          db.from('creator_lessons').select('id', { count: 'exact', head: true }),
          db.from('creator_progress').select('xp_earned').eq('user_id', user.id),
          db.from('creator_projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(4),
        ]);
        if (isMounted) {
          setStats({ projects: p ?? 0, lessons: l ?? 0, xp: (prog ?? []).reduce((s: number, r: any) => s + (r.xp_earned || 0), 0) });
          setRecent(rec ?? []);
        }
      } catch (err) {
        console.error('CreatorHub stats fetch error:', err);
      }
    })();
    return () => { isMounted = false; };
  }, [user]);

  return (
    <CreatorLayout>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-accent/10 p-8 md:p-12 mb-8">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-poppins text-primary mb-4">
            <Rocket className="h-3 w-3" /> Phase 5 · Creator Ecosystem
          </div>
          <h1 className="font-orbitron text-3xl md:text-5xl font-bold neon-text text-primary mb-3">
            Learn. Build. Launch.
          </h1>
          <p className="max-w-2xl text-muted-foreground md:text-lg">
            Knowledge Universe is no longer just a school — it’s your launchpad. Build websites, AI agents, games,
            research projects, and startups without ever leaving the platform.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/creator/workspace" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-poppins neon-glow hover:brightness-110 transition">
              <Plus className="h-4 w-4" /> Open Workspace
            </Link>
            <Link to="/creator/generator" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 font-poppins transition">
              <Sparkles className="h-4 w-4" /> Generate with AI
            </Link>
            <Link to="/creator/academy" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/40 font-poppins transition">
              <GraduationCap className="h-4 w-4" /> Start a Lesson
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Your projects', value: stats.projects, accent: 'from-primary/30 to-primary/5' },
          { label: 'Lessons available', value: stats.lessons, accent: 'from-accent/30 to-accent/5' },
          { label: 'Creator XP', value: stats.xp, accent: 'from-secondary/30 to-secondary/5' },
          { label: 'Marketplace installs', value: 0, accent: 'from-primary/30 to-accent/5' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-border/50 p-5 bg-gradient-to-br ${s.accent} backdrop-blur`}>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="mt-1 font-orbitron text-3xl text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tiles */}
      <h2 className="font-orbitron text-xl text-primary mb-4">Explore the ecosystem</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {tiles.map(({ to, icon: Icon, title, desc, live }) => (
          <Link
            key={to}
            to={to}
            className="group relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur p-5 hover:border-primary/50 hover:bg-card/70 transition overflow-hidden"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition" />
            <Icon className="h-7 w-7 text-primary mb-3" />
            <div className="flex items-center gap-2 mb-1">
              <div className="font-orbitron text-lg">{title}</div>
              {!live && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-accent/20 text-accent">soon</span>}
              {live && <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary">live</span>}
            </div>
            <div className="text-sm text-muted-foreground">{desc}</div>
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
          </Link>
        ))}
      </div>

      {/* Recent projects */}
      <h2 className="font-orbitron text-xl text-primary mb-4">Recent projects</h2>
      {recent.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          No projects yet. <Link to="/creator/workspace" className="text-primary underline">Create your first project</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recent.map((p) => (
            <Link key={p.id} to={`/creator/workspace/${p.id}`} className="rounded-xl border border-border/60 bg-card/40 p-4 hover:border-primary/40 transition">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{p.language}</div>
              <div className="font-orbitron text-lg mt-1">{p.name}</div>
              {p.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</div>}
            </Link>
          ))}
        </div>
      )}
    </CreatorLayout>
  );
}