import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import GalaxyBackground from '@/components/GalaxyBackground';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe, Lock, Star, Zap, ChevronRight, Play, Trophy,
  Map, ArrowLeft, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

interface Zone { id: string; name: string; description: string; icon: string; missions: number; }
interface World {
  id: string; subject: string; name: string; theme: string;
  description: string; emoji: string; color: string;
  zones: Zone[]; unlock_xp: number; is_active: boolean;
}
interface WorldProgress {
  world_id: string; zones_completed: number; missions_completed: number;
  total_xp_earned: number; last_zone_id: string | null;
}

const MISSION_NARRATIVES: Record<string, string[]> = {
  Biology: [
    "🧬 Commander, the DNA strands are unstable. Repair the double helix before the genome collapses!",
    "🦠 Hostile pathogens detected. Mobilize the immune response and eliminate the infection.",
    "🔬 The protein folding sequence is corrupted. Restore the molecular structure to save the organism.",
    "⚗️ A mutation has altered the genetic code. Identify the change and assess its impact.",
  ],
  Mathematics: [
    "∑ The equation gates won't open without solving the algebraic sequence. Find the unknown.",
    "📐 The bridge across the calculus rift requires computing the exact derivative. Proceed.",
    "🔢 The theorem fortress demands proof. Demonstrate the mathematical truth to gain entry.",
    "📊 Statistical anomalies detected. Apply regression analysis to identify the pattern.",
  ],
  Physics: [
    "⚡ The orbital reactor is failing. Apply Newton's laws to restore stable rotation.",
    "💡 Light is being scattered by unknown forces. Calculate the refraction angle.",
    "🌀 Gravity anomaly detected near the core. Use Einstein's field equations to navigate.",
    "⚛️ Quantum particles are in superposition. Collapse the wave function with the correct measurement.",
  ],
  Chemistry: [
    "🧪 The molecular bonds are breaking. Identify the compound and predict the reaction products.",
    "⚗️ The reaction has gone critical. Apply Le Chatelier's principle to restore equilibrium.",
    "🔥 Combustion analysis required. Calculate the empirical formula from the combustion data.",
    "🌡️ The phase transition is unpredictable. Apply thermodynamic principles to stabilize.",
  ],
  'Computer Science': [
    "💻 The algorithm is inefficient. Optimize the Big-O complexity before the system overloads.",
    "🌲 The data structure is corrupted. Rebalance the binary search tree to restore order.",
    "🤖 The AI model is biased. Identify the training error and correct the classification.",
    "🕸️ Network packets are being lost. Debug the routing protocol to restore connectivity.",
  ],
};

