// @ts-nocheck
// Adaptive Quiz Engine — Quiz Model
// Main quiz configuration and structure

import type { Question, QuestionFilter, DifficultyLevel } from "./Question";
import type { QuizSession } from "./QuizSession";

export type QuizType =
  | "practice"       // Practice quiz for learning
  | "assessment"     // Formal assessment
  | "diagnostic"     // Diagnostic quiz to identify gaps
  | "review"         // Review of previously learned content
  | "exam"           // Exam simulation
  | "challenge";     // Challenge/competition quiz

export type QuizStatus = "draft" | "ready" | "in_progress" | "completed" | "graded" | "archived";

export interface QuizConfig {
  title: string;
  description?: string;
  type: QuizType;
  subject: string;
  topics: string[];
  settings: QuizSettings;
  rules: QuizRules;
  accessibility: QuizAccessibility;
  integration: QuizIntegration;
}

export interface QuizSettings {
  questionCount: number;
  timeLimit?: number; // total quiz time in seconds
  perQuestionTimeLimit?: number; // time per question in seconds
  passingScore: number; // percentage 0-100
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowBackNavigation: boolean;
  showProgressBar: boolean;
  showTimer: boolean;
  showScoreAfter: boolean;
  allowPause: boolean;
  maxPauseTime?: number;
  randomSeed?: string;
}

export interface QuizRules {
  attempts: number;
  cooldownPeriod?: number; // in hours
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  showHints: boolean;
  allowCalculator: boolean;
  allowFormulaSheet: boolean;
  allowExternalResources: boolean;
  penalizeWrongAnswers: boolean;
  negativeMarking?: number; // points to deduct per wrong answer
  partialCredit: boolean;
}

export interface QuizAccessibility {
  screenReaderSupport: boolean;
  voiceQuiz: boolean;
  keyboardNavigation: boolean;
  highContrastMode: boolean;
  largeText: boolean;
  brailleCompatible: boolean;
  extraTimeMultiplier?: number;
  reducedDistractions: boolean;
}

export interface QuizIntegration {
  sourceContent?: string; // PDF, Tutor, etc.
  sourceIds?: string[];
  linkedLessonIds?: string[];
  linkedChapterIds?: string[];
  prerequisiteQuizId?: string;
  nextQuizId?: string;
  skillIds?: string[];
  learningPathId?: string;
}

export interface QuizMetadata {
  creator: "teacher" | "student" | "system" | "ai";
  creatorId?: string;
  courseId?: string;
  classId?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  version: number;
  language: string;
  isAdaptive: boolean;
  isPublic: boolean;
  tags: string[];
}

export interface Quiz {
  id: string;
  config: QuizConfig;
  metadata: QuizMetadata;
  filter?: QuestionFilter;
  difficultyRange?: {
    min: DifficultyLevel;
    max: DifficultyLevel;
  };
  questionIds: string[];
  questionOrder?: string[];
  weightByTopic?: Record<string, number>;
  weightByDifficulty?: Record<DifficultyLevel, number>;
  questionCount?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  session: QuizSession;
  startedAt: Date;
  completedAt?: Date;
  answers: Map<string, QuizAnswer>;
  score?: number;
  percentage?: number;
  passed?: boolean;
  timeSpent?: number;
  difficultyHistory: DifficultyLevel[];
  metadata: {
    device: string;
    browser: string;
    platform: string;
    userAgent: string;
  };
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[] | number | boolean;
  answeredAt: Date;
  timeSpent: number;
  isCorrect?: boolean;
  partialCredit?: number;
  flagged?: boolean;
  notes?: string;
}

