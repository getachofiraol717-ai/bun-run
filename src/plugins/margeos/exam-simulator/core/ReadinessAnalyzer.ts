// @ts-nocheck
/**
 * ReadinessAnalyzer.ts
 *
 * Analyzes student readiness for exams by evaluating study patterns,
 * performance history, topic mastery, and other readiness factors.
 * Provides actionable recommendations for improving exam readiness.
 */

import type { ReadinessLevel, ReadinessScore, ReadinessReport, FactorScore } from '../models/ReadinessReport';
import { examStorage } from '../store/examSimulatorStore';

export interface ReadinessConfig {
  minimumStudyHours: number;
  minimumPracticeQuestions: number;
  minimumTopicCoverage: number;
  confidenceThreshold: number;
  timeSinceLastStudy: number; // in hours
}

export interface ReadinessInput {
  topics: string[];
  subject?: string;
  userId: string;
  studyHistory?: {
    totalHoursStudied: number;
    hoursPerTopic: Record<string, number>;
    practiceQuestionsAttempted: number;
    averageQuizScore: number;
    lastStudySession: string;
  };
  topicMastery?: Record<string, number>;
  completedContent?: string[];
  upcomingExamDate?: string;
}

const DEFAULT_CONFIG: ReadinessConfig = {
  minimumStudyHours: 2,
  minimumPracticeQuestions: 20,
  minimumTopicCoverage: 0.7,
  confidenceThreshold: 0.6,
  timeSinceLastStudy: 24
};

export class ReadinessAnalyzer {
  private static instance: ReadinessAnalyzer;
  private config: ReadinessConfig;
  private initialized: boolean = false;

  private constructor(config?: Partial<ReadinessConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<ReadinessConfig>): ReadinessAnalyzer {
    if (!ReadinessAnalyzer.instance) {
      ReadinessAnalyzer.instance = new ReadinessAnalyzer(config);
    }
    return ReadinessAnalyzer.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Check readiness for specific topics
   */
  async checkReadiness(topics: string[], subject?: string): Promise<{
    ready: boolean;
    level: ReadinessLevel;
    score: number;
    sessionId?: string;
  }> {
    const input: ReadinessInput = {
      topics,
      subject,
      userId: 'current_user'
    };

    const report = await this.generateReadinessReport(input);

    return {
      ready: report.level !== 'not_ready' && report.level !== 'slightly_prepared',
      level: report.level,
      score: report.overallScore,
      sessionId: report.id
    };
  }

  /**
   * Generate comprehensive readiness report
   */
  async getReadinessReport(topics: string[], subject?: string): Promise<ReadinessReport> {
    const input: ReadinessInput = {
      topics,
      subject,
      userId: 'current_user'
    };

    return await this.generateReadinessReport(input);
  }

  /**
   * Generate detailed readiness report
   */
  async generateReadinessReport(input: ReadinessInput): Promise<ReadinessReport> {
    const { topics, studyHistory, topicMastery } = input;

    // Gather data from various sources
    const studyData = studyHistory || await this.gatherStudyData(topics);
    const masteryData = topicMastery || await this.gatherMasteryData(topics);
    const performanceData = await this.gatherPerformanceData(input.userId);

    // Calculate factor scores
    const factorScores: FactorScore[] = await this.calculateFactorScores(
      topics,
      studyData,
      masteryData,
      performanceData
    );

    // Calculate overall readiness score
    const overallScore = this.calculateOverallScore(factorScores);
    const level = this.determineReadinessLevel(overallScore);

    // Identify gaps
    const gaps = this.identifyGaps(factorScores);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      factorScores,
      gaps,
      overallScore
    );

    const report: ReadinessReport = {
      id: `READINESS-${Date.now()}-${this.generateRandomId()}`,
      userId: input.userId,
      topics,
      subject: input.subject,
      generatedAt: new Date().toISOString(),
      overallScore,
      level,
      factorScores,
      criticalGaps: gaps.filter(g => g.severity === 'critical'),
      highPriorityGaps: gaps.filter(g => g.severity === 'high'),
      mediumPriorityGaps: gaps.filter(g => g.severity === 'medium'),
      recommendations,
      examReadiness: this.evaluateExamReadiness(overallScore, gaps),
      confidence: this.calculateConfidence(factorScores),
      metadata: {
        studyHours: studyData.totalHoursStudied,
        practiceQuestions: studyData.practiceQuestionsAttempted,
        averageScore: studyData.averageQuizScore,
        topicMastery: masteryData
      }
    };

    examStorage.saveReadinessReport(report);
    return report;
  }

