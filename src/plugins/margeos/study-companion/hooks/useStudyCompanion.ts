// @ts-nocheck
// Study Companion — useStudyCompanion Hook
// React hook for accessing Study Companion functionality

import { useState, useEffect, useCallback, useRef } from "react";
import { studyCompanionController } from "../core/StudyCompanionController";
import type { StudentProfile, LearningGoal, StudySession, SubjectPerformance } from "../models";
import type { StudyCompanionState } from "../store/studyCompanionStore";

export interface UseStudyCompanionOptions {
  autoInitialize?: boolean;
  userId: string;
}

export interface UseStudyCompanionReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  profile: StudentProfile | null;

  // Profile actions
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
  detectLearningStyle: () => Promise<void>;

  // Session actions
  startSession: (session: Partial<StudySession>) => Promise<StudySession>;
  endSession: (sessionId: string, data?: Partial<StudySession>) => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<StudySession>) => Promise<void>;

  // Goal actions
  createGoal: (goal: Partial<LearningGoal>) => Promise<LearningGoal>;
  updateGoal: (goalId: string, updates: Partial<LearningGoal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  getActiveGoals: () => Promise<LearningGoal[]>;

  // Progress
  getProgress: () => Promise<any>;
  getSubjectPerformance: (subject?: string) => Promise<SubjectPerformance | SubjectPerformance[]>;

  // Recommendations
  getRecommendations: (limit?: number) => Promise<any[]>;
  trackRecommendationFeedback: (id: string, action: "accepted" | "dismissed" | "completed") => Promise<void>;

  // Utility
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
}

export function useStudyCompanion(options: UseStudyCompanionOptions): UseStudyCompanionReturn {
  const { userId, autoInitialize = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  const initializedRef = useRef(false);

  // Initialize Study Companion
  useEffect(() => {
    if (!userId || initializedRef.current) return;

    const init = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await studyCompanionController.initialize(userId);
        const studentProfile = await studyCompanionController.getStudentProfile();
        setProfile(studentProfile);
        setIsInitialized(true);
        initializedRef.current = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize Study Companion";
        setError(message);
        console.error("Study Companion initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (autoInitialize) {
      init();
    }
  }, [userId, autoInitialize]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<StudentProfile>) => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    await studyCompanionController.updateStudentProfile(updates);
    const updated = await studyCompanionController.getStudentProfile();
    setProfile(updated);
  }, [isInitialized]);

  // Detect learning style
  const detectLearningStyle = useCallback(async () => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    await studyCompanionController.detectAndUpdateLearningStyle();
    const updated = await studyCompanionController.getStudentProfile();
    setProfile(updated);
  }, [isInitialized]);

  // Start session
  const startSession = useCallback(async (sessionData: Partial<StudySession>): Promise<StudySession> => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    return await studyCompanionController.startSession(sessionData);
  }, [isInitialized]);

  // End session
  const endSession = useCallback(async (sessionId: string, data?: Partial<StudySession>) => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    await studyCompanionController.endSession(sessionId, data);
  }, [isInitialized]);

  // Update session
  const updateSession = useCallback(async (sessionId: string, updates: Partial<StudySession>) => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    await studyCompanionController.updateSession(sessionId, updates);
  }, [isInitialized]);

  // Create goal
  const createGoal = useCallback(async (goalData: Partial<LearningGoal>): Promise<LearningGoal> => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    return await studyCompanionController.createGoal(goalData);
  }, [isInitialized]);

  // Update goal
  const updateGoal = useCallback(async (goalId: string, updates: Partial<LearningGoal>) => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    await studyCompanionController.updateGoal(goalId, updates);
  }, [isInitialized]);

  // Delete goal
  const deleteGoal = useCallback(async (goalId: string) => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    await studyCompanionController.deleteGoal(goalId);
  }, [isInitialized]);

  // Get active goals
  const getActiveGoals = useCallback(async (): Promise<LearningGoal[]> => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    return await studyCompanionController.getActiveGoals();
  }, [isInitialized]);

  // Get progress
  const getProgress = useCallback(async () => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    return await studyCompanionController.getProgress();
  }, [isInitialized]);

  // Get subject performance
  const getSubjectPerformance = useCallback(async (subject?: string): Promise<SubjectPerformance | SubjectPerformance[]> => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    return await studyCompanionController.getSubjectPerformance(subject);
  }, [isInitialized]);

  // Get recommendations
  const getRecommendations = useCallback(async (limit?: number) => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    return await studyCompanionController.getRecommendations(limit);
  }, [isInitialized]);

  // Track recommendation feedback
  const trackRecommendationFeedback = useCallback(async (
    id: string,
    action: "accepted" | "dismissed" | "completed"
  ) => {
    if (!isInitialized) throw new Error("Study Companion not initialized");

    await studyCompanionController.trackRecommendationFeedback(id, action);
  }, [isInitialized]);

  // Refresh
  const refresh = useCallback(async () => {
    if (!isInitialized) return;

    setIsLoading(true);
    try {
      const updated = await studyCompanionController.getStudentProfile();
      setProfile(updated);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Reset
  const reset = useCallback(async () => {
    if (!isInitialized) return;

    await studyCompanionController.reset();
    setProfile(null);
    setIsInitialized(false);
    initializedRef.current = false;
  }, [isInitialized]);

  return {
    isInitialized,
    isLoading,
    error,
    profile,
    updateProfile,
    detectLearningStyle,
    startSession,
    endSession,
    updateSession,
    createGoal,
    updateGoal,
    deleteGoal,
    getActiveGoals,
    getProgress,
    getSubjectPerformance,
    getRecommendations,
    trackRecommendationFeedback,
    refresh,
    reset
  };
}

export default useStudyCompanion;
