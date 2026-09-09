// @ts-nocheck
// Adaptive Quiz Engine — ProgressTrackingService
// Tracks and manages student learning progress over time

import type { QuizResult } from "../models/QuizResult";
import type { DifficultyLevel } from "../models/Question";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";

export interface ProgressRecord {
  date: Date;
  quizId: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  topics: string[];
  difficulty: DifficultyLevel;
}

export interface ProgressSummary {
  currentStreak: number;
  longestStreak: number;
  totalQuizzes: number;
  totalQuestions: number;
  averageScore: number;
  bestScore: number;
  recentTrend: "improving" | "stable" | "declining";
  masteredTopics: number;
  topicsInProgress: number;
  topicsNotStarted: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface DailyGoal {
  id: string;
  type: "quizzes" | "questions" | "time" | "score" | "streak";
  target: number;
  current: number;
  completed: boolean;
  date: Date;
}

export class ProgressTrackingService {
  private static instance: ProgressTrackingService;
  private progressHistory: Map<string, ProgressRecord[]> = new Map();
  private achievements: Achievement[] = [];
  private dailyGoals: Map<string, DailyGoal[]> = new Map();
  private streakData: Map<string, { current: number; longest: number; lastActivity: Date }> = new Map();

  private constructor() {
    this.loadProgress();
    this.initializeAchievements();
  }

  static getInstance(): ProgressTrackingService {
    if (!ProgressTrackingService.instance) {
      ProgressTrackingService.instance = new ProgressTrackingService();
    }
    return ProgressTrackingService.instance;
  }

  private loadProgress(): void {
    try {
      const stored = localStorage.getItem("quiz_progress");
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data.history || {}).forEach(([userId, records]: [string, any]) => {
          this.progressHistory.set(
            userId,
            records.map((r: any) => ({
              ...r,
              date: new Date(r.date)
            }))
          );
        });
      }

