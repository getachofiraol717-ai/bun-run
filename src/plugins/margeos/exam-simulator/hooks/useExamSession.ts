// @ts-nocheck
/**
 * useExamSession.ts
 *
 * React hook for managing exam sessions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ExamSessionManager } from '../core/ExamSessionManager';
import type { ExamSession, SessionAnswer, SessionCheckpoint } from '../models/ExamSession';
import type { Exam } from '../models';
import { examStorage } from '../store/examSimulatorStore';

export interface UseExamSessionOptions {
  sessionId?: string;
  autoSave?: boolean;
  enableAnalytics?: boolean;
}

export interface ExamSessionState {
  session: ExamSession | null;
  exam: Exam | null;
  answers: Map<string, SessionAnswer>;
  currentQuestionId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useExamSession(options: UseExamSessionOptions = {}) {
  const { sessionId, autoSave = true, enableAnalytics = true } = options;

  const [state, setState] = useState<ExamSessionState>({
    session: null,
    exam: null,
    answers: new Map(),
    currentQuestionId: null,
    isLoading: false,
    error: null
  });

  const managerRef = useRef<ExamSessionManager>(ExamSessionManager.getInstance());
  const sessionIdRef = useRef<string | null>(sessionId || null);

  // Initialize
  useEffect(() => {
    managerRef.current.initialize();

    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  // Load session
  const loadSession = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const session = managerRef.current.getSession(id);

      if (!session) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Session not found'
        }));
        return;
      }

      const exam = examStorage.getExam(session.examId);
      const answersMap = managerRef.current.getAnswersMap(id);

      setState(prev => ({
        ...prev,
        session,
        exam: exam || null,
        answers: answersMap,
        currentQuestionId: session.navigation.questionOrder[session.currentQuestionIndex] || null,
        isLoading: false
      }));

      sessionIdRef.current = id;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load session'
      }));
    }
  }, []);

  // Create new session
  const createSession = useCallback(async (examId: string, userId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newSessionId = await managerRef.current.createSession(examId, userId);
      sessionIdRef.current = newSessionId;
      await loadSession(newSessionId);

      return newSessionId;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to create session'
      }));
      return null;
    }
  }, [loadSession]);

  // Update answer
  const saveAnswer = useCallback((
    questionId: string,
    answer: string | string[] | boolean
  ) => {
    if (!sessionIdRef.current) return null;

    const result = managerRef.current.updateAnswer(sessionIdRef.current, questionId, answer);

    if (result) {
      setState(prev => {
        const newAnswers = new Map(prev.answers);
        newAnswers.set(questionId, result);
        return { ...prev, answers: newAnswers };
      });
    }

    return result;
  }, []);

  // Navigate to question
  const navigateTo = useCallback((questionId: string) => {
    if (!sessionIdRef.current) return false;

    const success = managerRef.current.navigateToQuestion(sessionIdRef.current, questionId);

    if (success) {
      setState(prev => ({ ...prev, currentQuestionId: questionId }));
    }

    return success;
  }, []);

  // Navigate by direction
  const navigateNext = useCallback(() => {
    if (!state.session || !state.currentQuestionId) return false;

    const currentIndex = state.session.navigation.questionOrder.indexOf(state.currentQuestionId);
    if (currentIndex < state.session.navigation.questionOrder.length - 1) {
      const nextQuestionId = state.session.navigation.questionOrder[currentIndex + 1];
      return navigateTo(nextQuestionId);
    }

    return false;
  }, [state.session, state.currentQuestionId, navigateTo]);

  const navigatePrevious = useCallback(() => {
    if (!state.session || !state.currentQuestionId) return false;

    const currentIndex = state.session.navigation.questionOrder.indexOf(state.currentQuestionId);
    if (currentIndex > 0) {
      const prevQuestionId = state.session.navigation.questionOrder[currentIndex - 1];
      return navigateTo(prevQuestionId);
    }

    return false;
  }, [state.session, state.currentQuestionId, navigateTo]);

  // Toggle flag
  const toggleFlag = useCallback((questionId?: string) => {
    const targetId = questionId || state.currentQuestionId;
    if (!sessionIdRef.current || !targetId) return false;

    const flagged = managerRef.current.toggleFlagQuestion(sessionIdRef.current, targetId);

    // Refresh session to get updated flags
    const session = managerRef.current.getSession(sessionIdRef.current);
    if (session) {
      setState(prev => ({ ...prev, session }));
    }

    return flagged;
  }, [state.currentQuestionId]);

  // Toggle bookmark
  const toggleBookmark = useCallback((questionId?: string) => {
    const targetId = questionId || state.currentQuestionId;
    if (!sessionIdRef.current || !targetId) return false;

    return managerRef.current.toggleBookmark(sessionIdRef.current, targetId);
  }, [state.currentQuestionId]);

  // Pause session
  const pause = useCallback(async () => {
    if (!sessionIdRef.current) return false;

    const success = managerRef.current.pauseSession(sessionIdRef.current);

    if (success) {
      const session = managerRef.current.getSession(sessionIdRef.current);
      setState(prev => ({ ...prev, session }));
    }

    return success;
  }, []);

  // Resume session
  const resume = useCallback(async () => {
    if (!sessionIdRef.current) return false;

    const success = managerRef.current.resumeSessionFromPause(sessionIdRef.current);

    if (success) {
      const session = managerRef.current.getSession(sessionIdRef.current);
      setState(prev => ({ ...prev, session }));
    }

    return success;
  }, []);

  // End session
  const end = useCallback(async () => {
    if (!sessionIdRef.current) return null;

    try {
      const session = await managerRef.current.endSession(sessionIdRef.current);
      setState(prev => ({ ...prev, session: null }));
      sessionIdRef.current = null;
      return session;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message }));
      return null;
    }
  }, []);

  // Create checkpoint
  const createCheckpoint = useCallback(() => {
    if (!state.session) return null;

    const checkpoint = managerRef.current.createCheckpoint(state.session);
    setState(prev => ({
      ...prev,
      session: {
        ...prev.session!,
        checkpoints: [...prev.session!.checkpoints, checkpoint]
      }
    }));

    return checkpoint;
  }, [state.session]);

  // Restore checkpoint
  const restoreCheckpoint = useCallback((checkpointId: string) => {
    if (!sessionIdRef.current) return false;

    return managerRef.current.restoreFromCheckpoint(sessionIdRef.current, checkpointId);
  }, []);

  // Get session stats
  const getStats = useCallback(() => {
    if (!sessionIdRef.current) return null;
    return managerRef.current.getSessionStats(sessionIdRef.current);
  }, []);

  // Get navigation info
  const getNavigation = useCallback(() => {
    if (!state.session) return null;

    const currentIndex = state.currentQuestionId
      ? state.session.navigation.questionOrder.indexOf(state.currentQuestionId)
      : 0;

    return {
      currentIndex,
      totalQuestions: state.session.navigation.questionOrder.length,
      canGoNext: currentIndex < state.session.navigation.questionOrder.length - 1,
      canGoPrevious: currentIndex > 0,
      visitedQuestions: state.session.navigation.visitedQuestions,
      flaggedQuestions: state.session.navigation.flaggedQuestions,
      bookmarkedQuestions: state.session.navigation.bookmarkedQuestions
    };
  }, [state.session, state.currentQuestionId]);

  return {
    // State
    session: state.session,
    exam: state.exam,
    answers: state.answers,
    currentQuestionId: state.currentQuestionId,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    loadSession,
    createSession,
    saveAnswer,
    navigateTo,
    navigateNext,
    navigatePrevious,
    toggleFlag,
    toggleBookmark,
    pause,
    resume,
    end,
    createCheckpoint,
    restoreCheckpoint,

    // Helpers
    getStats,
    getNavigation,
    hasSession: !!sessionIdRef.current
  };
}

export default useExamSession;
