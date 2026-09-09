// @ts-nocheck
// Accessibility Engine — Accessibility Decision Engine
// Determines which accessibility features to activate

import type {
  AccessibilityProfile,
  AccessibilityFeature,
  DeviceCapabilities
} from "../models/AccessibilityProfile";

// Feature dependencies and requirements
const FEATURE_REQUIREMENTS: Record<AccessibilityFeature, {
  requires?: AccessibilityFeature[];
  conflicts?: AccessibilityFeature[];
  profileTypes?: string[];
  minCapabilities?: Partial<DeviceCapabilities>;
}> = {
  captions: {
    requires: [],
    profileTypes: ["deaf", "hard_of_hearing", "cognitive"]
  },
  sign_language: {
    requires: ["captions"],
    profileTypes: ["deaf"],
    minCapabilities: { supportsAudio: true }
  },
  audio_descriptions: {
    requires: [],
    profileTypes: ["blind"],
    minCapabilities: { supportsSpeechSynthesis: true }
  },
  voice_navigation: {
    requires: [],
    profileTypes: ["blind", "motor_impaired"],
    minCapabilities: { supportsSpeechRecognition: true, microphoneAvailable: true }
  },
  voice_commands: {
    requires: ["voice_navigation"],
    profileTypes: ["blind", "motor_impaired"],
    minCapabilities: { supportsSpeechRecognition: true, microphoneAvailable: true }
  },
  screen_reader: {
    requires: [],
    profileTypes: ["blind"],
    minCapabilities: { supportsAudio: true }
  },
  braille: {
    requires: [],
    profileTypes: ["deafblind", "blind"],
    minCapabilities: { supportsBraille: true }
  },
  haptic_feedback: {
    requires: [],
    profileTypes: ["deafblind", "deaf"],
    minCapabilities: { supportsHaptics: true }
  },
  high_contrast: {
    requires: [],
    profileTypes: ["blind", "low_vision"]
  },
  keyboard_navigation: {
    requires: [],
    profileTypes: ["blind", "motor_impaired", "deafblind"],
    minCapabilities: { hasPhysicalKeyboard: true }
  },
  simplified_content: {
    requires: [],
    profileTypes: ["cognitive"]
  },
  extended_time: {
    requires: [],
    profileTypes: ["cognitive", "motor_impaired"]
  }
};

// Feature priorities
const FEATURE_PRIORITIES: Record<AccessibilityFeature, number> = {
  braille: 100,
  screen_reader: 95,
  captions: 90,
  voice_navigation: 85,
  audio_descriptions: 80,
  sign_language: 75,
  haptic_feedback: 70,
  high_contrast: 65,
  keyboard_navigation: 60,
  voice_commands: 55,
  simplified_content: 50,
  extended_time: 45
};

export interface DecisionResult {
  feature: AccessibilityFeature;
  decision: "activate" | "deactivate" | "available" | "unavailable";
  reason: string;
  priority: number;
}

export class AccessibilityDecisionEngine {
  /**
   * Get available features based on profile and device capabilities
   */
  getAvailableFeatures(
    profile: AccessibilityProfile,
    deviceCapabilities: DeviceCapabilities | null
  ): AccessibilityFeature[] {
    const available: AccessibilityFeature[] = [];

    for (const [feature, requirements] of Object.entries(FEATURE_REQUIREMENTS)) {
      const featureName = feature as AccessibilityFeature;

      // Check if feature is compatible with profile type
      if (requirements.profileTypes && !requirements.profileTypes.includes(profile.type)) {
        continue;
      }

      // Check device capabilities
      if (requirements.minCapabilities && deviceCapabilities) {
        let meetsRequirements = true;
        for (const [cap, required] of Object.entries(requirements.minCapabilities)) {
          const actual = (deviceCapabilities as any)[cap];
          if (actual === false || actual === undefined) {
            meetsRequirements = false;
            break;
          }
        }
        if (!meetsRequirements) continue;
      }

      available.push(featureName);
    }

    return available;
  }

  /**
   * Determine which features should be activated
   */
  determineActiveFeatures(
    profile: AccessibilityProfile,
    availableFeatures: AccessibilityFeature[]
  ): AccessibilityFeature[] {
    const active: AccessibilityFeature[] = [];
    const decisions: DecisionResult[] = [];

    for (const feature of availableFeatures) {
      const decision = this.evaluateFeature(feature, profile, availableFeatures);
      decisions.push(decision);

      if (decision.decision === "activate") {
        active.push(feature);
      }
    }

    // Sort by priority and return
    return active.sort((a, b) =>
      (FEATURE_PRIORITIES[b] || 0) - (FEATURE_PRIORITIES[a] || 0)
    );
  }

  /**
   * Evaluate a single feature
   */
  evaluateFeature(
    feature: AccessibilityFeature,
    profile: AccessibilityProfile,
    availableFeatures: AccessibilityFeature[]
  ): DecisionResult {
    const requirements = FEATURE_REQUIREMENTS[feature];

    // Check if feature is enabled in profile
    if (!profile.enabledFeatures.includes(feature)) {
      return {
        feature,
        decision: "deactivate",
        reason: "Feature not enabled in user profile",
        priority: FEATURE_PRIORITIES[feature] || 0
      };
    }

    // Check requirements
    if (requirements?.requires) {
      for (const required of requirements.requires) {
        if (!availableFeatures.includes(required)) {
          return {
            feature,
            decision: "unavailable",
            reason: `Required feature ${required} is not available`,
            priority: FEATURE_PRIORITIES[feature] || 0
          };
        }
      }
    }

    // Check conflicts
    if (requirements?.conflicts) {
      for (const conflict of requirements.conflicts) {
        if (availableFeatures.includes(conflict)) {
          return {
            feature,
            decision: "deactivate",
            reason: `Conflicts with ${conflict}`,
            priority: FEATURE_PRIORITIES[feature] || 0
          };
        }
      }
    }

    // Check profile-specific settings
    if (!this.isFeatureEnabledByProfile(feature, profile)) {
      return {
        feature,
        decision: "deactivate",
        reason: "Feature disabled in profile settings",
        priority: FEATURE_PRIORITIES[feature] || 0
      };
    }

    return {
      feature,
      decision: "activate",
      reason: "All requirements met",
      priority: FEATURE_PRIORITIES[feature] || 0
    };
  }

