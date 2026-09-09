// @ts-nocheck
// Adaptive Quiz Engine — QuizController
// Main controller for quiz operations with integrated functionality

import type { Quiz, QuizFilter, QuizAnswer, QuizType } from "../models/Quiz";
import type { Question, QuestionFilter, DifficultyLevel, QuestionType } from "../models/Question";
import type { QuizResult } from "../models/QuizResult";
import type { SessionState } from "../models/QuizSession";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";

import { QuizEngine, QuizEngineConfig } from "./QuizEngine";
import { AssessmentEngine } from "./AssessmentEngine";
import { KnowledgeGapAnalyzer } from "./KnowledgeGapAnalyzer";
import { QuizRecommendationEngine } from "./QuizRecommendationEngine";
import { QuizSessionManager } from "./QuizSessionManager";

export interface QuizControllerConfig {
  engine?: Partial<QuizEngineConfig>;
  enableRecommendations: boolean;
  enableAnalytics: boolean;
  enableGapAnalysis: boolean;
}

export interface QuizFlowState {
  currentStep: "idle" | "configuring" | "ready" | "in_progress" | "reviewing" | "completed";
  quiz?: Quiz;
  session?: SessionState;
  result?: QuizResult;
  error?: string;
}

export class QuizController {
  private static instance: QuizController;
  private quizEngine: QuizEngine;
  private assessmentEngine: AssessmentEngine;
  private gapAnalyzer: KnowledgeGapAnalyzer;
  private recommendationEngine: QuizRecommendationEngine;
  private sessionManager: QuizSessionManager;
  private state: QuizFlowState = { currentStep: "idle" };
  private userId: string = "";

  private constructor(config?: QuizControllerConfig) {
    this.quizEngine = QuizEngine.getInstance(config?.engine);
    this.assessmentEngine = AssessmentEngine.getInstance();
    this.gapAnalyzer = KnowledgeGapAnalyzer.getInstance();
    this.recommendationEngine = QuizRecommendationEngine.getInstance();
    this.sessionManager = QuizSessionManager.getInstance();
  }

