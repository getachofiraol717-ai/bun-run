// @ts-nocheck
/**
 * reportUtils.ts
 *
 * Utility functions for report generation.
 */

import type { ExamResult } from '../models';
import type { ReadinessReport } from '../models/ReadinessReport';
import type { WeaknessReport } from '../models/WeaknessReport';
import type { PerformanceProfile } from '../models/PerformanceProfile';

/**
 * Format report date
 */
export function formatReportDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate performance summary text
 */
export function generatePerformanceSummary(result: ExamResult): string {
  const { percentage, totalScore, maxScore, grade, passed } = result.summary;

  if (passed) {
    if (percentage >= 90) {
      return `Outstanding performance! You scored ${percentage.toFixed(1)}% (${grade}) with ${totalScore}/${maxScore} points.`;
    } else if (percentage >= 75) {
      return `Great job! You scored ${percentage.toFixed(1)}% (${grade}) with ${totalScore}/${maxScore} points.`;
    } else {
      return `Good work! You passed with ${percentage.toFixed(1)}% (${grade}) and ${totalScore}/${maxScore} points.`;
    }
  } else {
    if (percentage >= 50) {
      return `You scored ${percentage.toFixed(1)}% (${grade}). With a bit more preparation, you'll pass next time.`;
    } else {
      return `You scored ${percentage.toFixed(1)}% (${grade}). Focus on the weak areas identified in your report.`;
    }
  }
}

/**
 * Generate topic analysis summary
 */
export function generateTopicAnalysis(result: ExamResult): {
  summary: string;
  strengths: string[];
  improvements: string[];
} {
  const { topicResults } = result;

  const sorted = [...topicResults].sort((a, b) => b.percentage - a.percentage);
  const strengths = sorted.filter(t => t.percentage >= 70).map(t => t.topic);
  const improvements = sorted.filter(t => t.percentage < 60).map(t => t.topic);

  let summary = '';
  if (strengths.length > 0 && improvements.length > 0) {
    summary = `You performed well in ${strengths.join(', ')} but need improvement in ${improvements.join(', ')}.`;
  } else if (strengths.length > 0) {
    summary = `You demonstrated strong knowledge in ${strengths.join(', ')}.`;
  } else if (improvements.length > 0) {
    summary = `Focus on improving ${improvements.join(', ')} to boost your overall score.`;
  } else {
    summary = 'Your performance was moderate across all topics.';
  }

  return { summary, strengths, improvements };
}

/**
 * Generate readiness summary
 */
export function generateReadinessSummary(report: ReadinessReport): {
  overall: string;
  factors: { factor: string; status: string; score: number }[];
  nextSteps: string[];
} {
  const { overallScore, level, factorScores, recommendations } = report;

  const levelDescriptions: Record<string, string> = {
    highly_prepared: 'You are highly prepared for this exam!',
    well_prepared: 'You are well prepared. A bit more practice will help.',
    moderately_prepared: 'You have a decent foundation. Continue studying.',
    slightly_prepared: 'You need more preparation. Focus on key areas.',
    not_ready: 'Significant preparation is needed before attempting this exam.'
  };

  const factors = factorScores.map(f => ({
    factor: f.label,
    status: f.status === 'good' ? 'Good' : f.status === 'needs_improvement' ? 'Needs Work' : 'Poor',
    score: Math.round(f.score * 100)
  }));

  const nextSteps = recommendations.slice(0, 3).map(r => r.action);

  return {
    overall: levelDescriptions[level] || `Your readiness score is ${Math.round(overallScore * 100)}%.`,
    factors,
    nextSteps
  };
}

/**
 * Generate weakness summary
 */
