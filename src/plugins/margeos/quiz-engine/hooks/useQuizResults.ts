// @ts-nocheck
// Adaptive Quiz Engine — useQuizResults Hook
// React hook for accessing and analyzing quiz results

import { useState, useEffect, useCallback } from "react";
import type { QuizResult } from "../models/QuizResult";
import type { PerformanceMetrics, TrendData, TopicBreakdown } from "../services/QuizAnalyticsService";
import { QuizController } from "../core/QuizController";
import { QuizAnalyticsService } from "../services/QuizAnalyticsService";

export interface UseQuizResultsReturn {
  // State
  results: QuizResult[];
  isLoading: boolean;
  error: string | null;

  // Metrics
  metrics: PerformanceMetrics | null;
  trendData: TrendData[];
  topicBreakdown: TopicBreakdown[];

  // Actions
  fetchResults: (limit?: number) => Promise<void>;
  getResultById: (resultId: string) => QuizResult | null;
  getResultsBySubject: (subject: string) => QuizResult[];
  getResultsByDateRange: (start: Date, end: Date) => QuizResult[];

  // Computed
  totalQuizzes: number;
  averageScore: number;
  bestScore: number;
  recentImprovement: number;
}

export function useQuizResults(userId: string): UseQuizResultsReturn {
  const [controller] = useState(() => QuizController.getInstance());
  const [analytics] = useState(() => QuizAnalyticsService.getInstance());

  const [results, setResults] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch results
  const fetchResults = useCallback(async (limit?: number): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedResults = await controller.getQuizHistory(limit);
      setResults(fetchedResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch results";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [controller]);

  // Load results on mount
  useEffect(() => {
    fetchResults(50);
  }, [fetchResults]);

  // Compute metrics
  const metrics = results.length > 0 ? analytics.calculateMetrics(results) : null;

  // Get trend data
  const trendData = analytics.getTrendData(results, 30);

  // Get topic breakdown
  const topicBreakdown = analytics.getTopicBreakdown(results);

  // Get result by ID
  const getResultById = useCallback((resultId: string): QuizResult | null => {
    return results.find(r => r.id === resultId) || null;
  }, [results]);

  // Get results by subject
  const getResultsBySubject = useCallback((subject: string): QuizResult[] => {
    return results.filter(r =>
      r.summary.quizTitle.toLowerCase().includes(subject.toLowerCase())
    );
  }, [results]);

  // Get results by date range
  const getResultsByDateRange = useCallback((start: Date, end: Date): QuizResult[] => {
    return results.filter(r => r.createdAt >= start && r.createdAt <= end);
  }, [results]);

  // Computed values
  const totalQuizzes = results.length;
  const averageScore = metrics?.overallAccuracy ?? 0;
  const bestScore = metrics?.bestScore ?? 0;

  // Calculate recent improvement
  const recentImprovement = results.length >= 2
    ? results[0].summary.percentage - results[1].summary.percentage
    : 0;

  return {
    results,
    isLoading,
    error,
    metrics,
    trendData,
    topicBreakdown,
    fetchResults,
    getResultById,
    getResultsBySubject,
    getResultsByDateRange,
    totalQuizzes,
    averageScore,
    bestScore,
    recentImprovement
  };
}

export default useQuizResults;
