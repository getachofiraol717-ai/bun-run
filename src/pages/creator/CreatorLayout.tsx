import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Rocket, Code2, Sparkles, GraduationCap, KanbanSquare, Store,
  FlaskConical, Users, Map, ChevronLeft,
} from 'lucide-react';

const items = [
  { to: '/creator',             label: 'Hub',         icon: Rocket,         end: true },
  { to: '/creator/workspace',   label: 'Workspace',   icon: Code2 },
  { to: '/creator/generator',   label: 'AI Generator',icon: Sparkles },
  { to: '/creator/academy',     label: 'Academy',     icon: GraduationCap },
  { to: '/creator/projects',    label: 'Projects',    icon: KanbanSquare },
  { to: '/creator/marketplace', label: 'Marketplace', icon: Store },
  { to: '/creator/lab',         label: 'Research Lab',icon: FlaskConical },
  { to: '/creator/collab',      label: 'Collab',      icon: Users },
  { to: '/creator/roadmap',     label: 'Roadmap',     icon: Map },
];

export default function CreatorLayout({ children, fullBleed = false }: { children: React.ReactNode; fullBleed?: boolean }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen min-h-[100dvh] pt-16 bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="flex flex-1 w-full max-w-[100vw] overflow-x-hidden">
        {/* Sidebar for Desktop / Laptop */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/50 bg-card/40 backdrop-blur-md min-h-[calc(100dvh-4rem)] sticky top-16">
          <div className="px-4 py-4 border-b border-border/50">
            <Link to="/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition">
              <ChevronLeft className="h-3.5 w-3.5" /> Back to KU
            </Link>
            <div className="mt-2 font-orbitron text-lg font-bold neon-text text-primary">Creator</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Ecosystem · Phase 5</div>
          </div>
          <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
            {items.map(({ to, label, icon: Icon, end }) => {
              const active = end ? loc.pathname === to : loc.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-poppins transition ${
                    active
                      ? 'bg-primary/15 text-primary neon-text border border-primary/30 font-medium'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="p-3 text-[10px] text-muted-foreground border-t border-border/50">
            🌌 Universal Responsive Canvas · All Devices
          </div>
        </aside>

        {/* Main Workspace / Content */}
        <main className={`flex-1 min-w-0 w-full ${fullBleed ? '' : 'p-3 sm:p-5 md:p-8 max-w-7xl mx-auto'}`}>
          {/* Mobile & Tablet Header Tab Strip */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 pt-1 -mx-2 px-2 no-scrollbar border-b border-border/40 bg-card/30">
            {items.map(({ to, label, icon: Icon, end }) => {
              const active = end ? loc.pathname === to : loc.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? 'border-primary/60 text-primary bg-primary/15 shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-card/60'
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}