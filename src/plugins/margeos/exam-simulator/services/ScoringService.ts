// @ts-nocheck
/**
 * ScoringService.ts
 *
 * Service for calculating and managing exam scores with support for
 * various scoring methods including partial credit and negative marking.
 */

import type { Exam, ExamQuestion } from '../models';
import type { ExamResult, QuestionResult, ExamResultSummary } from '../models';
import { examStorage } from '../store/examSimulatorStore';

export interface ScoringConfig {
  enablePartialCredit: boolean;
  enableNegativeMarking: boolean;
  negativeMarkingRatio: number; // e.g., 0.25 for 1/4 deduction
  roundingMethod: 'round' | 'floor' | 'ceil';
  minimumScore: number;
}

export interface DetailedScore {
  rawScore: number;
  weightedScore: number;
  percentage: number;
  partialCredit: number;
  negativeMarking: number;
  finalScore: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
  enablePartialCredit: true,
  enableNegativeMarking: false,
  negativeMarkingRatio: 0.25,
  roundingMethod: 'round',
  minimumScore: 0
};

export class ScoringService {
  private static instance: ScoringService;
  private config: ScoringConfig;

  private constructor(config?: Partial<ScoringConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<ScoringConfig>): ScoringService {
    if (!ScoringService.instance) {
      ScoringService.instance = new ScoringService(config);
    }
    return ScoringService.instance;
  }