  /**
   * Calculate individual factor scores
   */
  private async calculateFactorScores(
    topics: string[],
    studyData: ReadinessInput['studyHistory'],
    masteryData: Record<string, number>,
    performanceData: any
  ): Promise<FactorScore[]> {
    const factors: FactorScore[] = [];

    // Study Time Factor
    const studyTimeScore = this.calculateStudyTimeScore(studyData);
    factors.push({
      factor: 'study_time',
      label: 'Study Time',
      score: studyTimeScore,
      weight: 0.2,
      status: studyTimeScore >= 0.7 ? 'good' : studyTimeScore >= 0.4 ? 'needs_improvement' : 'poor',
      details: {
        totalHours: studyData.totalHoursStudied,
        recommendedHours: topics.length * 2,
        hoursPerTopic: studyData.hoursPerTopic
      }
    });

    // Topic Coverage Factor
    const coverageScore = this.calculateCoverageScore(topics, studyData);
    factors.push({
      factor: 'topic_coverage',
      label: 'Topic Coverage',
      score: coverageScore,
      weight: 0.2,
      status: coverageScore >= 0.8 ? 'good' : coverageScore >= 0.5 ? 'needs_improvement' : 'poor',
      details: {
        covered: Object.keys(masteryData).length,
        total: topics.length,
        coverage: Object.keys(masteryData).length / topics.length
      }
    });

    // Mastery Level Factor
    const masteryScore = this.calculateMasteryScore(masteryData);
    factors.push({
      factor: 'mastery_level',
      label: 'Topic Mastery',
      score: masteryScore,
      weight: 0.25,
      status: masteryScore >= 0.7 ? 'good' : masteryScore >= 0.4 ? 'needs_improvement' : 'poor',
      details: {
        averageMastery: Object.values(masteryData).reduce((a, b) => a + b, 0) / Object.keys(masteryData).length,
        topicMastery: masteryData
      }
    });

    // Practice Score Factor
    const practiceScore = this.calculatePracticeScore(studyData, performanceData);
    factors.push({
      factor: 'practice_score',
      label: 'Practice Performance',
      score: practiceScore,
      weight: 0.2,
      status: practiceScore >= 0.7 ? 'good' : practiceScore >= 0.4 ? 'needs_improvement' : 'poor',
      details: {
        questionsAttempted: studyData.practiceQuestionsAttempted,
        averageQuizScore: studyData.averageQuizScore,
        recentPerformance: performanceData.recentScores
      }
    });

    // Recency Factor
    const recencyScore = this.calculateRecencyScore(studyData);
    factors.push({
      factor: 'recency',
      label: 'Study Recency',
      score: recencyScore,
      weight: 0.15,
      status: recencyScore >= 0.7 ? 'good' : recencyScore >= 0.4 ? 'needs_improvement' : 'poor',
      details: {
        lastStudySession: studyData.lastStudySession,
        hoursSinceLastStudy: this.getHoursSinceLastStudy(studyData.lastStudySession)
      }
    });

    return factors;
  }

