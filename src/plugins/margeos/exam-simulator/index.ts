// @ts-nocheck
/**
 * AI Exam Simulator Engine
 *
 * A comprehensive exam simulation system with AI-powered question generation,
 * readiness analysis, weakness identification, and personalized recommendations.
 *
 * @version 1.0.0
 * @author MargeOS Team
 */

// Core exports
export * from './core';

// Service exports
export * from './services';

// Hook exports
export * from './hooks';

export type {
  ExamEngineConfig,
  ExamEngineStats
} from './core/ExamSimulatorEngine';

export type {
  GeneratedQuestion,
  GenerationContext
} from './core/ExamGenerator';

export type {
  TimerConfig,
  TimerState,
  TimerEvent
} from './core/TimedAssessmentEngine';

export type {
  ReadinessConfig,
  ReadinessInput
} from './core/ReadinessAnalyzer';

export type {
  WeaknessAnalysisConfig
} from './core/WeaknessAnalyzer';

export type {
  PerformanceConfig,
  PerformanceMetrics
} from './core/PerformanceEvaluator';

export type {
  ReportConfig
} from './core/ReportGenerator';

export type {
  RecommendationConfig,
  StudyRecommendation
} from './core/RecommendationEngine';

export type {
  SessionConfig
} from './core/ExamSessionManager';

export type {
  ExamControllerConfig,
  ExamOperationResult
} from './core/ExamController';

// Service exports
export {
  examGenerationService,
  timerService,
  scoringService,
  ScoringService,
  readinessService,
  analyticsService,
  recommendationService
} from './services';

// Hook exports
export {
  useExamSimulator,
  useExamSession,
  useReadiness,
  useWeaknessReport,
  useExamAnalytics
} from './hooks';

// Model exports
export type {
  Exam,
  ExamMode,
  ExamStatus,
  ExamConfig,
  ExamSettings,
  ExamRules,
  ExamAccessibility
} from './models';

export type {
  ExamQuestion,
  ExamQuestionContent,
  ExamOption,
  ExamSolution,
  QuestionType
} from './models/ExamQuestion';

export type {
  ExamResult,
  ExamResultSummary,
  QuestionResult,
  TopicResult,
  DifficultyAnalysis,
  TimeAnalysis
} from './models';

export type {
  ReadinessLevel,
  ReadinessScore,
  FactorScore,
  ReadinessFactorAnalysis,
  CriticalGap,
  ReadinessRecommendation
} from './models/ReadinessReport';

export type {
  WeaknessType,
  Weakness,
  WeaknessEvidence,
  RemediationPlan,
  WeaknessReport,
  CategorizedWeakness,
  QuickWin
} from './models/WeaknessReport';

export type {
  SessionStatus,
  SessionAnswer,
  SessionNavigation,
  SessionCheckpoint,
  SessionEvent
} from './models/ExamSession';

export type {
  PerformanceLevel,
  PerformanceSummary,
  ExamHistoryItem,
  TopicPerformance,
  Achievement,
  PerformancePrediction
} from './models/PerformanceProfile';

export * from './models';

// Store export
export { examStorage } from './store/examSimulatorStore';

// Utils exports
export * from './utils';

// Interface exports
export * from './interfaces';

/**
 * Initialize the Exam Simulator Engine
 */
export async function initializeExamSimulator(config?: {
  enableAutoSave?: boolean;
  enableTimerWarnings?: boolean;
  enableReadinessCheck?: boolean;
  enableWeaknessAnalysis?: boolean;
}): Promise<void> {
  const controller = ExamController.getInstance(config);
  await controller.initialize();
}

/**
 * Get the default configuration
 */
export function getDefaultConfig() {
  return {
    enableAutoSave: true,
    enableTimerWarnings: true,
    autoSubmitOnTimeout: true,
    enableReadinessCheck: true,
    enableWeaknessAnalysis: true
  };
}

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const ENGINE_NAME = 'AI Exam Simulator Engine';
export const ENGINE_DESCRIPTION = 'Comprehensive exam simulation with AI-powered features';
