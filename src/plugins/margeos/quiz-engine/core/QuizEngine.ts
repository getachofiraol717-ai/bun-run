// @ts-nocheck
// Adaptive Quiz Engine — QuizEngine
// Main orchestrator for quiz operations

import type { Quiz, QuizType, QuizConfig, QuizFilter, QuizAnswer, QuizResult } from "../models/Quiz";
import type { Question, QuestionFilter, QuestionType, DifficultyLevel } from "../models/Question";
import type { Answer, AnswerContent, AnswerEvaluation } from "../models/Answer";
import type { SessionState, SessionConfig } from "../models/QuizSession";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";
import { createQuiz, DEFAULT_QUIZ_SETTINGS, DEFAULT_QUIZ_RULES } from "../models/Quiz";
import { createAnswer } from "../models/Answer";
import { createSessionState } from "../models/QuizSession";

import { QuestionGenerator } from "./QuestionGenerator";
import { AdaptiveDifficultyEngine } from "./AdaptiveDifficultyEngine";
import { AnswerEvaluationEngine } from "./AnswerEvaluationEngine";
import { AssessmentEngine } from "./AssessmentEngine";
import { QuizSessionManager } from "./QuizSessionManager";
import { QuizController } from "./QuizController";

export interface QuizEngineConfig {
  adaptiveEnabled: boolean;
  questionBankEnabled: boolean;
  analyticsEnabled: boolean;
  persistenceEnabled: boolean;
  maxConcurrentSessions: number;
  sessionTimeout: number;
}

export interface QuizEngineEvents {
  onQuizStarted?: (session: SessionState) => void;
  onQuestionAnswered?: (sessionId: string, questionId: string, answer: Answer) => void;
  onQuizCompleted?: (sessionId: string, result: QuizResult) => void;
  onDifficultyChanged?: (userId: string, oldLevel: DifficultyLevel, newLevel: DifficultyLevel) => void;
  onError?: (error: Error, context: any) => void;
}

export class QuizEngine {
  private static instance: QuizEngine;
  private config: QuizEngineConfig;
  private questionGenerator: QuestionGenerator;
  private difficultyEngine: AdaptiveDifficultyEngine;
  private evaluationEngine: AnswerEvaluationEngine;
  private assessmentEngine: AssessmentEngine;
  private sessionManager: QuizSessionManager;
  private controller: QuizController;
  private events: QuizEngineEvents;
  private activeSessions: Map<string, SessionState> = new Map();

  private constructor(config: Partial<QuizEngineConfig> = {}) {
    this.config = {
      adaptiveEnabled: true,
      questionBankEnabled: true,
      analyticsEnabled: true,
      persistenceEnabled: true,
      maxConcurrentSessions: 10,
      sessionTimeout: 3600000,
      ...config
    };

    this.questionGenerator = QuestionGenerator.getInstance();
    this.difficultyEngine = AdaptiveDifficultyEngine.getInstance();
    this.evaluationEngine = AnswerEvaluationEngine.getInstance();
    this.assessmentEngine = AssessmentEngine.getInstance();
    this.sessionManager = QuizSessionManager.getInstance();
    this.controller = QuizController.getInstance();
    this.events = {};

    this.loadPersistedSessions();
  }

  static getInstance(config?: Partial<QuizEngineConfig>): QuizEngine {
    if (!QuizEngine.instance) {
      QuizEngine.instance = new QuizEngine(config);
    }
    return QuizEngine.instance;
  }

  private loadPersistedSessions(): void {
    try {
      const persisted = localStorage.getItem("quiz_active_sessions");
      if (persisted) {
        const sessions = JSON.parse(persisted) as SessionState[];
        sessions.forEach(session => {
          session.answers = new Map(Object.entries(session.answers || {}));
          this.activeSessions.set(session.sessionId, session);
        });
      }
    } catch (error) {
      console.warn("Failed to load persisted sessions:", error);
    }
  }

  private persistSessions(): void {
    if (!this.config.persistenceEnabled) return;
    try {
      const sessionsArray = Array.from(this.activeSessions.values()).map(s => ({
        ...s,
        answers: Object.fromEntries(s.answers)
      }));
      localStorage.setItem("quiz_active_sessions", JSON.stringify(sessionsArray));
    } catch (error) {
      console.warn("Failed to persist sessions:", error);
    }
  }

  setEvents(events: QuizEngineEvents): void {
    this.events = events;
  }

