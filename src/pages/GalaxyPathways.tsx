import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import GalaxyBackground from '@/components/GalaxyBackground';
import { Map, Rocket, Star, ChevronRight, Zap, BookOpen, Trophy, ArrowRight } from 'lucide-react';

interface Pathway {
  id: string; name: string; description: string; emoji: string;
  color: string; target_audience: string; subject_sequence: string[];
  estimated_weeks: number;
}

const DEFAULT_PATHWAYS: Pathway[] = [
  {
    id: 'path_stem',
    name: 'STEM Pioneer Circuit',
    description: 'A comprehensive journey through Physics, Mathematics, Chemistry, and Computer Science.',
    emoji: '🌌',
    color: '#3b82f6',
    target_audience: 'fast_learner',
    subject_sequence: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science'],
    estimated_weeks: 12,
  },
  {
    id: 'path_exam',
    name: 'National Exam Sprint (Grades 9–12)',
    description: 'Targeted preparation for national Ethiopian matriculation exams across all key academic subjects.',
    emoji: '🏆',
    color: '#f59e0b',
    target_audience: 'exam_survival',
    subject_sequence: ['Mathematics', 'Physics', 'Biology', 'English', 'Chemistry'],
    estimated_weeks: 8,
  },
  {
    id: 'path_ai_mastery',
    name: 'AI & Computational Science',
    description: 'Master discrete mathematics, algorithmic problem solving, machine learning, and AI logic.',
    emoji: '🤖',
    color: '#8b5cf6',
    target_audience: 'mastery',
    subject_sequence: ['Mathematics', 'Computer Science', 'Physics'],
    estimated_weeks: 10,
  },
  {
    id: 'path_foundations',
    name: 'General Knowledge Explorer',
    description: 'Build robust foundational thinking across core natural sciences and language arts.',
    emoji: '🌱',
    color: '#10b981',
    target_audience: 'beginner',
    subject_sequence: ['Biology', 'Mathematics', 'Chemistry', 'English'],
    estimated_weeks: 6,
  },
];

const AUDIENCE_LABELS: Record<string, { label: string; desc: string }> = {
  beginner:      { label: 'Beginner',      desc: 'Start from zero, build strong fundamentals' },
  fast_learner:  { label: 'Fast Learner',  desc: 'Accelerated path for motivated students' },
  exam_survival: { label: 'Exam Prep',     desc: 'Focused preparation for national exams' },
  research:      { label: 'Research',      desc: 'Deep academic exploration' },
  mastery:       { label: 'Mastery',       desc: 'Complete domain mastery from foundations to expert' },
};

