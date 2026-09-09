import React, { useState, useRef, useCallback } from 'react';
import { Sliders, Sparkles, Split, Columns, Maximize2, RotateCcw, Check, ArrowRight } from 'lucide-react';

export interface CompareContent {
  title: string;
  badge: string;
  tagline?: string;
  content: string;
  accentColor?: string;
}

export interface CompareSliderProps {
  leftContent?: CompareContent;
  rightContent?: CompareContent;
  title?: string;
  subtitle?: string;
  className?: string;
}

const DEFAULT_LEFT: CompareContent = {
  title: "Simplified (ELI5) Explanation",
  badge: "Beginner Friendly",
  tagline: "Everyday analogies & simple language",
  content: `Imagine momentum like a heavy bowling ball vs a light ping-pong ball rolling down a hill.

• **Mass (m)** is how heavy the ball is.
• **Velocity (v)** is how fast it moves.

Even if a ping-pong ball moves fast, it's easy to stop because of low mass. But a slow-moving bowling ball is super hard to stop because it has huge **momentum** ($p = m \\cdot v$).`,
  accentColor: "from-cyan-500 to-blue-500",
};

const DEFAULT_RIGHT: CompareContent = {
  title: "Academic & Rigorous Formal Proof",
  badge: "Exam & Standard Syllabus",
  tagline: "Formal vector notation & differential definition",
  content: `In classical Newtonian mechanics, linear momentum $\\vec{p}$ is defined as the product of inertial mass and linear velocity:

$$\\vec{p} = m \\cdot \\vec{v}$$

Key Properties:
1. **Vector Quantity**: Points in the exact direction of velocity vector $\\vec{v}$.
2. **SI Units**: $\\text{kg}\\cdot\\text{m/s}$ or Newton-seconds ($\\text{N}\\cdot\\text{s}$).
3. **Conservation Principle**: In a closed system with no external net forces: $\\sum \\vec{p}_{initial} = \\sum \\vec{p}_{final}$.`,
  accentColor: "from-purple-500 to-pink-500",
};

export const CompareSlider: React.FC<CompareSliderProps> = ({
  leftContent = DEFAULT_LEFT,
  rightContent = DEFAULT_RIGHT,
  title = "Explanation Comparison Engine",
  subtitle = "Drag the slider to compare simplified intuition vs formal academic depth",
  className = "",
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
      setSliderPos(percentage);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) handleMove(e.touches[0].clientX);
  };

  return (
    <div className={`glass rounded-2xl p-4 sm:p-5 border border-border/80 space-y-4 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
              <Split className="h-4 w-4" />
            </div>
            <h3 className="font-orbitron text-sm font-bold text-foreground tracking-wide">
              {title}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground font-poppins mt-0.5">{subtitle}</p>
        </div>

        {/* Quick View Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Preset Buttons */}
          {viewMode === 'slider' && (
            <div className="flex items-center gap-1 glass p-1 rounded-xl text-[10px] font-mono">
              <button
                onClick={() => setSliderPos(25)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  Math.abs(sliderPos - 25) < 3 ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                25%
              </button>
              <button
                onClick={() => setSliderPos(50)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  Math.abs(sliderPos - 50) < 3 ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                50%
              </button>
              <button
                onClick={() => setSliderPos(75)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  Math.abs(sliderPos - 75) < 3 ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                75%
              </button>
            </div>
          )}

          {/* Toggle View Mode Button */}
          <button
            onClick={() => setViewMode((m) => (m === 'slider' ? 'side-by-side' : 'slider'))}
            className="px-3 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/70 text-foreground text-xs font-poppins font-medium flex items-center gap-1.5 border border-border/60 transition-colors"
          >
            {viewMode === 'slider' ? (
              <>
                <Columns className="h-3.5 w-3.5 text-primary" />
                <span>Side-by-Side</span>
              </>
            ) : (
              <>
                <Split className="h-3.5 w-3.5 text-primary" />
                <span>Split Slider</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comparison Area */}
      {viewMode === 'side-by-side' ? (
        /* Side by Side Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Panel */}
          <div className="glass-strong rounded-xl p-4 border border-cyan-500/30 relative flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
                  {leftContent.badge}
                </span>
                {leftContent.tagline && (
                  <span className="text-[10px] text-muted-foreground font-poppins">{leftContent.tagline}</span>
                )}
              </div>
              <h4 className="font-orbitron text-xs font-bold text-foreground mb-2">{leftContent.title}</h4>
              <div className="text-xs font-poppins text-foreground/90 whitespace-pre-line leading-relaxed">
                {leftContent.content}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="glass-strong rounded-xl p-4 border border-purple-500/30 relative flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">
                  {rightContent.badge}
                </span>
                {rightContent.tagline && (
                  <span className="text-[10px] text-muted-foreground font-poppins">{rightContent.tagline}</span>
                )}
              </div>
              <h4 className="font-orbitron text-xs font-bold text-foreground mb-2">{rightContent.title}</h4>
              <div className="text-xs font-poppins text-foreground/90 whitespace-pre-line leading-relaxed">
                {rightContent.content}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Split Slider */
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="relative w-full min-h-[220px] rounded-xl overflow-hidden select-none border border-border/80 bg-background/50 shadow-inner"
        >
          {/* Right Content (Base Layer) */}
          <div className="absolute inset-0 p-4 sm:p-5 bg-purple-950/20 text-foreground overflow-y-auto">
            <div className="max-w-md ml-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                  {rightContent.badge}
                </span>
              </div>
              <h4 className="font-orbitron text-xs font-bold text-purple-200 mb-2">{rightContent.title}</h4>
              <div className="text-xs font-poppins text-foreground/90 whitespace-pre-line leading-relaxed">
                {rightContent.content}
              </div>
            </div>
          </div>

          {/* Left Content (Clipped Layer) */}
          <div
            className="absolute inset-y-0 left-0 p-4 sm:p-5 bg-cyan-950/30 border-r border-cyan-400/40 text-foreground overflow-y-auto transition-none"
            style={{ width: `${sliderPos}%` }}
          >
            <div className="max-w-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  {leftContent.badge}
                </span>
              </div>
              <h4 className="font-orbitron text-xs font-bold text-cyan-200 mb-2">{leftContent.title}</h4>
              <div className="text-xs font-poppins text-foreground/90 whitespace-pre-line leading-relaxed">
                {leftContent.content}
              </div>
            </div>
          </div>

          {/* Slider Handle */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 via-primary to-purple-500 cursor-ew-resize z-20 flex items-center justify-center group"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-7 h-7 rounded-full bg-background border-2 border-primary text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Sliders className="h-3.5 w-3.5 rotate-90" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompareSlider;