  static getInstance(config?: QuizControllerConfig): QuizController {
    if (!QuizController.instance) {
      QuizController.instance = new QuizController(config);
    }
    return QuizController.instance;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  getUserId(): string {
    return this.userId;
  }

  getState(): QuizFlowState {
    return { ...this.state };
  }

  // Quiz Creation
  async createQuiz(params: {
    title: string;
    type: QuizType;
    subject: string;
    topics: string[];
    difficulty?: DifficultyLevel | DifficultyLevel[];
    questionCount?: number;
    questionTypes?: QuestionType[];
  }): Promise<Quiz> {
    this.state.currentStep = "configuring";

    const quiz = await this.quizEngine.createQuiz({
      title: params.title,
      type: params.type,
      subject: params.subject,
      topics: params.topics,
      difficulty: params.difficulty || "medium",
      questionCount: params.questionCount || 10,
      questionTypes: params.questionTypes
    });

    this.state.quiz = quiz;
    this.state.currentStep = "ready";

    return quiz;
  }

  async createAdaptiveQuiz(params: {
    title: string;
    subject: string;
    topics: string[];
    targetDifficulty?: DifficultyLevel;
    questionCount?: number;
  }): Promise<Quiz> {
    return this.createQuiz({
      title: params.title,
      type: "assessment",
      subject: params.subject,
      topics: params.topics,
      difficulty: params.targetDifficulty || "medium",
      questionCount: params.questionCount || 15
    });
  }

  async createPracticeQuiz(params: {
    subject: string;
    topic?: string;
    difficulty?: DifficultyLevel;
    questionCount?: number;
  }): Promise<Quiz> {
    return this.createQuiz({
      title: `Practice: ${params.topic || params.subject}`,
      type: "practice",
      subject: params.subject,
      topics: params.topic ? [params.topic] : [],
      difficulty: params.difficulty || "medium",
      questionCount: params.questionCount || 10
    });
  }

  // Session Management
  async startQuiz(quizId: string): Promise<SessionState> {
    const quiz = await this.getQuizById(quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    const difficultyProfile = this.quizEngine.getDifficultyEngine().getOrCreateProfile(this.userId);

    const session = await this.quizEngine.startSession({
      quiz,
      userId: this.userId,
      difficultyProfile
    });

    this.state.session = session;
    this.state.currentStep = "in_progress";

    return session;
  }

  async submitAnswer(params: {
    questionId: string;
    answer: any;
    timeSpent: number;
  }): Promise<any> {
    if (!this.state.session) {
      throw new Error("No active session");
    }

    const evaluation = await this.quizEngine.submitAnswer({
      sessionId: this.state.session.sessionId,
      questionId: params.questionId,
      answer: params.answer,
      timeSpent: params.timeSpent
    });

    // Update session
    this.state.session = this.quizEngine.getActiveSession(this.state.session.sessionId);

    return evaluation;
  }

  async completeQuiz(): Promise<QuizResult> {
    if (!this.state.session) {
      throw new Error("No active session");
    }

    const result = await this.quizEngine.completeSession(this.state.session.sessionId);

    this.state.result = result;
    this.state.currentStep = "completed";
    this.state.session = undefined;

    return result;
  }

  // Session Navigation
  navigateToQuestion(index: number): void {
    if (!this.state.session) return;

    this.sessionManager.navigateToQuestion(this.state.session.sessionId, index);
    this.state.session = this.quizEngine.getActiveSession(this.state.session.sessionId);
  }

  pauseQuiz(): void {
    if (!this.state.session) return;

    this.sessionManager.pauseSession(this.state.session.sessionId);
    this.state.session = this.quizEngine.getActiveSession(this.state.session.sessionId);
  }

  resumeQuiz(): void {
    if (!this.state.session) return;

    this.sessionManager.resumeSession(this.state.session.sessionId);
    this.state.session = this.quizEngine.getActiveSession(this.state.session.sessionId);
  }

  saveCheckpoint(): void {
    if (!this.state.session) return;
    this.sessionManager.saveCheckpoint(this.state.session.sessionId);
  }

  recoverSession(): void {
    if (!this.state.session) return;

    const restored = this.sessionManager.recoverFromCheckpoint(this.state.session.sessionId);
    if (restored) {
      this.state.session = restored;
    }
  }

  abandonQuiz(): void {
    if (!this.state.session) return;

    this.sessionManager.abandonSession(this.state.session.sessionId);
    this.state.session = undefined;
    this.state.currentStep = "idle";
  }

  // Result Analysis
  async getDetailedResults(): Promise<{
    summary: any;
    topicBreakdown: any;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    if (!this.state.result) {
      throw new Error("No quiz result available");
    }

    const result = this.state.result;
    const feedback = await this.assessmentEngine.getDetailedFeedback(result);

    // Get gap analysis
    const gapAnalysis = await this.gapAnalyzer.analyzeResult(result);

    return {
      summary: {
        score: result.summary.score,
        maxScore: result.summary.maxScore,
        percentage: result.summary.percentage,
        grade: result.summary.grade,
        passed: result.summary.passed,
        timeSpent: result.summary.timeSpent
      },
      topicBreakdown: result.topicResults,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      recommendations: [
        ...feedback.recommendations,
        ...gapAnalysis.recommendations.map(r => r.title)
      ]
    };
  }

  // Recommendations
  async getRecommendations(): Promise<{
    quizzes: any[];
    content: any[];
  }> {
    const recentResults = await this.assessmentEngine.getResultsForUser(this.userId, 5);
    const masteryReport = await this.quizEngine.getDifficultyEngine().getProfile(this.userId);
    const gaps = await this.gapAnalyzer.analyzeResult(recentResults[0]);

    return this.recommendationEngine.generateRecommendations({
      userId: this.userId,
      recentResults,
      gaps: gaps.gaps,
      completedQuizzes: recentResults.map(r => r.summary.quizId)
    });
  }

  // Quiz Retrieval
  async getQuizById(quizId: string): Promise<Quiz | null> {
    return this.quizEngine.getController().getQuizById(quizId);
  }

  async getActiveSession(): Promise<SessionState | null> {
    if (!this.state.session) {
      const sessions = this.sessionManager.getSessionsForUser(this.userId);
      const active = sessions.find(s => s.status === "in_progress" || s.status === "paused");
      if (active) {
        this.state.session = active;
        this.state.currentStep = active.status === "paused" ? "in_progress" : "in_progress";
      }
    }
    return this.state.session || null;
  }

  async getSessionProgress(): Promise<{
    currentQuestion: number;
    totalQuestions: number;
    answeredCount: number;
    timeSpent: number;
    timeRemaining?: number;
  } | null> {
    if (!this.state.session) return null;

    const analytics = this.sessionManager.getSessionAnalytics(this.state.session.sessionId);
    if (!analytics) return null;

    return {
      currentQuestion: this.state.session.currentQuestionIndex,
      totalQuestions: this.state.session.answers.size,
      answeredCount: analytics.answeredCount,
      timeSpent: analytics.totalTime,
      timeRemaining: undefined
    };
  }

  // Analytics
  async getQuizHistory(limit?: number): Promise<QuizResult[]> {
    return this.assessmentEngine.getResultsForUser(this.userId, limit);
  }

  async getPerformanceTrend(days: number = 30): Promise<{
    dates: string[];
    scores: number[];
    trend: "improving" | "stable" | "declining";
  }> {
    const results = await this.assessmentEngine.getResultsForUser(this.userId, 100);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recentResults = results.filter(r => r.createdAt >= cutoffDate);

    const dates = recentResults.map(r => r.createdAt.toISOString().split("T")[0]);
    const scores = recentResults.map(r => r.summary.percentage);

    let trend: "improving" | "stable" | "declining" = "stable";
    if (scores.length >= 3) {
      const recent = scores.slice(0, Math.ceil(scores.length / 2));
      const older = scores.slice(Math.ceil(scores.length / 2));

      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      if (recentAvg > olderAvg + 5) trend = "improving";
      else if (recentAvg < olderAvg - 5) trend = "declining";
    }

    return { dates, scores, trend };
  }

  async getTopicMastery(): Promise<{
    topic: string;
    mastery: number;
    questionsAttempted: number;
  }[]> {
    const results = await this.assessmentEngine.getResultsForUser(this.userId, 10);

    const topicStats = new Map<string, { correct: number; total: number }>();

    results.forEach(result => {
      result.topicResults.forEach(topic => {
        const existing = topicStats.get(topic.topic) || { correct: 0, total: 0 };
        existing.correct += topic.correctQuestions;
        existing.total += topic.totalQuestions;
        topicStats.set(topic.topic, existing);
      });
    });

    return Array.from(topicStats.entries()).map(([topic, stats]) => ({
      topic,
      mastery: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      questionsAttempted: stats.total
    }));
  }

  // Difficulty Management
  getDifficultyProfile(): UserDifficultyProfile | undefined {
    return this.quizEngine.getDifficultyEngine().getProfile(this.userId);
  }

  setPreferredDifficulty(difficulty: DifficultyLevel): void {
    this.quizEngine.getDifficultyEngine().setUserPreference(this.userId, {
      preferredDifficulty: difficulty
    });
  }

  resetDifficulty(): void {
    this.quizEngine.getDifficultyEngine().resetProfile(this.userId);
  }

  // Cleanup
  cleanup(): void {
    this.sessionManager.cleanup();
  }

  reset(): void {
    this.state = { currentStep: "idle" };
    this.sessionManager.cleanup();
  }

  destroy(): void {
    this.state = { currentStep: "idle" };
    this.sessionManager.destroy();
    QuizController.instance = null as any;
  }
}

export default QuizController;
