// @ts-nocheck
/**
 * useExamSimulator.ts
 *
 * React hook for exam simulation functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ExamSimulatorEngine } from '../core/ExamSimulatorEngine';
import { ExamController } from '../core/ExamController';
import type { Exam, ExamMode, ExamConfig } from '../models';
import type { ExamSession } from '../models/ExamSession';
import type { ExamResult } from '../models';
import type { TimerDisplay } from '../services/TimerService';
import { timerService } from '../services/TimerService';
import { examGenerationService } from '../services/ExamGenerationService';

export interface UseExamSimulatorOptions {
  autoSave?: boolean;
  enableTimer?: boolean;
  onTimerWarning?: (warning: string) => void;
  onSessionExpire?: () => void;
}

export interface ExamState {
  exam: Exam | null;
  session: ExamSession | null;
  currentQuestionIndex: number;
  timerDisplay: TimerDisplay | null;
  isLoading: boolean;
  error: string | null;
  progress: {
    answered: number;
    total: number;
    flagged: number;
    percentage: number;
  };
}

export function useExamSimulator(options: UseExamSimulatorOptions = {}) {
  const { autoSave = true, enableTimer = true, onTimerWarning, onSessionExpire } = options;

  const [state, setState] = useState<ExamState>({
    exam: null,
    session: null,
    currentQuestionIndex: 0,
    timerDisplay: null,
    isLoading: false,
    error: null,
    progress: { answered: 0, total: 0, flagged: 0, percentage: 0 }
  });

  const engineRef = useRef<ExamController>(ExamController.getInstance());
  const sessionIdRef = useRef<string | null>(null);

  // Initialize engine
  useEffect(() => {
    engineRef.current.initialize();
  }, []);

  // Timer subscription
  useEffect(() => {
    if (sessionIdRef.current && enableTimer) {
      const unsubscribe = timerService.onTimerUpdate(sessionIdRef.current, (display) => {
        setState(prev => ({ ...prev, timerDisplay: display }));

        if (display.status === 'warning' && onTimerWarning) {
          onTimerWarning(display.formatted);
        }

        if (display.status === 'expired' && onSessionExpire) {
          onSessionExpire();
        }
      });

      return () => unsubscribe();
    }
  }, [enableTimer, onTimerWarning, onSessionExpire]);

  // Update progress
  const updateProgress = useCallback(() => {
    if (state.session && state.exam) {
      const answered = state.session.answers.length;
      const total = state.exam.questions.length;
      const flagged = state.session.navigation.flaggedQuestions.length;
      const percentage = total > 0 ? (answered / total) * 100 : 0;

      setState(prev => ({
        ...prev,
        progress: { answered, total, flagged, percentage }
      }));
    }
  }, [state.session, state.exam]);

  // Start a new exam
  const startExam = useCallback(async (
    mode: ExamMode,
    config: Partial<ExamConfig>,
    userId: string = 'current_user',
    topics?: string[]
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await engineRef.current.startExam(mode, config, userId, topics);

      if (result.success && result.data) {
        const exam = engineRef.current.getSessionState(result.data.sessionId);
        sessionIdRef.current = result.data.sessionId;

        setState(prev => ({
          ...prev,
          isLoading: false,
          exam: exam.data?.exam || null,
          session: exam.data?.session || null,
          timerDisplay: exam.data?.timerState ? timerService.getDisplay(result.data.sessionId) : null
        }));

        updateProgress();
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to start exam'
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'An error occurred'
      }));
    }
  }, [updateProgress]);

  // Submit exam
  const submitExam = useCallback(async (answers: Map<string, string | string[] | boolean>) => {
    if (!sessionIdRef.current) return { success: false, error: 'No active session' };

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await engineRef.current.submitExam(sessionIdRef.current, answers);
      sessionIdRef.current = null;

      setState(prev => ({
        ...prev,
        isLoading: false,
        session: null
      }));

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to submit exam'
      }));
      return { success: false, error: error.message };
    }
  }, []);

  // Update answer
  const updateAnswer = useCallback((
    questionId: string,
    answer: string | string[] | boolean
  ) => {
    if (!sessionIdRef.current) return;

    const result = engineRef.current.updateAnswer(sessionIdRef.current, questionId, answer);

    if (result.success) {
      // Refresh session state
      engineRef.current.getSessionState(sessionIdRef.current).then(sessionState => {
        if (sessionState.success && sessionState.data) {
          setState(prev => ({
            ...prev,
            session: sessionState.data.session
          }));
          updateProgress();
        }
      });
    }
  }, [updateProgress]);

  // Navigate to question
  const navigateToQuestion = useCallback((questionId: string) => {
    if (!sessionIdRef.current) return false;

    const result = engineRef.current.navigateToQuestion(sessionIdRef.current, questionId);

    if (result.success && state.exam) {
      const index = state.exam.questions.findIndex(q => q.id === questionId);
      setState(prev => ({ ...prev, currentQuestionIndex: index >= 0 ? index : prev.currentQuestionIndex }));
    }

    return result.success;
  }, [state.exam]);

  // Navigate by index
  const navigateByIndex = useCallback((index: number) => {
    if (!state.exam || index < 0 || index >= state.exam.questions.length) return false;

    const questionId = state.exam.questions[index].id;
    return navigateToQuestion(questionId);
  }, [state.exam, navigateToQuestion]);

  // Flag question
  const toggleFlag = useCallback((questionId: string) => {
    if (!sessionIdRef.current) return;

    const result = engineRef.current.toggleFlagQuestion(sessionIdRef.current, questionId);

    if (result.success && result.data !== undefined) {
      engineRef.current.getSessionState(sessionIdRef.current).then(sessionState => {
        if (sessionState.success && sessionState.data) {
          setState(prev => ({
            ...prev,
            session: sessionState.data.session
          }));
          updateProgress();
        }
      });
    }
  }, [updateProgress]);

  // Pause exam
  const pauseExam = useCallback(async () => {
    if (!sessionIdRef.current) return false;

    const result = await engineRef.current.pauseExam(sessionIdRef.current);

    if (result.success) {
      timerService.pauseTimer(sessionIdRef.current);
      await refreshSession();
    }

    return result.success;
  }, []);

  // Resume exam
  const resumeExam = useCallback(async () => {
    if (!sessionIdRef.current) return false;

    const result = await engineRef.current.resumeExam(sessionIdRef.current);

    if (result.success) {
      timerService.resumeTimer(sessionIdRef.current);
      await refreshSession();
    }

    return result.success;
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    const result = await engineRef.current.getSessionState(sessionIdRef.current);

    if (result.success && result.data) {
      setState(prev => ({
        ...prev,
        exam: result.data!.exam,
        session: result.data!.session,
        timerDisplay: result.data!.timerState ? timerService.getDisplay(sessionIdRef.current!) : null
      }));
      updateProgress();
    }
  }, [updateProgress]);

  // Get current question
  const getCurrentQuestion = useCallback(() => {
    if (!state.exam || state.currentQuestionIndex < 0) return null;
    return state.exam.questions[state.currentQuestionIndex] || null;
  }, [state.exam, state.currentQuestionIndex]);

  // Get question answer
  const getQuestionAnswer = useCallback((questionId: string) => {
    if (!state.session) return undefined;
    const answer = state.session.answers.find(a => a.questionId === questionId);
    return answer?.answer;
  }, [state.session]);

  // Check if question is flagged
  const isQuestionFlagged = useCallback((questionId: string) => {
    if (!state.session) return false;
    return state.session.navigation.flaggedQuestions.includes(questionId);
  }, [state.session]);

  // Check if question is answered
  const isQuestionAnswered = useCallback((questionId: string) => {
    if (!state.session) return false;
    return state.session.answers.some(a => a.questionId === questionId);
  }, [state.session]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    exam: state.exam,
    session: state.session,
    currentQuestionIndex: state.currentQuestionIndex,
    timerDisplay: state.timerDisplay,
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,

    // Actions
    startExam,
    submitExam,
    updateAnswer,
    navigateToQuestion,
    navigateByIndex,
    toggleFlag,
    pauseExam,
    resumeExam,
    refreshSession,
    clearError,

    // Helpers
    getCurrentQuestion,
    getQuestionAnswer,
    isQuestionFlagged,
    isQuestionAnswered,
    hasActiveSession: !!sessionIdRef.current
  };
}

export default useExamSimulator;