  private calculateStudyTimeScore(studyData: ReadinessInput['studyHistory']): number {
    if (!studyData) return 0;

    const recommendedHours = this.config.minimumStudyHours;
    const actualHours = studyData.totalHoursStudied;

    if (actualHours >= recommendedHours * 2) return 1;
    if (actualHours >= recommendedHours) return 0.8;
    if (actualHours >= recommendedHours * 0.5) return 0.5;
    if (actualHours >= recommendedHours * 0.25) return 0.3;
    return 0.1;
  }

  private calculateCoverageScore(topics: string[], studyData: ReadinessInput['studyHistory']): number {
    if (!studyData || !studyData.hoursPerTopic) return 0;

    const coveredTopics = Object.keys(studyData.hoursPerTopic);
    const covered = topics.filter(t => coveredTopics.includes(t)).length;

    return covered / topics.length;
  }

  private calculateMasteryScore(masteryData: Record<string, number>): number {
    if (Object.keys(masteryData).length === 0) return 0;

    const values = Object.values(masteryData);
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    return Math.min(1, average);
  }

  private calculatePracticeScore(
    studyData: ReadinessInput['studyHistory'],
    performanceData: any
  ): number {
    if (!studyData) return 0;

    const questionsScore = this.calculateQuestionsScore(studyData.practiceQuestionsAttempted);
    const performanceScore = studyData.averageQuizScore / 100;

    return (questionsScore + performanceScore) / 2;
  }

  private calculateQuestionsScore(attempted: number): number {
    const recommended = this.config.minimumPracticeQuestions;

    if (attempted >= recommended * 2) return 1;
    if (attempted >= recommended) return 0.8;
    if (attempted >= recommended * 0.5) return 0.5;
    if (attempted >= recommended * 0.25) return 0.3;
    return 0.1;
  }

  private calculateRecencyScore(studyData: ReadinessInput['studyHistory']): number {
    if (!studyData || !studyData.lastStudySession) return 0;

    const hoursSince = this.getHoursSinceLastStudy(studyData.lastStudySession);
    const maxHours = this.config.timeSinceLastStudy;

    if (hoursSince <= 6) return 1;
    if (hoursSince <= 24) return 0.8;
    if (hoursSince <= 48) return 0.5;
    if (hoursSince <= 72) return 0.3;
    return 0.1;
  }

  private getHoursSinceLastStudy(lastStudySession: string): number {
    if (!lastStudySession) return Infinity;

    const lastDate = new Date(lastStudySession).getTime();
    const now = Date.now();
    return (now - lastDate) / (1000 * 60 * 60);
  }

