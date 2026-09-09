// @ts-nocheck
// Adaptive Quiz Engine — QuizRecommendationEngine
// Smart quiz and content recommendations based on student performance

import type { Quiz, QuizType } from "../models/Quiz";
import type { DifficultyLevel, QuestionType } from "../models/Question";
import type { QuizResult } from "../models/QuizResult";
import type { MasteryReport, MasteryLevel } from "../models/MasteryReport";
import type { KnowledgeGap, GapAnalysisResult } from "./KnowledgeGapAnalyzer";

export interface QuizRecommendation {
  id: string;
  type: "quiz" | "practice" | "review" | "assessment" | "challenge";
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  estimatedTime: number;
  difficulty: DifficultyLevel;
  topics: string[];
  subject: string;
  quizConfig?: Partial<Quiz["config"]>;
  expectedImprovement?: number;
  successCriteria?: string[];
}

export interface ContentRecommendation {
  id: string;
  type: "pdf" | "video" | "tutor" | "formula" | "flashcard" | "article" | "visual";
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  estimatedTime: number;
  url?: string;
  contentId?: string;
  topic: string;
  subject: string;
  difficulty?: DifficultyLevel;
}

export interface RecommendationContext {
  userId: string;
  currentQuiz?: Quiz;
  recentResults?: QuizResult[];
  masteryReport?: MasteryReport;
  gaps?: KnowledgeGap[];
  completedQuizzes?: string[];
  availableTopics?: string[];
  strongAreas?: string[];
  weakAreas?: string[];
}

export class QuizRecommendationEngine {
  private static instance: QuizRecommendationEngine;
  private recommendationHistory: Map<string, RecommendationContext[]> = new Map();

  private constructor() {}

  static getInstance(): QuizRecommendationEngine {
    if (!QuizRecommendationEngine.instance) {
      QuizRecommendationEngine.instance = new QuizRecommendationEngine();
    }
    return QuizRecommendationEngine.instance;
  }

  async generateRecommendations(context: RecommendationContext): Promise<{
    quizRecommendations: QuizRecommendation[];
    contentRecommendations: ContentRecommendation[];
  }> {
    const quizRecommendations: QuizRecommendation[] = [];
    const contentRecommendations: ContentRecommendation[] = [];

    // Generate based on knowledge gaps
    if (context.gaps && context.gaps.length > 0) {
      const gapRecommendations = this.generateGapRecommendations(context);
      quizRecommendations.push(...gapRecommendations.quizzes);
      contentRecommendations.push(...gapRecommendations.content);
    }

    // Generate based on mastery levels
    if (context.masteryReport) {
      const masteryRecommendations = this.generateMasteryRecommendations(context);
      quizRecommendations.push(...masteryRecommendations.quizzes);
      contentRecommendations.push(...masteryRecommendations.content);
    }

    // Generate based on recent performance
    if (context.recentResults && context.recentResults.length > 0) {
      const performanceRecommendations = this.generatePerformanceRecommendations(context);
      quizRecommendations.push(...performanceRecommendations.quizzes);
    }

    // Generate general recommendations
    const generalRecommendations = this.generateGeneralRecommendations(context);
    quizRecommendations.push(...generalRecommendations.quizzes);
    contentRecommendations.push(...generalRecommendations.content);

    // Sort by priority and remove duplicates
    const uniqueQuizzes = this.deduplicateQuizzes(quizRecommendations);
    const uniqueContent = this.deduplicateContent(contentRecommendations);

    return {
      quizRecommendations: uniqueQuizzes.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      contentRecommendations: uniqueContent.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
    };
  }

  private generateGapRecommendations(context: RecommendationContext): {
    quizzes: QuizRecommendation[];
    content: ContentRecommendation[];
  } {
    const quizzes: QuizRecommendation[] = [];
    const content: ContentRecommendation[] = [];

    if (!context.gaps) return { quizzes, content };

    context.gaps.forEach(gap => {
      // High priority gap = need immediate practice
      if (gap.severity === "critical") {
        quizzes.push({
          id: `rec_gap_${gap.id}`,
          type: "practice",
          title: `Practice: ${gap.topic}`,
          description: `Targeted practice to address gaps in ${gap.topic}`,
          reason: `Critical knowledge gap identified: ${gap.description}`,
          priority: "high",
          estimatedTime: 20,
          difficulty: "medium",
          topics: [gap.topic],
          subject: gap.subject,
          quizConfig: {
            type: "practice",
            settings: { questionCount: 10, shuffleQuestions: true }
          },
          expectedImprovement: 15,
          successCriteria: ["Achieve 70% accuracy", "Complete within time limit"]
        });

        // Content recommendations
        gap.recommendedActions.forEach(action => {
          content.push({
            id: `rec_content_${gap.id}_${action.type}`,
            type: action.type as ContentRecommendation["type"],
            title: action.title,
            description: action.description,
            reason: `Recommended to address gap in ${gap.topic}`,
            priority: "high",
            estimatedTime: action.estimatedTime,
            topic: gap.topic,
            subject: gap.subject,
            contentId: action.resourceId
          });
        });
      } else if (gap.severity === "major") {
        quizzes.push({
          id: `rec_gap_${gap.id}`,
          type: "practice",
          title: `Review: ${gap.topic}`,
          description: `Review session for ${gap.topic}`,
          reason: `Major knowledge gap identified`,
          priority: "medium",
          estimatedTime: 15,
          difficulty: "easy",
          topics: [gap.topic],
          subject: gap.subject,
          quizConfig: {
            type: "practice",
            settings: { questionCount: 5 }
          },
          expectedImprovement: 10
        });
      }
    });

    return { quizzes, content };
  }

