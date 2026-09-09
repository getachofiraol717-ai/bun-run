// @ts-nocheck
// Accessibility Engine — AccessibilitySettings Models
// Global accessibility configuration and settings

export interface GlobalAccessibilitySettings {
  // Platform-wide accessibility
  platform: PlatformSettings;

  // Feature toggles
  features: FeatureSettings;

  // Content defaults
  content: ContentSettings;

  // Integration settings
  integrations: IntegrationSettings;

  // Analytics
  analytics: AnalyticsSettings;

  // Version
  version: string;
  lastUpdated: Date;
}

export interface PlatformSettings {
  // Default accessibility level
  defaultAccessibilityLevel: "basic" | "intermediate" | "full";

  // Auto-detect settings
  autoDetect: boolean;
  detectOnFirstVisit: boolean;

  // Override capabilities
  allowUserOverrides: boolean;
  enforceMinimumAccessibility: boolean;

  // Testing
  accessibilityTestingMode: boolean;
  showAccessibilityOutlines: boolean;

  // Keyboard navigation
  trapFocusInModals: boolean;
  skipNavigationLinks: boolean;
  focusManagement: boolean;

  // Animation
  respectReducedMotion: boolean;
  animationDuration: number; // ms

  // Performance
  optimizeForScreenReaders: boolean;
  preloadAccessibilityContent: boolean;
}

export interface FeatureSettings {
  // Caption features
  captions: CaptionFeatureSettings;

  // Sign language
  signLanguage: SignLanguageFeatureSettings;

  // Voice features
  voice: VoiceFeatureSettings;

  // Braille features
  braille: BrailleFeatureSettings;

  // Visual features
  visual: VisualFeatureSettings;

  // Haptic features
  haptics: HapticFeatureSettings;

  // Alternative formats
  alternatives: AlternativeFormatSettings;
}

export interface CaptionFeatureSettings {
  enabled: boolean;
  autoGenerate: boolean;
  useAIForAccuracy: boolean;
  languages: string[];
  defaultLanguage: string;
  maxLines: number;
  showSpeakerLabels: boolean;
  backgroundOpacity: number;
  textSize: number;
  position: "bottom" | "top";
}

export interface SignLanguageFeatureSettings {
  enabled: boolean;
  avatarEnabled: boolean;
  supportedLanguages: string[];
  defaultLanguage: string;
  avatarPosition: "bottom_right" | "bottom_left" | "corner";
  avatarSize: "small" | "medium" | "large";
  autoPlay: boolean;
  quality: "low" | "medium" | "high";
}

export interface VoiceFeatureSettings {
  enabled: boolean;
  speechSynthesis: boolean;
  speechRecognition: boolean;
  voiceCommands: boolean;
  defaultVoice: string;
  speechRate: number;
  pitch: number;
  volume: number;
  languages: string[];
  defaultLanguage: string;
  continuousMode: boolean;
}

export interface BrailleFeatureSettings {
  enabled: boolean;
  grade: 1 | 2;
  tableType: "unified" | "computer" | "literary";
  contractions: boolean;
  eightDot: boolean;
  computerBraille: boolean;
  lineSpacing: number;
  refreshRate: number;
}

export interface VisualFeatureSettings {
  enabled: boolean;
  highContrast: boolean;
  colorBlindModes: ("protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia")[];
  fontSizes: {
    min: number;
    max: number;
    default: number;
  };
  lineSpacing: {
    min: number;
    max: number;
    default: number;
  };
  zoomLevels: number[];
  defaultZoom: number;
}

export interface HapticFeatureSettings {
  enabled: boolean;
  vibrationPatterns: boolean;
  intensityLevels: "low" | "medium" | "high" | "all";
  feedbackTypes: ("notification" | "navigation" | "interaction" | "achievement")[];
  pulsePatterns: boolean;
  customPatterns: boolean;
}

