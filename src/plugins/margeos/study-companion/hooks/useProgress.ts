// @ts-nocheck
// Study Companion — useProgress Hook
// React hook for accessing progress tracking and analytics

import { useState, useEffect, useCallback } from "react";
import { progressAnalyzer } from "../core/ProgressAnalyzer";
import { progressService } from "../services/ProgressService";
import { sessionAnalyticsService } from "../services/SessionAnalyticsService";
import type { ProgressReport, SessionAnalytics, SessionTrend } from "../services/SessionAnalyticsService";

export interface ProgressStats {
  totalStudyTime: number;
  totalSessions: number;
  averageSessionLength: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  focusScore: number;
}

export interface SubjectProgress {
  subject: string;
  studyTime: number;
  sessions: number;
  mastery: number;
  trend: "up" | "down" | "stable";
  lastStudied: Date | null;
}

export interface UseProgressOptions {
  userId: string;
  autoLoad?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface UseProgressReturn {
  // State
  isLoading: boolean;
  error: string | null;

  // Analytics data
  analytics: SessionAnalytics | null;
  trends: SessionTrend[];

  // Progress reports
  weeklyReport: ProgressReport | null;
  monthlyReport: ProgressReport | null;

  // Statistics
  stats: ProgressStats | null;
  subjectProgress: SubjectProgress[];

  // Actions
  refresh: () => Promise<void>;
  generateReport: (start: Date, end: Date) => Promise<ProgressReport>;

  // Formatted values
  formatStudyTime: (minutes: number) => string;
  formatDate: (date: Date) => string;
}

export function useProgress(options: UseProgressOptions): UseProgressReturn {
  const { userId, autoLoad = true, dateRange } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const [trends, setTrends] = useState<SessionTrend[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<ProgressReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<ProgressReport | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);

  // Load all progress data
  const loadProgress = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Initialize services
      await sessionAnalyticsService.initialize(userId);
      await progressService.initialize(userId);
      await progressAnalyzer.initialize(userId);

      // Load analytics
      const filter = dateRange ? {
        startDate: dateRange.start,
        endDate: dateRange.end
      } : undefined;

      const loadedAnalytics = await sessionAnalyticsService.analyzeSessions(filter);
      setAnalytics(loadedAnalytics);

      // Load trends
      const loadedTrends = await sessionAnalyticsService.getSessionTrends(4);
      setTrends(loadedTrends);

      // Load weekly report
      const weekly = await progressService.generateWeeklyReport();
      setWeeklyReport(weekly);

      // Load monthly report
      const monthly = await progressService.generateMonthlyReport();
      setMonthlyReport(monthly);

      // Calculate stats from analytics
      const streaks = await sessionAnalyticsService.getSessionStreaks();
      setStats({
        totalStudyTime: loadedAnalytics.totalStudyTime,
        totalSessions: loadedAnalytics.totalSessions,
        averageSessionLength: loadedAnalytics.averageSessionLength,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        completionRate: loadedAnalytics.completionRate,
        focusScore: loadedAnalytics.focusScore
      });

      // Calculate subject progress
      const subjectData = loadedAnalytics.subjectBreakdown;
      const subjectProgressData: SubjectProgress[] = Object.entries(subjectData).map(
        ([subject, time]) => ({
          subject,
          studyTime: time,
          sessions: loadedAnalytics.sessionsByDay[subject] || 0,
          mastery: 0, // Would come from ProgressAnalyzer
          trend: "stable" as const,
          lastStudied: null
        })
      );
      setSubjectProgress(subjectProgressData);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load progress";
      setError(message);
      console.error("Load progress error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dateRange]);

  useEffect(() => {
    if (autoLoad) {
      loadProgress();
    }
  }, [autoLoad, loadProgress]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);

  // Generate custom report
  const generateReport = useCallback(async (start: Date, end: Date): Promise<ProgressReport> => {
    return await progressService.generateReport(start, end);
  }, []);

  // Format study time
  const formatStudyTime = useCallback((minutes: number): string => {
    return progressService.formatStudyTime(minutes);
  }, []);

  // Format date
  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }, []);

  return {
    isLoading,
    error,
    analytics,
    trends,
    weeklyReport,
    monthlyReport,
    stats,
    subjectProgress,
    refresh,
    generateReport,
    formatStudyTime,
    formatDate
  };
}

// Hook for progress insights
export function useProgressInsights(userId: string) {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      await progressAnalyzer.initialize(userId);
      const progressInsights = await progressAnalyzer.generateInsights();
      setInsights(progressInsights);
    } catch (err) {
      console.error("Generate insights error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  return { insights, isLoading, regenerate: generateInsights };
}

export default useProgress;