      const streakStored = localStorage.getItem("quiz_streaks");
      if (streakStored) {
        const streaks = JSON.parse(streakStored);
        Object.entries(streaks).forEach(([userId, data]: [string, any]) => {
          this.streakData.set(userId, {
            ...data,
            lastActivity: new Date(data.lastActivity)
          });
        });
      }
    } catch (error) {
      console.warn("Failed to load progress:", error);
    }
  }

  private saveProgress(): void {
    try {
      const history: Record<string, any[]> = {};
      this.progressHistory.forEach((records, userId) => {
        history[userId] = records;
      });
      localStorage.setItem("quiz_progress", JSON.stringify({ history }));

      const streaks: Record<string, any> = {};
      this.streakData.forEach((data, userId) => {
        streaks[userId] = data;
      });
      localStorage.setItem("quiz_streaks", JSON.stringify(streaks));
    } catch (error) {
      console.warn("Failed to save progress:", error);
    }
  }

  private initializeAchievements(): void {
    this.achievements = [
      {
        id: "first_quiz",
        name: "First Steps",
        description: "Complete your first quiz",
        icon: "trophy",
        rarity: "common"
      },
      {
        id: "streak_3",
        name: "Getting Started",
        description: "Maintain a 3-day streak",
        icon: "fire",
        rarity: "common"
      },
      {
        id: "streak_7",
        name: "Week Warrior",
        description: "Maintain a 7-day streak",
        icon: "fire",
        rarity: "rare"
      },
      {
        id: "streak_30",
        name: "Monthly Master",
        description: "Maintain a 30-day streak",
        icon: "fire",
        rarity: "epic"
      },
      {
        id: "perfect_score",
        name: "Perfectionist",
        description: "Achieve a perfect score",
        icon: "star",
        rarity: "rare"
      },
      {
        id: "speed_demon",
        name: "Speed Demon",
        description: "Complete a quiz in under 2 minutes",
        icon: "lightning",
        rarity: "rare"
      },
      {
        id: "comeback_kid",
        name: "Comeback Kid",
        description: "Improve by 20% from a previous score",
        icon: "chart",
        rarity: "epic"
      },
      {
        id: "quiz_master",
        name: "Quiz Master",
        description: "Complete 100 quizzes",
        icon: "crown",
        rarity: "legendary"
      },
      {
        id: "night_owl",
        name: "Night Owl",
        description: "Study after midnight",
        icon: "moon",
        rarity: "common"
      },
      {
        id: "early_bird",
        name: "Early Bird",
        description: "Study before 7 AM",
        icon: "sun",
        rarity: "common"
      },
      {
        id: "topic_master",
        name: "Topic Master",
        description: "Master 10 different topics",
        icon: "book",
        rarity: "epic"
      },
      {
        id: "no_mistakes",
        name: "Flawless",
        description: "Complete a quiz with no mistakes",
        icon: "shield",
        rarity: "rare"
      }
    ];
  }

  recordProgress(userId: string, result: QuizResult): void {
    const record: ProgressRecord = {
      date: result.createdAt,
      quizId: result.summary.quizId,
      score: result.summary.score,
      maxScore: result.summary.maxScore,
      percentage: result.summary.percentage,
      timeSpent: result.summary.timeSpent,
      topics: result.topicResults.map(t => t.topic),
      difficulty: result.difficultyAnalysis.estimatedUserLevel
    };

    const existing = this.progressHistory.get(userId) || [];
    existing.push(record);
    this.progressHistory.set(userId, existing);

    // Update streak
    this.updateStreak(userId);

    // Update daily goals
    this.updateDailyGoals(userId, result);

    // Check achievements
    this.checkAchievements(userId, result);

    this.saveProgress();
  }

  private updateStreak(userId: string): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = this.streakData.get(userId) || {
      current: 0,
      longest: 0,
      lastActivity: new Date(0)
    };

    const lastActivity = new Date(streak.lastActivity);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change
    } else if (daysDiff === 1) {
      // Consecutive day
      streak.current++;
      streak.lastActivity = today;
    } else {
      // Streak broken
      streak.current = 1;
      streak.lastActivity = today;
    }

    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }

    this.streakData.set(userId, streak);
  }

  private updateDailyGoals(userId: string, result: QuizResult): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let goals = this.dailyGoals.get(userId) || [];
    goals = goals.filter(g => g.date.getTime() === today.getTime());

    if (goals.length === 0) {
      // Create daily goals
      goals = [
        {
          id: `quiz_${today.getTime()}`,
          type: "quizzes",
          target: 2,
          current: 0,
          completed: false,
          date: today
        },
        {
          id: `questions_${today.getTime()}`,
          type: "questions",
          target: 20,
          current: 0,
          completed: false,
          date: today
        },
        {
          id: `time_${today.getTime()}`,
          type: "time",
          target: 30,
          current: 0,
          completed: false,
          date: today
        }
      ];
    }

    // Update goal progress
    goals.forEach(goal => {
      switch (goal.type) {
        case "quizzes":
          goal.current++;
          if (goal.current >= goal.target) goal.completed = true;
          break;
        case "questions":
          goal.current += result.questionResults.length;
          if (goal.current >= goal.target) goal.completed = true;
          break;
        case "time":
          goal.current += Math.round(result.summary.timeSpent / 60);
          if (goal.current >= goal.target) goal.completed = true;
          break;
      }
    });

    this.dailyGoals.set(userId, goals);
  }

  private checkAchievements(userId: string, result: QuizResult): void {
    const achievements = this.progressHistory.get("achievements_" + userId) || [];
    const history = this.progressHistory.get(userId) || [];
    const streak = this.streakData.get(userId) || { current: 0, longest: 0, lastActivity: new Date() };

    // Check each achievement
    this.achievements.forEach(achievement => {
      if (achievements.includes(achievement.id)) return;

      let unlocked = false;

      switch (achievement.id) {
        case "first_quiz":
          unlocked = history.length >= 1;
          break;
        case "streak_3":
          unlocked = streak.current >= 3 || streak.longest >= 3;
          break;
        case "streak_7":
          unlocked = streak.current >= 7 || streak.longest >= 7;
          break;
        case "streak_30":
          unlocked = streak.current >= 30 || streak.longest >= 30;
          break;
        case "perfect_score":
          unlocked = result.summary.percentage >= 100;
          break;
        case "speed_demon":
          unlocked = result.summary.timeSpent < 120;
          break;
        case "comeback_kid":
          if (history.length >= 2) {
            const previous = history[history.length - 2];
            unlocked = result.summary.percentage - previous.percentage >= 20;
          }
          break;
        case "quiz_master":
          unlocked = history.length >= 100;
          break;
        case "night_owl":
          unlocked = result.createdAt.getHours() >= 0 && result.createdAt.getHours() < 5;
          break;
        case "early_bird":
          unlocked = result.createdAt.getHours() >= 5 && result.createdAt.getHours() < 7;
          break;
        case "no_mistakes":
          unlocked = result.summary.percentage >= 100 && result.questionResults.every(q => q.isCorrect);
          break;
      }

      if (unlocked) {
        achievements.push(achievement.id);
        // Achievement unlocked - would emit event here
      }
    });

    this.progressHistory.set("achievements_" + userId, achievements);
  }

  getProgressSummary(userId: string): ProgressSummary {
    const history = this.progressHistory.get(userId) || [];
    const streak = this.streakData.get(userId) || { current: 0, longest: 0, lastActivity: new Date() };

    if (history.length === 0) {
      return {
        currentStreak: streak.current,
        longestStreak: streak.longest,
        totalQuizzes: 0,
        totalQuestions: 0,
        averageScore: 0,
        bestScore: 0,
        recentTrend: "stable",
        masteredTopics: 0,
        topicsInProgress: 0,
        topicsNotStarted: 0
      };
    }

    const totalQuestions = history.reduce((sum, r) => sum + Math.round((r.percentage / 100) * 10), 0);
    const averageScore = history.reduce((sum, r) => sum + r.percentage, 0) / history.length;
    const bestScore = Math.max(...history.map(r => r.percentage));

    // Calculate trend
    let recentTrend: "improving" | "stable" | "declining" = "stable";
    if (history.length >= 5) {
      const recent = history.slice(0, 3);
      const older = history.slice(3, 6);
      const recentAvg = recent.reduce((sum, r) => sum + r.percentage, 0) / recent.length;
      const olderAvg = older.reduce((sum, r) => sum + r.percentage, 0) / older.length;

      if (recentAvg > olderAvg + 5) recentTrend = "improving";
      else if (recentAvg < olderAvg - 5) recentTrend = "declining";
    }

    // Count topics
    const topicProgress = new Map<string, { attempts: number; bestScore: number }>();
    history.forEach(r => {
      r.topics.forEach(topic => {
        const existing = topicProgress.get(topic) || { attempts: 0, bestScore: 0 };
        existing.attempts++;
        existing.bestScore = Math.max(existing.bestScore, r.percentage);
        topicProgress.set(topic, existing);
      });
    });

    let masteredTopics = 0;
    let topicsInProgress = 0;
    let topicsNotStarted = 0;

    topicProgress.forEach(data => {
      if (data.bestScore >= 90) masteredTopics++;
      else if (data.attempts > 0) topicsInProgress++;
    });

    return {
      currentStreak: streak.current,
      longestStreak: streak.longest,
      totalQuizzes: history.length,
      totalQuestions,
      averageScore,
      bestScore,
      recentTrend,
      masteredTopics,
      topicsInProgress,
      topicsNotStarted
    };
  }

  getProgressHistory(userId: string, days?: number): ProgressRecord[] {
    const history = this.progressHistory.get(userId) || [];

    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return history.filter(r => r.date >= cutoff);
    }

    return history;
  }

  getAchievements(userId: string): Achievement[] {
    const unlocked = this.progressHistory.get("achievements_" + userId) || [];

    return this.achievements.map(a => ({
      ...a,
      unlockedAt: unlocked.includes(a.id) ? new Date() : undefined
    }));
  }

  getDailyGoals(userId: string): DailyGoal[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goals = this.dailyGoals.get(userId) || [];
    return goals.filter(g => g.date.getTime() === today.getTime());
  }

  getStreak(userId: string): { current: number; longest: number } {
    const streak = this.streakData.get(userId) || { current: 0, longest: 0, lastActivity: new Date() };
    return { current: streak.current, longest: streak.longest };
  }

  resetProgress(userId: string): void {
    this.progressHistory.delete(userId);
    this.dailyGoals.delete(userId);
    this.streakData.delete(userId);
    this.saveProgress();
  }

  destroy(): void {
    this.progressHistory.clear();
    this.dailyGoals.clear();
    this.streakData.clear();
    ProgressTrackingService.instance = null as any;
  }
}

export default ProgressTrackingService;