export interface AlternativeFormatSettings {
  enabled: boolean;
  formats: ("pdf" | "epub" | "html" | "docx" | "audio" | "braille")[];
  autoGenerate: boolean;
  preferFormat: "pdf" | "epub" | "html" | "audio" | "braille";
}

export interface ContentSettings {
  // Text content
  text: TextContentSettings;

  // Media content
  media: MediaContentSettings;

  // Interactive content
  interactive: InteractiveContentSettings;

  // Navigation
  navigation: NavigationContentSettings;
}

export interface TextContentSettings {
  // Reading level
  defaultReadingLevel: number; // 1-12
  minReadingLevel: number;
  maxReadingLevel: number;

  // Simplification
  autoSimplify: boolean;
  preserveTechnicalTerms: boolean;

  // Structure
  preferBulletPoints: boolean;
  preferShortSentences: boolean;
  maxSentenceLength: number;

  // Glossary
  autoGenerateGlossary: boolean;
  glossaryPosition: "inline" | "sidebar" | "popup";

  // Links
  linkUnderline: boolean;
  linkDescriptionRequired: boolean;
}

export interface MediaContentSettings {
  // Images
  images: ImageContentSettings;

  // Videos
  videos: VideoContentSettings;

  // Audio
  audio: AudioContentSettings;
}

export interface ImageContentSettings {
  requireAltText: boolean;
  altTextMinLength: number;
  autoGenerateAltText: boolean;
  useAIForDescriptions: boolean;
  includeTextTranscription: boolean;
  preferLongDescriptions: boolean;
}

export interface VideoContentSettings {
  requireCaptions: boolean;
  requireAudioDescriptions: boolean;
  autoGenerateCaptions: boolean;
  captionQualityThreshold: number;
  autoGenerateAudioDescriptions: boolean;
  includeTranscripts: boolean;
}

export interface AudioContentSettings {
  requireTranscripts: boolean;
  autoGenerateTranscripts: boolean;
  includeTimestamps: boolean;
  speakerIdentification: boolean;
}

export interface InteractiveContentSettings {
  // Quizzes
  quizzes: QuizAccessibilitySettings;

  // Simulations
  simulations: SimulationAccessibilitySettings;

  // Games
  games: GameAccessibilitySettings;
}

export interface QuizAccessibilitySettings {
  timeMultiplier: number;
  allowPause: boolean;
  autoSubmit: boolean;
  showProgressBar: boolean;
  keyboardNavigation: boolean;
  screenReaderFriendly: boolean;
}

export interface SimulationAccessibilitySettings {
  audioDescription: boolean;
  keyboardControl: boolean;
  pauseAndExplain: boolean;
  stepByStepMode: boolean;
  simplifyVisuals: boolean;
}

export interface GameAccessibilitySettings {
  timerMode: "none" | "optional" | "required";
  penaltyFreeMode: boolean;
  hintsAvailable: boolean;
  skipAvailable: boolean;
  adjustableDifficulty: boolean;
}

export interface NavigationContentSettings {
  breadcrumbs: boolean;
  tableOfContents: boolean;
  progressIndicator: boolean;
  skipLinks: boolean;
  focusIndicators: boolean;
  logicalTabOrder: boolean;
  landmarkRegions: boolean;
}

export interface IntegrationSettings {
  // Screen readers
  screenReaders: ScreenReaderIntegrationSettings;

  // Braille displays
  brailleDisplays: BrailleDisplayIntegrationSettings;

  // Switch access
  switchAccess: SwitchAccessIntegrationSettings;

  // Voice recognition
  voiceRecognition: VoiceRecognitionIntegrationSettings;
}

export interface ScreenReaderIntegrationSettings {
  enabled: boolean;
  supportedReaders: ("JAWS" | "NVDA" | "VoiceOver" | "Narrator")[];
  announceDynamicChanges: boolean;
  announcePageChanges: boolean;
  liveRegions: boolean;
  politeAnnouncements: boolean;
}

