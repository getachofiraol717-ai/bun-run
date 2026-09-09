// @ts-nocheck
// Adaptive Quiz Engine — AdaptiveLearningService
// Provides adaptive learning recommendations and personalization

import type { DifficultyLevel } from "../models/Question";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";
import type { QuizResult } from "../models/QuizResult";
import type { KnowledgeGap } from "../core/KnowledgeGapAnalyzer";

export interface LearningPath {
  id: string;
  userId: string;
  targetLevel: DifficultyLevel;
  currentLevel: DifficultyLevel;
  steps: LearningStep[];
  estimatedDuration: number;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface LearningStep {
  id: string;
  order: number;
  type: "review" | "practice" | "assessment" | "challenge";
  title: string;
  description: string;
  targetTopics: string[];
  difficulty: DifficultyLevel;
  questionsCount: number;
  estimatedTime: number;
  completed: boolean;
  completedAt?: Date;
  quizId?: string;
}

export interface AdaptivePlan {
  dailyPractice: DailyPractice[];
  weeklyGoals: WeeklyGoal[];
  focusAreas: FocusArea[];
  warnings: Warning[];
}

export interface DailyPractice {
  day: number;
  date: Date;
  activities: Activity[];
  totalTime: number;
  completed: boolean;
}

export interface Activity {
  type: "quiz" | "review" | "practice" | "tutor";
  title: string;
  duration: number;
  difficulty: DifficultyLevel;
  topics: string[];
  completed: boolean;
}

export interface WeeklyGoal {
  id: string;
  description: string;
  target: string;
  current: string;
  progress: number;
  deadline: Date;
  achieved: boolean;
}

export interface FocusArea {
  topic: string;
  currentLevel: number;
  targetLevel: number;
  priority: number;
  activities: string[];
}

export interface Warning {
  type: "streak_ending" | "weakness_identified" | "time_exceeded" | "difficulty_spike";
  message: string;
  action: string;
  priority: "high" | "medium" | "low";
}

export class AdaptiveLearningService {
  private static instance: AdaptiveLearningService;

  private constructor() {}

  static getInstance(): AdaptiveLearningService {
    if (!AdaptiveLearningService.instance) {
      AdaptiveLearningService.instance = new AdaptiveLearningService();
    }
    return AdaptiveLearningService.instance;
  }

  generateLearningPath(params: {
    userId: string;
    currentLevel: DifficultyLevel;
    targetLevel: DifficultyLevel;
    focusTopics: string[];
  }): LearningPath {
    const path: LearningPath = {
      id: `path_${Date.now()}`,
      userId: params.userId,
      targetLevel: params.targetLevel,
      currentLevel: params.currentLevel,
      steps: [],
      estimatedDuration: 0,
      progress: 0,
      startedAt: new Date()
    };

    const difficultyOrder: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];
    const currentIndex = difficultyOrder.indexOf(params.currentLevel);
    const targetIndex = difficultyOrder.indexOf(params.targetLevel);

    let stepOrder = 1;
    const stepsNeeded = targetIndex - currentIndex;

    // Generate steps for each difficulty level to advance through
    for (let i = currentIndex; i < targetIndex; i++) {
      const fromLevel = difficultyOrder[i];
      const toLevel = difficultyOrder[i + 1];

      // Review step
      path.steps.push({
        id: `step_${stepOrder}`,
        order: stepOrder++,
        type: "review",
        title: `Review fundamentals for ${toLevel} level`,
        description: `Master prerequisites before advancing to ${toLevel}`,
        targetTopics: params.focusTopics,
        difficulty: fromLevel,
        questionsCount: 5,
        estimatedTime: 15,
        completed: false
      });

      // Practice step
      path.steps.push({
        id: `step_${stepOrder}`,
        order: stepOrder++,
        type: "practice",
        title: `Practice at ${toLevel} level`,
        description: `Build proficiency at ${toLevel} difficulty`,
        targetTopics: params.focusTopics,
        difficulty: toLevel,
        questionsCount: 10,
        estimatedTime: 25,
        completed: false
      });

      // Assessment step
      path.steps.push({
        id: `step_${stepOrder}`,
        order: stepOrder++,
        type: "assessment",
        title: `Assessment for ${toLevel} level`,
        description: "Prove mastery to advance",
        targetTopics: params.focusTopics,
        difficulty: toLevel,
        questionsCount: 15,
        estimatedTime: 30,
        completed: false
      });
    }

