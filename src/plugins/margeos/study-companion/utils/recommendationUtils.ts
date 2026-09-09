// Study Companion — Recommendation Utilities
// Utility functions for recommendations

export type RecommendationType =
  | "spaced_review"
  | "lesson"
  | "practice"
  | "exploration"
  | "goal_aligned"
  | "weakness_focus"
  | "quick_practice"
  | "break"
  | "review_session";

export interface RecommendationConfig {
  type: RecommendationType;
  title: string;
  description: string;
  icon?: string;
  estimatedMinutes?: number;
  priority?: number;
}

/**
 * Get recommendation type display info
 */
export function getRecommendationTypeInfo(type: RecommendationType): {
  label: string;
  icon: string;
  color: string;
} {
  const typeMap: Record<RecommendationType, { label: string; icon: string; color: string }> = {
    spaced_review: { label: "Spaced Review", icon: "repeat", color: "#4F46E5" },
    lesson: { label: "New Lesson", icon: "book-open", color: "#10B981" },
    practice: { label: "Practice", icon: "edit", color: "#F59E0B" },
    exploration: { label: "Explore", icon: "compass", color: "#8B5CF6" },
    goal_aligned: { label: "Goal Focus", icon: "target", color: "#EF4444" },
    weakness_focus: { label: "Strengthen", icon: "trending-up", color: "#EC4899" },
    quick_practice: { label: "Quick Practice", icon: "zap", color: "#06B6D4" },
    break: { label: "Take a Break", icon: "coffee", color: "#84CC16" },
    review_session: { label: "Review Session", icon: "refresh", color: "#6366F1" }
  };

  return typeMap[type] || { label: type, icon: "star", color: "#6B7280" };
}

/**
 * Calculate priority score for recommendation
 */
export function calculatePriorityScore(
  type: RecommendationType,
  urgency: number,
  importance: number,
  recencyBonus: number = 0
): number {
  const typeWeights: Record<RecommendationType, number> = {
    spaced_review: 10,
    lesson: 7,
    practice: 8,
    exploration: 5,
    goal_aligned: 9,
    weakness_focus: 9,
    quick_practice: 6,
    break: 4,
    review_session: 7
  };

  const typeScore = typeWeights[type] || 5;
  return Math.min(100, (typeScore + urgency + importance + recencyBonus) / 3);
}

/**
 * Generate recommendation reason
 */
export function generateRecommendationReason(
  type: RecommendationType,
  context: {
    subject?: string;
    topic?: string;
    daysSinceLastReview?: number;
    masteryLevel?: number;
    goalProgress?: number;
  }
): string {
  switch (type) {
    case "spaced_review":
      if (context.daysSinceLastReview !== undefined) {
        return `Last reviewed ${context.daysSinceLastReview} days ago. Time for spaced repetition!`;
      }
      return "Based on your learning pattern, it's time for a review session.";

    case "lesson":
      return context.subject
        ? `New content available in ${context.subject}`
        : "New lesson available based on your learning path";

    case "practice":
      return context.topic
        ? `Practice ${context.topic} to strengthen your understanding`
        : "Practice to reinforce your learning";

    case "exploration":
      return "Explore related topics to broaden your knowledge";

    case "goal_aligned":
      return context.goalProgress !== undefined
        ? `This will help you reach ${Math.round(context.goalProgress)}% of your goal`
        : "This activity aligns with your current learning goals";

    case "weakness_focus":
      return context.masteryLevel !== undefined
        ? `Your mastery is at ${context.masteryLevel}%. Let's improve!`
        : "Focus on improving this area";

    case "quick_practice":
      return "Quick 5-minute practice to maintain momentum";

    case "break":
      return "You've been studying hard. Consider taking a short break.";

    case "review_session":
      return "Time for a comprehensive review of recent material";

    default:
      return "Recommended based on your learning pattern";
  }
}

/**
 * Check if recommendation is still valid
 */
export function isRecommendationValid(
  createdAt: Date,
  expiresAt?: Date,
  maxAgeDays: number = 7
): boolean {
  const now = new Date();
  const maxAge = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);

  if (createdAt < maxAge) return false;
  if (expiresAt && expiresAt < now) return false;

  return true;
}

/**
 * Sort recommendations by priority
 */
export function sortRecommendations<T extends { priority: number; createdAt: Date }>(
  recommendations: T[]
): T[] {
  return [...recommendations].sort((a, b) => {
    // First by priority (descending)
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // Then by creation date (newer first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Filter recommendations by type
 */
export function filterByType<T extends { type: string }>(
  recommendations: T[],
  types: RecommendationType[]
): T[] {
  return recommendations.filter(r => types.includes(r.type as RecommendationType));
}

/**
 * Filter recommendations by subject
 */
export function filterBySubject<T extends { subject?: string }>(
  recommendations: T[],
  subject: string
): T[] {
  return recommendations.filter(r => r.subject === subject);
}

/**
 * Get actionable recommendations count
 */
export function getActionableCount<T extends { completed?: boolean; dismissed?: boolean }>(
  recommendations: T[]
): number {
  return recommendations.filter(r => !r.completed && !r.dismissed).length;
}

/**
 * Calculate acceptance rate
 */
export function calculateAcceptanceRate(
  total: number,
  accepted: number
): number {
  if (total === 0) return 0;
  return Math.round((accepted / total) * 100);
}

/**
 * Generate recommendation ID
 */
export function generateRecommendationId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default recommendation templates
 */
export const RECOMMENDATION_TEMPLATES: Record<RecommendationType, Omit<RecommendationConfig, "title" | "description">> = {
  spaced_review: { type: "spaced_review", icon: "repeat", estimatedMinutes: 15, priority: 10 },
  lesson: { type: "lesson", icon: "book-open", estimatedMinutes: 30, priority: 7 },
  practice: { type: "practice", icon: "edit", estimatedMinutes: 20, priority: 8 },
  exploration: { type: "exploration", icon: "compass", estimatedMinutes: 25, priority: 5 },
  goal_aligned: { type: "goal_aligned", icon: "target", estimatedMinutes: 30, priority: 9 },
  weakness_focus: { type: "weakness_focus", icon: "trending-up", estimatedMinutes: 20, priority: 9 },
  quick_practice: { type: "quick_practice", icon: "zap", estimatedMinutes: 5, priority: 6 },
  break: { type: "break", icon: "coffee", estimatedMinutes: 10, priority: 4 },
  review_session: { type: "review_session", icon: "refresh", estimatedMinutes: 30, priority: 7 }
};
