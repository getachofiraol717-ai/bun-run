// @ts-nocheck
// Study Companion — Goal Utilities
// Utility functions for goal management

import type { LearningGoal, GoalMilestone, GoalTemplate } from "../models/LearningGoal";

export type GoalStatus = "active" | "completed" | "paused" | "archived";
export type GoalType = "daily" | "weekly" | "monthly" | "exam" | "certification" | "long_term";
export type GoalPriority = "high" | "medium" | "low";

/**
 * Get goal status color
 */
export function getGoalStatusColor(status: GoalStatus): string {
  const colors: Record<GoalStatus, string> = {
    active: "#10B981",
    completed: "#6366F1",
    paused: "#F59E0B",
    archived: "#6B7280"
  };
  return colors[status] || "#6B7280";
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: GoalPriority): string {
  const colors: Record<GoalPriority, string> = {
    high: "#EF4444",
    medium: "#F59E0B",
    low: "#10B981"
  };
  return colors[priority] || "#6B7280";
}

/**
 * Get goal type label
 */
export function getGoalTypeLabel(type: GoalType): string {
  const labels: Record<GoalType, string> = {
    daily: "Daily Goal",
    weekly: "Weekly Goal",
    monthly: "Monthly Goal",
    exam: "Exam Preparation",
    certification: "Certification",
    long_term: "Long-term Goal"
  };
  return labels[type] || type;
}

/**
 * Calculate goal progress
 */
export function calculateGoalProgress(goal: LearningGoal): number {
  if (goal.progress !== undefined) {
    return Math.min(100, Math.max(0, goal.progress));
  }

  if (goal.milestones && goal.milestones.length > 0) {
    const completed = goal.milestones.filter(m => m.completed).length;
    return Math.round((completed / goal.milestones.length) * 100);
  }

  return 0;
}

/**
 * Check if goal is overdue
 */
export function isGoalOverdue(goal: LearningGoal): boolean {
  if (!goal.targetDate) return false;
  return new Date(goal.targetDate) < new Date() && goal.status === "active";
}

/**
 * Get days remaining for goal
 */
export function getDaysRemaining(goal: LearningGoal): number | null {
  if (!goal.targetDate) return null;

  const now = new Date();
  const target = new Date(goal.targetDate);
  const diffMs = target.getTime() - now.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculate estimated completion date based on current pace
 */
export function estimateCompletionDate(
  goal: LearningGoal,
  currentProgress: number
): Date | null {
  if (currentProgress <= 0 || currentProgress >= 100) return null;
  if (!goal.targetDate) return null;

  const daysElapsed = getDaysRemaining(goal);
  if (daysElapsed === null || daysElapsed <= 0) return null;

  const progressNeeded = 100 - currentProgress;
  const daysToComplete = Math.round((daysElapsed * progressNeeded) / currentProgress);

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysToComplete);

  return estimatedDate;
}

/**
 * Check if goal is achievable in remaining time
 */
export function isGoalAchievable(goal: LearningGoal): boolean {
  if (!goal.targetDate || goal.status !== "active") return true;

  const daysRemaining = getDaysRemaining(goal);
  if (daysRemaining === null || daysRemaining <= 0) return false;

  const progress = calculateGoalProgress(goal);
  const progressNeeded = 100 - progress;

  // Estimate if daily progress is realistic (assuming at least 5% per day)
  const minDailyProgress = 5;
  const maxDaysNeeded = progressNeeded / minDailyProgress;

  return maxDaysNeeded <= daysRemaining;
}

/**
 * Sort goals by priority and deadline
 */
export function sortGoals<T extends { priority: GoalPriority; targetDate?: Date; status: GoalStatus }>(
  goals: T[]
): T[] {
  return [...goals].sort((a, b) => {
    // Active goals first
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;

    // Then by priority
    const priorityOrder: Record<GoalPriority, number> = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    // Then by deadline
    if (a.targetDate && b.targetDate) {
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    }

    return 0;
  });
}

/**
 * Filter goals by status
 */
export function filterGoalsByStatus<T extends { status: GoalStatus }>(
  goals: T[],
  status: GoalStatus
): T[] {
  return goals.filter(g => g.status === status);
}

/**
 * Filter goals by type
 */
export function filterGoalsByType<T extends { type: GoalType }>(
  goals: T[],
  type: GoalType
): T[] {
  return goals.filter(g => g.type === type);
}

/**
 * Get active goal count
 */
export function getActiveGoalCount(goals: LearningGoal[]): number {
  return goals.filter(g => g.status === "active").length;
}

/**
 * Get completed goal count
 */
export function getCompletedGoalCount(goals: LearningGoal[]): number {
  return goals.filter(g => g.status === "completed").length;
}

/**
 * Calculate overall progress across all goals
 */
export function calculateOverallProgress(goals: LearningGoal[]): number {
  if (goals.length === 0) return 0;

  const totalProgress = goals.reduce((sum, goal) => {
    return sum + calculateGoalProgress(goal);
  }, 0);

  return Math.round(totalProgress / goals.length);
}

/**
 * Generate milestone suggestions based on goal
 */
export function suggestMilestones(goal: LearningGoal): Partial<GoalMilestone>[] {
  const progressPerMilestone = 100 / 4;

  return [
    { title: "Getting Started", description: "Begin working on this goal" },
    { title: "Making Progress", description: `Reach ${Math.round(progressPerMilestone * 2)}% completion` },
    { title: "Almost There", description: `Reach ${Math.round(progressPerMilestone * 3)}% completion` },
    { title: "Final Stretch", description: "Complete the remaining work" }
  ];
}

/**
 * Create goal from template
 */
export function createGoalFromTemplate(
  template: GoalTemplate,
  customizations?: Partial<LearningGoal>
): LearningGoal {
  const now = new Date();
  const targetDate = new Date(now);

  // Set target date based on template duration
  switch (template.defaultDuration) {
    case "day":
      targetDate.setDate(targetDate.getDate() + 1);
      break;
    case "week":
      targetDate.setDate(targetDate.getDate() + 7);
      break;
    case "month":
      targetDate.setMonth(targetDate.getMonth() + 1);
      break;
    case "quarter":
      targetDate.setMonth(targetDate.getMonth() + 3);
      break;
    case "year":
      targetDate.setFullYear(targetDate.getFullYear() + 1);
      break;
  }

  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: template.name,
    description: template.description,
    subject: template.subject,
    type: template.type as GoalType,
    targetDate,
    priority: "medium",
    progress: 0,
    status: "active",
    milestones: [],
    createdAt: now,
    updatedAt: now,
    ...customizations
  };
}

/**
 * Validate goal data
 */
export function validateGoal(goal: Partial<LearningGoal>): string[] {
  const errors: string[] = [];

  if (!goal.title || goal.title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (goal.title && goal.title.length > 100) {
    errors.push("Title must be less than 100 characters");
  }

  if (goal.targetDate) {
    const targetDate = new Date(goal.targetDate);
    if (targetDate < new Date()) {
      errors.push("Target date must be in the future");
    }
  }

  if (goal.progress !== undefined && (goal.progress < 0 || goal.progress > 100)) {
    errors.push("Progress must be between 0 and 100");
  }

  return errors;
}
