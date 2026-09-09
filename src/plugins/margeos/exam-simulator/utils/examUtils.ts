// @ts-nocheck
/**
 * examUtils.ts
 *
 * Utility functions for exam operations.
 */

import type { Exam, ExamQuestion } from '../models';
import type { ExamSession } from '../models/ExamSession';

/**
 * Format exam duration
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

/**
 * Format time in seconds
 */
export function formatTimeSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate exam progress
 */
export function calculateProgress(session: ExamSession): {
  answered: number;
  total: number;
  percentage: number;
  unanswered: number;
} {
  const total = session.navigation.questionOrder.length;
  const answered = session.answers.length;
  const unanswered = total - answered;
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return { answered, total, percentage, unanswered };
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get difficulty label
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty < 0.3) return 'Easy';
  if (difficulty < 0.6) return 'Medium';
  return 'Hard';
}

/**
 * Get question type label
 */
export function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    MCQ: 'Multiple Choice',
    T_F: 'True/False',
    SHORT_ANSWER: 'Short Answer',
    MULTI_SELECT: 'Multiple Select',
    ESSAY: 'Essay',
    MATCHING: 'Matching'
  };
  return labels[type] || type;
}

/**
 * Get exam mode label
 */
export function getExamModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    practice: 'Practice',
    chapter: 'Chapter Test',
    subject: 'Subject Test',
    comprehensive: 'Comprehensive',
    custom: 'Custom',
    revision: 'Revision',
    adaptive: 'Adaptive'
  };
  return labels[mode] || mode;
}

/**
 * Validate exam answers
 */
export function validateAnswers(
  exam: Exam,
  answers: Map<string, any>
): {
    valid: boolean;
    missing: string[];
    invalid: string[];
  } {
  const missing: string[] = [];
  const invalid: string[] = [];

  exam.questions.forEach(q => {
    if (!answers.has(q.id)) {
      missing.push(q.id);
    } else {
      const answer = answers.get(q.id);
      if (answer === undefined || answer === null || answer === '') {
        invalid.push(q.id);
      }
    }
  });

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid
  };
}

/**
 * Get question status for navigation
 */
export function getQuestionStatus(
  questionId: string,
  session: ExamSession
): 'unanswered' | 'answered' | 'flagged' | 'current' {
  const isAnswered = session.answers.some(a => a.questionId === questionId);
  const isFlagged = session.navigation.flaggedQuestions.includes(questionId);
  const isCurrent = session.navigation.questionOrder[session.currentQuestionIndex] === questionId;

  if (isCurrent) return 'current';
  if (isFlagged) return 'flagged';
  if (isAnswered) return 'answered';
  return 'unanswered';
}

/**
 * Generate exam summary
 */
export function generateExamSummary(exam: Exam): {
  totalQuestions: number;
  totalPoints: number;
  estimatedTime: number;
  topics: string[];
} {
  const totalQuestions = exam.questions.length;
  const totalPoints = exam.questions.reduce((sum, q) => sum + (q.content.points || 1), 0);
  const estimatedTime = exam.questions.reduce((sum, q) => sum + (q.content.timeAllocation || 60), 0);
  const topics = [...new Set(exam.questions.map(q => q.content.topic))];

  return {
    totalQuestions,
    totalPoints,
    estimatedTime,
    topics
  };
}

/**
 * Compare answers
 */
export function compareAnswers(
  userAnswer: any,
  correctAnswer: string
): boolean {
  if (userAnswer === undefined || userAnswer === null) return false;

  if (typeof userAnswer === 'boolean') {
    return correctAnswer.toLowerCase() === (userAnswer ? 'true' : 'false');
  }

  if (typeof userAnswer === 'string') {
    return userAnswer.toUpperCase() === correctAnswer.toUpperCase();
  }

  if (Array.isArray(userAnswer)) {
    const correct = correctAnswer.split('').sort();
    const user = [...userAnswer].sort();
    return JSON.stringify(correct) === JSON.stringify(user);
  }

  return false;
}

/**
 * Get option letter
 */
export function getOptionLetter(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C, D...
}

/**
 * Parse option to index
 */
export function parseOptionToIndex(option: string): number {
  return option.toUpperCase().charCodeAt(0) - 65;
}

/**
 * Get grade from percentage
 */
export function getGrade(percentage: number): string {
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
 * Get grade color
 */
export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#10b981'; // Green
  if (grade.startsWith('B')) return '#22c55e'; // Light green
  if (grade.startsWith('C')) return '#eab308'; // Yellow
  if (grade.startsWith('D')) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Calculate passing status
 */
export function isPassing(percentage: number, passingScore: number = 60): boolean {
  return percentage >= passingScore;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
