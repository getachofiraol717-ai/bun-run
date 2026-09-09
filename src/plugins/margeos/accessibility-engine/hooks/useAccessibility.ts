// @ts-nocheck
// Accessibility Engine — useAccessibility Hook
// Main React hook for accessibility functionality

import { useState, useEffect, useCallback, useRef } from "react";
import { accessibilityEngine } from "../core/AccessibilityEngine";
import { accessibilityStore } from "../store/accessibilityStore";
import type { AccessibilityProfile, AccessibilityProfileType } from "../models/AccessibilityProfile";
import type { AccessibilitySettings } from "../models/AccessibilitySettings";

export interface UseAccessibilityOptions {
  autoInitialize?: boolean;
  defaultProfileType?: AccessibilityProfileType;
}

export interface UseAccessibilityReturn {
  // State
  isInitialized: boolean;
  isEnabled: boolean;
  currentProfile: AccessibilityProfile | null;
  settings: AccessibilitySettings | null;
  features: {
    captions: boolean;
    voiceNavigation: boolean;
    signLanguage: boolean;
    braille: boolean;
    haptic: boolean;
    highContrast: boolean;
  };

  // Actions
  initialize: (profileType?: AccessibilityProfileType) => Promise<void>;
  enable: () => void;
  disable: () => void;
  setProfile: (profile: AccessibilityProfile) => void;
  updateProfile: (updates: Partial<AccessibilityProfile>) => void;
  applyPreset: (preset: AccessibilityProfileType) => void;
  toggleFeature: (feature: string) => void;
  transformContent: (content: string, type?: string) => string;
  getContentForAccessibility: (content: any) => any;
}

export function useAccessibility(options: UseAccessibilityOptions = {}): UseAccessibilityReturn {
  const { autoInitialize = true, defaultProfileType = "custom" } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<AccessibilityProfile | null>(null);
  const [settings, setSettings] = useState<AccessibilitySettings | null>(null);
  const initializedRef = useRef(false);

  // Get features state from store
  const features = {
    captions: currentProfile?.caption?.enabled ?? false,
    voiceNavigation: currentProfile?.motor?.voiceControlEnabled ?? false,
    signLanguage: currentProfile?.deaf?.signLanguageEnabled ?? false,
    braille: currentProfile?.deafblind?.brailleEnabled ?? false,
    haptic: currentProfile?.deafblind?.hapticEnabled ?? false,
    highContrast: currentProfile?.visual?.highContrastEnabled ?? false
  };

  // Initialize
  const initialize = useCallback(async (profileType?: AccessibilityProfileType) => {
    if (initializedRef.current) return;

    try {
      await accessibilityEngine.initialize();
      const profile = await accessibilityEngine.applyProfile(profileType || defaultProfileType);
      const currentSettings = accessibilityEngine.getSettings();

      setCurrentProfile(profile);
      setSettings(currentSettings);
      setIsEnabled(true);
      setIsInitialized(true);
      initializedRef.current = true;
    } catch (error) {
      console.error("Failed to initialize accessibility:", error);
    }
  }, [defaultProfileType]);

  // Enable
  const enable = useCallback(() => {
    accessibilityEngine.enable();
    setIsEnabled(true);
  }, []);

  // Disable
  const disable = useCallback(() => {
    accessibilityEngine.disable();
    setIsEnabled(false);
  }, []);

  // Set profile
  const setProfile = useCallback((profile: AccessibilityProfile) => {
    accessibilityEngine.applyProfile(profile);
    setCurrentProfile(profile);
  }, []);

  // Update profile
  const updateProfile = useCallback((updates: Partial<AccessibilityProfile>) => {
    if (currentProfile) {
      const updatedProfile = { ...currentProfile, ...updates };
      accessibilityEngine.applyProfile(updatedProfile);
      setCurrentProfile(updatedProfile);
    }
  }, [currentProfile]);

  // Apply preset
  const applyPreset = useCallback((preset: AccessibilityProfileType) => {
    accessibilityEngine.applyProfile(preset).then(profile => {
      setCurrentProfile(profile);
    });
  }, []);

  // Toggle feature
  const toggleFeature = useCallback((feature: string) => {
    if (!currentProfile) return;

    const updatedProfile = { ...currentProfile };

    switch (feature) {
      case "captions":
        if (updatedProfile.caption) {
          updatedProfile.caption.enabled = !updatedProfile.caption.enabled;
        }
        break;
      case "voiceNavigation":
        if (updatedProfile.motor) {
          updatedProfile.motor.voiceControlEnabled = !updatedProfile.motor.voiceControlEnabled;
        }
        break;
      case "signLanguage":
        if (updatedProfile.deaf) {
          updatedProfile.deaf.signLanguageEnabled = !updatedProfile.deaf.signLanguageEnabled;
        }
        break;
      case "braille":
        if (updatedProfile.deafblind) {
          updatedProfile.deafblind.brailleEnabled = !updatedProfile.deafblind.brailleEnabled;
        }
        break;
      case "haptic":
        if (updatedProfile.deafblind) {
          updatedProfile.deafblind.hapticEnabled = !updatedProfile.deafblind.hapticEnabled;
        }
        break;
      case "highContrast":
        if (updatedProfile.visual) {
          updatedProfile.visual.highContrastEnabled = !updatedProfile.visual.highContrastEnabled;
        }
        break;
    }

    setCurrentProfile(updatedProfile);
    accessibilityEngine.applyProfile(updatedProfile);
  }, [currentProfile]);

  // Transform content
  const transformContent = useCallback((content: string, type?: string): string => {
    return accessibilityEngine.transformContent(content, type);
  }, []);

  // Get content for accessibility
  const getContentForAccessibility = useCallback((content: any): any => {
    return accessibilityEngine.getContentForAccessibility(content);
  }, []);

  // Auto-initialize
  useEffect(() => {
    if (autoInitialize && !initializedRef.current) {
      initialize();
    }
  }, [autoInitialize, initialize]);

  // Cleanup
  useEffect(() => {
    return () => {
      // No cleanup needed for singleton engine
    };
  }, []);

  return {
    isInitialized,
    isEnabled,
    currentProfile,
    settings,
    features,
    initialize,
    enable,
    disable,
    setProfile,
    updateProfile,
    applyPreset,
    toggleFeature,
    transformContent,
    getContentForAccessibility
  };
}
