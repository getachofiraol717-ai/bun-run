// Study Companion — Motivation Engine
// Manages motivation, celebrations, and encouragement

import type {
  MotivationProfile,
  Achievement,
  Win,
  StudyStreak,
  Encouragement
} from "../models/MotivationProfile";
import type { LearningGoal } from "../models/LearningGoal";
import type { StudySession } from "../models/StudySession";

export interface MotivationResponse {
  message: string;
  type: "celebration" | "encouragement" | "reminder" | "warning";
  celebration?: CelebrationData;
  showStreak?: boolean;
}

export interface CelebrationData {
  title: string;
  message: string;
  icon?: string;
  confetti?: boolean;
}

export class MotivationEngine {
  private userId: string = "";
  private profile: MotivationProfile | null = null;
  private listeners: Set<(response: MotivationResponse) => void> = new Set();
  private lastEncouragement: Date | null = null;

  // Achievement thresholds
  private readonly STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];
  private readonly STUDY_TIME_MILESTONES = [60, 300, 600, 1800, 3600, 36000]; // minutes

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_motivation_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.profile = {
          ...data,
          lastStudyDate: data.lastStudyDate ? new Date(data.lastStudyDate) : null,
          achievements: data.achievements.map((a: any) => ({
            ...a,
            unlockedAt: new Date(a.unlockedAt)
          })),
          milestones: data.milestones.map((m: any) => ({
            ...m,
            completedAt: m.completedAt ? new Date(m.completedAt) : undefined
          })),
          recentWins: data.recentWins.map((w: any) => ({
            ...w,
            achievedAt: new Date(w.achievedAt)
          })),
          lastUpdated: new Date(data.lastUpdated)
        };
      } else {
        this.profile = this.createDefaultProfile();
        await this.saveProfile();
      }
    } catch (error) {
      console.error("Failed to load motivation profile:", error);
      this.profile = this.createDefaultProfile();
    }
  }

  private createDefaultProfile(): MotivationProfile {
    return {
      userId: this.userId,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      totalStudyDays: 0,
      achievements: [],
      milestones: [],
      recentWins: [],
      encouragementLevel: "moderate",
      celebrationStyle: "personalized",
      motivationLevel: 75,
      burnoutRisk: "low",
      engagementScore: 50,
      preferredRewards: [],
      studyEncouragements: [],
      lastUpdated: new Date()
    };
  }

  private async saveProfile(): Promise<void> {
    if (!this.profile || typeof localStorage === "undefined") return;

    try {
      this.profile.lastUpdated = new Date();
      localStorage.setItem(
        `sc_motivation_${this.userId}`,
        JSON.stringify(this.profile)
      );
    } catch (error) {
      console.error("Failed to save motivation profile:", error);
    }
  }

  // Get motivation profile
  getProfile(): MotivationProfile | null {
    return this.profile;
  }

  // Record session start
  async recordSessionStart(session: StudySession): Promise<void> {
    if (!this.profile) return;

    // Check for streak
    const today = new Date().toISOString().split("T")[0];
    const lastStudy = this.profile.lastStudyDate?.toISOString().split("T")[0];

    if (lastStudy !== today) {
      // New day - check if streak continues
      if (lastStudy) {
        const lastDate = new Date(this.profile.lastStudyDate!);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0]) {
          // Streak continues
          this.profile.currentStreak++;
        } else {
          // Streak broken
          this.profile.currentStreak = 1;
        }
      } else {
        // First study
        this.profile.currentStreak = 1;
      }

      this.profile.totalStudyDays++;
      this.profile.lastStudyDate = new Date();

      // Check for streak milestones
      await this.checkStreakMilestones();
    }

    await this.saveProfile();
  }

  // Record session end
  async recordSessionEnd(session: StudySession): Promise<void> {
    if (!this.profile) return;

    // Record win
    await this.recordWin({
      type: "consistency",
      title: "Study Session Completed",
      description: `You completed a ${session.actualDuration}-minute study session.`
    });

    await this.saveProfile();
  }

  // Celebrate goal completion
  async celebrateGoalCompletion(goal: LearningGoal): Promise<MotivationResponse> {
    if (!this.profile) {
      return { message: "Goal completed!", type: "celebration" };
    }

    // Record win
    await this.recordWin({
      type: "goal_completed",
      title: "Goal Achieved!",
      description: `You completed: ${goal.title}`
    });

    // Update streak
    await this.checkStreakMilestones();

    // Update profile
    this.profile.motivationLevel = Math.min(100, this.profile.motivationLevel + 5);
    await this.saveProfile();

    const response: MotivationResponse = {
      message: `Congratulations! You've completed "${goal.title}"!`,
      type: "celebration",
      celebration: {
        title: "Goal Completed!",
        message: goal.description || "Great work achieving your goal!",
        icon: "🎉",
        confetti: true
      },
      showStreak: true
    };

    // Notify listeners
    this.notifyListeners(response);

    return response;
  }

  // Check streak milestones
  private async checkStreakMilestones(): Promise<void> {
    if (!this.profile) return;

    const streak = this.profile.currentStreak;

    for (const milestone of this.STREAK_MILESTONES) {
      if (streak === milestone) {
        await this.unlockAchievement({
          id: `streak-${milestone}`,
          name: `${milestone}-Day Streak`,
          description: `Studied for ${milestone} days in a row!`,
          type: "streak",
          rarity: milestone >= 30 ? "epic" : milestone >= 7 ? "rare" : "common",
          icon: this.getStreakIcon(milestone),
          criteria: `Maintain a ${milestone}-day streak`,
          unlockedAt: new Date()
        });

        await this.recordWin({
          type: "streak_milestone",
          title: `${milestone}-Day Streak!`,
          description: `Amazing! You've studied for ${milestone} days in a row!`
        });
      }
    }

    // Update longest streak
    if (streak > this.profile.longestStreak) {
      this.profile.longestStreak = streak;
    }
  }

  private getStreakIcon(days: number): string {
    if (days >= 365) return "🏆";
    if (days >= 100) return "💎";
    if (days >= 60) return "⭐";
    if (days >= 30) return "🌟";
    if (days >= 14) return "✨";
    return "🔥";
  }

  // Record a win
  private async recordWin(win: Omit<Win, "id" | "achievedAt" | "celebrated">): Promise<void> {
    if (!this.profile) return;

    const newWin: Win = {
      ...win,
      id: `win-${Date.now()}`,
      achievedAt: new Date(),
      celebrated: false
    };

    this.profile.recentWins.unshift(newWin);

    // Keep only recent wins
    if (this.profile.recentWins.length > 20) {
      this.profile.recentWins = this.profile.recentWins.slice(0, 20);
    }
  }

  // Unlock achievement
  private async unlockAchievement(achievement: Achievement): Promise<void> {
    if (!this.profile) return;

    // Check if already unlocked
    if (this.profile.achievements.some(a => a.id === achievement.id)) {
      return;
    }

    this.profile.achievements.push(achievement);
    await this.saveProfile();
  }

  // Get encouragement
  async getEncouragement(): Promise<MotivationResponse> {
    if (!this.profile) {
      return { message: "Keep up the great work!", type: "encouragement" };
    }

    // Check if we should show encouragement
    if (this.shouldShowEncouragement()) {
      this.lastEncouragement = new Date();
      await this.saveProfile();

      const response = this.generateEncouragement();
      this.notifyListeners(response);
      return response;
    }

    return { message: "", type: "encouragement" };
  }

  private shouldShowEncouragement(): boolean {
    if (!this.profile) return false;

    // Check encouragement level
    const minInterval = this.profile.encouragementLevel === "frequent" ? 15 * 60 * 1000
      : this.profile.encouragementLevel === "moderate" ? 60 * 60 * 1000
      : 3 * 60 * 60 * 1000;

    if (!this.lastEncouragement) return true;

    return Date.now() - this.lastEncouragement.getTime() >= minInterval;
  }

  private generateEncouragement(): MotivationResponse {
    if (!this.profile) {
      return { message: "Keep learning!", type: "encouragement" };
    }

    const streak = this.profile.currentStreak;

    if (streak > 0) {
      return {
        message: `${streak}-day streak! Don't break the chain! 🔥`,
        type: "encouragement",
        showStreak: true
      };
    }

    const messages = [
      "Ready to start a new streak? Let's begin! 💪",
      "Every journey begins with a single step. Start studying! 📚",
      "Your future self will thank you for studying today! ⏰"
    ];

    return {
      message: messages[Math.floor(Math.random() * messages.length)],
      type: "encouragement"
    };
  }

  // Check burnout risk
  async checkBurnoutRisk(sessionsThisWeek: number): Promise<void> {
    if (!this.profile) return;

    // Simple burnout detection
    const avgDaily = sessionsThisWeek / 7;

    if (avgDaily > 5) {
      this.profile.burnoutRisk = "high";
    } else if (avgDaily > 3) {
      this.profile.burnoutRisk = "medium";
    } else {
      this.profile.burnoutRisk = "low";
    }

    await this.saveProfile();
  }

  // Get streak info
  getStreakInfo(): { current: number; longest: number; atRisk: boolean } {
    if (!this.profile) {
      return { current: 0, longest: 0, atRisk: false };
    }

    const today = new Date().toISOString().split("T")[0];
    const lastStudy = this.profile.lastStudyDate?.toISOString().split("T")[0];
    const atRisk = lastStudy !== today;

    return {
      current: this.profile.currentStreak,
      longest: this.profile.longestStreak,
      atRisk
    };
  }

  // Get achievements
  getAchievements(): Achievement[] {
    return this.profile?.achievements || [];
  }

  // Get recent wins
  getRecentWins(limit: number = 5): Win[] {
    return this.profile?.recentWins.slice(0, limit) || [];
  }

  // Set encouragement level
  async setEncouragementLevel(level: MotivationProfile["encouragementLevel"]): Promise<void> {
    if (!this.profile) return;

    this.profile.encouragementLevel = level;
    await this.saveProfile();
  }

  // Subscribe to motivation responses
  subscribe(listener: (response: MotivationResponse) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(response: MotivationResponse): void {
    for (const listener of this.listeners) {
      listener(response);
    }
  }

  // Cleanup
  destroy(): void {
    this.profile = null;
    this.listeners.clear();
  }
}
