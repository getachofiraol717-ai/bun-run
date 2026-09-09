// @ts-nocheck
// Adaptive Quiz Engine — useRecommendations Hook
// React hook for personalized recommendations

import { useState, useEffect, useCallback } from "react";
import type { QuizResult } from "../models/QuizResult";
import type { KnowledgeGap } from "../core/KnowledgeGapAnalyzer";
import type { Recommendation, StudyPlan } from "../services/RecommendationService";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";
import { QuizRecommendationEngine } from "../core/QuizRecommendationEngine";
import { RecommendationService } from "../services/RecommendationService";
import { QuizController } from "../core/QuizController";

export interface UseRecommendationsReturn {
  // State
  recommendations: {
    quizzes: Recommendation[];
    content: Recommendation[];
  };
  studyPlan: StudyPlan | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshRecommendations: () => Promise<void>;
  generateStudyPlan: (days: number, dailyMinutes: number) => void;
  recordRecommendationAction: (id: string, action: "accepted" | "dismissed" | "completed") => void;

  // Computed
  topRecommendation: Recommendation | null;
  urgentRecommendations: Recommendation[];
  motivationalTips: string[];
}

export function useRecommendations(userId: string): UseRecommendationsReturn {
  const [recommendationEngine] = useState(() => QuizRecommendationEngine.getInstance());
  const [recommendationService] = useState(() => RecommendationService.getInstance());
  const [controller] = useState(() => QuizController.getInstance());

  const [recommendations, setRecommendations] = useState<{
    quizzes: Recommendation[];
    content: Recommendation[];
  }>({ quizzes: [], content: [] });

  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh recommendations
  const refreshRecommendations = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await controller.getQuizHistory(10);
      const profile = controller.getDifficultyProfile();

      const gaps: KnowledgeGap[] = [];
      if (results.length > 0) {
        // Would integrate with gap analyzer
      }

      const recs = await recommendationEngine.generateRecommendations({
        userId,
        results,
        profile: profile!,
        gaps
      });

      setRecommendations(recs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch recommendations";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [recommendationEngine, controller, userId]);

  // Load on mount
  useEffect(() => {
    refreshRecommendations();
  }, [refreshRecommendations]);

  // Generate study plan
  const generateStudyPlan = useCallback((days: number, dailyMinutes: number): void => {
    const results = recommendations.quizzes.length > 0
      ? [] // Would fetch from controller
      : [];

    const gaps: KnowledgeGap[] = [];

    const plan = recommendationService.generateStudyPlan({
      userId,
      results,
      gaps,
      days,
      dailyTimeMinutes: dailyMinutes
    });

    setStudyPlan(plan);
  }, [recommendationService, userId, recommendations.quizzes]);

  // Record action
  const recordRecommendationAction = useCallback((
    id: string,
    action: "accepted" | "dismissed" | "completed"
  ): void => {
    recommendationEngine.recordRecommendationAction(id, action);
  }, [recommendationEngine]);

  // Computed values
  const allRecs = [...recommendations.quizzes, ...recommendations.content];
  const topRecommendation = allRecs[0] || null;
  const urgentRecommendations = allRecs.filter(r => r.priority === "high");

  const motivationalTips = recommendations.quizzes.length > 0
    ? recommendationService.getMotivationalTips(0, "medium")
    : [];

  return {
    recommendations,
    studyPlan,
    isLoading,
    error,
    refreshRecommendations,
    generateStudyPlan,
    recordRecommendationAction,
    topRecommendation,
    urgentRecommendations,
    motivationalTips
  };
}

export default useRecommendations;
