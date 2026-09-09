// Adaptive Quiz Engine — QuizEngine Interface
// Public API types for the Quiz Engine

import type { Quiz, QuizType, QuizConfig } from "../models/Quiz";
import type { Question, QuestionType, DifficultyLevel } from "../models/Question";
import type { SessionState } from "../models/QuizSession";
import type { QuizResult } from "../models/QuizResult";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";

export interface IQuizEngine {
  // Quiz Creation
  createQuiz(params: CreateQuizParams): Promise<Quiz>;
  createAdaptiveQuiz(params: CreateAdaptiveQuizParams): Promise<Quiz>;
  createPracticeQuiz(params: CreatePracticeQuizParams): Promise<Quiz>;

  // Session Management
  startSession(params: StartSessionParams): Promise<SessionState>;
  submitAnswer(params: SubmitAnswerParams): Promise<AnswerEvaluationResult>;
  completeSession(sessionId: string): Promise<QuizResult>;
  abandonSession(sessionId: string): Promise<void>;

  // Session Navigation
  pauseSession(sessionId: string): Promise<SessionState>;
  resumeSession(sessionId: string): Promise<SessionState>;
  navigateToQuestion(sessionId: string, questionIndex: number): Promise<SessionState>;
  saveCheckpoint(sessionId: string): Promise<SessionCheckpoint>;

  // Session Retrieval
  getActiveSession(sessionId: string): SessionState | null;
  getActiveSessionsForUser(userId: string): SessionState[];
  recoverFromCheckpoint(sessionId: string): Promise<SessionState | null>;

  // Quiz Retrieval
  getQuizById(quizId: string): Promise<Quiz | null>;
  getQuizHistory(userId: string, limit?: number): Promise<QuizResult[]>;

  // Difficulty Management
  getDifficultyProfile(userId: string): UserDifficultyProfile | null;
  setPreferredDifficulty(userId: string, difficulty: DifficultyLevel): void;
  resetDifficulty(userId: string): void;

  // Results
  getResultById(resultId: string): Promise<QuizResult | null>;
  getDetailedResults(resultId: string): Promise<DetailedResults>;
}

export interface CreateQuizParams {
  title: string;
  type: QuizType;
  subject: string;
  topics: string[];
  difficulty?: DifficultyLevel | DifficultyLevel[];
  questionCount?: number;
  questionTypes?: QuestionType[];
  settings?: Partial<Quiz["config"]["settings"]>;
  rules?: Partial<Quiz["config"]["rules"]>;
}

export interface CreateAdaptiveQuizParams {
  title: string;
  subject: string;
  topics: string[];
  targetDifficulty?: DifficultyLevel;
  questionCount?: number;
}

export interface CreatePracticeQuizParams {
  subject: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  questionCount?: number;
}

export interface StartSessionParams {
  quizId: string;
  userId: string;
  difficultyProfile?: UserDifficultyProfile;
  config?: Partial<SessionConfig>;
}

export interface SessionConfig {
  autoSave: boolean;
  autoSaveInterval: number;
  trackTime: boolean;
  trackHints: boolean;
  enablePause: boolean;
  maxPauseTime?: number;
  showProgressBar: boolean;
  showTimer: boolean;
}

export interface SubmitAnswerParams {
  sessionId: string;
  questionId: string;
  answer: any;
  timeSpent: number;
  hintsUsed?: number;
}

export interface AnswerEvaluationResult {
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  score: number;
  maxScore: number;
  feedback?: AnswerFeedback;
}

export interface AnswerFeedback {
  summary: string;
  correctAnswer: string;
  explanation?: string;
  stepByStepSolution?: string[];
  hints?: string[];
  commonMistakes?: string[];
}

export interface SessionCheckpoint {
  id: string;
  sessionId: string;
  state: SessionState;
  timestamp: Date;
}

export interface DetailedResults {
  summary: {
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
    passed: boolean;
    timeSpent: number;
  };
  topicBreakdown: TopicResult[];
  questionResults: QuestionResultItem[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  improvement?: {
    comparedToPrevious: boolean;
    percentageChange: number;
    trend: "improving" | "stable" | "declining";
  };
}

export interface TopicResult {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
  averageTime: number;
}

export interface QuestionResultItem {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number;
  difficulty: DifficultyLevel;
}

// Event types
export type QuizEngineEventType =
  | "quiz_started"
  | "question_answered"
  | "quiz_completed"
  | "quiz_abandoned"
  | "difficulty_changed"
  | "checkpoint_saved"
  | "session_recovered"
  | "error";

export interface QuizEngineEvent {
  type: QuizEngineEventType;
  sessionId?: string;
  userId?: string;
  data?: any;
  timestamp: Date;
}

export type QuizEngineEventHandler = (event: QuizEngineEvent) => void;

export interface QuizEngineConfig {
  adaptiveEnabled: boolean;
  questionBankEnabled: boolean;
  analyticsEnabled: boolean;
  persistenceEnabled: boolean;
  maxConcurrentSessions: number;
  sessionTimeout: number;
}
