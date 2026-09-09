// @ts-nocheck
/**
 * PerformanceEvaluator.ts
 *
 * Evaluates student performance across exams, topics, and time periods.
 * Provides detailed analytics, trend analysis, and performance predictions.
 */

import type { Exam, ExamResult, ExamResultSummary, QuestionResult, TopicResult } from '../models';
import type { PerformanceLevel, PerformanceProfile, PerformancePrediction, ExamHistoryItem } from '../models/PerformanceProfile';
import { examStorage } from '../store/examSimulatorStore';

export interface PerformanceConfig {
  includeTrendAnalysis: boolean;
  predictionAccuracy: number;
  minimumHistoryForPrediction: number;
}

export interface PerformanceMetrics {
  totalExams: number;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageTimePerQuestion: number;
  improvementRate: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  includeTrendAnalysis: true,
  predictionAccuracy: 0.8,
  minimumHistoryForPrediction: 3
};

export class PerformanceEvaluator {
  private static instance: PerformanceEvaluator;
  private config: PerformanceConfig;
  private initialized: boolean = false;

  private constructor(config?: Partial<PerformanceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<PerformanceConfig>): PerformanceEvaluator {
    if (!PerformanceEvaluator.instance) {
      PerformanceEvaluator.instance = new PerformanceEvaluator(config);
    }
    return PerformanceEvaluator.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Evaluate exam performance and generate results
   */
  async evaluateExam(
    exam: Exam,
    answers: Map<string, string | string[] | boolean>,
    session: any
  ): Promise<ExamResult> {
    const questionResults = this.evaluateAnswers(exam, answers);
    const summary = this.generateSummary(exam, questionResults);
    const topicResults = this.analyzeTopicPerformance(exam, questionResults);
    const difficultyAnalysis = this.analyzeDifficultyPerformance(exam, questionResults);
    const questionTypeAnalysis = this.analyzeQuestionTypePerformance(exam, questionResults);
    const timeAnalysis = this.analyzeTimePerformance(exam, questionResults, session);
    const predictions = this.generatePerformancePredictions(exam, summary);

    const result: ExamResult = {
      id: `RESULT-${Date.now()}-${this.generateRandomId()}`,
      examId: exam.id,
      userId: session.userId,
      sessionId: session.id,
      examMode: exam.mode,
      examTitle: exam.title,
      examTopics: exam.config.topics,
      subject: exam.config.subject,
      startedAt: session.startedAt,
      completedAt: new Date().toISOString(),
      duration: this.calculateDuration(session.startedAt),
      summary,
      questionResults,
      topicResults,
      difficultyAnalysis,
      questionTypeAnalysis,
      timeAnalysis,
      predictions,
      feedback: this.generateFeedback(summary, topicResults),
      areasOfStrength: this.identifyStrengths(topicResults),
      areasOfImprovement: this.identifyImprovements(topicResults),
      studyRecommendations: [],
      metadata: {
        examDifficulty: exam.config.difficulty,
        questionCount: exam.questions.length,
        passingScore: exam.config.passingScore,
        passed: summary.percentage >= exam.config.passingScore
      }
    };

    examStorage.saveResult(result);
    return result;
  }

  /**
   * Evaluate individual answers
   */
  private evaluateAnswers(
    exam: Exam,
    answers: Map<string, string | string[] | boolean>
  ): QuestionResult[] {
    const results: QuestionResult[] = [];

    for (const question of exam.questions) {
      const userAnswer = answers.get(question.id);
      const evaluation = this.evaluateAnswer(question, userAnswer);

      results.push({
        questionId: question.id,
        questionType: question.content.type,
        topic: question.content.topic,
        subtopic: question.content.subtopic,
        isCorrect: evaluation.isCorrect,
        userAnswer: evaluation.userAnswer,
        correctAnswer: evaluation.correctAnswer,
        score: evaluation.score,
        maxScore: question.content.points || 1,
        timeSpent: evaluation.timeSpent,
        hintUsed: evaluation.hintUsed,
        difficulty: question.content.difficulty,
        attemptedAt: new Date().toISOString(),
        feedback: evaluation.feedback
      });
    }

    return results;
  }

  /**
   * Evaluate a single answer
   */
  private evaluateAnswer(
    question: any,
    userAnswer: string | string[] | boolean | undefined
  ): {
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    score: number;
    timeSpent: number;
    hintUsed: boolean;
    feedback: string;
  } {
    const correctAnswer = question.content.correctAnswer;
    let isCorrect = false;
    let score = 0;

    switch (question.content.type) {
      case 'MCQ':
      case 'T_F':
        isCorrect = this.compareMCQAnswer(userAnswer, correctAnswer);
        break;
      case 'MULTI_SELECT':
        isCorrect = this.compareMultiSelectAnswer(userAnswer, correctAnswer);
        break;
      case 'SHORT_ANSWER':
        isCorrect = this.compareShortAnswer(userAnswer, correctAnswer);
        score = isCorrect ? (question.content.points || 1) : 0;
        break;
      case 'ESSAY':
        // For essays, partial credit could be given based on keywords
        isCorrect = false;
        score = 0;
        break;
      default:
        isCorrect = false;
    }

    if (question.content.type === 'MCQ' || question.content.type === 'T_F') {
      score = isCorrect ? (question.content.points || 1) : 0;
    }

    return {
      isCorrect,
      userAnswer: this.formatUserAnswer(userAnswer),
      correctAnswer: String(correctAnswer),
      score,
      timeSpent: question.content.timeAllocation || 60,
      hintUsed: false,
      feedback: isCorrect ? 'Correct!' : 'Incorrect. Review the solution.'
    };
  }

  private compareMCQAnswer(userAnswer: any, correctAnswer: string): boolean {
    if (typeof userAnswer === 'string') {
      return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
    }
    return false;
  }

  private compareMultiSelectAnswer(userAnswer: any, correctAnswer: string): boolean {
    if (Array.isArray(userAnswer)) {
      const correct = correctAnswer.split('').sort();
      const user = [...userAnswer].sort();
      return JSON.stringify(correct) === JSON.stringify(user);
    }
    return false;
  }

  private compareShortAnswer(userAnswer: any, correctAnswer: string): boolean {
    if (typeof userAnswer === 'string') {
      const normalized = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ');
      return normalized(userAnswer) === normalized(correctAnswer);
    }
    return false;
  }

  private formatUserAnswer(answer: any): string {
    if (answer === undefined || answer === null) return 'Not answered';
    if (typeof answer === 'boolean') return answer ? 'True' : 'False';
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer);
  }

