// @ts-nocheck
/**
 * RecommendationService.ts
 *
 * Service for generating personalized study recommendations.
 * Provides recommendations based on performance, weaknesses, and learning patterns.
 */

import { RecommendationEngine, StudyRecommendation } from '../core/RecommendationEngine';
import type { ExamResult } from '../models';
import type { WeaknessReport } from '../models/WeaknessReport';
import type { ReadinessReport } from '../models/ReadinessReport';
import { examStorage } from '../store/examSimulatorStore';

export interface DailyStudyRecommendation {
  topic: string;
  activity: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  resources: { type: string; title: string }[];
  expectedOutcome: string;
}

export interface WeeklyPlan {
  week: string;
  goals: string[];
  dailyFocus: { day: string; focus: string; hours: number }[];
  recommendations: string[];
}

class RecommendationService {
  private static instance: RecommendationService;
  private engine: RecommendationEngine;

  private constructor() {
    this.engine = RecommendationEngine.getInstance();
  }

  static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(userId: string, limit?: number): Promise<StudyRecommendation[]> {
    return await this.engine.getPersonalizedRecommendations(userId, limit);
  }

  /**
   * Get recommendations based on exam result
   */
  async getResultBasedRecommendations(result: ExamResult): Promise<StudyRecommendation[]> {
    return await this.engine.getRecommendations(result, result.examTopics);
  }

  /**
   * Get readiness-based recommendations
   */
  async getReadinessRecommendations(report: ReadinessReport): Promise<StudyRecommendation[]> {
    return await this.engine.getReadinessBasedRecommendations(report);
  }

  /**
   * Get weakness-based recommendations
   */
  async getWeaknessRecommendations(report: WeaknessReport): Promise<StudyRecommendation[]> {
    return await this.engine.getWeaknessBasedRecommendations(report);
  }

