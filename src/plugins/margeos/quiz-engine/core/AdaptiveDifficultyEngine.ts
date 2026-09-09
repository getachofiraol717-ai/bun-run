// @ts-nocheck
// Adaptive Quiz Engine — AdaptiveDifficultyEngine
// Dynamic difficulty adjustment based on student performance

import type {
  UserDifficultyProfile,
  DifficultyLevel,
  DifficultyAdjustment,
  AdaptiveDifficultyConfig,
  AdjustmentTrigger,
  DifficultyTransitionRule,
  TransitionCondition,
  DifficultyPerformanceMetrics
} from "../models/DifficultyProfile";
import {
  DEFAULT_ADAPTIVE_CONFIG,
  createDifficultyProfile,
  getNextDifficultyLevel,
  evaluateTransitionConditions
} from "../models/DifficultyProfile";

export interface DifficultyAdjustmentParams {
  isCorrect: boolean;
  timeSpent: number;
  expectedTime?: number;
  questionDifficulty: DifficultyLevel;
  confidence?: number;
  hintUsed?: boolean;
  consecutiveCorrect?: number;
  consecutiveMistakes?: number;
}

export class AdaptiveDifficultyEngine {
  private static instance: AdaptiveDifficultyEngine;
  private config: AdaptiveDifficultyConfig;
  private userProfiles: Map<string, UserDifficultyProfile> = new Map();
  private transitionRules: Map<string, DifficultyTransitionRule[]> = new Map();

  private constructor(config?: Partial<AdaptiveDifficultyConfig>) {
    this.config = { ...DEFAULT_ADAPTIVE_CONFIG, ...config };
    this.initializeDefaultRules();
    this.loadProfiles();
  }

  static getInstance(config?: Partial<AdaptiveDifficultyConfig>): AdaptiveDifficultyEngine {
    if (!AdaptiveDifficultyEngine.instance) {
      AdaptiveDifficultyEngine.instance = new AdaptiveDifficultyEngine(config);
    }
    return AdaptiveDifficultyEngine.instance;
  }

  private initializeDefaultRules(): void {
    const defaultRules: DifficultyTransitionRule[] = [
      {
        fromLevel: "easy",
        toLevel: "medium",
        priority: 1,
        description: "Move to medium when consistently correct",
        conditions: [
          { type: "accuracy", operator: ">=", value: 75, weight: 0.6 },
          { type: "streak", operator: ">=", value: 4, weight: 0.3 },
          { type: "time", operator: "<=", value: 1.2, weight: 0.1 }
        ]
      },
      {
        fromLevel: "medium",
        toLevel: "easy",
        priority: 1,
        description: "Drop to easy if struggling",
        conditions: [
          { type: "accuracy", operator: "<", value: 40, weight: 0.5 },
          { type: "consecutive_mistakes", operator: ">=", value: 3, weight: 0.5 }
        ]
      },
      {
        fromLevel: "medium",
        toLevel: "hard",
        priority: 1,
        description: "Advance to hard with strong performance",
        conditions: [
          { type: "accuracy", operator: ">=", value: 80, weight: 0.5 },
          { type: "streak", operator: ">=", value: 5, weight: 0.3 },
          { type: "time", operator: "<=", value: 1.0, weight: 0.2 }
        ]
      },
      {
        fromLevel: "hard",
        toLevel: "medium",
        priority: 1,
        description: "Drop to medium if hard is too difficult",
        conditions: [
          { type: "accuracy", operator: "<", value: 50, weight: 0.5 },
          { type: "consecutive_mistakes", operator: ">=", value: 2, weight: 0.5 }
        ]
      },
      {
        fromLevel: "hard",
        toLevel: "expert",
        priority: 1,
        description: "Reach expert with exceptional performance",
        conditions: [
          { type: "accuracy", operator: ">=", value: 85, weight: 0.5 },
          { type: "streak", operator: ">=", value: 6, weight: 0.3 },
          { type: "time", operator: "<=", value: 0.9, weight: 0.2 }
        ]
      },
      {
        fromLevel: "expert",
        toLevel: "hard",
        priority: 1,
        description: "Drop to hard if expert is too challenging",
        conditions: [
          { type: "accuracy", operator: "<", value: 60, weight: 0.6 },
          { type: "consecutive_mistakes", operator: ">=", value: 2, weight: 0.4 }
        ]
      }
    ];

    this.transitionRules.set("default", defaultRules);
  }

