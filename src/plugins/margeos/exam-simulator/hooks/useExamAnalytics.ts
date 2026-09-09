// @ts-nocheck
/**
 * useExamAnalytics.ts
 *
 * React hook for exam analytics and insights.
 */

import { useState, useEffect, useCallback } from 'react';
import { analyticsService, PerformanceTrend, TopicInsight } from '../services/AnalyticsService';
import type { PerformanceProfile } from '../models/PerformanceProfile';

export interface UseExamAnalyticsOptions {
  userId?: string;
  timeframe?: 'week' | 'month' | 'quarter' | 'all';
  autoLoad?: boolean;
}

export interface AnalyticsState {
  profile: PerformanceProfile | null;
  trend: PerformanceTrend | null;
  topicInsights: TopicInsight[];
  insights: any[];
  summary: {
    totalExams: number;
    totalQuestions: number;
    averageScore: number;
    bestScore: number;
    passRate: number;
    studyStreak: number;
  } | null;
  comparative: {
    personal: any;
    comparison: any[];
    overall: any;
  } | null;
  isLoading: boolean;
  error: string | null;
}

export function useExamAnalytics(options: UseExamAnalyticsOptions = {}) {
  const { userId = 'current_user', timeframe = 'month', autoLoad = false } = options;

  const [state, setState] = useState<AnalyticsState>({
    profile: null,
    trend: null,
    topicInsights: [],
    insights: [],
    summary: null,
    comparative: null,
    isLoading: false,
    error: null
  });

  // Load all analytics
  const loadAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load in parallel
      const [trend, topicInsights, insights, summary, comparative] = await Promise.all([
        analyticsService.getPerformanceTrend(userId, timeframe),
        analyticsService.getTopicInsights(userId),
        analyticsService.getInsights(userId),
        analyticsService.getPerformanceSummary(userId),
        analyticsService.getComparativeAnalytics(userId)
      ]);

      setState({
        profile: null,
        trend: trend.trend,
        topicInsights,
        insights,
        summary,
        comparative,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load analytics'
      }));
    }
  }, [userId, timeframe]);

  // Load on mount if autoLoad
  useEffect(() => {
    if (autoLoad) {
      loadAnalytics();
    }
  }, [autoLoad, userId, timeframe]);

  // Get performance trend
  const getTrend = useCallback(() => {
    return state.trend;
  }, [state.trend]);

  // Get strengths
  const getStrengths = useCallback(() => {
    return state.topicInsights.filter(t => t.strength === 'strong').map(t => t.topic);
  }, [state.topicInsights]);

  // Get weaknesses
  const getWeaknesses = useCallback(() => {
    return state.topicInsights.filter(t => t.strength === 'weak').map(t => t.topic);
  }, [state.topicInsights]);

  // Get improving topics
  const getImprovingTopics = useCallback(() => {
    return state.topicInsights.filter(t => t.trend.direction === 'improving').map(t => t.topic);
  }, [state.topicInsights]);

  // Get declining topics
  const getDecliningTopics = useCallback(() => {
    return state.topicInsights.filter(t => t.trend.direction === 'declining').map(t => t.topic);
  }, [state.topicInsights]);

  // Get high priority insights
  const getHighPriorityInsights = useCallback(() => {
    return state.insights.filter(i => i.priority === 'high');
  }, [state.insights]);

  // Get milestone
  const getNextMilestone = useCallback(() => {
    return state.summary?.nextMilestone || { name: 'Get Started', progress: 0, target: 1 };
  }, [state.summary]);

  // Get efficiency metrics
  const getEfficiency = useCallback(() => {
    // Would need results data - simplified for now
    return { scorePerHour: 0, improvementRate: 0, consistency: 0 };
  }, []);

  // Get performance scores timeline
  const getScoresTimeline = useCallback(async () => {
    const trend = await analyticsService.getPerformanceTrend(userId, timeframe);
    return trend.scores;
  }, [userId, timeframe]);

  // Generate progress report
  const generateProgressReport = useCallback(async () => {
    return await analyticsService.generateProgressReport(userId, timeframe);
  }, [userId, timeframe]);

  // Refresh analytics
  const refresh = useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    // State
    profile: state.profile,
    trend: state.trend,
    topicInsights: state.topicInsights,
    insights: state.insights,
    summary: state.summary,
    comparative: state.comparative,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadAnalytics,
    refresh,
    generateProgressReport,

    // Helpers
    getTrend,
    getStrengths,
    getWeaknesses,
    getImprovingTopics,
    getDecliningTopics,
    getHighPriorityInsights,
    getNextMilestone,
    getEfficiency,
    getScoresTimeline,

    // Computed
    totalExams: state.summary?.totalExams || 0,
    averageScore: state.summary?.averageScore || 0,
    bestScore: state.summary?.bestScore || 0,
    passRate: state.summary?.passRate || 0,
    studyStreak: state.summary?.studyStreak || 0,
    hasData: state.summary !== null && state.summary.totalExams > 0
  };
}

export default useExamAnalytics;