  /**
   * Update scoring configuration
   */
  updateConfig(config: Partial<ScoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ScoringConfig {
    return { ...this.config };
  }

  /**
   * Score an exam
   */
  scoreExam(
    exam: Exam,
    answers: Map<string, string | string[] | boolean>
  ): {
    questionResults: QuestionResult[];
    summary: ExamResultSummary;
    detailedScores: Map<string, DetailedScore>;
  } {
    const questionResults: QuestionResult[] = [];
    const detailedScores = new Map<string, DetailedScore>();

    let totalRawScore = 0;
    let totalMaxScore = 0;
    let totalPartialCredit = 0;
    let totalNegativeMarking = 0;
    let correctCount = 0;
    let attemptedCount = 0;

    for (const question of exam.questions) {
      const userAnswer = answers.get(question.id);
      const result = this.scoreQuestion(question, userAnswer);

      questionResults.push(result);
      detailedScores.set(question.id, result.detailedScore);

      totalRawScore += result.score;
      totalMaxScore += result.maxScore;
      totalPartialCredit += result.detailedScore.partialCredit;
      totalNegativeMarking += Math.abs(result.detailedScore.negativeMarking);
      attemptedCount++;

      if (result.isCorrect) {
        correctCount++;
      }
    }

    // Calculate final score with negative marking
    const finalScore = Math.max(
      this.config.minimumScore,
      totalRawScore - totalNegativeMarking
    );

    const percentage = totalMaxScore > 0
      ? (finalScore / totalMaxScore) * 100
      : 0;

    const summary: ExamResultSummary = {
      totalQuestions: exam.questions.length,
      attemptedQuestions: attemptedCount,
      correctAnswers: correctCount,
      incorrectAnswers: attemptedCount - correctCount,
      partialCredit: totalPartialCredit,
      totalScore: finalScore,
      maxScore: totalMaxScore,
      percentage: this.round(percentage),
      grade: this.calculateGrade(percentage),
      passed: percentage >= exam.config.passingScore,
      timeSpent: 0,
      averageTimePerQuestion: 0
    };

    return { questionResults, summary, detailedScores };
  }

  /**
   * Score a single question
   */
  scoreQuestion(
    question: ExamQuestion,
    userAnswer: string | string[] | boolean | undefined
  ): QuestionResult & { detailedScore: DetailedScore } {
    const maxScore = question.content.points || 1;
    const correctAnswer = question.content.correctAnswer;

    let isCorrect = false;
    let score = 0;
    let partialCredit = 0;
    let negativeMarking = 0;

    switch (question.content.type) {
      case 'MCQ':
      case 'T_F':
        isCorrect = this.compareMCQAnswer(userAnswer, correctAnswer);
        score = isCorrect ? maxScore : 0;
        if (!isCorrect && this.config.enableNegativeMarking) {
          negativeMarking = maxScore * this.config.negativeMarkingRatio;
        }
        break;

      case 'MULTI_SELECT':
        const multiResult = this.scoreMultiSelect(userAnswer, correctAnswer, maxScore);
        isCorrect = multiResult.isCorrect;
        score = multiResult.score;
        partialCredit = multiResult.partialCredit;
        if (!isCorrect && this.config.enableNegativeMarking) {
          negativeMarking = multiResult.negativeMarking;
        }
        break;

      case 'SHORT_ANSWER':
        isCorrect = this.compareShortAnswer(userAnswer, correctAnswer);
        score = isCorrect ? maxScore : 0;
        if (!isCorrect && this.config.enableNegativeMarking) {
          negativeMarking = maxScore * this.config.negativeMarkingRatio;
        }
        break;

      case 'MATCHING':
        const matchResult = this.scoreMatching(userAnswer, correctAnswer, maxScore);
        isCorrect = matchResult.isCorrect;
        score = matchResult.score;
        partialCredit = matchResult.partialCredit;
        break;

      case 'ESSAY':
        // For essay questions, partial credit based on keywords
        isCorrect = false;
        score = 0; // Would need manual grading in production
        break;

      default:
        isCorrect = false;
        score = 0;
    }

    const detailedScore: DetailedScore = {
      rawScore: score,
      weightedScore: score,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
      partialCredit,
      negativeMarking,
      finalScore: Math.max(0, score - Math.abs(negativeMarking))
    };

    return {
      questionId: question.id,
      questionType: question.content.type,
      topic: question.content.topic,
      subtopic: question.content.subtopic,
      isCorrect,
      userAnswer: this.formatUserAnswer(userAnswer),
      correctAnswer: String(correctAnswer),
      score,
      maxScore,
      timeSpent: question.content.timeAllocation || 60,
      hintUsed: false,
      difficulty: question.content.difficulty,
      attemptedAt: new Date().toISOString(),
      feedback: this.generateFeedback(question, isCorrect, detailedScore),
      detailedScore
    };
  }

  /**
   * Score multiple select question with partial credit
   */
  private scoreMultiSelect(
    userAnswer: string | string[] | boolean | undefined,
    correctAnswer: string,
    maxScore: number
  ): {
    isCorrect: boolean;
    score: number;
    partialCredit: number;
    negativeMarking: number;
  } {
    if (!Array.isArray(userAnswer) || !correctAnswer) {
      return {
        isCorrect: false,
        score: 0,
        partialCredit: 0,
        negativeMarking: maxScore * this.config.negativeMarkingRatio
      };
    }

    const correctOptions = correctAnswer.split('').sort();
    const userOptions = [...userAnswer].sort();

    // Check if completely correct
    if (JSON.stringify(correctOptions) === JSON.stringify(userOptions)) {
      return {
        isCorrect: true,
        score: maxScore,
        partialCredit: 0,
        negativeMarking: 0
      };
    }

    // Calculate partial credit
    if (this.config.enablePartialCredit) {
      const correctCount = userOptions.filter(o => correctOptions.includes(o)).length;
      const incorrectCount = userOptions.filter(o => !correctOptions.includes(o)).length;

      const partialPercentage = correctCount / correctOptions.length;
      const penaltyPercentage = incorrectCount / correctOptions.length;

      let finalScore = maxScore * partialPercentage;

      // Apply penalty for incorrect selections
      if (this.config.enableNegativeMarking) {
        const penalty = maxScore * penaltyPercentage * this.config.negativeMarkingRatio;
        finalScore = Math.max(0, finalScore - penalty);
      }

      return {
        isCorrect: false,
        score: this.round(finalScore),
        partialCredit: maxScore * partialPercentage,
        negativeMarking: this.config.enableNegativeMarking
          ? maxScore * penaltyPercentage * this.config.negativeMarkingRatio
          : 0
      };
    }

    return {
      isCorrect: false,
      score: 0,
      partialCredit: 0,
      negativeMarking: maxScore * this.config.negativeMarkingRatio
    };
  }

  /**
   * Score matching question
   */
  private scoreMatching(
    userAnswer: any,
    correctAnswer: string,
    maxScore: number
  ): {
    isCorrect: boolean;
    score: number;
    partialCredit: number;
    negativeMarking: number;
  } {
    // Simplified matching score
    if (!userAnswer || typeof userAnswer !== 'object') {
      return {
        isCorrect: false,
        score: 0,
        partialCredit: 0,
        negativeMarking: 0
      };
    }

    const correctMatches = Object.entries(userAnswer as Record<string, string>)
      .filter(([key, value]) => `${key}:${value}` === correctAnswer)
      .length;

    const totalMatches = Object.keys(userAnswer as Record<string, string>).length;
    const percentage = totalMatches > 0 ? correctMatches / totalMatches : 0;

    return {
      isCorrect: percentage === 1,
      score: this.round(maxScore * percentage),
      partialCredit: maxScore * percentage,
      negativeMarking: 0
    };
  }

  /**
   * Compare MCQ/True-False answers
   */
  private compareMCQAnswer(
    userAnswer: string | string[] | boolean | undefined,
    correctAnswer: string
  ): boolean {
    if (userAnswer === undefined || userAnswer === null) return false;

    if (typeof userAnswer === 'boolean') {
      return correctAnswer.toLowerCase() === (userAnswer ? 'true' : 'false');
    }

    if (typeof userAnswer === 'string') {
      return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
    }

    return false;
  }

  /**
   * Compare short answer responses
   */
  private compareShortAnswer(
    userAnswer: string | string[] | boolean | undefined,
    correctAnswer: string
  ): boolean {
    if (typeof userAnswer !== 'string') return false;

    const normalize = (text: string) =>
      text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;]/g, '');

