// @ts-nocheck
// Adaptive Quiz Engine — Quiz Store
// Zustand-like store for quiz state management

import type { Quiz, QuizAnswer } from "../models/Quiz";
import type { Question } from "../models/Question";
import type { SessionState } from "../models/QuizSession";
import type { QuizResult } from "../models/QuizResult";
import type { DifficultyLevel } from "../models/Question";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";

// State interfaces
export interface QuizState {
  // Current quiz
  currentQuiz: Quiz | null;
  currentSession: SessionState | null;
  currentResult: QuizResult | null;

  // Questions
  questions: Question[];
  currentQuestionIndex: number;

  // Answers
  answers: Map<string, QuizAnswer>;

  // User
  userId: string;

  // Difficulty
  difficultyProfile: UserDifficultyProfile | null;

  // UI State
  isLoading: boolean;
  error: string | null;
  status: QuizStatus;

  // Results history
  resultsHistory: QuizResult[];
}

export type QuizStatus =
  | "idle"
  | "loading"
  | "ready"
  | "in_progress"
  | "paused"
  | "submitting"
  | "completed"
  | "error";

// Actions
export interface QuizActions {
  // Quiz management
  setUserId: (userId: string) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setCurrentSession: (session: SessionState | null) => void;
  setCurrentResult: (result: QuizResult | null) => void;

  // Questions
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestionIndex: (index: number) => void;

  // Answers
  setAnswer: (questionId: string, answer: QuizAnswer) => void;
  clearAnswers: () => void;

  // Difficulty
  setDifficultyProfile: (profile: UserDifficultyProfile | null) => void;

  // UI
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setStatus: (status: QuizStatus) => void;

  // Results
  addResult: (result: QuizResult) => void;
  setResultsHistory: (results: QuizResult[]) => void;

  // Reset
  reset: () => void;
  resetSession: () => void;
}

// Store type
export type QuizStore = QuizState & QuizActions;

// Initial state
export const initialQuizState: QuizState = {
  currentQuiz: null,
  currentSession: null,
  currentResult: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: new Map(),
  userId: "",
  difficultyProfile: null,
  isLoading: false,
  error: null,
  status: "idle",
  resultsHistory: []
};

// Create store
type QuizStoreSetter = (partial: Partial<QuizState> | ((state: QuizState) => Partial<QuizState>)) => void;
type QuizStoreGetter = () => QuizState;

export function createQuizStore(): [QuizStoreGetter, QuizStoreSetter] {
  let state: QuizState = { ...initialQuizState, answers: new Map() };
  const listeners: Set<(state: QuizState) => void> = new Set();

  const getState = (): QuizState => state;

  const setState = (partial: Partial<QuizState> | ((state: QuizState) => Partial<QuizState>)): void => {
    const nextPartial = typeof partial === "function" ? partial(state) : partial;
    state = { ...state, ...nextPartial };
    listeners.forEach(listener => listener(state));
  };

  const actions: QuizActions = {
    setUserId: (userId) => setState({ userId }),

    setCurrentQuiz: (quiz) => setState({ currentQuiz: quiz }),

    setCurrentSession: (session) => setState({
      currentSession: session,
      status: session?.status === "paused" ? "paused" :
             session?.status === "in_progress" ? "in_progress" : state.status
    }),

    setCurrentResult: (result) => setState({ currentResult: result }),

    setQuestions: (questions) => setState({ questions }),

    setCurrentQuestionIndex: (index) => setState({ currentQuestionIndex: index }),

    setAnswer: (questionId, answer) => {
      const newAnswers = new Map(state.answers);
      newAnswers.set(questionId, answer);
      setState({ answers: newAnswers });
    },

    clearAnswers: () => setState({ answers: new Map() }),

    setDifficultyProfile: (profile) => setState({ difficultyProfile: profile }),

    setLoading: (isLoading) => setState({ isLoading }),

    setError: (error) => setState({ error, status: error ? "error" : state.status }),

    setStatus: (status) => setState({ status }),

    addResult: (result) => setState({
      resultsHistory: [result, ...state.resultsHistory],
      currentResult: result
    }),

    setResultsHistory: (results) => setState({ resultsHistory: results }),

    reset: () => {
      state = { ...initialQuizState, answers: new Map(), resultsHistory: state.resultsHistory };
      listeners.forEach(listener => listener(state));
    },

    resetSession: () => setState({
      currentQuiz: null,
      currentSession: null,
      currentResult: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      status: "idle",
      error: null
    })
  };

  const store: QuizStore = {
    ...state,
    ...actions
  } as QuizStore;

  return [
    () => {
      // Return current state snapshot for listeners
      const currentState = state;
      return currentState;
    },
    setState
  ];
}

// Selector helpers
export const selectCurrentQuestion = (state: QuizState): Question | null => {
  return state.questions[state.currentQuestionIndex] || null;
};

export const selectProgress = (state: QuizState): {
  current: number;
  total: number;
  answered: number;
  percentage: number;
} => {
  const total = state.questions.length;
  const answered = Array.from(state.answers.values()).filter(a => !a.status.includes("skip")).length;
  const percentage = total > 0 ? (answered / total) * 100 : 0;

  return {
    current: state.currentQuestionIndex + 1,
    total,
    answered,
    percentage
  };
};

export const selectCanNavigate = (state: QuizState): {
  canGoBack: boolean;
  canGoForward: boolean;
  isFirst: boolean;
  isLast: boolean;
} => {
  const total = state.questions.length;
  const current = state.currentQuestionIndex;

  return {
    canGoBack: current > 0,
    canGoForward: current < total - 1,
    isFirst: current === 0,
    isLast: current === total - 1
  };
};

export const selectCurrentDifficulty = (state: QuizState): DifficultyLevel => {
  return state.difficultyProfile?.currentLevel || "medium";
};

// Create singleton store
let quizStoreInstance: ReturnType<typeof createQuizStore> | null = null;

export function getQuizStore(): ReturnType<typeof createQuizStore> {
  if (!quizStoreInstance) {
    quizStoreInstance = createQuizStore();
  }
  return quizStoreInstance;
}

// React hook helper
export function useQuizStore(): QuizStore {
  const [getState, setState] = getQuizStore();

  // In a real React app, this would use useSyncExternalStore
  // For now, return a proxy that always gets fresh state
  return new Proxy({} as QuizStore, {
    get: (_, prop) => {
      const state = getState();
      if (prop in state) {
        if (typeof (state as any)[prop] === "function") {
          return (state as any)[prop].bind(state);
        }
        return (state as any)[prop];
      }
      return undefined;
    }
  });
}

export default getQuizStore;
