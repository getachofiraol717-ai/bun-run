// @ts-nocheck
/**
 * useReadiness.ts
 *
 * React hook for readiness assessment functionality.
 */

import { useState, useEffect, useCallback } from 'react';
import { ReadinessAnalyzer } from '../core/ReadinessAnalyzer';
import { readinessService } from '../services/ReadinessService';
import type { ReadinessReport, ReadinessLevel } from '../models/ReadinessReport';

export interface UseReadinessOptions {
  topics?: string[];
  subject?: string;
  autoCheck?: boolean;
}

export interface ReadinessState {
  report: ReadinessReport | null;
  level: ReadinessLevel;
  score: number;
  isLoading: boolean;
  error: string | null;
}

export function useReadiness(options: UseReadinessOptions = {}) {
  const { topics = [], subject, autoCheck = false } = options;

  const [state, setState] = useState<ReadinessState>({
    report: null,
    level: 'not_ready',
    score: 0,
    isLoading: false,
    error: null
  });

  const analyzerRef = useCallback(() => ReadinessAnalyzer.getInstance(), [])();

  // Auto-check on mount if enabled
  useEffect(() => {
    if (autoCheck && topics.length > 0) {
      checkReadiness();
    }
  }, [autoCheck, topics.join(',')]);

  // Check readiness
  const checkReadiness = useCallback(async () => {
    if (topics.length === 0) {
      setState(prev => ({ ...prev, error: 'No topics provided' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const report = await analyzerRef.getReadinessReport(topics, subject);

      setState({
        report,
        level: report.level,
        score: Math.round(report.overallScore * 100),
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to check readiness'
      }));
    }
  }, [topics.join(','), subject, analyzerRef]);

  // Get level description
  const getLevelDescription = useCallback(() => {
    return readinessService.getLevelDescription(state.level);
  }, [state.level]);

  // Get level color
  const getLevelColor = useCallback(() => {
    return readinessService.getLevelColor(state.level);
  }, [state.level]);

  // Get level icon
  const getLevelIcon = useCallback(() => {
    return readinessService.getLevelIcon(state.level);
  }, [state.level]);

  // Is ready for exam
  const isReady = useCallback(() => {
    return state.level !== 'not_ready' && state.level !== 'slightly_prepared';
  }, [state.level]);

  // Get critical gaps
  const getCriticalGaps = useCallback(() => {
    return state.report?.criticalGaps || [];
  }, [state.report]);

  // Get recommendations
  const getRecommendations = useCallback(() => {
    return state.report?.recommendations || [];
  }, [state.report]);

  // Get factor scores
  const getFactorScores = useCallback(() => {
    return state.report?.factorScores || [];
  }, [state.report]);

  // Generate study plan
  const generateStudyPlan = useCallback(async (
    daysUntilExam: number,
    hoursPerDay: number
  ) => {
    return await readinessService.generateStudyPlan(topics, daysUntilExam, hoursPerDay);
  }, [topics]);

  // Get study intensity
  const getStudyIntensity = useCallback(() => {
    return readinessService.getRecommendedIntensity(state.level);
  }, [state.level]);

  // Calculate time to readiness
  const getTimeToReadiness = useCallback((targetScore?: number) => {
    return readinessService.calculateTimeToReadiness(state.score / 100, targetScore);
  }, [state.score]);

  // Get progress metrics
  const getProgressMetrics = useCallback(() => {
    if (!state.report?.metadata) return null;

    return {
      studyHours: state.report.metadata.studyHours || 0,
      practiceQuestions: state.report.metadata.practiceQuestions || 0,
      averageScore: state.report.metadata.averageScore || 0,
      topicMastery: state.report.metadata.topicMastery || {}
    };
  }, [state.report]);

  return {
    // State
    report: state.report,
    level: state.level,
    score: state.score,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    checkReadiness,

    // Helpers
    isReady,
    getLevelDescription,
    getLevelColor,
    getLevelIcon,
    getCriticalGaps,
    getRecommendations,
    getFactorScores,
    generateStudyPlan,
    getStudyIntensity,
    getTimeToReadiness,
    getProgressMetrics
  };
}

export default useReadiness;
