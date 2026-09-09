// @ts-nocheck
/**
 * examSimulatorStore.ts
 *
 * Central storage for exam simulator data using localStorage persistence.
 */

import type { Exam } from '../models';
import type { ExamQuestion } from '../models/ExamQuestion';
import type { ExamResult } from '../models';
import type { ExamSession } from '../models/ExamSession';
import type { ReadinessReport } from '../models/ReadinessReport';
import type { WeaknessReport } from '../models/WeaknessReport';
import type { PerformanceProfile } from '../models/PerformanceProfile';

const STORAGE_KEYS = {
  EXAMS: 'margeos_exams',
  QUESTIONS: 'margeos_questions',
  RESULTS: 'margeos_results',
  SESSIONS: 'margeos_sessions',
  READINESS_REPORTS: 'margeos_readiness',
  WEAKNESS_REPORTS: 'margeos_weakness',
  PERFORMANCE_PROFILES: 'margeos_profiles',
  PERFORMANCE_REPORTS: 'margeos_perf_reports'
} as const;

class ExamSimulatorStore {
  private static instance: ExamSimulatorStore;

  private constructor() {}

  static getInstance(): ExamSimulatorStore {
    if (!ExamSimulatorStore.instance) {
      ExamSimulatorStore.instance = new ExamSimulatorStore();
    }
    return ExamSimulatorStore.instance;
  }

  // ==================== EXAMS ====================

  saveExam(exam: Exam): void {
    const exams = this.getExams();
    const index = exams.findIndex(e => e.id === exam.id);
    if (index >= 0) {
      exams[index] = exam;
    } else {
      exams.push(exam);
    }
    this.setItem(STORAGE_KEYS.EXAMS, exams);
  }

  getExam(examId: string): Exam | undefined {
    const exams = this.getExams();
    return exams.find(e => e.id === examId);
  }

  getExams(): Exam[] {
    return this.getItem<Exam[]>(STORAGE_KEYS.EXAMS) || [];
  }

  deleteExam(examId: string): void {
    const exams = this.getExams().filter(e => e.id !== examId);
    this.setItem(STORAGE_KEYS.EXAMS, exams);
  }

  // ==================== QUESTIONS ====================

  saveQuestions(questions: ExamQuestion[]): void {
    const allQuestions = this.getAllQuestions();
    questions.forEach(q => {
      const index = allQuestions.findIndex(eq => eq.id === q.id);
      if (index >= 0) {
        allQuestions[index] = q;
      } else {
        allQuestions.push(q);
      }
    });
    this.setItem(STORAGE_KEYS.QUESTIONS, allQuestions);
  }

  getAllQuestions(): ExamQuestion[] {
    return this.getItem<ExamQuestion[]>(STORAGE_KEYS.QUESTIONS) || [];
  }

  // ==================== RESULTS ====================

  saveResult(result: ExamResult): void {
    const results = this.getResults();
    results.unshift(result);
    this.setItem(STORAGE_KEYS.RESULTS, results);
  }

  getResult(resultId: string): ExamResult | undefined {
    return this.getResults().find(r => r.id === resultId);
  }

  getResults(): ExamResult[] {
    return this.getItem<ExamResult[]>(STORAGE_KEYS.RESULTS) || [];
  }

  getResultsByUser(userId: string): ExamResult[] {
    return this.getResults().filter(r => r.userId === userId);
  }

  getAllResults(): ExamResult[] {
    return this.getResults();
  }

  // ==================== SESSIONS ====================

