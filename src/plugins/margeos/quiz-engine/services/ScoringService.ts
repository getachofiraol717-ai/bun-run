// @ts-nocheck
// Adaptive Quiz Engine — ScoringService
// Handles all scoring calculations and grade management

import type { Question, DifficultyLevel, QuestionType } from "../models/Question";
import type { AnswerEvaluation } from "../models/Answer";
import type { QuizResult } from "../models/QuizResult";

export interface ScoreCalculation {
  baseScore: number;
  timeBonus: number;
  difficultyBonus: number;
  streakBonus: number;
  penalty: number;
  totalScore: number;
  maxScore: number;
}

export interface GradeScale {
  letter: string;
  minPercentage: number;
  maxPercentage: number;
  gpa: number;
  description: string;
}

export interface QuizScoringConfig {
  basePointsPerQuestion: number;
  timeBonusEnabled: boolean;
  timeBonusMultiplier: number;
  difficultyBonusEnabled: boolean;
  streakBonusEnabled: boolean;
  streakBonusThreshold: number;
  streakBonusPoints: number;
  negativeMarkingEnabled: boolean;
  negativeMarkingPenalty: number;
  partialCreditEnabled: boolean;
}

export class ScoringService {
  private static instance: ScoringService;
  private config: QuizScoringConfig;

  private constructor(config?: Partial<QuizScoringConfig>) {
    this.config = {
      basePointsPerQuestion: 1,
      timeBonusEnabled: true,
      timeBonusMultiplier: 0.1,
      difficultyBonusEnabled: true,
      streakBonusEnabled: true,
      streakBonusThreshold: 3,
      streakBonusPoints: 0.5,
      negativeMarkingEnabled: false,
      negativeMarkingPenalty: 0.25,
      partialCreditEnabled: true,
      ...config
    };
  }

  static getInstance(config?: Partial<QuizScoringConfig>): ScoringService {
    if (!ScoringService.instance) {
      ScoringService.instance = new ScoringService(config);
    }
    return ScoringService.instance;
  }

  calculateQuestionScore(params: {
    question: Question;
    evaluation: AnswerEvaluation;
    timeSpent: number;
    streak: number;
    isLastQuestion: boolean;
  }): ScoreCalculation {
    const { question, evaluation, timeSpent, streak, isLastQuestion } = params;

    let baseScore = evaluation.score;
    let timeBonus = 0;
    let difficultyBonus = 0;
    let streakBonus = 0;
    let penalty = 0;

    // Base score from evaluation
    baseScore = evaluation.isCorrect ? question.metadata.points : 0;

    // Time bonus (faster = more points)
    if (this.config.timeBonusEnabled && evaluation.isCorrect) {
      const expectedTime = question.metadata.estimatedTime;
      if (timeSpent < expectedTime) {
        const timeSaved = (expectedTime - timeSpent) / expectedTime;
        timeBonus = Math.round(baseScore * timeSaved * this.config.timeBonusMultiplier * 100) / 100;
      }
    }

    // Difficulty bonus
    if (this.config.difficultyBonusEnabled && evaluation.isCorrect) {
      const difficultyMultipliers: Record<DifficultyLevel, number> = {
        easy: 1,
        medium: 1.2,
        hard: 1.5,
        expert: 2
      };
      difficultyBonus = baseScore * (difficultyMultipliers[question.metadata.difficulty || "medium"] - 1);
    }

    // Streak bonus
    if (this.config.streakBonusEnabled && evaluation.isCorrect && streak >= this.config.streakBonusThreshold) {
      streakBonus = this.config.streakBonusPoints * Math.floor(streak / this.config.streakBonusThreshold);
    }

    // Penalty for wrong answers (negative marking)
    if (this.config.negativeMarkingEnabled && !evaluation.isCorrect && !evaluation.isPartiallyCorrect) {
      penalty = -this.config.negativeMarkingPenalty;
    }

    const totalScore = Math.max(0, baseScore + timeBonus + difficultyBonus + streakBonus + penalty);
    const maxScore = question.metadata.points * 2; // Maximum possible with all bonuses

    return {
      baseScore,
      timeBonus,
      difficultyBonus,
      streakBonus,
      penalty,
      totalScore,
      maxScore
    };
  }

  calculateQuizScore(calculations: ScoreCalculation[]): {
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
  } {
    const totalScore = calculations.reduce((sum, c) => sum + c.totalScore, 0);
    const maxPossibleScore = calculations.reduce((sum, c) => sum + c.maxScore, 0);

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    return {
      totalScore,
      maxPossibleScore,
      percentage
    };
  }

  calculatePartialCredit(params: {
    correctParts: number;
    totalParts: number;
    pointsPerPart: number;
    penaltyPerWrong: number;
  }): number {
    const { correctParts, totalParts, pointsPerPart, penaltyPerWrong } = params;

    let score = correctParts * pointsPerPart;
    const wrongParts = totalParts - correctParts;
    score -= wrongParts * penaltyPerWrong;

    return Math.max(0, score);
  }

