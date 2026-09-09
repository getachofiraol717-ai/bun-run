// @ts-nocheck
/**
 * RecommendationEngine.ts
 *
 * Provides intelligent study recommendations based on performance analysis,
 * learning patterns, and exam readiness. Integrates with other engines
 * for comprehensive learning guidance.
 */

import type { ExamResult } from '../models';
import type { WeaknessReport } from '../models/WeaknessReport';
import type { ReadinessReport } from '../models/ReadinessReport';
import type { PerformanceProfile } from '../models/PerformanceProfile';
import { examStorage } from '../store/examSimulatorStore';

export interface RecommendationConfig {
  maxRecommendations: number;
  includeTimeEstimates: boolean;
  includeResourceLinks: boolean;
  prioritizeWeaknesses: boolean;
}

export interface StudyRecommendation {
  id: string;
  type: 'study' | 'practice' | 'review' | 'rest' | 'focus';
  priority: 'high' | 'medium' | 'low';
  topic: string;
  title: string;
  description: string;
  reason: string;
  estimatedTime: string;
  resources: {
    type: 'video' | 'article' | 'quiz' | 'flashcard' | 'formula';
    title: string;
    url?: string;
  }[];
  actionItems: string[];
  expectedOutcome: string;
  difficulty: 'easy' | 'medium' | 'hard';
  deadline?: string;
}

const DEFAULT_CONFIG: RecommendationConfig = {
  maxRecommendations: 10,
  includeTimeEstimates: true,
  includeResourceLinks: true,
  prioritizeWeaknesses: true
};

export class RecommendationEngine {
  private static instance: RecommendationEngine;
  private config: RecommendationConfig;
  private initialized: boolean = false;
  private resourceLibrary: Map<string, any[]> = new Map();

