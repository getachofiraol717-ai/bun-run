/**
 * ReadinessAnalyzer.ts
 *
 * Interface definitions for readiness analysis components.
 */

import type { ReadinessLevel } from '../models/ReadinessReport';

export interface IReadinessAnalyzer {
  initialize(): Promise<void>;
  checkReadiness(topics: string[], subject?: string): Promise<ReadinessCheckResult>;
  generateReport(input: ReadinessInput): Promise<ReadinessReport>;
  getReport(topics: string[], subject?: string): Promise<ReadinessReport | null>;
}

export interface ReadinessInput {
  topics: string[];
  subject?: string;
  userId: string;
  studyHistory?: StudyHistory;
  topicMastery?: Record<string, number>;
}

export interface StudyHistory {
  totalHoursStudied: number;
  hoursPerTopic: Record<string, number>;
  practiceQuestionsAttempted: number;
  averageQuizScore: number;
  lastStudySession: string;
}

export interface ReadinessCheckResult {
  ready: boolean;
  level: ReadinessLevel;
  score: number;
  estimatedSuccessRate: number;
  warnings: string[];
  recommendations: string[];
  readinessReportId: string;
}

export interface ReadinessReport {
  id: string;
  userId: string;
  topics: string[];
  subject?: string;
  generatedAt: string;
  overallScore: number;
  level: ReadinessLevel;
  factorScores: FactorScore[];
  criticalGaps: ReadinessGap[];
  highPriorityGaps: ReadinessGap[];
  mediumPriorityGaps: ReadinessGap[];
  recommendations: ReadinessRecommendation[];
  examReadiness: ExamReadiness;
  confidence: number;
  metadata?: ReadinessMetadata;
}

export interface FactorScore {
  factor: string;
  label: string;
  score: number;
  weight: number;
  status: 'good' | 'needs_improvement' | 'poor';
  details: Record<string, any>;
}

export interface ReadinessGap {
  factor: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  impact: string;
}

export interface ReadinessRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  reason: string;
  estimatedTime: string;
}

export interface ExamReadiness {
  ready: boolean;
  confidence: number;
  estimatedSuccessRate: number;
  warnings: string[];
}

export interface ReadinessMetadata {
  studyHours?: number;
  practiceQuestions?: number;
  averageScore?: number;
  topicMastery?: Record<string, number>;
}

export interface IStudyPlanGenerator {
  generateDailyPlan(report: ReadinessReport, hoursPerDay: number): DailyStudyPlan;
  generateWeeklyPlan(report: ReadinessReport, daysUntilExam: number): WeeklyStudyPlan;
  getRecommendedIntensity(level: ReadinessLevel): StudyIntensity;
}

export interface DailyStudyPlan {
  date: string;
  focus: string;
  sessions: StudySession[];
  totalHours: number;
  tips: string[];
}

export interface StudySession {
  time: string;
  duration: string;
  activity: string;
  goal: string;
}

export interface WeeklyStudyPlan {
  week: string;
  goals: string[];
  dailyFocus: DailyFocus[];
  recommendations: string[];
}

export interface DailyFocus {
  day: string;
  focus: string;
  hours: number;
}

export interface StudyIntensity {
  hoursPerDay: number;
  daysBeforeExam: number;
  practiceRatio: number;
}
