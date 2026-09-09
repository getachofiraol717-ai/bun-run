// Study Companion — useRecommendations Hook
// React hook for accessing personalized recommendations

import { useState, useEffect, useCallback } from "react";
import { recommendationEngine } from "../core/RecommendationEngine";
import { recommendationService } from "../services/RecommendationService";

export type RecommendationType =
  | "spaced_review"
  | "lesson"
  | "practice"
  | "exploration"
  | "goal_aligned"
  | "weakness_focus"
  | "quick_practice";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  reason: string;
  priority: number;
  subject?: string;
  topic?: string;
  estimatedTime?: number;
  deadline?: Date;
  completed?: boolean;
  dismissed?: boolean;
  createdAt: Date;
}

export interface UseRecommendationsOptions {
  userId: string;
  autoLoad?: boolean;
  limit?: number;
  type?: RecommendationType;
  subject?: string;
  excludeCompleted?: boolean;
}

export interface UseRecommendationsReturn {
  // State
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  acceptRecommendation: (id: string) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
  completeRecommendation: (id: string) => Promise<void>;

  // Performance tracking
  getPerformance: () => Promise<{
    total: number;
    accepted: number;
    completed: number;
    acceptanceRate: number;
  }>;
}

export function useRecommendations(options: UseRecommendationsOptions): UseRecommendationsReturn {
  const {
    userId,
    autoLoad = true,
    limit = 10,
    type,
    subject,
    excludeCompleted = true
  } = options;

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recommendations
  const loadRecommendations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      await recommendationService.initialize(userId);

      const recs = await recommendationService.getRecommendations({
        limit,
        type,
        subject,
        excludeCompleted
      });

      setRecommendations(recs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load recommendations";
      setError(message);
      console.error("Load recommendations error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit, type, subject, excludeCompleted]);

  useEffect(() => {
    if (autoLoad) {
      loadRecommendations();
    }
  }, [autoLoad, loadRecommendations]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadRecommendations();
  }, [loadRecommendations]);

  // Accept recommendation
  const acceptRecommendation = useCallback(async (id: string) => {
    await recommendationService.trackFeedback(id, "accepted");

    setRecommendations(prev =>
      prev.map(r =>
        r.id === id ? { ...r, accepted: true } : r
      )
    );
  }, []);

  // Dismiss recommendation
  const dismissRecommendation = useCallback(async (id: string) => {
    await recommendationService.trackFeedback(id, "dismissed");

    setRecommendations(prev =>
      prev.map(r =>
        r.id === id ? { ...r, dismissed: true } : r
      )
    );
  }, []);

  // Complete recommendation
  const completeRecommendation = useCallback(async (id: string) => {
    await recommendationService.trackFeedback(id, "completed");

    setRecommendations(prev =>
      prev.map(r =>
        r.id === id ? { ...r, completed: true } : r
      )
    );
  }, []);

  // Get performance
  const getPerformance = useCallback(async () => {
    return await recommendationService.getRecommendationPerformance();
  }, []);

  return {
    recommendations,
    isLoading,
    error,
    refresh,
    acceptRecommendation,
    dismissRecommendation,
    completeRecommendation,
    getPerformance
  };
}

// Alternative hook for AI Tutor integration
export function useStudyCompanionRecommendations(userId: string): {
  getNextRecommendation: () => Promise<Recommendation | null>;
  markAsViewed: (id: string) => Promise<void>;
  getSpacedRepetitionQueue: () => Promise<Recommendation[]>;
} {
  // Get next recommendation
  const getNextRecommendation = useCallback(async (): Promise<Recommendation | null> => {
    if (!userId) return null;

    await recommendationService.initialize(userId);
    const recs = await recommendationService.getRecommendations({ limit: 1 });
    return recs.length > 0 ? recs[0] : null;
  }, [userId]);

  // Mark as viewed
  const markAsViewed = useCallback(async (id: string) => {
    await recommendationService.trackFeedback(id, "accepted");
  }, []);

  // Get spaced repetition queue
  const getSpacedRepetitionQueue = useCallback(async (): Promise<Recommendation[]> => {
    if (!userId) return [];

    await recommendationService.initialize(userId);
    return await recommendationService.getRecommendations({
      limit: 10,
      type: "spaced_review"
    });
  }, [userId]);

  return {
    getNextRecommendation,
    markAsViewed,
    getSpacedRepetitionQueue
  };
}

export default useRecommendations;
