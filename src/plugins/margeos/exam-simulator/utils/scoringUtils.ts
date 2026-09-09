// @ts-nocheck
/**
 * scoringUtils.ts
 *
 * Utility functions for scoring operations.
 */

import type { ExamQuestion, QuestionResult } from '../models';

/**
 * Calculate question score
 */
export function calculateQuestionScore(
  question: ExamQuestion,
  userAnswer: any,
  options: {
    enablePartialCredit?: boolean;
    enableNegativeMarking?: boolean;
    negativeMarkingRatio?: number;
  } = {}
): {
  score: number;
  isCorrect: boolean;
  partialCredit: number;
  negativeMarking: number;
} {
  const {
    enablePartialCredit = true,
    enableNegativeMarking = false,
    negativeMarkingRatio = 0.25
  } = options;

  const maxScore = question.content.points || 1;
  const correctAnswer = question.content.correctAnswer;

  switch (question.content.type) {
    case 'MCQ':
    case 'T_F':
      return calculateMCQScore(userAnswer, correctAnswer, maxScore, enableNegativeMarking, negativeMarkingRatio);

    case 'MULTI_SELECT':
      return calculateMultiSelectScore(userAnswer, correctAnswer, maxScore, enablePartialCredit, enableNegativeMarking, negativeMarkingRatio);

    case 'SHORT_ANSWER':
      return calculateShortAnswerScore(userAnswer, correctAnswer, maxScore, enableNegativeMarking, negativeMarkingRatio);

    case 'MATCHING':
      return calculateMatchingScore(userAnswer, correctAnswer, maxScore, enablePartialCredit);

    default:
      return { score: 0, isCorrect: false, partialCredit: 0, negativeMarking: 0 };
  }
}

/**
 * Calculate MCQ score
 */
function calculateMCQScore(
  userAnswer: any,
  correctAnswer: string,
  maxScore: number,
  enableNegativeMarking: boolean,
  negativeMarkingRatio: number
): { score: number; isCorrect: boolean; partialCredit: number; negativeMarking: number } {
  const isCorrect = compareAnswer(userAnswer, correctAnswer);

  if (isCorrect) {
    return { score: maxScore, isCorrect: true, partialCredit: 0, negativeMarking: 0 };
  }

  if (enableNegativeMarking) {
    const negativeMarking = maxScore * negativeMarkingRatio;
    return { score: 0, isCorrect: false, partialCredit: 0, negativeMarking };
  }

  return { score: 0, isCorrect: false, partialCredit: 0, negativeMarking: 0 };
}

/**
 * Calculate multi-select score with partial credit
 */
function calculateMultiSelectScore(
  userAnswer: any,
  correctAnswer: string,
  maxScore: number,
  enablePartialCredit: boolean,
  enableNegativeMarking: boolean,
  negativeMarkingRatio: number
): { score: number; isCorrect: boolean; partialCredit: number; negativeMarking: number } {
  if (!Array.isArray(userAnswer)) {
    return { score: 0, isCorrect: false, partialCredit: 0, negativeMarking: maxScore * negativeMarkingRatio };
  }

  const correctOptions = correctAnswer.split('').sort();
  const userOptions = [...userAnswer].sort();

  // Complete match
  if (JSON.stringify(correctOptions) === JSON.stringify(userOptions)) {
    return { score: maxScore, isCorrect: true, partialCredit: 0, negativeMarking: 0 };
  }

  if (!enablePartialCredit) {
    return { score: 0, isCorrect: false, partialCredit: 0, negativeMarking: maxScore * negativeMarkingRatio };
  }

  // Calculate partial credit
  const correctCount = userOptions.filter(o => correctOptions.includes(o)).length;
  const incorrectCount = userOptions.filter(o => !correctOptions.includes(o)).length;
  const missedCount = correctOptions.filter(o => !userOptions.includes(o)).length;

  const partialPercentage = correctCount / correctOptions.length;
  let finalScore = maxScore * partialPercentage;
  let negativeMarking = 0;

  if (enableNegativeMarking) {
    negativeMarking = (incorrectCount / correctOptions.length) * maxScore * negativeMarkingRatio;
    finalScore = Math.max(0, finalScore - negativeMarking);
  }

  return {
    score: Math.round(finalScore * 100) / 100,
    isCorrect: false,
    partialCredit: maxScore * partialPercentage,
    negativeMarking
  };
}

