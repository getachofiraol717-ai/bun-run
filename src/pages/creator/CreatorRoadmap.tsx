import CreatorLayout from './CreatorLayout';
import { Check, Clock, Sparkles } from 'lucide-react';

const live = [
  'VS Code-style Workspace (Monaco editor, file tree, tabs, autosave)',
  'Live HTML/CSS/JS preview (sandboxed iframe)',
  'In-browser JavaScript runner with console capture',
  'ZIP export & import (download any project, drop a .zip to open)',
  'AI Code Assistant (powered by KU AI Tutor in coding mode)',
  'AI Project Generator (prompt \u2192 multi-file scaffold)',
  'Programming Academy with XP & skill progress',
  'Project manager (Kanban: To-do / Doing / Done, milestones)',
  'Marketplace (publish, browse, install community projects)',
  'Research Lab (notes, citations, AI research mode)',
  'Cloud persistence (your projects sync across devices)',
];

const soon = [
  { name: 'Real Terminal Sandbox', why: 'Needs Docker/Firecracker micro-VMs. We\u2019re evaluating E2B / Daytona / StackBlitz WebContainers.' },
  { name: 'Python Runtime (Pyodide)', why: 'Lazy-loaded numpy/matplotlib. Coming in the next workspace update.' },
  { name: 'Git server & PRs', why: 'Will wire to GitHub via OAuth + the GitHub REST API.' },
  { name: 'One-Click Deploy', why: 'Vercel / Netlify / Cloudflare Pages integrations.' },
  { name: 'Real-time collaborative editing', why: 'Needs a Yjs websocket relay. Project chat works today.' },
  { name: 'Mobile App Builder (Flutter / React Native)', why: 'Requires native toolchains. Capacitor wrapper is already shipped.' },
  { name: 'Voice collab & AI meeting notes', why: 'WebRTC SFU + Whisper.' },
];

export default function CreatorRoadmap() {
  return (
    <CreatorLayout>
      <h1 className="font-orbitron text-3xl text-primary neon-text mb-2">Creator Roadmap</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Radical honesty: here\u2019s exactly what works today and what we\u2019re wiring up next. No fake terminals, no mocked deploys.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check className="h-5 w-5 text-primary" />
            <h2 className="font-orbitron text-xl text-primary">Live now</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {live.map((l) => (
              <li key={l} className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>{l}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-accent" />
            <h2 className="font-orbitron text-xl text-accent">Coming online</h2>
          </div>
          <ul className="space-y-3 text-sm">
            {soon.map((s) => (
              <li key={s.name}>
                <div className="font-poppins font-semibold">{s.name}</div>
                <div className="text-muted-foreground text-xs">{s.why}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </CreatorLayout>
  );
}