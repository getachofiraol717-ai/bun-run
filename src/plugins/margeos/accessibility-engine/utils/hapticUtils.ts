// Accessibility Engine — Haptic Utilities
// Utility functions for haptic feedback

export interface HapticPattern {
  name: string;
  segments: HapticSegment[];
}

export interface HapticSegment {
  type: "vibrate" | "pause" | "intensity";
  duration?: number;
  intensity?: number;
}

/**
 * Check if Vibration API is supported
 */
export function isVibrationSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/**
 * Simple vibration
 */
export function vibrate(duration: number): boolean {
  if (!isVibrationSupported()) return false;
  return navigator.vibrate(duration);
}

/**
 * Vibration pattern
 */
export function vibratePattern(pattern: number[]): boolean {
  if (!isVibrationSupported()) return false;
  return navigator.vibrate(pattern);
}

/**
 * Stop vibration
 */
export function stopVibration(): boolean {
  if (!isVibrationSupported()) return false;
  return navigator.vibrate(0);
}

/**
 * Create tap haptic pattern
 */
export function createTapPattern(intensity: number = 0.8): HapticPattern {
  return {
    name: "tap",
    segments: [
      { type: "vibrate", duration: 50, intensity }
    ]
  };
}

/**
 * Create double tap haptic pattern
 */
export function createDoubleTapPattern(intensity: number = 0.8): HapticPattern {
  return {
    name: "double_tap",
    segments: [
      { type: "vibrate", duration: 50, intensity },
      { type: "pause", duration: 80 },
      { type: "vibrate", duration: 50, intensity }
    ]
  };
}

/**
 * Create long press haptic pattern
 */
export function createLongPressPattern(intensity: number = 0.7): HapticPattern {
  return {
    name: "long_press",
    segments: [
      { type: "vibrate", duration: 200, intensity }
    ]
  };
}

/**
 * Create success haptic pattern
 */
export function createSuccessPattern(): HapticPattern {
  return {
    name: "success",
    segments: [
      { type: "vibrate", duration: 100, intensity: 0.7 },
      { type: "pause", duration: 50 },
      { type: "vibrate", duration: 100, intensity: 0.7 }
    ]
  };
}

/**
 * Create error haptic pattern
 */
export function createErrorPattern(): HapticPattern {
  return {
    name: "error",
    segments: [
      { type: "vibrate", duration: 300, intensity: 1.0 }
    ]
  };
}

/**
 * Create warning haptic pattern
 */
export function createWarningPattern(): HapticPattern {
  return {
    name: "warning",
    segments: [
      { type: "vibrate", duration: 150, intensity: 0.8 },
      { type: "pause", duration: 100 },
      { type: "vibrate", duration: 150, intensity: 0.8 }
    ]
  };
}

/**
 * Create alert haptic pattern
 */
export function createAlertPattern(): HapticPattern {
  return {
    name: "alert",
    segments: [
      { type: "vibrate", duration: 100, intensity: 1.0 },
      { type: "pause", duration: 50 },
      { type: "vibrate", duration: 100, intensity: 1.0 },
      { type: "pause", duration: 50 },
      { type: "vibrate", duration: 100, intensity: 1.0 }
    ]
  };
}

/**
 * Create swipe haptic pattern
 */
export function createSwipePattern(direction: "left" | "right" | "up" | "down"): HapticPattern {
  return {
    name: `swipe_${direction}`,
    segments: [
      { type: "vibrate", duration: 30, intensity: 0.5 },
      { type: "pause", duration: 50 },
      { type: "vibrate", duration: 30, intensity: 0.5 },
      { type: "pause", duration: 50 },
      { type: "vibrate", duration: 30, intensity: 0.5 }
    ]
  };
}

/**
 * Create scroll haptic pattern
 */
export function createScrollPattern(): HapticPattern {
  return {
    name: "scroll",
    segments: [
      { type: "vibrate", duration: 30, intensity: 0.3 }
    ]
  };
}

/**
 * Convert haptic pattern to vibration array
 */
export function patternToVibrationArray(pattern: HapticPattern): number[] {
  const result: number[] = [];

  for (const segment of pattern.segments) {
    if (segment.type === "vibrate") {
      result.push(segment.duration || 100);
    } else if (segment.type === "pause") {
      result.push(segment.duration || 0);
    }
  }

  return result;
}

/**
 * Calculate pattern duration
 */
export function getPatternDuration(pattern: HapticPattern): number {
  return pattern.segments.reduce((total, segment) => {
    if (segment.type === "vibrate" || segment.type === "pause") {
      return total + (segment.duration || 0);
    }
    return total;
  }, 0);
}

/**
 * Scale pattern intensity
 */
export function scalePatternIntensity(pattern: HapticPattern, scale: number): HapticPattern {
  return {
    ...pattern,
    segments: pattern.segments.map(segment => ({
      ...segment,
      intensity: segment.intensity
        ? Math.min(1, segment.intensity * scale)
        : undefined
    }))
  };
}

/**
 * Repeat pattern
 */
export function repeatPattern(pattern: HapticPattern, times: number): HapticPattern {
  if (times <= 1) return pattern;

  const repeatedSegments: HapticSegment[] = [];

  for (let i = 0; i < times; i++) {
    repeatedSegments.push(...pattern.segments);
    if (i < times - 1) {
      repeatedSegments.push({ type: "pause", duration: 100 });
    }
  }

  return {
    name: `${pattern.name}_x${times}`,
    segments: repeatedSegments
  };
}

/**
 * Combine patterns
 */
export function combinePatterns(patterns: HapticPattern[]): HapticPattern {
  const allSegments: HapticSegment[] = [];

  patterns.forEach((pattern, index) => {
    allSegments.push(...pattern.segments);
    if (index < patterns.length - 1) {
      allSegments.push({ type: "pause", duration: 100 });
    }
  });

  return {
    name: patterns.map(p => p.name).join("_"),
    segments: allSegments
  };
}

/**
 * Play haptic pattern
 */
export function playHapticPattern(pattern: HapticPattern): boolean {
  if (!isVibrationSupported()) return false;

  const vibrationArray = patternToVibrationArray(pattern);
  return navigator.vibrate(vibrationArray);
}

/**
 * Play pattern with intensity (fallback)
 */
export function playHapticWithIntensity(pattern: HapticPattern, globalIntensity: number = 1.0): boolean {
  if (!isVibrationSupported()) return false;

  // For browsers that don't support intensity, just play the pattern
  return playHapticPattern(pattern);
}
