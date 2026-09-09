// Study Companion — RecommendationProvider Interface
// Interface for providing and managing recommendations

import type { Recommendation } from "./StudyCompanion";

export type RecommendationType =
  | "spaced_review"
  | "lesson"
  | "practice"
  | "exploration"
  | "goal_aligned"
  | "weakness_focus"
  | "quick_practice"
  | "break"
  | "review_session";

export interface RecommendationProviderConfig {
  userId: string;
  maxRecommendations: number;
  priorityThreshold: number;
  includeExpired: boolean;
}

export interface RecommendationContext {
  studentProfile: {
    level: string;
    learningStyle: string;
    strengths: string[];
    weaknesses: string[];
  };
  currentGoals: string[];
  recentTopics: string[];
  subject?: string;
  sessionInProgress: boolean;
  sessionDuration?: number;
  streakDays: number;
}

export interface RecommendationFilter {
  types?: RecommendationType[];
  subjects?: string[];
  minPriority?: number;
  maxAge?: number; // days
  excludeCompleted?: boolean;
  excludeDismissed?: boolean;
}

export interface RecommendationPriority {
  type: RecommendationType;
  urgency: number;
  importance: number;
  contextRelevance: number;
  personalization: number;
  total: number;
}

export interface IRecommendationProvider {
  // Core methods
  initialize(userId: string): Promise<void>;
  getRecommendations(filter?: RecommendationFilter): Promise<Recommendation[]>;
  trackFeedback(id: string, action: "accepted" | "dismissed" | "completed"): Promise<void>;

  // Priority calculation
  calculatePriority(type: RecommendationType, context: RecommendationContext): Promise<number>;

  // Generation
  generateRecommendations(context: RecommendationContext): Promise<Recommendation[]>;

  // Management
  dismissRecommendation(id: string): Promise<void>;
  snoozeRecommendation(id: string, days: number): Promise<void>;
  getRecommendationHistory(): Promise<RecommendationHistory>;

  // Performance
  getPerformanceMetrics(): Promise<RecommendationMetrics>;
}

export interface RecommendationHistory {
  totalGenerated: number;
  totalAccepted: number;
  totalCompleted: number;
  totalDismissed: number;
  acceptanceRate: number;
  completionRate: number;
  byType: Record<RecommendationType, RecommendationHistoryEntry>;
}

export interface RecommendationHistoryEntry {
  generated: number;
  accepted: number;
  completed: number;
  dismissed: number;
  averageTimeToAccept: number; // minutes
  averageTimeToComplete: number; // minutes
}

export interface RecommendationMetrics {
  overall: {
    acceptanceRate: number;
    completionRate: number;
    averagePriority: number;
  };
  byType: Record<RecommendationType, {
    count: number;
    acceptanceRate: number;
    completionRate: number;
  }>;
  trends: {
    weeklyAcceptanceRate: number;
    weeklyCompletionRate: number;
    improvement: number;
  };
}

// Spaced repetition interface
export interface ISpacedRepetitionProvider {
  initialize(userId: string): Promise<void>;

  // Content management
  addConcept(concept: SpacedRepetitionConcept): Promise<void>;
  getConceptsForReview(limit?: number): Promise<SpacedRepetitionItem[]>;
  updateConceptProgress(conceptId: string, result: "correct" | "incorrect"): Promise<void>;

  // Schedule calculation
  calculateNextReview(conceptId: string, result: "correct" | "incorrect"): Date;
  getReviewSchedule(conceptId: string): ReviewSchedule;

  // Statistics
  getDueCount(): Promise<number>;
  getMasteryDistribution(): Promise<Record<number, number>>; // mastery level -> count
}

export interface SpacedRepetitionConcept {
  id: string;
  subject: string;
  topic: string;
  content: string;
  hint?: string;
  answer?: string;
  difficulty: number;
}

export interface SpacedRepetitionItem {
  concept: SpacedRepetitionConcept;
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReviewDate: Date;
  masteryLevel: number;
}

export interface ReviewSchedule {
  today: number;
  tomorrow: number;
  thisWeek: number;
  thisMonth: number;
}

// Lesson recommendation interface
export interface ILessonRecommendationProvider {
  getNextLesson(context: RecommendationContext): Promise<LessonRecommendation | null>;
  getLessonSuggestions(subject: string, limit?: number): Promise<LessonRecommendation[]>;
  getPrerequisites(lessonId: string): Promise<string[]>;
  getLessonProgress(lessonId: string): Promise<LessonProgress>;
}

export interface LessonRecommendation {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  difficulty: number;
  estimatedDuration: number;
  prerequisites: string[];
  priority: number;
  reason: string;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completionPercentage: number;
  timeSpent: number;
  attempts: number;
  bestScore: number;
}

// Practice recommendation interface
export interface IPracticeRecommendationProvider {
  getNextPractice(context: RecommendationContext): Promise<PracticeRecommendation | null>;
  getPracticeSuggestions(subject: string, limit?: number): Promise<PracticeRecommendation[]>;
  generateQuickPractice(topic: string, count?: number): Promise<PracticeRecommendation[]>;
}

export interface PracticeRecommendation {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  type: "quiz" | "exercise" | "problem_set" | "flashcard";
  difficulty: number;
  estimatedDuration: number;
  questionCount: number;
  priority: number;
  reason: string;
}

// Goal-aligned recommendation interface
export interface IGoalRecommendationProvider {
  getGoalRecommendations(goalId: string): Promise<Recommendation[]>;
  suggestActivitiesForGoal(goalId: string): Promise<ActivitySuggestion[]>;
  calculateGoalProgress(goalId: string): Promise<GoalProgressData>;
}

export interface ActivitySuggestion {
  activityId: string;
  title: string;
  type: string;
  estimatedImpact: number;
  priority: number;
  description: string;
}

export interface GoalProgressData {
  goalId: string;
  progress: number;
  onTrack: boolean;
  estimatedCompletionDate: Date | null;
  suggestedActivities: ActivitySuggestion[];
}

// Weakness focus interface
export interface IWeaknessProvider {
  identifyWeaknesses(context: RecommendationContext): Promise<WeaknessArea[]>;
  getImprovementRecommendations(weaknessId: string): Promise<Recommendation[]>;
  trackWeaknessProgress(weaknessId: string, improvement: number): Promise<void>;
}

export interface WeaknessArea {
  id: string;
  subject: string;
  topic: string;
  masteryLevel: number;
  lastAttemptScore: number;
  improvementTrend: "improving" | "stable" | "declining";
  suggestedFocus: string;
  priority: number;
}

// Recommendation event handlers
export type RecommendationEventType =
  | "RECOMMENDATION_GENERATED"
  | "RECOMMENDATION_ACCEPTED"
  | "RECOMMENDATION_DISMISSED"
  | "RECOMMENDATION_COMPLETED"
  | "RECOMMENDATION_SNOOZED";

export interface RecommendationEvent {
  type: RecommendationEventType;
  recommendation: Recommendation;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type RecommendationEventHandler = (event: RecommendationEvent) => void;