const GalaxyPathways = () => {
  useAuth(); // future use
  const [selected, setSelected] = useState<Pathway | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const { data: pathways = [] } = useQuery<Pathway[]>({
    queryKey: ['learning_pathways'],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('learning_pathways').select('*').eq('is_active', true);
        if (error || !data || data.length === 0) return DEFAULT_PATHWAYS;
        return (data || []).map((p: any) => ({
          ...p,
          subject_sequence: typeof p.subject_sequence === 'string'
            ? JSON.parse(p.subject_sequence) : p.subject_sequence || [],
        }));
      } catch {
        return DEFAULT_PATHWAYS;
      }
    },
  });

  const handleEnroll = () => {
    setEnrolling(true);
    setTimeout(() => {
      setEnrolling(false);
      setSelected(null);
    }, 1400);
  };

  // ── Pathway detail ─────────────────────────────────────────
  if (selected) {
    const info = AUDIENCE_LABELS[selected.target_audience] ?? { label: selected.target_audience, desc: '' };
    return (
      <div className="min-h-screen relative pt-20 pb-10 px-4">
        <GalaxyBackground />
        <div className="max-w-2xl mx-auto relative z-10 animate-fade-in">
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-poppins mb-5 transition-colors">
            ← Back to Pathways
          </button>

          {/* Header card */}
          <div className="glass-strong rounded-2xl p-6 mb-5 border-2"
            style={{ borderColor: `${selected.color}40`, boxShadow: `0 0 30px ${selected.color}18` }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{selected.emoji}</div>
              <div>
                <h2 className="font-orbitron text-2xl font-bold text-foreground">{selected.name}</h2>
                <p className="text-sm font-poppins mt-0.5" style={{ color: selected.color }}>{info.label} · {selected.estimated_weeks} weeks</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-poppins mb-4">{selected.description}</p>
            <div className="flex gap-3 text-xs font-poppins text-muted-foreground">
              <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {selected.subject_sequence.length} subjects</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400" /> +{selected.subject_sequence.length * 500} XP</span>
              <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-primary" /> Certificate on completion</span>
            </div>
          </div>

          {/* Subject sequence as cosmic road */}
          <div className="glass rounded-2xl p-5 mb-5">
            <h3 className="font-orbitron text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" /> Learning Sequence
            </h3>
            <div className="space-y-3">
              {selected.subject_sequence.map((subj, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-orbitron text-xs font-bold border-2"
                      style={{ borderColor: selected.color, color: selected.color, backgroundColor: `${selected.color}15` }}>
                      {i + 1}
                    </div>
                    {i < selected.subject_sequence.length - 1 && (
                      <div className="w-0.5 h-4 mt-1" style={{ backgroundColor: `${selected.color}40` }} />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="font-poppins text-sm font-semibold text-foreground">{subj}</p>
                      <p className="text-[10px] text-muted-foreground font-poppins">~{Math.ceil(selected.estimated_weeks / selected.subject_sequence.length * 7)} days</p>
                    </div>
                    <Link to={`/library?subject=${encodeURIComponent(subj)}`}
                      className="flex items-center gap-1 text-[10px] font-poppins hover:underline transition-all"
                      style={{ color: selected.color }}>
                      Study <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enroll button */}
          <button onClick={handleEnroll} disabled={enrolling}
            className="w-full py-4 rounded-2xl text-white font-orbitron text-base font-bold hover:scale-[1.02] transition-all disabled:opacity-70 flex items-center justify-center gap-3"
            style={{ backgroundColor: selected.color, boxShadow: `0 0 24px ${selected.color}60` }}>
            {enrolling ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Launching pathway...
              </>
            ) : (
              <><Rocket className="h-5 w-5" /> Start This Pathway</>
            )}
          </button>
          {enrolling && (
            <div className="mt-3 text-center text-sm font-poppins text-primary animate-pulse">
              🌌 Your cosmic learning route is being configured...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Pathway grid ───────────────────────────────────────────
  return (
    <div className="min-h-screen relative pt-20 pb-10 px-4">
      <GalaxyBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="font-orbitron text-3xl font-bold text-primary neon-text flex items-center justify-center gap-3 mb-2">
            <Map className="h-8 w-8" /> Galaxy Pathways
          </h1>
          <p className="text-muted-foreground font-poppins">Choose your learning route. The AI adapts it as you grow.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pathways.map((path, i) => {
            const info = AUDIENCE_LABELS[path.target_audience] ?? { label: path.target_audience, desc: '' };
            return (
              <button key={path.id} onClick={() => setSelected(path)}
                className="text-left glass-strong rounded-2xl p-5 border-2 hover:-translate-y-2 transition-all duration-300 animate-slide-up"
                style={{ borderColor: `${path.color}35`, animationDelay: `${i * 0.08}s`, boxShadow: `0 0 20px ${path.color}12` }}>
                <div className="text-4xl mb-3">{path.emoji}</div>
                <h3 className="font-orbitron text-base font-bold text-foreground mb-1">{path.name}</h3>
                <p className="text-[10px] font-poppins px-2 py-0.5 rounded-full inline-block mb-2"
                  style={{ backgroundColor: `${path.color}20`, color: path.color }}>
                  {info.label}
                </p>
                <p className="text-xs text-muted-foreground font-poppins mb-3 line-clamp-2">{path.description}</p>
                <div className="flex items-center justify-between text-[10px] font-poppins text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {path.subject_sequence.length} subjects</span>
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {path.estimated_weeks}w</span>
                  <span className="flex items-center gap-1" style={{ color: path.color }}>
                    Explore <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GalaxyPathways;
