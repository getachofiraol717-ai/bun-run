import React from 'react';
import { Bot, Sparkles, Zap, Award, Flame, BookOpen, Volume2, VolumeX, SlidersHorizontal, RefreshCw } from 'lucide-react';
import type { ExplanationMode, StudentProfile } from '../models/StudentProfile';
import type { LearningStyle } from '../models/LearningStyle';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  progressPercent?: number;
  currentMode?: ExplanationMode;
  currentStyle?: LearningStyle;
  studentProfile?: Partial<StudentProfile>;
  isVoiceActive?: boolean;
  onToggleVoice?: () => void;
  onOpenSettings?: () => void;
  onResetSession?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "AI Tutor Engine v2",
  subtitle = "Interactive AI-Powered Personalized Learning",
  progressPercent = 45,
  currentMode = "standard",
  currentStyle = "visual",
  studentProfile,
  isVoiceActive = false,
  onToggleVoice,
  onOpenSettings,
  onResetSession,
  className = "",
}) => {
  return (
    <header className={`glass-strong rounded-2xl p-4 sm:p-5 border border-border/80 shadow-lg ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: AI Tutor identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-neon-cyan p-0.5 flex items-center justify-center shadow-md animate-pulse">
              <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-background"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron font-bold text-base sm:text-lg text-foreground tracking-wide flex items-center gap-2">
                {title}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold border border-primary/30">
                AI Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-poppins mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Controls & Badges */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {/* Streak or XP badge if profile provided */}
          {studentProfile && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-muted/40 border border-border/50 text-xs font-poppins">
              <span className="flex items-center gap-1 text-orange-400 font-semibold">
                <Flame className="h-3.5 w-3.5" /> 7d
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1 text-primary font-semibold">
                <Award className="h-3.5 w-3.5" /> {currentStyle}
              </span>
            </div>
          )}

          {/* Mode Pill */}
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 capitalize font-medium">
            {currentMode} Mode
          </span>

          {/* Voice Toggle */}
          {onToggleVoice && (
            <button
              onClick={onToggleVoice}
              className={`p-2 rounded-xl border transition-all ${
                isVoiceActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'glass text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted/40'
              }`}
              title={isVoiceActive ? 'Voice narration active' : 'Enable voice narration'}
            >
              {isVoiceActive ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}

          {/* Settings / Adjust */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl glass text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted/40 transition-all"
              title="Tutor Settings"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          )}

          {/* Reset Session */}
          {onResetSession && (
            <button
              onClick={onResetSession}
              className="p-2 rounded-xl glass text-muted-foreground hover:text-destructive border border-border/60 hover:bg-destructive/10 transition-all"
              title="Reset Conversation"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lesson Progress Bar */}
      {typeof progressPercent === 'number' && (
        <div className="mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center justify-between text-[11px] font-poppins text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Mastery & Lesson Progress
            </span>
            <span className="font-mono font-bold text-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-neon-cyan transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
