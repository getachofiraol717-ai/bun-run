// @ts-nocheck
/**
 * ReadinessService.ts
 *
 * Service for assessing and managing student readiness for exams.
 * Provides readiness checks, recommendations, and study plans.
 */

import { ReadinessAnalyzer, ReadinessInput } from '../core/ReadinessAnalyzer';
import type { ReadinessLevel, ReadinessReport, ReadinessScore } from '../models/ReadinessReport';
import { examStorage } from '../store/examSimulatorStore';

export interface ReadinessCheckResult {
  ready: boolean;
  level: ReadinessLevel;
  score: number;
  estimatedSuccessRate: number;
  warnings: string[];
  recommendations: string[];
  readinessReportId: string;
}

export interface StudyPlanItem {
  day: string;
  focus: string;
  activities: string[];
  estimatedHours: number;
  topics: string[];
}

class ReadinessService {
  private static instance: ReadinessService;
  private analyzer: ReadinessAnalyzer;

  private constructor() {
    this.analyzer = ReadinessAnalyzer.getInstance();
  }

  static getInstance(): ReadinessService {
    if (!ReadinessService.instance) {
      ReadinessService.instance = new ReadinessService();
    }
    return ReadinessService.instance;
  }

  /**
   * Check readiness for specific topics
   */
  async checkReadiness(topics: string[], subject?: string): Promise<ReadinessCheckResult> {
    const input: ReadinessInput = {
      topics,
      subject,
      userId: 'current_user'
    };

    const report = await this.analyzer.generateReadinessReport(input);

    return this.formatReadinessResult(report);
  }

  /**
   * Get detailed readiness report
   */
  async getReadinessReport(topics: string[], subject?: string): Promise<ReadinessReport> {
    return await this.analyzer.getReadinessReport(topics, subject);
  }

  /**
   * Get readiness level display text
   */
  getLevelDescription(level: ReadinessLevel): string {
    const descriptions: Record<ReadinessLevel, string> = {
      not_ready: 'You are not ready for this exam. Significant preparation is needed.',
      slightly_prepared: 'You have some basic knowledge but need substantial more preparation.',
      moderately_prepared: 'You have a decent foundation but could benefit from more practice.',
      well_prepared: 'You are well prepared. A bit more practice should help solidify your knowledge.',
      highly_prepared: 'You are highly prepared and ready to excel in this exam!'
    };
    return descriptions[level] || '';
  }

  /**
   * Get color for readiness level
   */
  getLevelColor(level: ReadinessLevel): string {
    const colors: Record<ReadinessLevel, string> = {
      not_ready: '#ef4444',     // Red
      slightly_prepared: '#f97316', // Orange
      moderately_prepared: '#eab308', // Yellow
      well_prepared: '#22c55e', // Green
      highly_prepared: '#10b981' // Emerald
    };
    return colors[level] || '#6b7280';
  }

  /**
   * Get icon for readiness level
   */
  getLevelIcon(level: ReadinessLevel): string {
    const icons: Record<ReadinessLevel, string> = {
      not_ready: '❌',
      slightly_prepared: '⚠️',
      moderately_prepared: '👍',
      well_prepared: '✅',
      highly_prepared: '🏆'
    };
    return icons[level] || '📊';
  }

  /**
   * Generate study plan based on readiness
   */
  async generateStudyPlan(
    topics: string[],
    daysUntilExam: number,
    studyHoursPerDay: number
  ): Promise<StudyPlanItem[]> {
    const readiness = await this.checkReadiness(topics);
    const plan: StudyPlanItem[] = [];

    // Determine focus areas based on readiness gaps
    const focusAreas = readiness.recommendations.slice(0, 3).map(r => {
      // Extract topic from recommendation
      const match = r.match(/topics?:?\s*([^,]+)/i);
      return match ? match[1].trim() : r;
    });

    // Distribute study time across days
    const studyDays = Math.min(daysUntilExam, 14); // Max 2 weeks
    const hoursPerTopic = (studyHoursPerDay * studyDays) / Math.max(topics.length, 1);

    for (let i = 0; i < studyDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dayPlan: StudyPlanItem = {
        day: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        focus: focusAreas[i % focusAreas.length] || 'General Review',
        activities: this.generateDailyActivities(readiness.level, i === 0),
        estimatedHours: studyHoursPerDay,
        topics: [topics[i % topics.length]]
      };

      plan.push(dayPlan);
    }

    return plan;
  }

