// Adaptive Quiz Engine — Models Index
// Export all model types and utilities

export * from "./Question";
export * from "./Quiz";
export * from "./Answer";
export * from "./QuizResult";

// Explicitly re-export from DifficultyProfile, excluding 'PredictionFactor'
// (canonical version lives in MasteryReport) to avoid ambiguity.
export type {
  DifficultyThreshold,
  UserDifficultyProfile,
  DifficultyLevelChange,
  DifficultyPerformanceMetrics,
  DifficultyAdjustment,
  AdjustmentTrigger,
  UserDifficultyPreferences,
  DifficultyTransitionRule,
  TransitionCondition,
  AdaptiveDifficultyConfig,
  StabilizationSettings,
  PerformanceWeights,
  DifficultyPrediction,
  DifficultyHistory,
  DifficultyQuestionAttempt,
  DifficultyAnalytics,
} from "./DifficultyProfile";
export {
  DEFAULT_DIFFICULTY_THRESHOLDS,
  DEFAULT_ADAPTIVE_CONFIG,
  createDifficultyProfile,
  calculateDifficultyAccuracy,
  getNextDifficultyLevel,
  evaluateTransitionConditions,
} from "./DifficultyProfile";

export * from "./MasteryReport";
export * from "./QuizSession";
