import React from 'react';
import { Sparkles, Brain, ArrowRight, Bot, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import libraryAiTutorImg from '@/assets/images/library_ai_tutor_1786932398236.jpg';

interface LibraryAITutorCardProps {
  onOpenCompanion?: () => void;
  className?: string;
}

export const LibraryAITutorCard: React.FC<LibraryAITutorCardProps> = ({
  onOpenCompanion,
  className = '',
}) => {
  return (
    <div
      id="library-ai-tutor-banner-card"
      className={`relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-background/95 via-card/90 to-background/90 p-1 shadow-2xl backdrop-blur-xl group hover:border-primary/50 transition-all duration-300 ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/30 transition-all" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 p-5 sm:p-6">
        {/* Left: Graphic Card Image with Holographic Overlay */}
        <div className="relative w-full lg:w-72 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0 border border-primary/30 shadow-lg group-hover:shadow-primary/20 transition-all">
          <img
            id="library-ai-tutor-img"
            src={libraryAiTutorImg}
            alt="AI Tutor for Library"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />
          
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-cyan-500/40 text-[11px] font-orbitron font-semibold text-cyan-300 flex items-center gap-1.5 shadow-md">
            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse" />
            <span>AI Sidekick Active</span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-xs font-poppins text-foreground/90 font-medium truncate">
            ✨ Real-time book explanations & quizzes
          </div>
        </div>

        {/* Right: Content & Action buttons */}
        <div className="flex-1 space-y-3 text-left w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold font-orbitron flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" />
              MargeOS Library AI Tutor Engine
            </span>
            <span className="text-xs text-muted-foreground font-poppins">
              Multi-Source Synthesis & Step-by-Step Guidance
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-foreground tracking-tight">
            Meet Your Personal Academic AI Tutor Engine
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground font-poppins line-clamp-2 max-w-2xl">
            Read any textbook, research paper, or guide with our AI Tutor Engine sitting beside you. Get instant summaries, step-by-step formula derivations, interactive diagrams, and custom practice quizzes tailored to your learning pace.
          </p>

          <div className="pt-2 flex items-center flex-wrap gap-3">
            {onOpenCompanion ? (
              <button
                id="goto-ai-tutor-btn"
                type="button"
                onClick={onOpenCompanion}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary via-cyan-500 to-blue-600 text-primary-foreground text-xs font-semibold font-poppins flex items-center gap-2 shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
              >
                <Brain className="h-4 w-4" />
                <span>Open MargeOS AI Tutor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                id="goto-ai-tutor-btn"
                to="/margeos"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary via-cyan-500 to-blue-600 text-primary-foreground text-xs font-semibold font-poppins flex items-center gap-2 shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all"
              >
                <Brain className="h-4 w-4" />
                <span>Launch MargeOS Engine</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            <Link
              id="goto-margeos-btn"
              to="/margeos"
              className="px-4 py-2 rounded-xl glass border border-primary/30 text-xs font-semibold font-poppins text-cyan-300 hover:bg-primary/20 flex items-center gap-1.5 transition-all"
            >
              <Compass className="h-4 w-4 text-cyan-400" />
              <span>Open MargeOS Subsystems</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryAITutorCard;
