// @ts-nocheck
/**
 * readinessUtils.ts
 *
 * Utility functions for readiness assessment.
 */

import type { ReadinessLevel } from '../models/ReadinessReport';

/**
 * Get readiness level color
 */
export function getReadinessColor(level: ReadinessLevel): string {
  const colors: Record<ReadinessLevel, string> = {
    not_ready: '#ef4444',
    slightly_prepared: '#f97316',
    moderately_prepared: '#eab308',
    well_prepared: '#22c55e',
    highly_prepared: '#10b981'
  };
  return colors[level];
}

/**
 * Get readiness level percentage
 */
export function getReadinessPercentage(level: ReadinessLevel): number {
  const percentages: Record<ReadinessLevel, number> = {
    not_ready: 0.2,
    slightly_prepared: 0.4,
    moderately_prepared: 0.6,
    well_prepared: 0.8,
    highly_prepared: 0.95
  };
  return percentages[level];
}

/**
 * Get readiness level description
 */
export function getReadinessDescription(level: ReadinessLevel): string {
  const descriptions: Record<ReadinessLevel, string> = {
    not_ready: 'You need significant more preparation before attempting this exam.',
    slightly_prepared: 'You have some basic knowledge but need more practice.',
    moderately_prepared: 'You have a decent foundation. A bit more study would help.',
    well_prepared: 'You are well prepared. Continue reviewing to solidify knowledge.',
    highly_prepared: 'You are fully prepared and ready to excel!'
  };
  return descriptions[level];
}

/**
 * Get readiness level icon
 */
export function getReadinessIcon(level: ReadinessLevel): string {
  const icons: Record<ReadinessLevel, string> = {
    not_ready: '✗',
    slightly_prepared: '!',
    moderately_prepared: '~',
    well_prepared: '✓',
    highly_prepared: '★'
  };
  return icons[level];
}

/**
 * Determine readiness level from score
 */
export function scoreToLevel(score: number): ReadinessLevel {
  if (score >= 0.9) return 'highly_prepared';
  if (score >= 0.75) return 'well_prepared';
  if (score >= 0.6) return 'moderately_prepared';
  if (score >= 0.4) return 'slightly_prepared';
  return 'not_ready';
}

/**
 * Calculate factor impact
 */
export function calculateFactorImpact(
  score: number,
  weight: number
): { impact: number; description: string } {
  const impact = score * weight * 100;

  let description: string;
  if (impact >= 20) {
    description = 'Major positive impact';
  } else if (impact >= 10) {
    description = 'Positive impact';
  } else if (impact >= 0) {
    description = 'Neutral impact';
  } else {
    description = 'Negative impact';
  }

  return { impact: Math.round(impact * 10) / 10, description };
}

/**
 * Get recommended study hours
 */
export function getRecommendedStudyHours(
  currentScore: number,
  targetScore: number = 0.7,
  topicsCount: number
): {
  totalHours: number;
  hoursPerTopic: number;
  daysNeeded: number;
  sessionsNeeded: number;
} {
  const gap = targetScore - currentScore;
  if (gap <= 0) {
    return { totalHours: 0, hoursPerTopic: 0, daysNeeded: 0, sessionsNeeded: 0 };
  }

  // Estimate: 5% improvement per hour of study
  const totalHours = Math.ceil(gap / 0.05);
  const hoursPerTopic = Math.ceil(totalHours / topicsCount);
  const daysNeeded = Math.ceil(totalHours / 3); // 3 hours per day max
  const sessionsNeeded = Math.ceil(totalHours / 1.5); // 1.5 hours per session

  return {
    totalHours,
    hoursPerTopic,
    daysNeeded,
    sessionsNeeded
  };
}

/**
 * Get readiness score description
 */
export function getScoreDescription(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Very Poor';
}

/**
 * Format readiness factor
 */
export function formatFactorScore(factor: {
  label: string;
  score: number;
  weight: number;
}): {
  label: string;
  percentage: number;
  weightPercentage: number;
  status: 'good' | 'needs_improvement' | 'poor';
} {
  return {
    label: factor.label,
    percentage: Math.round(factor.score * 100),
    weightPercentage: Math.round(factor.weight * 100),
    status: factor.score >= 0.7 ? 'good' : factor.score >= 0.4 ? 'needs_improvement' : 'poor'
  };
}

/**
 * Get gap severity color
 */
export function getGapSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#eab308';
    case 'low':
      return '#22c55e';
    default:
      return '#6b7280';
  }
}

/**
 * Calculate confidence interval
 */
export function calculateConfidenceInterval(
  score: number,
  confidence: number = 0.8
): { lower: number; upper: number } {
  // Simplified confidence interval calculation
  const margin = (1 - confidence) * 20;
  return {
    lower: Math.max(0, score - margin),
    upper: Math.min(100, score + margin)
  };
}

/**
 * Get readiness warning messages
 */
export function getReadinessWarnings(level: ReadinessLevel): string[] {
  const warnings: Record<ReadinessLevel, string[]> = {
    not_ready: [
      'You may not pass if you take the exam now',
      'Consider postponing if possible',
      'Focus on fundamentals before anything else'
    ],
    slightly_prepared: [
      'Your knowledge base needs strengthening',
      'More practice questions are recommended',
      'Review core concepts thoroughly'
    ],
    moderately_prepared: [
      'You\'re close to being ready',
      'Focus on weak areas identified in your report',
      'Take a few more practice exams'
    ],
    well_prepared: [
      'You\'re in good shape',
      'Keep reviewing your notes',
      'Stay confident'
    ],
    highly_prepared: [
      'You\'re ready to excel!',
      'Maintain your confidence',
      'Get adequate rest before the exam'
    ]
  };
  return warnings[level];
}

/**
 * Check if additional study is needed
 */
export function needsAdditionalStudy(
  currentScore: number,
  passingScore: number = 60
): {
  needed: boolean;
  additionalHours: number;
  message: string;
} {
  if (currentScore >= passingScore + 10) {
    return { needed: false, additionalHours: 0, message: 'You\'re well above passing!' };
  }

  if (currentScore >= passingScore) {
    return { needed: false, additionalHours: 2, message: 'You\'re ready but could use a quick review.' };
  }

  const gap = passingScore - currentScore;
  const additionalHours = Math.ceil(gap / 5); // 5% per hour

  return {
    needed: true,
    additionalHours,
    message: `You need approximately ${additionalHours} more hours of study.`
  };
}