const DEFAULT_WORLDS: World[] = [
  {
    id: 'world_bio',
    subject: 'Biology',
    name: 'Biosphere Prime',
    theme: 'Emergent Life Systems',
    description: 'Explore cell structures, genetics, ecosystems, and human physiology in an interactive bio-grid.',
    emoji: '🌿',
    color: '#10b981',
    unlock_xp: 0,
    is_active: true,
    zones: [
      { id: 'zone_bio_1', name: 'Cellular Frontier', description: 'Master organelles and molecular biology', icon: '🧬', missions: 4 },
      { id: 'zone_bio_2', name: 'Genetics Nexus', description: 'DNA replication, transcription, and mutations', icon: '🔬', missions: 5 },
      { id: 'zone_bio_3', name: 'Ecosystem Sanctuary', description: 'Energy pyramids and food webs', icon: '🌍', missions: 4 },
    ]
  },
  {
    id: 'world_math',
    subject: 'Mathematics',
    name: 'Quantum Calculus',
    theme: 'Mathematical Multiverse',
    description: 'Conquer algebraic equations, geometry proofs, derivatives, and statistical regression.',
    emoji: '📐',
    color: '#3b82f6',
    unlock_xp: 0,
    is_active: true,
    zones: [
      { id: 'zone_math_1', name: 'Algebraic Citadel', description: 'Linear equations and polynomial factoring', icon: '∑', missions: 4 },
      { id: 'zone_math_2', name: 'Calculus Rift', description: 'Limits, derivatives, and integrals', icon: '♾️', missions: 5 },
      { id: 'zone_math_3', name: 'Probabilistic Void', description: 'Combinatorics and normal distribution', icon: '📊', missions: 4 },
    ]
  },
  {
    id: 'world_phys',
    subject: 'Physics',
    name: 'Aether Reactor',
    theme: 'Relativity & Mechanics',
    description: 'Navigate Newton laws, electromagnetism, wave optics, and quantum field equations.',
    emoji: '⚡',
    color: '#f59e0b',
    unlock_xp: 0,
    is_active: true,
    zones: [
      { id: 'zone_phys_1', name: 'Newtonian Core', description: 'Kinematics, forces, and momentum', icon: '⚙️', missions: 4 },
      { id: 'zone_phys_2', name: 'Electromagnetic Field', description: 'Circuits, magnetism, and induction', icon: '💡', missions: 5 },
      { id: 'zone_phys_3', name: 'Quantum Horizon', description: 'Wave-particle duality and special relativity', icon: '⚛️', missions: 4 },
    ]
  },
  {
    id: 'world_chem',
    subject: 'Chemistry',
    name: 'Alchemy Crucible',
    theme: 'Atomic & Molecular Bonding',
    description: 'Master stoichiometry, chemical equilibrium, organic synthesis, and thermodynamics.',
    emoji: '🧪',
    color: '#ec4899',
    unlock_xp: 0,
    is_active: true,
    zones: [
      { id: 'zone_chem_1', name: 'Periodic Matrix', description: 'Atomic structure and valence trends', icon: '⚛️', missions: 4 },
      { id: 'zone_chem_2', name: 'Reaction Crucible', description: 'Enthalpy, entropy, and equilibrium', icon: '🔥', missions: 5 },
      { id: 'zone_chem_3', name: 'Organic Synthesis', description: 'Functional groups and reaction mechanisms', icon: '⚗️', missions: 4 },
    ]
  },
  {
    id: 'world_cs',
    subject: 'Computer Science',
    name: 'Cyber Grid',
    theme: 'Algorithms & Neural Nets',
    description: 'Master data structures, graph theory, AI neural architectures, and system security.',
    emoji: '💻',
    color: '#8b5cf6',
    unlock_xp: 0,
    is_active: true,
    zones: [
      { id: 'zone_cs_1', name: 'Algorithmic Core', description: 'Sorting, searching, and time complexity', icon: '🌲', missions: 4 },
      { id: 'zone_cs_2', name: 'Neural Network Nexus', description: 'Deep learning layers and backpropagation', icon: '🤖', missions: 5 },
      { id: 'zone_cs_3', name: 'Cyber Defense Grid', description: 'Encryption, protocols, and security', icon: '🛡️', missions: 4 },
    ]
  }
];

const getNarratives = (subject: string) => MISSION_NARRATIVES[subject] || [
  `🌌 Mission briefing: Master ${subject} to unlock the next zone.`,
  `🚀 Challenge accepted. Demonstrate your ${subject} knowledge to proceed.`,
  `⭐ The ${subject} constellation awaits. Complete the mission to add your star.`,
];

