// @ts-nocheck
// Study Companion — Recommendation Engine
// Generates personalized learning recommendations

import type { Recommendation, RecommendationType } from "../models/Recommendation";
import type { ConceptRecord } from "../models/LearningHistory";
import type { LearningGoal } from "../models/LearningGoal";

export interface RecommendationRequest {
  userId: string;
  limit?: number;
  type?: RecommendationType;
  subject?: string;
  excludeIds?: string[];
}

export interface RecommendationContext {
  currentSession?: boolean;
  availableTime?: number;
  energyLevel?: "low" | "medium" | "high";
  recentSubjects?: string[];
}

export class RecommendationEngine {
  private userId: string = "";
  private recommendations: Map<string, Recommendation> = new Map();
  private context: RecommendationContext = {};
  private listeners: Set<(recs: Recommendation[]) => void> = new Set();

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadRecommendations();
    await this.generateRecommendations();
  }

  private async loadRecommendations(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem(`sc_recs_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        this.recommendations = new Map(data.map((r: any) => {
          r.createdAt = new Date(r.createdAt);
          if (r.deadline) r.deadline = new Date(r.deadline);
          if (r.expiresAt) r.expiresAt = new Date(r.expiresAt);
          return [r.id, r];
        }));
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  }

  private async saveRecommendations(): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const data = Array.from(this.recommendations.values());
      localStorage.setItem(`sc_recs_${this.userId}`, JSON.stringify(data));
      this.notifyListeners();
    } catch (error) {
      console.error("Failed to save recommendations:", error);
    }
  }

  // Generate recommendations
  private async generateRecommendations(): Promise<void> {
    // This would connect to actual data sources
    // For now, create some default recommendations

    const defaultRecommendations: Partial<Recommendation>[] = [
      {
        type: "revision",
        priority: 8,
        title: "Review recently learned concepts",
        description: "Reinforce your knowledge with a quick review session.",
        reason: "spaced_repetition",
        estimatedTime: 15
      },
      {
        type: "practice",
        priority: 7,
        title: "Practice with exercises",
        description: "Apply what you've learned with practice problems.",
        reason: "performance_improvement",
        estimatedTime: 20
      },
      {
        type: "lesson",
        priority: 6,
        title: "Continue your learning journey",
        description: "Start the next lesson in your current subject.",
        reason: "goal_alignment",
        estimatedTime: 25
      }
    ];

    for (const rec of defaultRecommendations) {
      if (!this.hasRecentRecommendation(rec.type!)) {
        const recommendation = this.createRecommendation(rec);
        this.recommendations.set(recommendation.id, recommendation);
      }
    }

    await this.saveRecommendations();
  }

  private createRecommendation(options: Partial<Recommendation>): Recommendation {
    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      type: options.type || "lesson",
      priority: options.priority || 5,
      title: options.title || "Recommended Activity",
      description: options.description || "Based on your learning patterns.",
      reason: options.reason || "algorithm",
      source: {
        type: "algorithm",
        confidence: 75
      },
      estimatedTime: options.estimatedTime || 15,
      benefits: [],
      prerequisites: [],
      completed: false,
      dismissed: false,
      createdAt: new Date()
    };
  }

  private hasRecentRecommendation(type: RecommendationType): boolean {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);

    return Array.from(this.recommendations.values()).some(r =>
      r.type === type && r.createdAt >= dayAgo
    );
  }

  // Get recommendations
  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    let recs = Array.from(this.recommendations.values());

    // Filter out completed and dismissed
    recs = recs.filter(r => !r.completed && !r.dismissed);

    // Filter by type
    if (request.type) {
      recs = recs.filter(r => r.type === request.type);
    }

    // Filter by subject
    if (request.subject) {
      recs = recs.filter(r => r.subject === request.subject);
    }

    // Exclude specific IDs
    if (request.excludeIds) {
      recs = recs.filter(r => !request.excludeIds!.includes(r.id));
    }

    // Sort by priority
    recs.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Limit results
    if (request.limit) {
      recs = recs.slice(0, request.limit);
    }

    return recs;
  }

  // Accept recommendation
  async acceptRecommendation(recommendationId: string): Promise<void> {
    const rec = this.recommendations.get(recommendationId);
    if (rec) {
      rec.completed = true;
      rec.completedAt = new Date();
      await this.saveRecommendations();
    }
  }

  // Dismiss recommendation
  async dismissRecommendation(recommendationId: string): Promise<void> {
    const rec = this.recommendations.get(recommendationId);
    if (rec) {
      rec.dismissed = true;
      await this.saveRecommendations();
    }
  }

  // Snooze recommendation
  async snoozeRecommendation(recommendationId: string, hours: number = 24): Promise<void> {
    const rec = this.recommendations.get(recommendationId);
    if (rec) {
      rec.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      await this.saveRecommendations();
    }
  }

  // Generate context-aware recommendations
  async getContextualRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    this.context = context;
    let recs = await this.getRecommendations({ userId: this.userId, limit: 10 });

    // Adjust based on context
    if (context.availableTime) {
      recs = recs.filter(r => r.estimatedTime <= context.availableTime!);
    }

    if (context.energyLevel) {
      if (context.energyLevel === "low") {
        // Prefer easier recommendations
        recs = recs.filter(r => r.type === "revision" || r.type === "break");
      } else if (context.energyLevel === "high") {
        // Prefer challenging recommendations
        recs = recs.filter(r => r.type === "deep_dive" || r.type === "challenge");
      }
    }

    return recs;
  }

  // Generate spaced repetition recommendations
  async generateSpacedRepetitionRecommendations(
    concepts: ConceptRecord[]
  ): Promise<Recommendation[]> {
    const now = new Date();
    const recommendations: Recommendation[] = [];

    for (const concept of concepts) {
      if (concept.nextReviewDate && concept.nextReviewDate <= now) {
        const daysSinceReview = Math.floor(
          (now.getTime() - concept.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const priority = daysSinceReview > 7 ? 9 : daysSinceReview > 3 ? 7 : 5;

        recommendations.push({
          id: `sr-rec-${concept.id}`,
          userId: this.userId,
          type: "spaced_review",
          priority,
          title: `Review: ${concept.concept}`,
          description: `Time to reinforce your knowledge of ${concept.concept}.`,
          reason: "spaced_repetition",
          source: {
            type: "algorithm",
            confidence: 90,
            triggeredBy: concept.id
          },
          subject: concept.subject,
          topic: concept.topic,
          estimatedTime: 10,
          benefits: ["Better retention", "Stronger connections"],
          prerequisites: [],
          completed: false,
          dismissed: false,
          createdAt: new Date()
        });
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  // Generate goal-aligned recommendations
  async generateGoalRecommendations(
    goals: LearningGoal[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const goal of goals.filter(g => g.status === "active")) {
      if (goal.subject) {
        recommendations.push({
          id: `goal-rec-${goal.id}`,
          userId: this.userId,
          type: "lesson",
          priority: goal.priority === "high" ? 8 : 5,
          title: `Work toward: ${goal.title}`,
          description: goal.description || `Continue making progress on your ${goal.type} goal.`,
          reason: "goal_alignment",
          source: {
            type: "algorithm",
            confidence: 80,
            triggeredBy: goal.id
          },
          subject: goal.subject,
          topics: goal.topics,
          deadline: goal.targetDate,
          estimatedTime: goal.type === "daily" ? 15 : 30,
          benefits: ["Goal progress", "Momentum building"],
          prerequisites: goal.linkedTopics,
          completed: false,
          dismissed: false,
          createdAt: new Date()
        });
      }
    }

    return recommendations;
  }

  // Get recommendation statistics
  getStatistics(): {
    total: number;
    completed: number;
    dismissed: number;
    pending: number;
    acceptanceRate: number;
  } {
    const all = Array.from(this.recommendations.values());
    const completed = all.filter(r => r.completed).length;
    const dismissed = all.filter(r => r.dismissed).length;
    const pending = all.filter(r => !r.completed && !r.dismissed).length;

    return {
      total: all.length,
      completed,
      dismissed,
      pending,
      acceptanceRate: all.length > 0 ? (completed / (completed + dismissed)) * 100 : 0
    };
  }

  // Update context
  setContext(context: RecommendationContext): void {
    this.context = context;
  }

  // Subscribe to changes
  subscribe(listener: (recs: Recommendation[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const recs = Array.from(this.recommendations.values());
    for (const listener of this.listeners) {
      listener(recs);
    }
  }

  // Cleanup
  destroy(): void {
    this.recommendations.clear();
    this.listeners.clear();
  }
}

export const recommendationEngine = new RecommendationEngine();

