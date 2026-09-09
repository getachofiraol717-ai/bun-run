// @ts-nocheck
// AI Exam Simulator — PerformanceProfile Model
// Student performance tracking and analysis

import type { ExamMode, ExamDifficulty } from "./Exam";
import type { DifficultyLevel } from "../models/Question";

export type PerformanceLevel = "beginner" | "developing" | "proficient" | "advanced" | "expert";

export interface PerformanceProfile {
  userId: string;
  generatedAt: Date;
  summary: PerformanceSummary;
  examHistory: ExamHistoryItem[];
  topicPerformance: TopicPerformance[];
  skillPerformance: SkillPerformance[];
  difficultyPerformance: Record<DifficultyLevel, DifficultyPerformance>;
  modePerformance: Record<ExamMode, ModePerformance>;
  temporalTrends: TemporalTrend[];
  achievements: Achievement[];
  predictions: PerformancePrediction[];
  recommendations: PerformanceRecommendation[];
}

export interface PerformanceSummary {
  totalExams: number;
  totalQuestions: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  averageAccuracy: number;
  averageTimePerQuestion: number;
  overallLevel: PerformanceLevel;
  percentileRank?: number;
  improvementRate: number;
  consistencyScore: number;
  strongAreas: string[];
  weakAreas: string[];
  studyStreak: number;
  totalStudyTime: number;
}

export interface ExamHistoryItem {
  examId: string;
  examTitle: string;
  examMode: ExamMode;
  examDifficulty: ExamDifficulty;
  score: number;
  percentage: number;
  grade: string;
  passed: boolean;
  date: Date;
  timeSpent: number;
  questionsAnswered: number;
  accuracy: number;
  resultId: string;
}

export interface TopicPerformance {
  topic: string;
  subject: string;
  chapter?: string;
  examsAttempted: number;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  currentStreak: number;
  bestStreak: number;
  level: PerformanceLevel;
  trend: "improving" | "stable" | "declining";
  lastAttempted?: Date;
  mastered: boolean;
}

export interface SkillPerformance {
  skillId: string;
  skillName: string;
  category: string;
  score: number;
  level: PerformanceLevel;
  components: SkillComponent[];
  applications: string[];
  prerequisites: string[];
  nextLevelRequirements: NextLevelRequirement;
  masteredAt?: Date;
  practiceStreak: number;
}

export interface SkillComponent {
  componentId: string;
  name: string;
  mastered: boolean;
  accuracy: number;
  questionsAttempted: number;
}

export interface NextLevelRequirement {
  targetLevel: PerformanceLevel;
  accuracyRequired: number;
  questionsRequired: number;
  timeRequirement?: number;
  estimatedDays: number;
}

export interface DifficultyPerformance {
  examsAttempted: number;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  averageScore: number;
  trend: "improving" | "stable" | "declining";
  level: PerformanceLevel;
}

export interface ModePerformance {
  examsAttempted: number;
  averageScore: number;
  averageAccuracy: number;
  averageTime: number;
  bestScore: number;
  worstScore: number;
  trend: "improving" | "stable" | "declining";
  preferredMode: boolean;
}

export interface TemporalTrend {
  period: "week" | "month" | "quarter" | "year";
  startDate: Date;
  endDate: Date;
  averageScore: number;
  scoreChange: number;
  examsCount: number;
  questionsCount: number;
  improvementRate: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
  progress?: number;
  target?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: string;
}

export interface PerformancePrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  predictionDate: Date;
  factors: PredictionFactor[];
  trend: "improving" | "stable" | "declining";
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  direction: "positive" | "negative" | "neutral";
}

export interface PerformanceRecommendation {
  type: "improvement" | "maintenance" | "challenge";
  priority: number;
  title: string;
  description: string;
  targetAreas: string[];
  estimatedImpact: number;
  difficulty: "easy" | "medium" | "hard";
  timeInvestment: number;
}

export interface PerformanceComparison {
  userId: string;
  comparedTo: "self" | "peers" | "class";
  percentile?: number;
  rank?: number;
  totalStudents?: number;
  metrics: ComparisonMetric[];
  overallComparison: "above" | "at" | "below";
}

export interface ComparisonMetric {
  metric: string;
  userValue: number;
  comparisonValue: number;
  difference: number;
  percentageDifference: number;
}

