// @ts-nocheck
// Accessibility Engine — Haptic Feedback Engine
// Provides haptic feedback patterns for deafblind users

import type { AccessibilityProfile } from "../models/AccessibilityProfile";

export interface HapticConfig {
  enabled: boolean;
  intensity: number; // 0-1
  duration: number; // ms
  patterns: boolean;
  vibrationApi: boolean;
}

export interface HapticPattern {
  name: string;
  segments: HapticSegment[];
  repeat: boolean;
  description: string;
}

export interface HapticSegment {
  type: "vibrate" | "pause" | "intensity";
  duration?: number; // ms
  intensity?: number; // 0-1
}

export type HapticFeedbackState = "idle" | "playing" | "paused" | "error";

export class HapticFeedbackEngine {
  private config: HapticConfig | null = null;
  private profile: AccessibilityProfile | null = null;
  private state: HapticFeedbackState = "idle";
  private currentPattern: HapticPattern | null = null;
  private currentSegmentIndex: number = 0;
  private listeners: Set<(state: HapticFeedbackState) => void> = new Set();
  private patternListeners: Set<(pattern: HapticPattern | null) => void> = new Set();
  private vibrationTimeout: NodeJS.Timeout | null = null;

  // Predefined patterns
  private defaultPatterns: Map<string, HapticPattern> = new Map([
    ["navigate", {
      name: "navigate",
      segments: [
        { type: "vibrate", duration: 50, intensity: 0.5 }
      ],
      repeat: false,
      description: "Navigation feedback"
    }],
    ["select", {
      name: "select",
      segments: [
        { type: "vibrate", duration: 100, intensity: 0.8 }
      ],
      repeat: false,
      description: "Selection feedback"
    }],
    ["success", {
      name: "success",
      segments: [
        { type: "vibrate", duration: 100, intensity: 0.7 },
        { type: "pause", duration: 50 },
        { type: "vibrate", duration: 100, intensity: 0.7 }
      ],
      repeat: false,
      description: "Success confirmation"
    }],
    ["error", {
      name: "error",
      segments: [
        { type: "vibrate", duration: 300, intensity: 1.0 }
      ],
      repeat: false,
      description: "Error notification"
    }],
    ["warning", {
      name: "warning",
      segments: [
        { type: "vibrate", duration: 150, intensity: 0.8 },
        { type: "pause", duration: 100 },
        { type: "vibrate", duration: 150, intensity: 0.8 }
      ],
      repeat: false,
      description: "Warning notification"
    }],
    ["alert", {
      name: "alert",
      segments: [
        { type: "vibrate", duration: 100, intensity: 1.0 },
        { type: "pause", duration: 50 },
        { type: "vibrate", duration: 100, intensity: 1.0 },
        { type: "pause", duration: 50 },
        { type: "vibrate", duration: 100, intensity: 1.0 }
      ],
      repeat: false,
      description: "Urgent alert"
    }],
    ["scroll", {
      name: "scroll",
      segments: [
        { type: "vibrate", duration: 30, intensity: 0.3 }
      ],
      repeat: false,
      description: "Scroll position change"
    }],
    ["heading", {
      name: "heading",
      segments: [
        { type: "vibrate", duration: 80, intensity: 0.6 },
        { type: "pause", duration: 30 },
        { type: "vibrate", duration: 80, intensity: 0.6 }
      ],
      repeat: false,
      description: "Heading navigation"
    }],
    ["link", {
      name: "link",
      segments: [
        { type: "vibrate", duration: 60, intensity: 0.5 }
      ],
      repeat: false,
      description: "Link detection"
    }],
    ["button", {
      name: "button",
      segments: [
        { type: "vibrate", duration: 80, intensity: 0.7 }
      ],
      repeat: false,
      description: "Button activation"
    }],
    ["form", {
      name: "form",
      segments: [
        { type: "vibrate", duration: 50, intensity: 0.4 }
      ],
      repeat: false,
      description: "Form field focus"
    }],
    ["menu", {
      name: "menu",
      segments: [
        { type: "vibrate", duration: 100, intensity: 0.6 }
      ],
      repeat: false,
      description: "Menu item"
    }],
    ["slider", {
      name: "slider",
      segments: [
        { type: "vibrate", duration: 25, intensity: 0.5 }
      ],
      repeat: false,
      description: "Slider value change"
    }],
    ["drag", {
      name: "drag",
      segments: [
        { type: "vibrate", duration: 40, intensity: 0.4 }
      ],
      repeat: false,
      description: "Drag and drop"
    }],
    ["drop", {
      name: "drop",
      segments: [
        { type: "vibrate", duration: 80, intensity: 0.7 }
      ],
      repeat: false,
      description: "Drop action"
    }],
    ["tap", {
      name: "tap",
      segments: [
        { type: "vibrate", duration: 50, intensity: 0.6 }
      ],
      repeat: false,
      description: "Touch tap"
    }],
    ["double_tap", {
      name: "double_tap",
      segments: [
        { type: "vibrate", duration: 50, intensity: 0.6 },
        { type: "pause", duration: 80 },
        { type: "vibrate", duration: 50, intensity: 0.6 }
      ],
      repeat: false,
      description: "Double tap"
    }],
    ["long_press", {
      name: "long_press",
      segments: [
        { type: "vibrate", duration: 200, intensity: 0.7 }
      ],
      repeat: false,
      description: "Long press"
    }],
    ["swipe_left", {
      name: "swipe_left",
      segments: [
        { type: "vibrate", duration: 30, intensity: 0.5 },
        { type: "pause", duration: 50 },
        { type: "vibrate", duration: 30, intensity: 0.5 },
        { type: "pause", duration: 50 },
        { type: "vibrate", duration: 30, intensity: 0.5 }
      ],
      repeat: false,
      description: "Swipe left"
    }],
    ["swipe_right", {
      name: "swipe_right",
      segments: [
        { type: "vibrate", duration: 30, intensity: 0.5 },
        { type: "pause", duration: 50 },
        { type: "vibrate", duration: 30, intensity: 0.5 },
        { type: "pause", duration: 50 },
        { type: "vibrate", duration: 30, intensity: 0.5 }
      ],
      repeat: false,
      description: "Swipe right"
    }]
  ]);