  async createQuiz(params: {
    title: string;
    type: QuizType;
    subject: string;
    topics: string[];
    difficulty: DifficultyLevel | DifficultyLevel[];
    questionCount: number;
    questionTypes?: QuestionType[];
    settings?: Partial<Quiz["config"]["settings"]>;
    rules?: Partial<Quiz["config"]["rules"]>;
  }): Promise<Quiz> {
    const config: QuizConfig = {
      title: params.title,
      type: params.type,
      subject: params.subject,
      topics: params.topics,
      settings: { ...DEFAULT_QUIZ_SETTINGS, ...params.settings },
      rules: { ...DEFAULT_QUIZ_RULES, ...params.rules },
      accessibility: {
        screenReaderSupport: true,
        voiceQuiz: false,
        keyboardNavigation: true,
        highContrastMode: false,
        largeText: false,
        brailleCompatible: false,
        reducedDistractions: false
      },
      integration: {}
    };

    const quiz = createQuiz({
      config,
      metadata: {
        creator: "system",
        isAdaptive: this.config.adaptiveEnabled
      }
    });

    const questionFilter: QuestionFilter = {
      subjects: [params.subject],
      topics: params.topics,
      difficulty: Array.isArray(params.difficulty) ? params.difficulty : [params.difficulty],
      types: params.questionTypes
    };

    const questions = await this.questionGenerator.generateQuestions({
      source: "ai_generated",
      subject: params.subject,
      topic: params.topics.join(", "),
      difficulty: Array.isArray(params.difficulty) ? params.difficulty[0] : params.difficulty,
      count: params.questionCount,
      types: params.questionTypes,
      excludeIds: quiz.questionIds
    });

    quiz.questionIds = questions.map(q => q.id);
    quiz.questionOrder = [...quiz.questionIds];
    quiz.questionCount = questions.length;
    quiz.filter = questionFilter;

    if (Array.isArray(params.difficulty) && params.difficulty.length === 2) {
      quiz.difficultyRange = {
        min: params.difficulty[0],
        max: params.difficulty[1]
      };
    } else if (!Array.isArray(params.difficulty)) {
      quiz.difficultyRange = {
        min: params.difficulty,
        max: params.difficulty
      };
    }

    return quiz;
  }

  async startSession(params: {
    quiz: Quiz;
    userId: string;
    difficultyProfile?: UserDifficultyProfile;
    config?: Partial<SessionConfig>;
  }): Promise<SessionState> {
    if (this.activeSessions.size >= this.config.maxConcurrentSessions) {
      throw new Error("Maximum concurrent sessions reached");
    }

    const questions = await this.getQuestionsForSession(params.quiz);

    const session = createSessionState({
      quizId: params.quiz.id,
      userId: params.userId,
      questions,
      difficultyProfile: params.difficultyProfile,
      config: params.config
    });

    if (params.difficultyProfile) {
      session.difficultyProfile = params.difficultyProfile;
    }

    this.activeSessions.set(session.sessionId, session);
    this.persistSessions();

    this.events.onQuizStarted?.(session);
    return session;
  }

  private async getQuestionsForSession(quiz: Quiz): Promise<Question[]> {
    // Get questions from question bank based on quiz filter
    return this.questionGenerator.getQuestionsByFilter(quiz.filter || {}, quiz.questionCount);
  }

  async submitAnswer(params: {
    sessionId: string;
    questionId: string;
    answer: AnswerContent;
    timeSpent: number;
  }): Promise<AnswerEvaluation> {
    const session = this.activeSessions.get(params.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const question = await this.questionGenerator.getQuestionById(params.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const answer = createAnswer({
      questionId: params.questionId,
      sessionId: params.sessionId,
      userId: session.userId,
      content: params.answer,
      timeSpent: params.timeSpent
    });

    const evaluation = await this.evaluationEngine.evaluate({
      question,
      userAnswer: params.answer
    });

    const sessionAnswer: any = {
      questionId: params.questionId,
      answer,
      timeSpent: params.timeSpent,
      hintsUsed: 0,
      skipped: false,
      flagged: false,
      changed: false
    };

    session.answers.set(params.questionId, sessionAnswer);
    session.lastActivityAt = new Date();

    this.persistSessions();

    this.events.onQuestionAnswered?.(params.sessionId, params.questionId, answer);

    if (this.config.adaptiveEnabled && session.difficultyProfile) {
      const newProfile = await this.difficultyEngine.adjustDifficulty(
        session.difficultyProfile,
        {
          isCorrect: evaluation.isCorrect,
          timeSpent: params.timeSpent,
          expectedTime: question.metadata.estimatedTime,
          questionDifficulty: question.metadata.difficulty || "medium"
        }
      );

      if (newProfile.currentLevel !== session.difficultyProfile.currentLevel) {
        session.difficultyProfile = newProfile;
        this.events.onDifficultyChanged?.(
          session.userId,
          session.difficultyProfile.currentLevel,
          newProfile.currentLevel
        );
      }
    }

    return evaluation;
  }

  async completeSession(sessionId: string): Promise<QuizResult> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.status = "completed";
    session.submittedAt = new Date();

    const result = await this.assessmentEngine.generateResult({
      session,
      quiz: await this.controller.getQuizById(session.quizId)
    });

    this.activeSessions.delete(sessionId);
    this.persistSessions();

    this.events.onQuizCompleted?.(sessionId, result);
    return result;
  }

  getActiveSession(sessionId: string): SessionState | undefined {
    return this.activeSessions.get(sessionId);
  }

  getActiveSessionsForUser(userId: string): SessionState[] {
    return Array.from(this.activeSessions.values()).filter(s => s.userId === userId);
  }

  getController(): QuizController {
    return this.controller;
  }

  getDifficultyEngine(): AdaptiveDifficultyEngine {
    return this.difficultyEngine;
  }

  getEvaluationEngine(): AnswerEvaluationEngine {
    return this.evaluationEngine;
  }

  getAssessmentEngine(): AssessmentEngine {
    return this.assessmentEngine;
  }

  getQuestionGenerator(): QuestionGenerator {
    return this.questionGenerator;
  }

  cleanup(): void {
    const now = Date.now();
    const timeout = this.config.sessionTimeout;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivityAt.getTime() > timeout) {
        this.activeSessions.delete(sessionId);
      }
    }

    this.persistSessions();
  }

  destroy(): void {
    this.activeSessions.clear();
    localStorage.removeItem("quiz_active_sessions");
    QuizEngine.instance = null as any;
  }
}

export default QuizEngine;
