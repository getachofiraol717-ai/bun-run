// @ts-nocheck
// Study Companion Engine — Main Export
// Barrel file for all public APIs

// Core Engine
export { StudyCompanionEngine } from "./core/StudyCompanionEngine";
export { StudyCompanionController } from "./core/StudyCompanionController";
export { StudentProfileEngine } from "./core/StudentProfileEngine";
export { GoalManager } from "./core/GoalManager";
export { LearningHistoryEngine } from "./core/LearningHistoryEngine";
export { ProgressAnalyzer } from "./core/ProgressAnalyzer";
export { RecommendationEngine } from "./core/RecommendationEngine";
export { HabitAnalyzer } from "./core/HabitAnalyzer";
export { MotivationEngine } from "./core/MotivationEngine";
export { StudyPlanner } from "./core/StudyPlanner";

// Services
export { ConversationMemoryService } from "./services/ConversationMemoryService";
export { GoalTrackingService } from "./services/GoalTrackingService";
export { ProgressService } from "./services/ProgressService";
export { RecommendationService } from "./services/RecommendationService";
export { ReminderService } from "./services/ReminderService";
export { SessionAnalyticsService } from "./services/SessionAnalyticsService";

// Models
export * from "./models/StudentProfile";
export * from "./models/LearningGoal";
export * from "./models/StudySession";
export * from "./models/LearningHistory";
export * from "./models/MotivationProfile";
export * from "./models/SubjectPerformance";
export * from "./models/Recommendation";

// Hooks
export { useStudyCompanion } from "./hooks/useStudyCompanion";
export { useGoals } from "./hooks/useGoals";
export { useLearningHistory } from "./hooks/useLearningHistory";
export { useRecommendations } from "./hooks/useRecommendations";
export { useProgress } from "./hooks/useProgress";

// Store
export {
  studyCompanionReducer,
  initialState,
  createNotification,
  createAchievement
} from "./store/studyCompanionStore";
export type {
  StudyCompanionState,
  StudyCompanionAction,
  StudyCompanionPreferences,
  Achievement,
  Notification
} from "./store/studyCompanionStore";

// Utils
export * from "./utils/progressUtils";
export * from "./utils/recommendationUtils";
export * from "./utils/goalUtils";
export * from "./utils/analyticsUtils";
export * from "./utils/memoryUtils";

// Interfaces
export * from "./interfaces/StudyCompanion";
export * from "./interfaces/StudentProfile";
export * from "./interfaces/RecommendationProvider";

// Singleton instances for direct access
import { StudyCompanionEngine } from "./core/StudyCompanionEngine";
import { StudyCompanionController } from "./core/StudyCompanionController";
import { ConversationMemoryService } from "./services/ConversationMemoryService";
import { GoalTrackingService } from "./services/GoalTrackingService";
import { ProgressService } from "./services/ProgressService";
import { RecommendationService } from "./services/RecommendationService";
import { ReminderService } from "./services/ReminderService";
import { SessionAnalyticsService } from "./services/SessionAnalyticsService";

export const studyCompanionEngine = StudyCompanionEngine.getInstance();
export const studyCompanionController = StudyCompanionController.getInstance();
export const conversationMemoryService = ConversationMemoryService.getInstance();
export const goalTrackingService = GoalTrackingService.getInstance();
export const progressService = ProgressService.getInstance();
export const recommendationService = RecommendationService.getInstance();
export const reminderService = ReminderService.getInstance();
export const sessionAnalyticsService = SessionAnalyticsService.getInstance();

// Type exports for convenience
export type {
  UseStudyCompanionOptions,
  UseStudyCompanionReturn
} from "./hooks/useStudyCompanion";

export type {
  UseGoalsOptions,
  UseGoalsReturn
} from "./hooks/useGoals";

export type {
  UseLearningHistoryOptions,
  UseLearningHistoryReturn
} from "./hooks/useLearningHistory";

export type {
  UseRecommendationsOptions,
  UseRecommendationsReturn,
  Recommendation
} from "./hooks/useRecommendations";

export type {
  UseProgressOptions,
  UseProgressReturn,
  ProgressStats,
  SubjectProgress
} from "./hooks/useProgress";

// Version info
export const VERSION = "1.0.0";
export const ENGINE_NAME = "MargeOS Study Companion Engine";

// Default configuration
export const DEFAULT_CONFIG = {
  storageKey: "margeos-study-companion",
  maxRecommendations: 10,
  defaultDailyGoalMinutes: 60,
  defaultWeeklyGoalHours: 10,
  streakMultiplierThreshold: 7,
  pomodoroLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  maxSessionHistory: 100,
  maxConversationEntries: 500,
  contextWindowMinutes: 30,
  spacedRepetitionInitialInterval: 1,
  spacedRepetitionMaxInterval: 365
};
