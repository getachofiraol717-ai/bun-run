// Adaptive Quiz Engine — Difficulty Utils
// Utility functions for difficulty calculations

import type { DifficultyLevel } from "../models/Question";

export const DIFFICULTY_ORDER: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert"
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: "#22c55e",
  medium: "#eab308",
  hard: "#f97316",
  expert: "#ef4444"
};

export const DIFFICULTY_DESCRIPTIONS: Record<DifficultyLevel, string> = {
  easy: "Basic questions testing fundamental understanding",
  medium: "Questions requiring application of concepts",
  hard: "Complex problems requiring analysis and reasoning",
  expert: "Advanced challenges testing mastery and synthesis"
};

export const DIFFICULTY_MULTIPLIERS: Record<DifficultyLevel, number> = {
  easy: 1.0,
  medium: 1.25,
  hard: 1.5,
  expert: 2.0
};

export const DIFFICULTY_TIME_MULTIPLIERS: Record<DifficultyLevel, number> = {
  easy: 1.5,
  medium: 1.0,
  hard: 0.8,
  expert: 0.6
};

export const DIFFICULTY_THRESHOLDS = {
  advance: {
    easy: { accuracyMin: 75, streakMin: 4 },
    medium: { accuracyMin: 80, streakMin: 5 },
    hard: { accuracyMin: 85, streakMin: 6 },
    expert: { accuracyMin: 90, streakMin: 7 }
  },
  retreat: {
    easy: { accuracyMax: 30, mistakesMax: 3 },
    medium: { accuracyMax: 40, mistakesMax: 3 },
    hard: { accuracyMax: 50, mistakesMax: 2 },
    expert: { accuracyMax: 60, mistakesMax: 2 }
  }
};

export function getDifficultyIndex(level: DifficultyLevel): number {
  return DIFFICULTY_ORDER.indexOf(level);
}

export function getNextDifficulty(current: DifficultyLevel): DifficultyLevel {
  const index = getDifficultyIndex(current);
  return index < DIFFICULTY_ORDER.length - 1 ? DIFFICULTY_ORDER[index + 1] : current;
}

export function getPreviousDifficulty(current: DifficultyLevel): DifficultyLevel {
  const index = getDifficultyIndex(current);
  return index > 0 ? DIFFICULTY_ORDER[index - 1] : current;
}

export function isValidDifficulty(level: string): level is DifficultyLevel {
  return DIFFICULTY_ORDER.includes(level as DifficultyLevel);
}

export function calculateDifficultyScore(
  accuracy: number,
  streak: number,
  currentLevel: DifficultyLevel
): {
  shouldAdvance: boolean;
  shouldRetreat: boolean;
  recommendedLevel: DifficultyLevel;
} {
  const thresholds = DIFFICULTY_THRESHOLDS;

  // Check if should advance
  const advanceThreshold = thresholds.advance[currentLevel];
  const shouldAdvance =
    accuracy >= advanceThreshold.accuracyMin &&
    streak >= advanceThreshold.streakMin;

  // Check if should retreat
  const retreatThreshold = thresholds.retreat[currentLevel];
  const shouldRetreat =
    accuracy <= retreatThreshold.accuracyMax ||
    streak >= retreatThreshold.mistakesMax * -1;

  let recommendedLevel = currentLevel;

  if (shouldAdvance && currentLevel !== "expert") {
    recommendedLevel = getNextDifficulty(currentLevel);
  } else if (shouldRetreat && currentLevel !== "easy") {
    recommendedLevel = getPreviousDifficulty(currentLevel);
  }

  return {
    shouldAdvance,
    shouldRetreat,
    recommendedLevel
  };
}

export function getDifficultyForScore(percentage: number): DifficultyLevel {
  if (percentage >= 90) return "expert";
  if (percentage >= 75) return "hard";
  if (percentage >= 60) return "medium";
  return "easy";
}

export function formatDifficulty(level: DifficultyLevel): string {
  return DIFFICULTY_LABELS[level] || level;
}

export function getDifficultyColor(level: DifficultyLevel): string {
  return DIFFICULTY_COLORS[level] || "#6b7280";
}

export function getDifficultyMultiplier(level: DifficultyLevel): number {
  return DIFFICULTY_MULTIPLIERS[level] || 1.0;
}

export function calculatePointsForDifficulty(
  basePoints: number,
  difficulty: DifficultyLevel
): number {
  return Math.round(basePoints * getDifficultyMultiplier(difficulty));
}

export function estimateTimeForDifficulty(
  baseTime: number,
  difficulty: DifficultyLevel
): number {
  const multiplier = DIFFICULTY_TIME_MULTIPLIERS[difficulty] || 1.0;
  return Math.round(baseTime * multiplier);
}

export function compareDifficulties(a: DifficultyLevel, b: DifficultyLevel): number {
  return getDifficultyIndex(a) - getDifficultyIndex(b);
}

export function getDifficultiesInRange(
  min: DifficultyLevel,
  max: DifficultyLevel
): DifficultyLevel[] {
  const minIndex = getDifficultyIndex(min);
  const maxIndex = getDifficultyIndex(max);

  return DIFFICULTY_ORDER.slice(minIndex, maxIndex + 1);
}
