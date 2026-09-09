// @ts-nocheck
// Adaptive Quiz Engine — useMastery Hook
// React hook for tracking mastery levels

import { useState, useEffect, useCallback } from "react";
import type { MasteryReport, MasteryLevel, MasteryCategory } from "../models/MasteryReport";
import type { ProgressSummary, Achievement } from "../services/ProgressTrackingService";
import { MasteryEngine } from "../core/MasteryEngine";
import { ProgressTrackingService } from "../services/ProgressTrackingService";

export interface UseMasteryReturn {
  // State
  report: MasteryReport | null;
  progress: ProgressSummary | null;
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshReport: () => Promise<void>;
  getMasteryLevel: (category: MasteryCategory, targetId: string) => MasteryLevel | null;
  setGoal: (goal: any) => void;

  // Computed
  overallMastery: number;
  masteredTopics: number;
  inProgressTopics: number;
  currentStreak: number;
  longestStreak: number;
  unlockedAchievements: number;
  totalAchievements: number;
}

export function useMastery(userId: string): UseMasteryReturn {
  const [masteryEngine] = useState(() => MasteryEngine.getInstance());
  const [progressService] = useState(() => ProgressTrackingService.getInstance());

  const [report, setReport] = useState<MasteryReport | null>(null);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch report
  const refreshReport = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const masteryReport = await masteryEngine.getMasteryReport(userId);
      setReport(masteryReport);

      const progressSummary = progressService.getProgressSummary(userId);
      setProgress(progressSummary);

      const userAchievements = progressService.getAchievements(userId);
      setAchievements(userAchievements);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch mastery report";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [masteryEngine, progressService, userId]);

  // Load on mount
  useEffect(() => {
    refreshReport();
  }, [refreshReport]);

  // Get mastery level for specific item
  const getMasteryLevel = useCallback((
    category: MasteryCategory,
    targetId: string
  ): MasteryLevel | null => {
    return masteryEngine.getMasteryLevel(userId, category, targetId);
  }, [masteryEngine, userId]);

  // Set goal
  const setGoal = useCallback((goal: any): void => {
    masteryEngine.setGoal({ ...goal, userId });
    refreshReport();
  }, [masteryEngine, userId, refreshReport]);

  // Computed values
  const overallMastery = report?.summary.overallMastery ?? 0;
  const masteredTopics = report?.summary.topicsMastered ?? 0;
  const inProgressTopics = report?.summary.topicsMastered ?? 0;

  const streak = progressService.getStreak(userId);
  const currentStreak = streak.current;
  const longestStreak = streak.longest;

  const unlockedAchievements = achievements.filter(a => a.unlockedAt).length;
  const totalAchievements = achievements.length;

  return {
    report,
    progress,
    achievements,
    isLoading,
    error,
    refreshReport,
    getMasteryLevel,
    setGoal,
    overallMastery,
    masteredTopics,
    inProgressTopics,
    currentStreak,
    longestStreak,
    unlockedAchievements,
    totalAchievements
  };
}

export default useMastery;
