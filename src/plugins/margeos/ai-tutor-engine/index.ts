// @ts-nocheck
// ════════════════════════════════════════════════════════════════
// MargeOS AI Tutor Engine ("AI Teacher Mode")
// src/plugins/margeos/ai-tutor-engine/
// ════════════════════════════════════════════════════════════════

// Core
export { preparePageSession, teachBlock, AITutorEngine } from "./core/AITutorEngine";
export { planLesson } from "./core/LessonPlanner";
export { TutorController } from "./core/TutorControllerV2";
export {
  startSession,
  teachNextBlock,
  explainConcept,
  teachFormulaById,
  getExample,
  recordConfusion,
  markMastered,
  markSkipped,
  logMistake,
  logQuestion,
  endSession,
  isPageLessonComplete,
  tutorController,
} from "./core/TutorController";
export { generateExplanation } from "./core/ExplanationGenerator";
export { teachFormula } from "./core/FormulaTeachingEngine";
export { generateExample } from "./core/ExampleGenerator";
export {
  confusionCountFor,
  escalationFor,
  recordConfusionIncrement,
  escalationAction,
} from "./core/DifficultyAdapter";
export type { EscalationAction } from "./core/DifficultyAdapter";
export { currentLearningStyle, descriptorFor, suggestStyleFromModeUsage } from "./core/LearningStyleDetector";
export { predictFollowUpQuestions, decideNextAction } from "./core/TutorDecisionEngine";
export type { NextActionDecision } from "./core/TutorDecisionEngine";
export * as TeachingSessionManager from "./core/TeachingSessionManager";

// New Core Engines
export { ContextEngine } from "./core/ContextEngine";
export { TeachingEngine } from "./core/TeachingEngine";
export { LearningProfileEngine } from "./core/LearningProfileEngine";
export { ConversationEngine } from "./core/ConversationEngine";
export { RecommendationEngine } from "./core/RecommendationEngine";
export { ResponseCardEngine } from "./core/ResponseCardEngine";
export { VisualTeachingEngine } from "./core/VisualTeachingEngine";
export { AccessibilityEngine } from "./core/AccessibilityEngine";

// Cards
export * from "./cards";

// Generators
export { generateSummaryData } from "./generators/SummaryGenerator";
export { generateQuizData } from "./generators/QuizGenerator";
export { generateFlashcardData } from "./generators/FlashcardGenerator";
export { generateExampleText } from "./generators/ExampleGenerator";
export { generateFormulaData } from "./generators/FormulaGenerator";
export { generateDiagramData } from "./generators/DiagramGenerator";
export { generateVisualData } from "./generators/VisualGenerator";
export { generateCodingData } from "./generators/CodingExplanationGenerator";
export { generateRecommendationData } from "./generators/RecommendationGenerator";

// Services
export { ContextService } from "./services/ContextService";
export { TeachingService } from "./services/TeachingService";
export { ConversationService } from "./services/ConversationService";
export { AccessibilityService } from "./services/AccessibilityService";
export { VisualizationService } from "./services/VisualizationService";
export { LearningAnalyticsService } from "./services/LearningAnalyticsService";
export { getAnalysisResult, buildPageContext, getPageContext, syncMemoryToVault } from "./services/ContextMemoryService";
export type { VaultMemoryType } from "./services/ContextMemoryService";
export { generateTeachingText } from "./services/AIConversationService";
export type { ConversationRequest, ConversationResult } from "./services/AIConversationService";
export { generateProjectWithAITutor } from "./services/ProjectGeneratorService";
export type { GeneratedProjectFile, GeneratedProjectManifest, GenerateProjectOptions } from "./services/ProjectGeneratorService";
export { buildTeachingInstruction, subjectForContext, memoryHintFor, connectionsLine } from "./services/TutorPromptService";
export { expandConcept } from "./services/ConceptExpansionService";
export { generateAnalogy, instantSeedAnalogy } from "./services/AnalogyService";
export {
  markBlockInProgress,
  markBlockTaught,
  markBlockSkipped,
  currentOrNextBlock,
  isLessonComplete,
} from "./services/TeachingFlowService";

