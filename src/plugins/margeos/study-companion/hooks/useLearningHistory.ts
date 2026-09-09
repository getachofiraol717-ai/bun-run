// @ts-nocheck
// Study Companion — useLearningHistory Hook
// React hook for accessing learning history

import { useState, useEffect, useCallback } from "react";
import { learningHistoryEngine } from "../core/LearningHistoryEngine";
import type { StudySession, ConceptRecord, LearningHistory } from "../models";

export interface UseLearningHistoryOptions {
  userId: string;
  autoLoad?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  subject?: string;
}

export interface UseLearningHistoryReturn {
  // State
  sessions: StudySession[];
  concepts: ConceptRecord[];
  isLoading: boolean;
  error: string | null;

  // Session operations
  getSession: (sessionId: string) => Promise<StudySession | null>;
  getSessionsByDateRange: (start: Date, end: Date) => Promise<StudySession[]>;
  getSessionsBySubject: (subject: string) => Promise<StudySession[]>;

  // Concept operations
  recordConcept: (concept: Partial<ConceptRecord>) => Promise<void>;
  updateConceptMastery: (conceptId: string, mastery: number) => Promise<void>;
  getConceptsForReview: () => Promise<ConceptRecord[]>;
  getWeakConcepts: (subject?: string) => Promise<ConceptRecord[]>;

  // Statistics
  getTotalStudyTime: () => Promise<number>;
  getStudyTimeBySubject: () => Promise<Record<string, number>>;
  getStudyTimeByDay: (days?: number) => Promise<Record<string, number>>;

  // Analytics
  getLearningStreak: () => Promise<{ current: number; longest: number }>;
  getAverageSessionLength: () => Promise<number>;
  getCompletionRate: () => Promise<number>;

  // Utility
  refresh: () => Promise<void>;
}

export function useLearningHistory(options: UseLearningHistoryOptions): UseLearningHistoryReturn {
  const { userId, autoLoad = true, dateRange, subject } = options;

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [concepts, setConcepts] = useState<ConceptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      await learningHistoryEngine.initialize(userId);

      // Load sessions
      let loadedSessions = await learningHistoryEngine.getSessions();

      // Apply filters
      if (dateRange) {
        loadedSessions = loadedSessions.filter(s => {
          const date = new Date(s.startTime);
          return date >= dateRange.start && date <= dateRange.end;
        });
      }

      if (subject) {
        loadedSessions = loadedSessions.filter(s => s.subject === subject);
      }

      setSessions(loadedSessions);

      // Load concepts
      const loadedConcepts = await learningHistoryEngine.getConcepts();
      setConcepts(loadedConcepts);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load learning history";
      setError(message);
      console.error("Load learning history error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dateRange, subject]);

  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  // Get single session
  const getSession = useCallback(async (sessionId: string): Promise<StudySession | null> => {
    return await learningHistoryEngine.getSession(sessionId);
  }, []);

  // Get sessions by date range
  const getSessionsByDateRange = useCallback(async (start: Date, end: Date): Promise<StudySession[]> => {
    const allSessions = await learningHistoryEngine.getSessions();
    return allSessions.filter(s => {
      const date = new Date(s.startTime);
      return date >= start && date <= end;
    });
  }, []);

  // Get sessions by subject
  const getSessionsBySubject = useCallback(async (subj: string): Promise<StudySession[]> => {
    const allSessions = await learningHistoryEngine.getSessions();
    return allSessions.filter(s => s.subject === subj);
  }, []);

  // Record concept
  const recordConcept = useCallback(async (conceptData: Partial<ConceptRecord>) => {
    await learningHistoryEngine.recordConcept(conceptData);
    await loadData();
  }, [loadData]);

  // Update concept mastery
  const updateConceptMastery = useCallback(async (conceptId: string, mastery: number) => {
    await learningHistoryEngine.updateConceptMastery(conceptId, mastery);
    await loadData();
  }, [loadData]);

  // Get concepts for review
  const getConceptsForReview = useCallback(async (): Promise<ConceptRecord[]> => {
    return await learningHistoryEngine.getConceptsForReview();
  }, []);

  // Get weak concepts
  const getWeakConcepts = useCallback(async (subj?: string): Promise<ConceptRecord[]> => {
    const allConcepts = await learningHistoryEngine.getConcepts();
    return allConcepts
      .filter(c => {
        if (subj && c.subject !== subj) return false;
        return c.masteryLevel < 70;
      })
      .sort((a, b) => a.masteryLevel - b.masteryLevel);
  }, []);

  // Get total study time
  const getTotalStudyTime = useCallback(async (): Promise<number> => {
    const allSessions = await learningHistoryEngine.getSessions();
    return allSessions.reduce((sum, s) => sum + s.actualDuration, 0);
  }, []);

  // Get study time by subject
  const getStudyTimeBySubject = useCallback(async (): Promise<Record<string, number>> => {
    const allSessions = await learningHistoryEngine.getSessions();
    const timeBySubject: Record<string, number> = {};

    for (const session of allSessions) {
      if (session.subject) {
        timeBySubject[session.subject] = (timeBySubject[session.subject] || 0) + session.actualDuration;
      }
    }

    return timeBySubject;
  }, []);

  // Get study time by day
  const getStudyTimeByDay = useCallback(async (days: number = 7): Promise<Record<string, number>> => {
    const allSessions = await learningHistoryEngine.getSessions();
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);

    const timeByDay: Record<string, number> = {};

    for (const session of allSessions) {
      const date = new Date(session.startTime);
      if (date >= cutoff) {
        const dayKey = date.toISOString().split("T")[0];
        timeByDay[dayKey] = (timeByDay[dayKey] || 0) + session.actualDuration;
      }
    }

    return timeByDay;
  }, []);

  // Get learning streak
  const getLearningStreak = useCallback(async (): Promise<{ current: number; longest: number }> => {
    return await learningHistoryEngine.getStreak();
  }, []);

  // Get average session length
  const getAverageSessionLength = useCallback(async (): Promise<number> => {
    const allSessions = await learningHistoryEngine.getSessions();
    if (allSessions.length === 0) return 0;

    const totalTime = allSessions.reduce((sum, s) => sum + s.actualDuration, 0);
    return Math.round(totalTime / allSessions.length);
  }, []);

  // Get completion rate
  const getCompletionRate = useCallback(async (): Promise<number> => {
    const allSessions = await learningHistoryEngine.getSessions();
    if (allSessions.length === 0) return 0;

    const completedSessions = allSessions.filter(s => s.completionRate > 0);
    const totalRate = completedSessions.reduce((sum, s) => sum + s.completionRate, 0);

    return Math.round(totalRate / completedSessions.length);
  }, []);

  // Refresh
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    sessions,
    concepts,
    isLoading,
    error,
    getSession,
    getSessionsByDateRange,
    getSessionsBySubject,
    recordConcept,
    updateConceptMastery,
    getConceptsForReview,
    getWeakConcepts,
    getTotalStudyTime,
    getStudyTimeBySubject,
    getStudyTimeByDay,
    getLearningStreak,
    getAverageSessionLength,
    getCompletionRate,
    refresh
  };
}

export default useLearningHistory;
