// Adaptive Quiz Engine — DifficultyProfile Model
// Adaptive difficulty tracking and adjustment data structures

import type { DifficultyLevel } from "./Question";

export interface DifficultyThreshold {
  level: DifficultyLevel;
  accuracyMin: number;
  accuracyMax: number;
  timeMultiplier: number;
  streakRequirement: number;
}

export interface UserDifficultyProfile {
  userId: string;
  currentLevel: DifficultyLevel;
  levelHistory: DifficultyLevelChange[];
  performanceMetrics: DifficultyPerformanceMetrics;
  adjustmentHistory: DifficultyAdjustment[];
  preferences: UserDifficultyPreferences;
  lastUpdated: Date;
}

export interface DifficultyLevelChange {
  fromLevel: DifficultyLevel;
  toLevel: DifficultyLevel;
  reason: string;
  timestamp: Date;
  performanceSnapshot: {
    accuracy: number;
    averageTime: number;
    streakCount: number;
  };
}

export interface DifficultyPerformanceMetrics {
  overall: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    averageTime: number;
    standardDeviation: number;
  };
  byDifficulty: Record<DifficultyLevel, {
    total: number;
    correct: number;
    accuracy: number;
    averageTime: number;
    averageTimeVsExpected: number;
  }>;
  recentPerformance: {
    last10Accuracy: number;
    last20Accuracy: number;
    last50Accuracy: number;
    trend: "improving" | "stable" | "declining";
  };
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    averageStreak: number;
    streakByDifficulty: Record<DifficultyLevel, number>;
  };
}

export interface DifficultyAdjustment {
  id: string;
  timestamp: Date;
  fromLevel: DifficultyLevel;
  toLevel: DifficultyLevel;
  trigger: AdjustmentTrigger;
  metrics: {
    accuracy: number;
    timeRatio: number;
    confidence: number;
    streak: number;
  };
  isAutomatic: boolean;
  overrideReason?: string;
}

export type AdjustmentTrigger =
  | "accuracy_threshold"
  | "time_threshold"
  | "streak_threshold"
  | "performance_decline"
  | "confidence_drop"
  | "manual_override"
  | "question_completion"
  | "session_boundary";

export interface UserDifficultyPreferences {
  preferredDifficulty?: DifficultyLevel;
  autoAdjust: boolean;
  maxDifficulty?: DifficultyLevel;
  minDifficulty?: DifficultyLevel;
  difficultyLockUntil?: Date;
  customThresholds?: DifficultyThreshold[];
}

export interface DifficultyTransitionRule {
  fromLevel: DifficultyLevel;
  toLevel: DifficultyLevel;
  conditions: TransitionCondition[];
  priority: number;
  description: string;
}

export interface TransitionCondition {
  type: "accuracy" | "time" | "streak" | "combined" | "consecutive_mistakes" | "consecutive_correct";
  operator: ">" | ">=" | "<" | "<=" | "==" | "between";
  value: number | number[];
  weight: number;
  window?: number;
}

export interface AdaptiveDifficultyConfig {
  enabled: boolean;
  initialLevel: DifficultyLevel;
  minLevel: DifficultyLevel;
  maxLevel: DifficultyLevel;
  adjustmentMode: "per_question" | "per_quiz" | "hybrid";
  thresholds: DifficultyThreshold[];
  transitionRules: DifficultyTransitionRule[];
  stabilizationSettings: StabilizationSettings;
  performanceWeights: PerformanceWeights;
}

export interface StabilizationSettings {
  enabled: boolean;
  questionsToConfirm: number;
  accuracyWindow: number;
  timeWindow: number;
  streakRequirement: number;
  cooldownPeriod: number;
}

export interface PerformanceWeights {
  accuracy: number;
  time: number;
  streak: number;
  confidence: number;
  consistency: number;
}

export interface DifficultyPrediction {
  estimatedLevel: DifficultyLevel;
  confidence: number;
  factors: PredictionFactor[];
  recommendedNextLevel: DifficultyLevel;
}

export interface PredictionFactor {
  name: string;
  contribution: number;
  direction: "increase" | "decrease" | "neutral";
  weight: number;
}

export interface DifficultyHistory {
  sessionId: string;
  userId: string;
  startLevel: DifficultyLevel;
  endLevel: DifficultyLevel;
  questionsAttempted: DifficultyQuestionAttempt[];
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    averageTime: number;
    levelChanges: number;
  };
  timestamp: Date;
}

export interface DifficultyQuestionAttempt {
  questionId: string;
  difficulty: DifficultyLevel;
  isCorrect: boolean;
  timeSpent: number;
  expectedTime?: number;
  confidence?: number;
  hintUsed: boolean;
}

export interface DifficultyAnalytics {
  userId: string;
  period: { start: Date; end: Date };
  levelDistribution: Record<DifficultyLevel, number>;
  accuracyByLevel: Record<DifficultyLevel, number>;
  timeByLevel: Record<DifficultyLevel, number>;
  progressionRate: number;
  regressionsRate: number;
  stabilizationCount: number;
  breakthroughCount: number;
  mostCommonTransitions: Array<{
    from: DifficultyLevel;
    to: DifficultyLevel;
    count: number;
  }>;
}

