// @ts-nocheck
// Adaptive Quiz Engine — useQuiz Hook
// React hook for quiz management and state

import { useState, useEffect, useCallback } from "react";
import type { Quiz, QuizType, DifficultyLevel, QuestionType } from "../models/Question";
import type { SessionState } from "../models/QuizSession";
import type { QuizResult } from "../models/QuizResult";
import { QuizController } from "../core/QuizController";

export interface UseQuizOptions {
  userId: string;
  autoSave?: boolean;
}

export interface UseQuizReturn {
  // State
  isLoading: boolean;
  error: string | null;
  quiz: Quiz | null;
  session: SessionState | null;
  result: QuizResult | null;
  currentQuestion: any;
  progress: {
    current: number;
    total: number;
    answered: number;
    timeSpent: number;
  };
  status: "idle" | "loading" | "ready" | "in_progress" | "paused" | "completed" | "error";

  // Actions
  createQuiz: (params: CreateQuizParams) => Promise<Quiz>;
  startQuiz: (quizId: string) => Promise<void>;
  submitAnswer: (questionId: string, answer: any) => Promise<any>;
  navigateToQuestion: (index: number) => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  completeQuiz: () => Promise<QuizResult>;
  abandonQuiz: () => void;

  // Computed
  canGoBack: boolean;
  canGoForward: boolean;
  isLastQuestion: boolean;
  timeRemaining?: number;
}

export interface CreateQuizParams {
  title: string;
  type: QuizType;
  subject: string;
  topics: string[];
  difficulty?: DifficultyLevel | DifficultyLevel[];
  questionCount?: number;
  questionTypes?: QuestionType[];
}

export function useQuiz(options: UseQuizOptions): UseQuizReturn {
  const { userId, autoSave = true } = options;

  const [controller] = useState(() => QuizController.getInstance());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Set user ID
  useEffect(() => {
    controller.setUserId(userId);
  }, [userId, controller]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !session || session.status !== "in_progress") return;

    const interval = setInterval(() => {
      controller.saveCheckpoint();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoSave, session, controller]);

  // Get current question
  const currentQuestion = session?.currentQuestionId ? null : null;

  // Progress tracking
  const progress = {
    current: session?.currentQuestionIndex ?? 0,
    total: session?.answers.size ?? 0,
    answered: Array.from(session?.answers.values() ?? []).filter(a => !a.skipped).length,
    timeSpent: session?.timeSpent ?? 0
  };

  // Status
  const status = session?.status === "paused"
    ? "paused"
    : session?.status === "in_progress"
    ? "in_progress"
    : quiz
    ? "ready"
    : error
    ? "error"
    : isLoading
    ? "loading"
    : "idle";

  // Create quiz
  const createQuiz = useCallback(async (params: CreateQuizParams): Promise<Quiz> => {
    setIsLoading(true);
    setError(null);

    try {
      const newQuiz = await controller.createQuiz(params);
      setQuiz(newQuiz);
      return newQuiz;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create quiz";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [controller]);

  // Start quiz
  const startQuiz = useCallback(async (quizId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const newSession = await controller.startQuiz(quizId);
      setSession(newSession);
      setCurrentQuestionIndex(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start quiz";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [controller]);

  // Submit answer
  const submitAnswer = useCallback(async (questionId: string, answer: any): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      const evaluation = await controller.submitAnswer({
        questionId,
        answer,
        timeSpent: 0 // Would be tracked in component
      });

      // Refresh session state
      const updatedSession = controller.getActiveSession();
      if (updatedSession) {
        setSession(updatedSession);
      }

      return evaluation;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit answer";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [controller]);

  // Navigate to question
  const navigateToQuestion = useCallback((index: number): void => {
    controller.navigateToQuestion(index);
    setCurrentQuestionIndex(index);
    const updatedSession = controller.getActiveSession();
    if (updatedSession) {
      setSession(updatedSession);
    }
  }, [controller]);

  // Pause quiz
  const pauseQuiz = useCallback((): void => {
    controller.pauseQuiz();
    const updatedSession = controller.getActiveSession();
    if (updatedSession) {
      setSession(updatedSession);
    }
  }, [controller]);

  // Resume quiz
  const resumeQuiz = useCallback((): void => {
    controller.resumeQuiz();
    const updatedSession = controller.getActiveSession();
    if (updatedSession) {
      setSession(updatedSession);
    }
  }, [controller]);

  // Complete quiz
  const completeQuiz = useCallback(async (): Promise<QuizResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const quizResult = await controller.completeQuiz();
      setResult(quizResult);
      setSession(null);
      return quizResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to complete quiz";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [controller]);

  // Abandon quiz
  const abandonQuiz = useCallback((): void => {
    controller.abandonQuiz();
    setSession(null);
    setQuiz(null);
    setResult(null);
    setCurrentQuestionIndex(0);
  }, [controller]);

  // Computed values
  const canGoBack = currentQuestionIndex > 0;
  const canGoForward = session ? currentQuestionIndex < session.answers.size - 1 : false;
  const isLastQuestion = session ? currentQuestionIndex >= session.answers.size - 1 : false;

  return {
    isLoading,
    error,
    quiz,
    session,
    result,
    currentQuestion,
    progress,
    status,
    createQuiz,
    startQuiz,
    submitAnswer,
    navigateToQuestion,
    pauseQuiz,
    resumeQuiz,
    completeQuiz,
    abandonQuiz,
    canGoBack,
    canGoForward,
    isLastQuestion
  };
}

export default useQuiz;
