// @ts-nocheck
// Adaptive Quiz Engine — QuizSession Model
// Active quiz session and state management

import type { Quiz, QuizAnswer } from "./Quiz";
import type { Question, DifficultyLevel } from "./Question";
import type { UserDifficultyProfile } from "./DifficultyProfile";

export type SessionStatus =
  | "created"
  | "in_progress"
  | "paused"
  | "completed"
  | "submitted"
  | "graded"
  | "expired"
  | "abandoned";

export interface SessionState {
  sessionId: string;
  quizId: string;
  userId: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  currentQuestionId?: string;
  answers: Map<string, SessionAnswer>;
  timeSpent: number;
  timeRemaining?: number;
  pausedAt?: Date;
  totalPausedTime: number;
  startedAt: Date;
  lastActivityAt: Date;
  submittedAt?: Date;
  gradedAt?: Date;
  difficultyProfile?: UserDifficultyProfile;
  metadata: SessionMetadata;
}

export interface SessionAnswer {
  questionId: string;
  answer: QuizAnswer;
  timeSpent: number;
  hintsUsed: number;
  skipped: boolean;
  flagged: boolean;
  changed: boolean;
  previousAnswer?: string;
}

export interface SessionMetadata {
  device: string;
  browser: string;
  platform: string;
  viewport: { width: number; height: number };
  userAgent: string;
  location?: string;
  networkQuality?: "good" | "fair" | "poor";
  sessionSource: "direct" | "link" | "email" | "lms" | "api";
  referringUrl?: string;
  resumeCount: number;
  lastResumeAt?: Date;
}

export interface SessionConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  trackTime: boolean;
  trackHints: boolean;
  trackSkips: boolean;
  trackChanges: boolean;
  enablePause: boolean;
  maxPauseTime?: number;
  enableAutoSubmit: boolean;
  warningBeforeSubmit: boolean;
  warningThreshold?: number;
  showProgressBar: boolean;
  showTimer: boolean;
  showQuestionNavigator: boolean;
}

export interface QuestionNavigation {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  skippedCount: number;
  flaggedCount: number;
  canGoBack: boolean;
  canGoForward: boolean;
  questionStatuses: QuestionStatus[];
}

export interface QuestionStatus {
  questionId: string;
  index: number;
  status: "unanswered" | "answered" | "skipped" | "flagged" | "current";
  difficulty?: DifficultyLevel;
  timeSpent?: number;
}

export interface SessionProgress {
  percentageComplete: number;
  timePercentageUsed: number;
  estimatedTimeRemaining: number;
  answeredPercentage: number;
  correctPercentage?: number;
  difficultyDistribution: Record<DifficultyLevel, number>;
  performanceByDifficulty: Record<DifficultyLevel, { correct: number; total: number }>;
}

export interface SessionAnalytics {
  sessionId: string;
  averageTimePerQuestion: number;
  fastestQuestion: { id: string; time: number };
  slowestQuestion: { id: string; time: number };
  timeDistribution: Array<{ range: string; count: number }>;
  hintUsageRate: number;
  skipRate: number;
  flagRate: number;
  answerChangeRate: number;
  pacingPattern: "accelerating" | "decelerating" | "consistent" | "irregular";
  predictedScore?: number;
  confidenceLevel?: number;
}

export interface SessionFilter {
  status?: SessionStatus[];
  quizId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minTimeSpent?: number;
  maxTimeSpent?: number;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  config: Partial<SessionConfig>;
  isDefault: boolean;
}

export interface PauseInfo {
  pausedAt: Date;
  pausedDuration: number;
  reason?: string;
  checkpoint?: SessionCheckpoint;
}

export interface SessionCheckpoint {
  state: SessionState;
  answers: Map<string, SessionAnswer>;
  questionOrder: string[];
  currentIndex: number;
  timeSpent: number;
  timestamp: Date;
}

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: SessionEventType;
  timestamp: Date;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export type SessionEventType =
  | "started"
  | "question_viewed"
  | "answer_changed"
  | "hint_requested"
  | "hint_viewed"
  | "question_skipped"
  | "question_flagged"
  | "question_unflagged"
  | "navigated_next"
  | "navigated_previous"
  | "navigated_to"
  | "paused"
  | "resumed"
  | "auto_saved"
  | "manually_saved"
  | "submitted"
  | "auto_submitted"
  | "expired"
  | "abandoned"
  | "error";

