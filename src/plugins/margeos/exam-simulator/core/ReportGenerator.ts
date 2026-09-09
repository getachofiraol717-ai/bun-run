// @ts-nocheck
/**
 * ReportGenerator.ts
 *
 * Generates comprehensive reports for exams including performance reports,
 * weakness reports, readiness reports, and detailed analytics.
 */

import type { Exam, ExamResult } from '../models';
import type { PerformanceProfile } from '../models/PerformanceProfile';
import type { WeaknessReport } from '../models/WeaknessReport';
import type { ReadinessReport } from '../models/ReadinessReport';
import { examStorage } from '../store/examSimulatorStore';

export interface ReportConfig {
  includeCharts: boolean;
  includeComparisons: boolean;
  includeRecommendations: boolean;
  includeTimeAnalysis: boolean;
  reportFormat: 'detailed' | 'summary' | 'compact';
}

const DEFAULT_CONFIG: ReportConfig = {
  includeCharts: true,
  includeComparisons: true,
  includeRecommendations: true,
  includeTimeAnalysis: true,
  reportFormat: 'detailed'
};

export class ReportGenerator {
  private static instance: ReportGenerator;
  private config: ReportConfig;
  private initialized: boolean = false;

  private constructor(config?: Partial<ReportConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<ReportConfig>): ReportGenerator {
    if (!ReportGenerator.instance) {
      ReportGenerator.instance = new ReportGenerator(config);
    }
    return ReportGenerator.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Generate comprehensive performance report
   */
  async generatePerformanceReport(result: ExamResult, exam: Exam): Promise<{
    id: string;
    examId: string;
    userId: string;
    generatedAt: string;
    summary: {
      score: number;
      percentage: number;
      grade: string;
      passed: boolean;
      rank?: number;
      percentile?: number;
    };
    sections: {
      title: string;
      content: any;
      charts?: any[];
    }[];
    comparisons: {
      vsPersonalAverage: number;
      vsClassAverage?: number;
      vsPreviousExam: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    recommendations: {
      priority: 'high' | 'medium' | 'low';
      topic: string;
      action: string;
      reason: string;
    }[];
    metadata: {
      examDuration: number;
      averageTimePerQuestion: number;
      questionsAnswered: number;
      hintsUsed: number;
    };
  }> {
    const personalHistory = examStorage.getResultsByUser(result.userId);
    const previousResults = personalHistory.filter(r => r.examId !== result.examId);
    const personalAverage = previousResults.length > 0
      ? previousResults.reduce((sum, r) => sum + r.summary.percentage, 0) / previousResults.length
      : result.summary.percentage;

    const sections = this.generateReportSections(result, exam);

    const report = {
      id: `REPORT-${Date.now()}-${this.generateRandomId()}`,
      examId: result.examId,
      userId: result.userId,
      generatedAt: new Date().toISOString(),
      summary: {
        score: result.summary.totalScore,
        percentage: result.summary.percentage,
        grade: result.summary.grade,
        passed: result.summary.passed,
        rank: this.calculateRank(result, personalHistory),
        percentile: this.calculatePercentile(result, personalHistory)
      },
      sections,
      comparisons: {
        vsPersonalAverage: result.summary.percentage - personalAverage,
        vsPreviousExam: previousResults.length > 0
          ? result.summary.percentage - previousResults[previousResults.length - 1].summary.percentage
          : 0,
        trend: this.determineTrend(personalHistory)
      },
      recommendations: this.generateRecommendations(result),
      metadata: {
        examDuration: result.duration,
        averageTimePerQuestion: result.summary.averageTimePerQuestion,
        questionsAnswered: result.summary.attemptedQuestions,
        hintsUsed: result.questionResults.filter(r => r.hintUsed).length
      }
    };

    examStorage.savePerformanceReport(report);
    return report;
  }

  /**
   * Generate weakness report
   */
  async generateWeaknessReport(result: ExamResult, weaknessReport: WeaknessReport): Promise<{
    id: string;
    userId: string;
    generatedAt: string;
    overview: {
      totalWeaknesses: number;
      criticalCount: number;
      highPriorityCount: number;
      estimatedFixTime: string;
    };
    weaknessBreakdown: {
      category: string;
      items: {
        topic: string;
        severity: number;
        description: string;
        affectedQuestions: number;
        resources: string[];
      }[];
    }[];
    quickWins: {
      topic: string;
      action: string;
      estimatedTime: string;
      impact: string;
    }[];
    remediationPlan: {
      week: string;
      focus: string;
      activities: string[];
      successCriteria: string;
    }[];
    progressMetrics: {
      previousWeaknessCount: number;
      currentWeaknessCount: number;
      improvement: number;
    };
  }> {
    return {
      id: `WEAKNESS-REPORT-${Date.now()}`,
      userId: result.userId,
      generatedAt: new Date().toISOString(),
      overview: {
        totalWeaknesses: weaknessReport.totalWeaknesses,
        criticalCount: weaknessReport.criticalWeaknesses,
        highPriorityCount: weaknessReport.topicWeaknesses.filter(w => (w as any).priority === 'high').length,
        estimatedFixTime: this.estimateTotalFixTime(weaknessReport)
      },
      weaknessBreakdown: this.categorizeWeaknesses(weaknessReport),
      quickWins: weaknessReport.quickWins,
      remediationPlan: this.generateRemediationSchedule(weaknessReport),
      progressMetrics: {
        previousWeaknessCount: 0,
        currentWeaknessCount: weaknessReport.totalWeaknesses,
        improvement: 0
      }
    };
  }

  /**
   * Generate readiness report
   */
  async generateReadinessReport(readinessReport: ReadinessReport): Promise<{
    id: string;
    userId: string;
    generatedAt: string;
    overallScore: number;
    readinessLevel: string;
    readinessDescription: string;
    factorBreakdown: {
      factor: string;
      score: number;
      status: string;
      details: any;
    }[];
    gaps: {
      severity: string;
      description: string;
      impact: string;
    }[];
    recommendations: {
      priority: string;
      category: string;
      action: string;
      estimatedTime: string;
    }[];
    examReadiness: {
      ready: boolean;
      confidence: number;
      estimatedSuccessRate: number;
      warnings: string[];
    };
  }> {
    return {
      id: readinessReport.id,
      userId: readinessReport.userId,
      generatedAt: readinessReport.generatedAt,
      overallScore: readinessReport.overallScore * 100,
      readinessLevel: readinessReport.level,
      readinessDescription: this.getReadinessDescription(readinessReport.level),
      factorBreakdown: readinessReport.factorScores.map(f => ({
        factor: f.factor,
        score: f.score * 100,
        status: f.status,
        details: f.details
      })),
      gaps: readinessReport.criticalGaps.map(g => ({
        severity: 'critical',
        description: g.description,
        impact: g.impact
      })),
      recommendations: readinessReport.recommendations.map(r => ({
        priority: r.priority,
        category: r.category,
        action: r.action,
        estimatedTime: r.estimatedTime
      })),
      examReadiness: readinessReport.examReadiness
    };
  }

  /**
   * Generate progress report over time
   */
  async generateProgressReport(userId: string, timeframe: 'week' | 'month' | 'quarter' | 'all'): Promise<{
    userId: string;
    timeframe: string;
    generatedAt: string;
    summary: {
      totalExams: number;
      totalQuestions: number;
      averageScore: number;
      bestScore: number;
      improvement: number;
    };
    timeline: {
      date: string;
      score: number;
      topics: string[];
    }[];
    topicProgress: {
      topic: string;
      scores: number[];
      trend: 'improving' | 'stable' | 'declining';
      change: number;
    }[];
    achievements: {
      name: string;
      description: string;
      earnedAt: string;
    }[];
    insights: string[];
  }> {
    const results = examStorage.getResultsByUser(userId);
    const filteredResults = this.filterByTimeframe(results, timeframe);

    return {
      userId,
      timeframe,
      generatedAt: new Date().toISOString(),
      summary: this.calculateProgressSummary(filteredResults),
      timeline: filteredResults.map(r => ({
        date: r.completedAt,
        score: r.summary.percentage,
        topics: r.examTopics
      })),
      topicProgress: this.calculateTopicProgress(filteredResults),
      achievements: this.getRecentAchievements(filteredResults),
      insights: this.generateInsights(filteredResults)
    };
  }

  /**
   * Generate comparison report
   */
  async generateComparisonReport(userId: string, compareUserId?: string): Promise<{
    yourPerformance: {
      averageScore: number;
      examsCompleted: number;
      strongestTopic: string;
      weakestTopic: string;
    };
    comparison: {
      theirAverageScore: number;
      difference: number;
      betterTopics: string[];
      worseTopics: string[];
    } | null;
    recommendations: string[];
  }> {
    const yourResults = examStorage.getResultsByUser(userId);

    const yourPerformance = {
      averageScore: yourResults.length > 0
        ? yourResults.reduce((sum, r) => sum + r.summary.percentage, 0) / yourResults.length
        : 0,
      examsCompleted: yourResults.length,
      strongestTopic: this.getStrongestTopic(yourResults),
      weakestTopic: this.getWeakestTopic(yourResults)
    };

    if (!compareUserId) {
      return {
        yourPerformance,
        comparison: null,
        recommendations: this.generateSelfImprovementRecommendations(yourResults)
      };
    }

    const theirResults = examStorage.getResultsByUser(compareUserId);

    const theirAverage = theirResults.length > 0
      ? theirResults.reduce((sum, r) => sum + r.summary.percentage, 0) / theirResults.length
      : 0;

    const yourTopics = this.aggregateTopicScores(yourResults);
    const theirTopics = this.aggregateTopicScores(theirResults);

    const betterTopics: string[] = [];
    const worseTopics: string[] = [];

    Object.keys(yourTopics).forEach(topic => {
      if (yourTopics[topic] > (theirTopics[topic] || 0) + 10) {
        betterTopics.push(topic);
      } else if ((theirTopics[topic] || 0) > yourTopics[topic] + 10) {
        worseTopics.push(topic);
      }
    });

    return {
      yourPerformance,
      comparison: {
        theirAverageScore: theirAverage,
        difference: yourPerformance.averageScore - theirAverage,
        betterTopics,
        worseTopics
      },
      recommendations: this.generateComparisonRecommendations(yourTopics, theirTopics)
    };
  }

  /**
   * Export report as data
   */
  exportReport(reportId: string, format: 'json' | 'csv'): string {
    const report = examStorage.getReport(reportId);

    if (!report) {
      throw new Error(`Report not found: ${reportId}`);
    }

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    return this.convertToCSV(report);
  }

  private generateReportSections(result: ExamResult, exam: Exam): {
    title: string;
    content: any;
    charts?: any[];
  }[] {
    const sections = [];

    // Overview Section
    sections.push({
      title: 'Performance Overview',
      content: {
        score: result.summary.totalScore,
        maxScore: result.summary.maxScore,
        percentage: result.summary.percentage,
        grade: result.summary.grade,
        status: result.summary.passed ? 'Passed' : 'Failed'
      }
    });

    // Topic Performance Section
    sections.push({
      title: 'Topic Performance',
      content: result.topicResults.map(t => ({
        topic: t.topic,
        score: t.percentage,
        questions: t.totalQuestions,
        correct: t.correctAnswers
      })),
      charts: this.config.includeCharts
        ? [{ type: 'bar', data: result.topicResults.map(t => ({ label: t.topic, value: t.percentage })) }]
        : undefined
    });

    // Difficulty Analysis Section
    sections.push({
      title: 'Difficulty Analysis',
      content: result.difficultyAnalysis
    });

    // Time Analysis Section
    if (this.config.includeTimeAnalysis) {
      sections.push({
        title: 'Time Management',
        content: {
          totalTime: result.timeAnalysis.totalTime,
          averageTime: result.timeAnalysis.averageTime,
          distribution: result.timeAnalysis.timeDistribution
        }
      });
    }

    return sections;
  }

  private generateRecommendations(result: ExamResult): {
    priority: 'high' | 'medium' | 'low';
    topic: string;
    action: string;
    reason: string;
  }[] {
    const recommendations: {
      priority: 'high' | 'medium' | 'low';
      topic: string;
      action: string;
      reason: string;
    }[] = [];

    // Add topic-specific recommendations
    result.topicResults
      .filter(t => t.percentage < 60)
      .forEach(t => {
        recommendations.push({
          priority: t.percentage < 40 ? 'high' : 'medium',
          topic: t.topic,
          action: `Focus on improving ${t.topic}`,
          reason: `${t.percentage.toFixed(0)}% accuracy - below passing threshold`
        });
      });

    // Add time management recommendations
    if (result.timeAnalysis.timeWarning) {
      recommendations.push({
        priority: 'medium',
        topic: 'Time Management',
        action: 'Practice answering questions more quickly',
        reason: 'Average time per question exceeds recommended allocation'
      });
    }

    return recommendations.slice(0, 5);
  }

  private calculateRank(result: ExamResult, allResults: ExamResult[]): number {
    const sameExam = allResults.filter(r => r.examId === result.examId);
    const sorted = sameExam.sort((a, b) => b.summary.percentage - a.summary.percentage);

    return sorted.findIndex(r => r.id === result.id) + 1;
  }

  private calculatePercentile(result: ExamResult, allResults: ExamResult[]): number {
    const sameExam = allResults.filter(r => r.examId === result.examId);
    const below = sameExam.filter(r => r.summary.percentage < result.summary.percentage).length;

    return Math.round((below / sameExam.length) * 100);
  }

  private determineTrend(results: ExamResult[]): 'improving' | 'stable' | 'declining' {
    if (results.length < 3) return 'stable';

    const recent = results.slice(0, 5).map(r => r.summary.percentage);
    const older = results.slice(5, 10).map(r => r.summary.percentage);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private estimateTotalFixTime(weaknessReport: WeaknessReport): string {
    let totalHours = 0;

    weaknessReport.topicWeaknesses.forEach(w => {
      const hours = this.parseTimeToHours(w.estimatedMasteryTime || '1 hour');
      totalHours += hours;
    });

    if (totalHours < 1) return 'Less than 1 hour';
    if (totalHours < 5) return '1-5 hours';
    if (totalHours < 10) return '5-10 hours';
    return '10+ hours';
  }

  private parseTimeToHours(timeString: string): number {
    const match = timeString.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 1;

    const value = parseFloat(match[1]);
    if (timeString.includes('minute')) return value / 60;
    return value;
  }

  private categorizeWeaknesses(weaknessReport: WeaknessReport): {
    category: string;
    items: any[];
  }[] {
    return [
      {
        category: 'Topic Weaknesses',
        items: weaknessReport.topicWeaknesses.map(w => ({
          topic: w.topic,
          severity: w.severity,
          description: w.description,
          affectedQuestions: w.affectedQuestions.length,
          resources: w.remediationResources
        }))
      },
      {
        category: 'Concept Weaknesses',
        items: weaknessReport.conceptWeaknesses.map(w => ({
          topic: w.topic,
          severity: w.severity,
          description: w.description,
          affectedQuestions: w.affectedQuestions.length,
          resources: w.remediationResources
        }))
      }
    ];
  }

  private generateRemediationSchedule(weaknessReport: WeaknessReport): {
    week: string;
    focus: string;
    activities: string[];
    successCriteria: string;
  }[] {
    return weaknessReport.remediationPlans.map(plan => ({
      week: plan.duration,
      focus: plan.focusArea,
      activities: plan.activities,
      successCriteria: plan.successCriteria
    }));
  }

  private getReadinessDescription(level: string): string {
    const descriptions: Record<string, string> = {
      highly_prepared: 'You are excellently prepared for the exam. You have mastered the material and are ready to excel.',
      well_prepared: 'You are well prepared for the exam. You have a solid understanding of most topics.',
      moderately_prepared: 'You are moderately prepared. Some additional study would improve your chances of success.',
      slightly_prepared: 'You need more preparation. Consider spending additional time studying the key topics.',
      not_ready: 'You are not yet ready for this exam. Please review the material thoroughly before attempting.'
    };

    return descriptions[level] || 'Unable to determine readiness level.';
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

  private calculateProgressSummary(results: ExamResult[]): {
    totalExams: number;
    totalQuestions: number;
    averageScore: number;
    bestScore: number;
    improvement: number;
  } {
    if (results.length === 0) {
      return { totalExams: 0, totalQuestions: 0, averageScore: 0, bestScore: 0, improvement: 0 };
    }

    const scores = results.map(r => r.summary.percentage);

    return {
      totalExams: results.length,
      totalQuestions: results.reduce((sum, r) => sum + r.summary.totalQuestions, 0),
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      bestScore: Math.max(...scores),
      improvement: this.calculateTrend(scores)
    };
  }

  private calculateTopicProgress(results: ExamResult[]): {
    topic: string;
    scores: number[];
    trend: 'improving' | 'stable' | 'declining';
    change: number;
  }[] {
    const topicMap = new Map<string, number[]>();

    results.forEach(r => {
      r.topicResults.forEach(t => {
        const scores = topicMap.get(t.topic) || [];
        scores.push(t.percentage);
        topicMap.set(t.topic, scores);
      });
    });

    return Array.from(topicMap.entries()).map(([topic, scores]) => ({
      topic,
      scores,
      trend: this.calculateTrend(scores) > 0.05 ? 'improving'
        : this.calculateTrend(scores) < -0.05 ? 'declining' : 'stable',
      change: scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0
    }));
  }

  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    const n = scores.length;
    const xMean = (n - 1) / 2;
    const yMean = scores.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    scores.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });

    return denominator !== 0 ? numerator / denominator / 100 : 0;
  }

  private getRecentAchievements(results: ExamResult[]): { name: string; description: string; earnedAt: string }[] {
    return [];
  }

  private generateInsights(results: ExamResult[]): string[] {
    const insights: string[] = [];

    if (results.length === 0) {
      insights.push('Start taking exams to see your progress insights!');
      return insights;
    }

    const recentScores = results.slice(-5).map(r => r.summary.percentage);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    if (avgRecent >= 80) {
      insights.push('Great performance! Keep up the excellent work.');
    } else if (avgRecent >= 60) {
      insights.push('You\'re on the right track. Continue practicing to improve.');
    } else {
      insights.push('More practice is needed. Focus on understanding core concepts.');
    }

    const topicScores = new Map<string, number[]>();
    results.forEach(r => {
      r.topicResults.forEach(t => {
        const scores = topicScores.get(t.topic) || [];
        scores.push(t.percentage);
        topicScores.set(t.topic, scores);
      });
    });

    const improvingTopics: string[] = [];
    const decliningTopics: string[] = [];

    topicScores.forEach((scores, topic) => {
      if (scores.length >= 2) {
        const trend = this.calculateTrend(scores);
        if (trend > 0.1) improvingTopics.push(topic);
        if (trend < -0.1) decliningTopics.push(topic);
      }
    });

    if (improvingTopics.length > 0) {
      insights.push(`You're improving in: ${improvingTopics.join(', ')}`);
    }
    if (decliningTopics.length > 0) {
      insights.push(`Focus needed on: ${decliningTopics.join(', ')}`);
    }

    return insights;
  }

  private getStrongestTopic(results: ExamResult[]): string {
    const topicScores = this.aggregateTopicScores(results);
    let strongest = '';
    let highest = 0;

    Object.entries(topicScores).forEach(([topic, score]) => {
      if (score > highest) {
        highest = score;
        strongest = topic;
      }
    });

    return strongest || 'N/A';
  }

  private getWeakestTopic(results: ExamResult[]): string {
    const topicScores = this.aggregateTopicScores(results);
    let weakest = '';
    let lowest = 100;

    Object.entries(topicScores).forEach(([topic, score]) => {
      if (score < lowest) {
        lowest = score;
        weakest = topic;
      }
    });

    return weakest || 'N/A';
  }

  private aggregateTopicScores(results: ExamResult[]): Record<string, number> {
    const topicMap = new Map<string, { total: number; count: number }>();

    results.forEach(r => {
      r.topicResults.forEach(t => {
        const existing = topicMap.get(t.topic) || { total: 0, count: 0 };
        existing.total += t.percentage;
        existing.count += 1;
        topicMap.set(t.topic, existing);
      });
    });

    const scores: Record<string, number> = {};
    topicMap.forEach((data, topic) => {
      scores[topic] = data.total / data.count;
    });

    return scores;
  }

  private generateSelfImprovementRecommendations(results: ExamResult[]): string[] {
    const recommendations: string[] = [];

    if (results.length === 0) {
      return ['Start by taking a practice exam to assess your current level.'];
    }

    const weakestTopic = this.getWeakestTopic(results);
    if (weakestTopic !== 'N/A') {
      recommendations.push(`Focus more study time on "${weakestTopic}" to improve your overall score.`);
    }

    const recentScores = results.slice(-5).map(r => r.summary.percentage);
    if (recentScores.every(s => s < 60)) {
      recommendations.push('Consider reviewing fundamental concepts before attempting more exams.');
    }

    recommendations.push('Practice regularly to maintain consistency and track your progress.');

    return recommendations;
  }

  private generateComparisonRecommendations(yourTopics: Record<string, number>, theirTopics: Record<string, number>): string[] {
    const recommendations: string[] = [];

    Object.keys(theirTopics).forEach(topic => {
      const yourScore = yourTopics[topic] || 0;
      const theirScore = theirTopics[topic] || 0;

      if (theirScore > yourScore + 10) {
        recommendations.push(`Improve your understanding of "${topic}" to match your peer's performance.`);
      }
    });

    return recommendations;
  }

  private convertToCSV(report: any): string {
    // Simplified CSV conversion
    const rows: string[] = [];
    rows.push('Key,Value');

    Object.entries(report).forEach(([key, value]) => {
      if (typeof value !== 'object') {
        rows.push(`${key},${value}`);
      }
    });

    return rows.join('\n');
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

export default ReportGenerator;