export interface QuizFilter {
  type?: QuizType[];
  subject?: string[];
  status?: QuizStatus[];
  creator?: QuizMetadata["creator"][];
  isAdaptive?: boolean;
  isPublic?: boolean;
  tags?: string[];
  courseId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface QuizGenerationRequest {
  title: string;
  type: QuizType;
  subject: string;
  topics: string[];
  difficulty: DifficultyLevel | DifficultyLevel[];
  questionCount: number;
  questionTypes?: Question["type"][];
  userId: string;
  settings?: Partial<QuizSettings>;
  rules?: Partial<QuizRules>;
  linkedContent?: QuizIntegration;
  existingQuestionIds?: string[];
}

export interface QuizTemplate {
  id: string;
  name: string;
  description: string;
  type: QuizType;
  config: Partial<QuizConfig>;
  settings: Partial<QuizSettings>;
  rules: Partial<QuizRules>;
  difficultyRange?: {
    min: DifficultyLevel;
    max: DifficultyLevel;
  };
  questionCountRange: {
    min: number;
    max: number;
  };
  isBuiltIn: boolean;
}

export function createQuiz(params: {
  config: QuizConfig;
  metadata: Partial<QuizMetadata>;
  questionIds?: string[];
  filter?: QuestionFilter;
}): Quiz {
  const id = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const defaultMetadata: QuizMetadata = {
    creator: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    language: "en",
    isAdaptive: params.config.settings ? true : false,
    isPublic: false,
    tags: [],
    ...params.metadata
  };

  return {
    id,
    config: params.config,
    metadata: defaultMetadata,
    filter: params.filter,
    questionIds: params.questionIds || [],
    questionOrder: params.questionIds || []
  };
}

export function createQuizTemplate(params: {
  name: string;
  type: QuizType;
  config?: Partial<QuizConfig>;
  settings: Partial<QuizSettings>;
  rules: Partial<QuizRules>;
  questionCountRange: { min: number; max: number };
  isBuiltIn?: boolean;
}): QuizTemplate {
  return {
    id: `template_${Date.now()}`,
    name: params.name,
    description: `Template for ${params.type} quizzes`,
    type: params.type,
    config: params.config || {},
    settings: params.settings,
    rules: params.rules,
    questionCountRange: params.questionCountRange,
    isBuiltIn: params.isBuiltIn || false
  };
}

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
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

export const DEFAULT_QUIZ_RULES: QuizRules = {
  attempts: 3,
  showCorrectAnswers: true,
  showExplanations: true,
  showHints: true,
  allowCalculator: false,
  allowFormulaSheet: false,
  allowExternalResources: false,
  penalizeWrongAnswers: false,
  partialCredit: true
};

export const DEFAULT_QUIZ_ACCESSIBILITY: QuizAccessibility = {
  screenReaderSupport: true,
  voiceQuiz: false,
  keyboardNavigation: true,
  highContrastMode: false,
  largeText: false,
  brailleCompatible: false,
  reducedDistractions: false
};

export const BUILT_IN_TEMPLATES: QuizTemplate[] = [
  createQuizTemplate({
    name: "Quick Practice",
    type: "practice",
    settings: { ...DEFAULT_QUIZ_SETTINGS, questionCount: 5, shuffleQuestions: true },
    rules: DEFAULT_QUIZ_RULES,
    questionCountRange: { min: 3, max: 10 },
    isBuiltIn: true
  }),
  createQuizTemplate({
    name: "Chapter Assessment",
    type: "assessment",
    settings: { ...DEFAULT_QUIZ_SETTINGS, questionCount: 20, timeLimit: 1800 },
    rules: { ...DEFAULT_QUIZ_RULES, attempts: 1 },
    questionCountRange: { min: 10, max: 50 },
    isBuiltIn: true
  }),
  createQuizTemplate({
    name: "Diagnostic Quiz",
    type: "diagnostic",
    settings: { ...DEFAULT_QUIZ_SETTINGS, questionCount: 15, showExplanations: false },
    rules: { ...DEFAULT_QUIZ_RULES, attempts: 1, showCorrectAnswers: false },
    questionCountRange: { min: 10, max: 30 },
    isBuiltIn: true
  }),
  createQuizTemplate({
    name: "Challenge Mode",
    type: "challenge",
    settings: { ...DEFAULT_QUIZ_SETTINGS, questionCount: 10, perQuestionTimeLimit: 30 },
    rules: { ...DEFAULT_QUIZ_RULES, penalizeWrongAnswers: true, negativeMarking: 0.25 },
    questionCountRange: { min: 5, max: 20 },
    isBuiltIn: true
  })
];
