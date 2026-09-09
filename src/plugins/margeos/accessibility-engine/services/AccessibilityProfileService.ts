// @ts-nocheck
// Accessibility Engine — Accessibility Profile Service
// Manages accessibility profiles with persistence

import type { AccessibilityProfile, AccessibilityProfileType } from "../models/AccessibilityProfile";
import { createDefaultProfile } from "../models/AccessibilityProfile";

export interface ProfileServiceConfig {
  storageKey: string;
  autoSave: boolean;
  maxProfiles: number;
}

export class AccessibilityProfileService {
  private static instance: AccessibilityProfileService;
  private config: ProfileServiceConfig;
  private profiles: Map<string, AccessibilityProfile> = new Map();
  private currentProfileId: string | null = null;
  private listeners: Set<(profile: AccessibilityProfile | null) => void> = new Set();

  private constructor() {
    this.config = {
      storageKey: "margeos_accessibility_profiles",
      autoSave: true,
      maxProfiles: 10
    };
  }

  static getInstance(): AccessibilityProfileService {
    if (!AccessibilityProfileService.instance) {
      AccessibilityProfileService.instance = new AccessibilityProfileService();
    }
    return AccessibilityProfileService.instance;
  }

  initialize(): void {
    this.loadFromStorage();
  }

  // Storage management
  private loadFromStorage(): void {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.profiles = new Map(data.profiles || []);
        this.currentProfileId = data.currentProfileId || null;
      }
    } catch (error) {
      console.error("Failed to load accessibility profiles:", error);
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === "undefined") return;

    try {
      const data = {
        profiles: Array.from(this.profiles.entries()),
        currentProfileId: this.currentProfileId
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save accessibility profiles:", error);
    }
  }

  // Create profile
  createProfile(type: AccessibilityProfileType, customName?: string): AccessibilityProfile {
    const profile = createDefaultProfile(type);

    if (customName) {
      profile.name = customName;
    }

    // Generate unique ID
    profile.id = `${type}-${Date.now()}`;

    this.profiles.set(profile.id, profile);

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    return profile;
  }

  // Get profile by ID
  getProfile(id: string): AccessibilityProfile | undefined {
    return this.profiles.get(id);
  }

  // Get all profiles
  getAllProfiles(): AccessibilityProfile[] {
    return Array.from(this.profiles.values());
  }

  // Get profiles by type
  getProfilesByType(type: AccessibilityProfileType): AccessibilityProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.type === type);
  }

  // Update profile
  updateProfile(id: string, updates: Partial<AccessibilityProfile>): AccessibilityProfile | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    const updatedProfile = { ...profile, ...updates };
    this.profiles.set(id, updatedProfile);

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    // Notify if this is the current profile
    if (id === this.currentProfileId) {
      this.notifyListeners(updatedProfile);
    }

    return updatedProfile;
  }

  // Delete profile
  deleteProfile(id: string): boolean {
    const deleted = this.profiles.delete(id);

    if (deleted && this.config.autoSave) {
      this.saveToStorage();
    }

    // If deleted profile was current, switch to default
    if (id === this.currentProfileId) {
      const profiles = this.getAllProfiles();
      if (profiles.length > 0) {
        this.setCurrentProfile(profiles[0].id);
      } else {
        this.currentProfileId = null;
        this.notifyListeners(null);
      }
    }

    return deleted;
  }

  // Set current profile
  setCurrentProfile(id: string): boolean {
    const profile = this.profiles.get(id);
    if (!profile) return false;

    this.currentProfileId = id;

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    this.notifyListeners(profile);
    return true;
  }

  // Get current profile
  getCurrentProfile(): AccessibilityProfile | null {
    if (!this.currentProfileId) return null;
    return this.profiles.get(this.currentProfileId) || null;
  }

  // Clone profile
  cloneProfile(id: string, newName?: string): AccessibilityProfile | null {
    const original = this.profiles.get(id);
    if (!original) return null;

    const cloned: AccessibilityProfile = {
      ...JSON.parse(JSON.stringify(original)),
      id: `${original.type}-${Date.now()}`,
      name: newName || `${original.name} (Copy)`
    };

    this.profiles.set(cloned.id, cloned);

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    return cloned;
  }

  // Export profile
  exportProfile(id: string): string | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    return JSON.stringify(profile, null, 2);
  }

  // Import profile
  importProfile(jsonString: string): AccessibilityProfile | null {
    try {
      const profile = JSON.parse(jsonString) as AccessibilityProfile;

      // Validate structure
      if (!profile.id || !profile.type || !profile.name) {
        throw new Error("Invalid profile structure");
      }

      // Generate new ID to avoid conflicts
      profile.id = `imported-${Date.now()}`;

      this.profiles.set(profile.id, profile);

      if (this.config.autoSave) {
        this.saveToStorage();
      }

      return profile;
    } catch (error) {
      console.error("Failed to import profile:", error);
      return null;
    }
  }

  // Reset to defaults
  resetProfile(id: string): AccessibilityProfile | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    const defaultProfile = createDefaultProfile(profile.type);
    const resetProfile: AccessibilityProfile = {
      ...defaultProfile,
      id: profile.id,
      name: profile.name
    };

    this.profiles.set(id, resetProfile);

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    if (id === this.currentProfileId) {
      this.notifyListeners(resetProfile);
    }

    return resetProfile;
  }

  // Subscribe to profile changes
  subscribe(listener: (profile: AccessibilityProfile | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(profile: AccessibilityProfile | null): void {
    for (const listener of this.listeners) {
      listener(profile);
    }
  }

  // Clear all profiles
  clearAll(): void {
    this.profiles.clear();
    this.currentProfileId = null;
    this.saveToStorage();
    this.notifyListeners(null);
  }

  // Cleanup
  destroy(): void {
    this.profiles.clear();
    this.currentProfileId = null;
    this.listeners.clear();
  }
}

export const accessibilityProfileService = AccessibilityProfileService.getInstance();