export interface SessionSummary {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
  totalTime: number;
  totalTimeRemaining?: number;
  questionsAttempted: number;
  questionsAnswered: number;
  questionsSkipped: number;
  questionsFlagged: number;
  completionRate: number;
  lastActivity: Date;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  autoSave: true,
  autoSaveInterval: 30000,
  trackTime: true,
  trackHints: true,
  trackSkips: true,
  trackChanges: true,
  enablePause: true,
  maxPauseTime: 300,
  enableAutoSubmit: true,
  warningBeforeSubmit: true,
  warningThreshold: 60,
  showProgressBar: true,
  showTimer: true,
  showQuestionNavigator: true
};

export const DEFAULT_SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: "standard",
    name: "Standard Session",
    description: "Default session configuration",
    config: DEFAULT_SESSION_CONFIG,
    isDefault: true
  },
  {
    id: "exam",
    name: "Exam Simulation",
    description: "Strict exam conditions",
    config: {
      ...DEFAULT_SESSION_CONFIG,
      enablePause: false,
      warningBeforeSubmit: true,
      warningThreshold: 120,
      autoSave: false,
      trackChanges: false
    },
    isDefault: false
  },
  {
    id: "practice",
    name: "Practice Mode",
    description: "Relaxed practice conditions",
    config: {
      ...DEFAULT_SESSION_CONFIG,
      enablePause: true,
      maxPauseTime: 600,
      enableAutoSubmit: false,
      warningBeforeSubmit: false,
      showTimer: false
    },
    isDefault: false
  }
];

export function createSessionState(params: {
  quizId: string;
  userId: string;
  questions: Question[];
  config?: Partial<SessionConfig>;
  difficultyProfile?: UserDifficultyProfile;
  metadata?: Partial<SessionMetadata>;
}): SessionState {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const defaultMetadata: SessionMetadata = {
    device: "web",
    browser: "unknown",
    platform: "web",
    viewport: { width: 1920, height: 1080 },
    userAgent: "",
    sessionSource: "direct",
    resumeCount: 0
  };

  const questionOrder = params.questions.map(q => q.id);
  const firstQuestionId = questionOrder[0];

  return {
    sessionId,
    quizId: params.quizId,
    userId: params.userId,
    status: "created",
    currentQuestionIndex: 0,
    currentQuestionId: firstQuestionId,
    answers: new Map(),
    timeSpent: 0,
    totalPausedTime: 0,
    startedAt: new Date(),
    lastActivityAt: new Date(),
    difficultyProfile: params.difficultyProfile,
    metadata: {
      ...defaultMetadata,
      ...params.metadata
    }
  };
}

export function createSessionCheckpoint(state: SessionState, questionOrder: string[]): SessionCheckpoint {
  return {
    state: JSON.parse(JSON.stringify(state)),
    answers: new Map(state.answers),
    questionOrder: [...questionOrder],
    currentIndex: state.currentQuestionIndex,
    timeSpent: state.timeSpent,
    timestamp: new Date()
  };
}

export function calculateSessionProgress(state: SessionState, totalQuestions: number): SessionProgress {
  const answeredCount = Array.from(state.answers.values()).filter(a => !a.skipped).length;
  const answeredPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const difficultyCounts: Record<DifficultyLevel, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0
  };

  const difficultyResults: Record<DifficultyLevel, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
    expert: { correct: 0, total: 0 }
  };

  return {
    percentageComplete: answeredPercentage,
    timePercentageUsed: 0,
    estimatedTimeRemaining: 0,
    answeredPercentage,
    difficultyDistribution: difficultyCounts,
    performanceByDifficulty: difficultyResults
  };
}

