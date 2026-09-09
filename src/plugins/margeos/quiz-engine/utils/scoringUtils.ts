// Adaptive Quiz Engine — Scoring Utils
// Utility functions for scoring calculations

import type { DifficultyLevel } from "../models/Question";

export interface ScoreBreakdown {
  baseScore: number;
  timeBonus: number;
  difficultyBonus: number;
  streakBonus: number;
  penalties: number;
  totalScore: number;
  maxScore: number;
}

export interface GradeInfo {
  letter: string;
  percentage: number;
  description: string;
  color: string;
}

export const GRADE_SCALE: GradeInfo[] = [
  { letter: "A+", percentage: 97, description: "Exceptional", color: "#22c55e" },
  { letter: "A", percentage: 93, description: "Excellent", color: "#22c55e" },
  { letter: "A-", percentage: 90, description: "Very Good", color: "#84cc16" },
  { letter: "B+", percentage: 87, description: "Good", color: "#84cc16" },
  { letter: "B", percentage: 83, description: "Above Average", color: "#eab308" },
  { letter: "B-", percentage: 80, description: "Good", color: "#eab308" },
  { letter: "C+", percentage: 77, description: "Satisfactory", color: "#f97316" },
  { letter: "C", percentage: 73, description: "Average", color: "#f97316" },
  { letter: "C-", percentage: 70, description: "Below Average", color: "#f97316" },
  { letter: "D+", percentage: 67, description: "Poor", color: "#ef4444" },
  { letter: "D", percentage: 63, description: "Poor", color: "#ef4444" },
  { letter: "D-", percentage: 60, description: "Poor", color: "#ef4444" },
  { letter: "F", percentage: 0, description: "Fail", color: "#dc2626" }
];

export const DEFAULT_PASSING_SCORE = 70;

export function calculateTotalScore(breakdown: ScoreBreakdown): number {
  return breakdown.baseScore + breakdown.timeBonus +
         breakdown.difficultyBonus + breakdown.streakBonus - breakdown.penalties;
}

export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100 * 100) / 100;
}

export function getGradeInfo(percentage: number): GradeInfo {
  return GRADE_SCALE.find(g => percentage >= g.percentage) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

export function isPassing(percentage: number, passingScore: number = DEFAULT_PASSING_SCORE): boolean {
  return percentage >= passingScore;
}

export function calculatePointsNeeded(
  currentScore: number,
  maxScore: number,
  targetPercentage: number
): number {
  const targetScore = (targetPercentage / 100) * maxScore;
  return Math.max(0, targetScore - currentScore);
}

export function calculateTimeBonus(
  baseScore: number,
  expectedTime: number,
  actualTime: number,
  maxBonus: number = 0.2
): number {
  if (actualTime >= expectedTime) return 0;

  const timeSaved = (expectedTime - actualTime) / expectedTime;
  return Math.round(baseScore * Math.min(timeSaved, maxBonus) * 100) / 100;
}

export function calculateDifficultyBonus(
  baseScore: number,
  difficulty: DifficultyLevel
): number {
  const multipliers: Record<DifficultyLevel, number> = {
    easy: 0,
    medium: 0.2,
    hard: 0.5,
    expert: 1.0
  };

  return Math.round(baseScore * multipliers[difficulty] * 100) / 100;
}

export function calculateStreakBonus(
  baseScore: number,
  streak: number,
  threshold: number = 3,
  bonusPerStreak: number = 0.1
): number {
  if (streak < threshold) return 0;

  const streakMultiplier = Math.floor((streak - threshold + 1) * bonusPerStreak);
  return Math.round(baseScore * Math.min(streakMultiplier, 0.5) * 100) / 100;
}

export function calculateNegativeMarking(
  wrongAnswerPenalty: number,
  wrongAnswers: number
): number {
  return wrongAnswerPenalty * wrongAnswers;
}

export function calculatePartialCredit(
  correctParts: number,
  totalParts: number,
  pointsPerPart: number
): number {
  return (correctParts / totalParts) * pointsPerPart * totalParts;
}

export function formatScore(score: number, decimals: number = 1): string {
  return score.toFixed(decimals);
}

export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${percentage.toFixed(decimals)}%`;
}

export function getScoreColor(percentage: number): string {
  const grade = getGradeInfo(percentage);
  return grade.color;
}

export function getScoreLabel(percentage: number): string {
  if (percentage >= 90) return "Excellent!";
  if (percentage >= 80) return "Great job!";
  if (percentage >= 70) return "Good work!";
  if (percentage >= 60) return "Keep practicing!";
  if (percentage >= 50) return "Room for improvement";
  return "Need more practice";
}

export function calculateWeightedAverage(
  scores: Array<{ value: number; weight: number }>
): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scores.reduce((sum, s) => sum + s.value * s.weight, 0);
  return weightedSum / totalWeight;
}

export function calculateImprovement(
  previousScore: number,
  currentScore: number
): { absolute: number; percentage: number; direction: "improving" | "declining" | "stable" } {
  const absolute = currentScore - previousScore;
  const percentage = previousScore !== 0 ? (absolute / previousScore) * 100 : 0;

  let direction: "improving" | "declining" | "stable" = "stable";
  if (absolute > 5) direction = "improving";
  else if (absolute < -5) direction = "declining";

  return { absolute, percentage, direction };
}
