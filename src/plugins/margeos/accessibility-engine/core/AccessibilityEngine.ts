// @ts-nocheck
// Accessibility Engine — Main Accessibility Engine
// Central orchestrator for all accessibility features

import { accessibilityStore } from "../store/accessibilityStore";
import { AccessibilityController } from "./AccessibilityController";
import { AccessibilityProfileManager } from "./AccessibilityProfileManager";
import { ContentTransformationEngine } from "./ContentTransformationEngine";
import { AccessibilityDecisionEngine } from "./AccessibilityDecisionEngine";
import type {
  AccessibilityProfile,
  AccessibilityProfileType,
  AccessibilityFeature
} from "../models/AccessibilityProfile";
import type { GlobalAccessibilitySettings } from "../models/AccessibilitySettings";

export interface EngineConfig {
  autoInit: boolean;
  loadUserProfile: boolean;
  detectDeviceCapabilities: boolean;
  persistPreferences: boolean;
}

export interface AccessibilityContext {
  content: any;
  contentType: string;
  userProfile: AccessibilityProfile | null;
  deviceCapabilities: any;
  currentMode: AccessibilityProfileType | null;
  availableFeatures: AccessibilityFeature[];
  activeFeatures: AccessibilityFeature[];
}

export class AccessibilityEngine {
  private static instance: AccessibilityEngine;

  // Components
  private controller: AccessibilityController;
  private profileManager: AccessibilityProfileManager;
  private transformationEngine: ContentTransformationEngine;
  private decisionEngine: AccessibilityDecisionEngine;

  // State
  private initialized: boolean = false;
  private currentProfile: AccessibilityProfile | null = null;
  private context: AccessibilityContext;

  // Configuration
  private config: EngineConfig;

  private constructor() {
    this.config = {
      autoInit: true,
      loadUserProfile: true,
      detectDeviceCapabilities: true,
      persistPreferences: true
    };

    this.controller = new AccessibilityController();
    this.profileManager = new AccessibilityProfileManager();
    this.transformationEngine = new ContentTransformationEngine();
    this.decisionEngine = new AccessibilityDecisionEngine();

    this.context = {
      content: null,
      contentType: "",
      userProfile: null,
      deviceCapabilities: null,
      currentMode: null,
      availableFeatures: [],
      activeFeatures: []
    };
  }

  static getInstance(): AccessibilityEngine {
    if (!AccessibilityEngine.instance) {
      AccessibilityEngine.instance = new AccessibilityEngine();
    }
    return AccessibilityEngine.instance;
  }

