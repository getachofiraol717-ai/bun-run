// @ts-nocheck
/**
 * ExamSessionManager.ts
 *
 * Manages active exam sessions including creation, state management,
 * answer tracking, navigation, checkpoints, and session analytics.
 */

import type { Exam, ExamSession, SessionAnswer, SessionNavigation, SessionCheckpoint, SessionEvent } from '../models/ExamSession';
import { examStorage } from '../store/examSimulatorStore';

export interface SessionConfig {
  autoSaveInterval: number; // in seconds
  enableCheckpoints: boolean;
  checkpointInterval: number; // in seconds
  maxSessionDuration: number; // in seconds (0 = unlimited)
  enableAnalytics: boolean;
}

const DEFAULT_CONFIG: SessionConfig = {
  autoSaveInterval: 30,
  enableCheckpoints: true,
  checkpointInterval: 300, // 5 minutes
  maxSessionDuration: 0,
  enableAnalytics: true
};

type SessionCallback = (session: ExamSession) => void;
type EventCallback = (event: SessionEvent) => void;

export class ExamSessionManager {
  private static instance: ExamSessionManager;
  private config: SessionConfig;
  private activeSessions: Map<string, ExamSession> = new Map();
  private sessionCallbacks: Map<string, SessionCallback[]> = new Map();
  private eventCallbacks: Map<string, EventCallback[]> = new Map();
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private initialized: boolean = false;

  private constructor(config?: Partial<SessionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<SessionConfig>): ExamSessionManager {
    if (!ExamSessionManager.instance) {
      ExamSessionManager.instance = new ExamSessionManager(config);
    }
    return ExamSessionManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Restore active sessions from storage
    const storedSessions = examStorage.getActiveSessions();
    storedSessions.forEach(session => {
      this.activeSessions.set(session.id, session);
      this.startAutoSave(session.id);
    });

    // Clean up expired sessions
    this.cleanupExpiredSessions();

    this.initialized = true;
  }

  /**
   * Create a new exam session
   */
  async createSession(examId: string, userId: string): Promise<string> {
    const exam = examStorage.getExam(examId);
    if (!exam) {
      throw new Error(`Exam not found: ${examId}`);
    }

    const session: ExamSession = {
      id: this.generateSessionId(),
      examId,
      userId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      endedAt: null,
      remainingTime: exam.config.duration * 60,
      currentQuestionIndex: 0,
      answers: [],
      navigation: {
        visitedQuestions: [exam.questions[0]?.id || ''],
        flaggedQuestions: [],
        bookmarkedQuestions: [],
        questionOrder: exam.questions.map(q => q.id),
        currentPosition: 0
      },
      checkpoints: [],
      events: [],
      analytics: {
        totalTimeSpent: 0,
        timePerQuestion: {},
        pauseCount: 0,
        totalPauseTime: 0,
        hintUsageCount: 0,
        answerChanges: 0,
        backNavigationCount: 0
      },
      metadata: {
        browserInfo: '',
        startedFrom: 'exam_list',
        attemptNumber: 1
      }
    };

    this.activeSessions.set(session.id, session);
    examStorage.saveSession(session);

    // Start auto-save
    this.startAutoSave(session.id);

    // Emit start event
    this.emitEvent(session.id, {
      type: 'started',
      timestamp: session.startedAt,
      data: { examId, questionCount: exam.questions.length }
    });

    return session.id;
  }

