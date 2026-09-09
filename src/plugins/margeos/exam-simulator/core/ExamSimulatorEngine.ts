// @ts-nocheck
/**
 * ExamSimulatorEngine.ts
 *
 * Core engine for AI Exam Simulator that orchestrates all exam operations.
 * Manages exam lifecycle, integrates with other MargeOS engines, and
 * provides a unified interface for exam simulation functionality.
 */

import type { Exam, ExamMode, ExamStatus, ExamConfig, ExamSettings } from '../models';
import type { ExamQuestion, ExamQuestionContent } from '../models/ExamQuestion';
import { ExamGenerator } from './ExamGenerator';
import { TimedAssessmentEngine } from './TimedAssessmentEngine';
import { ReadinessAnalyzer } from './ReadinessAnalyzer';
import { WeaknessAnalyzer } from './WeaknessAnalyzer';
import { PerformanceEvaluator } from './PerformanceEvaluator';
import { ReportGenerator } from './ReportGenerator';
import { RecommendationEngine } from './RecommendationEngine';
import { ExamSessionManager } from './ExamSessionManager';
import { ExamController } from './ExamController';
import { examStorage } from '../store/examSimulatorStore';

export interface ExamEngineConfig {
  enableAutoSave: boolean;
  enableTimerWarnings: boolean;
  enableReadinessCheck: boolean;
  enableWeaknessAnalysis: boolean;
  maxExamAttempts: number;
  defaultTimeLimit: number; // in minutes
  questionTimeAllocation: 'fixed' | 'adaptive' | 'difficulty_based';
}

export interface ExamEngineStats {
  totalExamsCompleted: number;
  totalQuestionsAnswered: number;
  averageScore: number;
  totalStudyTime: number;
  mostChallengedTopics: string[];
  improvementTrend: 'improving' | 'stable' | 'declining';
}

const DEFAULT_CONFIG: ExamEngineConfig = {
  enableAutoSave: true,
  enableTimerWarnings: true,
  enableReadinessCheck: true,
  enableWeaknessAnalysis: true,
  maxExamAttempts: 3,
  defaultTimeLimit: 60,
  questionTimeAllocation: 'difficulty_based'
};

export class ExamSimulatorEngine {
  private static instance: ExamSimulatorEngine;
  private config: ExamEngineConfig;
  private examGenerator: ExamGenerator;
  private timedEngine: TimedAssessmentEngine;
  private readinessAnalyzer: ReadinessAnalyzer;
  private weaknessAnalyzer: WeaknessAnalyzer;
  private performanceEvaluator: PerformanceEvaluator;
  private reportGenerator: ReportGenerator;
  private recommendationEngine: RecommendationEngine;
  private sessionManager: ExamSessionManager;
  private controller: ExamController;
  private initialized: boolean = false;

  private constructor(config: Partial<ExamEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.examGenerator = ExamGenerator.getInstance();
    this.timedEngine = TimedAssessmentEngine.getInstance();
    this.readinessAnalyzer = ReadinessAnalyzer.getInstance();
    this.weaknessAnalyzer = WeaknessAnalyzer.getInstance();
    this.performanceEvaluator = PerformanceEvaluator.getInstance();
    this.reportGenerator = ReportGenerator.getInstance();
    this.recommendationEngine = RecommendationEngine.getInstance();
    this.sessionManager = ExamSessionManager.getInstance();
    this.controller = ExamController.getInstance();
  }

  static getInstance(config?: Partial<ExamEngineConfig>): ExamSimulatorEngine {
    if (!ExamSimulatorEngine.instance) {
      ExamSimulatorEngine.instance = new ExamSimulatorEngine(config);
    }
    return ExamSimulatorEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.examGenerator.initialize();
    await this.timedEngine.initialize();
    await this.readinessAnalyzer.initialize();
    await this.weaknessAnalyzer.initialize();
    await this.performanceEvaluator.initialize();
    await this.reportGenerator.initialize();
    await this.recommendationEngine.initialize();
    await this.sessionManager.initialize();
    await this.controller.initialize();

    this.initialized = true;
  }

