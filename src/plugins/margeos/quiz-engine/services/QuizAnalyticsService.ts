// @ts-nocheck
// Adaptive Quiz Engine — QuizAnalyticsService
// Comprehensive analytics and insights for quiz performance

import type { QuizResult } from "../models/QuizResult";
import type { DifficultyLevel, QuestionType } from "../models/Question";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";

export interface PerformanceMetrics {
  overallAccuracy: number;
  totalQuizzes: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
  improvementRate: number;
  streakDays: number;
  strongTopics: string[];
  weakTopics: string[];
}

export interface TrendData {
  date: string;
  score: number;
  accuracy: number;
  timeSpent: number;
}

export interface TopicBreakdown {
  topic: string;
  attempts: number;
  correct: number;
  accuracy: number;
  averageTime: number;
  mastery: number;
}

export interface DifficultyBreakdown {
  difficulty: DifficultyLevel;
  attempts: number;
  correct: number;
  accuracy: number;
  averageTime: number;
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

export class QuizAnalyticsService {
  private static instance: QuizAnalyticsService;

  private constructor() {}

  static getInstance(): QuizAnalyticsService {
    if (!QuizAnalyticsService.instance) {
      QuizAnalyticsService.instance = new QuizAnalyticsService();
    }
    return QuizAnalyticsService.instance;
  }

  calculateMetrics(results: QuizResult[]): PerformanceMetrics {
    if (results.length === 0) {
      return {
        overallAccuracy: 0,
        totalQuizzes: 0,
        totalQuestions: 0,
        averageTimePerQuestion: 0,
        improvementRate: 0,
        streakDays: 0,
        strongTopics: [],
        weakTopics: []
      };
    }

    let totalScore = 0;
    let totalMaxScore = 0;
    let totalQuestions = 0;
    let totalTime = 0;

    const topicCorrect = new Map<string, { correct: number; total: number }>();

    results.forEach(result => {
      totalScore += result.summary.score;
      totalMaxScore += result.summary.maxScore;
      totalTime += result.summary.timeSpent;
      totalQuestions += result.questionResults.length;

      result.topicResults.forEach(topic => {
        const existing = topicCorrect.get(topic.topic) || { correct: 0, total: 0 };
        existing.correct += topic.correctQuestions;
        existing.total += topic.totalQuestions;
        topicCorrect.set(topic.topic, existing);
      });
    });

    const overallAccuracy = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    // Calculate improvement rate
    let improvementRate = 0;
    if (results.length >= 2) {
      const recent = results.slice(0, Math.min(5, Math.ceil(results.length / 2)));
      const older = results.slice(Math.ceil(results.length / 2));

      const recentAvg = recent.reduce((sum, r) => sum + r.summary.percentage, 0) / recent.length;
      const olderAvg = older.reduce((sum, r) => sum + r.summary.percentage, 0) / older.length;

      improvementRate = recentAvg - olderAvg;
    }

    // Identify strong and weak topics
    const strongTopics: string[] = [];
    const weakTopics: string[] = [];

    topicCorrect.forEach((data, topic) => {
      const accuracy = (data.correct / data.total) * 100;
      if (accuracy >= 80) {
        strongTopics.push(topic);
      } else if (accuracy < 50 && data.total >= 3) {
        weakTopics.push(topic);
      }
    });

    return {
      overallAccuracy,
      totalQuizzes: results.length,
      totalQuestions,
      averageTimePerQuestion: totalQuestions > 0 ? totalTime / totalQuestions : 0,
      improvementRate,
      streakDays: 0,
      strongTopics,
      weakTopics
    };
  }

  getTrendData(results: QuizResult[], days: number = 30): TrendData[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filtered = results
      .filter(r => r.createdAt >= cutoffDate)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return filtered.map(r => ({
      date: r.createdAt.toISOString().split("T")[0],
      score: r.summary.percentage,
      accuracy: (r.summary.score / r.summary.maxScore) * 100,
      timeSpent: r.summary.timeSpent
    }));
  }