    // Final challenge
    path.steps.push({
      id: `step_${stepOrder}`,
      order: stepOrder,
      type: "challenge",
      title: `Challenge: Expert Level`,
      description: "Test your skills at the highest level",
      targetTopics: params.focusTopics,
      difficulty: "expert",
      questionsCount: 10,
      estimatedTime: 30,
      completed: false
    });

    path.estimatedDuration = path.steps.reduce((sum, s) => sum + s.estimatedTime, 0);

    return path;
  }

  generateDailyPlan(params: {
    userId: string;
    results: QuizResult[];
    gaps: KnowledgeGap[];
    profile: UserDifficultyProfile;
  }): AdaptivePlan {
    const today = new Date();
    const dailyPractice: DailyPractice[] = [];
    const weeklyGoals: WeeklyGoal[] = [];

    // Generate 7 days of practice
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);

      const activities: Activity[] = [];
      let totalTime = 0;

      // Morning practice (weak areas)
      if (day % 2 === 0) {
        activities.push({
          type: "practice",
          title: "Strengthen weak areas",
          duration: 15,
          difficulty: params.profile.currentLevel,
          topics: params.gaps.slice(0, 2).map(g => g.topic),
          completed: false
        });
        totalTime += 15;
      }

      // Regular practice
      activities.push({
        type: "quiz",
        title: "Daily quiz",
        duration: 20,
        difficulty: params.profile.currentLevel,
        topics: ["mixed"],
        completed: false
      });
      totalTime += 20;

      // Evening review
      if (day % 3 === 0) {
        activities.push({
          type: "review",
          title: "Review today's concepts",
          duration: 10,
          difficulty: "easy",
          topics: ["recent"],
          completed: false
        });
        totalTime += 10;
      }