    return normalize(userAnswer) === normalize(correctAnswer);
  }

  /**
   * Format user answer for display
   */
  private formatUserAnswer(answer: any): string {
    if (answer === undefined || answer === null) return 'Not answered';
    if (typeof answer === 'boolean') return answer ? 'True' : 'False';
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer);
  }

  /**
   * Generate feedback message
   */
  private generateFeedback(
    question: ExamQuestion,
    isCorrect: boolean,
    detailedScore: DetailedScore
  ): string {
    if (isCorrect) {
      if (detailedScore.percentage === 100) {
        return 'Perfect!';
      }
      return 'Correct!';
    }

    if (detailedScore.partialCredit > 0) {
      return `Partially correct. You earned ${detailedScore.partialCredit.toFixed(1)} points.`;
    }

    if (detailedScore.negativeMarking > 0) {
      return `Incorrect. ${detailedScore.negativeMarking.toFixed(1)} points deducted.`;
    }

    return 'Incorrect. Review the solution to understand the correct answer.';
  }

  /**
   * Calculate letter grade
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 65) return 'D+';
    if (percentage >= 60) return 'D';
    if (percentage >= 50) return 'E';
    return 'F';
  }

  /**
   * Round score according to configured method
   */
  private round(value: number): number {
    switch (this.config.roundingMethod) {
      case 'floor':
        return Math.floor(value);
      case 'ceil':
        return Math.ceil(value);
      default:
        return Math.round(value);
    }
  }

  /**
   * Calculate score statistics
   */
  calculateStatistics(scores: number[]): {
    mean: number;
    median: number;
    mode: number;
    stdDev: number;
    min: number;
    max: number;
    range: number;
  } {
    if (scores.length === 0) {
      return { mean: 0, median: 0, mode: 0, stdDev: 0, min: 0, max: 0, range: 0 };
    }

    const sorted = [...scores].sort((a, b) => a - b);
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / scores.length;

    // Median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;

    // Mode
    const frequency = new Map<number, number>();
    scores.forEach(s => frequency.set(s, (frequency.get(s) || 0) + 1));
    let mode = scores[0];
    let maxFreq = 0;
    frequency.forEach((freq, value) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = value;
      }
    });

    // Standard deviation
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / scores.length);

    return {
      mean: this.round(mean * 100) / 100,
      median: this.round(median * 100) / 100,
      mode,
      stdDev: this.round(stdDev * 100) / 100,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      range: sorted[sorted.length - 1] - sorted[0]
    };
  }
}

export const scoringService = ScoringService.getInstance();
export default scoringService;