  getTopicBreakdown(results: QuizResult[]): TopicBreakdown[] {
    const topicData = new Map<string, {
      correct: number;
      total: number;
      time: number;
    }>();

    results.forEach(result => {
      result.topicResults.forEach(topic => {
        const existing = topicData.get(topic.topic) || {
          correct: 0,
          total: 0,
          time: 0
        };
        existing.correct += topic.correctQuestions;
        existing.total += topic.totalQuestions;
        existing.time += topic.averageTime * topic.totalQuestions;
        topicData.set(topic.topic, existing);
      });
    });

    const breakdown: TopicBreakdown[] = [];

    topicData.forEach((data, topic) => {
      breakdown.push({
        topic,
        attempts: data.total,
        correct: data.correct,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        averageTime: data.total > 0 ? data.time / data.total : 0,
        mastery: data.total >= 5 ? Math.min(100, (data.correct / data.total) * 100 + 20) : (data.correct / data.total) * 100
      });
    });

    return breakdown.sort((a, b) => b.attempts - a.attempts);
  }

  getDifficultyBreakdown(results: QuizResult[]): DifficultyBreakdown[] {
    const difficultyData: Record<DifficultyLevel, {
      correct: number;
      total: number;
      time: number;
    }> = {
      easy: { correct: 0, total: 0, time: 0 },
      medium: { correct: 0, total: 0, time: 0 },
      hard: { correct: 0, total: 0, time: 0 },
      expert: { correct: 0, total: 0, time: 0 }
    };

    results.forEach(result => {
      result.questionResults.forEach(qr => {
        const diff = qr.difficulty;
        difficultyData[diff].total++;
        if (qr.isCorrect) difficultyData[diff].correct++;
        difficultyData[diff].time += qr.timeSpent;
      });
    });

    const breakdown: DifficultyBreakdown[] = [];

    Object.entries(difficultyData).forEach(([diff, data]) => {
      breakdown.push({
        difficulty: diff as DifficultyLevel,
        attempts: data.total,
        correct: data.correct,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        averageTime: data.total > 0 ? data.time / data.total : 0
      });
    });

    return breakdown;
  }

  generateWeeklyReport(results: QuizResult[]): WeeklyReport {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekResults = results.filter(
      r => r.createdAt >= weekStart && r.createdAt < weekEnd
    );

    const quizzesCompleted = weekResults.length;
    const questionsAnswered = weekResults.reduce(
      (sum, r) => sum + r.questionResults.length,
      0
    );

    const averageScore = quizzesCompleted > 0
      ? weekResults.reduce((sum, r) => sum + r.summary.percentage, 0) / quizzesCompleted
      : 0;

    const totalTimeSpent = weekResults.reduce(
      (sum, r) => sum + r.summary.timeSpent,
      0
    );

    // Calculate improvement from previous week
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousWeekResults = results.filter(
      r => r.createdAt >= previousWeekStart && r.createdAt < weekStart
    );

    const previousAverage = previousWeekResults.length > 0
      ? previousWeekResults.reduce((sum, r) => sum + r.summary.percentage, 0) / previousWeekResults.length
      : 0;

    const improvement = averageScore - previousAverage;

    // Get top and focus topics
    const topicAccuracy = new Map<string, { correct: number; total: number }>();

    weekResults.forEach(r => {
      r.topicResults.forEach(topic => {
        const existing = topicAccuracy.get(topic.topic) || { correct: 0, total: 0 };
        existing.correct += topic.correctQuestions;
        existing.total += topic.totalQuestions;
        topicAccuracy.set(topic.topic, existing);
      });
    });

    const topTopics: string[] = [];
    const focusNeeded: string[] = [];

    topicAccuracy.forEach((data, topic) => {
      const accuracy = (data.correct / data.total) * 100;
      if (accuracy >= 80) topTopics.push(topic);
      if (accuracy < 50) focusNeeded.push(topic);
    });

    // Generate achievements
    const achievements: string[] = [];

    if (quizzesCompleted >= 7) {
      achievements.push("Completed a quiz every day this week!");
    }
    if (improvement >= 10) {
      achievements.push(`Improved by ${improvement.toFixed(0)}% from last week!`);
    }
    if (averageScore >= 90) {
      achievements.push("Maintained excellent scores!");
    }

    return {
      weekStart,
      weekEnd,
      quizzesCompleted,
      questionsAnswered,
      averageScore,
      improvement,
      topTopics: topTopics.slice(0, 3),
      focusNeeded: focusNeeded.slice(0, 3),
      totalTimeSpent,
      achievements
    };
  }