export function createPerformanceProfile(params: {
  userId: string;
  examHistory: ExamHistoryItem[];
  topicPerformance: TopicPerformance[];
}): PerformanceProfile {
  const now = new Date();

  // Calculate summary
  const totalExams = params.examHistory.length;
  const scores = params.examHistory.map(h => h.percentage);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  // Calculate improvement rate
  let improvementRate = 0;
  if (scores.length >= 2) {
    const recent = scores.slice(0, Math.ceil(scores.length / 2));
    const older = scores.slice(Math.ceil(scores.length / 2));
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    improvementRate = recentAvg - olderAvg;
  }

  // Find strong and weak areas
  const topicAccuracies = params.topicPerformance.map(t => ({ topic: t.topic, accuracy: t.accuracy }));
  const strongAreas = topicAccuracies.filter(t => t.accuracy >= 80).map(t => t.topic);
  const weakAreas = topicAccuracies.filter(t => t.accuracy < 50).map(t => t.topic);

  // Calculate consistency score
  const consistencyScore = calculateConsistency(scores);

  const summary: PerformanceSummary = {
    totalExams,
    totalQuestions: params.examHistory.reduce((sum, h) => sum + h.questionsAnswered, 0),
    averageScore,
    bestScore: Math.max(...scores, 0),
    worstScore: Math.min(...scores, 100),
    averageAccuracy: calculateAverageAccuracy(params.topicPerformance),
    averageTimePerQuestion: calculateAverageTime(params.topicPerformance),
    overallLevel: calculateOverallLevel(averageScore),
    improvementRate,
    consistencyScore,
    strongAreas,
    weakAreas,
    studyStreak: calculateStudyStreak(params.examHistory),
    totalStudyTime: params.examHistory.reduce((sum, h) => sum + h.timeSpent, 0)
  };

  // Calculate temporal trends
  const temporalTrends = calculateTemporalTrends(params.examHistory);

  // Generate achievements
  const achievements = generateAchievements(params.examHistory, summary);

  // Generate predictions
  const predictions = generatePredictions(summary, params.topicPerformance);

  // Generate recommendations
  const recommendations = generatePerformanceRecommendations(summary, params.topicPerformance);

  return {
    userId: params.userId,
    generatedAt: now,
    summary,
    examHistory: params.examHistory,
    topicPerformance: params.topicPerformance,
    skillPerformance: [],
    difficultyPerformance: calculateDifficultyPerformance(params.examHistory),
    modePerformance: calculateModePerformance(params.examHistory),
    temporalTrends,
    achievements,
    predictions,
    recommendations
  };
}

function calculateConsistency(scores: number[]): number {
  if (scores.length < 2) return 100;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Convert to 0-100 scale where 100 is most consistent
  return Math.max(0, 100 - stdDev);
}

function calculateAverageAccuracy(topics: TopicPerformance[]): number {
  if (topics.length === 0) return 0;
  return topics.reduce((sum, t) => sum + t.accuracy, 0) / topics.length;
}

function calculateAverageTime(topics: TopicPerformance[]): number {
  if (topics.length === 0) return 0;
  return topics.reduce((sum, t) => sum + t.averageTime, 0) / topics.length;
}

function calculateOverallLevel(averageScore: number): PerformanceLevel {
  if (averageScore >= 95) return "expert";
  if (averageScore >= 85) return "advanced";
  if (averageScore >= 70) return "proficient";
  if (averageScore >= 50) return "developing";
  return "beginner";
}

