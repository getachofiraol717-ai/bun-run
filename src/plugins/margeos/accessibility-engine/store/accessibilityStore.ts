// @ts-nocheck
// Accessibility Engine — Accessibility Store
// Zustand-like state management for accessibility

import type { AccessibilityProfile, AccessibilityProfileType } from "../models/AccessibilityProfile";
import type { AccessibilitySettings } from "../models/AccessibilitySettings";
import type { AccessibilitySession } from "../models/AccessibilitySession";
import { createDefaultProfile } from "../models/AccessibilityProfile";

export interface AccessibilityState {
  // Initialization
  isInitialized: boolean;
  isEnabled: boolean;

  // Profile
  currentProfile: AccessibilityProfile | null;
  profiles: AccessibilityProfile[];
  lastUpdated: number;

  // Settings
  settings: AccessibilitySettings | null;

  // Session
  currentSession: AccessibilitySession | null;

  // Feature flags
  features: {
    captions: boolean;
    voiceNavigation: boolean;
    signLanguage: boolean;
    braille: boolean;
    haptic: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };

  // Device capabilities
  capabilities: {
    audio: boolean;
    speechSynthesis: boolean;
    speechRecognition: boolean;
    touch: boolean;
    haptics: boolean;
    braille: boolean;
    keyboard: boolean;
    mouse: boolean;
  };
}

export type AccessibilityActions = {
  // Initialization
  initialize: () => Promise<void>;
  enable: () => void;
  disable: () => void;

  // Profile management
  setProfile: (profile: AccessibilityProfile) => void;
  createProfile: (type: AccessibilityProfileType, name?: string) => AccessibilityProfile;
  updateProfile: (updates: Partial<AccessibilityProfile>) => void;
  deleteProfile: (id: string) => void;
  loadProfiles: () => void;
  saveProfiles: () => void;

  // Settings
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;

  // Session
  startSession: () => void;
  endSession: () => void;

  // Features
  toggleFeature: (feature: keyof AccessibilityState["features"]) => void;
  setFeature: (feature: keyof AccessibilityState["features"], enabled: boolean) => void;

  // Capabilities
  detectCapabilities: () => void;
};

export type AccessibilityStore = AccessibilityState & AccessibilityActions;

const STORAGE_KEY = "margeos_accessibility_state";