  calculateFormulaScore(params: {
    correctSteps: number;
    totalSteps: number;
    finalAnswerCorrect: boolean;
    pointsPerStep: number;
    finalAnswerPoints: number;
  }): number {
    const { correctSteps, totalSteps, finalAnswerCorrect, pointsPerStep, finalAnswerPoints } = params;

    const stepScore = (correctSteps / totalSteps) * pointsPerStep * totalSteps;
    const finalScore = finalAnswerCorrect ? finalAnswerPoints : 0;

    // Must have final answer correct to get full credit
    if (!finalAnswerCorrect && correctSteps > totalSteps * 0.5) {
      // Partial credit for mostly correct steps but wrong final answer
      return stepScore * 0.7;
    }

    return stepScore + finalScore;
  }

  calculateMatchingScore(params: {
    correctMatches: number;
    totalPairs: number;
    pointsPerMatch: number;
  }): number {
    const { correctMatches, totalPairs, pointsPerMatch } = params;
    return (correctMatches / totalPairs) * pointsPerMatch * totalPairs;
  }

  calculateSequenceScore(params: {
    correctPositions: number;
    totalItems: number;
    pointsPerItem: number;
    creditPerAdjacentSwap: number;
  }): number {
    const { correctPositions, totalItems, pointsPerItem, creditPerAdjacentSwap } = params;

    const baseScore = (correctPositions / totalItems) * pointsPerItem * totalItems;
    const incorrectPositions = totalItems - correctPositions;
    const adjacencyPenalty = incorrectPositions * creditPerAdjacentSwap;

    return Math.max(0, baseScore - adjacencyPenalty);
  }

  getGradeScale(): GradeScale[] {
    return [
      {
        letter: "A+",
        minPercentage: 97,
        maxPercentage: 100,
        gpa: 4.0,
        description: "Exceptional"
      },
      {
        letter: "A",
        minPercentage: 93,
        maxPercentage: 96,
        gpa: 4.0,
        description: "Excellent"
      },
      {
        letter: "A-",
        minPercentage: 90,
        maxPercentage: 92,
        gpa: 3.7,
        description: "Very Good"
      },
      {
        letter: "B+",
        minPercentage: 87,
        maxPercentage: 89,
        gpa: 3.3,
        description: "Good"
      },
      {
        letter: "B",
        minPercentage: 83,
        maxPercentage: 86,
        gpa: 3.0,
        description: "Above Average"
      },
      {
        letter: "B-",
        minPercentage: 80,
        maxPercentage: 82,
        gpa: 2.7,
        description: "Good"
      },
      {
        letter: "C+",
        minPercentage: 77,
        maxPercentage: 79,
        gpa: 2.3,
        description: "Satisfactory"
      },
      {
        letter: "C",
        minPercentage: 73,
        maxPercentage: 76,
        gpa: 2.0,
        description: "Average"
      },
      {
        letter: "C-",
        minPercentage: 70,
        maxPercentage: 72,
        gpa: 1.7,
        description: "Below Average"
      },
      {
        letter: "D+",
        minPercentage: 67,
        maxPercentage: 69,
        gpa: 1.3,
        description: "Poor"
      },
      {
        letter: "D",
        minPercentage: 63,
        maxPercentage: 66,
        gpa: 1.0,
        description: "Poor"
      },
      {
        letter: "D-",
        minPercentage: 60,
        maxPercentage: 62,
        gpa: 0.7,
        description: "Poor"
      },
      {
        letter: "F",
        minPercentage: 0,
        maxPercentage: 59,
        gpa: 0.0,
        description: "Fail"
      }
    ];
  }

  getGrade(percentage: number): GradeScale {
    const scale = this.getGradeScale();
    return scale.find(g => percentage >= g.minPercentage && percentage <= g.maxPercentage) || scale[scale.length - 1];
  }

  isPassing(percentage: number, passingScore: number = 70): boolean {
    return percentage >= passingScore;
  }

  calculateWeightedScore(params: {
    scores: Array<{ score: number; weight: number }>;
  }): number {
    const { scores } = params;

    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
    return weightedSum / totalWeight;
  }

  calculatePointsNeeded(currentScore: number, targetPercentage: number, maxScore: number): number {
    const currentPercentage = (currentScore / maxScore) * 100;
    const pointsNeeded = ((targetPercentage - currentPercentage) / 100) * maxScore;
    return Math.max(0, pointsNeeded);
  }

  calculatePercentageFromScore(score: number, maxScore: number): number {
    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }

  normalizeScore(rawScore: number, maxPossible: number, targetMax: number = 100): number {
    if (maxPossible === 0) return 0;
    return (rawScore / maxPossible) * targetMax;
  }

  getPointsBreakdown(result: QuizResult): {
    earned: number;
    possible: number;
    fromCorrect: number;
    fromTimeBonus: number;
    fromDifficultyBonus: number;
    fromStreaks: number;
    penalties: number;
  } {
    let fromCorrect = 0;
    let fromTimeBonus = 0;
    let fromDifficultyBonus = 0;
    let fromStreaks = 0;
    let penalties = 0;

    result.questionResults.forEach(qr => {
      if (qr.evaluation.isCorrect) {
        fromCorrect += qr.pointsEarned;
      } else if (qr.pointsEarned < 0) {
        penalties += qr.pointsEarned;
      }
    });

    return {
      earned: result.summary.score,
      possible: result.summary.maxScore,
      fromCorrect,
      fromTimeBonus,
      fromDifficultyBonus,
      fromStreaks,
      penalties
    };
  }

  setConfig(config: Partial<QuizScoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): QuizScoringConfig {
    return { ...this.config };
  }

  destroy(): void {
    ScoringService.instance = null as any;
  }
}

export default ScoringService;