  private calculateOverallScore(factorScores: FactorScore[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    factorScores.forEach(factor => {
      weightedSum += factor.score * factor.weight;
      totalWeight += factor.weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private determineReadinessLevel(score: number): ReadinessLevel {
    if (score >= 0.9) return 'highly_prepared';
    if (score >= 0.75) return 'well_prepared';
    if (score >= 0.6) return 'moderately_prepared';
    if (score >= 0.4) return 'slightly_prepared';
    return 'not_ready';
  }

  private identifyGaps(factorScores: FactorScore[]): {
    factor: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }[] {
    const gaps: {
      factor: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      description: string;
      impact: string;
    }[] = [];

    factorScores.forEach(factor => {
      if (factor.score < 0.3) {
        gaps.push({
          factor: factor.factor,
          severity: 'critical',
          description: `${factor.label} is severely lacking`,
          impact: 'Major impact on exam performance'
        });
      } else if (factor.score < 0.5) {
        gaps.push({
          factor: factor.factor,
          severity: 'high',
          description: `${factor.label} needs significant improvement`,
          impact: 'Noticeable impact on exam performance'
        });
      } else if (factor.score < 0.7) {
        gaps.push({
          factor: factor.factor,
          severity: 'medium',
          description: `${factor.label} could be improved`,
          impact: 'Minor impact on exam performance'
        });
      }
    });

    return gaps;
  }

  private generateRecommendations(
    factorScores: FactorScore[],
    gaps: any[],
    overallScore: number
  ): {
    priority: 'high' | 'medium' | 'low';
    category: string;
    action: string;
    reason: string;
    estimatedTime: string;
  }[] {
    const recommendations: {
      priority: 'high' | 'medium' | 'low';
      category: string;
      action: string;
      reason: string;
      estimatedTime: string;
    }[] = [];

    if (overallScore < 0.6) {
      recommendations.push({
        priority: 'high',
        category: 'study_time',
        action: 'Schedule intensive study sessions',
        reason: 'Overall readiness is below optimal level',
        estimatedTime: '4-6 hours'
      });
    }

    factorScores.forEach(factor => {
      if (factor.score < 0.5) {
        if (factor.factor === 'study_time') {
          recommendations.push({
            priority: 'high',
            category: 'study_time',
            action: `Study for at least ${this.config.minimumStudyHours} hours total`,
            reason: `Current study time is insufficient`,
            estimatedTime: '2-3 hours'
          });
        } else if (factor.factor === 'topic_coverage') {
          recommendations.push({
            priority: 'high',
            category: 'topic_coverage',
            action: 'Cover all required topics',
            reason: 'Not all exam topics have been studied',
            estimatedTime: '1-2 hours per topic'
          });
        } else if (factor.factor === 'mastery_level') {
          recommendations.push({
            priority: 'high',
            category: 'mastery',
            action: 'Focus on understanding core concepts deeply',
            reason: 'Topic mastery level is below target',
            estimatedTime: '2-4 hours'
          });
        } else if (factor.factor === 'practice_score') {
          recommendations.push({
            priority: 'medium',
            category: 'practice',
            action: `Attempt at least ${this.config.minimumPracticeQuestions} practice questions`,
            reason: 'More practice needed to build confidence',
            estimatedTime: '1-2 hours'
          });
        }
      }
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private evaluateExamReadiness(
    score: number,
    gaps: any[]
  ): {
    ready: boolean;
    confidence: number;
    estimatedSuccessRate: number;
    warnings: string[];
  } {
    const criticalGaps = gaps.filter(g => g.severity === 'critical').length;
    const highGaps = gaps.filter(g => g.severity === 'high').length;

    const warnings: string[] = [];
    if (criticalGaps > 0) {
      warnings.push(`${criticalGaps} critical gaps identified - exam may be very challenging`);
    }
    if (highGaps > 0) {
      warnings.push(`${highGaps} high priority areas need attention`);
    }

    const estimatedSuccessRate = Math.max(0, Math.min(100, score * 100 - (criticalGaps * 20) - (highGaps * 10)));

    return {
      ready: score >= 0.6 && criticalGaps === 0,
      confidence: this.calculateConfidence([]),
      estimatedSuccessRate,
      warnings
    };
  }

  private calculateConfidence(factorScores: FactorScore[]): number {
    if (factorScores.length === 0) return 0;

    const scores = factorScores.map(f => f.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, Math.min(1, 1 - stdDev));
  }

  private async gatherStudyData(topics: string[]): Promise<NonNullable<ReadinessInput['studyHistory']>> {
    // Gather from storage/other engines
    return {
      totalHoursStudied: 0,
      hoursPerTopic: {},
      practiceQuestionsAttempted: 0,
      averageQuizScore: 0,
      lastStudySession: ''
    };
  }

  private async gatherMasteryData(topics: string[]): Promise<Record<string, number>> {
    // Gather from other engines (Adaptive Quiz, Knowledge Galaxy, etc.)
    return {};
  }

  private async gatherPerformanceData(userId: string): Promise<{
    recentScores: number[];
    averageScore: number;
  }> {
    const results = examStorage.getResultsByUser(userId);

    const recentScores = results.slice(-5).map(r => r.summary.percentage);

    return {
      recentScores,
      averageScore: recentScores.length > 0
        ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
        : 0
    };
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

export default ReadinessAnalyzer;
