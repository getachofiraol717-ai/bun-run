// @ts-nocheck
/**
 * useWeaknessReport.ts
 *
 * React hook for weakness analysis functionality.
 */

import { useState, useCallback } from 'react';
import { WeaknessAnalyzer } from '../core/WeaknessAnalyzer';
import type { WeaknessReport, Weakness, QuickWin } from '../models/WeaknessReport';

export interface UseWeaknessReportOptions {
  topics?: string[];
  autoLoad?: boolean;
}

export interface WeaknessReportState {
  report: WeaknessReport | null;
  weaknesses: Weakness[];
  quickWins: QuickWin[];
  isLoading: boolean;
  error: string | null;
}

export function useWeaknessReport(options: UseWeaknessReportOptions = {}) {
  const { topics = [], autoLoad = false } = options;

  const [state, setState] = useState<WeaknessReportState>({
    report: null,
    weaknesses: [],
    quickWins: [],
    isLoading: false,
    error: null
  });

  // Load weakness report
  const loadWeaknessReport = useCallback(async () => {
    if (topics.length === 0) {
      setState(prev => ({ ...prev, error: 'No topics provided' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const analyzer = WeaknessAnalyzer.getInstance();
      const report = await analyzer.getWeaknessReport(topics);

      setState({
        report,
        weaknesses: report?.topicWeaknesses || [],
        quickWins: report?.quickWins || [],
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load weakness report'
      }));
    }
  }, [topics.join(',')]);

  // Get weaknesses by priority
  const getWeaknessesByPriority = useCallback((
    priority: 'critical' | 'high' | 'medium' | 'low'
  ) => {
    return state.weaknesses.filter(w => (w as any).priority === priority);
  }, [state.weaknesses]);

  // Get weaknesses by type
  const getWeaknessesByType = useCallback((type: Weakness['type']) => {
    return state.weaknesses.filter(w => w.type === type);
  }, [state.weaknesses]);

  // Get critical weaknesses count
  const getCriticalCount = useCallback(() => {
    return state.report?.criticalWeaknesses || 0;
  }, [state.report]);

  // Get improvement areas
  const getImprovementAreas = useCallback(() => {
    return state.report?.improvementAreas || [];
  }, [state.report]);

  // Get study recommendations
  const getStudyRecommendations = useCallback(() => {
    return state.report?.studyRecommendations || [];
  }, [state.report]);

  // Get remediation plans
  const getRemediationPlans = useCallback(() => {
    return state.report?.remediationPlans || [];
  }, [state.report]);

  // Get estimated improvement
  const getEstimatedImprovement = useCallback(() => {
    return state.report?.estimatedImprovement || {
      potentialScoreIncrease: 0,
      timeframe: 'Unknown',
      confidence: 0
    };
  }, [state.report]);

  // Get categorized weaknesses
  const getCategorizedWeaknesses = useCallback(() => {
    if (!state.report) return null;

    return {
      topics: state.report.topicWeaknesses,
      concepts: state.report.conceptWeaknesses,
      skills: state.report.skillWeaknesses,
      formulas: state.report.formulaWeaknesses,
      prerequisites: state.report.prerequisiteGaps,
      misconceptions: state.report.misconceptionWeaknesses
    };
  }, [state.report]);

  // Auto-load if enabled
  if (autoLoad && topics.length > 0 && !state.report && !state.isLoading) {
    loadWeaknessReport();
  }

  return {
    // State
    report: state.report,
    weaknesses: state.weaknesses,
    quickWins: state.quickWins,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadWeaknessReport,

    // Helpers
    getWeaknessesByPriority,
    getWeaknessesByType,
    getCriticalCount,
    getImprovementAreas,
    getStudyRecommendations,
    getRemediationPlans,
    getEstimatedImprovement,
    getCategorizedWeaknesses,
    hasWeaknesses: state.weaknesses.length > 0,
    hasQuickWins: state.quickWins.length > 0
  };
}

export default useWeaknessReport;
