// @ts-nocheck
// Accessibility Engine — useCaptions Hook
// React hook for caption functionality

import { useState, useEffect, useCallback, useRef } from "react";
import { captionService, CaptionService } from "../services/CaptionService";
import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import type { Caption, CaptionStyle, CaptionCue } from "../models/Caption";

export interface UseCaptionsOptions {
  profile?: AccessibilityProfile | null;
  autoStart?: boolean;
  position?: "bottom" | "top" | "overlay";
  style?: CaptionStyle;
}

export interface UseCaptionsReturn {
  // State
  isEnabled: boolean;
  isVisible: boolean;
  currentCaption: Caption | null;
  allCaptions: Caption[];
  config: {
    position: "bottom" | "top" | "overlay";
    style: CaptionStyle;
    maxLines: number;
    autoHide: boolean;
  };

  // Actions
  enable: () => void;
  disable: () => void;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  setStyle: (style: CaptionStyle) => void;
  setPosition: (position: "bottom" | "top" | "overlay") => void;

  // Caption management
  loadCaptions: (cues: CaptionCue[]) => void;
  addCaption: (cue: CaptionCue) => void;
  removeCaption: (id: string) => void;
  clearCaptions: () => void;
  seekTo: (time: number) => void;

  // Export
  exportAsSRT: () => string;
}

export function useCaptions(options: UseCaptionsOptions = {}): UseCaptionsReturn {
  const { profile, autoStart = false, position = "bottom", style = "default" } = options;

  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(autoStart);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const [allCaptions, setAllCaptions] = useState<Caption[]>([]);
  const [config, setConfig] = useState({
    position,
    style,
    maxLines: 2,
    autoHide: true
  });

  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const profileRef = useRef(profile);

  // Update profile ref
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  // Initialize
  useEffect(() => {
    if (profileRef.current) {
      captionService.initialize(profileRef.current);
      setIsEnabled(profileRef.current.caption?.enabled ?? false);

      if (profileRef.current.caption) {
        setConfig({
          position: profileRef.current.caption.position || "bottom",
          style: profileRef.current.caption.style || "default",
          maxLines: profileRef.current.caption.maxLines || 2,
          autoHide: profileRef.current.caption.autoHide ?? true
        });
      }
    }

    return () => {
      captionService.destroy();
    };
  }, []);

  // Subscribe to caption changes
  useEffect(() => {
    const unsubscribe = captionService.subscribe((caption) => {
      setCurrentCaption(caption);
    });

    return unsubscribe;
  }, []);

  // Time update loop
  const updateCaptions = useCallback(() => {
    if (!mediaRef.current || !isEnabled) return;

    const currentTime = mediaRef.current.currentTime * 1000; // Convert to ms
    const caption = captionService.getCaptionAtTime(currentTime);

    if (caption !== currentCaption) {
      captionService.setActiveCaption(caption);
    }

    animationRef.current = requestAnimationFrame(updateCaptions);
  }, [isEnabled, currentCaption]);

  // Start/stop update loop
  useEffect(() => {
    if (isEnabled && mediaRef.current) {
      animationRef.current = requestAnimationFrame(updateCaptions);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isEnabled, updateCaptions]);

  // Enable
  const enable = useCallback(() => {
    setIsEnabled(true);
    setIsVisible(true);
    if (profileRef.current?.caption) {
      profileRef.current.caption.enabled = true;
    }
  }, []);

  // Disable
  const disable = useCallback(() => {
    setIsEnabled(false);
    captionService.clear();
  }, []);

  // Show
  const show = useCallback(() => {
    setIsVisible(true);
  }, []);

  // Hide
  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Toggle
  const toggle = useCallback(() => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }, [isVisible, show, hide]);

  // Set style
  const setStyle = useCallback((newStyle: CaptionStyle) => {
    setConfig(prev => ({ ...prev, style: newStyle }));
    captionService.setConfig({ style: newStyle });
  }, []);

  // Set position
  const setPosition = useCallback((newPosition: "bottom" | "top" | "overlay") => {
    setConfig(prev => ({ ...prev, position: newPosition }));
    captionService.setConfig({ position: newPosition });
  }, []);

  // Load captions
  const loadCaptions = useCallback((cues: CaptionCue[]) => {
    captionService.loadCaptions(cues);
    setAllCaptions(captionService.getAllCaptions());
  }, []);

  // Add caption
  const addCaption = useCallback((cue: CaptionCue) => {
    captionService.addCue(cue);
    setAllCaptions(captionService.getAllCaptions());
  }, []);

  // Remove caption
  const removeCaption = useCallback((id: string) => {
    const captions = captionService.getAllCaptions();
    const filtered = captions.filter(c => c.id !== id);
    captionService.clear();
    filtered.forEach(c => captionService.addCue({
      id: c.id,
      startTime: c.startTime,
      endTime: c.endTime,
      text: c.text
    }));
    setAllCaptions(captionService.getAllCaptions());
  }, []);

  // Clear captions
  const clearCaptions = useCallback(() => {
    captionService.clear();
    setAllCaptions([]);
    setCurrentCaption(null);
  }, []);

  // Seek to time
  const seekTo = useCallback((time: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = time / 1000;
    }
    const caption = captionService.getCaptionAtTime(time);
    captionService.setActiveCaption(caption);
  }, []);

  // Export as SRT
  const exportAsSRT = useCallback((): string => {
    return captionService.exportAsSRT();
  }, []);

  // Bind to media element
  const bindMedia = useCallback((media: HTMLMediaElement) => {
    mediaRef.current = media;
  }, []);

  return {
    isEnabled,
    isVisible,
    currentCaption,
    allCaptions,
    config,
    enable,
    disable,
    show,
    hide,
    toggle,
    setStyle,
    setPosition,
    loadCaptions,
    addCaption,
    removeCaption,
    clearCaptions,
    seekTo,
    exportAsSRT
  };
}
