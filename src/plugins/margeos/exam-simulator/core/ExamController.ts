// @ts-nocheck
/**
 * ExamController.ts
 *
 * Main controller for exam operations that coordinates between different
 * engines and provides a unified API for exam functionality.
 */

import type { Exam, ExamMode, ExamConfig } from '../models';
import type { ExamSession } from '../models/ExamSession';
import type { ExamResult } from '../models';
import type { ReadinessReport } from '../models/ReadinessReport';
import type { WeaknessReport } from '../models/WeaknessReport';
import { ExamSimulatorEngine } from './ExamSimulatorEngine';
import { ExamGenerator } from './ExamGenerator';
import { TimedAssessmentEngine } from './TimedAssessmentEngine';
import { ReadinessAnalyzer } from './ReadinessAnalyzer';
import { WeaknessAnalyzer } from './WeaknessAnalyzer';
import { PerformanceEvaluator } from './PerformanceEvaluator';
import { ReportGenerator } from './ReportGenerator';
import { RecommendationEngine } from './RecommendationEngine';
import { ExamSessionManager } from './ExamSessionManager';
import { examStorage } from '../store/examSimulatorStore';

export interface ExamControllerConfig {
  enableAutoSave: boolean;
  enableTimerWarnings: boolean;
  autoSubmitOnTimeout: boolean;
  enableReadinessCheck: boolean;
  enableWeaknessAnalysis: boolean;
}

const DEFAULT_CONFIG: ExamControllerConfig = {
  enableAutoSave: true,
  enableTimerWarnings: true,
  autoSubmitOnTimeout: true,
  enableReadinessCheck: true,
  enableWeaknessAnalysis: true
};

export interface ExamOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export class ExamController {
  private static instance: ExamController;
  private config: ExamControllerConfig;
  private engine: ExamSimulatorEngine;
  private examGenerator: ExamGenerator;
  private timedEngine: TimedAssessmentEngine;
  private readinessAnalyzer: ReadinessAnalyzer;
  private weaknessAnalyzer: WeaknessAnalyzer;
  private performanceEvaluator: PerformanceEvaluator;
  private reportGenerator: ReportGenerator;
  private recommendationEngine: RecommendationEngine;
  private sessionManager: ExamSessionManager;
  private initialized: boolean = false;

  private constructor(config?: Partial<ExamControllerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.engine = ExamSimulatorEngine.getInstance({ enableAutoSave: this.config.enableAutoSave });
    this.examGenerator = ExamGenerator.getInstance();
    this.timedEngine = TimedAssessmentEngine.getInstance();
    this.readinessAnalyzer = ReadinessAnalyzer.getInstance();
    this.weaknessAnalyzer = WeaknessAnalyzer.getInstance();
    this.performanceEvaluator = PerformanceEvaluator.getInstance();
    this.reportGenerator = ReportGenerator.getInstance();
    this.recommendationEngine = RecommendationEngine.getInstance();
    this.sessionManager = ExamSessionManager.getInstance();
  }

  static getInstance(config?: Partial<ExamControllerConfig>): ExamController {
    if (!ExamController.instance) {
      ExamController.instance = ExamController(this.config);
    }
    return ExamController.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.engine.initialize();
    await this.examGenerator.initialize();
    await this.timedEngine.initialize();
    await this.readinessAnalyzer.initialize();
    await this.weaknessAnalyzer.initialize();
    await this.performanceEvaluator.initialize();
    await this.reportGenerator.initialize();
    await this.recommendationEngine.initialize();
    await this.sessionManager.initialize();

    this.initialized = true;
  }