      dailyPractice.push({
        day,
        date,
        activities,
        totalTime,
        completed: false
      });
    }

    // Generate weekly goals
    const lastResult = params.results[0];
    const improvementTarget = lastResult ? lastResult.summary.percentage + 10 : 75;

    weeklyGoals.push({
      id: `goal_${Date.now()}`,
      description: "Improve overall score",
      target: `${Math.min(100, improvementTarget)}%`,
      current: lastResult ? `${lastResult.summary.percentage.toFixed(0)}%` : "0%",
      progress: lastResult ? lastResult.summary.percentage : 0,
      deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      achieved: false
    });

    if (params.gaps.length > 0) {
      weeklyGoals.push({
        id: `goal_${Date.now()}_gap`,
        description: "Address critical knowledge gaps",
        target: "Complete gap exercises",
        current: "0%",
        progress: 0,
        deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        achieved: false
      });
    }

    // Focus areas
    const focusAreas: FocusArea[] = params.gaps.slice(0, 3).map((gap, i) => ({
      topic: gap.topic,
      currentLevel: 100 - gap.severityScore || 50,
      targetLevel: 80,
      priority: i + 1,
      activities: gap.recommendedActions.slice(0, 3).map(a => a.title)
    }));

    // Warnings
    const warnings: Warning[] = [];

    if (params.gaps.some(g => g.severity === "critical")) {
      warnings.push({
        type: "weakness_identified",
        message: "Critical knowledge gaps detected",
        action: "Prioritize practice on weak areas",
        priority: "high"
      });
    }

    const currentStreak = params.profile.performanceMetrics.streakInfo.currentStreak;
    if (currentStreak > 0 && currentStreak % 5 === 0) {
      warnings.push({
        type: "streak_ending",
        message: `${currentStreak} day streak!`,
        action: "Keep up the great work",
        priority: "low"
      });
    }

    return {
      dailyPractice,
      weeklyGoals,
      focusAreas,
      warnings
    };
  }

  getSpacedRepetitionSchedule(params: {
    topic: string;
    lastPracticed: Date;
    masteryLevel: number;
  }): Date[] {
    const { masteryLevel, lastPracticed } = params;

    // Spaced repetition intervals (in days)
    const intervals = [1, 3, 7, 14, 30, 60];

    // Adjust interval based on mastery level
    let intervalIndex = Math.floor(masteryLevel / 20);
    intervalIndex = Math.min(intervalIndex, intervals.length - 1);

    const schedule: Date[] = [];

    intervals.slice(0, intervalIndex + 1).forEach((interval, i) => {
      const date = new Date(lastPracticed);
      date.setDate(date.getDate() + interval);
      schedule.push(date);
    });

    return schedule;
  }

  calculateOptimalDifficulty(
    profile: UserDifficultyProfile,
    recentResults: QuizResult[]
  ): DifficultyLevel {
    if (recentResults.length === 0) {
      return profile.currentLevel;
    }

    const lastResult = recentResults[0];
    const percentage = lastResult.summary.percentage;

    // Adjust based on recent performance
    if (percentage >= 90) {
      return this.advanceDifficulty(profile.currentLevel);
    } else if (percentage >= 75) {
      return profile.currentLevel;
    } else if (percentage >= 60) {
      return this.recedeDifficulty(profile.currentLevel);
    } else {
      return "easy";
    }
  }

  private advanceDifficulty(current: DifficultyLevel): DifficultyLevel {
    const order: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];
    const index = order.indexOf(current);
    return index < order.length - 1 ? order[index + 1] : current;
  }

  private recedeDifficulty(current: DifficultyLevel): DifficultyLevel {
    const order: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];
    const index = order.indexOf(current);
    return index > 0 ? order[index - 1] : current;
  }

  predictMasteryDate(
    currentScore: number,
    targetScore: number,
    dailyPracticeMinutes: number
  ): Date | null {
    if (currentScore >= targetScore) return new Date();

    const scoreNeeded = targetScore - currentScore;
    const improvementRate = dailyPracticeMinutes > 30 ? 2 : 1;
    const daysNeeded = Math.ceil(scoreNeeded / improvementRate);

    if (daysNeeded > 365) return null;

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysNeeded);

    return predictedDate;
  }

  generateRemediationPlan(gap: KnowledgeGap): LearningStep[] {
    const steps: LearningStep[] = [
      {
        id: `remed_${gap.id}_1`,
        order: 1,
        type: "review",
        title: `Review ${gap.topic} fundamentals`,
        description: "Master the basic concepts",
        targetTopics: [gap.topic],
        difficulty: "easy",
        questionsCount: 5,
        estimatedTime: 15,
        completed: false
      },
      {
        id: `remed_${gap.id}_2`,
        order: 2,
        type: "practice",
        title: `Practice ${gap.topic}`,
        description: "Apply concepts through practice",
        targetTopics: [gap.topic],
        difficulty: "medium",
        questionsCount: 10,
        estimatedTime: 25,
        completed: false
      },
      {
        id: `remed_${gap.id}_3`,
        order: 3,
        type: "assessment",
        title: `Test ${gap.topic} mastery`,
        description: "Verify understanding",
        targetTopics: [gap.topic],
        difficulty: "medium",
        questionsCount: 8,
        estimatedTime: 20,
        completed: false
      }
    ];

    return steps;
  }

  destroy(): void {
    AdaptiveLearningService.instance = null as any;
  }
}

export default AdaptiveLearningService;
