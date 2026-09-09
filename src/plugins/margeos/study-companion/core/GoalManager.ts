// Study Companion — Goal Manager
// Manages learning goals with progress tracking

import type {
  LearningGoal,
  GoalType,
  GoalStatus,
  GoalMilestone
} from "../models/LearningGoal";

export interface GoalProgress {
  goalId: string;
  current: number;
  target: number;
  percentage: number;
  daysRemaining: number;
  status: string;
  onTrack: boolean;
}

export interface GoalFilter {
  type?: GoalType;
  status?: GoalStatus;
  subject?: string;
  priority?: string;
}

export class GoalManager {
  private userId: string = "";
  private goals: Map<string, LearningGoal> = new Map();
  private listeners: Set<(goals: LearningGoal[]) => void> = new Set();

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadGoals();
  }

  // Load goals from storage
  private async loadGoals(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`study_companion_goals_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.goals = new Map(data.map((g: LearningGoal) => {
          g.targetDate = new Date(g.targetDate);
          g.createdAt = new Date(g.createdAt);
          g.updatedAt = new Date(g.updatedAt);
          if (g.completedAt) g.completedAt = new Date(g.completedAt);
          if (g.pausedAt) g.pausedAt = new Date(g.pausedAt);
          return [g.id, g];
        }));
      }
    } catch (error) {
      console.error("Failed to load goals:", error);
    }
  }

  // Save goals to storage
  private async saveGoals(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const data = Array.from(this.goals.values());
      localStorage.setItem(
        `study_companion_goals_${this.userId}`,
        JSON.stringify(data)
      );
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to save goals:", error);
    }
  }

  // Create a new goal
  async createGoal(options: Partial<LearningGoal>): Promise<LearningGoal> {
    const goal: LearningGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      type: options.type || "daily",
      category: options.category || "study_time",
      title: options.title || "New Goal",
      description: options.description,
      targetDate: options.targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      targetValue: options.targetValue || 60,
      currentValue: 0,
      progress: 0,
      status: "active",
      priority: options.priority || "medium",
      importance: options.importance || 3,
      milestones: options.milestones || [],
      subgoals: [],
      linkedContent: [],
      linkedTopics: options.linkedTopics || [],
      subject: options.subject,
      topics: options.topics,
      reminders: [],
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: new Date(),
      ...options
    };

    this.goals.set(goal.id, goal);
    await this.saveGoals();

    return goal;
  }

  // Get goal by ID
  async getGoal(id: string): Promise<LearningGoal | null> {
    return this.goals.get(id) || null;
  }

  // Get all goals with optional filtering
  async getGoals(filter?: GoalFilter): Promise<LearningGoal[]> {
    let goals = Array.from(this.goals.values());

    if (filter) {
      if (filter.type) {
        goals = goals.filter(g => g.type === filter.type);
      }
      if (filter.status) {
        goals = goals.filter(g => g.status === filter.status);
      }
      if (filter.subject) {
        goals = goals.filter(g => g.subject === filter.subject);
      }
      if (filter.priority) {
        goals = goals.filter(g => g.priority === filter.priority);
      }
    }

    // Sort by priority and due date
    goals.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.targetDate.getTime() - b.targetDate.getTime();
    });

    return goals;
  }

  // Get active goals
  async getActiveGoals(): Promise<LearningGoal[]> {
    return this.getGoals({ status: "active" });
  }

  // Get goals by type
  async getGoalsByType(type: GoalType): Promise<LearningGoal[]> {
    return this.getGoals({ type });
  }

  // Update goal progress
  async updateProgress(goalId: string, progress: number): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.progress = Math.min(100, Math.max(0, progress));
    goal.currentValue = Math.round((goal.targetValue || 100) * (goal.progress / 100));
    goal.updatedAt = new Date();

    // Check milestone completion
    for (const milestone of goal.milestones) {
      if (!milestone.completed && goal.currentValue >= milestone.targetValue) {
        milestone.completed = true;
        milestone.completedAt = new Date();
      }
    }

    // Auto-complete if 100%
    if (goal.progress >= 100) {
      goal.status = "completed";
      goal.completedAt = new Date();
    }

    await this.saveGoals();
  }

  // Add to current value
  async addProgress(goalId: string, value: number): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    const newValue = goal.currentValue + value;
    const newProgress = ((newValue / (goal.targetValue || 100)) * 100);

    await this.updateProgress(goalId, newProgress);
  }

  // Complete a goal
  async completeGoal(goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.status = "completed";
    goal.progress = 100;
    goal.currentValue = goal.targetValue || 100;
    goal.completedAt = new Date();
    goal.updatedAt = new Date();

    await this.saveGoals();
  }

  // Pause a goal
  async pauseGoal(goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.status = "paused";
    goal.pausedAt = new Date();
    goal.updatedAt = new Date();

    await this.saveGoals();
  }

  // Resume a goal
  async resumeGoal(goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.status = "active";
    goal.pausedAt = undefined;
    goal.updatedAt = new Date();

    await this.saveGoals();
  }

  // Cancel a goal
  async cancelGoal(goalId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.status = "cancelled";
    goal.updatedAt = new Date();

    await this.saveGoals();
  }

  // Delete a goal
  async deleteGoal(goalId: string): Promise<void> {
    this.goals.delete(goalId);
    await this.saveGoals();
  }

  // Add milestone to goal
  async addMilestone(goalId: string, milestone: Omit<GoalMilestone, "id" | "completed">): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    const newMilestone: GoalMilestone = {
      ...milestone,
      id: `milestone-${Date.now()}`,
      completed: false
    };

    goal.milestones.push(newMilestone);
    goal.updatedAt = new Date();

    await this.saveGoals();
  }

  // Complete a milestone
  async completeMilestone(goalId: string, milestoneId: string): Promise<void> {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    const milestone = goal.milestones.find(m => m.id === milestoneId);
    if (milestone) {
      milestone.completed = true;
      milestone.completedAt = new Date();

      // Update overall progress based on completed milestones
      const completedMilestones = goal.milestones.filter(m => m.completed).length;
      goal.progress = Math.round((completedMilestones / goal.milestones.length) * 100);
      goal.currentValue = Math.round((goal.targetValue || 100) * (goal.progress / 100));

      goal.updatedAt = new Date();
      await this.saveGoals();
    }
  }

  // Get goal progress details
  async getGoalProgress(goalId: string): Promise<GoalProgress | null> {
    const goal = this.goals.get(goalId);
    if (!goal) return null;

    const daysRemaining = Math.ceil(
      (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Calculate expected progress
    const totalDays = Math.ceil(
      (goal.targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysPassed = totalDays - daysRemaining;
    const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

    return {
      goalId,
      current: goal.currentValue,
      target: goal.targetValue || 100,
      percentage: goal.progress,
      daysRemaining,
      status: goal.status,
      onTrack: goal.progress >= expectedProgress - 10
    };
  }

  // Get goals needing attention
  async getGoalsNeedingAttention(): Promise<LearningGoal[]> {
    const goals = await this.getActiveGoals();
    const attentionNeeded: LearningGoal[] = [];

    for (const goal of goals) {
      const progress = await this.getGoalProgress(goal.id);
      if (progress && !progress.onTrack) {
        attentionNeeded.push(goal);
      }
    }

    return attentionNeeded;
  }

  // Get upcoming deadlines
  async getUpcomingDeadlines(days: number = 7): Promise<LearningGoal[]> {
    const goals = await this.getActiveGoals();
    const now = Date.now();
    const deadline = now + days * 24 * 60 * 60 * 1000;

    return goals
      .filter(g => g.targetDate.getTime() <= deadline)
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());
  }

  // Generate statistics
  getStatistics(): {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    pausedGoals: number;
    averageProgress: number;
    onTrackCount: number;
    atRiskCount: number;
  } {
    const allGoals = Array.from(this.goals.values());
    const activeGoals = allGoals.filter(g => g.status === "active");
    const completedGoals = allGoals.filter(g => g.status === "completed");
    const pausedGoals = allGoals.filter(g => g.status === "paused");

    const averageProgress = allGoals.length > 0
      ? allGoals.reduce((sum, g) => sum + g.progress, 0) / allGoals.length
      : 0;

    let onTrackCount = 0;
    let atRiskCount = 0;

    for (const goal of activeGoals) {
      const totalDays = Math.ceil(
        (goal.targetDate.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = Math.ceil(
        (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      const expectedProgress = totalDays > 0 ? ((totalDays - daysRemaining) / totalDays) * 100 : 0;

      if (goal.progress >= expectedProgress - 10) {
        onTrackCount++;
      } else {
        atRiskCount++;
      }
    }

    return {
      totalGoals: allGoals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      pausedGoals: pausedGoals.length,
      averageProgress: Math.round(averageProgress),
      onTrackCount,
      atRiskCount
    };
  }

  // Subscribe to changes
  subscribe(listener: (goals: LearningGoal[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const goals = Array.from(this.goals.values());
    for (const listener of this.listeners) {
      listener(goals);
    }
  }

  // Cleanup
  destroy(): void {
    this.goals.clear();
    this.listeners.clear();
  }
}

export const goalManager = new GoalManager();

