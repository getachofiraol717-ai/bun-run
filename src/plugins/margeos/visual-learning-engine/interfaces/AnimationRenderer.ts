// Visual Learning Engine — AnimationRenderer Interface
// Defines contracts for animation rendering and playback

import type { Animation, AnimationFrame, AnimationElement, AnimationPlayback, AnimationCaption } from "../models/Animation";

/**
 * Animation renderer interface
 */
export interface IAnimationRenderer {
  /**
   * Render animation frame to canvas
   */
  renderFrame(
    frame: AnimationFrame,
    canvas: HTMLCanvasElement,
    options?: AnimationRenderOptions
  ): Promise<void>;

  /**
   * Render animation to video
   */
  renderToVideo(
    animation: Animation,
    canvas: HTMLCanvasElement,
    options?: VideoRenderOptions
  ): Promise<Blob>;

  /**
   * Get frame at time
   */
  getFrameAtTime(animation: Animation, time: number): AnimationFrame;

  /**
   * Interpolate frames
   */
  interpolateFrames(
    frame1: AnimationFrame,
    frame2: AnimationFrame,
    progress: number
  ): AnimationFrame;
}

export interface AnimationRenderOptions {
  width?: number;
  height?: number;
  scale?: number;
  backgroundColor?: string;
  showControls?: boolean;
  showProgress?: boolean;
  quality?: number;
}

export interface VideoRenderOptions extends AnimationRenderOptions {
  fps?: number;
  format?: "webm" | "mp4";
  duration?: number;
  loop?: boolean;
}

/**
 * Animation player interface
 */
export interface IAnimationPlayer {
  /**
   * Load animation
   */
  load(animation: Animation): void;

  /**
   * Play animation
   */
  play(): void;

  /**
   * Pause animation
   */
  pause(): void;

  /**
   * Stop animation
   */
  stop(): void;

  /**
   * Seek to time
   */
  seekTo(time: number): void;

  /**
   * Seek to frame
   */
  seekToFrame(frameIndex: number): void;

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void;

  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void;

  /**
   * Set volume
   */
  setVolume(volume: number): void;

  /**
   * Toggle mute
   */
  toggleMute(): void;

  /**
   * Set loop
   */
  setLoop(loop: boolean): void;

  /**
   * Get current time
   */
  getCurrentTime(): number;

  /**
   * Get current frame
   */
  getCurrentFrame(): AnimationFrame;

  /**
   * Get duration
   */
  getDuration(): number;

  /**
   * Get state
   */
  getState(): PlayerState;
}

export interface PlayerState {
  playing: boolean;
  paused: boolean;
  stopped: boolean;
  currentTime: number;
  currentFrame: number;
  duration: number;
  playbackRate: number;
  volume: number;
  muted: boolean;
  loop: boolean;
}

/**
 * Animation element renderer interface
 */
export interface IElementRenderer {
  /**
   * Render shape element
   */
  renderShape(
    ctx: CanvasRenderingContext2D,
    element: AnimationElement,
    style: ElementRenderStyle
  ): void;

  /**
   * Render text element
   */
  renderText(
    ctx: CanvasRenderingContext2D,
    element: AnimationElement,
    style: TextRenderStyle
  ): void;

  /**
   * Render line element
   */
  renderLine(
    ctx: CanvasRenderingContext2D,
    element: AnimationElement,
    style: LineRenderStyle
  ): void;

  /**
   * Render arrow element
   */
  renderArrow(
    ctx: CanvasRenderingContext2D,
    element: AnimationElement,
    style: ArrowRenderStyle
  ): void;

  /**
   * Render image element
   */
  renderImage(
    ctx: CanvasRenderingContext2D,
    element: AnimationElement,
    image: HTMLImageElement
  ): void;

  /**
   * Render particle element
   */
  renderParticle(
    ctx: CanvasRenderingContext2D,
    element: AnimationElement,
    style: ParticleRenderStyle
  ): void;

  /**
   * Render path element
   */
  renderPath(
    ctx: CanvasRenderingContext2D,
    element: AnimationElement,
    style: PathRenderStyle
  ): void;

