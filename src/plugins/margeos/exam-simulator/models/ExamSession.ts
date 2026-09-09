// AI Exam Simulator — ExamSession Model
// Active exam session management

import type { Exam } from "./Exam";
import type { ExamAnswer } from "./ExamQuestion";

export type SessionStatus = "created" | "in_progress" | "paused" | "submitted" | "graded" | "expired" | "abandoned";

export interface ExamSession {
  id: string;
  examId: string;
  userId: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  currentQuestionId?: string;
  answers: Map<string, SessionAnswer>;
  timeSpent: number;
  timeRemaining?: number;
  startedAt: Date;
  lastActivityAt: Date;
  pausedAt?: Date;
  totalPausedTime: number;
  submittedAt?: Date;
  gradedAt?: Date;
  metadata: SessionMetadata;
  navigation: SessionNavigation;
  analytics: SessionAnalytics;
}

export interface SessionAnswer {
  questionId: string;
  answer: ExamAnswer;
  answeredAt: Date;
  timeSpent: number;
  hintsUsed: number;
  skipped: boolean;
  flagged: boolean;
  bookmarked: boolean;
  changed: boolean;
  previousAnswer?: ExamAnswer;
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

export interface SessionNavigation {
  questionOrder: string[];
  answeredQuestions: string[];
  skippedQuestions: string[];
  flaggedQuestions: string[];
  bookmarkedQuestions: string[];
  currentIndex: number;
  totalQuestions: number;
}

export interface SessionAnalytics {
  answeredCount: number;
  skippedCount: number;
  flaggedCount: number;
  bookmarkedCount: number;
  hintsUsedTotal: number;
  averageTimePerQuestion: number;
  fastestQuestion: { id: string; time: number };
  slowestQuestion: { id: string; time: number };
  pacingAssessment: "accelerating" | "decelerating" | "consistent" | "irregular";
}

export interface SessionConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  trackTime: boolean;
  trackHints: boolean;
  trackSkips: boolean;
  trackBookmarks: boolean;
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

export interface SessionCheckpoint {
  id: string;
  sessionId: string;
  timestamp: Date;
  state: ExamSessionState;
  answers: Map<string, SessionAnswer>;
  questionOrder: string[];
  currentIndex: number;
  timeSpent: number;
  timeRemaining?: number;
}

export interface ExamSessionState {
  sessionId: string;
  examId: string;
  userId: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  timeSpent: number;
  timeRemaining?: number;
  pausedAt?: Date;
  totalPausedTime: number;
  lastActivityAt: Date;
}

export interface SessionFilter {
  status?: SessionStatus[];
  examId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SessionSummary {
  sessionId: string;
  examId: string;
  examTitle: string;
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

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: SessionEventType;
  timestamp: Date;
  data: Record<string, any>;
}

export type SessionEventType =
  | "started"
  | "question_viewed"
  | "answer_changed"
  | "hint_requested"
  | "hint_viewed"
  | "question_skipped"
  | "question_unskipped"
  | "question_flagged"
  | "question_unflagged"
  | "question_bookmarked"
  | "question_unbookmarked"
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

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  autoSave: true,
  autoSaveInterval: 30000,
  trackTime: true,
  trackHints: true,
  trackSkips: true,
  trackBookmarks: true,
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

export function createExamSession(params: {
  examId: string;
  userId: string;
  exam: Exam;
  config?: Partial<SessionConfig>;
  metadata?: Partial<SessionMetadata>;
}): ExamSession {
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

  const questionOrder = params.exam.questionOrder || params.exam.questionIds;
  const firstQuestionId = questionOrder[0];

  return {
    id: sessionId,
    examId: params.examId,
    userId: params.userId,
    status: "created",
    currentQuestionIndex: 0,
    currentQuestionId: firstQuestionId,
    answers: new Map(),
    timeSpent: 0,
    totalPausedTime: 0,
    startedAt: new Date(),
    lastActivityAt: new Date(),
    metadata: { ...defaultMetadata, ...params.metadata },
    navigation: {
      questionOrder,
      answeredQuestions: [],
      skippedQuestions: [],
      flaggedQuestions: [],
      bookmarkedQuestions: [],
      currentIndex: 0,
      totalQuestions: questionOrder.length
    },
    analytics: {
      answeredCount: 0,
      skippedCount: 0,
      flaggedCount: 0,
      bookmarkedCount: 0,
      hintsUsedTotal: 0,
      averageTimePerQuestion: 0,
      fastestQuestion: { id: "", time: 0 },
      slowestQuestion: { id: "", time: 0 },
      pacingAssessment: "consistent"
    }
  };
}

export function createSessionCheckpoint(session: ExamSession): SessionCheckpoint {
  return {
    id: `checkpoint_${Date.now()}`,
    sessionId: session.id,
    timestamp: new Date(),
    state: {
      sessionId: session.id,
      examId: session.examId,
      userId: session.userId,
      status: session.status,
      currentQuestionIndex: session.currentQuestionIndex,
      timeSpent: session.timeSpent,
      timeRemaining: session.timeRemaining,
      pausedAt: session.pausedAt,
      totalPausedTime: session.totalPausedTime,
      lastActivityAt: session.lastActivityAt
    },
    answers: new Map(session.answers),
    questionOrder: session.navigation.questionOrder,
    currentIndex: session.currentQuestionIndex,
    timeSpent: session.timeSpent,
    timeRemaining: session.timeRemaining
  };
}

export function updateSessionNavigation(session: ExamSession): void {
  const answered: string[] = [];
  const skipped: string[] = [];
  const flagged: string[] = [];
  const bookmarked: string[] = [];

  session.answers.forEach((answer, questionId) => {
    if (answer.skipped) {
      skipped.push(questionId);
    } else {
      answered.push(questionId);
    }

    if (answer.flagged) flagged.push(questionId);
    if (answer.bookmarked) bookmarked.push(questionId);
  });

  session.navigation.answeredQuestions = answered;
  session.navigation.skippedQuestions = skipped;
  session.navigation.flaggedQuestions = flagged;
  session.navigation.bookmarkedQuestions = bookmarked;

  // Update analytics
  session.analytics.answeredCount = answered.length;
  session.analytics.skippedCount = skipped.length;
  session.analytics.flaggedCount = flagged.length;
  session.analytics.bookmarkedCount = bookmarked.length;

  if (answered.length > 0) {
    const totalTime = Array.from(session.answers.values())
      .filter(a => !a.skipped)
      .reduce((sum, a) => sum + a.timeSpent, 0);
    session.analytics.averageTimePerQuestion = totalTime / answered.length;
  }
}

export function validateSessionAction(
  session: ExamSession,
  action: "answer" | "skip" | "flag" | "bookmark" | "navigate" | "pause" | "submit",
  config: SessionConfig
): { allowed: boolean; reason?: string } {
  if (session.status === "submitted" || session.status === "graded") {
    return { allowed: false, reason: "Session is already submitted" };
  }

  if (session.status === "abandoned" || session.status === "expired") {
    return { allowed: false, reason: "Session is no longer active" };
  }

  switch (action) {
    case "pause":
      if (!config.enablePause) {
        return { allowed: false, reason: "Pause is not enabled" };
      }
      if (config.maxPauseTime && session.totalPausedTime >= config.maxPauseTime) {
        return { allowed: false, reason: "Maximum pause time exceeded" };
      }
      break;

    case "submit":
      if (config.warningBeforeSubmit) {
        // Warning should be shown, but action is allowed
      }
      break;
  }

  return { allowed: true };
}

export function calculateSessionProgress(session: ExamSession): {
  percentageComplete: number;
  timePercentageUsed: number;
  answeredPercentage: number;
} {
  const totalQuestions = session.navigation.totalQuestions;
  const answeredCount = session.answers.size;
  const answeredPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return {
    percentageComplete: answeredPercentage,
    timePercentageUsed: 0,
    answeredPercentage
  };
}
