// @ts-nocheck
// Adaptive Quiz Engine — RecommendationService
// Generates personalized recommendations based on performance data

import type { QuizResult } from "../models/QuizResult";
import type { DifficultyLevel, QuestionType } from "../models/Question";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";
import type { KnowledgeGap } from "../core/KnowledgeGapAnalyzer";

export interface Recommendation {
  id: string;
  type: "quiz" | "practice" | "review" | "tutor" | "formula" | "flashcard" | "video";
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  estimatedTime: number;
  topics: string[];
  subject?: string;
  difficulty?: DifficultyLevel;
  url?: string;
  contentId?: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  duration: number;
  sessions: StudySession[];
  goals: string[];
}

export interface StudySession {
  day: number;
  date: Date;
  activities: Activity[];
  totalTime: number;
}

export interface Activity {
  type: "quiz" | "practice" | "review" | "tutor" | "break";
  title: string;
  duration: number;
  topics?: string[];
  difficulty?: DifficultyLevel;
  completed: boolean;
}

export class RecommendationService {
  private static instance: RecommendationService;

  private constructor() {}

  static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  generateRecommendations(params: {
    userId: string;
    results: QuizResult[];
    profile: UserDifficultyProfile;
    gaps: KnowledgeGap[];
    strongAreas?: string[];
    weakAreas?: string[];
  }): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Priority 1: Address critical gaps
    params.gaps
      .filter(g => g.severity === "critical")
      .forEach(gap => {
        recommendations.push({
          id: `rec_gap_${gap.id}`,
          type: "practice",
          title: `Practice: ${gap.topic}`,
          description: `Targeted practice to address gaps in ${gap.topic}`,
          reason: "Critical knowledge gap identified",
          priority: "high",
          estimatedTime: 20,
          topics: [gap.topic],
          subject: gap.subject
        });

        recommendations.push({
          id: `rec_tutor_${gap.id}`,
          type: "tutor",
          title: `Get help with ${gap.topic}`,
          description: "Work with AI Tutor to understand this topic",
          reason: "Complex topic requires guided learning",
          priority: "high",
          estimatedTime: 30,
          topics: [gap.topic],
          subject: gap.subject
        });
      });

    // Priority 2: Major gaps
    params.gaps
      .filter(g => g.severity === "major")
      .slice(0, 3)
      .forEach(gap => {
        recommendations.push({
          id: `rec_major_${gap.id}`,
          type: "review",
          title: `Review: ${gap.topic}`,
          description: `Review material for ${gap.topic}`,
          reason: "Knowledge gap identified",
          priority: "medium",
          estimatedTime: 15,
          topics: [gap.topic],
          subject: gap.subject
        });
      });

    // Priority 3: Improve performance
    if (params.results.length > 0) {
      const lastResult = params.results[0];
      const percentage = lastResult.summary.percentage;

      if (percentage >= 85) {
        recommendations.push({
          id: "rec_challenge",
          type: "quiz",
          title: "Challenge Yourself",
          description: "Take on harder questions to continue growing",
          reason: "Excellent performance - ready for harder challenges",
          priority: "medium",
          estimatedTime: 20,
          topics: lastResult.topicResults.slice(0, 2).map(t => t.topic),
          difficulty: "hard"
        });
      } else if (percentage < 60) {
        recommendations.push({
          id: "rec_foundation",
          type: "practice",
          title: "Build Foundation",
          description: "Practice fundamentals at easier difficulty",
          reason: "Focus on building solid understanding",
          priority: "medium",
          estimatedTime: 25,
          topics: params.weakAreas || [],
          difficulty: "easy"
        });
      }
    }

    // Priority 4: General improvement
    recommendations.push({
      id: "rec_daily_practice",
      type: "practice",
      title: "Daily Practice",
      description: "Regular practice to maintain momentum",
      reason: "Consistent practice improves retention",
      priority: "low",
      estimatedTime: 15,
      topics: []
    });

    // Priority 5: Formula practice if applicable
    const hasFormulaQuestions = params.results.some(r =>
      r.questionResults.some(q => q.question.type === "formula")
    );

    if (hasFormulaQuestions) {
      recommendations.push({
        id: "rec_formula",
        type: "formula",
        title: "Formula Practice",
        description: "Practice applying formulas",
        reason: "Formula-based questions require regular practice",
        priority: "medium",
        estimatedTime: 20,
        topics: ["formulas"]
      });
    }