  /**
   * Generate daily study plan
   */
  async generateDailyPlan(userId: string): Promise<{
    date: string;
    focus: string;
    sessions: {
      time: string;
      duration: string;
      activity: string;
      goal: string;
    }[];
    totalHours: number;
    tips: string[];
  }> {
    const recommendations = await this.getRecommendations(userId, 5);

    const sessions = recommendations.slice(0, 4).map((rec, index) => ({
      time: `${9 + index * 2}:00`,
      duration: rec.estimatedTime,
      activity: this.getActivityDescription(rec),
      goal: rec.expectedOutcome
    }));

    const totalMinutes = sessions.reduce((sum, s) => {
      const match = s.duration.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) : 30);
    }, 0);

    return {
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      focus: recommendations[0]?.topic || 'General Review',
      sessions,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      tips: this.getDailyTips(recommendations)
    };
  }

  /**
   * Generate weekly study plan
   */
  async generateWeeklyPlan(userId: string): Promise<WeeklyPlan> {
    const recommendations = await this.getRecommendations(userId, 7);
    const weakTopics = recommendations
      .filter(r => r.priority === 'high')
      .map(r => r.topic);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dailyFocus = days.map((day, index) => ({
      day,
      focus: weakTopics[index % weakTopics.length] || 'General Review',
      hours: index < 5 ? 2 : 3 // More hours on weekends
    }));

    return {
      week: `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      goals: [
        'Complete all scheduled study sessions',
        'Focus on weak areas identified in recommendations',
        'Take at least one practice exam',
        'Review mistakes from previous sessions'
      ],
      dailyFocus,
      recommendations: [
        'Take short breaks every 25-30 minutes',
        'Stay hydrated and maintain good posture',
        'Review material before sleep for better retention'
      ]
    };
  }

  /**
   * Get priority recommendations for exam prep
   */
  async getExamPrepRecommendations(
    topics: string[],
    daysUntilExam: number
  ): Promise<{
    immediate: StudyRecommendation[];
    thisWeek: StudyRecommendation[];
    dayBefore: StudyRecommendation[];
  }> {
    const immediate: StudyRecommendation[] = [];
    const thisWeek: StudyRecommendation[] = [];
    const dayBefore: StudyRecommendation[] = [];

    if (daysUntilExam <= 1) {
      immediate.push({
        id: 'quick-review',
        type: 'review',
        priority: 'high',
        topic: 'All Topics',
        title: 'Quick Final Review',
        description: 'Review key concepts and formulas.',
        reason: 'Exam is tomorrow!',
        estimatedTime: '2-3 hours',
        resources: [],
        actionItems: ['Review formula sheet', 'Go through practice mistakes', 'Get adequate rest'],
        expectedOutcome: 'Be confident and prepared',
        difficulty: 'easy'
      });

      dayBefore.push({
        id: 'rest',
        type: 'rest',
        priority: 'high',
        topic: 'Wellness',
        title: 'Rest and Relaxation',
        description: 'Avoid cramming. Get plenty of sleep.',
        reason: 'Well-rested mind performs better',
        estimatedTime: '8+ hours sleep',
        resources: [],
        actionItems: ['Get 8 hours of sleep', 'Eat a healthy breakfast', 'Arrive early to exam'],
        expectedOutcome: 'Peak mental performance',
        difficulty: 'easy'
      });
    } else if (daysUntilExam <= 3) {
      immediate.push({
        id: 'intensive-review',
        type: 'study',
        priority: 'high',
        topic: topics.join(', '),
        title: 'Intensive Topic Review',
        description: 'Focus on weak areas identified in previous exams.',
        reason: `${daysUntilExam} days until exam`,
        estimatedTime: '3-4 hours daily',
        resources: [],
        actionItems: ['Review weak topics first', 'Practice with timed quizzes', 'Create summary notes'],
        expectedOutcome: 'Improve weak areas significantly',
        difficulty: 'hard'
      });
    } else {
      thisWeek.push({
        id: 'structured-study',
        type: 'study',
        priority: 'high',
        topic: topics.join(', '),
        title: 'Structured Study Plan',
        description: 'Follow a systematic approach to cover all topics.',
        reason: `${daysUntilExam} days until exam`,
        estimatedTime: '2 hours daily',
        resources: [],
        actionItems: ['Create study schedule', 'Cover one topic per day', 'Take practice exams'],
        expectedOutcome: 'Comprehensive coverage of all topics',
        difficulty: 'medium'
      });
    }

    return { immediate, thisWeek, dayBefore };
  }

  /**
   * Get quick win recommendations
   */
  async getQuickWins(userId: string): Promise<{
    topic: string;
    action: string;
    time: string;
    impact: 'high' | 'medium' | 'low';
  }[]> {
    const recommendations = await this.getRecommendations(userId, 10);

    return recommendations
      .filter(r => {
        const timeMatch = r.estimatedTime.match(/(\d+)/);
        const hours = timeMatch ? parseInt(timeMatch[1]) : 60;
        return hours <= 30;
      })
      .slice(0, 5)
      .map(r => ({
        topic: r.topic,
        action: r.title,
        time: r.estimatedTime,
        impact: r.priority === 'high' ? 'high' : r.priority === 'medium' ? 'medium' : 'low'
      }));
  }

  /**
   * Get resource recommendations
   */
  async getResourceRecommendations(
    topic: string,
    learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic'
  ): Promise<{
    videos: { title: string; duration: string; url?: string }[];
    articles: { title: string; readTime: string; url?: string }[];
    exercises: { title: string; count: number }[];
    quizzes: { title: string; questions: number }[];
  }> {
    // Generate resource recommendations based on topic and learning style
    const resources = {
      videos: [
        { title: `${topic} - Complete Guide`, duration: '15 min' },
        { title: `${topic} - Quick Overview`, duration: '5 min' },
        { title: `${topic} - Worked Examples`, duration: '20 min' }
      ],
      articles: [
        { title: `Understanding ${topic}`, readTime: '10 min' },
        { title: `${topic} - Common Questions`, readTime: '5 min' },
        { title: `${topic} - Tips and Tricks`, readTime: '8 min' }
      ],
      exercises: [
        { title: `${topic} - Practice Problems`, count: 20 },
        { title: `${topic} - Challenge Problems`, count: 10 }
      ],
      quizzes: [
        { title: `${topic} - Quick Quiz`, questions: 10 },
        { title: `${topic} - Comprehensive Test`, questions: 25 }
      ]
    };

    return resources;
  }

  /**
   * Get personalized tip of the day
   */
  async getTipOfTheDay(userId: string): Promise<{
    tip: string;
    category: 'study' | 'wellness' | 'motivation' | 'strategy';
    relevance: string;
  }> {
    const results = examStorage.getResultsByUser(userId);
    const recentScores = results.slice(-5).map(r => r.summary.percentage);
    const average = recentScores.length > 0
      ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      : 0;

    // Generate contextual tip
    if (average < 50) {
      return {
        tip: 'Focus on understanding concepts rather than memorizing. Try explaining topics to yourself out loud.',
        category: 'study',
        relevance: 'Your scores suggest a need to deepen understanding'
      };
    }

    if (average < 70) {
      return {
        tip: 'Practice is key! Try solving 10 questions daily on weak topics to build confidence.',
        category: 'strategy',
        relevance: 'Regular practice will help bridge the gap to higher scores'
      };
    }

    if (average >= 90) {
      return {
        tip: 'Great job! Keep challenging yourself with harder problems to maintain your edge.',
        category: 'motivation',
        relevance: 'You\'re performing excellently - maintain your momentum'
      };
    }

    return {
      tip: 'Review your mistakes after each practice session. Understanding why you got something wrong is just as important as getting it right.',
      category: 'study',
      relevance: 'Learning from mistakes accelerates improvement'
    };
  }

  private getActivityDescription(recommendation: StudyRecommendation): string {
    switch (recommendation.type) {
      case 'study':
        return `Study ${recommendation.topic}`;
      case 'practice':
        return `Practice questions on ${recommendation.topic}`;
      case 'review':
        return `Review ${recommendation.topic}`;
      case 'rest':
        return 'Take a break and recharge';
      case 'focus':
        return `Focus on ${recommendation.topic}`;
      default:
        return `Work on ${recommendation.topic}`;
    }
  }

  private getDailyTips(recommendations: StudyRecommendation[]): string[] {
    const tips: string[] = [];

    const hasHighPriority = recommendations.some(r => r.priority === 'high');
    if (hasHighPriority) {
      tips.push('Focus on high-priority items first for maximum impact');
    }

    tips.push('Take a 5-minute break between study sessions');
    tips.push('Stay hydrated and maintain focus');

    const hasRest = recommendations.some(r => r.type === 'rest');
    if (!hasRest) {
      tips.push('Schedule some rest time to prevent burnout');
    }

    return tips;
  }
}

export const recommendationService = RecommendationService.getInstance();
export default recommendationService;