  /**
   * Create and start a new exam
   */
  async startExam(
    mode: ExamMode,
    config: Partial<ExamConfig>,
    userId: string,
    topics?: string[]
  ): Promise<ExamOperationResult<{ examId: string; sessionId: string; readinessReport?: ReadinessReport }>> {
    try {
      // Validate configuration
      const validation = this.engine.validateExamConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid exam configuration: ${validation.errors.join(', ')}`
        };
      }

      // Check readiness if enabled
      let readinessReport: ReadinessReport | undefined;
      if (this.config.enableReadinessCheck && topics && topics.length > 0) {
        const readiness = await this.readinessAnalyzer.checkReadiness(topics, config.subject);
        if (!readiness.ready) {
          return {
            success: false,
            error: 'Not ready for exam',
            warnings: ['Your readiness level is below recommended. Consider more preparation.']
          };
        }
        readinessReport = await this.readinessAnalyzer.generateReadinessReport({
          topics,
          subject: config.subject,
          userId
        });
      }

      // Create the exam
      const exam = await this.engine.createExam(mode, config, topics);

      // Create session
      const sessionId = await this.engine.startExam(exam.id, userId);

      // Start timer
      const session = this.sessionManager.getSession(sessionId);
      if (session) {
        this.timedEngine.startTimer(
          sessionId,
          exam.config.duration * 60,
          { enableAutoSubmit: this.config.autoSubmitOnTimeout },
          (state, event) => {
            if (event.type === 'expired') {
              this.handleTimerExpired(sessionId);
            } else if (event.type === 'warning' && this.config.enableTimerWarnings) {
              this.handleTimerWarning(sessionId, event);
            }

            // Update session remaining time
            this.sessionManager.updateRemainingTime(sessionId, state.remainingTime);
          }
        );
      }

      return {
        success: true,
        data: {
          examId: exam.id,
          sessionId,
          readinessReport
        },
        warnings: readinessReport?.examReadiness?.warnings
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to start exam'
      };
    }
  }

  /**
   * Submit exam answers
   */
  async submitExam(
    sessionId: string,
    answers: Map<string, string | string[] | boolean>
  ): Promise<ExamOperationResult<{ resultId: string; score: number; passed: boolean }>> {
    try {
      // Stop timer
      this.timedEngine.stopTimer(sessionId);

      // End session
      const session = await this.sessionManager.endSession(sessionId);

      // Submit and evaluate
      const result = await this.engine.submitExam(sessionId, answers);

      // Generate weakness report if enabled
      if (this.config.enableWeaknessAnalysis) {
        const weaknessReport = examStorage.getWeaknessReports().slice(-1)[0];
        if (weaknessReport) {
          // Store with session reference
          examStorage.saveWeaknessReport(weaknessReport);
        }
      }

      return {
        success: true,
        data: {
          resultId: result.resultId,
          score: result.score,
          passed: result.passed
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to submit exam'
      };
    }
  }

  /**
   * Pause exam
   */
  async pauseExam(sessionId: string): Promise<ExamOperationResult> {
    try {
      this.timedEngine.pauseTimer(sessionId);
      const success = this.sessionManager.pauseSession(sessionId);

      if (!success) {
        return { success: false, error: 'Failed to pause exam' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Resume exam
   */
  async resumeExam(sessionId: string): Promise<ExamOperationResult> {
    try {
      const session = await this.sessionManager.resumeSessionFromPause(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found or cannot be resumed' };
      }

      this.timedEngine.resumeTimer(sessionId);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get exam results
   */
  async getExamResults(resultId: string): Promise<ExamOperationResult<ExamResult>> {
    try {
      const result = examStorage.getResult(resultId);
      if (!result) {
        return { success: false, error: 'Result not found' };
      }

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current session state
   */
  async getSessionState(sessionId: string): Promise<ExamOperationResult<{
    session: ExamSession;
    exam: Exam;
    timerState: any;
    stats: any;
  }>> {
    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const exam = examStorage.getExam(session.examId);
      if (!exam) {
        return { success: false, error: 'Exam not found' };
      }

      const timerState = this.timedEngine.getTimerState(sessionId);
      const stats = this.sessionManager.getSessionStats(sessionId);

      return {
        success: true,
        data: { session, exam, timerState, stats }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update answer
   */
  updateAnswer(
    sessionId: string,
    questionId: string,
    answer: string | string[] | boolean
  ): ExamOperationResult {
    try {
      const result = this.sessionManager.updateAnswer(sessionId, questionId, answer);
      if (!result) {
        return { success: false, error: 'Failed to update answer' };
      }

      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Navigate to question
   */
  navigateToQuestion(sessionId: string, questionId: string): ExamOperationResult {
    try {
      const success = this.sessionManager.navigateToQuestion(sessionId, questionId);
      if (!success) {
        return { success: false, error: 'Failed to navigate to question' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Flag question for review
   */
  toggleFlagQuestion(sessionId: string, questionId: string): ExamOperationResult<boolean> {
    try {
      const flagged = this.sessionManager.toggleFlagQuestion(sessionId, questionId);
      return { success: true, data: flagged };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recommendations
   */
  async getRecommendations(userId: string): Promise<ExamOperationResult<any[]>> {
    try {
      const recommendations = await this.recommendationEngine.getPersonalizedRecommendations(userId);
      return { success: true, data: recommendations };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(userId: string): Promise<ExamOperationResult<any>> {
    try {
      const profile = await this.performanceEvaluator.getPerformanceProfile(userId);
      return { success: true, data: profile };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get weakness report
   */
  async getWeaknessReport(topics: string[]): Promise<ExamOperationResult<WeaknessReport | null>> {
    try {
      const report = await this.weaknessAnalyzer.getWeaknessReport(topics);
      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get readiness assessment
   */
  async getReadinessAssessment(topics: string[], subject?: string): Promise<ExamOperationResult<ReadinessReport>> {
    try {
      const report = await this.readinessAnalyzer.getReadinessReport(topics, subject);
      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate progress report
   */
  async getProgressReport(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' | 'all'
  ): Promise<ExamOperationResult<any>> {
    try {
      const report = await this.reportGenerator.generateProgressReport(userId, timeframe);
      return { success: true, data: report };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update engine configuration
   */
  updateConfig(newConfig: Partial<ExamControllerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.engine.updateConfig({
      enableAutoSave: this.config.enableAutoSave,
      enableTimerWarnings: this.config.enableTimerWarnings,
      enableReadinessCheck: this.config.enableReadinessCheck,
      enableWeaknessAnalysis: this.config.enableWeaknessAnalysis
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ExamControllerConfig {
    return { ...this.config };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.timedEngine.stopAllTimers();
    this.sessionManager.cleanupExpiredSessions();
    this.initialized = false;
  }

  private handleTimerExpired(sessionId: string): void {
    // Auto-submit on timeout
    if (this.config.autoSubmitOnTimeout) {
      const session = this.sessionManager.getSession(sessionId);
      if (session) {
        const answers = this.sessionManager.getAnswersMap(sessionId);
        this.submitExam(sessionId, answers);
      }
    }
  }

  private handleTimerWarning(sessionId: string, event: any): void {
    // Emit warning event for UI notification
    // This would typically trigger a notification in the UI
    console.warn(`Timer warning for session ${sessionId}: ${event.message}`);
  }
}

export default ExamController;