function calculateStudyStreak(history: ExamHistoryItem[]): number {
  if (history.length === 0) return 0;

  const sortedHistory = [...history].sort((a, b) => b.date.getTime() - a.date.getTime());
  let streak = 1;

  for (let i = 1; i < sortedHistory.length; i++) {
    const currentDate = new Date(sortedHistory[i - 1].date);
    const prevDate = new Date(sortedHistory[i].date);

    currentDate.setHours(0, 0, 0, 0);
    prevDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateTemporalTrends(history: ExamHistoryItem[]): TemporalTrend[] {
  const trends: TemporalTrend[] = [];
  const now = new Date();

  // Weekly trend
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekExams = history.filter(h => h.date >= weekAgo);
  if (weekExams.length > 0) {
    trends.push(createTrend("week", weekAgo, now, weekExams));
  }

  // Monthly trend
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthExams = history.filter(h => h.date >= monthAgo);
  if (monthExams.length > 0) {
    trends.push(createTrend("month", monthAgo, now, monthExams));
  }

  return trends;
}

function createTrend(
  period: TemporalTrend["period"],
  start: Date,
  end: Date,
  exams: ExamHistoryItem[]
): TemporalTrend {
  const scores = exams.map(e => e.percentage);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  return {
    period,
    startDate: start,
    endDate: end,
    averageScore: avgScore,
    scoreChange: 0,
    examsCount: exams.length,
    questionsCount: exams.reduce((sum, e) => sum + e.questionsAnswered, 0),
    improvementRate: 0
  };
}

function calculateDifficultyPerformance(history: ExamHistoryItem[]): Record<DifficultyLevel, DifficultyPerformance> {
  const difficulties: Record<DifficultyLevel, DifficultyPerformance> = {
    easy: { examsAttempted: 0, questionsAttempted: 0, correctAnswers: 0, accuracy: 0, averageTime: 0, averageScore: 0, trend: "stable", level: "beginner" },
    medium: { examsAttempted: 0, questionsAttempted: 0, correctAnswers: 0, accuracy: 0, averageTime: 0, averageScore: 0, trend: "stable", level: "developing" },
    hard: { examsAttempted: 0, questionsAttempted: 0, correctAnswers: 0, accuracy: 0, averageTime: 0, averageScore: 0, trend: "stable", level: "proficient" },
    expert: { examsAttempted: 0, questionsAttempted: 0, correctAnswers: 0, accuracy: 0, averageTime: 0, averageScore: 0, trend: "stable", level: "advanced" }
  };

  // Simplified - would need difficulty info from each exam
  return difficulties;
}

function calculateModePerformance(history: ExamHistoryItem[]): Record<ExamMode, ModePerformance> {
  const modes: Record<ExamMode, ModePerformance> = {
    practice: createEmptyModePerformance(),
    chapter: createEmptyModePerformance(),
    subject: createEmptyModePerformance(),
    comprehensive: createEmptyModePerformance(),
    custom: createEmptyModePerformance(),
    revision: createEmptyModePerformance(),
    adaptive: createEmptyModePerformance()
  };

  // Simplified - would need to aggregate by mode
  return modes;
}

function createEmptyModePerformance(): ModePerformance {
  return {
    examsAttempted: 0,
    averageScore: 0,
    averageAccuracy: 0,
    averageTime: 0,
    bestScore: 0,
    worstScore: 0,
    trend: "stable",
    preferredMode: false
  };
}

function generateAchievements(history: ExamHistoryItem[], summary: PerformanceSummary): Achievement[] {
  const achievements: Achievement[] = [];

  if (summary.totalExams >= 1) {
    achievements.push({
      id: "first_exam",
      name: "First Steps",
      description: "Complete your first exam",
      icon: "trophy",
      earnedAt: history[0]?.date,
      rarity: "common",
      category: "milestone"
    });
  }

  if (summary.bestScore >= 95) {
    achievements.push({
      id: "perfect_score",
      name: "Perfectionist",
      description: "Achieve 95% or higher",
      icon: "star",
      earnedAt: history.find(h => h.percentage >= 95)?.date,
      rarity: "rare",
      category: "score"
    });
  }

  if (summary.studyStreak >= 7) {
    achievements.push({
      id: "streak_7",
      name: "Week Warrior",
      description: "Study for 7 consecutive days",
      icon: "fire",
      rarity: "epic",
      category: "streak"
    });
  }

  return achievements;
}

function generatePredictions(summary: PerformanceSummary, topics: TopicPerformance[]): PerformancePrediction[] {
  const predictions: PerformancePrediction[] = [];

  // Next exam prediction
  predictions.push({
    metric: "next_exam_score",
    currentValue: summary.averageScore,
    predictedValue: summary.averageScore + summary.improvementRate,
    confidence: 0.7,
    predictionDate: new Date(),
    factors: [
      { factor: "Historical average", impact: 0.5, direction: "positive" },
      { factor: "Improvement trend", impact: summary.improvementRate / 100, direction: summary.improvementRate > 0 ? "positive" : "negative" }
    ],
    trend: summary.improvementRate > 0 ? "improving" : (summary.improvementRate < 0 ? "declining" : "stable")
  });

  return predictions;
}

function generatePerformanceRecommendations(summary: PerformanceSummary, topics: TopicPerformance[]): PerformanceRecommendation[] {
  const recommendations: PerformanceRecommendation[] = [];

  // Recommend improving weak areas
  summary.weakAreas.slice(0, 2).forEach((area, index) => {
    recommendations.push({
      type: "improvement",
      priority: index + 1,
      title: `Strengthen ${area}`,
      description: `Focus on improving performance in ${area}`,
      targetAreas: [area],
      estimatedImpact: 5,
      difficulty: "medium",
      timeInvestment: 60
    });
  });

  return recommendations;
}

export const PERFORMANCE_LEVEL_LABELS: Record<PerformanceLevel, string> = {
  beginner: "Beginner",
  developing: "Developing",
  proficient: "Proficient",
  advanced: "Advanced",
  expert: "Expert"
};

export const PERFORMANCE_LEVEL_COLORS: Record<PerformanceLevel, string> = {
  beginner: "#ef4444",
  developing: "#f97316",
  proficient: "#22c55e",
  advanced: "#3b82f6",
  expert: "#8b5cf6"
};