export const DEFAULT_DIFFICULTY_THRESHOLDS: DifficultyThreshold[] = [
  {
    level: "easy",
    accuracyMin: 0,
    accuracyMax: 50,
    timeMultiplier: 1.5,
    streakRequirement: 3
  },
  {
    level: "medium",
    accuracyMin: 50,
    accuracyMax: 70,
    timeMultiplier: 1.0,
    streakRequirement: 4
  },
  {
    level: "hard",
    accuracyMin: 70,
    accuracyMax: 85,
    timeMultiplier: 0.8,
    streakRequirement: 5
  },
  {
    level: "expert",
    accuracyMin: 85,
    accuracyMax: 100,
    timeMultiplier: 0.6,
    streakRequirement: 6
  }
];

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveDifficultyConfig = {
  enabled: true,
  initialLevel: "medium",
  minLevel: "easy",
  maxLevel: "expert",
  adjustmentMode: "per_question",
  thresholds: DEFAULT_DIFFICULTY_THRESHOLDS,
  transitionRules: [],
  stabilizationSettings: {
    enabled: true,
    questionsToConfirm: 5,
    accuracyWindow: 5,
    timeWindow: 5,
    streakRequirement: 3,
    cooldownPeriod: 2
  },
  performanceWeights: {
    accuracy: 0.5,
    time: 0.2,
    streak: 0.2,
    confidence: 0.05,
    consistency: 0.05
  }
};

export function createDifficultyProfile(userId: string, initialLevel: DifficultyLevel = "medium"): UserDifficultyProfile {
  return {
    userId,
    currentLevel: initialLevel,
    levelHistory: [],
    performanceMetrics: {
      overall: {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        averageTime: 0,
        standardDeviation: 0
      },
      byDifficulty: {
        easy: { total: 0, correct: 0, accuracy: 0, averageTime: 0, averageTimeVsExpected: 0 },
        medium: { total: 0, correct: 0, accuracy: 0, averageTime: 0, averageTimeVsExpected: 0 },
        hard: { total: 0, correct: 0, accuracy: 0, averageTime: 0, averageTimeVsExpected: 0 },
        expert: { total: 0, correct: 0, accuracy: 0, averageTime: 0, averageTimeVsExpected: 0 }
      },
      recentPerformance: {
        last10Accuracy: 0,
        last20Accuracy: 0,
        last50Accuracy: 0,
        trend: "stable"
      },
      streakInfo: {
        currentStreak: 0,
        longestStreak: 0,
        averageStreak: 0,
        streakByDifficulty: {
          easy: 0,
          medium: 0,
          hard: 0,
          expert: 0
        }
      }
    },
    adjustmentHistory: [],
    preferences: {
      autoAdjust: true,
      minDifficulty: "easy",
      maxDifficulty: "expert"
    },
    lastUpdated: new Date()
  };
}

export function calculateDifficultyAccuracy(difficulty: DifficultyLevel, thresholds: DifficultyThreshold[]): number {
  const threshold = thresholds.find(t => t.level === difficulty);
  return threshold ? (threshold.accuracyMin + threshold.accuracyMax) / 2 : 50;
}

export function getNextDifficultyLevel(
  current: DifficultyLevel,
  direction: "up" | "down",
  config: AdaptiveDifficultyConfig
): DifficultyLevel {
  const levels: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];
  const currentIndex = levels.indexOf(current);

  if (direction === "up" && currentIndex < levels.length - 1) {
    const nextLevel = levels[currentIndex + 1];
    if (config.maxLevel && levels.indexOf(nextLevel) > levels.indexOf(config.maxLevel)) {
      return config.maxLevel;
    }
    return nextLevel;
  }

  if (direction === "down" && currentIndex > 0) {
    const prevLevel = levels[currentIndex - 1];
    if (config.minLevel && levels.indexOf(prevLevel) < levels.indexOf(config.minLevel)) {
      return config.minLevel;
    }
    return prevLevel;
  }

  return current;
}

export function evaluateTransitionConditions(
  conditions: TransitionCondition[],
  metrics: {
    accuracy: number;
    timeRatio: number;
    streak: number;
    consecutiveCorrect: number;
    consecutiveMistakes: number;
  }
): boolean {
  return conditions.every(condition => {
    switch (condition.type) {
      case "accuracy":
        return evaluateCondition(condition, metrics.accuracy);
      case "time":
        return evaluateCondition(condition, metrics.timeRatio);
      case "streak":
        return evaluateCondition(condition, metrics.streak);
      case "consecutive_correct":
        return evaluateCondition(condition, metrics.consecutiveCorrect);
      case "consecutive_mistakes":
        return evaluateCondition(condition, metrics.consecutiveMistakes);
      case "combined":
        const accuracyMet = evaluateCondition({ ...condition, type: "accuracy" }, metrics.accuracy);
        const timeMet = evaluateCondition({ ...condition, type: "time" }, metrics.timeRatio);
        return (accuracyMet && timeMet) || (condition.weight >= 0.5 && (accuracyMet || timeMet));
      default:
        return true;
    }
  });
}

function evaluateCondition(condition: TransitionCondition, value: number): boolean {
  const { operator, value: conditionValue } = condition;

  switch (operator) {
    case ">": return value > (conditionValue as number);
    case ">=": return value >= (conditionValue as number);
    case "<": return value < (conditionValue as number);
    case "<=": return value <= (conditionValue as number);
    case "==": return value === (conditionValue as number);
    case "between":
      const [min, max] = conditionValue as number[];
      return value >= min && value <= max;
    default:
      return false;
  }
}