  /**
   * Create a new exam based on mode and configuration
   */
  async createExam(
    mode: ExamMode,
    config: Partial<ExamConfig>,
    topics?: string[],
    difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  ): Promise<Exam> {
    const examConfig: ExamConfig = {
      mode,
      title: config.title || `${this.getModeDisplayName(mode)} Exam`,
      description: config.description || '',
      duration: config.duration || this.config.defaultTimeLimit,
      totalQuestions: config.totalQuestions || this.getDefaultQuestionCount(mode),
      passingScore: config.passingScore || 60,
      topics: topics || [],
      difficulty: difficulty || 'mixed',
      shuffleQuestions: config.shuffleQuestions ?? true,
      shuffleOptions: config.shuffleOptions ?? true,
      showResults: config.showResults ?? true,
      showSolutions: config.showSolutions ?? true,
      allowPause: config.allowPause ?? true,
      allowReview: config.allowReview ?? true,
      randomizeDifficulty: config.randomizeDifficulty ?? true,
      adaptiveDifficulty: config.adaptiveDifficulty ?? false,
      questionTypes: config.questionTypes || this.getDefaultQuestionTypes(mode),
      subject: config.subject || '',
      chapter: config.chapter || '',
      difficultyDistribution: config.difficultyDistribution || this.getDefaultDifficultyDistribution(),
      tags: config.tags || [],
      settings: config.settings || this.getDefaultSettings(),
      rules: config.rules || this.getDefaultRules(mode),
      accessibility: config.accessibility || this.getDefaultAccessibility(),
      metadata: config.metadata || {}
    };

    return await this.examGenerator.generateExam(examConfig);
  }

  /**
   * Start an exam session
   */
  async startExam(examId: string, userId: string): Promise<string> {
    const exam = examStorage.getExam(examId);
    if (!exam) {
      throw new Error(`Exam not found: ${examId}`);
    }

    if (this.config.enableReadinessCheck) {
      const readinessCheck = await this.readinessAnalyzer.checkReadiness(
        exam.topics,
        exam.subject
      );

      if (readinessCheck.level === 'not_ready' || readinessCheck.level === 'slightly_prepared') {
        return readinessCheck.sessionId;
      }
    }

    return await this.sessionManager.createSession(examId, userId);
  }

  /**
   * Submit exam answers
   */
  async submitExam(
    sessionId: string,
    answers: Map<string, string | string[] | boolean>
  ): Promise<{ resultId: string; score: number; passed: boolean }> {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const exam = examStorage.getExam(session.examId);
    if (!exam) {
      throw new Error(`Exam not found: ${session.examId}`);
    }

    // Calculate score
    const result = await this.performanceEvaluator.evaluateExam(exam, answers, session);
    const passed = result.summary.percentage >= exam.config.passingScore;

    // Generate detailed reports
    if (this.config.enableWeaknessAnalysis) {
      const weaknessReport = await this.weaknessAnalyzer.analyzeWeaknesses(
        exam,
        answers,
        result
      );
      examStorage.saveWeaknessReport(weaknessReport);
    }

    // Generate performance report
    const performanceReport = await this.reportGenerator.generatePerformanceReport(
      result,
      exam
    );
    examStorage.savePerformanceReport(performanceReport);

    // Get recommendations
    const recommendations = await this.recommendationEngine.getRecommendations(
      result,
      exam.topics
    );

    return {
      resultId: result.id,
      score: result.summary.percentage,
      passed
    };
  }

  /**
   * Get readiness assessment for topics
   */
  async getReadinessAssessment(topics: string[], subject?: string) {
    return await this.readinessAnalyzer.getReadinessReport(topics, subject);
  }

  /**
   * Get weakness analysis for specific topics
   */
  async getWeaknessAnalysis(topics: string[]) {
    return await this.weaknessAnalyzer.getWeaknessReport(topics);
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(userId: string) {
    return await this.performanceEvaluator.getPerformanceProfile(userId);
  }

  /**
   * Get study recommendations based on exam history
   */
  async getStudyRecommendations(userId: string, limit?: number) {
    return await this.recommendationEngine.getPersonalizedRecommendations(
      userId,
      limit
    );
  }

  /**
   * Get exam statistics
   */
  getStats(): ExamEngineStats {
    const allResults = examStorage.getAllResults();

    const totalExamsCompleted = allResults.length;
    const totalQuestionsAnswered = allResults.reduce(
      (sum, r) => sum + r.summary.totalQuestions,
      0
    );
    const averageScore = totalExamsCompleted > 0
      ? allResults.reduce((sum, r) => sum + r.summary.percentage, 0) / totalExamsCompleted
      : 0;

    const topicScores = new Map<string, number[]>();
    allResults.forEach(result => {
      result.topicResults.forEach(topic => {
        const scores = topicScores.get(topic.topic) || [];
        scores.push(topic.percentage);
        topicScores.set(topic.topic, scores);
      });
    });

    const mostChallengedTopics: string[] = [];
    topicScores.forEach((scores, topic) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < 60) {
        mostChallengedTopics.push(topic);
      }
    });

