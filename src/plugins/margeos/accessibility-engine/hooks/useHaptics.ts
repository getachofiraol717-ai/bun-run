// @ts-nocheck
// Accessibility Engine — useHaptics Hook
// React hook for haptic feedback functionality

import { useState, useEffect, useCallback, useRef } from "react";
import { hapticFeedbackEngine } from "../deafblind-support/HapticFeedbackEngine";
import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import type { HapticPattern } from "../deafblind-support/HapticFeedbackEngine";

export interface UseHapticsOptions {
  profile?: AccessibilityProfile | null;
  autoStart?: boolean;
  intensity?: number;
}

export interface UseHapticsReturn {
  // State
  isEnabled: boolean;
  isAvailable: boolean;
  state: "idle" | "playing" | "paused" | "error";
  currentPattern: HapticPattern | null;

  // Actions
  enable: () => void;
  disable: () => void;

  // Feedback patterns
  feedback: (pattern: string) => void;
  feedbackNavigate: () => void;
  feedbackSelect: () => void;
  feedbackSuccess: () => void;
  feedbackError: () => void;
  feedbackWarning: () => void;
  feedbackAlert: () => void;
  feedbackScroll: () => void;
  feedbackHeading: () => void;
  feedbackLink: () => void;
  feedbackButton: () => void;
  feedbackForm: () => void;
  feedbackMenu: () => void;

  // Custom
  vibrate: (duration: number, intensity?: number) => void;
  playPattern: (pattern: HapticPattern) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;

  // Pattern management
  getPatterns: () => HapticPattern[];
  registerPattern: (pattern: HapticPattern) => void;
  unregisterPattern: (name: string) => void;

  // Configuration
  setIntensity: (intensity: number) => void;
}

export function useHaptics(options: UseHapticsOptions = {}): UseHapticsReturn {
  const { profile, autoStart = true, intensity = 0.8 } = options;

  const [isEnabled, setIsEnabled] = useState(autoStart);
  const [isAvailable, setIsAvailable] = useState(false);
  const [state, setState] = useState<"idle" | "playing" | "paused" | "error">("idle");
  const [currentPattern, setCurrentPattern] = useState<HapticPattern | null>(null);

  const profileRef = useRef(profile);

  // Update profile ref
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Initialize
  useEffect(() => {
    if (profileRef.current) {
      hapticFeedbackEngine.initialize({
        profile: profileRef.current,
        settings: {}
      });

      setIsAvailable(hapticFeedbackEngine.isAvailable());
      setIsEnabled(profileRef.current.deafblind?.hapticEnabled ?? autoStart);
    }

    return () => {
      hapticFeedbackEngine.destroy();
    };
  }, [autoStart]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = hapticFeedbackEngine.subscribe((newState) => {
      setState(newState);
      if (newState === "idle") {
        setCurrentPattern(null);
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to pattern changes
  useEffect(() => {
    const unsubscribe = hapticFeedbackEngine.subscribeToPatterns((pattern) => {
      setCurrentPattern(pattern);
    });

    return unsubscribe;
  }, []);

  // Enable
  const enable = useCallback(() => {
    if (profileRef.current) {
      hapticFeedbackEngine.enable(profileRef.current);
    }
    setIsEnabled(true);
  }, []);

  // Disable
  const disable = useCallback(() => {
    hapticFeedbackEngine.disable();
    setIsEnabled(false);
    setState("idle");
  }, []);

  // Feedback patterns
  const feedback = useCallback((pattern: string) => {
    if (isEnabled) {
      hapticFeedbackEngine.play(pattern);
    }
  }, [isEnabled]);

  const feedbackNavigate = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackNavigate();
  }, [isEnabled]);

  const feedbackSelect = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackSelect();
  }, [isEnabled]);

  const feedbackSuccess = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackSuccess();
  }, [isEnabled]);

  const feedbackError = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackError();
  }, [isEnabled]);

  const feedbackWarning = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackWarning();
  }, [isEnabled]);

  const feedbackAlert = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackAlert();
  }, [isEnabled]);

  const feedbackScroll = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackScroll();
  }, [isEnabled]);

  const feedbackHeading = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackHeading();
  }, [isEnabled]);

  const feedbackLink = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackLink();
  }, [isEnabled]);

  const feedbackButton = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackButton();
  }, [isEnabled]);

  const feedbackForm = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackForm();
  }, [isEnabled]);

  const feedbackMenu = useCallback(() => {
    if (isEnabled) hapticFeedbackEngine.feedbackMenu();
  }, [isEnabled]);

  // Custom vibration
  const vibrate = useCallback((duration: number, hapticIntensity?: number) => {
    if (isEnabled) {
      hapticFeedbackEngine.vibrateCustom(duration, hapticIntensity);
    }
  }, [isEnabled]);

  // Play custom pattern
  const playPattern = useCallback((pattern: HapticPattern) => {
    if (isEnabled) {
      hapticFeedbackEngine.playPattern(pattern);
    }
  }, [isEnabled]);

  // Stop
  const stop = useCallback(() => {
    hapticFeedbackEngine.stop();
    setState("idle");
  }, []);

  // Pause
  const pause = useCallback(() => {
    hapticFeedbackEngine.pause();
  }, []);

  // Resume
  const resume = useCallback(() => {
    hapticFeedbackEngine.resume();
  }, []);

  // Pattern management
  const getPatterns = useCallback((): HapticPattern[] => {
    return hapticFeedbackEngine.getPatterns();
  }, []);

  const registerPattern = useCallback((pattern: HapticPattern) => {
    hapticFeedbackEngine.registerPattern(pattern);
  }, []);

  const unregisterPattern = useCallback((name: string) => {
    hapticFeedbackEngine.unregisterPattern(name);
  }, []);

  // Configuration
  const setIntensity = useCallback((newIntensity: number) => {
    hapticFeedbackEngine.setConfig({ intensity: newIntensity });
  }, []);

  return {
    isEnabled,
    isAvailable,
    state,
    currentPattern,
    enable,
    disable,
    feedback,
    feedbackNavigate,
    feedbackSelect,
    feedbackSuccess,
    feedbackError,
    feedbackWarning,
    feedbackAlert,
    feedbackScroll,
    feedbackHeading,
    feedbackLink,
    feedbackButton,
    feedbackForm,
    feedbackMenu,
    vibrate,
    playPattern,
    stop,
    pause,
    resume,
    getPatterns,
    registerPattern,
    unregisterPattern,
    setIntensity
  };
}
