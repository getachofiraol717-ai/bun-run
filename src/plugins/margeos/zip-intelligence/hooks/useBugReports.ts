// @ts-nocheck
/**
 * useBugReports Hook
 * React hook for bug analysis and reporting
 */

import { useState, useCallback, useMemo } from 'react';
import { Project } from '../models/ProjectModel';
import { BugReport, Bug } from '../models/BugReport';
import SecurityAnalyzer from '../analyzers/SecurityAnalyzer';
import PerformanceAnalyzer from '../analyzers/PerformanceAnalyzer';
import BugAnalysisEngine from '../core/BugAnalysisEngine';

export interface UseBugReportsReturn {
  // State
  bugReport: BugReport | null;
  securityAnalysis: {
    vulnerabilities: Array<{
      id: string;
      severity: string;
      category: string;
      title: string;
      description: string;
      file?: string;
      line?: number;
      suggestion: string;
      cwe?: string;
      owasp?: string;
    }>;
    overallRisk: string;
    riskScore: number;
    categories: Record<string, number>;
    recommendations: string[];
  } | null;
  performanceAnalysis: {
    score: number;
    issues: Array<{
      severity: string;
      category: string;
      title: string;
      description: string;
      file?: string;
      line?: number;
      impact: string;
      suggestion: string;
    }>;
    recommendations: string[];
  } | null;
  isAnalyzing: boolean;
  error: string | null;

  // Filters
  severityFilter: Bug['severity'][];
  categoryFilter: string[];
  fileFilter: string | null;

  // Actions
  analyzeBugs: (project: Project) => Promise<void>;
  setSeverityFilter: (severities: Bug['severity'][]) => void;
  setCategoryFilter: (categories: string[]) => void;
  setFileFilter: (file: string | null) => void;
  clearFilters: () => void;

  // Computed
  filteredBugs: Bug[];
  groupedBySeverity: Record<Bug['severity'], Bug[]>;
  groupedByCategory: Record<string, Bug[]>;
  groupedByFile: Record<string, Bug[]>;
  prioritizedFixes: Bug[];
  bugStatistics: {
    total: number;
    critical: number;
    major: number;
    minor: number;
    info: number;
    autoFixable: number;
  };
}

export function useBugReports(): UseBugReportsReturn {
  const [bugReport, setBugReport] = useState<BugReport | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<UseBugReportsReturn['securityAnalysis']>(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<UseBugReportsReturn['performanceAnalysis']>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Bug['severity'][]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [fileFilter, setFileFilter] = useState<string | null>(null);

  const securityAnalyzer = useMemo(() => SecurityAnalyzer.getInstance(), []);
  const performanceAnalyzer = useMemo(() => PerformanceAnalyzer.getInstance(), []);
  const bugEngine = useMemo(() => BugAnalysisEngine.getInstance(), []);

  const analyzeBugs = useCallback(async (project: Project) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Run security analysis
      const secResult = securityAnalyzer.analyze(project);
      setSecurityAnalysis({
        vulnerabilities: secResult.vulnerabilities.map((v) => ({
          id: v.id,
          severity: v.severity,
          category: v.category,
          title: v.title,
          description: v.description,
          file: v.file,
          line: v.line,
          suggestion: v.suggestion,
          cwe: v.cwe,
          owasp: v.owasp,
        })),
        overallRisk: secResult.overallRisk,
        riskScore: secResult.riskScore,
        categories: secResult.categories,
        recommendations: secResult.recommendations,
      });

      // Run performance analysis
      const perfResult = performanceAnalyzer.analyze(project);
      setPerformanceAnalysis({
        score: perfResult.score,
        issues: perfResult.issues.map((i) => ({
          severity: i.severity,
          category: i.category,
          title: i.title,
          description: i.description,
          file: i.file,
          line: i.line,
          impact: i.impact,
          suggestion: i.suggestion,
        })),
        recommendations: perfResult.recommendations,
      });

      // Generate combined bug report
      const combinedReport = bugEngine.analyze(project);
      setBugReport(combinedReport);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bug analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [securityAnalyzer, performanceAnalyzer, bugEngine]);

  const clearFilters = useCallback(() => {
    setSeverityFilter([]);
    setCategoryFilter([]);
    setFileFilter(null);
  }, []);

  // Computed: filtered bugs
  const filteredBugs = useMemo(() => {
    if (!bugReport) return [];

    return bugReport.bugs.filter((bug) => {
      // Severity filter
      if (severityFilter.length > 0 && !severityFilter.includes(bug.severity)) {
        return false;
      }

      // Category filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(bug.category)) {
        return false;
      }

      // File filter
      if (fileFilter && bug.file !== fileFilter) {
        return false;
      }

      return true;
    });
  }, [bugReport, severityFilter, categoryFilter, fileFilter]);

  // Computed: grouped by severity
  const groupedBySeverity = useMemo(() => {
    if (!bugReport) return {
      critical: [],
      major: [],
      minor: [],
      info: [],
    };

    return {
      critical: bugReport.bugs.filter((b) => b.severity === 'critical'),
      major: bugReport.bugs.filter((b) => b.severity === 'major'),
      minor: bugReport.bugs.filter((b) => b.severity === 'minor'),
      info: bugReport.bugs.filter((b) => b.severity === 'info'),
    };
  }, [bugReport]);

  // Computed: grouped by category
  const groupedByCategory = useMemo(() => {
    if (!bugReport) return {};

    const groups: Record<string, Bug[]> = {};
    for (const bug of bugReport.bugs) {
      if (!groups[bug.category]) {
        groups[bug.category] = [];
      }
      groups[bug.category].push(bug);
    }

    return groups;
  }, [bugReport]);

  // Computed: grouped by file
  const groupedByFile = useMemo(() => {
    if (!bugReport) return {};

    const groups: Record<string, Bug[]> = {};
    for (const bug of bugReport.bugs) {
      if (!bug.file) continue;
      if (!groups[bug.file]) {
        groups[bug.file] = [];
      }
      groups[bug.file].push(bug);
    }

    return groups;
  }, [bugReport]);

  // Computed: prioritized fixes
  const prioritizedFixes = useMemo(() => {
    if (!bugReport) return [];
    return bugEngine.prioritizeFixes(bugReport);
  }, [bugReport, bugEngine]);

  // Computed: statistics
  const bugStatistics = useMemo(() => {
    if (!bugReport) {
      return {
        total: 0,
        critical: 0,
        major: 0,
        minor: 0,
        info: 0,
        autoFixable: 0,
      };
    }

    return bugReport.statistics;
  }, [bugReport]);

  return {
    bugReport,
    securityAnalysis,
    performanceAnalysis,
    isAnalyzing,
    error,
    severityFilter,
    categoryFilter,
    fileFilter,
    analyzeBugs,
    setSeverityFilter,
    setCategoryFilter,
    setFileFilter,
    clearFilters,
    filteredBugs,
    groupedBySeverity,
    groupedByCategory,
    groupedByFile,
    prioritizedFixes,
    bugStatistics,
  };
}

export default useBugReports;