  saveSession(session: ExamSession): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    this.setItem(STORAGE_KEYS.SESSIONS, sessions);
  }

  getSession(sessionId: string): ExamSession | undefined {
    return this.getSessions().find(s => s.id === sessionId);
  }

  getSessions(): ExamSession[] {
    return this.getItem<ExamSession[]>(STORAGE_KEYS.SESSIONS) || [];
  }

  getActiveSessions(): ExamSession[] {
    return this.getSessions().filter(s => s.status === 'in_progress' || s.status === 'paused');
  }

  updateSession(sessionId: string, updates: Partial<ExamSession>): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index >= 0) {
      sessions[index] = { ...sessions[index], ...updates };
      this.setItem(STORAGE_KEYS.SESSIONS, sessions);
    }
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter(s => s.id !== sessionId);
    this.setItem(STORAGE_KEYS.SESSIONS, sessions);
  }

  autoSubmitSession(sessionId: string): void {
    const session = this.getSession(sessionId);
    if (session && session.status === 'in_progress') {
      this.updateSession(sessionId, {
        status: 'completed',
        endedAt: new Date().toISOString()
      });
    }
  }

  // ==================== READINESS REPORTS ====================

  saveReadinessReport(report: ReadinessReport): void {
    const reports = this.getReadinessReports();
    reports.unshift(report);
    this.setItem(STORAGE_KEYS.READINESS_REPORTS, reports);
  }

  getReadinessReports(): ReadinessReport[] {
    return this.getItem<ReadinessReport[]>(STORAGE_KEYS.READINESS_REPORTS) || [];
  }

  getReadinessReportsByUser(userId: string): ReadinessReport[] {
    return this.getReadinessReports().filter(r => r.userId === userId);
  }

  // ==================== WEAKNESS REPORTS ====================

  saveWeaknessReport(report: WeaknessReport): void {
    const reports = this.getWeaknessReports();
    reports.unshift(report);
    this.setItem(STORAGE_KEYS.WEAKNESS_REPORTS, reports);
  }

  getWeaknessReports(): WeaknessReport[] {
    return this.getItem<WeaknessReport[]>(STORAGE_KEYS.WEAKNESS_REPORTS) || [];
  }

  getWeaknessReportsByUser(userId: string): WeaknessReport[] {
    return this.getWeaknessReports().filter(r => r.userId === userId);
  }

  // ==================== PERFORMANCE PROFILES ====================

  savePerformanceProfile(profile: PerformanceProfile): void {
    const profiles = this.getPerformanceProfiles();
    const index = profiles.findIndex(p => p.userId === profile.userId);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    this.setItem(STORAGE_KEYS.PERFORMANCE_PROFILES, profiles);
  }

  getPerformanceProfiles(): PerformanceProfile[] {
    return this.getItem<PerformanceProfile[]>(STORAGE_KEYS.PERFORMANCE_PROFILES) || [];
  }

  getPerformanceProfile(userId: string): PerformanceProfile | undefined {
    return this.getPerformanceProfiles().find(p => p.userId === userId);
  }

  // ==================== PERFORMANCE REPORTS ====================

  savePerformanceReport(report: any): void {
    const reports = this.getPerformanceReports();
    reports.unshift(report);
    this.setItem(STORAGE_KEYS.PERFORMANCE_REPORTS, reports);
  }

  getPerformanceReports(): any[] {
    return this.getItem<any[]>(STORAGE_KEYS.PERFORMANCE_REPORTS) || [];
  }

  getReport(reportId: string): any | undefined {
    return this.getPerformanceReports().find(r => r.id === reportId);
  }

  // ==================== UTILITY ====================

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  exportData(): Record<string, any> {
    return {
      exams: this.getExams(),
      results: this.getResults(),
      sessions: this.getSessions(),
      readinessReports: this.getReadinessReports(),
      weaknessReports: this.getWeaknessReports(),
      performanceProfiles: this.getPerformanceProfiles(),
      exportedAt: new Date().toISOString()
    };
  }

  importData(data: Record<string, any>): void {
    if (data.exams) this.setItem(STORAGE_KEYS.EXAMS, data.exams);
    if (data.results) this.setItem(STORAGE_KEYS.RESULTS, data.results);
    if (data.sessions) this.setItem(STORAGE_KEYS.SESSIONS, data.sessions);
    if (data.readinessReports) this.setItem(STORAGE_KEYS.READINESS_REPORTS, data.readinessReports);
    if (data.weaknessReports) this.setItem(STORAGE_KEYS.WEAKNESS_REPORTS, data.weaknessReports);
    if (data.performanceProfiles) this.setItem(STORAGE_KEYS.PERFORMANCE_PROFILES, data.performanceProfiles);
  }

  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error);
    }
  }
}

export const examStorage = ExamSimulatorStore.getInstance();
export default examStorage;
