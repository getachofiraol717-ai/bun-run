import React from 'react';
import { Sparkles, Brain, Cpu, Zap, ArrowRight, BookOpen, Layers } from 'lucide-react';
import margeosAiTutorImg from '@/assets/images/margeos_ai_tutor_1786932415849.jpg';

interface MargeOSTutorCardProps {
  onSelectTopic?: (topic: string) => void;
  className?: string;
}

export const MargeOSTutorCard: React.FC<MargeOSTutorCardProps> = ({
  onSelectTopic,
  className = '',
}) => {
  return (
    <div
      id="margeos-ai-tutor-banner-card"
      className={`relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-card/95 via-background/90 to-primary/10 p-4 sm:p-5 shadow-xl backdrop-blur-md group hover:border-cyan-500/50 transition-all ${className}`}
    >
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-5">
        {/* Holographic Thumbnail */}
        <div className="relative w-full md:w-60 h-36 rounded-xl overflow-hidden shrink-0 border border-cyan-500/40 shadow-md">
          <img
            id="margeos-ai-tutor-img"
            src={margeosAiTutorImg}
            alt="MargeOS AI Tutor Engine"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-cyan-300">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3 text-cyan-400" /> MargeOS Engine v2
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 font-semibold">Active</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 text-left w-full">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-orbitron font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Autonomous Knowledge Pipeline
            </span>
            <span className="text-[11px] text-muted-foreground font-poppins hidden sm:inline">
              Embedding Search · Formula Solvers · Mind Maps
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold font-orbitron text-foreground">
            MargeOS AI Tutor & Cognitive Synthesizer
          </h3>

          <p className="text-xs text-muted-foreground font-poppins line-clamp-2">
            Multi-engine orchestration across 16 subsystems. Automatically generates curriculum roadmap modules, adaptive quiz items, formula derivations, and persistent memory vault embeddings.
          </p>

          <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => onSelectTopic?.('Calculus & Derivatives')}
              className="px-2.5 py-1 rounded-lg glass border border-border/70 text-muted-foreground hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1"
            >
              <Zap className="h-3 w-3 text-yellow-400" /> Calculus
            </button>
            <button
              onClick={() => onSelectTopic?.('Quantum Physics')}
              className="px-2.5 py-1 rounded-lg glass border border-border/70 text-muted-foreground hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1"
            >
              <Layers className="h-3 w-3 text-blue-400" /> Physics
            </button>
            <button
              onClick={() => onSelectTopic?.('Organic Chemistry')}
              className="px-2.5 py-1 rounded-lg glass border border-border/70 text-muted-foreground hover:text-cyan-300 hover:border-cyan-500/40 transition-colors flex items-center gap-1"
            >
              <BookOpen className="h-3 w-3 text-emerald-400" /> Chemistry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MargeOSTutorCard;
