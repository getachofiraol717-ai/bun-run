// @ts-nocheck
// Adaptive Quiz Engine — QuizSessionManager
// Manages active quiz sessions with persistence and recovery

import type { Quiz, QuizAnswer } from "../models/Quiz";
import type { SessionState, SessionConfig, SessionCheckpoint, SessionEvent } from "../models/QuizSession";
import type { Question, AnswerContent } from "../models/Question";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";
import { createSessionState, createSessionCheckpoint, DEFAULT_SESSION_CONFIG } from "../models/QuizSession";

export interface SessionManagerConfig {
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  maxConcurrentSessions: number;
  sessionTimeout: number;
  enableRecovery: boolean;
  checkpointRetention: number;
}

export class QuizSessionManager {
  private static instance: QuizSessionManager;
  private config: SessionManagerConfig;
  private sessions: Map<string, SessionState> = new Map();
  private checkpoints: Map<string, SessionCheckpoint[]> = new Map();
  private eventListeners: Map<string, (event: SessionEvent) => void> = new Map();

  private constructor(config?: Partial<SessionManagerConfig>) {
    this.config = {
      autoSaveEnabled: true,
      autoSaveInterval: 30000,
      maxConcurrentSessions: 10,
      sessionTimeout: 3600000,
      enableRecovery: true,
      checkpointRetention: 5,
      ...config
    };

    this.loadSessions();
  }

  static getInstance(config?: Partial<SessionManagerConfig>): QuizSessionManager {
    if (!QuizSessionManager.instance) {
      QuizSessionManager.instance = new QuizSessionManager(config);
    }
    return QuizSessionManager.instance;
  }

  private loadSessions(): void {
    try {
      const stored = localStorage.getItem("quiz_active_sessions");
      if (stored) {
        const sessionsArray = JSON.parse(stored);
        sessionsArray.forEach((s: any) => {
          const state = this.deserializeSession(s);
          this.sessions.set(state.sessionId, state);
        });
      }

      const checkpoints = localStorage.getItem("quiz_checkpoints");
      if (checkpoints) {
        const checkpointData = JSON.parse(checkpoints);
        Object.entries(checkpointData).forEach(([sessionId, checks]) => {
          this.checkpoints.set(
            sessionId,
            (checks as any[]).map((c: any) => ({
              ...c,
              state: this.deserializeSession(c.state),
              timestamp: new Date(c.timestamp)
            }))
          );
        });
      }
    } catch (error) {
      console.warn("Failed to load sessions:", error);
    }
  }

  private saveSessions(): void {
    try {
      const sessionsArray = Array.from(this.sessions.values()).map(s => this.serializeSession(s));
      localStorage.setItem("quiz_active_sessions", JSON.stringify(sessionsArray));

      const checkpointData: Record<string, any[]> = {};
      this.checkpoints.forEach((checks, sessionId) => {
        checkpointData[sessionId] = checks.map(c => ({
          ...c,
          state: this.serializeSession(c.state),
          timestamp: c.timestamp.toISOString()
        }));
      });
      localStorage.setItem("quiz_checkpoints", JSON.stringify(checkpointData));
    } catch (error) {
      console.warn("Failed to save sessions:", error);
    }
  }

  private serializeSession(session: SessionState): any {
    return {
      ...session,
      answers: Object.fromEntries(session.answers)
    };
  }

  private deserializeSession(data: any): SessionState {
    return {
      ...data,
      answers: new Map(Object.entries(data.answers || {}))
    };
  }

