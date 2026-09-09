// @ts-nocheck
// Accessibility Engine — Universal Accessibility Manager
// Central manager coordinating all accessibility systems

import { AccessibilityEngine } from "./AccessibilityEngine";
import { AccessibilityAdapter } from "./AccessibilityAdapter";
import type { AccessibilityProfile, AccessibilityFeature } from "../models/AccessibilityProfile";

export interface UniversalAccessibilityConfig {
  autoInit: boolean;
  enableAnalytics: boolean;
  enableAdaptation: boolean;
  enableNotifications: boolean;
}

export type AccessibilityEventType =
  | "profile_changed"
  | "feature_toggled"
  | "content_adapted"
  | "barrier_detected"
  | "preference_changed";

export interface AccessibilityEvent {
  type: AccessibilityEventType;
  timestamp: Date;
  data: any;
}

export class UniversalAccessibilityManager {
  private static instance: UniversalAccessibilityManager;

  // Core systems
  private engine: AccessibilityEngine;
  private adapter: AccessibilityAdapter;

  // Configuration
  private config: UniversalAccessibilityConfig;

  // Event system
  private eventListeners: Map<AccessibilityEventType, Set<(event: AccessibilityEvent) => void>> = new Map();
  private eventHistory: AccessibilityEvent[] = [];

  // Status
  private initialized: boolean = false;
  private activeContent: Map<string, any> = new Map();

  private constructor() {
    this.engine = AccessibilityEngine.getInstance();
    this.adapter = new AccessibilityAdapter();

    this.config = {
      autoInit: true,
      enableAnalytics: true,
      enableAdaptation: true,
      enableNotifications: true
    };
  }

  static getInstance(): UniversalAccessibilityManager {
    if (!UniversalAccessibilityManager.instance) {
      UniversalAccessibilityManager.instance = new UniversalAccessibilityManager();
    }
    return UniversalAccessibilityManager.instance;
  }

  // Initialize
  async initialize(config?: Partial<UniversalAccessibilityConfig>): Promise<void> {
    if (this.initialized) {
      console.warn("UniversalAccessibilityManager already initialized");
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      // Initialize the core engine
      await this.engine.initialize({
        autoInit: this.config.autoInit,
        loadUserProfile: true,
        detectDeviceCapabilities: true,
        persistPreferences: true
      });

      // Set up event listeners
      this.setupEventListeners();

      this.initialized = true;
      this.emitEvent("profile_changed", { profile: this.engine.getCurrentProfile() });
    } catch (error) {
      console.error("Failed to initialize UniversalAccessibilityManager:", error);
      throw error;
    }
  }

  // Set up internal event listeners
  private setupEventListeners(): void {
    // Listen for profile changes
    this.engine.getContext();
  }

  // Content adaptation
  adaptContent(
    content: any,
    contentType: string,
    sourceEngine?: string
  ): any {
    const context = this.engine.getContext();

    // If source engine specified, use adapter
    if (sourceEngine && this.config.enableAdaptation) {
      const adapted = this.adapter.adapt(
        sourceEngine,
        content,
        context.userProfile!,
        context.activeFeatures
      );

      this.emitEvent("content_adapted", {
        contentType,
        sourceEngine,
        adaptedFeatures: adapted.features,
        warnings: adapted.warnings
      });

      return adapted.accessible;
    }

    // Use core transformation
    return this.engine.transformContent(content, contentType);
  }

  // Quick content adaptation methods
  adaptText(text: string): string {
    return this.engine.transformText(text);
  }

  adaptForScreenReader(element: HTMLElement): string {
    return this.engine.transformForScreenReader(element);
  }

  // Profile management
  async setProfile(type: "deaf" | "blind" | "deafblind" | "custom", name?: string): Promise<void> {
    const profile = await this.engine.createProfile(type, name);
    await this.engine.applyProfile(profile);
    this.emitEvent("profile_changed", { profile });
  }

  async switchToProfile(profileId: string): Promise<void> {
    await this.engine.switchProfile(profileId);
    const profile = this.engine.getCurrentProfile();
    this.emitEvent("profile_changed", { profile });
  }

  async updateProfile(updates: Partial<AccessibilityProfile>): Promise<void> {
    await this.engine.updateProfile(updates);
    const profile = this.engine.getCurrentProfile();
    this.emitEvent("profile_changed", { profile });
  }

  // Feature management
  enable(feature: AccessibilityFeature): void {
    this.engine.enableFeature(feature);
    this.emitEvent("feature_toggled", { feature, enabled: true });
  }

  disable(feature: AccessibilityFeature): void {
    this.engine.disableFeature(feature);
    this.emitEvent("feature_toggled", { feature, enabled: false });
  }

  toggle(feature: AccessibilityFeature): void {
    this.engine.toggleFeature(feature);
    this.emitEvent("feature_toggled", { feature, enabled: this.engine.isFeatureActive(feature) });
  }

  // Quick feature toggles
  enableCaptions(): void {
    this.enable("captions");
  }

  disableCaptions(): void {
    this.disable("captions");
  }

  enableHighContrast(): void {
    this.enable("high_contrast");
  }

  enableVoiceNavigation(): void {
    this.enable("voice_navigation");
  }

  enableBraille(): void {
    this.enable("braille");
  }

  // Event system
  subscribe(
    eventType: AccessibilityEventType,
    listener: (event: AccessibilityEvent) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener);
    };
  }

  private emitEvent(type: AccessibilityEventType, data: any): void {
    const event: AccessibilityEvent = {
      type,
      timestamp: new Date(),
      data
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error("Error in accessibility event listener:", error);
        }
      }
    }

    // Global listeners
    const globalListeners = this.eventListeners.get("*");
    if (globalListeners) {
      for (const listener of globalListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error("Error in global accessibility event listener:", error);
        }
      }
    }
  }

  getEventHistory(limit?: number): AccessibilityEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  // Get current state
  getState(): {
    initialized: boolean;
    profile: AccessibilityProfile | null;
    activeFeatures: AccessibilityFeature[];
    config: UniversalAccessibilityConfig;
  } {
    return {
      initialized: this.initialized,
      profile: this.engine.getCurrentProfile(),
      activeFeatures: this.engine.getActiveFeatures(),
      config: this.config
    };
  }

  // Get supported engines for adaptation
  getSupportedEngines(): string[] {
    return this.adapter.getSupportedEngines();
  }

  // Check if feature is available
  isFeatureAvailable(feature: AccessibilityFeature): boolean {
    const context = this.engine.getContext();
    return context.availableFeatures.includes(feature);
  }

  // Check if feature is active
  isFeatureActive(feature: AccessibilityFeature): boolean {
    return this.engine.isFeatureActive(feature);
  }

  // Get feature status
  getFeatureStatus(feature: AccessibilityFeature): {
    available: boolean;
    active: boolean;
    supported: boolean;
  } {
    return {
      available: this.isFeatureAvailable(feature),
      active: this.isFeatureActive(feature),
      supported: true
    };
  }

  // Detect accessibility barriers
  detectBarrier(type: string, element?: HTMLElement): void {
    this.emitEvent("barrier_detected", {
      type,
      element: element?.tagName || "unknown",
      url: typeof window !== "undefined" ? window.location.href : ""
    });
  }

  // Cleanup
  destroy(): void {
    this.eventListeners.clear();
    this.eventHistory = [];
    this.activeContent.clear();
    this.engine.destroy();
    this.initialized = false;
    UniversalAccessibilityManager.instance = undefined as any;
  }
}

// Export singleton
export const universalAccessibility = UniversalAccessibilityManager.getInstance();
export const universalAccessibilityManager = universalAccessibility;
