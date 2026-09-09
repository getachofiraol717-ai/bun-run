// @ts-nocheck
// Adaptive Quiz Engine — useAdaptiveQuiz Hook
// Specialized hook for adaptive quiz functionality

import { useState, useEffect, useCallback, useMemo } from "react";
import type { DifficultyLevel, Question } from "../models/Question";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";
import type { QuizResult } from "../models/QuizResult";
import { QuizController } from "../core/QuizController";
import { QuizRecommendationEngine } from "../core/QuizRecommendationEngine";
import { KnowledgeGapAnalyzer } from "../core/KnowledgeGapAnalyzer";

export interface AdaptiveState {
  currentLevel: DifficultyLevel;
  levelHistory: Array<{
    from: DifficultyLevel;
    to: DifficultyLevel;
    at: Date;
  }>;
  performanceMetrics: {
    accuracy: number;
    streak: number;
    questionsAnswered: number;
  };
  recommendations: any[];
  predictedDifficulty: DifficultyLevel;
}

export interface UseAdaptiveQuizReturn {
  // State
  state: AdaptiveState;
  profile: UserDifficultyProfile | null;
  recommendations: any[];
  nextRecommendedDifficulty: DifficultyLevel;

  // Actions
  recordAnswer: (isCorrect: boolean, timeSpent: number, question?: Question) => void;
  adjustDifficulty: () => DifficultyLevel;
  getRecommendedQuestions: (count: number) => Question[];
  getPerformanceTrend: () => { improving: boolean; stable: boolean; declining: boolean };

  // Computed
  isAtMaxDifficulty: boolean;
  isAtMinDifficulty: boolean;
  currentStreak: number;
  averageAccuracy: number;
}

export function useAdaptiveQuiz(userId: string): UseAdaptiveQuizReturn {
  const [controller] = useState(() => QuizController.getInstance());
  const [recommendationEngine] = useState(() => QuizRecommendationEngine.getInstance());
  const [gapAnalyzer] = useState(() => KnowledgeGapAnalyzer.getInstance());

  const [state, setState] = useState<AdaptiveState>({
    currentLevel: "medium",
    levelHistory: [],
    performanceMetrics: {
      accuracy: 0,
      streak: 0,
      questionsAnswered: 0
    },
    recommendations: [],
    predictedDifficulty: "medium"
  });

  const [profile, setProfile] = useState<UserDifficultyProfile | null>(null);
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);

  // Load profile
  useEffect(() => {
    const difficultyProfile = controller.getDifficultyProfile();
    if (difficultyProfile) {
      setProfile(difficultyProfile);
      setState(prev => ({
        ...prev,
        currentLevel: difficultyProfile.currentLevel
      }));
    }
  }, [controller]);

  // Record answer and update metrics
  const recordAnswer = useCallback((
    isCorrect: boolean,
    timeSpent: number,
    question?: Question
  ): void => {
    setState(prev => {
      const newMetrics = { ...prev.performanceMetrics };
      newMetrics.questionsAnswered++;

      // Update accuracy
      const totalCorrect = prev.performanceMetrics.accuracy * prev.performanceMetrics.questionsAnswered;
      const newTotal = newMetrics.questionsAnswered;
      newMetrics.accuracy = (totalCorrect + (isCorrect ? 1 : 0)) / newTotal;

      // Update streak
      if (isCorrect) {
        newMetrics.streak++;
      } else {
        newMetrics.streak = 0;
      }

      return {
        ...prev,
        performanceMetrics: newMetrics
      };
    });
  }, []);

  // Adjust difficulty based on performance
  const adjustDifficulty = useCallback((): DifficultyLevel => {
    const engine = controller.getDifficultyEngine();
    if (!profile) return "medium";

    const currentProfile = engine.getProfile(userId);
    if (!currentProfile) return state.currentLevel;

    const recommended = engine.getRecommendedDifficulty(currentProfile);

    if (recommended !== state.currentLevel) {
      setState(prev => ({
        ...prev,
        levelHistory: [
          ...prev.levelHistory,
          { from: prev.currentLevel, to: recommended, at: new Date() }
        ],
        currentLevel: recommended
      }));
    }

    return recommended;
  }, [controller, profile, userId, state.currentLevel]);

  // Get recommended questions based on current level
  const getRecommendedQuestions = useCallback((count: number): Question[] => {
    // Would integrate with question generator
    return [];
  }, []);

  // Get performance trend
  const getPerformanceTrend = useCallback(() => {
    const metrics = state.performanceMetrics;

    if (metrics.accuracy > 75 && metrics.streak >= 3) {
      return { improving: true, stable: false, declining: false };
    } else if (metrics.accuracy < 50) {
      return { improving: false, stable: false, declining: true };
    }

    return { improving: false, stable: true, declining: false };
  }, [state.performanceMetrics]);

  // Computed values
  const isAtMaxDifficulty = state.currentLevel === "expert";
  const isAtMinDifficulty = state.currentLevel === "easy";
  const currentStreak = state.performanceMetrics.streak;
  const averageAccuracy = state.performanceMetrics.accuracy;

  // Next recommended difficulty
  const nextRecommendedDifficulty = useMemo((): DifficultyLevel => {
    if (averageAccuracy >= 90 && currentStreak >= 5) {
      const levels: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];
      const currentIndex = levels.indexOf(state.currentLevel);
      return currentIndex < 3 ? levels[currentIndex + 1] : "expert";
    }
    return state.currentLevel;
  }, [averageAccuracy, currentStreak, state.currentLevel]);

  return {
    state,
    profile,
    recommendations: state.recommendations,
    nextRecommendedDifficulty,
    recordAnswer,
    adjustDifficulty,
    getRecommendedQuestions,
    getPerformanceTrend,
    isAtMaxDifficulty,
    isAtMinDifficulty,
    currentStreak,
    averageAccuracy
  };
}

export default useAdaptiveQuiz;
