// @ts-nocheck
// Adaptive Quiz Engine — AssessmentProvider Interface
// Public API types for assessment and analytics

import type { QuizResult, QuizResultSummary } from "../models/QuizResult";
import type { MasteryReport, MasteryLevel } from "../models/MasteryReport";
import type { KnowledgeGap, GapAnalysisResult } from "../core/KnowledgeGapAnalyzer";
import type { DifficultyLevel } from "../models/Question";
import type { Recommendation, StudyPlan } from "../services/RecommendationService";

export interface IAssessmentProvider {
  // Assessment
  generateResult(sessionId: string): Promise<QuizResult>;
  getDetailedFeedback(resultId: string): Promise<DetailedFeedback>;
  analyzeGaps(resultId: string): Promise<GapAnalysisResult>;

  // Mastery
  getMasteryReport(userId: string): Promise<MasteryReport | null>;
  getMasteryLevel(userId: string, category: MasteryCategory, targetId: string): Promise<MasteryLevel | null>;
  updateMastery(userId: string, result: QuizResult): Promise<MasteryReport>;

  // Recommendations
  getRecommendations(userId: string): Promise<RecommendationResponse>;
  generateStudyPlan(userId: string, days: number, dailyMinutes: number): Promise<StudyPlan>;

  // Analytics
  getPerformanceMetrics(userId: string): Promise<PerformanceMetrics>;
  getTrendData(userId: string, days?: number): Promise<TrendData[]>;
  getTopicBreakdown(userId: string): Promise<TopicAnalytics[]>;
  getWeeklyReport(userId: string): Promise<WeeklyReport>;

  // Progress
  getProgressSummary(userId: string): Promise<ProgressSummary>;
  getAchievements(userId: string): Promise<Achievement[]>;
}

export interface DetailedFeedback {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  recommendations: string[];
  topicFeedback: TopicFeedback[];
}

export interface TopicFeedback {
  topic: string;
  accuracy: number;
  timeSpent: number;
  strongAreas: string[];
  weakAreas: string[];
  suggestions: string[];
}

export type MasteryCategory = "concept" | "skill" | "topic" | "chapter" | "subject" | "formula";

export interface RecommendationResponse {
  quizzes: Recommendation[];
  content: ContentRecommendation[];
  topPriority: Recommendation | null;
  motivationalTips: string[];
}

export interface ContentRecommendation extends Recommendation {
  type: "pdf" | "video" | "tutor" | "formula" | "flashcard" | "article" | "visual";
  url?: string;
  contentId?: string;
}

export interface PerformanceMetrics {
  overallAccuracy: number;
  totalQuizzes: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
  improvementRate: number;
  streakDays: number;
  strongTopics: string[];
  weakTopics: string[];
  bestScore: number;
  recentTrend: "improving" | "stable" | "declining";
}

export interface TrendData {
  date: string;
  score: number;
  accuracy: number;
  timeSpent: number;
}

export interface TopicAnalytics {
  topic: string;
  attempts: number;
  correct: number;
  accuracy: number;
  averageTime: number;
  mastery: number;
  trend: "improving" | "stable" | "declining";
}

export interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  quizzesCompleted: number;
  questionsAnswered: number;
  averageScore: number;
  improvement: number;
  topTopics: string[];
  focusNeeded: string[];
  totalTimeSpent: number;
  achievements: string[];
}

export interface ProgressSummary {
  currentStreak: number;
  longestStreak: number;
  totalQuizzes: number;
  totalQuestions: number;
  averageScore: number;
  bestScore: number;
  recentTrend: "improving" | "stable" | "declining";
  masteredTopics: number;
  topicsInProgress: number;
  topicsNotStarted: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

// Analytics types
export interface SessionAnalytics {
  sessionId: string;
  averageTimePerQuestion: number;
  fastestQuestion: { id: string; time: number };
  slowestQuestion: { id: string; time: number };
  timeDistribution: TimeDistributionItem[];
  hintUsageRate: number;
  skipRate: number;
  pacingPattern: "accelerating" | "decelerating" | "consistent" | "irregular";
}

export interface TimeDistributionItem {
  range: string;
  count: number;
  percentage: number;
}

export interface DifficultyAnalysis {
  overallDifficulty: number;
  questionsByDifficulty: Record<DifficultyLevel, DifficultyBreakdown>;
  estimatedUserLevel: DifficultyLevel;
}

export interface DifficultyBreakdown {
  total: number;
  correct: number;
  accuracy: number;
  averageTime: number;
}

// Comparison types
export interface ComparisonResult {
  percentile: number;
  rank: number;
  comparison: {
    accuracy: number;
    speed: number;
    consistency: number;
  };
}

export interface StudyInsights {
  bestTimeOfDay: string;
  bestDayOfWeek: string;
  optimalDifficulty: DifficultyLevel;
  recommendedSessionLength: number;
}
