// @ts-nocheck
// Accessibility Engine — Accessibility Preferences Manager
// Manages user preferences and settings

import type { AccessibilityProfile, AccessibilityFeature } from "../models/AccessibilityProfile";
import type { GlobalAccessibilitySettings } from "../models/AccessibilitySettings";

export interface AccessibilityPreference {
  key: string;
  value: any;
  scope: "user" | "session" | "global";
  category: "display" | "audio" | "navigation" | "content" | "input";
}

export interface PreferenceChange {
  key: string;
  oldValue: any;
  newValue: any;
  source: "user" | "system" | "profile";
  timestamp: Date;
}

const STORAGE_KEY = "accessibility_preferences";
const SESSION_KEY = "accessibility_session_prefs";

export class AccessibilityPreferences {
  private preferences: Map<string, AccessibilityPreference> = new Map();
  private sessionPreferences: Map<string, any> = new Map();
  private globalSettings: GlobalAccessibilitySettings | null = null;
  private listeners: Set<(changes: PreferenceChange[]) => void> = new Set();
  private pendingChanges: PreferenceChange[] = [];

  constructor() {
    this.loadPreferences();
    this.loadSessionPreferences();
  }

  // Load from storage
  private loadPreferences(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, pref] of Object.entries(data)) {
          this.preferences.set(key, pref as AccessibilityPreference);
        }
      }
    } catch (error) {
      console.error("Failed to load accessibility preferences:", error);
    }
  }

  // Save preferences
  private savePreferences(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const data: Record<string, AccessibilityPreference> = {};
      for (const [key, pref] of this.preferences) {
        data[key] = pref;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save accessibility preferences:", error);
    }
  }

  // Load session preferences
  private loadSessionPreferences(): void {
    if (typeof sessionStorage === "undefined") return;
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        this.sessionPreferences = new Map(Object.entries(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Failed to load session preferences:", error);
    }
  }

  // Save session preferences
  private saveSessionPreferences(): void {
    if (typeof sessionStorage === "undefined") return;
    try {
      const data = Object.fromEntries(this.sessionPreferences);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save session preferences:", error);
    }
  }

  // Get preference
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    // Check session first
    if (this.sessionPreferences.has(key)) {
      return this.sessionPreferences.get(key) as T;
    }

    // Check user preferences
    const pref = this.preferences.get(key);
    if (pref) {
      return pref.value as T;
    }

    return defaultValue;
  }

  // Set preference
  set(key: string, value: any, scope: "user" | "session" = "user"): void {
    const oldValue = this.get(key);

    if (scope === "session") {
      this.sessionPreferences.set(key, value);
      this.saveSessionPreferences();
    } else {
      const pref: AccessibilityPreference = {
        key,
        value,
        scope: "user",
        category: this.categorizePreference(key)
      };
      this.preferences.set(key, pref);
      this.savePreferences();
    }

    this.pendingChanges.push({
      key,
      oldValue,
      newValue: value,
      source: scope === "session" ? "session" : "user",
      timestamp: new Date()
    });

    this.notifyListeners();
  }

  // Get preference with fallback to profile settings
  getFromProfile<T = any>(
    key: string,
    profile: AccessibilityProfile,
    defaultValue?: T
  ): T {
    // Try direct preference first
    const prefValue = this.get<T>(key);
    if (prefValue !== undefined) {
      return prefValue;
    }

    // Fall back to profile setting
    return this.getProfileSetting<T>(key, profile) ?? defaultValue!;
  }

  private getProfileSetting<T = any>(key: string, profile: AccessibilityProfile): T | undefined {
    // Map preference keys to profile settings
    const settingMap: Record<string, () => any> = {
      "fontSize": () => profile.visual.fontSize,
      "highContrast": () => profile.visual.highContrast,
      "captionsEnabled": () => profile.audio.captionsEnabled,
      "speechRate": () => profile.audio.speechRate,
      "voiceControlEnabled": () => profile.motor.voiceControlEnabled,
      "keyboardNavigation": () => profile.motor.keyboardNavigation,
      "simplifyContent": () => profile.cognitive.simplifyContent,
      "extendedTime": () => profile.cognitive.extendedTime
    };

    const getter = settingMap[key];
    if (getter) {
      return getter() as T;
    }

    return undefined;
  }

  // Categorize preference
  private categorizePreference(key: string): AccessibilityPreference["category"] {
    const categoryMap: Record<string, AccessibilityPreference["category"]> = {
      "fontSize": "display",
      "fontFamily": "display",
      "highContrast": "display",
      "colorScheme": "display",
      "captionsEnabled": "audio",
      "captionStyle": "audio",
      "signLanguageEnabled": "audio",
      "audioDescriptionEnabled": "audio",
      "voiceControlEnabled": "navigation",
      "keyboardNavigation": "navigation",
      "voiceCommandsEnabled": "navigation",
      "simplifyContent": "content",
      "readingLevel": "content",
      "extendedTime": "content"
    };

    return categoryMap[key] || "display";
  }

  // Remove preference
  remove(key: string, scope: "user" | "session" = "user"): void {
    if (scope === "session") {
      this.sessionPreferences.delete(key);
      this.saveSessionPreferences();
    } else {
      this.preferences.delete(key);
      this.savePreferences();
    }
  }

  // Clear all preferences
  clear(scope: "user" | "session" | "all" = "all"): void {
    if (scope === "session" || scope === "all") {
      this.sessionPreferences.clear();
      this.saveSessionPreferences();
    }

    if (scope === "user" || scope === "all") {
      this.preferences.clear();
      this.savePreferences();
    }
  }

  // Get all preferences by category
  getByCategory(category: AccessibilityPreference["category"]): Map<string, any> {
    const result = new Map<string, any>();

    for (const [key, pref] of this.preferences) {
      if (pref.category === category) {
        result.set(key, pref.value);
      }
    }

    // Also check session
    for (const [key, value] of this.sessionPreferences) {
      const pref = this.preferences.get(key);
      if (!pref || pref.category === category) {
        result.set(key, value);
      }
    }

    return result;
  }

  // Apply profile preferences
  applyProfile(profile: AccessibilityProfile): void {
    // Visual preferences
    this.set("fontSize", profile.visual.fontSize);
    this.set("highContrast", profile.visual.highContrast);
    this.set("reduceMotion", profile.visual.reduceMotion);

    // Audio preferences
    this.set("captionsEnabled", profile.audio.captionsEnabled);
    this.set("signLanguageEnabled", profile.audio.signLanguageEnabled);
    this.set("audioDescriptionEnabled", profile.audio.audioDescriptionsEnabled);
    this.set("speechRate", profile.audio.speechRate);

    // Motor preferences
    this.set("keyboardNavigation", profile.motor.keyboardNavigation);
    this.set("voiceControlEnabled", profile.motor.voiceControlEnabled);

    // Cognitive preferences
    this.set("simplifyContent", profile.cognitive.simplifyContent);
    this.set("extendedTime", profile.cognitive.extendedTime);
  }

  // Export preferences
  export(): string {
    return JSON.stringify({
      preferences: Object.fromEntries(this.preferences),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Import preferences
  import(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.preferences) {
        for (const [key, value] of Object.entries(data.preferences)) {
          this.set(key, value, "user");
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to import preferences:", error);
      return false;
    }
  }

  // Subscribe to changes
  subscribe(listener: (changes: PreferenceChange[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    if (this.pendingChanges.length > 0) {
      const changes = [...this.pendingChanges];
      this.pendingChanges = [];

      for (const listener of this.listeners) {
        try {
          listener(changes);
        } catch (error) {
          console.error("Error in preference listener:", error);
        }
      }
    }
  }

  // Get display preferences
  getDisplayPreferences(): {
    fontSize: number;
    highContrast: boolean;
    colorScheme: string;
  } {
    return {
      fontSize: this.get("fontSize", 16),
      highContrast: this.get("highContrast", false),
      colorScheme: this.get("colorScheme", "default")
    };
  }

  // Get audio preferences
  getAudioPreferences(): {
    captionsEnabled: boolean;
    speechRate: number;
    signLanguageEnabled: boolean;
  } {
    return {
      captionsEnabled: this.get("captionsEnabled", false),
      speechRate: this.get("speechRate", 1.0),
      signLanguageEnabled: this.get("signLanguageEnabled", false)
    };
  }

  // Get navigation preferences
  getNavigationPreferences(): {
    keyboardNavigation: boolean;
    voiceControlEnabled: boolean;
    voiceCommandsEnabled: boolean;
  } {
    return {
      keyboardNavigation: this.get("keyboardNavigation", false),
      voiceControlEnabled: this.get("voiceControlEnabled", false),
      voiceCommandsEnabled: this.get("voiceCommandsEnabled", false)
    };
  }

  // Get content preferences
  getContentPreferences(): {
    simplifyContent: boolean;
    readingLevel: number;
    extendedTime: boolean;
  } {
    return {
      simplifyContent: this.get("simplifyContent", false),
      readingLevel: this.get("readingLevel", 8),
      extendedTime: this.get("extendedTime", false)
    };
  }
}

// Export singleton
export const accessibilityPreferences = new AccessibilityPreferences();
