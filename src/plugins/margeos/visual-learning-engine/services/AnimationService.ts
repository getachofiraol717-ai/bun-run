// @ts-nocheck
// Visual Learning Engine — Animation Service
// Provides animation playback and control

import { ProcessAnimationGenerator } from "../core/ProcessAnimationGenerator";
import type { Animation, AnimationFrame, AnimationPlayback, AnimationType } from "../models/Animation";

export type PlaybackState = "playing" | "paused" | "stopped";

export interface AnimationState {
  id: string;
  state: PlaybackState;
  currentFrame: number;
  currentTime: number;
  playbackRate: number;
  loop: boolean;
  muted: boolean;
  volume: number;
}

export class AnimationService {
  private animationGenerator: ProcessAnimationGenerator;
  private activeAnimations: Map<string, AnimationState> = new Map();
  private animationCallbacks: Map<string, Set<(state: AnimationState) => void>> = new Map();

  constructor() {
    this.animationGenerator = new ProcessAnimationGenerator();
  }

  /**
   * Generate animation from process steps
   */
  async generateAnimation(input: {
    title: string;
    steps: { id: string; label: string; duration?: number }[];
    options?: {
      type?: AnimationType;
      autoPlay?: boolean;
      loop?: boolean;
    };
  }): Promise<Animation> {
    const frames: AnimationFrame[] = input.steps.map((step, index) => ({
      frameNumber: index,
      timestamp: index * (step.duration || 2000),
      elements: [],
      annotations: [],
      captions: [step.label]
    }));

    return this.animationGenerator.generate({
      title: input.title,
      frames
    });
  }

  /**
   * Start animation playback
   */
  startAnimation(animationId: string, initialState?: Partial<AnimationState>): void {
    const state: AnimationState = {
      id: animationId,
      state: "playing",
      currentFrame: 0,
      currentTime: 0,
      playbackRate: 1,
      loop: false,
      muted: false,
      volume: 1,
      ...initialState
    };

    this.activeAnimations.set(animationId, state);
    this.notifyStateChange(state);
  }

  /**
   * Pause animation
   */
  pauseAnimation(animationId: string): void {
    const state = this.activeAnimations.get(animationId);
    if (state && state.state === "playing") {
      state.state = "paused";
      this.notifyStateChange(state);
    }
  }

  /**
   * Resume animation
   */
  resumeAnimation(animationId: string): void {
    const state = this.activeAnimations.get(animationId);
    if (state && state.state === "paused") {
      state.state = "playing";
      this.notifyStateChange(state);
    }
  }

  /**
   * Stop animation
   */
  stopAnimation(animationId: string): void {
    const state = this.activeAnimations.get(animationId);
    if (state) {
      state.state = "stopped";
      state.currentFrame = 0;
      state.currentTime = 0;
      this.notifyStateChange(state);
    }
  }

  /**
   * Seek to specific frame
   */
  seekToFrame(animationId: string, frame: number): void {
    const state = this.activeAnimations.get(animationId);
    if (state) {
      state.currentFrame = frame;
      this.notifyStateChange(state);
    }
  }

  /**
   * Seek to specific time
   */
  seekToTime(animationId: string, time: number): void {
    const state = this.activeAnimations.get(animationId);
    if (state) {
      state.currentTime = time;
      this.notifyStateChange(state);
    }
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(animationId: string, rate: number): void {
    const state = this.activeAnimations.get(animationId);
    if (state) {
      state.playbackRate = Math.max(0.25, Math.min(4, rate));
      this.notifyStateChange(state);
    }
  }

  /**
   * Toggle loop
   */
  toggleLoop(animationId: string): void {
    const state = this.activeAnimations.get(animationId);
    if (state) {
      state.loop = !state.loop;
      this.notifyStateChange(state);
    }
  }

  /**
   * Set volume
   */
  setVolume(animationId: string, volume: number): void {
    const state = this.activeAnimations.get(animationId);
    if (state) {
      state.volume = Math.max(0, Math.min(1, volume));
      state.muted = volume === 0;
      this.notifyStateChange(state);
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(animationId: string): void {
    const state = this.activeAnimations.get(animationId);
    if (state) {
      state.muted = !state.muted;
      this.notifyStateChange(state);
    }
  }

  /**
   * Get animation state
   */
  getAnimationState(animationId: string): AnimationState | undefined {
    return this.activeAnimations.get(animationId);
  }

  /**
   * Subscribe to animation state changes
   */
  subscribe(animationId: string, callback: (state: AnimationState) => void): () => void {
    if (!this.animationCallbacks.has(animationId)) {
      this.animationCallbacks.set(animationId, new Set());
    }
    this.animationCallbacks.get(animationId)!.add(callback);

    return () => {
      this.animationCallbacks.get(animationId)?.delete(callback);
    };
  }

  /**
   * Notify state change to subscribers
   */
  private notifyStateChange(state: AnimationState): void {
    const callbacks = this.animationCallbacks.get(state.id);
    if (callbacks) {
      callbacks.forEach(cb => cb(state));
    }
  }

  /**
   * Get animation types
   */
  getAnimationTypes(): AnimationType[] {
    return ["process", "sequence", "transformation", "comparison", "revelation", "highlight"];
  }

  /**
   * Clean up animation
   */
  cleanup(animationId: string): void {
    this.activeAnimations.delete(animationId);
    this.animationCallbacks.delete(animationId);
  }

  /**
   * Get active animation count
   */
  getActiveCount(): number {
    return this.activeAnimations.size;
  }
}

// Export singleton instance
export const animationService = new AnimationService();