  private generateMasteryRecommendations(context: RecommendationContext): {
    quizzes: QuizRecommendation[];
    content: ContentRecommendation[];
  } {
    const quizzes: QuizRecommendation[] = [];
    const content: ContentRecommendation[] = [];

    if (!context.masteryReport) return { quizzes, content };

    // Find concepts at "developing" level - needs more practice
    const developingConcepts = context.masteryReport.conceptMasteries.filter(
      m => m.level === "developing"
    );

    developingConcepts.forEach(concept => {
      quizzes.push({
        id: `rec_mastery_${concept.conceptId}`,
        type: "practice",
        title: `Strengthen: ${concept.conceptName}`,
        description: `Practice questions to reach proficient level`,
        reason: `Currently at ${concept.level} level - need to reach proficient`,
        priority: "medium",
        estimatedTime: 15,
        difficulty: "medium",
        topics: [concept.conceptId],
        subject: concept.score.current > 50 ? "varies" : "varies",
        quizConfig: {
          type: "practice",
          settings: { questionCount: 8 }
        }
      });
    });

    // Find concepts near mastery - push to mastery
    const nearMastery = context.masteryReport.conceptMasteries.filter(
      m => m.level === "proficient" && m.score.current >= 80
    );

    nearMastery.forEach(concept => {
      quizzes.push({
        id: `rec_mastery_${concept.conceptId}`,
        type: "challenge",
        title: `Master: ${concept.conceptName}`,
        description: `Challenge to achieve mastery`,
        reason: `Near mastery (${concept.score.current.toFixed(0)}%) - one push away`,
        priority: "medium",
        estimatedTime: 10,
        difficulty: "hard",
        topics: [concept.conceptId],
        subject: "varies",
        quizConfig: {
          type: "challenge",
          settings: { questionCount: 5, perQuestionTimeLimit: 45 }
        },
        expectedImprovement: 5
      });
    });

    return { quizzes, content };
  }

