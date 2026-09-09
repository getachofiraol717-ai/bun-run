// @ts-nocheck
// Adaptive Quiz Engine — Main Index
// Export all public APIs

// Core Engines
export * from "./core";

// Models
export * from "./models";

// Services
export * from "./services";

// Hooks
export * from "./hooks";

// Interfaces
export * from "./interfaces";

// Utils
export * from "./utils";

// Store
export { getQuizStore, useQuizStore } from "./store/quizStore";
export type { QuizStore, QuizState, QuizActions } from "./store/quizStore";

// Version info
export const QUIZ_ENGINE_VERSION = "1.0.0";
export const QUIZ_ENGINE_NAME = "Adaptive Quiz Engine";

// Default configuration
export const DEFAULT_QUIZ_SETTINGS = {
  questionCount: 10,
  timeLimit: 0,
  passingScore: 70,
  shuffleQuestions: false,
  shuffleOptions: true,
  allowBackNavigation: true,
  showProgressBar: true,
  showTimer: true,
  showScoreAfter: true,
  allowPause: false
};

export const DEFAULT_QUIZ_RULES = {
  attempts: 3,
  showCorrectAnswers: true,
  showExplanations: true,
  showHints: true,
  allowCalculator: false,
  allowFormulaSheet: false,
  penalizeWrongAnswers: false,
  partialCredit: true
};

// Singleton accessors
let quizControllerInstance: QuizController | null = null;

export function getQuizController(): QuizController {
  if (!quizControllerInstance) {
    quizControllerInstance = QuizController.getInstance();
  }
  return quizControllerInstance;
}

export function initializeQuizEngine(config?: {
  userId: string;
  adaptiveEnabled?: boolean;
}): QuizController {
  const controller = getQuizController();
  if (config?.userId) {
    controller.setUserId(config.userId);
  }
  return controller;
}

export function destroyQuizEngine(): void {
  if (quizControllerInstance) {
    quizControllerInstance.destroy();
    quizControllerInstance = null;
  }
}
