// Visual Learning Engine — animationUtils
// Animation calculation and interpolation utilities

import type { AnimationFrame, AnimationElement, AnimationTransition, EasingFunction, TransitionType } from "../models/Animation";

export interface AnimationKeyframe {
  time: number;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  opacity?: number;
  color?: string;
}

export interface InterpolationResult {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  color: string;
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Easing functions
 */
export const easingFunctions: Record<EasingFunction, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  elastic: (t) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  }
};

/**
 * Get easing function by name
 */
export function getEasingFunction(name: EasingFunction): (t: number) => number {
  return easingFunctions[name] || easingFunctions.linear;
}

/**
 * Interpolate between two keyframes
 */
export function interpolateKeyframes(
  from: AnimationKeyframe,
  to: AnimationKeyframe,
  time: number,
  easing: EasingFunction = "easeInOut"
): InterpolationResult {
  const duration = to.time - from.time;
  const elapsed = time - from.time;
  const t = Math.max(0, Math.min(1, elapsed / duration));
  const easedT = getEasingFunction(easing)(t);

  return {
    x: from.position ? lerp(from.position.x, to.position?.x || from.position.x, easedT) : 0,
    y: from.position ? lerp(from.position.y, to.position?.y || from.position.y, easedT) : 0,
    scale: lerp(from.scale || 1, to.scale || 1, easedT),
    rotation: lerp(from.rotation || 0, to.rotation || 0, easedT),
    opacity: lerp(from.opacity || 1, to.opacity || 1, easedT),
    color: to.color || from.color || "#000000"
  };
}

/**
 * Calculate frame at given time
 */
export function calculateFrameAtTime(frames: AnimationFrame[], time: number): AnimationFrame | null {
  if (frames.length === 0) return null;
  if (frames.length === 1) return frames[0];

  // Find surrounding frames
  let prevFrame = frames[0];
  let nextFrame = frames[frames.length - 1];

  for (let i = 0; i < frames.length - 1; i++) {
    if (time >= frames[i].timestamp && time < frames[i + 1].timestamp) {
      prevFrame = frames[i];
      nextFrame = frames[i + 1];
      break;
    }
  }

  // Return the appropriate frame based on time
  if (time < prevFrame.timestamp) return prevFrame;
  if (time >= nextFrame.timestamp) return nextFrame;

  // Interpolate between frames
  return interpolateFrames(prevFrame, nextFrame, time);
}

/**
 * Interpolate between two frames
 */
function interpolateFrames(from: AnimationFrame, to: AnimationFrame, time: number): AnimationFrame {
  const duration = to.timestamp - from.timestamp;
  const t = Math.max(0, Math.min(1, (time - from.timestamp) / duration));

  const interpolatedElements: AnimationElement[] = from.elements.map((el, i) => {
    const toEl = to.elements[i] || el;
    return {
      ...el,
      position: {
        x: lerp(el.position.x, toEl.position.x, t),
        y: lerp(el.position.y, toEl.position.y, t)
      },
      scale: lerp(el.scale, toEl.scale, t),
      rotation: lerp(el.rotation, toEl.rotation, t),
      opacity: lerp(el.opacity, toEl.opacity, t),
      color: t < 0.5 ? el.color : toEl.color
    };
  });

  return {
    ...from,
    timestamp: time,
    elements: interpolatedElements
  };
}

/**
 * Calculate transition effect
 */
export function calculateTransition(
  transition: AnimationTransition | undefined,
  element: AnimationElement,
  target: AnimationElement
): AnimationElement {
  if (!transition) return target;

  const easedT = getEasingFunction(transition.easing)(1);
  const durationRatio = 1; // Assume transition is complete

  return {
    ...target,
    position: {
      x: lerp(element.position.x, target.position.x, easedT),
      y: lerp(element.position.y, target.position.y, easedT)
    },
    scale: lerp(element.scale, target.scale, easedT),
    rotation: lerp(element.rotation, target.rotation, easedT),
    opacity: lerp(element.opacity, target.opacity, easedT)
  };
}

/**
 * Calculate path animation points
 */
export function calculatePathAnimation(
  start: { x: number; y: number },
  end: { x: number; y: number },
  progress: number,
  curve: "straight" | "bezier" | "arc" = "straight"
): { x: number; y: number } {
  switch (curve) {
    case "straight":
      return {
        x: lerp(start.x, end.x, progress),
        y: lerp(start.y, end.y, progress)
      };
    case "bezier":
      const controlX = (start.x + end.x) / 2;
      const controlY = start.y;
      const t = progress;
      return {
        x: Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * controlX + t * t * end.x,
        y: Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * controlY + t * t * end.y
      };
    case "arc":
      const midX = (start.x + end.x) / 2;
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) / 2;
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const arcHeight = radius * 0.5;
      const px = lerp(start.x, end.x, progress);
      const py = lerp(start.y, end.y, progress);
      const perpAngle = angle + Math.PI / 2;
      const offset = Math.sin(progress * Math.PI) * arcHeight;
      return {
        x: px + offset * Math.cos(perpAngle),
        y: py + offset * Math.sin(perpAngle)
      };
    default:
      return { x: lerp(start.x, end.x, progress), y: lerp(start.y, end.y, progress) };
  }
}

/**
 * Generate animation frames from steps
 */
export function generateFramesFromSteps(
  steps: { label: string; duration?: number }[],
  defaultDuration: number = 2000
): AnimationFrame[] {
  return steps.map((step, index) => ({
    frameNumber: index,
    timestamp: steps.slice(0, index).reduce((acc, s) => acc + (s.duration || defaultDuration), 0),
    elements: [],
    annotations: [],
    narration: step.label,
    captions: [step.label]
  }));
}

/**
 * Calculate animation duration
 */
export function calculateDuration(frames: AnimationFrame[]): number {
  if (frames.length === 0) return 0;
  return Math.max(...frames.map(f => f.timestamp)) + 1000;
}

/**
 * Get transition type name
 */
export function getTransitionName(type: TransitionType): string {
  const names: Record<TransitionType, string> = {
    fade: "Fade",
    slide: "Slide",
    zoom: "Zoom",
    flip: "Flip",
    morph: "Morph",
    draw: "Draw",
    none: "None"
  };
  return names[type] || "None";
}

/**
 * Get easing function name
 */
export function getEasingName(func: EasingFunction): string {
  const names: Record<EasingFunction, string> = {
    linear: "Linear",
    easeIn: "Ease In",
    easeOut: "Ease Out",
    easeInOut: "Ease In Out",
    bounce: "Bounce",
    elastic: "Elastic"
  };
  return names[func] || "Linear";
}
