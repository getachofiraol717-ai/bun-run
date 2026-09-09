/**
 * ExamEngine.ts
 *
 * Interface definitions for exam engine components.
 */

import type { Exam, ExamMode, ExamConfig } from '../models';
import type { ExamQuestion } from '../models/ExamQuestion';
import type { ExamSession, SessionAnswer } from '../models/ExamSession';
import type { ExamResult } from '../models';

export interface IExamEngine {
  initialize(): Promise<void>;
  createExam(mode: ExamMode, config: Partial<ExamConfig>, topics?: string[]): Promise<Exam>;
  startExam(examId: string, userId: string): Promise<string>;
  submitExam(sessionId: string, answers: Map<string, any>): Promise<{ resultId: string; score: number; passed: boolean }>;
  getReadinessAssessment(topics: string[], subject?: string): Promise<any>;
  getWeaknessAnalysis(topics: string[]): Promise<any>;
  getPerformanceAnalytics(userId: string): Promise<any>;
  getStudyRecommendations(userId: string, limit?: number): Promise<any[]>;
  dispose(): void;
}

export interface IExamGenerator {
  initialize(): Promise<void>;
  generateExam(config: ExamConfig): Promise<Exam>;
  generateQuestions(config: ExamConfig): Promise<ExamQuestion[]>;
  addToQuestionBank(questions: ExamQuestion[]): void;
  getQuestionBankStats(): { topic: string; count: number }[];
}

export interface IExamSessionManager {
  initialize(): Promise<void>;
  createSession(examId: string, userId: string): Promise<string>;
  getSession(sessionId: string): ExamSession | null;
  updateAnswer(sessionId: string, questionId: string, answer: any): SessionAnswer | null;
  navigateToQuestion(sessionId: string, questionId: string): boolean;
  toggleFlagQuestion(sessionId: string, questionId: string): boolean;
  pauseSession(sessionId: string): boolean;
  resumeSession(sessionId: string): boolean;
  endSession(sessionId: string): Promise<ExamSession>;
  getActiveSessions(): ExamSession[];
  cleanupExpiredSessions(): void;
}

export interface ITimerEngine {
  initialize(): Promise<void>;
  startTimer(sessionId: string, duration: number, config?: any, callback?: Function): any;
  pauseTimer(sessionId: string): any;
  resumeTimer(sessionId: string): any;
  stopTimer(sessionId: string): void;
  addTime(sessionId: string, seconds: number): any;
  getTimerState(sessionId: string): any;
  stopAllTimers(): void;
}

export interface IReadinessAnalyzer {
  initialize(): Promise<void>;
  checkReadiness(topics: string[], subject?: string): Promise<{
    ready: boolean;
    level: string;
    score: number;
  }>;
  generateReadinessReport(input: any): Promise<any>;
  getReadinessReport(topics: string[], subject?: string): Promise<any>;
}

export interface IWeaknessAnalyzer {
  initialize(): Promise<void>;
  analyzeWeaknesses(exam: Exam, answers: Map<string, any>, result: ExamResult): Promise<any>;
  getWeaknessReport(topics: string[]): Promise<any>;
}

export interface IPerformanceEvaluator {
  initialize(): Promise<void>;
  evaluateExam(exam: Exam, answers: Map<string, any>, session: ExamSession): Promise<ExamResult>;
  getPerformanceProfile(userId: string): Promise<any>;
}

export interface IReportGenerator {
  initialize(): Promise<void>;
  generatePerformanceReport(result: ExamResult, exam: Exam): Promise<any>;
  generateWeaknessReport(result: ExamResult, weaknessReport: any): Promise<any>;
  generateReadinessReport(report: any): Promise<any>;
  generateProgressReport(userId: string, timeframe: string): Promise<any>;
}

export interface IRecommendationEngine {
  initialize(): Promise<void>;
  getPersonalizedRecommendations(userId: string, limit?: number): Promise<any[]>;
  getRecommendations(result: ExamResult, topics: string[]): Promise<any[]>;
  generateDailyStudyPlan(userId: string): Promise<any>;
  generateWeeklyStudyPlan(userId: string): Promise<any>;
}

export interface IExamController {
  initialize(): Promise<void>;
  startExam(mode: ExamMode, config: Partial<ExamConfig>, userId: string, topics?: string[]): Promise<any>;
  submitExam(sessionId: string, answers: Map<string, any>): Promise<any>;
  pauseExam(sessionId: string): Promise<any>;
  resumeExam(sessionId: string): Promise<any>;
  getSessionState(sessionId: string): Promise<any>;
  updateAnswer(sessionId: string, questionId: string, answer: any): any;
  dispose(): void;
}