/**
 * Calculate short answer score
 */
function calculateShortAnswerScore(
  userAnswer: any,
  correctAnswer: string,
  maxScore: number,
  enableNegativeMarking: boolean,
  negativeMarkingRatio: number
): { score: number; isCorrect: boolean; partialCredit: number; negativeMarking: number } {
  if (typeof userAnswer !== 'string') {
    return { score: 0, isCorrect: false, partialCredit: 0, negativeMarking: maxScore * negativeMarkingRatio };
  }

  const normalize = (text: string) =>
    text.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;]/g, '');

  const isCorrect = normalize(userAnswer) === normalize(correctAnswer);

  if (isCorrect) {
    return { score: maxScore, isCorrect: true, partialCredit: 0, negativeMarking: 0 };
  }

  // Check for partial credit with keyword matching
  const correctWords = normalize(correctAnswer).split(' ');
  const userWords = normalize(userAnswer).split(' ');
  const matchingWords = correctWords.filter(w => userWords.includes(w));
  const partialPercentage = matchingWords.length / correctWords.length;

  if (partialPercentage > 0.5 && enablePartialCredit) {
    const partialScore = maxScore * partialPercentage * 0.5; // Max 50% for partial
    return { score: partialScore, isCorrect: false, partialCredit: partialScore, negativeMarking: 0 };
  }

  return { score: 0, isCorrect: false, partialCredit: 0, negativeMarking: 0 };
}

/**
 * Calculate matching score
 */
function calculateMatchingScore(
  userAnswer: any,
  correctAnswer: string,
  maxScore: number,
  enablePartialCredit: boolean
): { score: number; isCorrect: boolean; partialCredit: number; negativeMarking: number } {
  if (!userAnswer || typeof userAnswer !== 'object') {
    return { score: 0, isCorrect: false, partialCredit: 0, negativeMarking: 0 };
  }

  // Simplified matching calculation
  const entries = Object.entries(userAnswer);
  const correctEntries = correctAnswer.split(',').map(s => s.split(':'));

  let correctMatches = 0;
  entries.forEach(([key, value]) => {
    if (correctEntries.some(([k, v]) => k === key && v === value)) {
      correctMatches++;
    }
  });

  const percentage = correctMatches / entries.length;

  return {
    score: Math.round(maxScore * percentage * 100) / 100,
    isCorrect: percentage === 1,
    partialCredit: enablePartialCredit ? maxScore * percentage : 0,
    negativeMarking: 0
  };
}

/**
 * Compare answer helper
 */
function compareAnswer(userAnswer: any, correctAnswer: string): boolean {
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
 * Calculate exam total score
 */
export function calculateExamScore(
  questionResults: QuestionResult[]
): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
} {
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  questionResults.forEach(result => {
    totalScore += result.score;
    maxScore += result.maxScore;
    if (result.isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  });

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return {
    totalScore,
    maxScore,
    percentage,
    correctCount,
    incorrectCount
  };
}

/**
 * Calculate statistics
 */
export function calculateStatistics(scores: number[]): {
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
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    mode,
    stdDev: Math.round(stdDev * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1] - sorted[0]
  };
}

/**
 * Round score
 */
export function roundScore(value: number, method: 'round' | 'floor' | 'ceil' = 'round'): number {
  switch (method) {
    case 'floor':
      return Math.floor(value);
    case 'ceil':
      return Math.ceil(value);
    default:
      return Math.round(value);
  }
}