  predictNextScore(results: QuizResult[]): {
    predictedScore: number;
    confidence: number;
    trend: "improving" | "stable" | "declining";
  } {
    if (results.length < 3) {
      return { predictedScore: 70, confidence: 0.3, trend: "stable" };
    }

    const recent = results.slice(0, 5);
    const scores = recent.map(r => r.summary.percentage);

    // Simple linear regression
    const n = scores.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += scores[i];
      sumXY += i * scores[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictedScore = Math.max(0, Math.min(100, intercept + slope * n));

    // Calculate confidence based on consistency
    const mean = sumY / n;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0.3, Math.min(0.9, 1 - stdDev / 50));

    // Determine trend
    let trend: "improving" | "stable" | "declining" = "stable";
    if (slope > 2) trend = "improving";
    else if (slope < -2) trend = "declining";

    return { predictedScore, confidence, trend };
  }

  comparePerformance(
    results: QuizResult[],
    otherUserIds?: string[]
  ): {
    percentile: number;
    rank: number;
    comparison: {
      accuracy: number;
      speed: number;
      consistency: number;
    };
  } {
    // Simplified comparison
    const metrics = this.calculateMetrics(results);

    // Estimate percentile (would need actual user data in real implementation)
    const percentile = metrics.overallAccuracy >= 80 ? 75 : 50;

    return {
      percentile,
      rank: 0,
      comparison: {
        accuracy: metrics.overallAccuracy,
        speed: 100 - (metrics.averageTimePerQuestion / 5),
        consistency: 100 - Math.abs(metrics.improvementRate)
      }
    };
  }

  getStudyInsights(results: QuizResult[]): {
    bestTimeOfDay: string;
    bestDayOfWeek: string;
    optimalDifficulty: DifficultyLevel;
    recommendedSessionLength: number;
  } {
    // Analyze patterns
    const timeOfDayAccuracy = new Map<number, { correct: number; total: number }>();
    const dayOfWeekAccuracy = new Map<number, { correct: number; total: number }>();

    results.forEach(r => {
      const hour = r.createdAt.getHours();
      const day = r.createdAt.getDay();

      // Time of day
      const timeSlot = hour < 12 ? 0 : hour < 17 ? 1 : 2;
      const timeExisting = timeOfDayAccuracy.get(timeSlot) || { correct: 0, total: 0 };
      timeExisting.correct += r.summary.correctCount || 0;
      timeExisting.total += r.questionResults.length;
      timeOfDayAccuracy.set(timeSlot, timeExisting);

      // Day of week
      const dayExisting = dayOfWeekAccuracy.get(day) || { correct: 0, total: 0 };
      dayExisting.correct += r.summary.correctCount || 0;
      dayExisting.total += r.questionResults.length;
      dayOfWeekAccuracy.set(day, dayExisting);
    });

    // Find best time
    let bestTimeSlot = 1;
    let bestTimeAccuracy = 0;
    timeOfDayAccuracy.forEach((data, slot) => {
      const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      if (accuracy > bestTimeAccuracy) {
        bestTimeAccuracy = accuracy;
        bestTimeSlot = slot;
      }
    });

    const timeLabels = ["Morning", "Afternoon", "Evening"];

    // Find best day
    let bestDay = 1;
    let bestDayAccuracy = 0;
    dayOfWeekAccuracy.forEach((data, day) => {
      const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      if (accuracy > bestDayAccuracy) {
        bestDayAccuracy = accuracy;
        bestDay = day;
      }
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Calculate optimal session length
    const avgQuizTime = results.reduce((sum, r) => sum + r.summary.timeSpent, 0) / results.length;
    const recommendedSessionLength = Math.max(10, Math.min(45, Math.round(avgQuizTime / 60)));

    return {
      bestTimeOfDay: timeLabels[bestTimeSlot],
      bestDayOfWeek: dayNames[bestDay],
      optimalDifficulty: "medium",
      recommendedSessionLength
    };
  }

  destroy(): void {
    QuizAnalyticsService.instance = null as any;
  }
}

export default QuizAnalyticsService;