const LearningWorlds = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [missionActive, setMissionActive] = useState(false);
  const [missionNarrative, setMissionNarrative] = useState('');

  const { data: worlds = [] } = useQuery<World[]>({
    queryKey: ['learning_worlds'],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any).from('learning_worlds').select('*').eq('is_active', true).order('unlock_xp');
        if (error || !data || data.length === 0) return DEFAULT_WORLDS;
        return (data || []).map((w: any) => ({ ...w, zones: typeof w.zones === 'string' ? JSON.parse(w.zones) : w.zones || [] }));
      } catch {
        return DEFAULT_WORLDS;
      }
    },
  });

  const { data: progress = [] } = useQuery<WorldProgress[]>({
    queryKey: ['world_progress', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('user_world_progress').select('*').eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
  });

  const userXP = (profile as any)?.xp ?? 0;

  const startMission = useMutation({
    mutationFn: async ({ worldId, zoneId }: { worldId: string; zoneId: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await (supabase as any).from('user_world_progress').upsert({
        user_id: user.id, world_id: worldId,
        last_zone_id: zoneId, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,world_id' });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['world_progress'] }); },
  });

  const getProgress = (worldId: string) => progress.find(p => p.world_id === worldId);
  const isUnlocked = (world: World) => (userXP >= world.unlock_xp);

  const handleEnterZone = (zone: Zone) => {
    if (!selectedWorld) return;
    setSelectedZone(zone);
    const narratives = getNarratives(selectedWorld.subject);
    setMissionNarrative(narratives[Math.floor(Math.random() * narratives.length)]);
    setMissionActive(true);
    startMission.mutate({ worldId: selectedWorld.id, zoneId: zone.id });
  };

  // ── World grid view ──────────────────────────────────────
  if (!selectedWorld) {
    return (
      <div className="min-h-screen relative pt-20 pb-10 px-4">
        <GalaxyBackground />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Globe className="h-8 w-8 text-primary" />
              <h1 className="font-orbitron text-3xl font-bold text-primary neon-text">Learning Worlds</h1>
            </div>
            <p className="text-muted-foreground font-poppins">Enter immersive subject worlds. Complete missions. Earn XP. Unlock the universe.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {worlds.map((world, i) => {
              const unlocked = isUnlocked(world);
              const prog = getProgress(world.id);
              const zonesTotal = world.zones.length;
              const zonesDone = prog?.zones_completed ?? 0;
              const pct = zonesTotal > 0 ? Math.round((zonesDone / zonesTotal) * 100) : 0;
              return (
                <button
                  key={world.id}
                  onClick={() => unlocked && setSelectedWorld(world)}
                  disabled={!unlocked}
                  className={`text-left glass-strong rounded-2xl p-5 border-2 transition-all duration-300 animate-slide-up hover:-translate-y-1
                    ${unlocked ? 'hover:shadow-lg cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  style={{ borderColor: `${world.color}40`, animationDelay: `${i * 0.08}s`,
                    boxShadow: unlocked ? `0 0 20px ${world.color}18` : 'none' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{world.emoji}</div>
                    {!unlocked && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-[10px] font-poppins text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" /> {world.unlock_xp} XP
                      </div>
                    )}
                    {unlocked && prog && pct > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-poppins" style={{ backgroundColor: `${world.color}20`, color: world.color }}>
                        <Trophy className="h-2.5 w-2.5" /> {pct}%
                      </div>
                    )}
                  </div>
                  <h3 className="font-orbitron text-base font-bold text-foreground mb-1">{world.name}</h3>
                  <p className="text-xs font-poppins text-muted-foreground mb-1">{world.subject}</p>
                  <p className="text-[11px] font-poppins text-muted-foreground/70 mb-3 line-clamp-2">{world.description}</p>
                  <div className="flex items-center gap-2 text-[10px] font-poppins text-muted-foreground mb-3">
                    <span>{world.zones.length} zones</span>
                    <span>•</span>
                    <span>{world.zones.reduce((s, z) => s + z.missions, 0)} missions</span>
                  </div>
                  {pct > 0 && (
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: world.color }} />
                    </div>
                  )}
                  {unlocked && pct === 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-poppins" style={{ color: world.color }}>
                      <Play className="h-3 w-3" /> Begin exploration
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Zone view inside a world ──────────────────────────────
  if (!missionActive) {
    const prog = getProgress(selectedWorld.id);
    return (
      <div className="min-h-screen relative pt-20 pb-10 px-4">
        <GalaxyBackground />
        <div className="max-w-3xl mx-auto relative z-10">
          <button onClick={() => setSelectedWorld(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-poppins mb-5 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Worlds
          </button>
          <div className="glass-strong rounded-2xl p-6 mb-6 animate-slide-up" style={{ borderColor: `${selectedWorld.color}40`, border: '2px solid', boxShadow: `0 0 30px ${selectedWorld.color}20` }}>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-5xl">{selectedWorld.emoji}</div>
              <div>
                <h2 className="font-orbitron text-2xl font-bold text-foreground">{selectedWorld.name}</h2>
                <p className="text-sm text-muted-foreground font-poppins">{selectedWorld.subject} · {selectedWorld.zones.length} zones</p>
              </div>
            </div>
            <p className="text-sm font-poppins text-muted-foreground mb-4">{selectedWorld.description}</p>
            {prog && (
              <div className="flex gap-4 text-xs font-poppins text-muted-foreground">
                <span className="flex items-center gap-1"><Map className="h-3 w-3" /> {prog.zones_completed} zones done</span>
                <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {prog.missions_completed} missions</span>
                <span className="flex items-center gap-1" style={{ color: selectedWorld.color }}><Star className="h-3 w-3" /> {prog.total_xp_earned} XP</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {selectedWorld.zones.map((zone, i) => {
              const isLastZone = prog?.last_zone_id === zone.id;
              return (
                <div key={zone.id} className={`glass rounded-2xl p-5 border transition-all animate-slide-up hover:scale-[1.01]`}
                  style={{ animationDelay: `${i * 0.1}s`, borderColor: isLastZone ? `${selectedWorld.color}60` : 'transparent' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{zone.icon}</div>
                      <div>
                        <h3 className="font-orbitron text-base font-bold text-foreground">{zone.name}</h3>
                        <p className="text-xs font-poppins text-muted-foreground mt-0.5">{zone.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] font-poppins text-muted-foreground">
                          <span>{zone.missions} missions</span>
                          {isLastZone && <span style={{ color: selectedWorld.color }}>← Last visited</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleEnterZone(zone)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold text-white transition-all hover:scale-105"
                      style={{ backgroundColor: selectedWorld.color, boxShadow: `0 0 12px ${selectedWorld.color}60` }}>
                      Enter <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Mission active view ────────────────────────────────────
  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <GalaxyBackground />
      <div className="max-w-2xl mx-auto relative z-10 animate-fade-in">
        <button onClick={() => { setMissionActive(false); setSelectedZone(null); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-poppins mb-5">
          <ArrowLeft className="h-4 w-4" /> Exit Mission
        </button>
        <div className="glass-strong rounded-2xl p-6 mb-5" style={{ border: `2px solid ${selectedWorld.color}40`, boxShadow: `0 0 40px ${selectedWorld.color}25` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">{selectedZone?.icon}</div>
            <div>
              <p className="text-[10px] font-poppins text-muted-foreground uppercase tracking-widest">Mission Briefing</p>
              <h2 className="font-orbitron text-xl font-bold" style={{ color: selectedWorld.color }}>{selectedZone?.name}</h2>
            </div>
          </div>
          <div className="glass rounded-xl p-4 mb-4 border" style={{ borderColor: `${selectedWorld.color}30` }}>
            <p className="font-poppins text-sm text-foreground leading-relaxed">{missionNarrative}</p>
          </div>
          <div className="flex gap-3">
            <Link
              to={`/quiz?subject=${encodeURIComponent(selectedWorld.subject)}&mission=true`}
              className="flex-1 py-3 rounded-xl text-center text-white font-orbitron text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              style={{ backgroundColor: selectedWorld.color, boxShadow: `0 0 16px ${selectedWorld.color}60` }}
              onClick={() => toast.success(`Mission started: ${selectedZone?.name}!`)}>
              <Zap className="h-4 w-4" /> Launch Quiz Mission
            </Link>
            <Link
              to={`/library?subject=${encodeURIComponent(selectedWorld.subject)}`}
              className="flex-1 py-3 rounded-xl text-center glass border font-orbitron text-sm font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              style={{ borderColor: `${selectedWorld.color}40`, color: selectedWorld.color }}>
              <BookOpen className="h-4 w-4" /> Subject Library
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[{ label: 'XP Reward', value: `+${selectedZone ? selectedZone.missions * 75 : 0}`, icon: Star },
            { label: 'Missions', value: selectedZone?.missions || 0, icon: Trophy },
            { label: 'World', value: selectedWorld.emoji, icon: Globe }].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-xl p-3 text-center">
              <Icon className="h-4 w-4 mx-auto mb-1" style={{ color: selectedWorld.color }} />
              <div className="font-orbitron text-sm font-bold text-foreground">{value}</div>
              <div className="text-[9px] text-muted-foreground font-poppins">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningWorlds;
