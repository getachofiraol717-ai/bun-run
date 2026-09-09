// Study Companion — Recommendation Service
// Serves and manages learning recommendations

export interface RecommendationRequest {
  limit?: number;
  type?: string;
  subject?: string;
  priority?: number;
  excludeCompleted?: boolean;
}

export class RecommendationService {
  private static instance: RecommendationService;
  private userId: string = "";
  private lastGenerated: Date | null = null;

  private constructor() {}

  static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
  }

  // Get personalized recommendations
  async getRecommendations(request: RecommendationRequest = {}): Promise<any[]> {
    const recommendations: any[] = [];

    // Get spaced repetition recommendations
    const spacedRepRecs = await this.getSpacedRepetitionRecommendations();
    recommendations.push(...spacedRepRecs);

    // Get goal-based recommendations
    const goalRecs = await this.getGoalRecommendations();
    recommendations.push(...goalRecs);

    // Get subject-based recommendations
    if (request.subject) {
      const subjectRecs = await this.getSubjectRecommendations(request.subject);
      recommendations.push(...subjectRecs);
    }

    // Get general recommendations
    const generalRecs = await this.getGeneralRecommendations();
    recommendations.push(...generalRecs);

    // Filter
    let filtered = recommendations;

    if (request.type) {
      filtered = filtered.filter(r => r.type === request.type);
    }

    if (request.priority) {
      filtered = filtered.filter(r => r.priority >= request.priority);
    }

    if (request.excludeCompleted !== false) {
      filtered = filtered.filter(r => !r.completed && !r.dismissed);
    }

    // Sort by priority and recency
    filtered.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Limit results
    if (request.limit) {
      filtered = filtered.slice(0, request.limit);
    }

    return filtered;
  }

  private async getSpacedRepetitionRecommendations(): Promise<any[]> {
    // Get concepts that need review
    const conceptsForReview = await this.getConceptsForReview();

    return conceptsForReview.map(concept => ({
      id: `sr-${concept.id}`,
      type: "spaced_review",
      priority: concept.decayScore > 50 ? 8 : 5,
      title: `Review: ${concept.concept}`,
      description: `Time to refresh your knowledge of ${concept.concept}.`,
      reason: "spaced_repetition",
      subject: concept.subject,
      topic: concept.topic,
      estimatedTime: 10,
      createdAt: new Date()
    }));
  }

  private async getGoalRecommendations(): Promise<any[]> {
    const activeGoals = await this.getActiveGoals();

    return activeGoals.slice(0, 3).map(goal => ({
      id: `goal-${goal.id}`,
      type: "lesson",
      priority: goal.priority === "high" ? 9 : goal.priority === "medium" ? 6 : 4,
      title: `Work on: ${goal.title}`,
      description: goal.description || "Continue making progress toward your goal.",
      reason: "goal_alignment",
      subject: goal.subject,
      deadline: goal.targetDate,
      estimatedTime: 25,
      createdAt: new Date()
    }));
  }

  private async getSubjectRecommendations(subject: string): Promise<any[]> {
    // Get weak topics in this subject
    const weakTopics = await this.getWeakTopics(subject);

    return weakTopics.slice(0, 2).map(topic => ({
      id: `weak-${topic.id}`,
      type: "practice",
      priority: 7,
      title: `Practice: ${topic.name}`,
      description: `Strengthen your understanding of ${topic.name}.`,
      reason: "weak_performance",
      subject,
      topic: topic.name,
      estimatedTime: 20,
      createdAt: new Date()
    }));
  }

  private async getGeneralRecommendations(): Promise<any[]> {
    const recs: any[] = [];

    // Suggest exploration
    recs.push({
      id: `explore-${Date.now()}`,
      type: "exploration",
      priority: 4,
      title: "Discover new topics",
      description: "Explore content you haven't covered yet.",
      reason: "student_preference",
      estimatedTime: 15,
      createdAt: new Date()
    });

    // Suggest quick practice
    recs.push({
      id: `quick-${Date.now()}`,
      type: "practice",
      priority: 5,
      title: "Quick practice session",
      description: "A short practice to reinforce your learning.",
      reason: "consistency",
      estimatedTime: 10,
      createdAt: new Date()
    });

    return recs;
  }

  private async getConceptsForReview(): Promise<any[]> {
    // Placeholder - would connect to LearningHistoryEngine
    return [];
  }

  private async getActiveGoals(): Promise<any[]> {
    if (typeof localStorage === "undefined") return [];

    try {
      const stored = localStorage.getItem(`sc_goals_${this.userId}`);
      if (stored) {
        const goals = JSON.parse(stored);
        return goals.filter((g: any) => g.status === "active");
      }
    } catch (error) {
      console.error("Failed to get goals:", error);
    }

    return [];
  }

  private async getWeakTopics(subject: string): Promise<any[]> {
    // Placeholder - would connect to ProgressAnalyzer
    return [];
  }

  // Track recommendation feedback
  async trackFeedback(
    recommendationId: string,
    action: "accepted" | "dismissed" | "completed"
  ): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const key = `sc_rec_feedback_${this.userId}`;
      const stored = localStorage.getItem(key);
      const feedback = stored ? JSON.parse(stored) : {};

      feedback[recommendationId] = {
        action,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(key, JSON.stringify(feedback));
    } catch (error) {
      console.error("Failed to track feedback:", error);
    }
  }

  // Get recommendation performance
  async getRecommendationPerformance(): Promise<{
    total: number;
    accepted: number;
    completed: number;
    acceptanceRate: number;
  }> {
    if (typeof localStorage === "undefined") {
      return { total: 0, accepted: 0, completed: 0, acceptanceRate: 0 };
    }

    try {
      const key = `sc_rec_feedback_${this.userId}`;
      const stored = localStorage.getItem(key);
      const feedback = stored ? JSON.parse(stored) : {};

      const total = Object.keys(feedback).length;
      const accepted = Object.values(feedback).filter(
        (f: any) => f.action === "accepted" || f.action === "completed"
      ).length;
      const completed = Object.values(feedback).filter(
        (f: any) => f.action === "completed"
      ).length;

      return {
        total,
        accepted,
        completed,
        acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0
      };
    } catch (error) {
      console.error("Failed to get recommendation performance:", error);
      return { total: 0, accepted: 0, completed: 0, acceptanceRate: 0 };
    }
  }

  // Cleanup old recommendations
  async cleanupOldRecommendations(daysOld: number = 7): Promise<void> {
    if (typeof localStorage === "undefined") return;

    try {
      const key = `sc_recs_${this.userId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const recommendations = JSON.parse(stored);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);

        const filtered = recommendations.filter((r: any) => {
          if (r.completed || r.dismissed) return true;
          return new Date(r.createdAt) >= cutoff;
        });

        localStorage.setItem(key, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error("Failed to cleanup recommendations:", error);
    }
  }
}

export const recommendationService = RecommendationService.getInstance();
