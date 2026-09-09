// Adaptive Quiz Engine — Services Index
// Export all service classes and utilities

export * from "./QuestionBankService";

// Explicitly re-export from AdaptiveLearningService, excluding 'Activity'
// (canonical version lives in RecommendationService) to avoid ambiguity.
export type {
  LearningPath,
  LearningStep,
  AdaptivePlan,
  DailyPractice,
  WeeklyGoal,
  FocusArea,
  Warning,
} from "./AdaptiveLearningService";
export { AdaptiveLearningService, default as AdaptiveLearningServiceDefault } from "./AdaptiveLearningService";

export * from "./QuizAnalyticsService";
export * from "./ScoringService";
export * from "./ProgressTrackingService";
export * from "./RecommendationService";