  private generatePerformanceRecommendations(context: RecommendationContext): {
    quizzes: QuizRecommendation[];
    content: ContentRecommendation[];
  } {
    const quizzes: QuizRecommendation[] = [];
    const content: ContentRecommendation[] = [];

    if (!context.recentResults || context.recentResults.length === 0) {
      return { quizzes, content };
    }

    const lastResult = context.recentResults[context.recentResults.length - 1];

    // Check for improvement or decline
    if (context.recentResults.length >= 2) {
      const previousResult = context.recentResults[context.recentResults.length - 2];
      const improvement = lastResult.summary.percentage - previousResult.summary.percentage;

      if (improvement > 10) {
        // Great improvement - suggest harder challenge
        quizzes.push({
          id: "rec_perf_challenge",
          type: "challenge",
          title: "Challenge Yourself",
          description: "Take on harder questions to continue growing",
          reason: `Great improvement (+${improvement.toFixed(0)}%)! Ready for harder challenges`,
          priority: "high",
          estimatedTime: 15,
          difficulty: "hard",
          topics: lastResult.summary.percentage > 85 ? ["various"] : lastResult.topicResults.slice(0, 2).map(t => t.topic),
          subject: lastResult.summary.quizTitle.split(" ")[0] || "General",
          quizConfig: {
            type: "challenge",
            settings: { questionCount: 8, shuffleQuestions: true }
          }
        });
      } else if (improvement < -10) {
        // Decline - suggest review
        quizzes.push({
          id: "rec_perf_review",
          type: "review",
          title: "Review Session",
          description: "Review previous material before moving forward",
          reason: `Score declined (${improvement.toFixed(0)}%) - need reinforcement`,
          priority: "high",
          estimatedTime: 20,
          difficulty: "medium",
          topics: lastResult.topicResults.slice(0, 3).map(t => t.topic),
          subject: lastResult.summary.quizTitle.split(" ")[0] || "General",
          quizConfig: {
            type: "review",
            settings: { questionCount: 10 }
          },
          expectedImprovement: Math.abs(improvement)
        });

        content.push({
          id: "rec_perf_tutor",
          type: "tutor",
          title: "Get AI Tutor Help",
          description: "Work with AI Tutor to understand difficult concepts",
          reason: "To address the decline in performance",
          priority: "high",
          estimatedTime: 30,
          topic: "various",
          subject: "General"
        });
      }
    }

    // Suggest diagnostic quiz if no recent activity
    const daysSinceLastQuiz = Math.floor(
      (Date.now() - lastResult.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastQuiz > 7) {
      quizzes.push({
        id: "rec_diagnostic",
        type: "assessment",
        title: "Quick Assessment",
        description: "Check your current knowledge level",
        reason: "No quiz activity in the past week",
        priority: "low",
        estimatedTime: 15,
        difficulty: "medium",
        topics: ["various"],
        subject: "General",
        quizConfig: {
          type: "diagnostic",
          settings: { questionCount: 15 }
        }
      });
    }

    return { quizzes, content };
  }

  private generateGeneralRecommendations(context: RecommendationContext): {
    quizzes: QuizRecommendation[];
    content: ContentRecommendation[];
  } {
    const quizzes: QuizRecommendation[] = [];
    const content: ContentRecommendation[] = [];

    // Daily practice recommendation
    quizzes.push({
      id: "rec_daily_practice",
      type: "practice",
      title: "Daily Practice",
      description: "Quick practice session to maintain momentum",
      reason: "Regular practice helps retain knowledge",
      priority: "low",
      estimatedTime: 10,
      difficulty: context.masteryReport?.summary.level === "expert" ? "hard" : "medium",
      topics: context.availableTopics?.slice(0, 2) || ["various"],
      subject: context.availableTopics?.[0]?.split(".")[0] || "General",
      quizConfig: {
        type: "practice",
        settings: { questionCount: 5, shuffleQuestions: true }
      }
    });

    // Formula practice if available
    if (context.availableTopics?.some(t => t.toLowerCase().includes("formula"))) {
      quizzes.push({
        id: "rec_formula_practice",
        type: "practice",
        title: "Formula Practice",
        description: "Practice applying formulas to solve problems",
        reason: "Formula mastery requires practice",
        priority: "medium",
        estimatedTime: 15,
        difficulty: "medium",
        topics: ["formulas"],
        subject: "Mathematics",
        quizConfig: {
          type: "practice",
          settings: { questionCount: 8 }
        }
      });
    }

    // AI Tutor recommendation
    content.push({
      id: "rec_general_tutor",
      type: "tutor",
      title: "AI Study Companion",
      description: "Get personalized learning support",
      reason: "AI tutor can provide adaptive explanations",
      priority: "low",
      estimatedTime: 30,
      topic: "various",
      subject: "General"
    });

    return { quizzes, content };
  }

  private deduplicateQuizzes(quizzes: QuizRecommendation[]): QuizRecommendation[] {
    const seen = new Set<string>();
    return quizzes.filter(q => {
      const key = `${q.type}_${q.topics.join(",")}_${q.difficulty}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateContent(content: ContentRecommendation[]): ContentRecommendation[] {
    const seen = new Set<string>();
    return content.filter(c => {
      const key = `${c.type}_${c.topic}_${c.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async getNextQuizSuggestion(context: RecommendationContext): Promise<QuizRecommendation | null> {
    const { quizRecommendations } = await this.generateRecommendations(context);
    return quizRecommendations[0] || null;
  }

  async getDailyRecommendations(context: RecommendationContext): Promise<{
    quizzes: QuizRecommendation[];
    content: ContentRecommendation[];
  }> {
    // Get high and medium priority recommendations
    const all = await this.generateRecommendations(context);

    return {
      quizzes: all.quizRecommendations.filter(q => q.priority !== "low").slice(0, 3),
      content: all.contentRecommendations.filter(c => c.priority === "high").slice(0, 2)
    };
  }

  async getWeeklyPlan(context: RecommendationContext): Promise<{
    dailyPlans: Array<{
      day: number;
      quiz?: QuizRecommendation;
      content?: ContentRecommendation[];
    }>;
    expectedProgress: string;
  }> {
    const all = await this.generateRecommendations(context);

    const dailyPlans = [];
    const priorityQuizzes = all.quizRecommendations.filter(q => q.priority !== "low");

    for (let day = 1; day <= 7; day++) {
      const quiz = priorityQuizzes[day - 1];
      const content = all.contentRecommendations.filter(c => c.priority !== "low").slice(day - 1, day);

      dailyPlans.push({
        day,
        quiz,
        content: content.length > 0 ? content : undefined
      });
    }

    return {
      dailyPlans,
      expectedProgress: "Based on consistent practice, expect 10-15% improvement in weak areas"
    };
  }

  recordRecommendationView(recommendationId: string): void {
    // Track which recommendations users are viewing
    console.log(`Recommendation viewed: ${recommendationId}`);
  }

  recordRecommendationAction(
    recommendationId: string,
    action: "accepted" | "dismissed" | "completed"
  ): void {
    // Track recommendation effectiveness
    console.log(`Recommendation ${action}: ${recommendationId}`);
  }

  destroy(): void {
    this.recommendationHistory.clear();
    QuizRecommendationEngine.instance = null as any;
  }
}

export default QuizRecommendationEngine;