  /**
   * Get recommended study intensity
   */
  getRecommendedIntensity(level: ReadinessLevel): {
    hoursPerDay: number;
    daysBeforeExam: number;
    practiceRatio: number; // percentage of time on practice vs review
  } {
    switch (level) {
      case 'not_ready':
        return { hoursPerDay: 4, daysBeforeExam: 14, practiceRatio: 0.7 };
      case 'slightly_prepared':
        return { hoursPerDay: 3, daysBeforeExam: 10, practiceRatio: 0.6 };
      case 'moderately_prepared':
        return { hoursPerDay: 2, daysBeforeExam: 7, practiceRatio: 0.5 };
      case 'well_prepared':
        return { hoursPerDay: 1.5, daysBeforeExam: 5, practiceRatio: 0.4 };
      case 'highly_prepared':
        return { hoursPerDay: 1, daysBeforeExam: 3, practiceRatio: 0.3 };
      default:
        return { hoursPerDay: 2, daysBeforeExam: 7, practiceRatio: 0.5 };
    }
  }

  /**
   * Calculate time needed to reach target readiness
   */
  calculateTimeToReadiness(
    currentScore: number,
    targetScore: number = 0.7
  ): {
    hoursNeeded: number;
    daysNeeded: number;
    sessionsNeeded: number;
  } {
    const scoreGap = targetScore - currentScore;
    if (scoreGap <= 0) {
      return { hoursNeeded: 0, daysNeeded: 0, sessionsNeeded: 0 };
    }

    // Estimate based on average improvement rate
    const improvementPerHour = 0.05; // 5% improvement per hour
    const hoursNeeded = Math.ceil(scoreGap / improvementPerHour);
    const sessionLength = 1.5; // hours per session
    const sessionsNeeded = Math.ceil(hoursNeeded / sessionLength);
    const daysNeeded = Math.ceil(sessionsNeeded / 2); // 2 sessions per day max

    return { hoursNeeded, daysNeeded, sessionsNeeded };
  }

  /**
   * Get readiness summary for dashboard
   */
  async getReadinessSummary(topics: string[]): Promise<{
    overall: ReadinessLevel;
    byFactor: { factor: string; score: number; status: string }[];
    weakestAreas: string[];
    suggestedAction: string;
  }> {
    const report = await this.getReadinessReport(topics);

    const byFactor = report.factorScores.map(f => ({
      factor: f.label,
      score: Math.round(f.score * 100),
      status: f.status
    }));

    const weakestAreas = report.criticalGaps.map(g => g.factor);

    const suggestedAction = this.getSuggestedAction(report.level, weakestAreas);

    return {
      overall: report.level,
      byFactor,
      weakestAreas,
      suggestedAction
    };
  }

  private formatReadinessResult(report: ReadinessReport): ReadinessCheckResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Add warnings
    if (report.examReadiness?.warnings) {
      warnings.push(...report.examReadiness.warnings);
    }

    // Format recommendations
    report.recommendations.forEach(r => {
      recommendations.push(r.action);
    });

    return {
      ready: report.examReadiness?.ready || false,
      level: report.level,
      score: Math.round(report.overallScore * 100),
      estimatedSuccessRate: report.examReadiness?.estimatedSuccessRate || 0,
      warnings,
      recommendations,
      readinessReportId: report.id
    };
  }

  private generateDailyActivities(isFirstDay: boolean, level: ReadinessLevel): string[] {
    const activities: string[] = [];

    if (isFirstDay) {
      activities.push('Take diagnostic quiz to identify weak areas');
      activities.push('Review study plan and goals');
    }

    activities.push('Review key concepts and notes');
    activities.push('Complete practice questions');

    if (level === 'not_ready' || level === 'slightly_prepared') {
      activities.push('Watch tutorial videos for difficult topics');
      activities.push('Create summary sheets');
    }

    activities.push('Review mistakes from practice');
    activities.push('Preview next day\'s topics');

    return activities;
  }

  private getSuggestedAction(level: ReadinessLevel, weakAreas: string[]): string {
    if (level === 'not_ready') {
      return 'Intensive study required. Focus on fundamentals and complete daily practice.';
    }
    if (level === 'slightly_prepared') {
      return 'Increase study time. Prioritize weak areas identified in your assessment.';
    }
    if (level === 'moderately_prepared') {
      return 'Focus on practice and review. Target weak spots while maintaining overall knowledge.';
    }
    if (level === 'well_prepared') {
      return 'Light review and practice. Focus on areas needing reinforcement.';
    }
    return 'Maintain your knowledge. Take practice exams to stay sharp.';
  }
}

export const readinessService = ReadinessService.getInstance();
export default readinessService;
