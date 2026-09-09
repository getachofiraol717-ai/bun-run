// @ts-nocheck
/**
 * AnalyticsService.ts
 *
 * Service for analytics and insights about exam performance.
 * Provides trends, comparisons, and actionable insights.
 */

import type { ExamResult } from '../models';
import type { PerformanceProfile } from '../models/PerformanceProfile';
import { PerformanceEvaluator } from '../core/PerformanceEvaluator';
import { ReportGenerator } from '../core/ReportGenerator';
import { examStorage } from '../store/examSimulatorStore';

export interface PerformanceTrend {
  direction: 'improving' | 'stable' | 'declining';
  change: number;
  confidence: number;
}

export interface TopicInsight {
  topic: string;
  averageScore: number;
  trend: PerformanceTrend;
  strength: 'strong' | 'moderate' | 'weak';
  lastScore: number;
  improvement: number;
}

export interface ComparativeInsight {
  metric: string;
  value: number;
  comparison: number;
  percentile?: number;
  status: 'above' | 'at' | 'below';
}

export interface ExamInsight {
  type: 'achievement' | 'warning' | 'tip' | 'milestone';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private evaluator: PerformanceEvaluator;
  private reportGenerator: ReportGenerator;

  private constructor() {
    this.evaluator = PerformanceEvaluator.getInstance();
    this.reportGenerator = ReportGenerator.getInstance();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get performance trend over time
   */
  async getPerformanceTrend(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'all' = 'month'): Promise<{
    trend: PerformanceTrend;
    scores: { date: string; score: number }[];
    average: number;
    best: number;
    worst: number;
  }> {
    const results = examStorage.getResultsByUser(userId);
    const filtered = this.filterByTimeframe(results, timeframe);

    const scores = filtered.map(r => ({
      date: r.completedAt,
      score: r.summary.percentage
    }));

    if (scores.length === 0) {
      return {
        trend: { direction: 'stable', change: 0, confidence: 0 },
        scores: [],
        average: 0,
        best: 0,
        worst: 0
      };
    }

    const values = scores.map(s => s.score);
    const trend = this.calculateTrend(values);

    return {
      trend,
      scores,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      best: Math.max(...values),
      worst: Math.min(...values)
    };
  }

  /**
   * Get topic-wise insights
   */
  async getTopicInsights(userId: string): Promise<TopicInsight[]> {
    const results = examStorage.getResultsByUser(userId);
    const topicMap = new Map<string, number[]>();

    results.forEach(r => {
      r.topicResults.forEach(t => {
        const scores = topicMap.get(t.topic) || [];
        scores.push(t.percentage);
        topicMap.set(t.topic, scores);
      });
    });

    const insights: TopicInsight[] = [];

    topicMap.forEach((scores, topic) => {
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      const trend = this.calculateTrend(scores);
      const lastScore = scores[scores.length - 1];
      const firstScore = scores[0];
      const improvement = lastScore - firstScore;

      let strength: 'strong' | 'moderate' | 'weak';
      if (average >= 80) strength = 'strong';
      else if (average >= 60) strength = 'moderate';
      else strength = 'weak';

      insights.push({
        topic,
        averageScore: Math.round(average * 10) / 10,
        trend,
        strength,
        lastScore: Math.round(lastScore * 10) / 10,
        improvement: Math.round(improvement * 10) / 10
      });
    });

    return insights.sort((a, b) => b.averageScore - a.averageScore);
  }

  /**
   * Get comparative analytics
   */
  async getComparativeAnalytics(userId: string): Promise<{
    personal: ComparativeInsight;
    comparison: ComparativeInsight[];
    overall: ComparativeInsight;
  }> {
    const results = examStorage.getResultsByUser(userId);

    if (results.length === 0) {
      return {
        personal: { metric: 'Average Score', value: 0, comparison: 0, status: 'at' },
        comparison: [],
        overall: { metric: 'Overall Performance', value: 0, comparison: 0, status: 'at' }
      };
    }

    const scores = results.map(r => r.summary.percentage);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const totalQuestions = results.reduce((sum, r) => sum + r.summary.totalQuestions, 0);
    const accuracy = results.reduce((sum, r) => sum + r.summary.correctAnswers, 0) / totalQuestions * 100;

    // Simulate class average (in production, this would come from database)
    const classAverage = 65;

    return {
      personal: {
        metric: 'Average Score',
        value: Math.round(average * 10) / 10,
        comparison: classAverage,
        percentile: this.calculatePercentile(average, classAverage),
        status: average > classAverage + 5 ? 'above' : average < classAverage - 5 ? 'below' : 'at'
      },
      comparison: [
        {
          metric: 'Accuracy Rate',
          value: Math.round(accuracy * 10) / 10,
          comparison: 70,
          status: accuracy > 75 ? 'above' : accuracy < 65 ? 'below' : 'at'
        },
        {
          metric: 'Questions Answered',
          value: totalQuestions,
          comparison: 200,
          status: totalQuestions > 250 ? 'above' : 'at'
        }
      ],
      overall: {
        metric: 'Overall Performance',
        value: Math.round(average * 10) / 10,
        comparison: classAverage,
        status: average >= classAverage ? 'above' : 'below'
      }
    };
  }

  /**
   * Get personalized insights
   */
  async getInsights(userId: string): Promise<ExamInsight[]> {
    const insights: ExamInsight[] = [];
    const results = examStorage.getResultsByUser(userId);

    if (results.length === 0) {
      insights.push({
        type: 'tip',
        title: 'Get Started',
        description: 'Take your first exam to start tracking your progress.',
        priority: 'medium'
      });
      return insights;
    }

    // Achievement insights
    const recentScores = results.slice(-5).map(r => r.summary.percentage);
    const average = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    if (average >= 90) {
      insights.push({
        type: 'achievement',
        title: 'Outstanding Performance!',
        description: `Your recent average of ${average.toFixed(0)}% is excellent!`,
        priority: 'high',
        action: 'Keep up the great work!'
      });
    }

    // Trend insights
    const trend = this.calculateTrend(recentScores);
    if (trend.direction === 'improving' && trend.change > 10) {
      insights.push({
        type: 'milestone',
        title: 'Great Progress!',
        description: `Your scores have improved by ${trend.change.toFixed(0)}% recently.`,
        priority: 'high'
      });
    } else if (trend.direction === 'declining' && trend.change < -10) {
      insights.push({
        type: 'warning',
        title: 'Score Declining',
        description: `Your recent scores have dropped by ${Math.abs(trend.change).toFixed(0)}%. Consider extra practice.`,
        priority: 'high',
        action: 'Focus on weak areas and review fundamentals'
      });
    }

    // Topic insights
    const topicInsights = await this.getTopicInsights(userId);
    const weakTopics = topicInsights.filter(t => t.strength === 'weak');

    if (weakTopics.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Weak Areas Detected',
        description: `You need improvement in: ${weakTopics.map(t => t.topic).join(', ')}`,
        priority: 'medium',
        action: 'Focus study time on these topics'
      });
    }