  /**
   * Check if feature is enabled based on profile settings
   */
  private isFeatureEnabledByProfile(feature: AccessibilityFeature, profile: AccessibilityProfile): boolean {
    switch (feature) {
      case "captions":
        return profile.audio.captionsEnabled;

      case "sign_language":
        return profile.audio.signLanguageEnabled;

      case "audio_descriptions":
        return profile.audio.audioDescriptionsEnabled;

      case "voice_navigation":
      case "voice_commands":
        return profile.motor.voiceControlEnabled;

      case "screen_reader":
        return profile.visual.enabled === false; // Screen reader usually when visual is off

      case "braille":
        return profile.deviceCapabilities?.supportsBraille || false;

      case "haptic_feedback":
        return profile.audio.vibrationAlerts || profile.deviceCapabilities?.supportsHaptics || false;

      case "high_contrast":
        return profile.visual.highContrast;

      case "keyboard_navigation":
        return profile.motor.keyboardNavigation;

      case "simplified_content":
        return profile.cognitive.simplifyContent;

      case "extended_time":
        return profile.cognitive.extendedTime;

      default:
        return true;
    }
  }

  /**
   * Get recommendation for feature activation
   */
  getRecommendation(
    feature: AccessibilityFeature,
    profile: AccessibilityProfile,
    deviceCapabilities: DeviceCapabilities | null
  ): {
    recommended: boolean;
    reason: string;
    alternative?: AccessibilityFeature;
  } {
    const requirements = FEATURE_REQUIREMENTS[feature];

    // Check profile type match
    if (requirements?.profileTypes && !requirements.profileTypes.includes(profile.type)) {
      return {
        recommended: false,
        reason: `Not recommended for ${profile.type} profile`
      };
    }

    // Check capabilities
    if (requirements?.minCapabilities && deviceCapabilities) {
      for (const [cap, required] of Object.entries(requirements.minCapabilities)) {
        const actual = (deviceCapabilities as any)[cap];
        if (actual === false) {
          // Find alternative
          const alternative = this.findAlternative(feature, profile, deviceCapabilities);
          return {
            recommended: false,
            reason: `Device lacks ${cap} capability`,
            alternative
          };
        }
      }
    }

    return {
      recommended: true,
      reason: "Recommended for this user profile"
    };
  }

  /**
   * Find alternative feature
   */
  private findAlternative(
    originalFeature: AccessibilityFeature,
    profile: AccessibilityProfile,
    capabilities: DeviceCapabilities
  ): AccessibilityFeature | undefined {
    const alternatives: Record<AccessibilityFeature, AccessibilityFeature[]> = {
      voice_navigation: ["keyboard_navigation"],
      braille: ["audio_descriptions", "screen_reader"],
      haptic_feedback: ["visual_alerts"],
      sign_language: ["captions"],
      audio_descriptions: ["captions"]
    };

    const altList = alternatives[originalFeature];
    if (!altList) return undefined;

    for (const alt of altList) {
      const altReqs = FEATURE_REQUIREMENTS[alt];
      let canUse = true;

      if (altReqs?.minCapabilities) {
        for (const [cap, required] of Object.entries(altReqs.minCapabilities)) {
          if ((capabilities as any)[cap] === false) {
            canUse = false;
            break;
          }
        }
      }

      if (canUse) return alt;
    }

    return undefined;
  }

  /**
   * Get feature compatibility matrix
   */
  getCompatibilityMatrix(): Record<AccessibilityFeature, AccessibilityFeature[]> {
    const matrix: Record<string, AccessibilityFeature[]> = {};

    for (const [feature, requirements] of Object.entries(FEATURE_REQUIREMENTS)) {
      matrix[feature] = requirements.requires || [];
    }

    return matrix as Record<AccessibilityFeature, AccessibilityFeature[]>;
  }

  /**
   * Resolve feature conflicts
   */
  resolveConflicts(
    requestedFeatures: AccessibilityFeature[]
  ): AccessibilityFeature[] {
    const resolved: AccessibilityFeature[] = [];
    const disabled: Set<AccessibilityFeature> = new Set();

    // Sort by priority
    const sorted = [...requestedFeatures].sort((a, b) =>
      (FEATURE_PRIORITIES[b] || 0) - (FEATURE_PRIORITIES[a] || 0)
    );

    for (const feature of sorted) {
      if (disabled.has(feature)) continue;

      const requirements = FEATURE_REQUIREMENTS[feature];

      // Check conflicts
      if (requirements?.conflicts) {
        for (const conflict of requirements.conflicts) {
          if (requestedFeatures.includes(conflict) && !disabled.has(conflict)) {
            // Disable lower priority conflict
            if ((FEATURE_PRIORITIES[conflict] || 0) < (FEATURE_PRIORITIES[feature] || 0)) {
              disabled.add(conflict);
            } else {
              disabled.add(feature);
              break;
            }
          }
        }
      }

      if (!disabled.has(feature)) {
        resolved.push(feature);
      }
    }

    return resolved;
  }
}

// Export singleton
export const accessibilityDecisionEngine = new AccessibilityDecisionEngine();