export function getSessionNavigation(state: SessionState, totalQuestions: number): QuestionNavigation {
  const statuses: QuestionStatus[] = [];
  let answeredCount = 0;
  let skippedCount = 0;
  let flaggedCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const questionId = state.answers.get(String(i))?.questionId;
    let status: QuestionStatus["status"] = "unanswered";

    if (questionId) {
      const answer = state.answers.get(questionId);
      if (answer) {
        if (answer.flagged) {
          status = "flagged";
          flaggedCount++;
        } else if (answer.skipped) {
          status = "skipped";
          skippedCount++;
        } else if (answer.answer.status === "answered") {
          status = "answered";
          answeredCount++;
        }
      }
    }

    if (i === state.currentQuestionIndex) {
      status = "current";
    }

    statuses.push({
      questionId: questionId || "",
      index: i,
      status,
      timeSpent: state.answers.get(questionId || "")?.timeSpent
    });
  }

  return {
    currentIndex: state.currentQuestionIndex,
    totalQuestions,
    answeredCount,
    skippedCount,
    flaggedCount,
    canGoBack: state.currentQuestionIndex > 0,
    canGoForward: state.currentQuestionIndex < totalQuestions - 1,
    questionStatuses: statuses
  };
}

export function validateSessionAction(
  state: SessionState,
  action: "answer" | "skip" | "flag" | "navigate" | "pause" | "submit",
  config: SessionConfig
): { allowed: boolean; reason?: string } {
  if (state.status === "completed" || state.status === "submitted" || state.status === "graded") {
    return { allowed: false, reason: "Session is already completed" };
  }

  if (state.status === "paused" && action !== "resume") {
    return { allowed: false, reason: "Session is paused" };
  }

  switch (action) {
    case "pause":
      if (!config.enablePause) {
        return { allowed: false, reason: "Pause is not enabled for this session" };
      }
      if (config.maxPauseTime && state.totalPausedTime >= config.maxPauseTime) {
        return { allowed: false, reason: "Maximum pause time exceeded" };
      }
      break;

    case "submit":
      if (config.warningBeforeSubmit) {
        // Warning should be shown, but action is still allowed
      }
      break;
  }

  return { allowed: true };
}

export function calculateSessionAnalytics(state: SessionState): SessionAnalytics {
  const answers = Array.from(state.answers.values());

  if (answers.length === 0) {
    return {
      sessionId: state.sessionId,
      averageTimePerQuestion: 0,
      fastestQuestion: { id: "", time: 0 },
      slowestQuestion: { id: "", time: 0 },
      timeDistribution: [],
      hintUsageRate: 0,
      skipRate: 0,
      flagRate: 0,
      answerChangeRate: 0,
      pacingPattern: "consistent"
    };
  }

  const times = answers.map(a => a.timeSpent);
  const averageTime = times.reduce((a, b) => a + b, 0) / times.length;

  const sortedByTime = [...answers].sort((a, b) => a.timeSpent - b.timeSpent);
  const fastest = sortedByTime[0];
  const slowest = sortedByTime[sortedByTime.length - 1];

  const hintsUsed = answers.reduce((sum, a) => sum + a.hintsUsed, 0);
  const skippedCount = answers.filter(a => a.skipped).length;
  const flaggedCount = answers.filter(a => a.flagged).length;
  const changedCount = answers.filter(a => a.changed).length;

  const hintUsageRate = (hintsUsed / answers.length) * 100;
  const skipRate = (skippedCount / answers.length) * 100;
  const flagRate = (flaggedCount / answers.length) * 100;
  const answerChangeRate = (changedCount / answers.length) * 100;

  return {
    sessionId: state.sessionId,
    averageTimePerQuestion: averageTime,
    fastestQuestion: { id: fastest?.questionId || "", time: fastest?.timeSpent || 0 },
    slowestQuestion: { id: slowest?.questionId || "", time: slowest?.timeSpent || 0 },
    timeDistribution: [],
    hintUsageRate,
    skipRate,
    flagRate,
    answerChangeRate,
    pacingPattern: "consistent"
  };
}