  /**
   * Render highlight element
   */
  renderHighlight(
    ctx: CanvasRenderingContext2D,
    element: AnimationElement,
    style: HighlightRenderStyle
  ): void;
}

export interface ElementRenderStyle {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  scale?: number;
  rotation?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
}

export interface TextRenderStyle extends ElementRenderStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  textBaseline?: "top" | "middle" | "bottom";
}

export interface LineRenderStyle extends ElementRenderStyle {
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
  dashArray?: number[];
}

export interface ArrowRenderStyle extends LineRenderStyle {
  arrowHead?: "triangle" | "open" | "circle";
  arrowSize?: number;
}

export interface ParticleRenderStyle extends ElementRenderStyle {
  particleCount?: number;
  particleSize?: number;
  particleColor?: string;
  velocity?: { x: number; y: number };
  lifetime?: number;
}

export interface PathRenderStyle extends ElementRenderStyle {
  dashArray?: number[];
  animated?: boolean;
  animationProgress?: number;
}

export interface HighlightRenderStyle extends ElementRenderStyle {
  highlightColor?: string;
  highlightRadius?: number;
  pulse?: boolean;
  pulseSpeed?: number;
}

/**
 * Animation transition renderer interface
 */
export interface ITransitionRenderer {
  /**
   * Render fade transition
   */
  renderFade(
    ctx: CanvasRenderingContext2D,
    fromOpacity: number,
    toOpacity: number,
    progress: number
  ): void;

  /**
   * Render slide transition
   */
  renderSlide(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    progress: number,
    direction: "left" | "right" | "up" | "down"
  ): void;

  /**
   * Render zoom transition
   */
  renderZoom(
    ctx: CanvasRenderingContext2D,
    fromScale: number,
    toScale: number,
    progress: number,
    centerX: number,
    centerY: number
  ): void;

  /**
   * Render flip transition
   */
  renderFlip(
    ctx: CanvasRenderingContext2D,
    progress: number,
    centerX: number,
    centerY: number,
    axis: "x" | "y"
  ): void;

  /**
   * Render draw transition
   */
  renderDraw(
    ctx: CanvasRenderingContext2D,
    path: Path2D,
    progress: number,
    style: LineRenderStyle
  ): void;

  /**
   * Render morph transition
   */
  renderMorph(
    ctx: CanvasRenderingContext2D,
    fromPath: Path2D,
    toPath: Path2D,
    progress: number,
    style: ElementRenderStyle
  ): void;
}

/**
 * Caption renderer interface
 */
export interface ICaptionRenderer {
  /**
   * Render caption
   */
  renderCaption(
    ctx: CanvasRenderingContext2D,
    caption: AnimationCaption,
    position: "top" | "bottom" | "overlay",
    style?: CaptionRenderStyle
  ): void;

  /**
   * Render captions for frame
   */
  renderFrameCaptions(
    ctx: CanvasRenderingContext2D,
    captions: AnimationCaption[],
    currentTime: number,
    position: "top" | "bottom" | "overlay"
  ): void;
}

export interface CaptionRenderStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  color?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  padding?: number;
  borderRadius?: number;
  textAlign?: "left" | "center" | "right";
}

/**
 * Animation player events
 */
export interface AnimationPlayerEvents {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onFrameChange?: (frame: number) => void;
  onSeeking?: (time: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Animation synthesizer interface
 */
export interface IAnimationSynthesizer {
  /**
   * Create animation from steps
   */
  synthesizeFromSteps(
    steps: { label: string; duration?: number }[],
    options?: SynthesisOptions
  ): Animation;

  /**
   * Create animation from data
   */
  synthesizeFromData(
    data: {
      elements: AnimationElement[];
      annotations?: AnimationElement[];
      narration?: string;
    }[],
    options?: SynthesisOptions
  ): Animation;

  /**
   * Add narration to animation
   */
  addNarration(animation: Animation, narrations: { text: string; start: number; end: number }[]): Animation;
}

export interface SynthesisOptions {
  defaultDuration?: number;
  transitionDuration?: number;
  includeCaptions?: boolean;
  autoGenerateAnnotations?: boolean;
  annotationStyle?: Partial<ElementRenderStyle>;
}
