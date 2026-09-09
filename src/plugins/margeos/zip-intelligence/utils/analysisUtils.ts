/**
 * Analysis Utilities
 * Helper functions for analysis results
 */

import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport, Bug } from '../models/BugReport';

export interface ScoreGrade {
  letter: string;
  label: string;
  color: string;
}

/**
 * Convert numeric score to letter grade
 */
export function getGrade(score: number): ScoreGrade {
  if (score >= 90) return { letter: 'A', label: 'Excellent', color: '#22c55e' };
  if (score >= 80) return { letter: 'B', label: 'Good', color: '#84cc16' };
  if (score >= 70) return { letter: 'C', label: 'Fair', color: '#eab308' };
  if (score >= 60) return { letter: 'D', label: 'Poor', color: '#f97316' };
  return { letter: 'F', label: 'Failing', color: '#ef4444' };
}

/**
 * Format analysis summary
 */
export function formatAnalysisSummary(analysis: AnalysisReport): string {
  const grade = getGrade(analysis.score?.overall || 0);

  const lines = [
    `# ${analysis.projectId} - Analysis Report`,
    '',
    `**Overall Grade:** ${grade.letter} (${grade.label})`,
    `**Health:** ${analysis.summary.overallHealth}`,
    `**Complexity:** ${analysis.summary.complexity}`,
    `**Maintainability:** ${analysis.summary.maintainability}/100`,
    '',
  ];

  if (analysis.summary.keyFindings.length > 0) {
    lines.push('## Key Findings', '');
    for (const finding of analysis.summary.keyFindings) {
      lines.push(`- ${finding}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Sort bugs by severity
 */
export function sortBugsBySeverity(bugs: Bug[]): Bug[] {
  const severityOrder: Record<Bug['severity'], number> = {
    critical: 0,
    major: 1,
    minor: 2,
    info: 3,
  };

  return [...bugs].sort((a, b) => {
    const orderA = severityOrder[a.severity];
    const orderB = severityOrder[b.severity];

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Secondary sort by category
    return a.category.localeCompare(b.category);
  });
}

/**
 * Group bugs by file
 */
export function groupBugsByFile(bugs: Bug[]): Record<string, Bug[]> {
  const groups: Record<string, Bug[]> = {};

  for (const bug of bugs) {
    const file = bug.file || 'unknown';
    if (!groups[file]) {
      groups[file] = [];
    }
    groups[file].push(bug);
  }

  return groups;
}

/**
 * Group bugs by severity
 */
export function groupBugsBySeverity(bugs: Bug[]): Record<Bug['severity'], Bug[]> {
  return {
    critical: bugs.filter((b) => b.severity === 'critical'),
    major: bugs.filter((b) => b.severity === 'major'),
    minor: bugs.filter((b) => b.severity === 'minor'),
    info: bugs.filter((b) => b.severity === 'info'),
  };
}

/**
 * Calculate fix priority score
 */
export function calculateFixPriority(bug: Bug): number {
  const severityWeight: Record<Bug['severity'], number> = {
    critical: 100,
    major: 50,
    minor: 20,
    info: 5,
  };

  const effortWeight: Record<Bug['effort'], number> = {
    low: 10,
    medium: 5,
    high: 1,
  };

  const baseScore = severityWeight[bug.severity] * effortWeight[bug.effort];

  // Bonus for auto-fixable
  if (bug.autoFixable) {
    return baseScore * 1.5;
  }

  return baseScore;
}

/**
 * Generate fix order
 */
export function generateFixOrder(bugs: Bug[]): Bug[] {
  return sortBugsBySeverity(bugs).sort((a, b) => {
    return calculateFixPriority(b) - calculateFixPriority(a);
  });
}

/**
 * Calculate project health metrics
 */
export function calculateHealthMetrics(analysis: AnalysisReport): {
  score: number;
  metrics: Record<string, { value: number; max: number; label: string }>;
  overall: string;
} {
  const metrics: Record<string, { value: number; max: number; label: string }> = {
    maintainability: {
      value: analysis.summary.maintainability,
      max: 100,
      label: 'Maintainability',
    },
    testability: {
      value: analysis.summary.testability,
      max: 100,
      label: 'Testability',
    },
  };

  // Add code quality metrics if available
  if (analysis.details.codeQuality) {
    const issueCount = analysis.details.codeQuality.issues.length;
    metrics.codeQuality = {
      value: Math.max(0, 100 - issueCount * 5),
      max: 100,
      label: 'Code Quality',
    };
  }

  const totalScore = Object.values(metrics).reduce(
    (sum, m) => sum + (m.value / m.max),
    0
  );

  const averageScore = Math.round((totalScore / Object.keys(metrics).length) * 100);

  let overall: string;
  if (averageScore >= 80) overall = 'Healthy';
  else if (averageScore >= 60) overall = 'Fair';
  else if (averageScore >= 40) overall = 'Needs Attention';
  else overall = 'Critical';

  return {
    score: averageScore,
    metrics,
    overall,
  };
}

/**
 * Compare two analysis reports
 */
export function compareAnalyses(
  before: AnalysisReport,
  after: AnalysisReport
): {
  scoreDelta: number;
  improvements: string[];
  regressions: string[];
} {
  const scoreDelta = (after.score?.overall || 0) - (before.score?.overall || 0);
  const improvements: string[] = [];
  const regressions: string[] = [];

  // Compare metrics
  if (after.summary.maintainability > before.summary.maintainability) {
    improvements.push(
      `Maintainability improved by ${after.summary.maintainability - before.summary.maintainability}%`
    );
  } else if (after.summary.maintainability < before.summary.maintainability) {
    regressions.push(
      `Maintainability decreased by ${before.summary.maintainability - after.summary.maintainability}%`
    );
  }

  // Compare bug counts
  const beforeBugs = before.details.codeQuality?.issues.length || 0;
  const afterBugs = after.details.codeQuality?.issues.length || 0;

  if (afterBugs < beforeBugs) {
    improvements.push(`Resolved ${beforeBugs - afterBugs} code issues`);
  } else if (afterBugs > beforeBugs) {
    regressions.push(`Added ${afterBugs - beforeBugs} new code issues`);
  }

  return {
    scoreDelta,
    improvements,
    regressions,
  };
}

/**
 * Generate progress summary
 */
export function generateProgressSummary(completed: number, total: number): {
  percentage: number;
  label: string;
  color: string;
} {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  let label: string;
  let color: string;

  if (percentage >= 100) {
    label = 'Complete';
    color = '#22c55e';
  } else if (percentage >= 75) {
    label = 'Almost there';
    color = '#84cc16';
  } else if (percentage >= 50) {
    label = 'Halfway';
    color = '#eab308';
  } else if (percentage >= 25) {
    label = 'Getting started';
    color = '#f97316';
  } else {
    label = 'Just started';
    color = '#ef4444';
  }

  return { percentage, label, color };
}

export default {
  getGrade,
  formatAnalysisSummary,
  sortBugsBySeverity,
  groupBugsByFile,
  groupBugsBySeverity,
  calculateFixPriority,
  generateFixOrder,
  calculateHealthMetrics,
  compareAnalyses,
  generateProgressSummary,
};
