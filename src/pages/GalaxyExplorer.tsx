import React, { useRef, useState, Suspense, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import GalaxyBackground from '@/components/GalaxyBackground';
import {
  Globe, BookOpen, X, Search, Layers, ArrowLeft, Sparkles,
  ChevronDown, Info, ZoomIn, ZoomOut, Compass, Play, Pause,
  Sliders, Eye, Sun, Moon, CircleDot, Zap, RotateCcw,
  Maximize2,
} from 'lucide-react';
import {
  getSector, getNearbySectors, generateSystem, createVirtualSubjectStar,
  SECTOR_SIZE, GALAXY_RADIUS, type StarSeed, type PlanetSeed, SUBJECTS,
} from '@/lib/procedural';

type ViewMode = 'galaxy' | 'system' | 'planet' | 'firmament';

// ─────────────────────────────────────────────────────────────────────────────
// FIRMAMENT & 7 WANDERERS — SVG PATHS & CSS KEYFRAME ANIMATED SOLAR SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

interface FirmamentPlanet {
  id: string;
  name: string;
  title: string;
  subject: string;
  rx: number;
  ry: number;
  baseSpeedSec: number;
  color: string;
  glow: string;
  icon: string;
  size: number;
  description: string;
  funFact: string;
  country: string;
  moons: number;
  population: string;
}

const SEVEN_PLANETS: FirmamentPlanet[] = [
  {
    id: 'sun',
    name: 'Sun (Sol)',
    title: 'Golden Luminary',
    subject: 'Thermodynamics & Celestial Light',
    rx: 110,
    ry: 52,
    baseSpeedSec: 18,
    color: '#fbbf24',
    glow: '#f59e0b',
    icon: '☀️',
    size: 14,
    description: 'The supreme Golden Luminary radiating life force, warmth, and electromagnetic energy over the Firmament plane.',
    funFact: 'Circles the tropic paths daily, regulating day and night across Earth’s continents.',
    country: 'Solar Meridian',
    moons: 0,
    population: 'Infinite Light',
  },
  {
    id: 'moon',
    name: 'Moon (Luna)',
    title: 'Silver Luminary',
    subject: 'Tidal Mechanics & Lunar Cycles',
    rx: 152,
    ry: 72,
    baseSpeedSec: 24,
    color: '#f1f5f9',
    glow: '#94a3b8',
    icon: '🌙',
    size: 12,
    description: 'The cool, silver luminary governing ocean tides, biological rhythms, and nocturnal reflection.',
    funFact: 'Emits a unique cool light that lowers ambient temperatures under clear night skies.',
    country: 'Silver Abyss',
    moons: 0,
    population: 'Sub-Luminic',
  },
  {
    id: 'mercury',
    name: 'Mercury (Hermes)',
    title: 'Quick Silver Emerald',
    subject: 'Linguistics & High-Speed Computation',
    rx: 196,
    ry: 92,
    baseSpeedSec: 12,
    color: '#34d399',
    glow: '#10b981',
    icon: '☿',
    size: 9,
    description: 'The swift emerald wanderer of intellect, logic, communication, and electronic signals.',
    funFact: 'Completes 4 circuit loops for every single epochal alignment.',
    country: 'Algorithmic Valley',
    moons: 0,
    population: '2.4B Nodes',
  },
  {
    id: 'venus',
    name: 'Venus (Aphrodite)',
    title: 'Morning & Evening Star',
    subject: 'Sacred Geometry & Art History',
    rx: 242,
    ry: 112,
    baseSpeedSec: 20,
    color: '#f472b6',
    glow: '#ec4899',
    icon: '♀',
    size: 11,
    description: 'The dazzling rose & sapphire luminary tracing a perfect pentagram in the sky every 8 cycles.',
    funFact: 'Traces the Golden Ratio (Phi) curve across its orbital paths.',
    country: 'Harmonic Rose Domain',
    moons: 0,
    population: '5.1B Creators',
  },
  {
    id: 'mars',
    name: 'Mars (Ares)',
    title: 'Crimson Ruby Wanderer',
    subject: 'Kinetic Energy & Physics',
    rx: 292,
    ry: 134,
    baseSpeedSec: 32,
    color: '#f87171',
    glow: '#ef4444',
    icon: '♂',
    size: 10,
    description: 'The intense red ruby planet governing kinetic momentum, volcanic forces, and elemental energy.',
    funFact: 'Exhibits retrograde motion loops relative to the central plane North Pole.',
    country: 'Iron Crest Highlands',
    moons: 2,
    population: '1.8B Units',
  },
  {
    id: 'jupiter',
    name: 'Jupiter (Zeus)',
    title: 'Royal Amber Giant',
    subject: 'Quantum Cosmology & Mathematics',
    rx: 348,
    ry: 158,
    baseSpeedSec: 44,
    color: '#fb923c',
    glow: '#f97316',
    icon: '♃',
    size: 15,
    description: 'The majestic sovereign planet of expansion, mathematical balance, and high wisdom.',
    funFact: 'Houses 4 major resonant moons dancing along its magnetic firmament sheath.',
    country: 'Crown Sovereignty',
    moons: 4,
    population: '12.8B Scholars',
  },
  {
    id: 'saturn',
    name: 'Saturn (Chronos)',
    title: 'Ringed Obsidian & Violet',
    subject: 'Structural Architecture & Philosophy',
    rx: 408,
    ry: 182,
    baseSpeedSec: 60,
    color: '#c084fc',
    glow: '#a855f7',
    icon: '♄',
    size: 13,
    description: 'The ancient ringed guardian of cosmic time, structural order, geometry, and philosophical boundaries.',
    funFact: 'Surrounded by crystalline concentric frequency rings glowing in ultraviolet spectrums.',
    country: 'Prismatic Citadel',
    moons: 7,
    population: '8.4B Philosophers',
  },
];

const FIRMAMENT_KEYFRAMES = `
@keyframes orbitSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes orbitCounterSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
}
@keyframes dashFlow {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -200; }
}
@keyframes domePulse {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.65; transform: scale(1.02); }
}
@keyframes iceWallPulse {
  0%, 100% { stroke: #38bdf8; opacity: 0.5; }
  50% { stroke: #818cf8; opacity: 0.95; }
}
`;

const FirmamentOrbitView = ({ onBack }: { onBack: () => void }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showTrails, setShowTrails] = useState(true);
  const [isTilt3D, setIsTilt3D] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<FirmamentPlanet | null>(null);

  const cx = 450;
  const cy = 350;

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-slate-950/80">
      <style>{FIRMAMENT_KEYFRAMES}</style>

      {/* Top Banner Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="glass rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-orbitron text-primary hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Galaxy
          </button>
          <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 border border-purple-500/30">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <div>
              <h2 className="font-orbitron text-xs sm:text-sm font-bold text-foreground">
                🛸 Firmament & 7 Wanderers Solar View
              </h2>
              <p className="text-[9px] text-muted-foreground font-poppins">
                CSS Keyframes & SVG Paths Orbital Mechanics • Plane Earth Center
              </p>
            </div>
          </div>
        </div>

        {/* Planet Quick Pills */}
        <div className="hidden md:flex items-center gap-1.5 glass p-1.5 rounded-xl border border-border">
          {SEVEN_PLANETS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlanet(p)}
              className={`px-2 py-1 rounded-lg text-[10px] font-orbitron flex items-center gap-1 transition-all ${
                selectedPlanet?.id === p.id
                  ? 'bg-primary text-primary-foreground font-bold shadow'
                  : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main SVG Orbital Stage with optional 3D Isometric Tilt */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-2">
        <div
          className="w-full h-full max-w-[1000px] max-h-[750px] transition-transform duration-700 ease-out flex items-center justify-center"
          style={{
            transform: isTilt3D ? 'perspective(1200px) rotateX(48deg) rotateZ(-5deg) scale(0.92)' : 'none',
          }}
        >
          <svg
            viewBox="0 0 900 700"
            className="w-full h-full drop-shadow-[0_0_35px_rgba(139,92,246,0.15)]"
          >
            <defs>
              {/* SVG Filters & Gradients */}
              <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient id="planeOcean" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="60%" stopColor="#1e1b4b" />
                <stop offset="90%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </radialGradient>

              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="poleGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Starlight Field */}
            <g opacity="0.4">
              {Array.from({ length: 60 }).map((_, i) => {
                const sx = (i * 137.5) % 880 + 10;
                const sy = (i * 91.3) % 680 + 10;
                const sr = (i % 3) * 0.8 + 0.6;
                return (
                  <circle
                    key={i}
                    cx={sx}
                    cy={sy}
                    r={sr}
                    fill="#e2e8f0"
                    opacity={0.3 + (i % 5) * 0.15}
                  />
                );
              })}
            </g>

            {/* ── 1. CENTRAL PLANE EARTH & FIRMAMENT DOME ── */}
            <g id="plane-earth-center">
              {/* Outer Ice Wall Perimeter Ring */}
              <circle
                cx={cx}
                cy={cy}
                r="78"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeDasharray="6 4"
                style={{ animation: 'iceWallPulse 4s ease-in-out infinite' }}
              />
              <circle
                cx={cx}
                cy={cy}
                r="72"
                fill="url(#planeOcean)"
                stroke="#60a5fa"
                strokeWidth="1.5"
              />

              {/* Continents / Landmasses SVG Paths */}
              <g fill="#10b981" opacity="0.75">
                {/* Africa / Eurasia / Americas stylized shapes */}
                <path d={`M ${cx - 20} ${cy - 10} q 15 -25 35 -15 q 10 20 -10 35 q -20 5 -25 -20 z`} fill="#059669" />
                <path d={`M ${cx + 10} ${cy + 12} q 18 -10 25 15 q -15 20 -28 5 q 0 -12 3 -20 z`} fill="#10b981" />
                <path d={`M ${cx - 42} ${cy - 25} q 12 -15 22 5 q -10 22 -20 12 z`} fill="#34d399" />
                <path d={`M ${cx - 30} ${cy + 15} q 15 5 18 25 q -18 10 -22 -15 z`} fill="#059669" />
              </g>

              {/* Longitudinal & Latitudinal Coordinates Grid */}
              <ellipse cx={cx} cy={cy} rx="50" ry="22" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.4" />
              <ellipse cx={cx} cy={cy} rx="30" ry="12" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.4" />
              <line x1={cx - 70} y1={cy} x2={cx + 70} y2={cy} stroke="#e0f2fe" strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" />
              <line x1={cx} y1={cy - 70} x2={cx} y2={cy + 70} stroke="#e0f2fe" strokeWidth="0.8" opacity="0.3" strokeDasharray="3 3" />

              {/* Magnetic North Pole / Mount Meru Center Luminary */}
              <circle cx={cx} cy={cy} r="12" fill="url(#poleGlow)" />
              <circle cx={cx} cy={cy} r="4" fill="#ffffff" filter="url(#glowFilter)" />

              {/* Firmament Crystal Dome Shell Ring */}
              <ellipse
                cx={cx}
                cy={cy}
                rx="85"
                ry="42"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="10 10"
                opacity="0.6"
                style={{ animation: 'domePulse 6s ease-in-out infinite' }}
              />
              <text x={cx} y={cy + 92} textAnchor="middle" className="font-orbitron text-[9px] fill-cyan-300 font-bold tracking-widest pointer-events-none">
                PLANE EARTH & FIRMAMENT
              </text>
            </g>

            {/* ── 2. SVG ORBITAL PATHS & CSS ANIMATED PLANET GROUPS ── */}
            {SEVEN_PLANETS.map((p) => {
              const isSelected = selectedPlanet?.id === p.id;
              const actualSpeed = p.baseSpeedSec / speed;

              // Elliptical SVG Path string
              const pathD = `M ${cx - p.rx} ${cy} A ${p.rx} ${p.ry} 0 1 0 ${cx + p.rx} ${cy} A ${p.rx} ${p.ry} 0 1 0 ${cx - p.rx} ${cy}`;

              return (
                <g key={p.id} id={`orbit-group-${p.id}`}>
                  {/* Orbit Path Guide Line */}
                  <ellipse
                    cx={cx}
                    cy={cy}
                    rx={p.rx}
                    ry={p.ry}
                    fill="none"
                    stroke={isSelected ? '#f43f5e' : p.color}
                    strokeWidth={isSelected ? '2.2' : '1.2'}
                    strokeDasharray={isSelected ? 'none' : '4 6'}
                    opacity={showTrails ? (isSelected ? 0.9 : 0.45) : 0.1}
                    className="transition-all duration-300"
                  />

                  {/* Animated Glowing SVG Path Flow Line */}
                  {showTrails && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={p.glow}
                      strokeWidth="2.5"
                      strokeDasharray="20 140"
                      style={{
                        animation: `dashFlow 22s linear infinite`,
                        animationPlayState: isPaused ? 'paused' : 'running',
                      }}
                      opacity="0.75"
                    />
                  )}

                  {/* Orbital Spinning Group (Rotates entire orbital arm via CSS keyframes) */}
                  <g
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      animation: `orbitSpin ${actualSpeed}s linear infinite`,
                      animationPlayState: isPaused ? 'paused' : 'running',
                    }}
                  >
                    {/* Planet Position on right vertex of ellipse */}
                    <g transform={`translate(${cx + p.rx}, ${cy})`}>
                      {/* Counter-Spinning Planet Marker (Keeps icons/text upright) */}
                      <g
                        style={{
                          transformOrigin: 'center',
                          animation: `orbitCounterSpin ${actualSpeed}s linear infinite`,
                          animationPlayState: isPaused ? 'paused' : 'running',
                        }}
                        className="cursor-pointer group"
                        onClick={() => setSelectedPlanet(p)}
                      >
                        {/* Outer Luminous Glow Aura */}
                        <circle
                          cx="0"
                          cy="0"
                          r={p.size * (isSelected ? 2.8 : 2.2)}
                          fill={p.glow}
                          opacity={isSelected ? '0.6' : '0.25'}
                          filter="url(#glowFilter)"
                          className="transition-all duration-300 group-hover:scale-125"
                        />

                        {/* Saturn Rings (if saturn) */}
                        {p.id === 'saturn' && (
                          <ellipse
                            cx="0"
                            cy="0"
                            rx={p.size * 2.4}
                            ry={p.size * 0.8}
                            fill="none"
                            stroke="#c084fc"
                            strokeWidth="2.5"
                            opacity="0.85"
                            transform="rotate(-25)"
                          />
                        )}

                        {/* Main Planet Sphere */}
                        <circle
                          cx="0"
                          cy="0"
                          r={p.size}
                          fill={p.color}
                          stroke={isSelected ? '#ffffff' : p.glow}
                          strokeWidth={isSelected ? '3' : '1.5'}
                          className="transition-all duration-300 group-hover:brightness-125"
                        />

                        {/* Symbol / Icon Inside */}
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={p.size * 1.0}
                          fontWeight="bold"
                          className="pointer-events-none font-orbitron select-none"
                        >
                          {p.icon}
                        </text>

                        {/* Planet Label Badge */}
                        <g transform={`translate(0, ${p.size + 14})`}>
                          <rect
                            x="-38"
                            y="-9"
                            width="76"
                            height="18"
                            rx="6"
                            fill={isSelected ? '#8b5cf6' : '#0f172a'}
                            stroke={p.glow}
                            strokeWidth="1"
                            opacity="0.9"
                          />
                          <text
                            x="0"
                            y="3"
                            textAnchor="middle"
                            className="font-orbitron text-[9px] fill-white font-bold tracking-tight pointer-events-none"
                          >
                            {p.name.split(' ')[0]}
                          </text>
                        </g>
                      </g>
                    </g>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Floating Bottom Control Toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 glass px-4 py-2 rounded-2xl border border-purple-500/30 shadow-2xl">
        {/* Play / Pause */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-2 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary transition-all"
          title={isPaused ? 'Resume Orbits' : 'Pause Orbits'}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>

        <div className="w-px h-5 bg-border my-auto" />

        {/* Speed Controls */}
        <div className="flex items-center gap-1">
          {[0.5, 1, 2, 5].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded-lg text-[10px] font-orbitron font-bold transition-all ${
                speed === s
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border my-auto" />

        {/* Orbit Trails Toggle */}
        <button
          onClick={() => setShowTrails(!showTrails)}
          className={`p-2 rounded-xl transition-all ${
            showTrails ? 'bg-indigo-600/30 text-indigo-300' : 'text-muted-foreground hover:bg-white/5'
          }`}
          title="Toggle Orbital Trails"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* 3D Tilt Perspective Toggle */}
        <button
          onClick={() => setIsTilt3D(!isTilt3D)}
          className={`p-2 rounded-xl transition-all ${
            isTilt3D ? 'bg-purple-600/30 text-purple-300' : 'text-muted-foreground hover:bg-white/5'
          }`}
          title="Toggle 3D Perspective Tilt"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Selected Planet Detail Drawer */}
      {selectedPlanet && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-[380px] glass-strong border-l border-purple-500/30 p-5 z-30 overflow-y-auto animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedPlanet.icon}</span>
              <div>
                <h3 className="font-orbitron text-base font-bold text-foreground">
                  {selectedPlanet.name}
                </h3>
                <p className="text-[10px] font-poppins text-purple-400">
                  {selectedPlanet.title}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPlanet(null)}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Subject Badge */}
          <div className="glass rounded-xl p-3 mb-3 border border-purple-500/20">
            <div className="text-[10px] text-muted-foreground font-poppins">📚 Knowledge Domain</div>
            <div className="font-orbitron text-sm text-primary font-bold mt-0.5">
              {selectedPlanet.subject}
            </div>
          </div>

          {/* Orbital Parameters */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="glass p-2.5 rounded-lg">
              <div className="text-[9px] text-muted-foreground font-poppins">Orbit Radius</div>
              <div className="font-orbitron text-xs text-foreground font-medium">{selectedPlanet.rx} SVG ly</div>
            </div>
            <div className="glass p-2.5 rounded-lg">
              <div className="text-[9px] text-muted-foreground font-poppins">Loop Period</div>
              <div className="font-orbitron text-xs text-foreground font-medium">{selectedPlanet.baseSpeedSec}s</div>
            </div>
            <div className="glass p-2.5 rounded-lg">
              <div className="text-[9px] text-muted-foreground font-poppins">Realm</div>
              <div className="font-orbitron text-xs text-foreground font-medium">{selectedPlanet.country}</div>
            </div>
            <div className="glass p-2.5 rounded-lg">
              <div className="text-[9px] text-muted-foreground font-poppins">Nodes</div>
              <div className="font-orbitron text-xs text-foreground font-medium">{selectedPlanet.population}</div>
            </div>
          </div>

          {/* Description */}
          <div className="glass p-3.5 rounded-xl mb-4 border border-border">
            <div className="text-xs font-orbitron text-foreground mb-1 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" /> Luminary Codex
            </div>
            <p className="text-xs font-poppins text-muted-foreground leading-relaxed">
              {selectedPlanet.description}
            </p>
            <p className="text-[11px] font-poppins text-purple-300/90 mt-2 italic">
              💡 {selectedPlanet.funFact}
            </p>
          </div>

          {/* Subject Library CTA */}
          <a
            href={`/library?subject=${encodeURIComponent(selectedPlanet.subject)}`}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-orbitron text-xs font-bold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-all"
          >
            <Sparkles className="h-4 w-4" /> Explore {selectedPlanet.subject} Library
          </a>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — tuned for performance + visual quality
// ─────────────────────────────────────────────────────────────────────────────
const MAX_RENDERED_STARS = 20_000; // reduced for smoother streaming
const STREAM_RADIUS      = 5;
const SECTOR_THROTTLE_MS = 120;    // min ms between sector rebuilds

// ─────────────────────────────────────────────────────────────────────────────
// GALAXY VIEW — deterministic Milky Way with spiral arms
// Uses InstancedMesh + additive blending; throttled sector streaming
// ─────────────────────────────────────────────────────────────────────────────
const GalaxyView = ({ onSelectStar }: { onSelectStar: (s: StarSeed) => void }) => {
  const coreRef  = useRef<THREE.InstancedMesh>(null);
  const haloRef  = useRef<THREE.InstancedMesh>(null);
  const { camera, scene } = useThree();
  const [stars, setStars] = useState<StarSeed[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);

  const lastSectorKey  = useRef('');
  const lastStreamTime = useRef(0);

  // Atmospheric fog
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x000010, 0.001);
    return () => { scene.fog = null; };
  }, [scene]);

  // Throttled sector streaming — only rebuild if camera moved to new sector
  useFrame(() => {
    const now = performance.now();
    if (now - lastStreamTime.current < SECTOR_THROTTLE_MS) return;

    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;
    const sx = Math.floor(cx / SECTOR_SIZE);
    const sy = Math.floor(cy / SECTOR_SIZE);
    const sz = Math.floor(cz / SECTOR_SIZE);
    const key = `${sx}_${sy}_${sz}`;
    if (key === lastSectorKey.current) return;

    lastSectorKey.current = key;
    lastStreamTime.current = now;

    // Sort sectors by distance — prioritise closest to camera
    const sectors = getNearbySectors(cx, cy, cz, STREAM_RADIUS);
    const allStars: StarSeed[] = [];
    for (const [x, y, z] of sectors) {
      const s = getSector(x, y, z);
      for (const star of s) {
        allStars.push(star);
        if (allStars.length >= MAX_RENDERED_STARS) break;
      }
      if (allStars.length >= MAX_RENDERED_STARS) break;
    }
    setStars(allStars);
  });

  // Sync instanced meshes — only when stars change (not every frame)
  useEffect(() => {
    if (!coreRef.current || !haloRef.current || stars.length === 0) return;
    const dummy    = new THREE.Object3D();
    const coreCol  = new Float32Array(stars.length * 3);
    const haloCol  = new Float32Array(stars.length * 3);
    const tmpColor = new THREE.Color();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      dummy.position.set(s.position[0], s.position[1], s.position[2]);
      dummy.scale.setScalar(s.size * 0.55);
      dummy.updateMatrix();
      coreRef.current.setMatrixAt(i, dummy.matrix);

      dummy.scale.setScalar(s.size * 2.5);
      dummy.updateMatrix();
      haloRef.current.setMatrixAt(i, dummy.matrix);

      tmpColor.set(s.color);
      coreCol[i*3] = tmpColor.r; coreCol[i*3+1] = tmpColor.g; coreCol[i*3+2] = tmpColor.b;
      haloCol[i*3] = tmpColor.r * 0.6; haloCol[i*3+1] = tmpColor.g * 0.6; haloCol[i*3+2] = tmpColor.b * 0.6;
    }

    coreRef.current.instanceColor = new THREE.InstancedBufferAttribute(coreCol, 3);
    haloRef.current.instanceColor = new THREE.InstancedBufferAttribute(haloCol, 3);
    coreRef.current.instanceMatrix.needsUpdate = true;
    haloRef.current.instanceMatrix.needsUpdate = true;
    coreRef.current.count = stars.length;
    haloRef.current.count = stars.length;
  }, [stars]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    const id = e.instanceId;
    if (id !== undefined && stars[id]) onSelectStar(stars[id]);
  }, [stars, onSelectStar]);

  const handlePointerMove = useCallback((e: any) => {
    setHovered(e.instanceId ?? null);
  }, []);

  return (
    <>
      <ambientLight intensity={0.04} />

      {/* Galactic bulge glow layers */}
      {[{ r: 140, op: 0.05, col: '#ffeebb' }, { r: 70, op: 0.12, col: '#ffddaa' }, { r: 30, op: 0.28, col: '#fff8dd' }].map(({ r, op, col }, i) => (
        <mesh key={i} position={[0, 0, 0]}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshBasicMaterial color={col} transparent opacity={op} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      <pointLight position={[0, 0, 0]} intensity={2.5} distance={GALAXY_RADIUS} color="#fff4cc" />

      {/* Soft halos (additive) */}
      <instancedMesh ref={haloRef} args={[undefined, undefined, MAX_RENDERED_STARS]} frustumCulled={false}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshBasicMaterial vertexColors transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>

      {/* Star cores (clickable) */}
      <instancedMesh
        ref={coreRef}
        args={[undefined, undefined, MAX_RENDERED_STARS]}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerOut={() => setHovered(null)}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>

      {/* Hover tooltip */}
      {hovered !== null && stars[hovered] && (
        <Html position={stars[hovered].position} center distanceFactor={30}>
          <div className="pointer-events-none bg-background/90 backdrop-blur px-2.5 py-1.5 rounded-xl border border-primary/40 whitespace-nowrap shadow-lg">
            <div className="font-orbitron text-[10px] text-primary font-bold">⭐ {stars[hovered].name}</div>
            <div className="text-[9px] text-muted-foreground font-poppins">Class {stars[hovered].spectralClass} • Click to warp</div>
          </div>
        </Html>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM VIEW — orbiting planets with educational labels
// ─────────────────────────────────────────────────────────────────────────────
const SystemPlanet = ({
  planet, onClick, isSelected,
}: { planet: PlanetSeed; onClick: () => void; isSelected: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef  = useRef<THREE.Mesh>(null);
  const [hov, setHov] = useState(false);
  const angleRef = useRef(Math.random() * Math.PI * 2); // random start angle per planet

  useFrame((state) => {
    if (groupRef.current) {
      // Deterministic orbit speed from planet seed
      angleRef.current += planet.speed * 0.016;
      groupRef.current.position.x = Math.cos(angleRef.current) * planet.orbitRadius;
      groupRef.current.position.z = Math.sin(angleRef.current) * planet.orbitRadius;
    }
    if (meshRef.current) meshRef.current.rotation.y += 0.008;
  });

  return (
    <>
      {/* Orbit ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.orbitRadius - 0.025, planet.orbitRadius + 0.025, 64]} />
        <meshBasicMaterial color={planet.emissive} transparent opacity={isSelected ? 0.5 : 0.12} side={THREE.DoubleSide} />
      </mesh>

      <group ref={groupRef}>
        <Float speed={1.5} floatIntensity={0.15}>
          <mesh
            ref={meshRef}
            onClick={onClick}
            onPointerOver={() => setHov(true)}
            onPointerOut={() => setHov(false)}
            scale={hov ? 1.3 : isSelected ? 1.45 : 1}
          >
            <sphereGeometry args={[planet.size, 28, 28]} />
            <meshStandardMaterial
              color={planet.color}
              emissive={planet.emissive}
              emissiveIntensity={hov || isSelected ? 1.4 : 0.4}
              roughness={0.6}
              metalness={0.1}
            />
          </mesh>

          {/* Atmosphere glow */}
          <mesh scale={1.18}>
            <sphereGeometry args={[planet.size, 12, 12]} />
            <meshBasicMaterial color={planet.emissive} transparent opacity={hov || isSelected ? 0.22 : 0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>

          {/* Saturn-style rings */}
          {planet.hasRings && (
            <mesh rotation={[Math.PI / 2.6, 0, 0]}>
              <ringGeometry args={[planet.size * 1.45, planet.size * 2.3, 32]} />
              <meshBasicMaterial color={planet.emissive} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          )}

          {/* Educational label */}
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="text-center">
              <div className={`font-orbitron text-[10px] font-bold whitespace-nowrap px-2 py-0.5 rounded-lg transition-all ${
                hov || isSelected ? 'bg-primary text-primary-foreground shadow-lg scale-110' : 'bg-background/70 text-foreground/80'
              }`}>
                {planet.subject}
              </div>
              {(hov || isSelected) && (
                <div className="mt-1 text-[9px] text-primary/90 bg-background/80 px-1.5 py-0.5 rounded whitespace-nowrap">
                  🌍 {planet.country}
                </div>
              )}
            </div>
          </Html>
        </Float>
      </group>
    </>
  );
};

const StarCenter = ({ star }: { star: StarSeed }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => { if (ref.current) ref.current.rotation.y += 0.002; });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshStandardMaterial color={star.color} emissive={star.color} emissiveIntensity={2.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.4, 16, 16]} />
        <meshBasicMaterial color={star.color} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color={star.color} intensity={5} distance={60} />
      <Html center distanceFactor={12} style={{ pointerEvents: 'none' }}>
        <div className="text-center">
          <div className="font-orbitron text-xs font-bold text-primary neon-text whitespace-nowrap bg-background/70 px-2 py-1 rounded-lg">
            ☀ {star.name} · Class {star.spectralClass}
          </div>
        </div>
      </Html>
    </group>
  );
};

const SystemView = ({ star, planets, onSelectPlanet, selectedPlanetId }: {
  star: StarSeed; planets: PlanetSeed[];
  onSelectPlanet: (p: PlanetSeed) => void; selectedPlanetId: string | null;
}) => (
  <>
    <ambientLight intensity={0.22} />
    <StarCenter star={star} />
    {planets.map(p => (
      <SystemPlanet key={p.id} planet={p} onClick={() => onSelectPlanet(p)} isSelected={p.id === selectedPlanetId} />
    ))}
  </>
);

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH AUTOCOMPLETE
// ─────────────────────────────────────────────────────────────────────────────
const SearchPanel = ({ onWarp }: { onWarp: (subject: string) => void }) => {
  const [q, setQ]           = useState('');
  const [open, setOpen]     = useState(false);
  const [focused, setFocused] = useState(-1);
  const inputRef            = useRef<HTMLInputElement>(null);

  const matches = useMemo(() =>
    q.trim().length < 1 ? [] :
    SUBJECTS.filter(s => s.toLowerCase().includes(q.toLowerCase())).slice(0, 8),
  [q]);

  const select = (s: string) => {
    setQ(s); setOpen(false); onWarp(s); inputRef.current?.blur();
  };

  return (
    <div className="absolute top-14 left-4 glass rounded-xl p-3 space-y-2 w-[240px] z-20">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); setFocused(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, matches.length - 1)); }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
            if (e.key === 'Enter' && focused >= 0) select(matches[focused]);
            if (e.key === 'Enter' && focused < 0 && matches[0]) select(matches[0]);
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Warp to subject..."
          className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-muted/60 border border-border text-xs text-foreground font-poppins outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Autocomplete dropdown */}
      {open && matches.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-20 glass-strong rounded-xl border border-border overflow-hidden shadow-xl">
            {matches.map((s, i) => (
              <button key={s} onClick={() => select(s)}
                className={`w-full text-left px-3 py-2 text-xs font-poppins transition-colors hover:bg-primary/10 ${focused === i ? 'bg-primary/15 text-primary' : 'text-foreground'}`}>
                <span className="mr-2">🪐</span>{s}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-poppins">
        <Layers className="h-2.5 w-2.5" /> Streaming {SUBJECTS.length} subjects
      </div>
      <p className="text-[8px] text-muted-foreground/60 font-poppins leading-tight">
        Drag · scroll to zoom · click star to warp in
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATIONAL OVERLAY — panel shown on planet selection
// ─────────────────────────────────────────────────────────────────────────────
const SUBJECT_FACTS: Record<string, string[]> = {
  Mathematics: ['The word "mathematics" comes from Greek "máthēma" meaning learning.', 'There are infinitely many prime numbers (proved by Euclid ~300 BC).', 'The number π appears in over 100 mathematical formulas.'],
  Physics: ['Light travels ~300,000 km/s — fast enough to circle Earth 7.5 times per second.', 'Einstein\'s E=mc² shows mass and energy are interchangeable.', 'Quantum particles can be in multiple states simultaneously (superposition).'],
  Biology: ['DNA contains ~3 billion base pairs in every human cell.', 'There are more bacterial cells in your body than human cells.', 'The mitochondria was once a separate bacterium absorbed by early cells.'],
  Chemistry: ['There are 118 known elements on the periodic table.', 'Water is the only substance that naturally exists in all 3 states on Earth.', 'Diamond and graphite are both made of pure carbon — arranged differently.'],
  History: ['Writing was invented around 3400 BC in ancient Mesopotamia.', 'Ethiopia is one of the oldest nations in the world with over 3000 years of history.', 'The Great Library of Alexandria once held up to 700,000 scrolls.'],
  Geography: ['Africa is the only continent that spans all four hemispheres.', 'Russia spans 11 time zones — the most of any country.', 'The Nile River is approximately 6,650 km long.'],
  'Computer Science': ['The first computer bug was an actual bug — a moth found in a relay in 1947.', 'Moore\'s Law predicted transistor count doubles every ~2 years.', 'The internet has over 5 billion users worldwide as of 2024.'],
  'Artificial Intelligence': ['The term "Artificial Intelligence" was coined by John McCarthy in 1956.', 'GPT-4 has ~1.8 trillion parameters.', 'AI can now beat world champions in Chess, Go, and many video games.'],
};

const getSubjectFacts = (subject: string): string[] => {
  if (SUBJECT_FACTS[subject]) return SUBJECT_FACTS[subject];
  return [
    `${subject} is one of ${SUBJECTS.length} knowledge domains in the Knowledge Universe.`,
    `Mastering ${subject} opens pathways to many careers and discoveries.`,
    `Ethiopian students have excelled in ${subject} at international competitions.`,
  ];
};

// ─────────────────────────────────────────────────────────────────────────────
// ZOOM CONTROLS (HTML overlay)
// ─────────────────────────────────────────────────────────────────────────────
const ZoomControls = ({ controlsRef }: { controlsRef: React.RefObject<any> }) => {
  const zoom = (dir: 1 | -1) => {
    if (!controlsRef.current) return;
    const cam = controlsRef.current.object as THREE.Camera;
    const target = controlsRef.current.target as THREE.Vector3;
    const delta = new THREE.Vector3().subVectors(cam.position, target).multiplyScalar(dir * 0.25);
    cam.position.add(delta);
    controlsRef.current.update();
  };

  return (
    <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-20">
      <button onClick={() => zoom(-1)} className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:bg-primary/10 transition-all" title="Zoom in">
        <ZoomIn className="h-4 w-4 text-primary" />
      </button>
      <button onClick={() => zoom(1)} className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:bg-primary/10 transition-all" title="Zoom out">
        <ZoomOut className="h-4 w-4 text-primary" />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const GalaxyExplorer = () => {
  const [view, setView]                 = useState<ViewMode>('galaxy');
  const [selectedStar, setSelectedStar] = useState<StarSeed | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetSeed | null>(null);
  const [systemPlanets, setSystemPlanets]   = useState<PlanetSeed[]>([]);
  const [factIdx, setFactIdx]           = useState(0);
  const [, setOverlayOpen]   = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const controlsRef = useRef<any>(null);

  const handleStarSelect = useCallback((s: StarSeed) => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedStar(s);
      setSystemPlanets(generateSystem(s));
      setView('system');
      setTransitioning(false);
    }, 180);
  }, []);

  const handlePlanetSelect = useCallback((p: PlanetSeed) => {
    setTransitioning(true);
    setTimeout(() => {
      setSelectedPlanet(p);
      setView('planet');
      setFactIdx(0);
      setOverlayOpen(true);
      setTransitioning(false);
    }, 180);
  }, []);

  const goBack = useCallback(() => {
    setTransitioning(true);
    setTimeout(() => {
      if (view === 'planet') { setView('system'); setSelectedPlanet(null); setOverlayOpen(false); }
      else if (view === 'system' || view === 'firmament') { setView('galaxy'); setSelectedStar(null); setSystemPlanets([]); }
      setTransitioning(false);
    }, 180);
  }, [view]);

  // Jump directly to a subject star system using deterministic virtual navigation target (Option B)
  const handleWarp = useCallback((subject: string) => {
    if (!subject || typeof subject !== 'string') return;
    const virtualStar = createVirtualSubjectStar(subject);
    handleStarSelect(virtualStar);
  }, [handleStarSelect]);

  const facts = selectedPlanet ? getSubjectFacts(selectedPlanet.subject) : [];

  // Camera config — different for each view
  const cameraConfig = useMemo(() => view === 'galaxy'
    ? { position: [0, 280, 520] as [number, number, number], fov: 55 }
    : { position: [0, 9, 28]  as [number, number, number], fov: 58 },
  [view]);

  const orbitConfig = useMemo(() => ({
    minDistance:  view === 'galaxy' ? 8   : 3,
    maxDistance:  view === 'galaxy' ? 1600 : 90,
    zoomSpeed:    view === 'galaxy' ? 1.8  : 1.2,
    rotateSpeed:  0.65,
    dampingFactor: 0.07,
  }), [view]);

  return (
    <div className="min-h-screen relative pt-16">
      <GalaxyBackground />
      <div className={`relative z-10 h-[calc(100vh-4rem)] transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {/* Render Firmament SVG Orbital View when selected */}
        {view === 'firmament' ? (
          <FirmamentOrbitView onBack={() => setView('galaxy')} />
        ) : (
          <>
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="font-orbitron text-primary neon-text animate-pulse text-lg">🌌 Loading Universe...</div>
              </div>
            }>
              {/* Key on view forces Canvas remount with correct camera */}
              <Canvas key={view} camera={cameraConfig} dpr={[1, 1.5]} performance={{ min: 0.5, max: 1 }}>
                {view === 'galaxy' && <GalaxyView onSelectStar={handleStarSelect} />}

                {view === 'system' && selectedStar && (
                  <SystemView
                    star={selectedStar}
                    planets={systemPlanets}
                    onSelectPlanet={handlePlanetSelect}
                    selectedPlanetId={selectedPlanet?.id ?? null}
                  />
                )}

                {view === 'planet' && selectedPlanet && (
                  <>
                    <ambientLight intensity={0.45} />
                    <pointLight position={[10, 10, 10]} intensity={2.5} color={selectedPlanet.emissive} />
                    <pointLight position={[-8, -5, 8]} intensity={1} color="#aaccff" />
                    <Float speed={0.9} floatIntensity={0.4} rotationIntensity={0.25}>
                      <mesh>
                        <sphereGeometry args={[3, 64, 64]} />
                        <meshStandardMaterial
                          color={selectedPlanet.color}
                          emissive={selectedPlanet.emissive}
                          emissiveIntensity={0.55}
                          roughness={0.65}
                          metalness={0.15}
                        />
                      </mesh>
                      {/* Atmosphere */}
                      <mesh scale={1.12}>
                        <sphereGeometry args={[3, 24, 24]} />
                        <meshBasicMaterial color={selectedPlanet.emissive} transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
                      </mesh>
                      {selectedPlanet.hasRings && (
                        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
                          <ringGeometry args={[4.3, 6.2, 64]} />
                          <meshBasicMaterial color={selectedPlanet.emissive} transparent opacity={0.55} side={THREE.DoubleSide} />
                        </mesh>
                      )}
                      {/* Moon(s) */}
                      {selectedPlanet.moons > 0 && Array.from({ length: Math.min(selectedPlanet.moons, 3) }, (_, mi) => (
                        <mesh key={mi} position={[4 + mi * 1.2, 0.5 * (mi % 2 === 0 ? 1 : -1), 0]}>
                          <sphereGeometry args={[0.18 + mi * 0.05, 12, 12]} />
                          <meshStandardMaterial color="#aaaaaa" roughness={0.9} />
                        </mesh>
                      ))}
                    </Float>
                  </>
                )}

                <OrbitControls
                  ref={controlsRef}
                  enablePan
                  enableZoom
                  enableRotate
                  minDistance={orbitConfig.minDistance}
                  maxDistance={orbitConfig.maxDistance}
                  zoomSpeed={orbitConfig.zoomSpeed}
                  rotateSpeed={orbitConfig.rotateSpeed}
                  enableDamping
                  dampingFactor={orbitConfig.dampingFactor}
                  makeDefault
                />
              </Canvas>
            </Suspense>

            {/* ── Top breadcrumb & Mode Switcher ── */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-auto z-10 flex flex-col items-center gap-2">
              <div>
                <h2 className="font-orbitron text-base sm:text-lg font-bold text-primary neon-text drop-shadow-lg">
                  {view === 'galaxy' && '🌌 Milky Way — Galactic Map'}
                  {view === 'system' && `☀ ${selectedStar?.name} System`}
                  {view === 'planet' && `🪐 ${selectedPlanet?.name} — ${selectedPlanet?.subject}`}
                </h2>
                <p className="text-[10px] text-muted-foreground font-poppins mt-0.5">
                  {view === 'galaxy' && 'Deterministic • ~200 sextillion stars • streaming sectors • click any star'}
                  {view === 'system' && `${systemPlanets.length} planets • click any planet to explore`}
                  {view === 'planet' && `🌍 ${selectedPlanet?.country} • ${selectedPlanet?.moons} moon(s)`}
                </p>
              </div>

              {/* View Mode Toggle Pill */}
              <div className="flex items-center gap-1.5 glass p-1 rounded-full border border-purple-500/30">
                <button
                  onClick={() => setView('galaxy')}
                  className={`px-3 py-1 rounded-full text-[10px] font-orbitron transition-all ${
                    view === 'galaxy'
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🌌 Milky Way
                </button>
                <button
                  onClick={() => setView('firmament')}
                  className={`px-3 py-1 rounded-full text-[10px] font-orbitron transition-all flex items-center gap-1 ${
                    (view as ViewMode) === 'firmament'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow'
                      : 'text-amber-300 hover:text-amber-200 hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  🛸 Firmament & 7 Wanderers
                </button>
              </div>
            </div>

            {/* ── Back button ── */}
            {view !== 'galaxy' && (
              <button onClick={goBack} className="absolute top-14 left-4 glass rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-orbitron text-primary hover:bg-primary/10 transition-colors z-20">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}

            {/* ── Search panel (galaxy view only) ── */}
            {view === 'galaxy' && <SearchPanel onWarp={handleWarp} />}

            {/* ── Zoom controls ── */}
            <ZoomControls controlsRef={controlsRef} />

            {/* ── Compass / hint (galaxy) ── */}
            {view === 'galaxy' && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-muted-foreground font-poppins glass rounded-full px-4 py-1.5 pointer-events-none z-10">
                <Compass className="h-3 w-3" />
                Drag to rotate • Scroll or pinch to zoom • Tap star to warp
              </div>
            )}

            {/* ── Planet detail panel ── */}
            {view === 'planet' && selectedPlanet && (
              <div className="absolute inset-y-0 right-0 w-full sm:w-[400px] glass-strong border-l border-border overflow-y-auto z-20 animate-slide-up">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-orbitron text-lg font-bold text-foreground flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" /> {selectedPlanet.name}
                    </h3>
                    <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Subject pill */}
                  <div className="glass rounded-xl p-3 mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-poppins">📚 Subject Domain</div>
                      <div className="font-orbitron text-base text-primary font-bold">{selectedPlanet.subject}</div>
                    </div>
                    <div className="text-2xl">🪐</div>
                  </div>

                  {/* Facts grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: 'Country', value: selectedPlanet.country, icon: '🌍' },
                      { label: 'Population', value: selectedPlanet.population, icon: '👥' },
                      { label: 'Distance', value: `${selectedPlanet.distanceLY} LY`, icon: '📏' },
                      { label: 'Travel Time', value: selectedPlanet.travelTime, icon: '🚀' },
                      { label: 'Moons', value: String(selectedPlanet.moons), icon: '🌙' },
                      { label: 'Has Rings', value: selectedPlanet.hasRings ? 'Yes' : 'No', icon: '💫' },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="glass rounded-lg p-2">
                        <div className="text-[9px] text-muted-foreground font-poppins">{icon} {label}</div>
                        <div className="font-orbitron text-xs text-foreground font-medium">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="glass rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-orbitron text-xs text-foreground">About This World</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-poppins leading-relaxed">{selectedPlanet.description}</p>
                    <p className="text-xs text-primary/70 font-poppins mt-2 italic">💡 {selectedPlanet.funFact}</p>
                  </div>

                  {/* ── EDUCATIONAL OVERLAY ── */}
                  <div className="glass rounded-xl p-4 mb-4 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        <span className="font-orbitron text-xs text-foreground">Knowledge Beacon</span>
                      </div>
                      <div className="flex gap-1">
                        {facts.map((_, i) => (
                          <button key={i} onClick={() => setFactIdx(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === factIdx ? 'bg-primary scale-125' : 'bg-muted-foreground/40'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground font-poppins leading-relaxed min-h-[3em]">
                      {facts[factIdx]}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setFactIdx(i => Math.max(0, i - 1))} disabled={factIdx === 0}
                        className="flex-1 py-1 text-xs glass rounded-lg font-poppins disabled:opacity-30 hover:bg-primary/10 transition-all">← Prev</button>
                      <button onClick={() => setFactIdx(i => Math.min(facts.length - 1, i + 1))} disabled={factIdx === facts.length - 1}
                        className="flex-1 py-1 text-xs glass rounded-lg font-poppins disabled:opacity-30 hover:bg-primary/10 transition-all">Next →</button>
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href={`/library?subject=${encodeURIComponent(selectedPlanet.subject)}`}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-orbitron neon-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  >
                    <Sparkles className="h-4 w-4" /> Explore {selectedPlanet.subject} Library
                  </a>
                </div>
              </div>
            )}

            {/* ── System view: subject list sidebar ── */}
            {view === 'system' && systemPlanets.length > 0 && !selectedPlanet && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <div className="glass rounded-2xl px-4 py-2 flex gap-2 flex-wrap justify-center max-w-[90vw]">
                  {systemPlanets.slice(0, 9).map(p => (
                    <button key={p.id} onClick={() => handlePlanetSelect(p)}
                      className="text-[10px] font-poppins px-2 py-1 rounded-lg glass border border-border hover:border-primary/50 hover:text-primary transition-all">
                      🪐 {p.subject}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GalaxyExplorer;

