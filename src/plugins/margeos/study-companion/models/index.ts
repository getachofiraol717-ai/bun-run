// Study Companion Models Barrel Exports
export * from './LearningGoal';
export * from './LearningHistory';

// Explicitly re-export from MotivationProfile, excluding 'MilestoneType'
// (canonical version lives in LearningHistory) to avoid ambiguity.
export type {
  MotivationProfile,
  EncouragementLevel,
  CelebrationStyle,
  BurnoutRisk,
  Achievement,
  AchievementType,
  Rarity,
  Milestone,
  Win,
  WinType,
  Reward,
  RewardType,
  StudyStreak,
  StreakDay,
  Encouragement,
  EncouragementType,
  MotivationMetrics,
  EngagementData,
  MotivationTrend,
  MotivationEvent,
  PersonalBest,
  PersonalBestType,
  DailyMotivation,
} from './MotivationProfile';
export {
  ACHIEVEMENTS,
  ENCOURAGEMENT_MESSAGES,
  createMotivationProfile,
  createWin,
  createStreak,
  createDailyMotivation,
  calculateBurnoutRisk,
} from './MotivationProfile';

export * from './Recommendation';

// Explicitly re-export from StudentProfile, excluding names whose canonical
// definitions live in LearningGoal, LearningHistory, MotivationProfile,
// Recommendation and StudySession, to avoid ambiguity.
export type {
  LearningStyle,
  ExplanationPreference,
  StudyPreferences,
  AccessibilityNeeds,
  PersonalInfo,
  EngagementMetrics,
  StudentProfile,
  SubjectMastery,
  TopicMastery,
  SubtopicMastery,
  ContentInteraction,
  PracticeRecord,
  QuizRecord,
  MilestoneRecord,
  StudyPlan,
  PlannedSubject,
  PlannedDay,
  PlannedActivity,
} from './StudentProfile';
export { createDefaultStudentProfile } from './StudentProfile';

export * from './StudySession';

// Explicitly re-export from SubjectPerformance, excluding names whose
// canonical definitions live in LearningHistory, MotivationProfile and
// Recommendation, to avoid ambiguity.
export type {
  SubjectPerformance,
  SubjectCategory,
  PerformanceMetrics,
  TimelineData,
  SubjectComparison,
  SubjectInsight,
  SubjectRecommendation,
  TopicPerformance,
  TopicMetrics,
  SubtopicPerformance,
  SubtopicStatus,
  QuestionAnalysis,
  TopicHistoryEntry,
  PerformanceTrend,
  LearningPattern,
  PatternData,
  KnowledgeStrength,
  KnowledgeWeakness,
  PerformanceReport,
  ReportSummary,
  OverallMetrics,
  TrendAnalysis,
} from './SubjectPerformance';
export {
  createDefaultSubjectPerformance,
  calculateMasteryLevel,
  calculatePerformanceTrend,
  identifySubjectCategory,
} from './SubjectPerformance';
