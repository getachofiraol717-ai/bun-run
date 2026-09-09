// Study Companion — Goal Tracking Service
// Tracks goal progress and generates notifications

import type { LearningGoal } from "../models/LearningGoal";

export interface GoalNotification {
  id: string;
  goalId: string;
  type: "progress" | "deadline" | "milestone" | "suggestion";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  read: boolean;
  actionRequired: boolean;
}

export interface GoalProgressReport {
  goalId: string;
  goal: LearningGoal;
  progress: number;
  daysRemaining: number;
  onTrack: boolean;
  estimatedCompletion: Date | null;
  suggestion?: string;
}

export class GoalTrackingService {
  private static instance: GoalTrackingService;
  private userId: string = "";
  private notifications: GoalNotification[] = [];
  private listeners: Set<(notifications: GoalNotification[]) => void> = new Set();

  private constructor() {}

  static getInstance(): GoalTrackingService {
    if (!GoalTrackingService.instance) {
      GoalTrackingService.instance = new GoalTrackingService();
    }
    return GoalTrackingService.instance;
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadNotifications();
  }

  private async loadNotifications(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_goal_notifications_${this.userId}`);
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
      }
    } catch (error) {
      console.error("Failed to load goal notifications:", error);
    }
  }

  private async saveNotifications(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      // Keep last 50 notifications
      const toSave = this.notifications.slice(-50);
      localStorage.setItem(`sc_goal_notifications_${this.userId}`, JSON.stringify(toSave));
    } catch (error) {
      console.error("Failed to save goal notifications:", error);
    }
  }

  // Check goal progress and generate notifications
  async checkGoals(goals: LearningGoal[]): Promise<GoalNotification[]> {
    const newNotifications: GoalNotification[] = [];
    const now = new Date();

    for (const goal of goals) {
      if (goal.status !== "active") continue;

      const daysRemaining = Math.ceil(
        (goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check for deadline approaching
      if (daysRemaining <= 3 && daysRemaining > 0) {
        const existing = this.notifications.find(
          n => n.goalId === goal.id && n.type === "deadline"
        );

        if (!existing) {
          const notification: GoalNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            goalId: goal.id,
            type: "deadline",
            title: `Goal Deadline Approaching`,
            message: `"${goal.title}" is due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}!`,
            priority: daysRemaining === 1 ? "high" : "medium",
            createdAt: new Date(),
            read: false,
            actionRequired: true
          };

          this.notifications.push(notification);
          newNotifications.push(notification);
        }
      }

      // Check for overdue goals
      if (daysRemaining < 0) {
        const existing = this.notifications.find(
          n => n.goalId === goal.id && n.type === "deadline" && !n.read
        );

        if (!existing) {
          const notification: GoalNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            goalId: goal.id,
            type: "deadline",
            title: `Goal Overdue`,
            message: `"${goal.title}" was due ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} ago.`,
            priority: "high",
            createdAt: new Date(),
            read: false,
            actionRequired: true
          };

          this.notifications.push(notification);
          newNotifications.push(notification);
        }
      }

      // Check for off-track goals
      const expectedProgress = this.getExpectedProgress(goal);
      if (goal.progress < expectedProgress - 20) {
        const existing = this.notifications.find(
          n => n.goalId === goal.id && n.type === "progress"
        );

        if (!existing) {
          const notification: GoalNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            goalId: goal.id,
            type: "progress",
            title: `Goal Off Track`,
            message: `"${goal.title}" is behind schedule. Current progress: ${goal.progress}%, expected: ${Math.round(expectedProgress)}%`,
            priority: "medium",
            createdAt: new Date(),
            read: false,
            actionRequired: true
          };

          this.notifications.push(notification);
          newNotifications.push(notification);
        }
      }

      // Check milestone completion
      for (const milestone of goal.milestones) {
        if (milestone.completed && !milestone.completedAt) {
          milestone.completedAt = new Date();

          const notification: GoalNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            goalId: goal.id,
            type: "milestone",
            title: `Milestone Completed!`,
            message: `You completed "${milestone.title}" in "${goal.title}"`,
            priority: "low",
            createdAt: new Date(),
            read: false,
            actionRequired: false
          };

          this.notifications.push(notification);
          newNotifications.push(notification);
        }
      }
    }

    if (newNotifications.length > 0) {
      await this.saveNotifications();
      this.notifyListeners();
    }

    return newNotifications;
  }

  private getExpectedProgress(goal: LearningGoal): number {
    const now = new Date();
    const totalDuration = goal.targetDate.getTime() - goal.createdAt.getTime();
    const elapsed = now.getTime() - goal.createdAt.getTime();

    if (totalDuration <= 0) return 100;
    return Math.min(100, (elapsed / totalDuration) * 100);
  }

  // Generate progress report
  generateProgressReport(goal: LearningGoal): GoalProgressReport {
    const now = new Date();
    const daysRemaining = Math.ceil(
      (goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const expectedProgress = this.getExpectedProgress(goal);
    const onTrack = goal.progress >= expectedProgress - 10;

    let estimatedCompletion: Date | null = null;
    let suggestion: string | undefined;

    if (!onTrack && goal.progress > 0) {
      const daysElapsed = Math.ceil(
        (now.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const progressPerDay = goal.progress / daysElapsed;

      if (progressPerDay > 0) {
        const remainingProgress = 100 - goal.progress;
        const daysToComplete = Math.ceil(remainingProgress / progressPerDay);
        estimatedCompletion = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
        suggestion = `At your current pace, you'll complete this in approximately ${daysToComplete} days.`;
      }
    }

    return {
      goalId: goal.id,
      goal,
      progress: goal.progress,
      daysRemaining,
      onTrack,
      estimatedCompletion,
      suggestion
    };
  }

  // Get unread notifications
  getUnreadNotifications(): GoalNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Get all notifications
  getAllNotifications(): GoalNotification[] {
    return [...this.notifications].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Mark all as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear old notifications
  clearOldNotifications(daysOld: number = 30): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    this.notifications = this.notifications.filter(
      n => n.createdAt >= cutoff || !n.read
    );

    this.saveNotifications();
    this.notifyListeners();
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: GoalNotification[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const unread = this.getUnreadNotifications();
    for (const listener of this.listeners) {
      listener(unread);
    }
  }

  // Cleanup
  destroy(): void {
    this.notifications = [];
    this.listeners.clear();
  }
}

export const goalTrackingService = GoalTrackingService.getInstance();
