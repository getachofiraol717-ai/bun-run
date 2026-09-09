// @ts-nocheck
// Study Companion — useGoals Hook
// React hook for managing learning goals

import { useState, useEffect, useCallback } from "react";
import { goalManager } from "../core/GoalManager";
import type { LearningGoal, GoalMilestone } from "../models/LearningGoal";

export interface UseGoalsOptions {
  userId: string;
  autoLoad?: boolean;
  filter?: {
    status?: "active" | "completed" | "paused" | "all";
    subject?: string;
    priority?: "high" | "medium" | "low";
  };
}

export interface UseGoalsReturn {
  // State
  goals: LearningGoal[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  createGoal: (goal: Partial<LearningGoal>) => Promise<LearningGoal>;
  updateGoal: (goalId: string, updates: Partial<LearningGoal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;

  // Goal actions
  completeGoal: (goalId: string) => Promise<void>;
  pauseGoal: (goalId: string) => Promise<void>;
  resumeGoal: (goalId: string) => Promise<void>;

  // Milestone actions
  addMilestone: (goalId: string, milestone: Partial<GoalMilestone>) => Promise<void>;
  completeMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  deleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;

  // Progress
  updateProgress: (goalId: string, progress: number) => Promise<void>;
  incrementProgress: (goalId: string, amount: number) => Promise<void>;

  // Utility
  getGoalById: (goalId: string) => LearningGoal | undefined;
  getGoalsBySubject: (subject: string) => LearningGoal[];
  getGoalsByStatus: (status: "active" | "completed" | "paused") => LearningGoal[];
  refresh: () => Promise<void>;
}

export function useGoals(options: UseGoalsOptions): UseGoalsReturn {
  const { userId, autoLoad = true, filter } = options;

  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load goals
  const loadGoals = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      await goalManager.initialize(userId);
      let loadedGoals = await goalManager.getAllGoals();

      // Apply filters
      if (filter) {
        if (filter.status && filter.status !== "all") {
          loadedGoals = loadedGoals.filter(g => g.status === filter.status);
        }
        if (filter.subject) {
          loadedGoals = loadedGoals.filter(g => g.subject === filter.subject);
        }
        if (filter.priority) {
          loadedGoals = loadedGoals.filter(g => g.priority === filter.priority);
        }
      }

      setGoals(loadedGoals);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load goals";
      setError(message);
      console.error("Load goals error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    if (autoLoad) {
      loadGoals();
    }
  }, [autoLoad, loadGoals]);

  // Create goal
  const createGoal = useCallback(async (goalData: Partial<LearningGoal>): Promise<LearningGoal> => {
    const newGoal = await goalManager.createGoal(goalData);
    await loadGoals();
    return newGoal;
  }, [loadGoals]);

  // Update goal
  const updateGoal = useCallback(async (goalId: string, updates: Partial<LearningGoal>) => {
    await goalManager.updateGoal(goalId, updates);
    await loadGoals();
  }, [loadGoals]);

  // Delete goal
  const deleteGoal = useCallback(async (goalId: string) => {
    await goalManager.deleteGoal(goalId);
    await loadGoals();
  }, [loadGoals]);

  // Complete goal
  const completeGoal = useCallback(async (goalId: string) => {
    await goalManager.updateGoal(goalId, {
      status: "completed",
      progress: 100,
      completedAt: new Date()
    });
    await loadGoals();
  }, [loadGoals]);

  // Pause goal
  const pauseGoal = useCallback(async (goalId: string) => {
    await goalManager.updateGoal(goalId, { status: "paused" });
    await loadGoals();
  }, [loadGoals]);

  // Resume goal
  const resumeGoal = useCallback(async (goalId: string) => {
    await goalManager.updateGoal(goalId, { status: "active" });
    await loadGoals();
  }, [loadGoals]);

  // Add milestone
  const addMilestone = useCallback(async (goalId: string, milestoneData: Partial<GoalMilestone>) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error("Goal not found");

    const newMilestone: GoalMilestone = {
      id: `milestone-${Date.now()}`,
      title: milestoneData.title || "New Milestone",
      description: milestoneData.description,
      completed: false,
      completedAt: undefined,
      dueDate: milestoneData.dueDate
    };

    const updatedMilestones = [...(goal.milestones || []), newMilestone];
    await goalManager.updateGoal(goalId, { milestones: updatedMilestones });
    await loadGoals();
  }, [goals, loadGoals]);

  // Complete milestone
  const completeMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error("Goal not found");

    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestoneId
        ? { ...m, completed: true, completedAt: new Date() }
        : m
    );

    // Calculate new progress based on completed milestones
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);

    await goalManager.updateGoal(goalId, {
      milestones: updatedMilestones,
      progress: newProgress
    });
    await loadGoals();
  }, [goals, loadGoals]);

  // Delete milestone
  const deleteMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error("Goal not found");

    const updatedMilestones = goal.milestones.filter(m => m.id !== milestoneId);
    await goalManager.updateGoal(goalId, { milestones: updatedMilestones });
    await loadGoals();
  }, [goals, loadGoals]);

  // Update progress
  const updateProgress = useCallback(async (goalId: string, progress: number) => {
    await goalManager.updateGoal(goalId, { progress: Math.min(100, Math.max(0, progress)) });
    await loadGoals();
  }, [loadGoals]);

  // Increment progress
  const incrementProgress = useCallback(async (goalId: string, amount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) throw new Error("Goal not found");

    const newProgress = Math.min(100, Math.max(0, goal.progress + amount));
    await goalManager.updateGoal(goalId, { progress: newProgress });
    await loadGoals();
  }, [goals, loadGoals]);

  // Utility functions
  const getGoalById = useCallback((goalId: string) => {
    return goals.find(g => g.id === goalId);
  }, [goals]);

  const getGoalsBySubject = useCallback((subject: string) => {
    return goals.filter(g => g.subject === subject);
  }, [goals]);

  const getGoalsByStatus = useCallback((status: "active" | "completed" | "paused") => {
    return goals.filter(g => g.status === status);
  }, [goals]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadGoals();
  }, [loadGoals]);

  return {
    goals,
    isLoading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    pauseGoal,
    resumeGoal,
    addMilestone,
    completeMilestone,
    deleteMilestone,
    updateProgress,
    incrementProgress,
    getGoalById,
    getGoalsBySubject,
    getGoalsByStatus,
    refresh
  };
}

export default useGoals;