  private constructor(config?: Partial<RecommendationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<RecommendationConfig>): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine(config);
    }
    return RecommendationEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize resource library
    this.initializeResourceLibrary();

    this.initialized = true;
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId: string, limit?: number): Promise<StudyRecommendation[]> {
    const profile = await this.getPerformanceProfile(userId);
    const weaknessReports = examStorage.getWeaknessReportsByUser(userId);
    const readinessReports = examStorage.getReadinessReportsByUser(userId);
    const recentResults = examStorage.getResultsByUser(userId).slice(0, 5);

    const recommendations: StudyRecommendation[] = [];

    // Priority 1: Critical weaknesses
    if (this.config.prioritizeWeaknesses && weaknessReports.length > 0) {
      const criticalWeaknesses = weaknessReports
        .flatMap(w => w.topicWeaknesses)
        .filter(w => (w as any).priority === 'critical' || w.severity >= 0.8)
        .slice(0, 3);

      criticalWeaknesses.forEach(w => {
        recommendations.push(this.createWeaknessRecommendation(w));
      });
    }

    // Priority 2: High priority weaknesses
    weaknessReports.forEach(report => {
      report.remediationPlans.forEach(plan => {
        recommendations.push(this.createRemediationRecommendation(plan));
      });
    });

    // Priority 3: Readiness gaps
    if (readinessReports.length > 0) {
      const latestReadiness = readinessReports[0];
      latestReadiness.recommendations.forEach(rec => {
        recommendations.push(this.createReadinessRecommendation(rec));
      });
    }

    // Priority 4: Practice recommendations based on trends
    if (profile && this.config.prioritizeWeaknesses) {
      Object.entries(profile.topicPerformance).forEach(([topic, perf]: [string, any]) => {
        if (perf.trend === 'declining' || perf.averageScore < 60) {
          recommendations.push(this.createPracticeRecommendation(topic, perf));
        }
      });
    }

    // Priority 5: General improvement suggestions
    if (recommendations.length < this.config.maxRecommendations) {
      recommendations.push(...this.createGeneralRecommendations(recentResults));
    }

    // Priority 6: Rest and balance
    if (recommendations.length < this.config.maxRecommendations) {
      recommendations.push(this.createRestRecommendation());
    }

    // Sort by priority and limit
    return this.sortAndLimitRecommendations(recommendations, limit);
  }

  /**
   * Get recommendations based on exam result
   */
  async getRecommendations(result: ExamResult, topics: string[]): Promise<StudyRecommendation[]> {
    const recommendations: StudyRecommendation[] = [];

    // Add topic-specific recommendations
    result.topicResults
      .filter(t => t.percentage < 70)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3)
      .forEach(topic => {
        recommendations.push(this.createTopicRecommendation(result, topic));
      });

    // Add difficulty-specific recommendations
    const easyWrong = result.questionResults.filter(
      r => r.difficulty < 0.4 && !r.isCorrect
    ).length;

    if (easyWrong > 0) {
      recommendations.push({
        id: `REC-${Date.now()}-${this.generateRandomId()}`,
        type: 'review',
        priority: 'high',
        topic: 'Fundamentals',
        title: 'Review Basic Concepts',
        description: 'You struggled with easy questions. Review the fundamental concepts.',
        reason: `${easyWrong} easy questions were answered incorrectly`,
        estimatedTime: '30-60 minutes',
        resources: this.getResourcesForType('fundamental'),
        actionItems: ['Review basic definitions', 'Practice simple examples', 'Re-read chapter summaries'],
        expectedOutcome: 'Improved accuracy on easy questions',
        difficulty: 'easy'
      });
    }

    // Add time management recommendation
    if (result.timeAnalysis.timeWarning) {
      recommendations.push({
        id: `REC-${Date.now()}-${this.generateRandomId()}`,
        type: 'practice',
        priority: 'medium',
        topic: 'Time Management',
        title: 'Improve Time Management',
        description: 'Practice answering questions more efficiently.',
        reason: 'Time spent per question exceeds recommended allocation',
        estimatedTime: '1-2 hours of timed practice',
        resources: [],
        actionItems: ['Take timed practice quizzes', 'Skip difficult questions and return', 'Practice question patterns'],
        expectedOutcome: 'Complete exams within time limits',
        difficulty: 'medium'
      });
    }

    // Add streak maintenance recommendation
    recommendations.push(this.createStreakRecommendation(result));

    return recommendations.slice(0, this.config.maxRecommendations);
  }

  /**
   * Get recommendations based on readiness assessment
   */
  async getReadinessBasedRecommendations(readinessReport: ReadinessReport): Promise<StudyRecommendation[]> {
    const recommendations: StudyRecommendation[] = [];

    // Add recommendations for each factor
    readinessReport.factorScores
      .filter(f => f.score < 0.6)
      .sort((a, b) => a.score - b.score)
      .forEach(factor => {
        recommendations.push(this.createFactorRecommendation(factor));
      });

    // Add gap-specific recommendations
    readinessReport.criticalGaps.forEach(gap => {
      recommendations.push(this.createGapRecommendation(gap));
    });

    // Add urgency-based recommendation
    if (readinessReport.examReadiness && !readinessReport.examReadiness.ready) {
      recommendations.push({
        id: `REC-${Date.now()}-${this.generateRandomId()}`,
        type: 'focus',
        priority: 'high',
        topic: 'Exam Preparation',
        title: 'Intensive Exam Preparation Needed',
        description: 'Your readiness level suggests significant additional study is required.',
        reason: `Current readiness score: ${(readinessReport.overallScore * 100).toFixed(0)}%`,
        estimatedTime: this.estimateIntensiveStudyTime(readinessReport),
        resources: this.getIntensiveStudyResources(readinessReport.topics),
        actionItems: [
          'Schedule daily study sessions',
          'Focus on weak areas first',
          'Complete practice exams daily',
          'Review mistakes immediately'
        ],
        expectedOutcome: 'Reach exam-ready status',
        difficulty: 'hard'
      });
    }

    return recommendations.slice(0, this.config.maxRecommendations);
  }

  /**
   * Get recommendations based on weakness analysis
   */
  async getWeaknessBasedRecommendations(weaknessReport: WeaknessReport): Promise<StudyRecommendation[]> {
    const recommendations: StudyRecommendation[] = [];

    // Quick wins first
    weaknessReport.quickWins.forEach(qw => {
      recommendations.push({
        id: `REC-${Date.now()}-${this.generateRandomId()}`,
        type: 'practice',
        priority: 'high',
        topic: qw.topic,
        title: `Quick Win: ${qw.topic}`,
        description: qw.action,
        reason: 'Easy to address with minimal time investment',
        estimatedTime: qw.estimatedTime,
        resources: this.getResourcesForTopic(qw.topic),
        actionItems: [`Focus on ${qw.subtopic || qw.topic}`, 'Complete 10+ practice questions'],
        expectedOutcome: 'Quick improvement in this area',
        difficulty: 'easy'
      });
    });

    // Remediation plan recommendations
    weaknessReport.remediationPlans.forEach(plan => {
      plan.activities.forEach(activity => {
        recommendations.push({
          id: `REC-${Date.now()}-${this.generateRandomId()}`,
          type: 'study',
          priority: 'medium',
          topic: plan.focusArea,
          title: activity,
          description: `Activity from your remediation plan for ${plan.focusArea}`,
          reason: 'Part of your personalized improvement plan',
          estimatedTime: '30-45 minutes',
          resources: [],
          actionItems: [activity],
          expectedOutcome: 'Progress toward mastery',
          difficulty: 'medium'
        });
      });
    });

    return recommendations.slice(0, this.config.maxRecommendations);
  }

  /**
   * Generate daily study plan
   */
  async generateDailyStudyPlan(userId: string): Promise<{
    date: string;
    totalTime: string;
    sessions: {
      time: string;
      duration: string;
      topic: string;
      activity: string;
      goal: string;
    }[];
    tips: string[];
  }> {
    const recommendations = await this.getPersonalizedRecommendations(userId, 5);
    const profile = await this.getPerformanceProfile(userId);

    const sessions = recommendations.slice(0, 3).map((rec, index) => ({
      time: `${9 + index * 2}:00`, // 9:00, 11:00, 13:00
      duration: rec.estimatedTime,
      topic: rec.topic,
      activity: rec.type === 'study' ? 'Learn' : rec.type === 'practice' ? 'Practice' : 'Review',
      goal: rec.expectedOutcome
    }));

    return {
      date: new Date().toISOString().split('T')[0],
      totalTime: this.calculateTotalTime(sessions),
      sessions,
      tips: this.generateDailyTips(profile)
    };
  }

  /**
   * Generate weekly study plan
   */
  async generateWeeklyStudyPlan(userId: string): Promise<{
    startDate: string;
    endDate: string;
    goals: string[];
    weeklySchedule: {
      day: string;
      focus: string;
      activities: string[];
      targetHours: number;
    }[];
    recommendations: string[];
  }> {
    const weakAreas = await this.getWeakTopics(userId);

    const weeklySchedule = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
      const focus = weakAreas[index % weakAreas.length] || 'General Review';
      const isWeekend = index >= 5;

      return {
        day,
        focus,
        activities: [
          `Review ${focus} concepts`,
          `Complete practice questions on ${focus}`,
          isWeekend ? 'Take a full practice exam' : 'Review mistakes from previous session'
        ],
        targetHours: isWeekend ? 3 : 2
      };
    });

    return {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      goals: [
        'Complete all scheduled study sessions',
        'Achieve 70%+ on practice questions',
        'Review all mistakes within 24 hours'
      ],
      weeklySchedule,
      recommendations: [
        'Take regular breaks every 45-50 minutes',
        'Stay hydrated and maintain good sleep schedule',
        'Use active recall techniques'
      ]
    };
  }

  private async getPerformanceProfile(userId: string): Promise<PerformanceProfile | null> {
    return examStorage.getPerformanceProfile(userId);
  }

  private async getWeakTopics(userId: string): Promise<string[]> {
    const results = examStorage.getResultsByUser(userId);
    const topicScores = new Map<string, number[]>();

    results.forEach(r => {
      r.topicResults.forEach(t => {
        const scores = topicScores.get(t.topic) || [];
        scores.push(t.percentage);
        topicScores.set(t.topic, scores);
      });
    });

    return Array.from(topicScores.entries())
      .map(([topic, scores]) => ({
        topic,
        average: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .filter(t => t.average < 70)
      .sort((a, b) => a.average - b.average)
      .slice(0, 5)
      .map(t => t.topic);
  }

  private createWeaknessRecommendation(weakness: any): StudyRecommendation {
    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'study',
      priority: 'high',
      topic: weakness.topic,
      title: `Address: ${weakness.topic}`,
      description: weakness.description,
      reason: `Critical weakness identified with ${(weakness.severity * 100).toFixed(0)}% severity`,
      estimatedTime: weakness.estimatedMasteryTime || '1-2 hours',
      resources: this.getResourcesForTopic(weakness.topic),
      actionItems: this.generateActionItems(weakness),
      expectedOutcome: 'Achieve 70%+ accuracy in this topic',
      difficulty: weakness.severity > 0.7 ? 'hard' : 'medium'
    };
  }

  private createRemediationRecommendation(plan: any): StudyRecommendation {
    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'study',
      priority: 'medium',
      topic: plan.focusArea,
      title: `Remediate: ${plan.focusArea}`,
      description: `Follow your remediation plan for ${plan.focusArea}`,
      reason: 'Part of your structured improvement plan',
      estimatedTime: plan.duration,
      resources: [],
      actionItems: plan.activities.slice(0, 3),
      expectedOutcome: plan.successCriteria,
      difficulty: 'medium'
    };
  }

  private createReadinessRecommendation(rec: any): StudyRecommendation {
    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'study',
      priority: rec.priority === 'high' ? 'high' : 'medium',
      topic: rec.category,
      title: rec.action,
      description: rec.reason,
      reason: `Recommended based on readiness assessment - ${rec.category}`,
      estimatedTime: rec.estimatedTime,
      resources: [],
      actionItems: [rec.action],
      expectedOutcome: 'Improved readiness score',
      difficulty: 'medium'
    };
  }

  private createPracticeRecommendation(topic: string, performance: any): StudyRecommendation {
    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'practice',
      priority: performance.trend === 'declining' ? 'high' : 'medium',
      topic,
      title: `Practice: ${topic}`,
      description: `${topic} needs attention. Current trend: ${performance.trend}`,
      reason: `Average score: ${performance.averageScore.toFixed(0)}% - below target`,
      estimatedTime: '45-60 minutes',
      resources: this.getResourcesForTopic(topic),
      actionItems: [
        'Complete 15+ practice questions',
        'Review explanations for wrong answers',
        'Create summary notes'
      ],
      expectedOutcome: 'Stabilize or improve trend',
      difficulty: 'medium'
    };
  }

  private createGeneralRecommendations(results: ExamResult[]): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];

    if (results.length < 3) {
      recommendations.push({
        id: `REC-${Date.now()}-${this.generateRandomId()}`,
        type: 'practice',
        priority: 'medium',
        topic: 'General',
        title: 'Build Your Foundation',
        description: 'Take more exams to establish a performance baseline.',
        reason: 'Need more data to provide personalized recommendations',
        estimatedTime: '1-2 hours',
        resources: [],
        actionItems: ['Take a practice exam', 'Review results', 'Identify initial weak areas'],
        expectedOutcome: 'Establish baseline for tracking progress',
        difficulty: 'easy'
      });
    }

    return recommendations;
  }

  private createRestRecommendation(): StudyRecommendation {
    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'rest',
      priority: 'low',
      topic: 'Wellness',
      title: 'Take a Break',
      description: 'Rest is important for learning. Take some time to relax.',
      reason: 'Balance study with rest for optimal retention',
      estimatedTime: '30-60 minutes',
      resources: [],
      actionItems: ['Take a short walk', 'Do some light stretching', 'Get adequate sleep'],
      expectedOutcome: 'Improved focus and retention',
      difficulty: 'easy'
    };
  }

  private createTopicRecommendation(result: ExamResult, topic: any): StudyRecommendation {
    const resources = this.getResourcesForTopic(topic.topic);

    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'study',
      priority: 'high',
      topic: topic.topic,
      title: `Improve: ${topic.topic}`,
      description: `Your score in ${topic.topic} was ${topic.percentage.toFixed(0)}%`,
      reason: `${topic.totalQuestions - topic.correctAnswers} questions incorrect in this topic`,
      estimatedTime: this.estimateTopicStudyTime(topic.percentage),
      resources,
      actionItems: [
        `Review ${topic.topic} concepts`,
        'Complete practice questions',
        'Review solutions thoroughly'
      ],
      expectedOutcome: 'Achieve 70%+ in this topic',
      difficulty: topic.percentage < 40 ? 'hard' : 'medium'
    };
  }

  private createFactorRecommendation(factor: any): StudyRecommendation {
    const actionMap: Record<string, { title: string; description: string; activities: string[] }> = {
      study_time: {
        title: 'Increase Study Time',
        description: 'You need more dedicated study time',
        activities: ['Schedule 2+ hours of study daily', 'Remove distractions during study time', 'Track your study sessions']
      },
      topic_coverage: {
        title: 'Expand Topic Coverage',
        description: 'Not all required topics have been covered',
        activities: ['Create a topic checklist', 'Review uncovered topics', 'Practice questions on all topics']
      },
      mastery_level: {
        title: 'Deepen Understanding',
        description: 'Topic mastery needs improvement',
        activities: ['Review fundamental concepts', 'Practice application problems', 'Create concept maps']
      },
      practice_score: {
        title: 'More Practice Needed',
        description: 'Practice performance needs improvement',
        activities: ['Complete more practice questions', 'Review explanations', 'Identify patterns in mistakes']
      },
      recency: {
        title: 'Study More Frequently',
        description: 'Topics need more recent review',
        activities: ['Review material within 24 hours', 'Use spaced repetition', 'Schedule regular review sessions']
      }
    };

    const action = actionMap[factor.factor] || {
      title: `Improve ${factor.label}`,
      description: `${factor.label} needs attention`,
      activities: ['Focus on improving this area']
    };

    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'study',
      priority: factor.score < 0.3 ? 'high' : 'medium',
      topic: factor.label,
      title: action.title,
      description: action.description,
      reason: `Current score: ${(factor.score * 100).toFixed(0)}% - needs improvement`,
      estimatedTime: '1-2 hours',
      resources: [],
      actionItems: action.activities,
      expectedOutcome: `Improve ${factor.label} score to 70%+`,
      difficulty: 'medium'
    };
  }

  private createGapRecommendation(gap: any): StudyRecommendation {
    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'study',
      priority: 'high',
      topic: gap.factor,
      title: `Close Gap: ${gap.factor}`,
      description: gap.description,
      reason: gap.impact,
      estimatedTime: '2-3 hours',
      resources: [],
      actionItems: ['Identify the root cause', 'Create targeted study plan', 'Practice related problems'],
      expectedOutcome: 'Eliminate this gap',
      difficulty: 'hard'
    };
  }

  private createStreakRecommendation(result: ExamResult): StudyRecommendation {
    return {
      id: `REC-${Date.now()}-${this.generateRandomId()}`,
      type: 'focus',
      priority: 'medium',
      topic: 'Consistency',
      title: 'Maintain Your Streak',
      description: 'Regular practice leads to better results. Keep up the momentum!',
      reason: 'Consistent practice improves long-term retention',
      estimatedTime: '30 minutes',
      resources: [],
      actionItems: ['Study at the same time each day', 'Track your daily progress', 'Review previous material'],
      expectedOutcome: 'Build a sustainable study habit',
      difficulty: 'easy'
    };
  }

  private generateActionItems(weakness: any): string[] {
    const items = [`Focus on ${weakness.topic}`];

    if (weakness.type === 'topic') {
      items.push('Review core concepts');
    } else if (weakness.type === 'concept') {
      items.push('Read detailed explanations');
      items.push('Create concept summaries');
    } else if (weakness.type === 'formula') {
      items.push('Memorize key formulas');
      items.push('Practice derivations');
    }

    items.push('Complete 10+ practice questions');
    items.push('Review all mistakes');

    return items;
  }

  private getResourcesForTopic(topic: string): StudyRecommendation['resources'] {
    const baseResources = this.resourceLibrary.get(topic) || [];

    if (baseResources.length > 0) {
      return baseResources.slice(0, 3);
    }

    // Return generic resources
    return [
      { type: 'article', title: `${topic} Overview` },
      { type: 'quiz', title: `${topic} Practice Quiz` },
      { type: 'video', title: `${topic} Video Tutorial` }
    ];
  }

  private getResourcesForType(type: string): StudyRecommendation['resources'] {
    return [
      { type: 'article', title: `${type} Guide` },
      { type: 'video', title: `${type} Tutorial` }
    ];
  }

  private getIntensiveStudyResources(topics: string[]): StudyRecommendation['resources'] {
    return [
      { type: 'article', title: 'Intensive Study Guide' },
      { type: 'quiz', title: 'Daily Practice Test' },
      { type: 'flashcard', title: 'Quick Review Cards' }
    ];
  }

  private estimateIntensiveStudyTime(report: ReadinessReport): string {
    const gaps = report.criticalGaps.length + report.highPriorityGaps.length;
    const baseHours = 5;

    return `${baseHours + gaps * 2} hours over ${gaps + 1} days`;
  }

  private estimateTopicStudyTime(currentScore: number): string {
    if (currentScore < 30) return '2-3 hours';
    if (currentScore < 50) return '1.5-2 hours';
    if (currentScore < 70) return '1-1.5 hours';
    return '30-45 minutes';
  }

  private sortAndLimitRecommendations(
    recommendations: StudyRecommendation[],
    limit?: number
  ): StudyRecommendation[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const max = limit || this.config.maxRecommendations;

    return recommendations
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, max);
  }

  private calculateTotalTime(sessions: any[]): string {
    let totalMinutes = 0;

    sessions.forEach(session => {
      const match = session.duration.match(/(\d+)/);
      if (match) {
        totalMinutes += parseInt(match[1]);
        if (session.duration.includes('hour')) {
          totalMinutes += parseInt(match[1]) * 60;
        }
      }
    });

    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h ${mins}m`;
    }

    return `${totalMinutes}m`;
  }

  private generateDailyTips(profile: PerformanceProfile | null): string[] {
    const tips = [
      'Take short breaks every 25-30 minutes',
      'Stay hydrated throughout your study session',
      'Review material from previous sessions before starting new topics'
    ];

    if (profile && profile.studyStreak > 0) {
      tips.push(`You're on a ${profile.studyStreak}-day streak! Keep it going!`);
    }

    return tips;
  }

  private initializeResourceLibrary(): void {
    // Initialize with empty resource library
    // In production, this would be populated from a database or API
    this.resourceLibrary = new Map();
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

export default RecommendationEngine;