  /**
   * Resume an existing session
   */
  async resumeSession(sessionId: string): Promise<ExamSession | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      const stored = examStorage.getSession(sessionId);
      if (stored && stored.status === 'paused') {
        this.activeSessions.set(sessionId, stored);
        this.startAutoSave(sessionId);
        return stored;
      }
      return null;
    }

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ExamSession | null {
    return this.activeSessions.get(sessionId) || examStorage.getSession(sessionId);
  }

  /**
   * Update answer for a question
   */
  updateAnswer(
    sessionId: string,
    questionId: string,
    answer: string | string[] | boolean
  ): SessionAnswer | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const existingIndex = session.answers.findIndex(a => a.questionId === questionId);
    const previousAnswer = existingIndex >= 0 ? session.answers[existingIndex].answer : undefined;

    const sessionAnswer: SessionAnswer = {
      questionId,
      answer,
      answeredAt: new Date().toISOString(),
      timeSpent: this.calculateTimeSpent(session, questionId),
      changed: previousAnswer !== undefined && previousAnswer !== answer
    };

    if (existingIndex >= 0) {
      session.answers[existingIndex] = sessionAnswer;
    } else {
      session.answers.push(sessionAnswer);
    }

    // Track analytics
    if (sessionAnswer.changed) {
      session.analytics.answerChanges++;
    }

    // Update navigation
    if (!session.navigation.visitedQuestions.includes(questionId)) {
      session.navigation.visitedQuestions.push(questionId);
    }

    // Auto-save
    this.saveSession(sessionId);

    return sessionAnswer;
  }

  /**
   * Navigate to a specific question
   */
  navigateToQuestion(sessionId: string, questionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const exam = examStorage.getExam(session.examId);
    if (!exam) return false;

    const questionIndex = exam.questions.findIndex(q => q.id === questionId);
    if (questionIndex < 0) return false;

    // Track back navigation
    if (questionIndex < session.navigation.currentPosition) {
      session.analytics.backNavigationCount++;
    }

    session.currentQuestionIndex = questionIndex;
    session.navigation.currentPosition = questionIndex;

    if (!session.navigation.visitedQuestions.includes(questionId)) {
      session.navigation.visitedQuestions.push(questionId);
    }

    this.saveSession(sessionId);

    this.emitEvent(sessionId, {
      type: 'navigated',
      timestamp: new Date().toISOString(),
      data: { questionId, index: questionIndex }
    });

    return true;
  }

  /**
   * Flag a question for review
   */
  toggleFlagQuestion(sessionId: string, questionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const index = session.navigation.flaggedQuestions.indexOf(questionId);
    if (index >= 0) {
      session.navigation.flaggedQuestions.splice(index, 1);
    } else {
      session.navigation.flaggedQuestions.push(questionId);
    }

    this.saveSession(sessionId);

    return index < 0; // Returns true if flagged, false if unflagged
  }

  /**
   * Bookmark a question
   */
  toggleBookmark(sessionId: string, questionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const index = session.navigation.bookmarkedQuestions.indexOf(questionId);
    if (index >= 0) {
      session.navigation.bookmarkedQuestions.splice(index, 1);
    } else {
      session.navigation.bookmarkedQuestions.push(questionId);
    }

    this.saveSession(sessionId);
    return index < 0;
  }

  /**
   * Pause the session
   */
  pauseSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'in_progress') return false;

    session.status = 'paused';
    session.analytics.pauseCount++;

    this.stopAutoSave(sessionId);
    this.saveSession(sessionId);

    this.emitEvent(sessionId, {
      type: 'paused',
      timestamp: new Date().toISOString(),
      data: { pauseCount: session.analytics.pauseCount }
    });

    return true;
  }

  /**
   * Resume a paused session
   */
  resumeSessionFromPause(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'paused') return false;

    session.status = 'in_progress';
    this.startAutoSave(sessionId);
    this.saveSession(sessionId);

    this.emitEvent(sessionId, {
      type: 'resumed',
      timestamp: new Date().toISOString(),
      data: {}
    });

    return true;
  }

  /**
   * End the session (submit)
   */
  async endSession(sessionId: string): Promise<ExamSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    this.stopAutoSave(sessionId);

    session.status = 'completed';
    session.endedAt = new Date().toISOString();
    session.analytics.totalTimeSpent = this.calculateTotalTimeSpent(session);

    // Create final checkpoint
    if (this.config.enableCheckpoints) {
      const checkpoint = this.createCheckpoint(session);
      session.checkpoints.push(checkpoint);
    }

    examStorage.saveSession(session);
    this.activeSessions.delete(sessionId);

    this.emitEvent(sessionId, {
      type: 'completed',
      timestamp: session.endedAt,
      data: {
        totalTime: session.analytics.totalTimeSpent,
        questionsAnswered: session.answers.length
      }
    });

    return session;
  }

  /**
   * Create a checkpoint
   */
  createCheckpoint(session: ExamSession): SessionCheckpoint {
    return {
      id: `CP-${Date.now()}-${this.generateRandomId()}`,
      sessionId: session.id,
      createdAt: new Date().toISOString(),
      questionIndex: session.currentQuestionIndex,
      answers: [...session.answers],
      remainingTime: session.remainingTime,
      navigationState: { ...session.navigation }
    };
  }

  /**
   * Restore from checkpoint
   */
  restoreFromCheckpoint(sessionId: string, checkpointId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const checkpoint = session.checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) return false;

    session.currentQuestionIndex = checkpoint.questionIndex;
    session.answers = [...checkpoint.answers];
    session.remainingTime = checkpoint.remainingTime;
    session.navigation = { ...checkpoint.navigationState };

    this.saveSession(sessionId);
    return true;
  }

  /**
   * Update remaining time
   */
  updateRemainingTime(sessionId: string, remainingTime: number): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.remainingTime = remainingTime;

    if (remainingTime <= 0) {
      this.endSession(sessionId).catch(console.error);
    }
  }

  /**
   * Record hint usage
   */
  recordHintUsage(sessionId: string, questionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.analytics.hintUsageCount++;

    this.emitEvent(sessionId, {
      type: 'hint_used',
      timestamp: new Date().toISOString(),
      data: { questionId }
    });
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    answered: number;
    unanswered: number;
    flagged: number;
    visited: number;
    total: number;
    progress: number;
    averageTimePerQuestion: number;
  } | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const exam = examStorage.getExam(session.examId);
    if (!exam) return null;

    const total = exam.questions.length;
    const answered = session.answers.length;
    const flagged = session.navigation.flaggedQuestions.length;
    const visited = session.navigation.visitedQuestions.length;

    return {
      answered,
      unanswered: total - answered,
      flagged,
      visited,
      total,
      progress: total > 0 ? (visited / total) * 100 : 0,
      averageTimePerQuestion: visited > 0
        ? session.analytics.totalTimeSpent / visited
        : 0
    };
  }

  /**
   * Get session answers map
   */
  getAnswersMap(sessionId: string): Map<string, string | string[] | boolean> {
    const session = this.getSession(sessionId);
    if (!session) return new Map();

    const map = new Map<string, string | string[] | boolean>();
    session.answers.forEach(a => {
      map.set(a.questionId, a.answer);
    });

    return map;
  }

  /**
   * Register callback for session updates
   */
  onSessionUpdate(sessionId: string, callback: SessionCallback): void {
    const callbacks = this.sessionCallbacks.get(sessionId) || [];
    callbacks.push(callback);
    this.sessionCallbacks.set(sessionId, callbacks);
  }

  /**
   * Register callback for session events
   */
  onSessionEvent(sessionId: string, callback: EventCallback): void {
    const callbacks = this.eventCallbacks.get(sessionId) || [];
    callbacks.push(callback);
    this.eventCallbacks.set(sessionId, callbacks);
  }

  /**
   * Remove all callbacks for a session
   */
  removeCallbacks(sessionId: string): void {
    this.sessionCallbacks.delete(sessionId);
    this.eventCallbacks.delete(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const maxDuration = this.config.maxSessionDuration * 1000;

    this.activeSessions.forEach((session, sessionId) => {
      if (maxDuration > 0) {
        const startTime = new Date(session.startedAt).getTime();
        if (now - startTime > maxDuration) {
          this.endSession(sessionId).catch(console.error);
        }
      }
    });
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ExamSession[] {
    return Array.from(this.activeSessions.values());
  }

  private startAutoSave(sessionId: string): void {
    this.stopAutoSave(sessionId);

    const interval = setInterval(() => {
      this.saveSession(sessionId);
    }, this.config.autoSaveInterval * 1000);

    this.autoSaveTimers.set(sessionId, interval);
  }

  private stopAutoSave(sessionId: string): void {
    const timer = this.autoSaveTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(sessionId);
    }
  }

  private saveSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      examStorage.updateSession(sessionId, session);
    }
  }

  private emitEvent(sessionId: string, event: SessionEvent): void {
    const callbacks = this.eventCallbacks.get(sessionId) || [];
    callbacks.forEach(callback => callback(event));
  }

  private calculateTimeSpent(session: ExamSession, questionId: string): number {
    const answer = session.answers.find(a => a.questionId === questionId);
    return answer?.timeSpent || 30; // Default 30 seconds
  }

  private calculateTotalTimeSpent(session: ExamSession): number {
    return session.answers.reduce((total, a) => total + (a.timeSpent || 0), 0);
  }

  private generateSessionId(): string {
    return `SESSION-${Date.now()}-${this.generateRandomId()}`;
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

export default ExamSessionManager;