export interface BrailleDisplayIntegrationSettings {
  enabled: boolean;
  supportedDisplays: string[];
  autoDetect: boolean;
  inputNavigation: boolean;
  statusCells: boolean;
  routerKeys: boolean;
}

export interface SwitchAccessIntegrationSettings {
  enabled: boolean;
  scanningModes: ("linear" | "row" | "group")[];
  defaultScanMode: "linear" | "row" | "group";
  autoScanDelay: number;
  switchNumber: 1 | 2;
  audioFeedback: boolean;
}

export interface VoiceRecognitionIntegrationSettings {
  enabled: boolean;
  continuousMode: boolean;
  interimResults: boolean;
  language: string;
  sensitivity: number;
  noiseThreshold: number;
  commandsEnabled: boolean;
  customCommands: boolean;
}

export interface AnalyticsSettings {
  enabled: boolean;
  trackAccessibilityUsage: boolean;
  trackFeatureAdoption: boolean;
  trackUserPreferences: boolean;
  trackBarrierEncounters: boolean;
  anonymizeData: boolean;
  retentionPeriod: number; // days
}

// Default settings
export const DEFAULT_GLOBAL_SETTINGS: GlobalAccessibilitySettings = {
  platform: {
    defaultAccessibilityLevel: "basic",
    autoDetect: true,
    detectOnFirstVisit: true,
    allowUserOverrides: true,
    enforceMinimumAccessibility: false,
    accessibilityTestingMode: false,
    showAccessibilityOutlines: false,
    trapFocusInModals: true,
    skipNavigationLinks: true,
    focusManagement: true,
    respectReducedMotion: true,
    animationDuration: 200,
    optimizeForScreenReaders: false,
    preloadAccessibilityContent: false
  },
  features: {
    captions: {
      enabled: true,
      autoGenerate: true,
      useAIForAccuracy: true,
      languages: ["en", "es", "fr", "de", "zh", "ja", "ko"],
      defaultLanguage: "en",
      maxLines: 2,
      showSpeakerLabels: false,
      backgroundOpacity: 0.8,
      textSize: 16,
      position: "bottom"
    },
    signLanguage: {
      enabled: true,
      avatarEnabled: true,
      supportedLanguages: ["en", "es", "fr", "de", "zh", "ja"],
      defaultLanguage: "en",
      avatarPosition: "bottom_right",
      avatarSize: "medium",
      autoPlay: true,
      quality: "high"
    },
    voice: {
      enabled: true,
      speechSynthesis: true,
      speechRecognition: true,
      voiceCommands: true,
      defaultVoice: "default",
      speechRate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      languages: ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE"],
      defaultLanguage: "en-US",
      continuousMode: false
    },
    braille: {
      enabled: true,
      grade: 2,
      tableType: "unified",
      contractions: true,
      eightDot: false,
      computerBraille: false,
      lineSpacing: 1,
      refreshRate: 60
    },
    visual: {
      enabled: true,
      highContrast: true,
      colorBlindModes: ["protanopia", "deuteranopia", "tritanopia"],
      fontSizes: { min: 12, max: 32, default: 16 },
      lineSpacing: { min: 1.2, max: 2.5, default: 1.5 },
      zoomLevels: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
      defaultZoom: 1.0
    },
    haptics: {
      enabled: true,
      vibrationPatterns: true,
      intensityLevels: "all",
      feedbackTypes: ["notification", "navigation", "interaction", "achievement"],
      pulsePatterns: true,
      customPatterns: true
    },
    alternatives: {
      enabled: true,
      formats: ["pdf", "html", "audio"],
      autoGenerate: true,
      preferFormat: "html"
    }
  },
  content: {
    text: {
      defaultReadingLevel: 8,
      minReadingLevel: 1,
      maxReadingLevel: 12,
      autoSimplify: false,
      preserveTechnicalTerms: true,
      preferBulletPoints: false,
      preferShortSentences: false,
      maxSentenceLength: 25,
      autoGenerateGlossary: true,
      glossaryPosition: "sidebar"
    },
    media: {
      images: {
        requireAltText: true,
        altTextMinLength: 10,
        autoGenerateAltText: true,
        useAIForDescriptions: true,
        includeTextTranscription: false,
        preferLongDescriptions: false
      },
      videos: {
        requireCaptions: true,
        requireAudioDescriptions: false,
        autoGenerateCaptions: true,
        captionQualityThreshold: 0.8,
        autoGenerateAudioDescriptions: false,
        includeTranscripts: true
      },
      audio: {
        requireTranscripts: true,
        autoGenerateTranscripts: true,
        includeTimestamps: true,
        speakerIdentification: false
      }
    },
    interactive: {
      quizzes: {
        timeMultiplier: 1.5,
        allowPause: true,
        autoSubmit: false,
        showProgressBar: true,
        keyboardNavigation: true,
        screenReaderFriendly: true
      },
      simulations: {
        audioDescription: true,
        keyboardControl: true,
        pauseAndExplain: true,
        stepByStepMode: true,
        simplifyVisuals: false
      },
      games: {
        timerMode: "optional",
        penaltyFreeMode: true,
        hintsAvailable: true,
        skipAvailable: true,
        adjustableDifficulty: true
      }
    },
    navigation: {
      breadcrumbs: true,
      tableOfContents: true,
      progressIndicator: true,
      skipLinks: true,
      focusIndicators: true,
      logicalTabOrder: true,
      landmarkRegions: true
    }
  },
  integrations: {
    screenReaders: {
      enabled: true,
      supportedReaders: ["JAWS", "NVDA", "VoiceOver", "Narrator"],
      announceDynamicChanges: true,
      announcePageChanges: true,
      liveRegions: true,
      politeAnnouncements: true
    },
    brailleDisplays: {
      enabled: true,
      supportedDisplays: [],
      autoDetect: true,
      inputNavigation: true,
      statusCells: true,
      routerKeys: true
    },
    switchAccess: {
      enabled: true,
      scanningModes: ["linear", "row", "group"],
      defaultScanMode: "linear",
      autoScanDelay: 1000,
      switchNumber: 2,
      audioFeedback: true
    },
    voiceRecognition: {
      enabled: true,
      continuousMode: true,
      interimResults: true,
      language: "en-US",
      sensitivity: 0.5,
      noiseThreshold: 0.5,
      commandsEnabled: true,
      customCommands: true
    }
  },
  analytics: {
    enabled: true,
    trackAccessibilityUsage: true,
    trackFeatureAdoption: true,
    trackUserPreferences: true,
    trackBarrierEncounters: true,
    anonymizeData: true,
    retentionPeriod: 90
  },
  version: "1.0.0",
  lastUpdated: new Date()
};

// Helper functions
export function validateSettings(settings: GlobalAccessibilitySettings): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (settings.platform.animationDuration < 0) {
    errors.push("Animation duration must be non-negative");
  }

  if (settings.content.text.minReadingLevel > settings.content.text.maxReadingLevel) {
    errors.push("Min reading level cannot exceed max reading level");
  }

  if (settings.content.text.defaultReadingLevel < settings.content.text.minReadingLevel ||
      settings.content.text.defaultReadingLevel > settings.content.text.maxReadingLevel) {
    errors.push("Default reading level must be between min and max");
  }

  if (settings.features.captions.textSize < 8 || settings.features.captions.textSize > 32) {
    errors.push("Caption text size must be between 8 and 32");
  }

  if (settings.features.captions.backgroundOpacity < 0 || settings.features.captions.backgroundOpacity > 1) {
    errors.push("Caption background opacity must be between 0 and 1");
  }

  if (settings.features.voice.speechRate < 0.5 || settings.features.voice.speechRate > 2.0) {
    errors.push("Speech rate must be between 0.5 and 2.0");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
