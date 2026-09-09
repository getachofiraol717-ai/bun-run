// Accessibility Engine — Accessibility Profile Manager
// Handles profile CRUD operations and storage

import {
  AccessibilityProfile,
  AccessibilityProfileType,
  PROFILE_PRESETS,
  createDefaultProfile,
  detectDeviceCapabilities
} from "../models/AccessibilityProfile";

const STORAGE_KEY = "accessibility_profiles";
const ACTIVE_PROFILE_KEY = "active_accessibility_profile_id";

export interface ProfileManagerConfig {
  storageType: "local" | "session" | "server";
  autoSave: boolean;
  maxProfiles: number;
}

export class AccessibilityProfileManager {
  private config: ProfileManagerConfig;
  private profiles: Map<string, AccessibilityProfile> = new Map();
  private activeProfileId: string | null = null;
  private listeners: Set<(profiles: AccessibilityProfile[]) => void> = new Set();

  constructor(config?: Partial<ProfileManagerConfig>) {
    this.config = {
      storageType: "local",
      autoSave: true,
      maxProfiles: 10,
      ...config
    };

    this.loadFromStorage();
  }

  // Load profiles from storage
  private loadFromStorage(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        for (const profile of data.profiles || []) {
          // Convert date strings back to Date objects
          profile.createdAt = new Date(profile.createdAt);
          profile.updatedAt = new Date(profile.updatedAt);
          this.profiles.set(profile.id, profile);
        }
        this.activeProfileId = data.activeId || null;
      }

      // Load active profile ID from separate key
      const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (activeId) {
        this.activeProfileId = activeId;
      }
    } catch (error) {
      console.error("Failed to load accessibility profiles:", error);
    }
  }

  // Save profiles to storage
  private saveToStorage(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const data = {
        profiles: Array.from(this.profiles.values()),
        activeId: this.activeProfileId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(ACTIVE_PROFILE_KEY, this.activeProfileId || "");
    } catch (error) {
      console.error("Failed to save accessibility profiles:", error);
    }
  }

  // Create a new profile
  async createProfile(
    type: AccessibilityProfileType,
    name?: string,
    userId?: string
  ): Promise<AccessibilityProfile> {
    // Check max profiles limit
    if (this.profiles.size >= this.config.maxProfiles) {
      throw new Error(`Maximum number of profiles (${this.config.maxProfiles}) reached`);
    }

    const profile = createDefaultProfile(
      userId || "local-user",
      type
    );

    if (name) {
      profile.name = name;
    }

    // Detect device capabilities
    profile.deviceCapabilities = detectDeviceCapabilities();

    this.profiles.set(profile.id, profile);
    this.activeProfileId = profile.id;

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    this.notifyListeners();
    return profile;
  }

  // Get a profile by ID
  async getProfile(id: string): Promise<AccessibilityProfile | null> {
    return this.profiles.get(id) || null;
  }

  // Get all profiles
  async getAllProfiles(): Promise<AccessibilityProfile[]> {
    return Array.from(this.profiles.values());
  }

  // Get active profile
  async getActiveProfile(): Promise<AccessibilityProfile | null> {
    if (!this.activeProfileId) return null;
    return this.profiles.get(this.activeProfileId) || null;
  }

  // Load active profile
  async loadActiveProfile(): Promise<AccessibilityProfile | null> {
    const active = await this.getActiveProfile();
    if (active) return active;
    if (this.profiles.size > 0) {
      const first = this.profiles.values().next().value;
      if (first) {
        this.activeProfileId = first.id;
        return first;
      }
    }
    return null;
  }

  // Set active profile
  async setActiveProfile(id: string): Promise<void> {
    if (!this.profiles.has(id)) {
      throw new Error(`Profile ${id} not found`);
    }

    this.activeProfileId = id;

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    this.notifyListeners();
  }

  // Update a profile
  async updateProfile(
    id: string,
    updates: Partial<AccessibilityProfile>
  ): Promise<AccessibilityProfile | null> {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    // Apply updates
    const updated: AccessibilityProfile = {
      ...profile,
      ...updates,
      id: profile.id, // Prevent ID change
      userId: profile.userId, // Prevent userId change
      createdAt: profile.createdAt, // Prevent createdAt change
      updatedAt: new Date()
    };

    this.profiles.set(id, updated);

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    this.notifyListeners();
    return updated;
  }

  // Delete a profile
  async deleteProfile(id: string): Promise<boolean> {
    if (!this.profiles.has(id)) return false;

    this.profiles.delete(id);

    // If deleted profile was active, clear active
    if (this.activeProfileId === id) {
      this.activeProfileId = this.profiles.size > 0
        ? this.profiles.keys().next().value
        : null;
    }

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    this.notifyListeners();
    return true;
  }

  // Duplicate a profile
  async duplicateProfile(id: string, newName?: string): Promise<AccessibilityProfile | null> {
    const original = this.profiles.get(id);
    if (!original) return null;

    // Check max profiles limit
    if (this.profiles.size >= this.config.maxProfiles) {
      throw new Error(`Maximum number of profiles (${this.config.maxProfiles}) reached`);
    }

    const duplicate: AccessibilityProfile = {
      ...JSON.parse(JSON.stringify(original)),
      id: `profile-${Date.now()}`,
      name: newName || `${original.name} (Copy)`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.profiles.set(duplicate.id, duplicate);

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    this.notifyListeners();
    return duplicate;
  }

  // Reset profile to defaults
  async resetProfile(id: string): Promise<AccessibilityProfile | null> {
    const original = this.profiles.get(id);
    if (!original) return null;

    const preset = PROFILE_PRESETS[original.type];
    const reset: AccessibilityProfile = {
      ...original,
      visual: { ...preset.visual },
      audio: { ...preset.audio },
      motor: { ...preset.motor },
      cognitive: { ...preset.cognitive },
      updatedAt: new Date()
    };

    this.profiles.set(id, reset);

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    this.notifyListeners();
    return reset;
  }

  // Export profile
  exportProfile(id: string): string | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    return JSON.stringify(profile, null, 2);
  }

  // Import profile
  async importProfile(jsonString: string): Promise<AccessibilityProfile | null> {
    try {
      const data = JSON.parse(jsonString);

      // Validate structure
      if (!data.type || !data.visual || !data.audio) {
        throw new Error("Invalid profile structure");
      }

      // Check max profiles limit
      if (this.profiles.size >= this.config.maxProfiles) {
        throw new Error(`Maximum number of profiles (${this.config.maxProfiles}) reached`);
      }

      // Create new profile with new ID
      const imported: AccessibilityProfile = {
        ...data,
        id: `profile-${Date.now()}`,
        name: data.name || "Imported Profile",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.profiles.set(imported.id, imported);

      if (this.config.autoSave) {
        this.saveToStorage();
      }

      this.notifyListeners();
      return imported;
    } catch (error) {
      console.error("Failed to import profile:", error);
      return null;
    }
  }

  // Subscribe to changes
  subscribe(listener: (profiles: AccessibilityProfile[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const profiles = Array.from(this.profiles.values());
    for (const listener of this.listeners) {
      listener(profiles);
    }
  }

  // Get profiles by type
  getProfilesByType(type: AccessibilityProfileType): AccessibilityProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.type === type);
  }

  // Get profile count
  getProfileCount(): number {
    return this.profiles.size;
  }

  // Clear all profiles
  async clearAllProfiles(): Promise<void> {
    this.profiles.clear();
    this.activeProfileId = null;

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    this.notifyListeners();
  }
}

// Export singleton
export const profileManager = new AccessibilityProfileManager();
export const accessibilityProfileManager = profileManager;
