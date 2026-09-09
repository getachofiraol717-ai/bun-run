import React from 'react';
import { Eye, Headphones, BookOpen, Wrench, Sparkles, HelpCircle, Layers, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LearningStyle } from '../models/LearningStyle';

export interface StyleOption {
  id: LearningStyle | string;
  label: string;
  icon: typeof Eye;
  badge: string;
  description: string;
  hint: string;
  color: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'visual',
    label: 'Visual Learner',
    icon: Eye,
    badge: 'Diagrams & Mindmaps',
    description: 'Diagrams, spatial visual descriptions & color-coded concepts',
    hint: 'Emphasizes visual cues, diagrams, and mental spatial imagery.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'auditory',
    label: 'Auditory & Rhythm',
    icon: Headphones,
    badge: 'Mnemonics & Rhymes',
    description: 'Verbal rhythms, audio-style breakdown & memorable mnemonics',
    hint: 'Uses conversational flow, verbal mnemonics and rhythm.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'reading_writing',
    label: 'Structured Notes',
    icon: BookOpen,
    badge: 'Bullet & Formula Sheets',
    description: 'Clean definitions, structured bullet points & copyable text',
    hint: 'Provides precise definitions and structured note outlines.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'hands_on',
    label: 'Hands-On & Practical',
    icon: Wrench,
    badge: 'Real-world Experiments',
    description: 'Physical analogies, mini experiments & actionable steps',
    hint: 'Connects concepts to real-world objects and practical experiments.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'mixed',
    label: 'Socratic & Analogical',
    icon: HelpCircle,
    badge: 'Guided Inquiry',
    description: 'Probing questions, story-driven analogies & deep intuition',
    hint: 'Guides through thought-provoking questions and story analogies.',
    color: 'from-violet-500 to-indigo-600',
  },
];

export interface StyleCarouselProps {
  selectedStyle?: LearningStyle | string;
  onSelectStyle?: (style: LearningStyle | string) => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const StyleCarousel: React.FC<StyleCarouselProps> = ({
  selectedStyle = 'visual',
  onSelectStyle,
  title = 'Adaptive Learning Style',
  subtitle = 'Choose how you want your AI Tutor to explain concepts',
  className = '',
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const activeOption = STYLE_OPTIONS.find((s) => s.id === selectedStyle) || STYLE_OPTIONS[0];

  return (
    <div className={`glass rounded-2xl p-4 border border-border/70 space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-orbitron text-xs font-bold text-foreground uppercase tracking-wider">
              {title}
            </h3>
            <p className="text-[11px] text-muted-foreground font-poppins">{subtitle}</p>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg glass hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg glass hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth"
      >
        {STYLE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedStyle === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onSelectStyle && onSelectStyle(option.id)}
              className={`min-w-[200px] max-w-[220px] shrink-0 text-left p-3.5 rounded-xl border transition-all duration-300 relative group flex flex-col justify-between h-[120px] ${
                isSelected
                  ? 'bg-primary/15 border-primary shadow-lg ring-1 ring-primary/40'
                  : 'glass-strong border-border/60 hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-r ${option.color} text-white shadow-sm`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    {option.badge}
                  </span>
                </div>

                <h4 className="font-orbitron text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                  {option.label}
                </h4>
                <p className="text-[10px] text-muted-foreground font-poppins line-clamp-2 mt-1 leading-tight">
                  {option.description}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Hint Banner */}
      {activeOption && (
        <div className="pt-2 border-t border-border/40 flex items-center gap-2 text-xs font-poppins text-muted-foreground bg-primary/5 p-2.5 rounded-xl border border-primary/20">
          <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            <strong className="text-foreground font-semibold">{activeOption.label}:</strong> {activeOption.hint}
          </span>
        </div>
      )}
    </div>
  );
};

export default StyleCarousel;