    return {
      totalExamsCompleted,
      totalQuestionsAnswered,
      averageScore,
      totalStudyTime: 0, // Would be calculated from session data
      mostChallengedTopics,
      improvementTrend: 'stable'
    };
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<ExamEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ExamEngineConfig {
    return { ...this.config };
  }

  /**
   * Validate exam configuration
   */
  validateExamConfig(config: Partial<ExamConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.title || config.title.trim().length === 0) {
      errors.push('Exam title is required');
    }

    if (config.duration && config.duration <= 0) {
      errors.push('Duration must be positive');
    }

    if (config.totalQuestions && config.totalQuestions <= 0) {
      errors.push('Total questions must be positive');
    }

    if (config.passingScore && (config.passingScore < 0 || config.passingScore > 100)) {
      errors.push('Passing score must be between 0 and 100');
    }

    if (config.difficultyDistribution) {
      const total = Object.values(config.difficultyDistribution).reduce((a, b) => a + b, 0);
      if (Math.abs(total - 100) > 0.01) {
        errors.push('Difficulty distribution must sum to 100%');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.timedEngine.stopAllTimers();
    this.sessionManager.cleanupExpiredSessions();
    this.initialized = false;
  }

  private getModeDisplayName(mode: ExamMode): string {
    const names: Record<ExamMode, string> = {
      practice: 'Practice',
      chapter: 'Chapter',
      subject: 'Subject',
      comprehensive: 'Comprehensive',
      custom: 'Custom',
      revision: 'Revision',
      adaptive: 'Adaptive'
    };
    return names[mode];
  }

  private getDefaultQuestionCount(mode: ExamMode): number {
    const counts: Record<ExamMode, number> = {
      practice: 10,
      chapter: 15,
      subject: 25,
      comprehensive: 50,
      custom: 20,
      revision: 15,
      adaptive: 20
    };
    return counts[mode];
  }

  private getDefaultQuestionTypes(mode: ExamMode): string[] {
    const types: Record<ExamMode, string[]> = {
      practice: ['MCQ', 'T_F', 'SHORT_ANSWER'],
      chapter: ['MCQ', 'T_F', 'MULTI_SELECT'],
      subject: ['MCQ', 'T_F', 'SHORT_ANSWER', 'MULTI_SELECT', 'MATCHING'],
      comprehensive: ['MCQ', 'T_F', 'SHORT_ANSWER', 'MULTI_SELECT', 'MATCHING', 'ESSAY'],
      custom: ['MCQ', 'T_F', 'SHORT_ANSWER'],
      revision: ['MCQ', 'T_F'],
      adaptive: ['MCQ', 'T_F', 'SHORT_ANSWER']
    };
    return types[mode];
  }

  private getDefaultDifficultyDistribution(): Record<string, number> {
    return {
      easy: 30,
      medium: 40,
      hard: 30
    };
  }

  private getDefaultSettings(): Partial<ExamSettings> {
    return {
      showTimer: true,
      showProgressBar: true,
      allowCalculator: true,
      allowFormulas: true,
      highlightQuestions: true,
      autoSaveInterval: 30,
      showNavigator: true
    };
  }

  private getDefaultRules(mode: ExamMode): Partial<ExamSettings['rules']> {
    return {
      allowBackNavigation: true,
      showCorrectAnswers: true,
      partialCredit: mode !== 'practice',
      negativeMarking: mode === 'comprehensive' || mode === 'adaptive',
      reviewBeforeSubmit: true,
      flagForReview: true
    };
  }

  private getDefaultAccessibility(): Partial<ExamSettings['accessibility']> {
    return {
      screenReader: false,
      highContrast: false,
      largeFont: false,
      extraTime: 0
    };
  }
}

export default ExamSimulatorEngine;
