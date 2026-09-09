// @ts-nocheck
// Accessibility Engine — AccessibilityProfile Models
// Defines accessibility profile types and configurations

export type AccessibilityProfileType =
  | "deaf"
  | "blind"
  | "deafblind"
  | "hard_of_hearing"
  | "low_vision"
  | "motor_impaired"
  | "cognitive"
  | "custom";

export type SupportLevel = "full" | "partial" | "none";

export interface AccessibilityProfile {
  id: string;
  userId: string;
  name: string;
  type: AccessibilityProfileType;

  // Visual settings
  visual: VisualAccessibilitySettings;

  // Audio settings
  audio: AudioAccessibilitySettings;

  // Motor settings
  motor: MotorAccessibilitySettings;

  // Cognitive settings
  cognitive: CognitiveAccessibilitySettings;

  // Device capabilities
  deviceCapabilities: DeviceCapabilities;

  // Priority settings
  preferredModalities: AccessibilityModality[];

  // Active features
  enabledFeatures: AccessibilityFeature[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

export interface VisualAccessibilitySettings {
  enabled: boolean;

  // Display settings
  highContrast: boolean;
  highContrastTheme?: "white_black" | "black_white" | "yellow_black" | "custom";
  customContrastColors?: {
    background: string;
    foreground: string;
  };

  // Text settings
  fontSize: number; // 12-32
  fontSizeMultiplier: number; // 1.0-2.5
  lineHeight: number;
  letterSpacing: number;
  fontFamily?: string;

  // Color settings
  colorBlindMode?: "none" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";
  reduceMotion: boolean;
  reduceTransparency: boolean;

  // Layout settings
  focusIndicators: boolean;
  focusIndicatorSize: number;
  focusIndicatorColor: string;

  // Screen magnification
  magnification: number; // 1.0-4.0
  zoomToFocus: boolean;
}

export interface AudioAccessibilitySettings {
  enabled: boolean;

  // Volume settings
  volume: number; // 0-1
  speechRate: number; // 0.5-2.0
  pitch: number; // 0.5-2.0

  // Caption settings
  captionsEnabled: boolean;
  captionStyle: CaptionStyle;
  captionPosition: "bottom" | "top" | "overlay";

  // Sign language settings
  signLanguageEnabled: boolean;
  signLanguagePosition: "bottom_right" | "bottom_left" | "top_right" | "top_left" | "corner";
  avatarSize: "small" | "medium" | "large";

  // Audio descriptions
  audioDescriptionsEnabled: boolean;
  audioDescriptionVolume: number;

  // Alerts
  visualAlerts: boolean;
  vibrationAlerts: boolean;
  flashAlerts: boolean;
  flashInterval: number; // milliseconds

  // Speech settings
  speechSynthesisEnabled: boolean;
  speechLanguage?: string;
}

export interface CaptionStyle {
  backgroundColor: string;
  backgroundOpacity: number;
  textColor: string;
  textSize: number;
  fontFamily: string;
  borderRadius: number;
  padding: number;
  maxWidth: number;
}

export interface MotorAccessibilitySettings {
  enabled: boolean;

  // Navigation
  keyboardNavigation: boolean;
  switchAccess: boolean;
  scanningMode: boolean;
  scanningSpeed: number; // 0.5-3.0

  // Touch settings
  touchTargets: {
    minimumSize: number; // pixels
    spacing: number;
    holdDuration: number; // ms
  };

  // Voice control
  voiceControlEnabled: boolean;
  voiceControlSensitivity: number; // 0-1

  // Gestures
  gestureReduction: boolean;
  simplifiedGestures: boolean;

  // Dwell clicking
  dwellClicking: boolean;
  dwellTime: number; // ms
  dwellRadius: number; // pixels
}

export interface CognitiveAccessibilitySettings {
  enabled: boolean;

  // Content simplification
  simplifyContent: boolean;
  readingLevel: number; // 1-12 grade level
  bulletPointsOnly: boolean;
  shorterSentences: boolean;

  // Memory aids
  glossaryEnabled: boolean;
  definitionsOnDemand: boolean;
  progressIndicators: boolean;

  // Focus aids
  removeDistractions: boolean;
  focusMode: boolean;
  consistentNavigation: boolean;

  // Time settings
  extendedTime: boolean;
  timeMultiplier: number;
  autoSaveProgress: boolean;

  // Structure
  clearStructure: boolean;
  breadcrumbsEnabled: boolean;
  tableOfContents: boolean;
}

export interface DeviceCapabilities {
  // Display
  supportsColor: boolean;
  supportsHighContrast: boolean;
  supportsScreenMagnification: boolean;
  screenSize: { width: number; height: number };
  pixelDensity: number;

  // Audio
  supportsAudio: boolean;
  supportsSpeechSynthesis: boolean;
  supportsSpeechRecognition: boolean;
  speakerVolume: number;
  microphoneAvailable: boolean;

  // Haptic
  supportsHaptics: boolean;
  hapticIntensity: number; // 0-1
  vibrationAvailable: boolean;

  // Touch
  supportsTouch: boolean;
  touchPoints: number;
  supportsMultiTouch: boolean;

  // Braille
  supportsBraille: boolean;
  brailleDisplayConnected: boolean;
  brailleDisplayRows: number;

  // Keyboard
  hasPhysicalKeyboard: boolean;

  // Processing
  processingPower: "low" | "medium" | "high";
}

export type AccessibilityModality =
  | "visual"
  | "auditory"
  | "tactile"
  | "voice";

export type AccessibilityFeature =
  | "captions"
  | "sign_language"
  | "audio_descriptions"
  | "voice_navigation"
  | "voice_commands"
  | "screen_reader"
  | "braille"
  | "haptic_feedback"
  | "high_contrast"
  | "keyboard_navigation"
  | "simplified_content"
  | "extended_time";

// Profile presets
export const PROFILE_PRESETS: Record<AccessibilityProfileType, Partial<AccessibilityProfile>> = {
  deaf: {
    type: "deaf",
    visual: {
      enabled: true,
      highContrast: false,
      fontSize: 16,
      fontSizeMultiplier: 1.0,
      lineHeight: 1.5,
      letterSpacing: 0,
      reduceMotion: false,
      reduceTransparency: false,
      focusIndicators: true,
      focusIndicatorSize: 3,
      focusIndicatorColor: "#0066CC",
      magnification: 1.0,
      zoomToFocus: false
    },
    audio: {
      enabled: true,
      volume: 1.0,
      speechRate: 1.0,
      pitch: 1.0,
      captionsEnabled: true,
      captionStyle: {
        backgroundColor: "#000000",
        backgroundOpacity: 0.8,
        textColor: "#FFFFFF",
        textSize: 18,
        fontFamily: "system-ui",
        borderRadius: 4,
        padding: 8,
        maxWidth: 600
      },
      captionPosition: "bottom",
      signLanguageEnabled: true,
      signLanguagePosition: "bottom_right",
      avatarSize: "medium",
      audioDescriptionsEnabled: false,
      audioDescriptionVolume: 1.0,
      visualAlerts: true,
      vibrationAlerts: true,
      flashAlerts: false,
      flashInterval: 200,
      speechSynthesisEnabled: false
    },
    motor: {
      enabled: false,
      keyboardNavigation: false,
      switchAccess: false,
      scanningMode: false,
      scanningSpeed: 1.0,
      touchTargets: { minimumSize: 44, spacing: 8, holdDuration: 500 },
      voiceControlEnabled: false,
      voiceControlSensitivity: 0.7,
      gestureReduction: false,
      simplifiedGestures: false,
      dwellClicking: false,
      dwellTime: 1000,
      dwellRadius: 20
    },
    cognitive: {
      enabled: false,
      simplifyContent: false,
      readingLevel: 8,
      bulletPointsOnly: false,
      shorterSentences: false,
      glossaryEnabled: false,
      definitionsOnDemand: false,
      progressIndicators: true,
      removeDistractions: false,
      focusMode: false,
      consistentNavigation: true,
      extendedTime: false,
      timeMultiplier: 1.0,
      autoSaveProgress: true,
      clearStructure: true,
      breadcrumbsEnabled: true,
      tableOfContents: false
    }
  },

  blind: {
    type: "blind",
    visual: {
      enabled: false,
      highContrast: true,
      highContrastTheme: "black_white",
      fontSize: 18,
      fontSizeMultiplier: 1.25,
      lineHeight: 1.8,
      letterSpacing: 0.05,
      reduceMotion: true,
      reduceTransparency: true,
      focusIndicators: true,
      focusIndicatorSize: 4,
      focusIndicatorColor: "#FFD700",
      magnification: 1.0,
      zoomToFocus: false
    },
    audio: {
      enabled: true,
      volume: 1.0,
      speechRate: 1.0,
      pitch: 1.0,
      captionsEnabled: false,
      captionStyle: {
        backgroundColor: "#000000",
        backgroundOpacity: 0.9,
        textColor: "#FFFFFF",
        textSize: 16,
        fontFamily: "system-ui",
        borderRadius: 0,
        padding: 4,
        maxWidth: 800
      },
      captionPosition: "bottom",
      signLanguageEnabled: false,
      signLanguagePosition: "bottom_right",
      avatarSize: "medium",
      audioDescriptionsEnabled: true,
      audioDescriptionVolume: 0.8,
      visualAlerts: false,
      vibrationAlerts: true,
      flashAlerts: false,
      flashInterval: 200,
      speechSynthesisEnabled: true
    },
    motor: {
      enabled: true,
      keyboardNavigation: true,
      switchAccess: false,
      scanningMode: false,
      scanningSpeed: 1.0,
      touchTargets: { minimumSize: 44, spacing: 8, holdDuration: 500 },
      voiceControlEnabled: true,
      voiceControlSensitivity: 0.8,
      gestureReduction: true,
      simplifiedGestures: true,
      dwellClicking: true,
      dwellTime: 800,
      dwellRadius: 25
    },
    cognitive: {
      enabled: false,
      simplifyContent: false,
      readingLevel: 8,
      bulletPointsOnly: false,
      shorterSentences: false,
      glossaryEnabled: true,
      definitionsOnDemand: true,
      progressIndicators: true,
      removeDistractions: false,
      focusMode: false,
      consistentNavigation: true,
      extendedTime: false,
      timeMultiplier: 1.0,
      autoSaveProgress: true,
      clearStructure: true,
      breadcrumbsEnabled: true,
      tableOfContents: true
    }
  },

  deafblind: {
    type: "deafblind",
    visual: {
      enabled: false,
      highContrast: true,
      highContrastTheme: "black_white",
      fontSize: 24,
      fontSizeMultiplier: 1.5,
      lineHeight: 2.0,
      letterSpacing: 0.1,
      reduceMotion: true,
      reduceTransparency: true,
      focusIndicators: true,
      focusIndicatorSize: 5,
      focusIndicatorColor: "#FFFFFF",
      magnification: 1.0,
      zoomToFocus: false
    },
    audio: {
      enabled: false,
      volume: 0,
      speechRate: 1.0,
      pitch: 1.0,
      captionsEnabled: false,
      captionStyle: {
        backgroundColor: "#000000",
        backgroundOpacity: 0.95,
        textColor: "#FFFFFF",
        textSize: 20,
        fontFamily: "system-ui",
        borderRadius: 0,
        padding: 8,
        maxWidth: 600
      },
      captionPosition: "bottom",
      signLanguageEnabled: false,
      signLanguagePosition: "bottom_right",
      avatarSize: "large",
      audioDescriptionsEnabled: false,
      audioDescriptionVolume: 0,
      visualAlerts: false,
      vibrationAlerts: true,
      flashAlerts: false,
      flashInterval: 300,
      speechSynthesisEnabled: false
    },
    motor: {
      enabled: true,
      keyboardNavigation: true,
      switchAccess: true,
      scanningMode: true,
      scanningSpeed: 0.5,
      touchTargets: { minimumSize: 60, spacing: 16, holdDuration: 1000 },
      voiceControlEnabled: false,
      voiceControlSensitivity: 0.5,
      gestureReduction: true,
      simplifiedGestures: true,
      dwellClicking: true,
      dwellTime: 1500,
      dwellRadius: 30
    },
    cognitive: {
      enabled: false,
      simplifyContent: false,
      readingLevel: 6,
      bulletPointsOnly: true,
      shorterSentences: true,
      glossaryEnabled: true,
      definitionsOnDemand: true,
      progressIndicators: true,
      removeDistractions: true,
      focusMode: true,
      consistentNavigation: true,
      extendedTime: true,
      timeMultiplier: 1.5,
      autoSaveProgress: true,
      clearStructure: true,
      breadcrumbsEnabled: true,
      tableOfContents: true
    }
  },

  hard_of_hearing: {
    type: "hard_of_hearing",
    visual: {
      enabled: true,
      highContrast: false,
      fontSize: 16,
      fontSizeMultiplier: 1.0,
      lineHeight: 1.5,
      letterSpacing: 0,
      reduceMotion: false,
      reduceTransparency: false,
      focusIndicators: true,
      focusIndicatorSize: 3,
      focusIndicatorColor: "#0066CC",
      magnification: 1.0,
      zoomToFocus: false
    },
    audio: {
      enabled: true,
      volume: 1.0,
      speechRate: 1.0,
      pitch: 1.0,
      captionsEnabled: true,
      captionStyle: {
        backgroundColor: "#000000",
        backgroundOpacity: 0.75,
        textColor: "#FFFFFF",
        textSize: 16,
        fontFamily: "system-ui",
        borderRadius: 4,
        padding: 6,
        maxWidth: 600
      },
      captionPosition: "bottom",
      signLanguageEnabled: false,
      signLanguagePosition: "bottom_right",
      avatarSize: "small",
      audioDescriptionsEnabled: false,
      audioDescriptionVolume: 1.0,
      visualAlerts: true,
      vibrationAlerts: false,
      flashAlerts: false,
      flashInterval: 200,
      speechSynthesisEnabled: false
    },
    motor: {
      enabled: false,
      keyboardNavigation: false,
      switchAccess: false,
      scanningMode: false,
      scanningSpeed: 1.0,
      touchTargets: { minimumSize: 44, spacing: 8, holdDuration: 500 },
      voiceControlEnabled: false,
      voiceControlSensitivity: 0.7,
      gestureReduction: false,
      simplifiedGestures: false,
      dwellClicking: false,
      dwellTime: 1000,
      dwellRadius: 20
    },
    cognitive: {
      enabled: false,
      simplifyContent: false,
      readingLevel: 8,
      bulletPointsOnly: false,
      shorterSentences: false,
      glossaryEnabled: false,
      definitionsOnDemand: false,
      progressIndicators: true,
      removeDistractions: false,
      focusMode: false,
      consistentNavigation: true,
      extendedTime: false,
      timeMultiplier: 1.0,
      autoSaveProgress: true,
      clearStructure: true,
      breadcrumbsEnabled: true,
      tableOfContents: false
    }
  },

  low_vision: {
    type: "low_vision",
    visual: {
      enabled: true,
      highContrast: true,
      highContrastTheme: "yellow_black",
      fontSize: 20,
      fontSizeMultiplier: 1.25,
      lineHeight: 1.8,
      letterSpacing: 0.02,
      reduceMotion: false,
      reduceTransparency: true,
      focusIndicators: true,
      focusIndicatorSize: 4,
      focusIndicatorColor: "#00FF00",
      magnification: 1.5,
      zoomToFocus: true
    },
    audio: {
      enabled: true,
      volume: 1.0,
      speechRate: 1.0,
      pitch: 1.0,
      captionsEnabled: false,
      captionStyle: {
        backgroundColor: "#000000",
        backgroundOpacity: 0.8,
        textColor: "#FFFFFF",
        textSize: 18,
        fontFamily: "system-ui",
        borderRadius: 4,
        padding: 6,
        maxWidth: 700
      },
      captionPosition: "bottom",
      signLanguageEnabled: false,
      signLanguagePosition: "bottom_right",
      avatarSize: "medium",
      audioDescriptionsEnabled: false,
      audioDescriptionVolume: 1.0,
      visualAlerts: true,
      vibrationAlerts: false,
      flashAlerts: false,
      flashInterval: 200,
      speechSynthesisEnabled: false
    },
    motor: {
      enabled: false,
      keyboardNavigation: false,
      switchAccess: false,
      scanningMode: false,
      scanningSpeed: 1.0,
      touchTargets: { minimumSize: 44, spacing: 8, holdDuration: 500 },
      voiceControlEnabled: false,
      voiceControlSensitivity: 0.7,
      gestureReduction: false,
      simplifiedGestures: false,
      dwellClicking: false,
      dwellTime: 1000,
      dwellRadius: 20
    },
    cognitive: {
      enabled: false,
      simplifyContent: false,
      readingLevel: 8,
      bulletPointsOnly: false,
      shorterSentences: false,
      glossaryEnabled: false,
      definitionsOnDemand: false,
      progressIndicators: true,
      removeDistractions: false,
      focusMode: false,
      consistentNavigation: true,
      extendedTime: false,
      timeMultiplier: 1.0,
      autoSaveProgress: true,
      clearStructure: true,
      breadcrumbsEnabled: true,
      tableOfContents: false
    }
  },

  motor_impaired: {
    type: "motor_impaired",
    visual: {
      enabled: true,
      highContrast: false,
      fontSize: 16,
      fontSizeMultiplier: 1.0,
      lineHeight: 1.5,
      letterSpacing: 0,
      reduceMotion: true,
      reduceTransparency: false,
      focusIndicators: true,
      focusIndicatorSize: 4,
      focusIndicatorColor: "#0066CC",
      magnification: 1.0,
      zoomToFocus: false
    },
    audio: {
      enabled: true,
      volume: 1.0,
      speechRate: 1.0,
      pitch: 1.0,
      captionsEnabled: false,
      captionStyle: {
        backgroundColor: "#000000",
        backgroundOpacity: 0.8,
        textColor: "#FFFFFF",
        textSize: 16,
        fontFamily: "system-ui",
        borderRadius: 4,
        padding: 6,
        maxWidth: 600
      },
      captionPosition: "bottom",
      signLanguageEnabled: false,
      signLanguagePosition: "bottom_right",
      avatarSize: "medium",
      audioDescriptionsEnabled: false,
      audioDescriptionVolume: 1.0,
      visualAlerts: true,
      vibrationAlerts: false,
      flashAlerts: false,
      flashInterval: 200,
      speechSynthesisEnabled: true
    },
    motor: {
      enabled: true,
      keyboardNavigation: true,
      switchAccess: true,
      scanningMode: true,
      scanningSpeed: 0.7,
      touchTargets: { minimumSize: 60, spacing: 12, holdDuration: 1000 },
      voiceControlEnabled: true,
      voiceControlSensitivity: 0.9,
      gestureReduction: true,
      simplifiedGestures: true,
      dwellClicking: true,
      dwellTime: 1200,
      dwellRadius: 30
    },
    cognitive: {
      enabled: false,
      simplifyContent: false,
      readingLevel: 8,
      bulletPointsOnly: false,
      shorterSentences: false,
      glossaryEnabled: false,
      definitionsOnDemand: false,
      progressIndicators: true,
      removeDistractions: false,
      focusMode: false,
      consistentNavigation: true,
      extendedTime: true,
      timeMultiplier: 1.5,
      autoSaveProgress: true,
      clearStructure: true,
      breadcrumbsEnabled: true,
      tableOfContents: true
    }
  },

  cognitive: {
    type: "cognitive",
    visual: {
      enabled: true,
      highContrast: false,
      fontSize: 18,
      fontSizeMultiplier: 1.0,
      lineHeight: 1.8,
      letterSpacing: 0,
      reduceMotion: true,
      reduceTransparency: false,
      focusIndicators: true,
      focusIndicatorSize: 4,
      focusIndicatorColor: "#0066CC",
      magnification: 1.0,
      zoomToFocus: false
    },
    audio: {
      enabled: true,
      volume: 1.0,
      speechRate: 0.85,
      pitch: 1.0,
      captionsEnabled: true,
      captionStyle: {
        backgroundColor: "#000000",
        backgroundOpacity: 0.8,
        textColor: "#FFFFFF",
        textSize: 18,
        fontFamily: "system-ui",
        borderRadius: 4,
        padding: 8,
        maxWidth: 600
      },
      captionPosition: "bottom",
      signLanguageEnabled: false,
      signLanguagePosition: "bottom_right",
      avatarSize: "medium",
      audioDescriptionsEnabled: false,
      audioDescriptionVolume: 1.0,
      visualAlerts: true,
      vibrationAlerts: false,
      flashAlerts: false,
      flashInterval: 200,
      speechSynthesisEnabled: true
    },
    motor: {
      enabled: false,
      keyboardNavigation: false,
      switchAccess: false,
      scanningMode: false,
      scanningSpeed: 1.0,
      touchTargets: { minimumSize: 44, spacing: 8, holdDuration: 500 },
      voiceControlEnabled: false,
      voiceControlSensitivity: 0.7,
      gestureReduction: false,
      simplifiedGestures: false,
      dwellClicking: false,
      dwellTime: 1000,
      dwellRadius: 20
    },
    cognitive: {
      enabled: true,
      simplifyContent: true,
      readingLevel: 6,
      bulletPointsOnly: true,
      shorterSentences: true,
      glossaryEnabled: true,
      definitionsOnDemand: true,
      progressIndicators: true,
      removeDistractions: true,
      focusMode: true,
      consistentNavigation: true,
      extendedTime: true,
      timeMultiplier: 2.0,
      autoSaveProgress: true,
      clearStructure: true,
      breadcrumbsEnabled: true,
      tableOfContents: true
    }
  },

  custom: {
    type: "custom",
    visual: {
      enabled: false,
      highContrast: false,
      fontSize: 16,
      fontSizeMultiplier: 1.0,
      lineHeight: 1.5,
      letterSpacing: 0,
      reduceMotion: false,
      reduceTransparency: false,
      focusIndicators: true,
      focusIndicatorSize: 3,
      focusIndicatorColor: "#0066CC",
      magnification: 1.0,
      zoomToFocus: false
    },
    audio: {
      enabled: false,
      volume: 1.0,
      speechRate: 1.0,
      pitch: 1.0,
      captionsEnabled: false,
      captionStyle: {
        backgroundColor: "#000000",
        backgroundOpacity: 0.8,
        textColor: "#FFFFFF",
        textSize: 16,
        fontFamily: "system-ui",
        borderRadius: 4,
        padding: 6,
        maxWidth: 600
      },
      captionPosition: "bottom",
      signLanguageEnabled: false,
      signLanguagePosition: "bottom_right",
      avatarSize: "medium",
      audioDescriptionsEnabled: false,
      audioDescriptionVolume: 1.0,
      visualAlerts: false,
      vibrationAlerts: false,
      flashAlerts: false,
      flashInterval: 200,
      speechSynthesisEnabled: false
    },
    motor: {
      enabled: false,
      keyboardNavigation: false,
      switchAccess: false,
      scanningMode: false,
      scanningSpeed: 1.0,
      touchTargets: { minimumSize: 44, spacing: 8, holdDuration: 500 },
      voiceControlEnabled: false,
      voiceControlSensitivity: 0.7,
      gestureReduction: false,
      simplifiedGestures: false,
      dwellClicking: false,
      dwellTime: 1000,
      dwellRadius: 20
    },
    cognitive: {
      enabled: false,
      simplifyContent: false,
      readingLevel: 8,
      bulletPointsOnly: false,
      shorterSentences: false,
      glossaryEnabled: false,
      definitionsOnDemand: false,
      progressIndicators: true,
      removeDistractions: false,
      focusMode: false,
      consistentNavigation: true,
      extendedTime: false,
      timeMultiplier: 1.0,
      autoSaveProgress: true,
      clearStructure: true,
      breadcrumbsEnabled: true,
      tableOfContents: false
    }
  }
};

// Helper functions
export function createDefaultProfile(userId: string, type: AccessibilityProfileType): AccessibilityProfile {
  const preset = PROFILE_PRESETS[type];

  return {
    id: `profile-${Date.now()}`,
    userId,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Profile`,
    type,
    visual: { ...preset.visual },
    audio: { ...preset.audio },
    motor: { ...preset.motor },
    cognitive: { ...preset.cognitive },
    deviceCapabilities: {
      supportsColor: true,
      supportsHighContrast: true,
      supportsScreenMagnification: false,
      screenSize: { width: 1920, height: 1080 },
      pixelDensity: 1,
      supportsAudio: true,
      supportsSpeechSynthesis: true,
      supportsSpeechRecognition: false,
      speakerVolume: 1,
      microphoneAvailable: false,
      supportsHaptics: true,
      hapticIntensity: 1,
      vibrationAvailable: true,
      supportsTouch: true,
      touchPoints: 1,
      supportsMultiTouch: true,
      supportsBraille: false,
      brailleDisplayConnected: false,
      brailleDisplayRows: 0,
      hasPhysicalKeyboard: true,
      processingPower: "high"
    },
    preferredModalities: getDefaultModalities(type),
    enabledFeatures: getDefaultFeatures(type),
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true
  };
}

function getDefaultModalities(type: AccessibilityProfileType): AccessibilityModality[] {
  switch (type) {
    case "deaf":
      return ["visual", "tactile"];
    case "blind":
      return ["auditory", "voice", "tactile"];
    case "deafblind":
      return ["tactile"];
    default:
      return ["visual", "auditory"];
  }
}

function getDefaultFeatures(type: AccessibilityProfileType): AccessibilityFeature[] {
  switch (type) {
    case "deaf":
      return ["captions", "sign_language", "visual_alerts", "haptic_feedback"];
    case "blind":
      return ["voice_navigation", "voice_commands", "screen_reader", "audio_descriptions", "braille", "keyboard_navigation"];
    case "deafblind":
      return ["braille", "haptic_feedback", "keyboard_navigation", "extended_time", "simplified_content"];
    default:
      return ["captions", "high_contrast"];
  }
}

// Detect device capabilities
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === "undefined") {
    return {
      supportsColor: true,
      supportsHighContrast: false,
      supportsScreenMagnification: false,
      screenSize: { width: 1920, height: 1080 },
      pixelDensity: 1,
      supportsAudio: true,
      supportsSpeechSynthesis: false,
      supportsSpeechRecognition: false,
      speakerVolume: 1,
      microphoneAvailable: false,
      supportsHaptics: false,
      hapticIntensity: 1,
      vibrationAvailable: false,
      supportsTouch: false,
      touchPoints: 0,
      supportsMultiTouch: false,
      supportsBraille: false,
      brailleDisplayConnected: false,
      brailleDisplayRows: 0,
      hasPhysicalKeyboard: true,
      processingPower: "high"
    };
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  return {
    supportsColor: ctx && ctx.fillStyle !== undefined,
    supportsHighContrast: window.matchMedia("(forced-colors: active)").matches,
    supportsScreenMagnification: window.visualViewport !== undefined,
    screenSize: {
      width: window.screen.width,
      height: window.screen.height
    },
    pixelDensity: window.devicePixelRatio || 1,
    supportsAudio: true,
    supportsSpeechSynthesis: "speechSynthesis" in window,
    supportsSpeechRecognition: "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
    speakerVolume: 1,
    microphoneAvailable: navigator.mediaDevices?.getUserMedia !== undefined,
    supportsHaptics: "vibrate" in navigator,
    hapticIntensity: 1,
    vibrationAvailable: "vibrate" in navigator,
    supportsTouch: "ontouchstart" in window,
    touchPoints: navigator.maxTouchPoints || 0,
    supportsMultiTouch: (navigator.maxTouchPoints || 0) > 1,
    supportsBraille: false,
    brailleDisplayConnected: false,
    brailleDisplayRows: 0,
    hasPhysicalKeyboard: true,
    processingPower: "high"
  };
}