// Models
export { DEFAULT_STUDENT_PROFILE, summarizeProfileForAI } from "./models/StudentProfile";
export type { AgeBand, ExplanationMode, StudentProfile, MasteredTopic, MistakeRecord, FAQRecord } from "./models/StudentProfile";
export { LEARNING_STYLE_DESCRIPTORS } from "./models/LearningStyle";
export type { LearningStyle, LearningStyleDescriptor } from "./models/LearningStyle";
export { createEmptySession } from "./models/TeachingSession";
export type { PageContext, TeachingSession, TeachingSessionStatus, ConfusionState } from "./models/TeachingSession";
export { nextTutorMessageId } from "./models/TutorMessage";
export type { TutorMessage, TutorMessageType, TutorMessageStatus } from "./models/TutorMessage";
export { lessonPlanProgress, nextUntaughtBlock } from "./models/LessonPlan";
export type { LessonBlock, LessonPlan, LessonBlockStatus } from "./models/LessonPlan";
export { conceptsTaught } from "./models/TeachingResult";
export type { TeachingResult, SessionSummary } from "./models/TeachingResult";

// Store
export { getSession, setSession, subscribeSession, getProfile, setProfile, subscribeProfile } from "./store/aiTutorStore";

// Hooks
export { useAITutor } from "./hooks/useAITutor";
export type { UseAITutorOptions, UseAITutorResult } from "./hooks/useAITutor";
export { useTeachingSession } from "./hooks/useTeachingSession";
export type { UseTeachingSessionResult } from "./hooks/useTeachingSession";
export { useConceptExplanation } from "./hooks/useConceptExplanation";
export type { UseConceptExplanationResult } from "./hooks/useConceptExplanation";
export { useFormulaTeaching } from "./hooks/useFormulaTeaching";
export type { UseFormulaTeachingResult } from "./hooks/useFormulaTeaching";
export { useLearningStyle } from "./hooks/useLearningStyle";
export type { UseLearningStyleResult } from "./hooks/useLearningStyle";
export { useTeaching } from "./hooks/useTeaching";
export { useLearningProfile } from "./hooks/useLearningProfile";
export { useCards } from "./hooks/useCards";
export { useRecommendations } from "./hooks/useRecommendations";

// Utils
export { AGE_BAND_DESCRIPTORS, CONFUSION_THRESHOLD, escalationPromptHint } from "./utils/difficultyUtils";
export type { AgeBandDescriptor, ConfusionEscalation } from "./utils/difficultyUtils";
export { seedAnalogyFor, analogyPromptHint } from "./utils/analogyUtils";
export { EXPLANATION_MODE_HINTS, conceptExplanationInstruction, previewSnippet } from "./utils/explanationUtils";
export { findAdjacentChapters } from "./utils/teachingUtils";
export type { ChapterConnections } from "./utils/teachingUtils";
export { formatContextSummary } from "./utils/contextUtils";
export { getCardThemeColor } from "./utils/cardUtils";
export { sanitizeSvg } from "./utils/visualizationUtils";
export { filterRecommendations } from "./utils/recommendationUtils";

// Components
export { Header, StyleCarousel, CompareSlider, ScrollableCard, ChatInterface } from "./components";
export type { HeaderProps, StyleCarouselProps, CompareSliderProps, ScrollableCardProps, ChatInterfaceProps } from "./components";

// Recent Chats (7-Color Dynamic RGB System)
export * from "./recent-chats";

// Interfaces
export * from "./interfaces/TeachingEngine";
export * from "./interfaces/StudentSession";
export * from "./interfaces/TutorInterface";

// Types
export * from "./types/Lesson";
export * from "./types/StudentContext";
export * from "./types/SubjectType";
export * from "./types/TeachingPlan";
export * from "./types/TutorResponse";

// Services (extra)
export * from "./services/TutorService";

// V2 Orchestrator
export * from "./v2";