    // Practice frequency insight
    const lastExam = new Date(results[results.length - 1].completedAt);
    const daysSinceLastExam = Math.floor((Date.now() - lastExam.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastExam > 7) {
      insights.push({
        type: 'tip',
        title: 'Stay Consistent',
        description: `It's been ${daysSinceLastExam} days since your last exam. Regular practice improves retention.`,
        priority: 'medium',
        action: 'Schedule a practice session today'
      });
    }

    // Consistency insight
    const consistency = this.calculateConsistency(recentScores);
    if (consistency > 80) {
      insights.push({
        type: 'tip',
        title: 'Consistent Performer',
        description: 'Your scores are very consistent. Great job maintaining steady performance!',
        priority: 'low'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get performance summary
   */
  async getPerformanceSummary(userId: string): Promise<{
    totalExams: number;
    totalQuestions: number;
    averageScore: number;
    bestScore: number;
    passRate: number;
    studyStreak: number;
    strengths: string[];
    weaknesses: string[];
    nextMilestone: { name: string; progress: number; target: number };
  }> {
    const results = examStorage.getResultsByUser(userId);
    const profile = await this.evaluator.getPerformanceProfile(userId);

    if (results.length === 0) {
      return {
        totalExams: 0,
        totalQuestions: 0,
        averageScore: 0,
        bestScore: 0,
        passRate: 0,
        studyStreak: 0,
        strengths: [],
        weaknesses: [],
        nextMilestone: { name: 'First Exam', progress: 0, target: 1 }
      };
    }

    const totalQuestions = results.reduce((sum, r) => sum + r.summary.totalQuestions, 0);
    const scores = results.map(r => r.summary.percentage);
    const passed = results.filter(r => r.summary.passed).length;

    // Get topic insights
    const topicInsights = await this.getTopicInsights(userId);
    const strengths = topicInsights.filter(t => t.strength === 'strong').map(t => t.topic);
    const weaknesses = topicInsights.filter(t => t.strength === 'weak').map(t => t.topic);

    // Determine next milestone
    const milestones = [
      { name: 'First Exam', target: 1 },
      { name: 'Getting Started', target: 5 },
      { name: 'Regular Learner', target: 10 },
      { name: 'Dedicated Student', target: 25 },
      { name: 'Expert Level', target: 50 }
    ];

    let nextMilestone = milestones[0];
    for (const milestone of milestones) {
      if (results.length < milestone.target) {
        nextMilestone = milestone;
        break;
      }
    }

    const previousMilestone = milestones[milestones.indexOf(nextMilestone) - 1];
    const prevTarget = previousMilestone ? previousMilestone.target : 0;
    const progress = ((results.length - prevTarget) / (nextMilestone.target - prevTarget)) * 100;

    return {
      totalExams: results.length,
      totalQuestions,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10,
      bestScore: Math.max(...scores),
      passRate: Math.round((passed / results.length) * 100),
      studyStreak: profile?.studyStreak || 0,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      nextMilestone: {
        name: nextMilestone.name,
        progress: Math.max(0, Math.min(100, progress)),
        target: nextMilestone.target
      }
    };
  }

  /**
   * Generate progress report
   */
  async generateProgressReport(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'all'
  ) {
    return await this.reportGenerator.generateProgressReport(userId, timeframe);
  }

  /**
   * Calculate study efficiency
   */
  calculateEfficiency(results: ExamResult[]): {
    scorePerHour: number;
    improvementRate: number;
    consistency: number;
  } {
    if (results.length === 0) {
      return { scorePerHour: 0, improvementRate: 0, consistency: 0 };
    }

    const totalTime = results.reduce((sum, r) => sum + r.summary.timeSpent, 0);
    const totalHours = totalTime / 3600;

    const scores = results.map(r => r.summary.percentage);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const scorePerHour = totalHours > 0 ? averageScore / totalHours : 0;

    const improvementRate = this.calculateTrend(scores).change;
    const consistency = this.calculateConsistency(scores);

    return {
      scorePerHour: Math.round(scorePerHour * 100) / 100,
      improvementRate: Math.round(improvementRate * 10) / 10,
      consistency: Math.round(consistency * 10) / 10
    };
  }

  private filterByTimeframe(results: ExamResult[], timeframe: string): ExamResult[] {
    const now = new Date();
    let cutoff: Date;

    switch (timeframe) {
      case 'week':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return results;
    }

    return results.filter(r => new Date(r.completedAt) >= cutoff);
  }

  private calculateTrend(scores: number[]): PerformanceTrend {
    if (scores.length < 2) {
      return { direction: 'stable', change: 0, confidence: 0 };
    }

    const n = scores.length;
    const xMean = (n - 1) / 2;
    const yMean = scores.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    scores.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const change = slope * (n - 1);

    // Calculate R-squared for confidence
    const yPredicted = scores.map((_, i) => yMean + slope * (i - xMean));
    const ssRes = scores.reduce((sum, y, i) => sum + Math.pow(y - yPredicted[i], 2), 0);
    const ssTot = scores.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

    return {
      direction: change > 2 ? 'improving' : change < -2 ? 'declining' : 'stable',
      change: Math.round(change * 10) / 10,
      confidence: Math.round(Math.sqrt(Math.max(0, rSquared)) * 100)
    };
  }

  private calculateConsistency(scores: number[]): number {
    if (scores.length < 2) return 100;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Consistency is inverse of coefficient of variation
    const cv = mean !== 0 ? (stdDev / mean) * 100 : 100;
    return Math.max(0, 100 - cv);
  }

  private calculatePercentile(value: number, average: number): number {
    // Simplified percentile calculation
    const diff = value - average;
    if (diff > 10) return 80;
    if (diff > 5) return 70;
    if (diff > 0) return 55;
    if (diff > -5) return 45;
    if (diff > -10) return 30;
    return 20;
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService;
