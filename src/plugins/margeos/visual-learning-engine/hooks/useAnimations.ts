// @ts-nocheck
// Visual Learning Engine — useAnimations hook
// Hook for animation playback and control

import { useState, useCallback, useEffect, useRef } from "react";
import { ProcessAnimationGenerator } from "../core/ProcessAnimationGenerator";
import type { Animation, AnimationFrame, AnimationPlayback } from "../models/Animation";

export type AnimationState = "playing" | "paused" | "stopped";

export interface UseAnimationsOptions {
  autoPlay?: boolean;
  loop?: boolean;
  playbackRate?: number;
}

export interface UseAnimationsResult {
  // State
  loading: boolean;
  error: string | null;
  animations: Animation[];
  currentAnimation: Animation | null;
  state: AnimationState;
  currentFrameIndex: number;
  currentTime: number;
  playbackRate: number;
  loop: boolean;
  volume: number;
  muted: boolean;

  // Actions
  createAnimation: (input: {
    title: string;
    frames: AnimationFrame[];
  }) => Promise<Animation | null>;

  loadAnimation: (id: string) => Animation | null;
  deleteAnimation: (id: string) => void;

  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlayPause: () => void;
  seekToFrame: (frame: number) => void;
  seekToTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // Frame info
  getCurrentFrame: () => AnimationFrame | null;
  getFrameCount: () => number;
  getDuration: () => number;
}

export function useAnimations(options?: UseAnimationsOptions): UseAnimationsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animations, setAnimations] = useState<Animation[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<Animation | null>(null);
  const [state, setState] = useState<AnimationState>("stopped");
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(options?.playbackRate ?? 1);
  const [loop, setLoop] = useState(options?.loop ?? false);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);

  const animationGenerator = useState(() => new ProcessAnimationGenerator())[0];
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Create animation
  const createAnimation = useCallback(async (input: {
    title: string;
    frames: AnimationFrame[];
  }): Promise<Animation | null> => {
    setLoading(true);
    setError(null);

    try {
      const animation = await animationGenerator.generate(input);

      setAnimations(prev => [...prev, animation]);
      setCurrentAnimation(animation);
      setCurrentFrameIndex(0);
      setCurrentTime(0);
      setState("stopped");

      if (options?.autoPlay) {
        setTimeout(() => play(), 100);
      }

      return animation;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create animation");
      return null;
    } finally {
      setLoading(false);
    }
  }, [animationGenerator, options?.autoPlay]);

  // Load animation from list
  const loadAnimation = useCallback((id: string): Animation | null => {
    stop(); // Stop current animation first
    const found = animations.find(a => a.id === id);
    if (found) {
      setCurrentAnimation(found);
      setCurrentFrameIndex(0);
      setCurrentTime(0);
      setState("stopped");
      return found;
    }
    return null;
  }, [animations]);

  // Delete animation
  const deleteAnimation = useCallback((id: string) => {
    if (currentAnimation?.id === id) {
      stop();
      setCurrentAnimation(null);
    }
    setAnimations(prev => prev.filter(a => a.id !== id));
  }, [currentAnimation]);

  // Animation loop
  useEffect(() => {
    if (state !== "playing" || !currentAnimation) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const delta = (timestamp - lastTimeRef.current) * playbackRate;
      lastTimeRef.current = timestamp;

      const duration = currentAnimation.duration ||
        (currentAnimation.frames.length * 2000);
      const newTime = currentTime + delta;

      if (newTime >= duration) {
        if (loop) {
          setCurrentTime(0);
          setCurrentFrameIndex(0);
        } else {
          setCurrentTime(duration);
          setState("stopped");
          return;
        }
      } else {
        setCurrentTime(newTime);

        // Update frame index
        const frameDuration = duration / currentAnimation.frames.length;
        const newFrameIndex = Math.min(
          Math.floor(newTime / frameDuration),
          currentAnimation.frames.length - 1
        );
        setCurrentFrameIndex(newFrameIndex);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, currentAnimation, loop, playbackRate, currentTime]);

  // Play
  const play = useCallback(() => {
    if (!currentAnimation) return;
    lastTimeRef.current = 0;
    setState("playing");
  }, [currentAnimation]);

  // Pause
  const pause = useCallback(() => {
    setState("paused");
  }, []);

  // Stop
  const stop = useCallback(() => {
    setState("stopped");
    setCurrentTime(0);
    setCurrentFrameIndex(0);
    lastTimeRef.current = 0;
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (state === "playing") {
      pause();
    } else {
      play();
    }
  }, [state, play, pause]);

  // Seek to frame
  const seekToFrame = useCallback((frame: number) => {
    if (!currentAnimation) return;
    if (frame >= 0 && frame < currentAnimation.frames.length) {
      setCurrentFrameIndex(frame);
      const frameDuration = (currentAnimation.duration || 2000 * currentAnimation.frames.length) / currentAnimation.frames.length;
      setCurrentTime(frame * frameDuration);
    }
  }, [currentAnimation]);

  // Seek to time
  const seekToTime = useCallback((time: number) => {
    if (!currentAnimation) return;
    const duration = currentAnimation.duration || 2000 * currentAnimation.frames.length;
    const clampedTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(clampedTime);

    const frameDuration = duration / currentAnimation.frames.length;
    const newFrameIndex = Math.min(
      Math.floor(clampedTime / frameDuration),
      currentAnimation.frames.length - 1
    );
    setCurrentFrameIndex(newFrameIndex);
  }, [currentAnimation]);

  // Set playback rate
  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(Math.max(0.25, Math.min(4, rate)));
  }, []);

  // Toggle loop
  const toggleLoop = useCallback(() => {
    setLoop(prev => !prev);
  }, []);

  // Set volume
  const setVolume = useCallback((vol: number) => {
    setVolumeState(Math.max(0, Math.min(1, vol)));
    if (vol > 0) setMuted(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  // Get current frame
  const getCurrentFrame = useCallback((): AnimationFrame | null => {
    if (!currentAnimation) return null;
    return currentAnimation.frames[currentFrameIndex] || null;
  }, [currentAnimation, currentFrameIndex]);

  // Get frame count
  const getFrameCount = useCallback((): number => {
    return currentAnimation?.frames.length || 0;
  }, [currentAnimation]);

  // Get duration
  const getDuration = useCallback((): number => {
    return currentAnimation?.duration ||
      (currentAnimation?.frames.length || 0) * 2000;
  }, [currentAnimation]);

  return {
    loading,
    error,
    animations,
    currentAnimation,
    state,
    currentFrameIndex,
    currentTime,
    playbackRate,
    loop,
    volume,
    muted,
    createAnimation,
    loadAnimation,
    deleteAnimation,
    play,
    pause,
    stop,
    togglePlayPause,
    seekToFrame,
    seekToTime,
    setPlaybackRate,
    toggleLoop,
    setVolume,
    toggleMute,
    getCurrentFrame,
    getFrameCount,
    getDuration
  };
}