  /**
   * Generate result summary
   */
  private generateSummary(exam: Exam, questionResults: QuestionResult[]): ExamResultSummary {
    const totalQuestions = questionResults.length;
    const correctAnswers = questionResults.filter(r => r.isCorrect).length;
    const totalScore = questionResults.reduce((sum, r) => sum + r.score, 0);
    const maxScore = questionResults.reduce((sum, r) => sum + r.maxScore, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const totalTime = questionResults.reduce((sum, r) => sum + r.timeSpent, 0);

    return {
      totalQuestions,
      attemptedQuestions: questionResults.filter(r => r.userAnswer !== 'Not answered').length,
      correctAnswers,
      incorrectAnswers: totalQuestions - correctAnswers,
      partialCredit: 0,
      totalScore,
      maxScore,
      percentage: Math.round(percentage * 100) / 100,
      grade: this.calculateGrade(percentage),
      passed: percentage >= exam.config.passingScore,
      timeSpent: totalTime,
      averageTimePerQuestion: totalQuestions > 0 ? totalTime / totalQuestions : 0
    };
  }

  /**
   * Calculate letter grade
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Analyze performance by topic
   */
  private analyzeTopicPerformance(exam: Exam, questionResults: QuestionResult[]): TopicResult[] {
    const topicMap = new Map<string, {
      total: number;
      correct: number;
      score: number;
      maxScore: number;
      timeSpent: number;
    }>();

    questionResults.forEach(result => {
      const topic = result.topic || 'General';
      const existing = topicMap.get(topic) || { total: 0, correct: 0, score: 0, maxScore: 0, timeSpent: 0 };

      existing.total += 1;
      if (result.isCorrect) existing.correct += 1;
      existing.score += result.score;
      existing.maxScore += result.maxScore;
      existing.timeSpent += result.timeSpent;

      topicMap.set(topic, existing);
    });

    const results: TopicResult[] = [];

    topicMap.forEach((data, topic) => {
      results.push({
        topic,
        totalQuestions: data.total,
        correctAnswers: data.correct,
        percentage: data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0,
        averageTime: data.total > 0 ? data.timeSpent / data.total : 0,
        masteryLevel: this.calculateMasteryLevel(data.score / data.maxScore)
      });
    });

    return results.sort((a, b) => a.percentage - b.percentage);
  }

  /**
   * Analyze performance by difficulty
   */
  private analyzeDifficultyPerformance(exam: Exam, questionResults: QuestionResult[]): {
    easy: { correct: number; total: number; percentage: number };
    medium: { correct: number; total: number; percentage: number };
    hard: { correct: number; total: number; percentage: number };
  } {
    const analysis = {
      easy: { correct: 0, total: 0, percentage: 0 },
      medium: { correct: 0, total: 0, percentage: 0 },
      hard: { correct: 0, total: 0, percentage: 0 }
    };

    questionResults.forEach(result => {
      const difficulty = this.getDifficultyLevel(result.difficulty);
      analysis[difficulty].total += 1;
      if (result.isCorrect) analysis[difficulty].correct += 1;
    });

    Object.keys(analysis).forEach(key => {
      const d = analysis[key as keyof typeof analysis];
      d.percentage = d.total > 0 ? (d.correct / d.total) * 100 : 0;
    });

    return analysis;
  }

  /**
   * Analyze performance by question type
   */
  private analyzeQuestionTypePerformance(exam: Exam, questionResults: QuestionResult[]): {
    MCQ: { correct: number; total: number; percentage: number };
    T_F: { correct: number; total: number; percentage: number };
    SHORT_ANSWER: { correct: number; total: number; percentage: number };
    MULTI_SELECT: { correct: number; total: number; percentage: number };
    ESSAY: { correct: number; total: number; percentage: number };
    MATCHING: { correct: number; total: number; percentage: number };
  } {
    const types = ['MCQ', 'T_F', 'SHORT_ANSWER', 'MULTI_SELECT', 'ESSAY', 'MATCHING'] as const;
    const analysis = {} as Record<typeof types[number], { correct: number; total: number; percentage: number }>;

    types.forEach(type => {
      analysis[type] = { correct: 0, total: 0, percentage: 0 };
    });

    questionResults.forEach(result => {
      const type = result.questionType as typeof types[number];
      if (analysis[type]) {
        analysis[type].total += 1;
        if (result.isCorrect) analysis[type].correct += 1;
      }
    });

    types.forEach(type => {
      const a = analysis[type];
      a.percentage = a.total > 0 ? (a.correct / a.total) * 100 : 0;
    });

    return analysis;
  }

  /**
   * Analyze time performance
   */
  private analyzeTimePerformance(
    exam: Exam,
    questionResults: QuestionResult[],
    session: any
  ): { totalTime: number; averageTime: number; timeDistribution: Record<string, number>; timeWarning: boolean } {
    const totalTime = questionResults.reduce((sum, r) => sum + r.timeSpent, 0);
    const averageTime = questionResults.length > 0 ? totalTime / questionResults.length : 0;

    const timeDistribution: Record<string, number> = {
      'under_30s': 0,
      '30s_1min': 0,
      '1min_2min': 0,
      'over_2min': 0
    };

    questionResults.forEach(r => {
      if (r.timeSpent < 30) timeDistribution['under_30s']++;
      else if (r.timeSpent < 60) timeDistribution['30s_1min']++;
      else if (r.timeSpent < 120) timeDistribution['1min_2min']++;
      else timeDistribution['over_2min']++;
    });

    const averageAllocated = exam.questions.reduce((sum, q) => sum + (q.content.timeAllocation || 60), 0) / exam.questions.length;

    return {
      totalTime,
      averageTime: Math.round(averageTime),
      timeDistribution,
      timeWarning: averageTime > averageAllocated * 1.5
    };
  }

  /**
   * Generate performance predictions
   */
  private generatePerformancePredictions(exam: Exam, summary: ExamResultSummary): {
    nextExamScore: number;
    confidenceInterval: { lower: number; upper: number };
    trendDirection: 'improving' | 'stable' | 'declining';
  } {
    const history = examStorage.getResultsByUser(exam.metadata?.userId || 'current_user');
    const recentResults = history.slice(-5);

    if (recentResults.length < this.config.minimumHistoryForPrediction) {
      return {
        nextExamScore: summary.percentage,
        confidenceInterval: { lower: summary.percentage - 10, upper: summary.percentage + 10 },
        trendDirection: 'stable'
      };
    }

    const scores = recentResults.map(r => r.summary.percentage);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = this.calculateTrend(scores);

    const predictedScore = (average + summary.percentage) / 2;
    const variance = this.calculateVariance(scores);

    return {
      nextExamScore: Math.round(predictedScore * 100) / 100,
      confidenceInterval: {
        lower: Math.max(0, predictedScore - variance),
        upper: Math.min(100, predictedScore + variance)
      },
      trendDirection: trend > 0.05 ? 'improving' : trend < -0.05 ? 'declining' : 'stable'
    };
  }

  /**
   * Get comprehensive performance profile
   */
  async getPerformanceProfile(userId: string): Promise<PerformanceProfile> {
    const results = examStorage.getResultsByUser(userId);
    const metrics = this.calculateMetrics(results);
    const topicPerformance = this.aggregateTopicPerformance(results);
    const examHistory = this.buildExamHistory(results);
    const achievements = this.calculateAchievements(results, metrics);
    const prediction = this.generateOverallPrediction(results);

    const recentScores = results.slice(-10).map(r => r.summary.percentage);
    const recentAverage = recentScores.length > 0
      ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      : 0;

    const profile: PerformanceProfile = {
      id: `PROFILE-${userId}-${Date.now()}`,
      userId,
      generatedAt: new Date().toISOString(),
      lastUpdated: results[0]?.completedAt || new Date().toISOString(),
      totalExams: metrics.totalExams,
      totalQuestions: metrics.totalQuestions,
      overallAverage: metrics.averageScore,
      recentAverage,
      highestScore: metrics.highestScore,
      lowestScore: metrics.lowestScore,
      overallLevel: this.determineLevel(recentAverage),
      topicPerformance,
      examHistory,
      achievements,
      strengths: this.identifyGlobalStrengths(topicPerformance),
      weaknesses: this.identifyGlobalWeaknesses(topicPerformance),
      prediction,
      studyStreak: this.calculateStudyStreak(results),
      totalStudyTime: this.calculateTotalStudyTime(results),
      metadata: {
        favoriteMode: this.getFavoriteExamMode(results),
        averageDuration: metrics.totalExams > 0 ? metrics.totalQuestions / metrics.totalExams : 0,
        improvementRate: metrics.improvementRate
      }
    };

    return profile;
  }

  /**
   * Calculate overall metrics
   */
  private calculateMetrics(results: ExamResult[]): PerformanceMetrics {
    if (results.length === 0) {
      return {
        totalExams: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        averageTimePerQuestion: 0,
        improvementRate: 0
      };
    }

    const totalExams = results.length;
    const totalQuestions = results.reduce((sum, r) => sum + r.summary.totalQuestions, 0);
    const correctAnswers = results.reduce((sum, r) => sum + r.summary.correctAnswers, 0);
    const scores = results.map(r => r.summary.percentage);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const totalTime = results.reduce((sum, r) => sum + r.summary.timeSpent, 0);
    const averageTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;
    const improvementRate = this.calculateTrend(scores);

    return {
      totalExams,
      totalQuestions,
      correctAnswers,
      averageScore,
      highestScore,
      lowestScore,
      averageTimePerQuestion,
      improvementRate
    };
  }

  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    const n = scores.length;
    const xMean = (n - 1) / 2;
    const yMean = scores.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    scores.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });

    return denominator !== 0 ? numerator / denominator / 100 : 0;
  }

  private calculateVariance(scores: number[]): number {
    if (scores.length === 0) return 0;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / scores.length);
  }

  private calculateMasteryLevel(percentage: number): 'none' | 'beginner' | 'developing' | 'proficient' | 'mastered' {
    if (percentage >= 90) return 'mastered';
    if (percentage >= 75) return 'proficient';
    if (percentage >= 50) return 'developing';
    if (percentage > 0) return 'beginner';
    return 'none';
  }

  private getDifficultyLevel(difficulty: number): 'easy' | 'medium' | 'hard' {
    if (difficulty < 0.4) return 'easy';
    if (difficulty < 0.7) return 'medium';
    return 'hard';
  }

  private generateFeedback(summary: ExamResultSummary, topicResults: TopicResult[]): string {
    if (summary.passed) {
      if (summary.percentage >= 90) {
        return 'Excellent performance! You have mastered this material.';
      } else if (summary.percentage >= 75) {
        return 'Great job! You have a solid understanding of the material.';
      } else {
        return 'Good work! You passed the exam.';
      }
    } else {
      const weakTopics = topicResults.filter(t => t.percentage < 50).map(t => t.topic);
      if (weakTopics.length > 0) {
        return `Focus on improving your understanding of: ${weakTopics.join(', ')}`;
      }
      return 'Keep studying! Review the material and try again.';
    }
  }

  private identifyStrengths(topicResults: TopicResult[]): string[] {
    return topicResults
      .filter(t => t.percentage >= 75)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3)
      .map(t => t.topic);
  }

  private identifyImprovements(topicResults: TopicResult[]): string[] {
    return topicResults
      .filter(t => t.percentage < 60)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3)
      .map(t => t.topic);
  }

  private aggregateTopicPerformance(results: ExamResult[]): Record<string, {
    exams: number;
    averageScore: number;
    trend: 'improving' | 'stable' | 'declining';
  }> {
    const topicMap = new Map<string, { scores: number[]; exams: number }>();

    results.forEach(result => {
      result.topicResults.forEach(topic => {
        const existing = topicMap.get(topic.topic) || { scores: [], exams: 0 };
        existing.scores.push(topic.percentage);
        existing.exams += 1;
        topicMap.set(topic.topic, existing);
      });
    });

    const performance: Record<string, { exams: number; averageScore: number; trend: 'improving' | 'stable' | 'declining' }> = {};

    topicMap.forEach((data, topic) => {
      const averageScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      const trend = this.calculateTrend(data.scores);

      performance[topic] = {
        exams: data.exams,
        averageScore,
        trend: trend > 0.05 ? 'improving' : trend < -0.05 ? 'declining' : 'stable'
      };
    });

    return performance;
  }

  private buildExamHistory(results: ExamResult[]): ExamHistoryItem[] {
    return results.slice(0, 20).map(r => ({
      examId: r.examId,
      examTitle: r.examTitle,
      examMode: r.examMode,
      score: r.summary.percentage,
      passed: r.summary.passed,
      completedAt: r.completedAt,
      topics: r.examTopics
    })).reverse();
  }

  private calculateAchievements(results: ExamResult[], metrics: PerformanceMetrics): Achievement[] {
    const achievements: Achievement[] = [];

    if (metrics.totalExams >= 10) {
      achievements.push({ id: 'dedicated', name: 'Dedicated Learner', description: 'Completed 10+ exams', icon: '🏆', earnedAt: new Date().toISOString() });
    }

    if (metrics.highestScore >= 95) {
      achievements.push({ id: 'perfectionist', name: 'Perfectionist', description: 'Achieved 95%+ score', icon: '⭐', earnedAt: new Date().toISOString() });
    }

    if (metrics.improvementRate > 0.1) {
      achievements.push({ id: 'improver', name: 'Rising Star', description: 'Showed significant improvement', icon: '📈', earnedAt: new Date().toISOString() });
    }

    return achievements;
  }

  private generateOverallPrediction(results: ExamResult[]): PerformancePrediction {
    if (results.length < 3) {
      return { predictedNextScore: 0, confidence: 0.3, factors: [] };
    }

    const recentScores = results.slice(-5).map(r => r.summary.percentage);
    const average = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const trend = this.calculateTrend(recentScores);

    return {
      predictedNextScore: Math.max(0, Math.min(100, average + trend * 10)),
      confidence: 0.7,
      factors: ['Recent performance', 'Historical trend', 'Topic mastery']
    };
  }

  private determineLevel(averageScore: number): PerformanceLevel {
    if (averageScore >= 90) return 'expert';
    if (averageScore >= 75) return 'advanced';
    if (averageScore >= 60) return 'intermediate';
    if (averageScore >= 40) return 'beginner';
    return 'novice';
  }

  private identifyGlobalStrengths(topicPerformance: Record<string, any>): string[] {
    return Object.entries(topicPerformance)
      .filter(([_, data]) => data.averageScore >= 80)
      .map(([topic]) => topic);
  }

  private identifyGlobalWeaknesses(topicPerformance: Record<string, any>): string[] {
    return Object.entries(topicPerformance)
      .filter(([_, data]) => data.averageScore < 50)
      .map(([topic]) => topic);
  }

  private calculateStudyStreak(results: ExamResult[]): number {
    if (results.length === 0) return 0;

    let streak = 0;
    const sortedResults = results.sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    let lastDate = new Date(sortedResults[0].completedAt);
    lastDate.setHours(0, 0, 0, 0);

    for (const result of sortedResults) {
      const resultDate = new Date(result.completedAt);
      resultDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((lastDate.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        streak++;
        lastDate = resultDate;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateTotalStudyTime(results: ExamResult[]): number {
    return results.reduce((sum, r) => sum + r.summary.timeSpent, 0);
  }

  private getFavoriteExamMode(results: ExamResult[]): string {
    const modeCount: Record<string, number> = {};

    results.forEach(r => {
      modeCount[r.examMode] = (modeCount[r.examMode] || 0) + 1;
    });

    let maxMode = 'practice';
    let maxCount = 0;

    Object.entries(modeCount).forEach(([mode, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxMode = mode;
      }
    });

    return maxMode;
  }

  private calculateDuration(startTime: string): number {
    const start = new Date(startTime).getTime();
    const end = Date.now();
    return Math.floor((end - start) / 1000);
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

export default PerformanceEvaluator;