  private loadProfiles(): void {
    try {
      const stored = localStorage.getItem("quiz_difficulty_profiles");
      if (stored) {
        const profiles = JSON.parse(stored);
        Object.entries(profiles).forEach(([userId, profile]) => {
          this.userProfiles.set(userId, profile as UserDifficultyProfile);
        });
      }
    } catch (error) {
      console.warn("Failed to load difficulty profiles:", error);
    }
  }

  private saveProfiles(): void {
    try {
      const profiles: Record<string, UserDifficultyProfile> = {};
      this.userProfiles.forEach((profile, userId) => {
        profiles[userId] = profile;
      });
      localStorage.setItem("quiz_difficulty_profiles", JSON.stringify(profiles));
    } catch (error) {
      console.warn("Failed to save difficulty profiles:", error);
    }
  }

  getOrCreateProfile(userId: string, initialLevel?: DifficultyLevel): UserDifficultyProfile {
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = createDifficultyProfile(userId, initialLevel || this.config.initialLevel);
      this.userProfiles.set(userId, profile);
      this.saveProfiles();
    }
    return profile;
  }

  getProfile(userId: string): UserDifficultyProfile | undefined {
    return this.userProfiles.get(userId);
  }

  async adjustDifficulty(
    profile: UserDifficultyProfile,
    params: DifficultyAdjustmentParams
  ): Promise<UserDifficultyProfile> {
    if (!this.config.enabled) {
      return profile;
    }

    const updatedProfile = { ...profile };
    updatedProfile.performanceMetrics = { ...profile.performanceMetrics };
    updatedProfile.performanceMetrics.overall = { ...profile.performanceMetrics.overall };
    updatedProfile.performanceMetrics.byDifficulty = {
      ...profile.performanceMetrics.byDifficulty
    };
    updatedProfile.performanceMetrics.recentPerformance = {
      ...profile.performanceMetrics.recentPerformance
    };
    updatedProfile.performanceMetrics.streakInfo = {
      ...profile.performanceMetrics.streakInfo
    };

    this.updatePerformanceMetrics(updatedProfile, params);

    if (this.config.adjustmentMode === "per_question" || this.config.adjustmentMode === "hybrid") {
      const adjustment = this.evaluateAdjustment(updatedProfile, params);

      if (adjustment) {
        const oldLevel = updatedProfile.currentLevel;
        updatedProfile.currentLevel = adjustment.newLevel;
        updatedProfile.levelHistory.push({
          fromLevel: oldLevel,
          toLevel: adjustment.newLevel,
          reason: adjustment.reason,
          timestamp: new Date(),
          performanceSnapshot: {
            accuracy: updatedProfile.performanceMetrics.overall.accuracy,
            averageTime: updatedProfile.performanceMetrics.overall.averageTime,
            streakCount: updatedProfile.performanceMetrics.streakInfo.currentStreak
          }
        });

        updatedProfile.adjustmentHistory.push(adjustment);
      }
    }

    updatedProfile.lastUpdated = new Date();
    this.userProfiles.set(profile.userId, updatedProfile);
    this.saveProfiles();

    return updatedProfile;
  }

  private updatePerformanceMetrics(
    profile: UserDifficultyProfile,
    params: DifficultyAdjustmentParams
  ): void {
    const { isCorrect, timeSpent, expectedTime, questionDifficulty } = params;

    // Update overall metrics
    const overall = profile.performanceMetrics.overall;
    const newTotal = overall.totalQuestions + 1;

    overall.totalQuestions = newTotal;
    overall.correctAnswers += isCorrect ? 1 : 0;
    overall.accuracy = (overall.correctAnswers / newTotal) * 100;
    overall.averageTime = (overall.averageTime * (newTotal - 1) + timeSpent) / newTotal;

    // Update difficulty-specific metrics
    const diffMetrics = profile.performanceMetrics.byDifficulty[questionDifficulty];
    diffMetrics.total++;
    if (isCorrect) diffMetrics.correct++;
    diffMetrics.accuracy = (diffMetrics.correct / diffMetrics.total) * 100;
    diffMetrics.averageTime = (diffMetrics.averageTime * (diffMetrics.total - 1) + timeSpent) / diffMetrics.total;

    if (expectedTime) {
      diffMetrics.averageTimeVsExpected = diffMetrics.averageTime / expectedTime;
    }

    // Update streak
    const streakInfo = profile.performanceMetrics.streakInfo;
    if (isCorrect) {
      streakInfo.currentStreak++;
      if (streakInfo.currentStreak > streakInfo.longestStreak) {
        streakInfo.longestStreak = streakInfo.currentStreak;
      }
      streakInfo.streakByDifficulty[questionDifficulty]++;
    } else {
      streakInfo.currentStreak = 0;
    }

    // Update recent performance
    const recent = profile.performanceMetrics.recentPerformance;
    const recentScores = this.getRecentScores(profile.userId);

    if (recentScores.length >= 10) {
      recent.last10Accuracy = (recentScores.slice(-10).filter(s => s).length / 10) * 100;
    }
    if (recentScores.length >= 20) {
      recent.last20Accuracy = (recentScores.slice(-20).filter(s => s).length / 20) * 100;
    }
    if (recentScores.length >= 50) {
      recent.last50Accuracy = (recentScores.slice(-50).filter(s => s).length / 50) * 100;
    }

    // Determine trend
    if (recentScores.length >= 10) {
      const recent = recentScores.slice(-10);
      const previous = recentScores.slice(-20, -10);

      if (previous.length > 0) {
        const recentAvg = recent.filter(s => s).length / recent.length;
        const previousAvg = previous.filter(s => s).length / previous.length;

        if (recentAvg > previousAvg + 5) {
          recent.trend = "improving";
        } else if (recentAvg < previousAvg - 5) {
          recent.trend = "declining";
        } else {
          recent.trend = "stable";
        }
      }
    }
  }

  private getRecentScores(userId: string): boolean[] {
    // Get recent scores from performance history
    return [];
  }

  private evaluateAdjustment(
    profile: UserDifficultyProfile,
    params: DifficultyAdjustmentParams
  ): DifficultyAdjustment | null {
    const rules = this.transitionRules.get("default") || [];
    const currentLevel = profile.currentLevel;

    // Find applicable rules for current level
    const applicableRules = rules
      .filter(r => r.fromLevel === currentLevel)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      const metrics = {
        accuracy: profile.performanceMetrics.overall.accuracy,
        timeRatio: params.expectedTime ? params.expectedTime / params.timeSpent : 1,
        streak: profile.performanceMetrics.streakInfo.currentStreak,
        consecutiveCorrect: params.consecutiveCorrect || profile.performanceMetrics.streakInfo.currentStreak,
        consecutiveMistakes: params.consecutiveMistakes || 0
      };

      if (evaluateTransitionConditions(rule.conditions, metrics)) {
        const newLevel = rule.toLevel;

        // Check min/max limits
        if (newLevel === this.config.maxLevel && currentLevel === this.config.maxLevel) {
          // Already at max, skip
          continue;
        }
        if (newLevel === this.config.minLevel && currentLevel === this.config.minLevel) {
          // Already at min, skip
          continue;
        }

        return {
          id: `adj_${Date.now()}`,
          timestamp: new Date(),
          fromLevel: currentLevel,
          toLevel: newLevel,
          trigger: this.determineTrigger(params),
          metrics: {
            accuracy: metrics.accuracy,
            timeRatio: metrics.timeRatio,
            confidence: params.confidence || 0.5,
            streak: metrics.streak
          },
          isAutomatic: true
        };
      }
    }

    return null;
  }

  private determineTrigger(params: DifficultyAdjustmentParams): AdjustmentTrigger {
    if (params.consecutiveCorrect && params.consecutiveCorrect >= 5) {
      return "streak_threshold";
    }
    if (params.consecutiveMistakes && params.consecutiveMistakes >= 2) {
      return "consecutive_mistakes";
    }
    if (params.isCorrect && params.timeSpent < (params.expectedTime || 60) * 0.8) {
      return "time_threshold";
    }
    return "accuracy_threshold";
  }

  getRecommendedDifficulty(profile: UserDifficultyProfile): DifficultyLevel {
    const { overall, byDifficulty } = profile.performanceMetrics;

    // Calculate weighted performance score
    let totalWeight = 0;
    let weightedScore = 0;

    const difficulties: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];

    for (const diff of difficulties) {
      const metrics = byDifficulty[diff];
      if (metrics.total > 0) {
        const weight = metrics.total;
        weightedScore += metrics.accuracy * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return this.config.initialLevel;
    }

    const avgAccuracy = weightedScore / totalWeight;

    // Recommend based on average accuracy
    if (avgAccuracy >= 90) return "expert";
    if (avgAccuracy >= 80) return "hard";
    if (avgAccuracy >= 60) return "medium";
    return "easy";
  }

  predictPerformance(
    profile: UserDifficultyProfile,
    difficulty: DifficultyLevel
  ): { expectedAccuracy: number; confidence: number } {
    const diffMetrics = profile.performanceMetrics.byDifficulty[difficulty];

    if (diffMetrics.total >= 5) {
      return {
        expectedAccuracy: diffMetrics.accuracy,
        confidence: Math.min(1, diffMetrics.total / 20)
      };
    }

    // Use overall performance with difficulty adjustment
    const overall = profile.performanceMetrics.overall.accuracy;
    const difficultyOffset = this.getDifficultyOffset(difficulty, profile.currentLevel);

    return {
      expectedAccuracy: Math.max(0, Math.min(100, overall + difficultyOffset)),
      confidence: 0.3
    };
  }

  private getDifficultyOffset(target: DifficultyLevel, current: DifficultyLevel): number {
    const offsets: Record<DifficultyLevel, Record<DifficultyLevel, number>> = {
      easy: { easy: 0, medium: -15, hard: -25, expert: -35 },
      medium: { easy: 15, medium: 0, hard: -15, expert: -25 },
      hard: { easy: 25, medium: 15, hard: 0, expert: -15 },
      expert: { easy: 35, medium: 25, hard: 15, expert: 0 }
    };

    return offsets[target]?.[current] || 0;
  }

  getThresholdForLevel(level: DifficultyLevel): number {
    const threshold = this.config.thresholds.find(t => t.level === level);
    return threshold ? (threshold.accuracyMin + threshold.accuracyMax) / 2 : 50;
  }

  setUserPreference(userId: string, preference: Partial<UserDifficultyProfile["preferences"]>): void {
    const profile = this.getOrCreateProfile(userId);
    profile.preferences = { ...profile.preferences, ...preference };
    this.userProfiles.set(userId, profile);
    this.saveProfiles();
  }

  resetProfile(userId: string, initialLevel?: DifficultyLevel): void {
    const newProfile = createDifficultyProfile(userId, initialLevel || this.config.initialLevel);
    this.userProfiles.set(userId, newProfile);
    this.saveProfiles();
  }

  destroy(): void {
    this.userProfiles.clear();
    this.transitionRules.clear();
    AdaptiveDifficultyEngine.instance = null as any;
  }
}

export default AdaptiveDifficultyEngine;