// Create store instance
function createAccessibilityStore() {
  // Initial state
  const initialState: AccessibilityState = {
    isInitialized: false,
    isEnabled: false,
    currentProfile: null,
    profiles: [],
    lastUpdated: Date.now(),
    settings: null,
    currentSession: null,
    features: {
      captions: false,
      voiceNavigation: false,
      signLanguage: false,
      braille: false,
      haptic: false,
      highContrast: false,
      screenReader: false
    },
    capabilities: {
      audio: true,
      speechSynthesis: false,
      speechRecognition: false,
      touch: false,
      haptics: false,
      braille: false,
      keyboard: true,
      mouse: true
    }
  };

  // Store state
  let state: AccessibilityState = { ...initialState };

  // Subscribers
  const subscribers: Set<(state: AccessibilityState) => void> = new Set();

  // Get state
  const getState = (): AccessibilityState => state;

  // Set state
  const setState = (updates: Partial<AccessibilityState>) => {
    state = { ...state, ...updates, lastUpdated: Date.now() };
    notifySubscribers();
  };

  // Notify subscribers
  const notifySubscribers = () => {
    for (const subscriber of subscribers) {
      subscriber(state);
    }
  };

  // Initialize
  const initialize = async () => {
    // Detect capabilities
    detectCapabilities();

    // Load from storage
    loadFromStorage();

    // Create default profile if none exist
    if (state.profiles.length === 0) {
      const defaultProfile = createDefaultProfile("custom");
      state.profiles = [defaultProfile];
    }

    // Set current profile if not set
    if (!state.currentProfile && state.profiles.length > 0) {
      state.currentProfile = state.profiles[0];
      updateFeaturesFromProfile();
    }

    state.isInitialized = true;
    setState({ isInitialized: true });
  };

  // Enable
  const enable = () => {
    state.isEnabled = true;
    setState({ isEnabled: true });
    saveToStorage();
  };

  // Disable
  const disable = () => {
    state.isEnabled = false;
    setState({ isEnabled: false });
    saveToStorage();
  };

  // Set profile
  const setProfile = (profile: AccessibilityProfile) => {
    state.currentProfile = profile;
    updateFeaturesFromProfile();
    setState({ currentProfile: profile });
    saveToStorage();
  };

  // Create profile
  const createProfile = (type: AccessibilityProfileType, name?: string): AccessibilityProfile => {
    const profile = createDefaultProfile(type);
    profile.id = `${type}-${Date.now()}`;
    if (name) profile.name = name;

    state.profiles.push(profile);
    setState({ profiles: [...state.profiles] });
    saveToStorage();

    return profile;
  };

  // Update profile
  const updateProfile = (updates: Partial<AccessibilityProfile>) => {
    if (!state.currentProfile) return;

    const updatedProfile = { ...state.currentProfile, ...updates };
    const index = state.profiles.findIndex(p => p.id === updatedProfile.id);

    if (index !== -1) {
      state.profiles[index] = updatedProfile;
    }

    state.currentProfile = updatedProfile;
    updateFeaturesFromProfile();
    setState({ currentProfile: updatedProfile, profiles: [...state.profiles] });
    saveToStorage();
  };

  // Delete profile
  const deleteProfile = (id: string) => {
    state.profiles = state.profiles.filter(p => p.id !== id);

    if (state.currentProfile?.id === id) {
      state.currentProfile = state.profiles[0] || null;
      updateFeaturesFromProfile();
    }

    setState({ profiles: [...state.profiles], currentProfile: state.currentProfile });
    saveToStorage();
  };

  // Load profiles from storage
  const loadProfiles = () => {
    loadFromStorage();
  };

  // Save profiles to storage
  const saveProfiles = () => {
    saveToStorage();
  };

  // Update settings
  const updateSettings = (settings: Partial<AccessibilitySettings>) => {
    if (state.settings) {
      state.settings = { ...state.settings, ...settings };
    } else {
      state.settings = settings as AccessibilitySettings;
    }
    setState({ settings: state.settings });
    saveToStorage();
  };

  // Start session
  const startSession = () => {
    if (state.currentProfile) {
      const session: AccessibilitySession = {
        id: `session-${Date.now()}`,
        userId: "current",
        profileId: state.currentProfile.id,
        startTime: new Date(),
        lastActivity: new Date(),
        featuresEnabled: Object.entries(state.features)
          .filter(([_, enabled]) => enabled)
          .map(([name]) => name),
        barriersEncountered: 0,
        barriersResolved: 0,
        contentViewed: 0,
        duration: 0
      };

      state.currentSession = session;
      setState({ currentSession: session });
    }
  };

  // End session
  const endSession = () => {
    if (state.currentSession) {
      state.currentSession.duration = Date.now() - state.currentSession.startTime.getTime();
    }
    state.currentSession = null;
    setState({ currentSession: null });
  };

  // Toggle feature
  const toggleFeature = (feature: keyof AccessibilityState["features"]) => {
    state.features[feature] = !state.features[feature];
    setState({ features: { ...state.features } });
    saveToStorage();
  };

  // Set feature
  const setFeature = (feature: keyof AccessibilityState["features"], enabled: boolean) => {
    state.features[feature] = enabled;
    setState({ features: { ...state.features } });
    saveToStorage();
  };

  // Detect device capabilities
  const detectCapabilities = () => {
    if (typeof window === "undefined") return;

    const capabilities = {
      audio: true,
      speechSynthesis: "speechSynthesis" in window,
      speechRecognition: "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
      touch: "ontouchstart" in window,
      haptics: "vibrate" in navigator,
      braille: false, // Would need actual braille display detection
      keyboard: true,
      mouse: true
    };

    state.capabilities = capabilities;
    setState({ capabilities });
  };

  // Update features from profile
  const updateFeaturesFromProfile = () => {
    if (!state.currentProfile) return;

    state.features = {
      captions: state.currentProfile.caption?.enabled ?? false,
      voiceNavigation: state.currentProfile.motor?.voiceControlEnabled ?? false,
      signLanguage: state.currentProfile.deaf?.signLanguageEnabled ?? false,
      braille: state.currentProfile.deafblind?.brailleEnabled ?? false,
      haptic: state.currentProfile.deafblind?.hapticEnabled ?? false,
      highContrast: state.currentProfile.visual?.highContrastEnabled ?? false,
      screenReader: state.currentProfile.blind?.screenReaderEnabled ?? false
    };
  };

  // Load from storage
  const loadFromStorage = () => {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        state = {
          ...initialState,
          ...data,
          lastUpdated: Date.now()
        };
      }
    } catch (error) {
      console.error("Failed to load accessibility state:", error);
    }
  };

  // Save to storage
  const saveToStorage = () => {
    if (typeof localStorage === "undefined") return;

    try {
      const data = {
        isEnabled: state.isEnabled,
        currentProfile: state.currentProfile,
        profiles: state.profiles,
        settings: state.settings,
        features: state.features
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save accessibility state:", error);
    }
  };

  // Subscribe
  const subscribe = (subscriber: (state: AccessibilityState) => void) => {
    subscribers.add(subscriber);
    return () => subscribers.delete(subscriber);
  };

  // Active features handler
  const setActiveFeatures = (featuresList: string[]) => {
    const nextFeatures = { ...state.features };
    const has = (name: string) => featuresList.includes(name);
    if (has("captions")) nextFeatures.captions = true;
    if (has("voice_navigation") || has("voiceNavigation")) nextFeatures.voiceNavigation = true;
    if (has("sign_language") || has("signLanguage")) nextFeatures.signLanguage = true;
    if (has("braille")) nextFeatures.braille = true;
    if (has("haptic") || has("haptic_feedback")) nextFeatures.haptic = true;
    if (has("high_contrast") || has("highContrast")) nextFeatures.highContrast = true;
    if (has("screen_reader") || has("screenReader")) nextFeatures.screenReader = true;
    setState({ features: nextFeatures });
  };

  const getGlobalSettings = (): any => {
    return state.settings || {
      theme: "default",
      fontSize: "medium",
      contrast: "normal",
      reducedMotion: false,
      soundEnabled: true
    };
  };

  const updateGlobalSettings = (newSettings: any) => {
    updateSettings(newSettings);
  };

  return {
    getState,
    setState,
    subscribe,
    initialize,
    enable,
    disable,
    setProfile,
    setActiveProfile: setProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    loadProfiles,
    saveProfiles,
    updateSettings,
    getGlobalSettings,
    updateGlobalSettings,
    setActiveFeatures,
    startSession,
    endSession,
    toggleFeature,
    setFeature,
    detectCapabilities
  };
}

// Export singleton store
export const accessibilityStore = createAccessibilityStore();