  async createSession(params: {
    quiz: Quiz;
    userId: string;
    questions: Question[];
    difficultyProfile?: UserDifficultyProfile;
    config?: Partial<SessionConfig>;
    metadata?: any;
  }): Promise<SessionState> {
    if (this.sessions.size >= this.config.maxConcurrentSessions) {
      throw new Error("Maximum concurrent sessions reached");
    }

    const session = createSessionState({
      quizId: params.quiz.id,
      userId: params.userId,
      questions: params.questions,
      difficultyProfile: params.difficultyProfile,
      config: { ...DEFAULT_SESSION_CONFIG, ...params.config },
      metadata: params.metadata
    });

    this.sessions.set(session.sessionId, session);
    this.checkpoints.set(session.sessionId, []);

    this.saveSessions();
    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: "started",
      timestamp: new Date(),
      data: { quizId: session.quizId }
    });

    return session;
  }

  getSession(sessionId: string): SessionState | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Update last activity
      session.lastActivityAt = new Date();
    }
    return session;
  }

  getSessionsForUser(userId: string): SessionState[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  getActiveSessions(): SessionState[] {
    return Array.from(this.sessions.values()).filter(s => s.status === "in_progress");
  }

  updateAnswer(params: {
    sessionId: string;
    questionId: string;
    answer: QuizAnswer;
    timeSpent: number;
    hintsUsed?: number;
    skipped?: boolean;
    flagged?: boolean;
  }): SessionState | null {
    const session = this.sessions.get(params.sessionId);
    if (!session) return null;

    const sessionAnswer = {
      questionId: params.questionId,
      answer: params.answer,
      timeSpent: params.timeSpent,
      hintsUsed: params.hintsUsed || 0,
      skipped: params.skipped || false,
      flagged: params.flagged || false,
      changed: false
    };

    // Check if answer was changed
    const existing = session.answers.get(params.questionId);
    if (existing) {
      sessionAnswer.changed = true;
      sessionAnswer.previousAnswer = existing.answer as any;
    }

    session.answers.set(params.questionId, sessionAnswer);
    session.lastActivityAt = new Date();

    this.saveSessions();

    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: existing ? "answer_changed" : "question_viewed",
      timestamp: new Date(),
      data: { questionId: params.questionId, changed: sessionAnswer.changed }
    });

    return session;
  }

  navigateToQuestion(sessionId: string, questionIndex: number): SessionState | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const eventType: SessionEvent["type"] =
      questionIndex > session.currentQuestionIndex ? "navigated_next" : "navigated_previous";

    session.currentQuestionIndex = questionIndex;
    session.lastActivityAt = new Date();

    this.saveSessions();

    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: eventType,
      timestamp: new Date(),
      data: { questionIndex }
    });

    return session;
  }

  pauseSession(sessionId: string): SessionState | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "in_progress") return null;

    session.status = "paused";
    session.pausedAt = new Date();
    session.lastActivityAt = new Date();

    this.saveSessions();

    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: "paused",
      timestamp: new Date(),
      data: {}
    });

    return session;
  }

  resumeSession(sessionId: string): SessionState | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "paused") return null;

    if (session.pausedAt) {
      const pausedDuration = Date.now() - session.pausedAt.getTime();
      session.totalPausedTime += pausedDuration;
    }

    session.status = "in_progress";
    session.pausedAt = undefined;
    session.lastActivityAt = new Date();

    this.saveSessions();

    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: "resumed",
      timestamp: new Date(),
      data: { totalPausedTime: session.totalPausedTime }
    });

    return session;
  }

  completeSession(sessionId: string): SessionState | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.status = "completed";
    session.submittedAt = new Date();
    session.lastActivityAt = new Date();

    // Save final checkpoint
    this.saveCheckpoint(sessionId);

    this.saveSessions();

    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: "submitted",
      timestamp: new Date(),
      data: {
        totalTime: session.timeSpent,
        answeredCount: session.answers.size
      }
    });

    return session;
  }

  abandonSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: "abandoned",
      timestamp: new Date(),
      data: { reason: "User abandoned session" }
    });

    this.sessions.delete(sessionId);
    this.checkpoints.delete(sessionId);
    this.saveSessions();
  }

  saveCheckpoint(sessionId: string): SessionCheckpoint | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const checkpoint = createSessionCheckpoint(session, []);
    const sessionCheckpoints = this.checkpoints.get(sessionId) || [];

    sessionCheckpoints.push(checkpoint);

    // Keep only recent checkpoints
    if (sessionCheckpoints.length > this.config.checkpointRetention) {
      sessionCheckpoints.shift();
    }

    this.checkpoints.set(sessionId, sessionCheckpoints);
    this.saveSessions();

    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: "manually_saved",
      timestamp: new Date(),
      data: { checkpointId: checkpoint.timestamp.toISOString() }
    });

    return checkpoint;
  }

  getLatestCheckpoint(sessionId: string): SessionCheckpoint | null {
    const checkpoints = this.checkpoints.get(sessionId);
    return checkpoints && checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
  }

  recoverFromCheckpoint(sessionId: string, checkpointIndex?: number): SessionState | null {
    const checkpoints = this.checkpoints.get(sessionId);
    if (!checkpoints || checkpoints.length === 0) return null;

    const checkpoint = checkpointIndex !== undefined
      ? checkpoints[checkpointIndex]
      : checkpoints[checkpoints.length - 1];

    if (!checkpoint) return null;

    // Restore session from checkpoint
    const restored = this.deserializeSession(checkpoint.state);
    restored.status = "in_progress";
    restored.lastActivityAt = new Date();
    restored.metadata.resumeCount++;

    if (!restored.metadata.lastResumeAt) {
      restored.metadata.lastResumeAt = new Date();
    }

    this.sessions.set(sessionId, restored);

    this.emitEvent(session.sessionId, {
      id: `event_${Date.now()}`,
      sessionId: session.sessionId,
      type: "resumed",
      timestamp: new Date(),
      data: { recoveredFromCheckpoint: true }
    });

    this.saveSessions();
    return restored;
  }

  onEvent(sessionId: string, listener: (event: SessionEvent) => void): void {
    this.eventListeners.set(sessionId, listener);
  }

  removeEventListener(sessionId: string): void {
    this.eventListeners.delete(sessionId);
  }

  private emitEvent(sessionId: string, event: SessionEvent): void {
    const listener = this.eventListeners.get(sessionId);
    if (listener) {
      listener(event);
    }
  }

  cleanup(timeout?: number): void {
    const timeoutMs = timeout || this.config.sessionTimeout;
    const now = Date.now();

    this.sessions.forEach((session, sessionId) => {
      if (now - session.lastActivityAt.getTime() > timeoutMs) {
        if (session.status === "in_progress" || session.status === "paused") {
          // Mark as expired
          session.status = "expired";
          this.emitEvent(sessionId, {
            id: `event_${Date.now()}`,
            sessionId,
            type: "expired",
            timestamp: new Date(),
            data: { reason: "Session timeout" }
          });
        }
        this.sessions.delete(sessionId);
        this.checkpoints.delete(sessionId);
      }
    });

    this.saveSessions();
  }

  getSessionAnalytics(sessionId: string): {
    totalTime: number;
    averageTimePerQuestion: number;
    answeredCount: number;
    skippedCount: number;
    flaggedCount: number;
    hintUsageRate: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    let totalTime = 0;
    let answeredCount = 0;
    let skippedCount = 0;
    let flaggedCount = 0;
    let hintUsageTotal = 0;

    session.answers.forEach(answer => {
      totalTime += answer.timeSpent;
      if (!answer.skipped) answeredCount++;
      if (answer.skipped) skippedCount++;
      if (answer.flagged) flaggedCount++;
      hintUsageTotal += answer.hintsUsed;
    });

    return {
      totalTime,
      averageTimePerQuestion: answeredCount > 0 ? totalTime / answeredCount : 0,
      answeredCount,
      skippedCount,
      flaggedCount,
      hintUsageRate: (hintUsageTotal / (answeredCount + skippedCount)) * 100
    };
  }

  destroy(): void {
    this.sessions.clear();
    this.checkpoints.clear();
    this.eventListeners.clear();
    localStorage.removeItem("quiz_active_sessions");
    localStorage.removeItem("quiz_checkpoints");
    QuizSessionManager.instance = null as any;
  }
}

export default QuizSessionManager;
