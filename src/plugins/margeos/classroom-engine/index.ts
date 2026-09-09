// @ts-nocheck
/**
 * Classroom Communication Hub
 *
 * Main entry point for the Classroom Communication Hub module.
 * Provides real-time educational communication, media sharing,
 * classroom collaboration, and AI educational assistance.
 */

// Core exports
export * from './core';

// Models exports
export * from './models';

// Services exports
export * from './services';

// Hooks exports
export * from './hooks';

// Realtime exports
export * from './realtime';

// Interfaces exports
export * from './interfaces';

// Integrations exports
export * from './integrations';

// Engines exports
export * from './engines';

// Store export
export { useClassroomStore, classroomState } from './store/classroomStore';

// Utils exports
export * from './utils';
export * from './utils/messagingUtils';
export * from './utils/mediaUtils';
export * from './utils/channelUtils';
export * from './utils/notificationUtils';
export * from './utils/moderationUtils';

// Main controller
export { ClassroomController } from './core/ClassroomController';

/**
 * Classroom Communication Hub Version
 */
export const CLASSROOM_ENGINE_VERSION = '1.0.0';

/**
 * MargeOS Integration Version
 */
export const MARGEOS_INTEGRATION_VERSION = '1.0.0';

/**
 * Feature flags for the classroom engine
 */
export const FEATURE_FLAGS = {
  ENABLE_REAL_TIME_MESSAGING: true,
  ENABLE_VOICE_NOTES: true,
  ENABLE_MEDIA_SHARING: true,
  ENABLE_MODERATION: true,
  ENABLE_ANALYTICS: true,
  ENABLE_PRESENCE: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_THREADING: true,
  ENABLE_REACTIONS: true,
  ENABLE_EDUCATIONAL_LINKS: true,
  ENABLE_SMART_PDF_INTEGRATION: true,
  ENABLE_AI_TUTOR_INTEGRATION: true,
  ENABLE_FORMULA_INTEGRATION: true,
  ENABLE_REFERENCE_BOOK_INTEGRATION: true,
  ENABLE_VISUAL_LEARNING_INTEGRATION: true,
  ENABLE_ACCESSIBILITY_INTEGRATION: true,
  ENABLE_STUDY_COMPANION_INTEGRATION: true,
  ENABLE_MEMORY_VAULT_INTEGRATION: true,
  ENABLE_KNOWLEDGE_GALAXY_INTEGRATION: true,
  ENABLE_QUIZ_ENGINE_INTEGRATION: true,
  ENABLE_EXAM_SIMULATOR_INTEGRATION: true,
  ENABLE_ANALYTICS_INTEGRATION: true,
  ENABLE_WORLD_BUILDER_INTEGRATION: true
} as const;

/**
 * Default configuration for the classroom engine
 */
export const DEFAULT_CONFIG = {
  maxClassrooms: 50,
  maxMembersPerClassroom: 100,
  maxChannelsPerClassroom: 50,
  maxMessageLength: 10000,
  maxAttachments: 10,
  maxVoiceNoteDuration: 300, // 5 minutes
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFileTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  enableRealTime: true,
  enableModeration: true,
  enableAnalytics: true,
  enableMediaSharing: true,
  enableVoiceNotes: true
} as const;

/**
 * Initialize the Classroom Communication Hub
 */
export async function initializeClassroomEngine(config?: Partial<typeof DEFAULT_CONFIG>): Promise<void> {
  const { ClassroomEngine } = await import('./core/ClassroomEngine');
  const engine = ClassroomEngine.getInstance(config);
  await engine.initialize();
}

/**
 * Initialize the MargeOS Integration Hub
 */
export async function initializeMargeOSIntegration(config?: {
  enableSmartPDFIntegration?: boolean;
  enableAITutorIntegration?: boolean;
  enableFormulaIntegration?: boolean;
  enableReferenceBookIntegration?: boolean;
  enableVisualLearningIntegration?: boolean;
  enableAccessibilityIntegration?: boolean;
  enableStudyCompanionIntegration?: boolean;
  enableMemoryVaultIntegration?: boolean;
  enableKnowledgeGalaxyIntegration?: boolean;
  enableQuizEngineIntegration?: boolean;
  enableExamSimulatorIntegration?: boolean;
  enableAnalyticsIntegration?: boolean;
  enableWorldBuilderIntegration?: boolean;
}): Promise<void> {
  const { MargeOSIntegration } = await import('./integrations/MargeOSIntegration');
  const integration = MargeOSIntegration.getInstance(config);
  await integration.initialize();
}

/**
 * Get the singleton ClassroomEngine instance
 */
export function getClassroomEngine(): import('./engines/ClassroomEngine').ClassroomEngine {
  const { ClassroomEngine } = require('./core/ClassroomEngine');
  return ClassroomEngine.getInstance();
}

/**
 * Get the singleton ClassroomController instance
 */
export function getClassroomController(): import('./core/ClassroomController').ClassroomController {
  const { ClassroomController } = require('./core/ClassroomController');
  return ClassroomController.getInstance();
}

/**
 * Get the singleton MargeOSIntegration instance
 */
export function getMargeOSIntegration(): import('./integrations/MargeOSIntegration').MargeOSIntegration {
  const { MargeOSIntegration } = require('./integrations/MargeOSIntegration');
  return MargeOSIntegration.getInstance();
}

/**
 * Default export
 */
export { ClassroomController as default } from './core/ClassroomController';