  // Initialize the engine
  async initialize(config?: Partial<EngineConfig>): Promise<void> {
    if (this.initialized) {
      console.warn("AccessibilityEngine already initialized");
      return;
    }

    // Apply config
    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      // Detect device capabilities
      if (this.config.detectDeviceCapabilities) {
        const capabilities = await this.detectCapabilities();
        this.context.deviceCapabilities = capabilities;
      }

      // Load user profile
      if (this.config.loadUserProfile) {
        const profile = await this.profileManager.loadActiveProfile();
        if (profile) {
          await this.applyProfile(profile);
        }
      }

      // Initialize controller
      await this.controller.initialize(this.currentProfile);

      this.initialized = true;
      this.notifyStateChange();
    } catch (error) {
      console.error("Failed to initialize AccessibilityEngine:", error);
      throw error;
    }
  }

  // Detect device capabilities
  private async detectCapabilities(): Promise<any> {
    // Implementation uses device detection
    return {
      supportsAudio: typeof Audio !== "undefined",
      supportsSpeechSynthesis: typeof window !== "undefined" && "speechSynthesis" in window,
      supportsSpeechRecognition: typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window),
      supportsTouch: typeof window !== "undefined" && "ontouchstart" in window,
      supportsHaptics: typeof navigator !== "undefined" && "vibrate" in navigator,
      supportsScreenReader: this.checkScreenReader(),
      supportsHighContrast: typeof window !== "undefined" && window.matchMedia?.("(forced-colors: active)")?.matches,
      hasPhysicalKeyboard: typeof window !== "undefined" && !("ontouchstart" in window)
    };
  }

  private checkScreenReader(): boolean {
    if (typeof window === "undefined") return false;

    // Check for common screen reader indicators
    const hasJAWS = /jaws/i.test(navigator.userAgent);
    const hasNVDA = /nvda/i.test(navigator.userAgent);
    const isVoiceOver = /voiceover/i.test(navigator.userAgent) || /apple/i.test(navigator.vendor);

    // Check for screen reader specific CSS
    const testElement = document.createElement("style");
    testElement.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `;
    document.head.appendChild(testElement);

    return hasJAWS || hasNVDA || isVoiceOver;
  }

  // Profile management
  async applyProfile(profileOrType: AccessibilityProfile | AccessibilityProfileType): Promise<AccessibilityProfile> {
    let profile: AccessibilityProfile;
    if (typeof profileOrType === "string") {
      const existing = this.profileManager.getProfilesByType(profileOrType as AccessibilityProfileType);
      if (existing.length > 0) {
        profile = existing[0];
      } else {
        profile = await this.profileManager.createProfile(profileOrType as AccessibilityProfileType);
      }
    } else {
      profile = profileOrType;
    }

    this.currentProfile = profile;
    this.context.userProfile = profile;
    this.context.currentMode = profile.type;

    // Update available features based on profile and device
    this.context.availableFeatures = this.decisionEngine.getAvailableFeatures(
      profile,
      this.context.deviceCapabilities
    );

    // Determine which features to activate
    this.context.activeFeatures = this.decisionEngine.determineActiveFeatures(
      profile,
      this.context.availableFeatures
    );

    // Update controller
    this.controller.setProfile(profile);
    this.controller.setActiveFeatures(this.context.activeFeatures);

    // Notify store
    accessibilityStore.setActiveProfile(profile);
    accessibilityStore.setActiveFeatures(this.context.activeFeatures);

    this.notifyStateChange();
    return profile;
  }

  async createProfile(type: AccessibilityProfileType, name?: string): Promise<AccessibilityProfile> {
    const profile = await this.profileManager.createProfile(type, name);
    return profile;
  }

  async switchProfile(profileId: string): Promise<void> {
    const profile = await this.profileManager.getProfile(profileId);
    if (profile) {
      await this.applyProfile(profile);
    }
  }

  async updateProfile(updates: Partial<AccessibilityProfile>): Promise<void> {
    if (!this.currentProfile) return;

    const updated = await this.profileManager.updateProfile(this.currentProfile.id, updates);
    if (updated) {
      await this.applyProfile(updated);
    }
  }

  // Content transformation
  transformContent(content: any, contentType: string): any {
    this.context.content = content;
    this.context.contentType = contentType;

    return this.transformationEngine.transform(content, {
      profile: this.currentProfile,
      contentType,
      activeFeatures: this.context.activeFeatures
    });
  }

  transformText(text: string, options?: any): string {
    return this.transformationEngine.transformText(text, {
      profile: this.currentProfile,
      ...options
    });
  }

  transformForScreenReader(element: HTMLElement): string {
    return this.transformationEngine.transformForScreenReader(element, this.currentProfile);
  }

  getContentForAccessibility(content: any): any {
    return this.transformContent(content, typeof content === "string" ? "text" : "general");
  }

  // Engine control
  enable(): void {
    if (this.currentProfile) {
      this.controller.initialize(this.currentProfile);
    }
  }

  disable(): void {
    this.context.activeFeatures = [];
    this.controller.setActiveFeatures([]);
    accessibilityStore.setActiveFeatures([]);
    this.notifyStateChange();
  }

  getSettings(): GlobalAccessibilitySettings {
    return this.getGlobalSettings();
  }

  // Feature control
  enableFeature(feature: AccessibilityFeature): void {
    if (!this.context.activeFeatures.includes(feature)) {
      this.context.activeFeatures.push(feature);
      this.controller.enableFeature(feature);
      accessibilityStore.setActiveFeatures(this.context.activeFeatures);
      this.notifyStateChange();
    }
  }

  disableFeature(feature: AccessibilityFeature): void {
    const index = this.context.activeFeatures.indexOf(feature);
    if (index !== -1) {
      this.context.activeFeatures.splice(index, 1);
      this.controller.disableFeature(feature);
      accessibilityStore.setActiveFeatures(this.context.activeFeatures);
      this.notifyStateChange();
    }
  }

  toggleFeature(feature: AccessibilityFeature): void {
    if (this.context.activeFeatures.includes(feature)) {
      this.disableFeature(feature);
    } else {
      this.enableFeature(feature);
    }
  }

  // Quick access methods
  async enableCaptions(): Promise<void> {
    this.enableFeature("captions");
  }

  async disableCaptions(): Promise<void> {
    this.disableFeature("captions");
  }

  async enableHighContrast(): Promise<void> {
    this.enableFeature("high_contrast");
  }

  async enableVoiceNavigation(): Promise<void> {
    this.enableFeature("voice_navigation");
  }

  async enableBraille(): Promise<void> {
    this.enableFeature("braille");
  }

  // Context access
  getContext(): AccessibilityContext {
    return { ...this.context };
  }

  getCurrentProfile(): AccessibilityProfile | null {
    return this.currentProfile;
  }

  getActiveFeatures(): AccessibilityFeature[] {
    return [...this.context.activeFeatures];
  }

  isFeatureActive(feature: AccessibilityFeature): boolean {
    return this.context.activeFeatures.includes(feature);
  }

  // Settings
  updateGlobalSettings(settings: GlobalAccessibilitySettings): void {
    accessibilityStore.updateGlobalSettings(settings);
    this.controller.updateSettings(settings);
  }

  getGlobalSettings(): GlobalAccessibilitySettings {
    return accessibilityStore.getGlobalSettings();
  }

  // State management
  private notifyStateChange(): void {
    accessibilityStore.setState({
      initialized: this.initialized,
      activeProfile: this.currentProfile,
      activeFeatures: this.context.activeFeatures,
      context: this.context
    });
  }

  // Cleanup
  destroy(): void {
    this.controller.destroy();
    this.initialized = false;
    this.currentProfile = null;
    AccessibilityEngine.instance = undefined as any;
  }
}

// Export singleton instance getter
export const accessibilityEngine = AccessibilityEngine.getInstance();