    return this.deduplicateAndSort(recommendations);
  }

  generateStudyPlan(params: {
    userId: string;
    results: QuizResult[];
    gaps: KnowledgeGap[];
    days: number;
    dailyTimeMinutes: number;
  }): StudyPlan {
    const plan: StudyPlan = {
      id: `plan_${Date.now()}`,
      title: `Personalized ${params.days}-Day Study Plan`,
      duration: params.days,
      sessions: [],
      goals: []
    };

    // Set goals
    if (params.gaps.length > 0) {
      plan.goals.push(`Address ${params.gaps.filter(g => g.severity === "critical").length} critical gaps`);
    }
    plan.goals.push("Maintain consistent daily practice");
    plan.goals.push("Improve overall quiz performance");

    // Generate sessions
    for (let day = 0; day < params.days; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);

      const activities: Activity[] = [];
      let remainingMinutes = params.dailyTimeMinutes;

      // Morning: Quick review
      if (remainingMinutes >= 10) {
        activities.push({
          type: "review",
          title: "Quick Review",
          duration: 10,
          completed: false
        });
        remainingMinutes -= 10;
      }

      // Main practice session
      if (remainingMinutes >= 15) {
        const gapTopic = params.gaps[day % params.gaps.length];
        activities.push({
          type: gapTopic ? "practice" : "quiz",
          title: gapTopic ? `Practice: ${gapTopic.topic}` : "Daily Quiz",
          duration: Math.min(20, remainingMinutes),
          topics: gapTopic ? [gapTopic.topic] : [],
          completed: false
        });
        remainingMinutes -= Math.min(20, remainingMinutes);
      }

      // Afternoon: Flashcards or review
      if (remainingMinutes >= 10) {
        activities.push({
          type: "review",
          title: "Concept Review",
          duration: 10,
          completed: false
        });
        remainingMinutes -= 10;
      }

      // Evening: AI Tutor
      if (remainingMinutes >= 5) {
        activities.push({
          type: "tutor",
          title: "AI Tutor Session",
          duration: remainingMinutes,
          completed: false
        });
      }

      plan.sessions.push({
        day: day + 1,
        date,
        activities,
        totalTime: params.dailyTimeMinutes - remainingMinutes
      });
    }

    return plan;
  }

  generateNextSteps(params: {
    userId: string;
    results: QuizResult[];
    currentLevel: DifficultyLevel;
  }): {
    immediate: Recommendation[];
    thisWeek: Recommendation[];
    thisMonth: Recommendation[];
  } {
    const immediate: Recommendation[] = [];
    const thisWeek: Recommendation[] = [];
    const thisMonth: Recommendation[] = [];

    // Immediate: Today's practice
    immediate.push({
      id: "next_today",
      type: "practice",
      title: "Today's Practice",
      description: "Complete a short practice session",
      reason: "Maintain your learning momentum",
      priority: "high",
      estimatedTime: 15,
      topics: []
    });

    // This week: Focus on weak areas
    if (params.results.length > 0) {
      const weakTopics = this.getWeakTopics(params.results);
      weakTopics.slice(0, 2).forEach(topic => {
        thisWeek.push({
          id: `next_week_${topic}`,
          type: "quiz",
          title: `Focus: ${topic}`,
          description: `Targeted practice on ${topic}`,
          reason: "This is an area for improvement",
          priority: "high",
          estimatedTime: 30,
          topics: [topic]
        });
      });
    }

    // This month: Progress to next level
    const currentIndex = ["easy", "medium", "hard", "expert"].indexOf(params.currentLevel);
    if (currentIndex < 3) {
      const nextLevel = ["easy", "medium", "hard", "expert"][currentIndex + 1] as DifficultyLevel;
      thisMonth.push({
        id: "next_month_level",
        type: "quiz",
        title: `Reach ${nextLevel} Level`,
        description: `Build skills to advance to ${nextLevel} difficulty`,
        reason: "Progress to the next challenge level",
        priority: "medium",
        estimatedTime: 120,
        topics: [],
        difficulty: nextLevel
      });
    }

    return { immediate, thisWeek, thisMonth };
  }

  private getWeakTopics(results: QuizResult[]): string[] {
    const topicScores = new Map<string, number>();

    results.forEach(r => {
      r.topicResults.forEach(t => {
        const existing = topicScores.get(t.topic) || { correct: 0, total: 0 };
        existing.correct += t.correctQuestions;
        existing.total += t.totalQuestions;
        topicScores.set(t.topic, existing);
      });
    });

    return Array.from(topicScores.entries())
      .filter(([, data]) => data.total >= 3)
      .map(([topic, data]) => ({
        topic,
        score: (data.correct / data.total) * 100
      }))
      .filter(t => t.score < 70)
      .sort((a, b) => a.score - b.score)
      .map(t => t.topic);
  }

  private deduplicateAndSort(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    const unique = recommendations.filter(r => {
      const key = `${r.type}_${r.title}_${r.topics.join(",")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  suggestDifficulty(params: {
    currentLevel: DifficultyLevel;
    recentScores: number[];
    streak: number;
  }): DifficultyLevel {
    const { currentLevel, recentScores, streak } = params;

    if (recentScores.length === 0) return currentLevel;

    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    // Very high performance + good streak = increase difficulty
    if (avgScore >= 90 && streak >= 3) {
      return this.advanceLevel(currentLevel);
    }

    // High performance = maintain with slight increase
    if (avgScore >= 80) {
      return currentLevel;
    }

    // Average performance = maintain current
    if (avgScore >= 60) {
      return currentLevel;
    }

    // Low performance = decrease difficulty
    if (avgScore < 50) {
      return this.recedeLevel(currentLevel);
    }

    return currentLevel;
  }

  private advanceLevel(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : current;
  }

  private recedeLevel(current: DifficultyLevel): DifficultyLevel {
    const levels: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];
    const index = levels.indexOf(current);
    return index > 0 ? levels[index - 1] : current;
  }

  getMotivationalTips(streak: number, level: DifficultyLevel): string[] {
    const tips: string[] = [];

    if (streak > 0) {
      tips.push(`🔥 You're on a ${streak}-day streak! Keep it going!`);
    }

    if (level === "easy") {
      tips.push("Building foundations is the key to mastery!");
    } else if (level === "medium") {
      tips.push("You're in the sweet spot for learning!");
    } else if (level === "hard") {
      tips.push("Impressive! You're挑战自我!");
    } else {
      tips.push("You're among the elite learners!");
    }

    tips.push("Remember: mistakes are learning opportunities!");

    return tips;
  }

  destroy(): void {
    RecommendationService.instance = null as any;
  }
}

export default RecommendationService;