  // Initialize
  async initialize(config: {
    profile: AccessibilityProfile | null;
    settings: any;
  }): Promise<void> {
    this.profile = config.profile;

    if (config.profile) {
      this.config = {
        enabled: true,
        intensity: config.profile.deafblind?.hapticIntensity || 0.8,
        duration: config.profile.deafblind?.hapticDuration || 100,
        patterns: true,
        vibrationApi: this.checkVibrationSupport()
      };
    }
  }

  // Check vibration support
  private checkVibrationSupport(): boolean {
    return typeof navigator !== "undefined" && "vibrate" in navigator;
  }

  // Check availability
  isAvailable(): boolean {
    return this.checkVibrationSupport();
  }

  // Enable haptic feedback
  enable(profile: AccessibilityProfile): void {
    this.config = {
      enabled: true,
      intensity: profile.deafblind?.hapticIntensity || 0.8,
      duration: profile.deafblind?.hapticDuration || 100,
      patterns: true,
      vibrationApi: this.checkVibrationSupport()
    };
  }

  // Disable haptic feedback
  disable(): void {
    this.stop();
    this.config = null;
  }

  // Set configuration
  setConfig(config: Partial<HapticConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Get configuration
  getConfig(): HapticConfig | null {
    return this.config;
  }

  // Play predefined pattern
  play(patternName: string): void {
    const pattern = this.defaultPatterns.get(patternName);
    if (pattern) {
      this.playPattern(pattern);
    } else {
      // Default single vibration
      this.vibrate(this.config?.duration || 100, this.config?.intensity || 0.8);
    }
  }

  // Play custom pattern
  playPattern(pattern: HapticPattern): void {
    if (!this.config?.enabled) return;

    this.currentPattern = pattern;
    this.currentSegmentIndex = 0;
    this.setState("playing");

    this.executeNextSegment();
  }

  // Execute next segment in pattern
  private executeNextSegment(): void {
    if (!this.currentPattern || this.currentSegmentIndex >= this.currentPattern.segments.length) {
      // Pattern complete
      if (this.currentPattern.repeat) {
        this.currentSegmentIndex = 0;
        this.executeNextSegment();
      } else {
        this.setState("idle");
        this.notifyPatternListeners(null);
      }
      return;
    }

    const segment = this.currentPattern.segments[this.currentSegmentIndex];

    if (segment.type === "vibrate") {
      const intensity = (segment.intensity || 0.8) * (this.config?.intensity || 1);
      const duration = segment.duration || 100;
      this.vibrate(duration, intensity);

      this.vibrationTimeout = setTimeout(() => {
        this.currentSegmentIndex++;
        this.executeNextSegment();
      }, duration);
    } else if (segment.type === "pause") {
      this.vibrationTimeout = setTimeout(() => {
        this.currentSegmentIndex++;
        this.executeNextSegment();
      }, segment.duration || 0);
    } else if (segment.type === "intensity") {
      // Intensity change doesn't vibrate
      this.currentSegmentIndex++;
      this.executeNextSegment();
    }
  }

  // Vibrate with intensity (simulated via duration/pattern)
  private vibrate(duration: number, intensity: number): void {
    if (!this.config?.vibrationApi || typeof navigator === "undefined") return;

    // Convert intensity to vibration pattern
    // Higher intensity = longer vibration, lower = shorter pulses
    const adjustedDuration = duration * intensity;

    // Use simple vibration pattern
    if (navigator.vibrate) {
      navigator.vibrate(adjustedDuration);
    }
  }

  // Stop vibration
  stop(): void {
    if (this.vibrationTimeout) {
      clearTimeout(this.vibrationTimeout);
      this.vibrationTimeout = null;
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(0);
    }

    this.currentPattern = null;
    this.currentSegmentIndex = 0;
    this.setState("idle");
    this.notifyPatternListeners(null);
  }

  // Pause
  pause(): void {
    if (this.state === "playing") {
      this.setState("paused");
      if (this.vibrationTimeout) {
        clearTimeout(this.vibrationTimeout);
        this.vibrationTimeout = null;
      }
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(0);
      }
    }
  }