export function generateWeaknessSummary(report: WeaknessReport): {
  summary: string;
  criticalAreas: string[];
  quickWins: { topic: string; action: string }[];
  estimatedTime: string;
} {
  const { totalWeaknesses, criticalWeaknesses, topicWeaknesses, quickWins, estimatedImprovement } = report;

  const criticalAreas = topicWeaknesses
    .filter(w => (w as any).priority === 'critical' || w.severity >= 0.8)
    .map(w => w.topic);

  const summary = totalWeaknesses === 0
    ? 'Great news! No significant weaknesses were identified.'
    : `You have ${totalWeaknesses} areas to improve, including ${criticalWeaknesses} critical areas.`;

  return {
    summary,
    criticalAreas,
    quickWins: quickWins.map(qw => ({ topic: qw.topic, action: qw.action })),
    estimatedTime: estimatedImprovement?.timeframe || '1-2 weeks'
  };
}

/**
 * Generate performance profile summary
 */
export function generateProfileSummary(profile: PerformanceProfile): {
  summary: string;
  highlights: string[];
  achievements: string[];
} {
  const { totalExams, overallAverage, highestScore, strengths, weaknesses } = profile;

  let summary = `You've completed ${totalExams} exams with an average score of ${overallAverage.toFixed(1)}%.`;

  const highlights: string[] = [];
  const achievements: string[] = [];

  if (highestScore >= 95) {
    highlights.push('Perfect Score Achieved');
    achievements.push('Achieved a score of 95% or higher');
  }

  if (totalExams >= 10) {
    achievements.push('Completed 10+ exams');
  }

  if (strengths.length > 0) {
    highlights.push(`Strengths: ${strengths.slice(0, 3).join(', ')}`);
  }

  if (weaknesses.length > 0) {
    highlights.push(`Areas to improve: ${weaknesses.slice(0, 3).join(', ')}`);
  }

  return { summary, highlights, achievements };
}

/**
 * Generate comparison text
 */
export function generateComparisonText(
  yourScore: number,
  comparisonScore: number
): string {
  const diff = yourScore - comparisonScore;

  if (Math.abs(diff) < 1) {
    return 'Your performance is on par with the comparison.';
  } else if (diff > 0) {
    return `You scored ${diff.toFixed(1)}% higher than the comparison.`;
  } else {
    return `You scored ${Math.abs(diff).toFixed(1)}% lower than the comparison.`;
  }
}

/**
 * Format improvement rate
 */
export function formatImprovementRate(rate: number): string {
  if (rate > 0.1) return 'Significant improvement';
  if (rate > 0.05) return 'Moderate improvement';
  if (rate > -0.05) return 'Stable performance';
  if (rate > -0.1) return 'Slight decline';
  return 'Significant decline';
}

/**
 * Calculate percentile
 */
export function calculatePercentile(value: number, average: number, stdDev: number): number {
  if (stdDev === 0) return 50;

  const z = (value - average) / stdDev;
  // Approximate percentile using error function
  const percentile = (1 + Math.erf(z / Math.sqrt(2))) / 2 * 100;

  return Math.max(0, Math.min(100, percentile));
}

/**
 * Generate progress chart data
 */
export function generateProgressChartData(
  results: ExamResult[],
  timeframe: 'week' | 'month' | 'quarter' = 'month'
): {
  labels: string[];
  scores: number[];
  average: number;
  trend: 'up' | 'down' | 'stable';
} {
  const cutoff = new Date();
  switch (timeframe) {
    case 'week':
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case 'month':
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case 'quarter':
      cutoff.setMonth(cutoff.getMonth() - 3);
      break;
  }

  const filtered = results.filter(r => new Date(r.completedAt) >= cutoff);
  const sorted = filtered.sort((a, b) =>
    new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const labels = sorted.map(r =>
    new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  const scores = sorted.map(r => r.summary.percentage);

  const average = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (scores.length >= 2) {
    const recent = scores.slice(-3);
    const older = scores.slice(0, Math.min(3, scores.length - 3));
    if (older.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      if (recentAvg > olderAvg + 5) trend = 'up';
      else if (recentAvg < olderAvg - 5) trend = 'down';
    }
  }

  return { labels, scores, average, trend };
}
