// @ts-nocheck
// Accessibility Engine — Main Export
// Barrel file for all public exports

// Models
export * from "./models/AccessibilityProfile";
export * from "./models/AccessibilitySettings";
export * from "./models/Caption";
export * from "./models/AudioDescription";
export * from "./models/BrailleContent";
export * from "./models/AccessibilitySession";

// Core
export { AccessibilityEngine, accessibilityEngine } from "./core/AccessibilityEngine";
export { AccessibilityController, accessibilityController } from "./core/AccessibilityController";
export { AccessibilityProfileManager, accessibilityProfileManager } from "./core/AccessibilityProfileManager";
export { ContentTransformationEngine, contentTransformationEngine } from "./core/ContentTransformationEngine";
export { AccessibilityDecisionEngine, accessibilityDecisionEngine } from "./core/AccessibilityDecisionEngine";
export { AccessibilityAdapter, accessibilityAdapter } from "./core/AccessibilityAdapter";
export { AccessibilityPreferences, accessibilityPreferences } from "./core/AccessibilityPreferences";
export { UniversalAccessibilityManager, universalAccessibilityManager } from "./core/UniversalAccessibilityManager";

// Deaf Support
export { SignLanguageEngine, signLanguageEngine } from "./deaf-support/SignLanguageEngine";
export { LiveCaptionEngine, liveCaptionEngine } from "./deaf-support/LiveCaptionEngine";
export { VisualAlertEngine, visualAlertEngine } from "./deaf-support/VisualAlertEngine";
export { CaptionSynchronization, captionSynchronization } from "./deaf-support/CaptionSynchronization";
export { VisualNotificationManager, visualNotificationManager } from "./deaf-support/VisualNotificationManager";

// Blind Support
export { VoiceNavigationEngine, voiceNavigationEngine } from "./blind-support/VoiceNavigationEngine";
export { AudioDescriptionEngine, audioDescriptionEngine } from "./blind-support/AudioDescriptionEngine";
export { VoiceCommandEngine, voiceCommandEngine } from "./blind-support/VoiceCommandEngine";
export { ScreenReaderIntegration, screenReaderIntegration } from "./blind-support/ScreenReaderIntegration";
export { NavigationAssistant, navigationAssistant } from "./blind-support/NavigationAssistant";

// Deafblind Support
export { BrailleEngine, brailleEngine } from "./deafblind-support/BrailleEngine";
export { HapticFeedbackEngine, hapticFeedbackEngine } from "./deafblind-support/HapticFeedbackEngine";
export { TouchNavigationEngine, touchNavigationEngine } from "./deafblind-support/TouchNavigationEngine";
export { TactileLearningEngine, tactileLearningEngine } from "./deafblind-support/TactileLearningEngine";
export { BrailleTranslationEngine, brailleTranslationEngine } from "./deafblind-support/BrailleTranslationEngine";

// Services
export { SpeechService, speechService } from "./services/SpeechService";
export { CaptionService, captionService } from "./services/CaptionService";
export { AccessibilityProfileService, accessibilityProfileService } from "./services/AccessibilityProfileService";
export { TactileService, tactileService } from "./services/TactileService";
export { VoiceRecognitionService, voiceRecognitionService } from "./services/VoiceRecognitionService";
export { AccessibilityAnalyticsService, accessibilityAnalyticsService } from "./services/AccessibilityAnalyticsService";

// Hooks
export { useAccessibility } from "./hooks/useAccessibility";
export { useVoiceNavigation } from "./hooks/useVoiceNavigation";
export { useCaptions } from "./hooks/useCaptions";
export { useBraille } from "./hooks/useBraille";
export { useHaptics } from "./hooks/useHaptics";

// Store
export { accessibilityStore } from "./store/accessibilityStore";
export type { AccessibilityState, AccessibilityActions, AccessibilityStore } from "./store/accessibilityStore";

// Utils
export * from "./utils/captionUtils";
export * from "./utils/voiceUtils";
export * from "./utils/brailleUtils";
export * from "./utils/hapticUtils";
export * from "./utils/accessibilityUtils";

// Version info
export const VERSION = "1.0.0";
export const ENGINE_NAME = "MargeOS Accessibility Engine";