  // Resume
  resume(): void {
    if (this.state === "paused") {
      this.setState("playing");
      this.executeNextSegment();
    }
  }

  // Get available patterns
  getPatterns(): HapticPattern[] {
    return Array.from(this.defaultPatterns.values());
  }

  // Get pattern by name
  getPattern(name: string): HapticPattern | undefined {
    return this.defaultPatterns.get(name);
  }

  // Register custom pattern
  registerPattern(pattern: HapticPattern): void {
    this.defaultPatterns.set(pattern.name, pattern);
  }

  // Unregister pattern
  unregisterPattern(name: string): void {
    this.defaultPatterns.delete(name);
  }

  // Navigation feedback
  feedbackNavigate(): void {
    this.play("navigate");
  }

  // Selection feedback
  feedbackSelect(): void {
    this.play("select");
  }

  // Success feedback
  feedbackSuccess(): void {
    this.play("success");
  }

  // Error feedback
  feedbackError(): void {
    this.play("error");
  }

  // Warning feedback
  feedbackWarning(): void {
    this.play("warning");
  }

  // Alert feedback
  feedbackAlert(): void {
    this.play("alert");
  }

  // Scroll feedback
  feedbackScroll(): void {
    this.play("scroll");
  }

  // Heading feedback
  feedbackHeading(): void {
    this.play("heading");
  }

  // Link feedback
  feedbackLink(): void {
    this.play("link");
  }

  // Button feedback
  feedbackButton(): void {
    this.play("button");
  }

  // Form field feedback
  feedbackForm(): void {
    this.play("form");
  }

  // Menu feedback
  feedbackMenu(): void {
    this.play("menu");
  }

  // Custom vibration
  vibrateCustom(duration: number, intensity?: number): void {
    this.vibrate(duration, intensity || this.config?.intensity || 0.8);
  }

  // Get state
  getState(): HapticFeedbackState {
    return this.state;
  }

  private setState(state: HapticFeedbackState): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  // Subscribe to state changes
  subscribe(listener: (state: HapticFeedbackState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to pattern changes
  subscribeToPatterns(listener: (pattern: HapticPattern | null) => void): () => void {
    this.patternListeners.add(listener);
    return () => this.patternListeners.delete(listener);
  }

  // Notify pattern listeners
  private notifyPatternListeners(pattern: HapticPattern | null): void {
    for (const listener of this.patternListeners) {
      listener(pattern);
    }
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.patternListeners.clear();
  }
}

// Export singleton
export const hapticFeedbackEngine = new HapticFeedbackEngine();
