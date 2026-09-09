// @ts-nocheck
// AI Exam Simulator — Exam Model
// Exam configuration and structure

import type { QuestionType, DifficultyLevel, Question } from "../models/Question";

export type ExamMode =
  | "practice"        // Practice exam
  | "chapter"         // Chapter exam
  | "subject"         // Subject exam
  | "comprehensive"   // Comprehensive final
  | "custom"          // Custom exam
  | "revision"        // Revision exam
  | "adaptive";       // Adaptive exam

export type ExamStatus = "draft" | "ready" | "in_progress" | "paused" | "completed" | "submitted" | "graded" | "archived";

export type ExamDifficulty = "beginner" | "intermediate" | "advanced" | "expert";

export interface ExamConfig {
  title: string;
  description: string;
  mode: ExamMode;
  subject: string;
  topics: string[];
  chapters?: string[];
  settings: ExamSettings;
  rules: ExamRules;
  accessibility: ExamAccessibility;
  integration: ExamIntegration;
}

export interface ExamSettings {
  totalQuestions: number;
  totalTime: number; // in minutes, 0 = no limit
  perQuestionTimeLimit?: number; // in seconds
  passingScore: number; // percentage 0-100
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showProgressBar: boolean;
  showTimer: boolean;
  showCalculator: boolean;
  showFormulaSheet: boolean;
  allowBackNavigation: boolean;
  allowPause: boolean;
  maxPauseTime?: number;
  showResultsImmediately: boolean;
  showExplanations: boolean;
  showCorrectAnswers: boolean;
  randomSeed?: string;
}

export interface ExamRules {
  attempts: number;
  cooldownPeriod?: number; // hours
  autoSubmit: boolean;
  warningBeforeSubmit: boolean;
  warningTime?: number; // seconds before auto-submit
  negativeMarking: boolean;
  negativeMarkingValue?: number;
  partialCredit: boolean;
  showHints: boolean;
  allowFlagging: boolean;
  allowBookmarks: boolean;
}

export interface ExamAccessibility {
  screenReaderSupport: boolean;
  voiceExam: boolean;
  keyboardNavigation: boolean;
  highContrastMode: boolean;
  largeText: boolean;
  extraTime?: number; // percentage
  reducedDistractions: boolean;
  brailleCompatible: boolean;
}

export interface ExamIntegration {
  sourceTopics?: string[];
  sourceChapters?: string[];
  linkedLessons?: string[];
  linkedQuizIds?: string[];
  knowledgeGalaxyIds?: string[];
  prerequisiteExamId?: string;
  nextExamId?: string;
  skillIds?: string[];
}

export interface ExamMetadata {
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
  estimatedDuration: number; // in minutes
  difficulty: ExamDifficulty;
}

export interface Exam {
  id: string;
  config: ExamConfig;
  metadata: ExamMetadata;
  questionIds: string[];
  questionOrder?: string[];
  weightByTopic?: Record<string, number>;
  weightByType?: Record<QuestionType, number>;
  weightByDifficulty?: Record<DifficultyLevel, number>;
  estimatedScore?: {
    min: number;
    max: number;
    average?: number;
  };
}

export interface ExamFilter {
  mode?: ExamMode[];
  subject?: string[];
  difficulty?: ExamDifficulty[];
  status?: ExamStatus[];
  tags?: string[];
  creator?: ExamMetadata["creator"][];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  mode: ExamMode;
  config: Partial<ExamConfig>;
  settings: Partial<ExamSettings>;
  rules: Partial<ExamRules>;
  recommendedFor: string[];
  estimatedTime: number;
}

export interface ExamGenerationRequest {
  title: string;
  mode: ExamMode;
  subject: string;
  topics: string[];
  difficulty: ExamDifficulty;
  questionCount: number;
  questionTypes?: QuestionType[];
  userId: string;
  settings?: Partial<ExamSettings>;
  rules?: Partial<ExamRules>;
  linkedContent?: ExamIntegration;
}

export function createExam(params: {
  config: ExamConfig;
  metadata: Partial<ExamMetadata>;
  questionIds?: string[];
}): Exam {
  const id = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const defaultMetadata: ExamMetadata = {
    creator: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    language: "en",
    isAdaptive: params.config.settings ? true : false,
    isPublic: false,
    tags: [],
    estimatedDuration: params.config.settings.totalTime || 30,
    difficulty: "intermediate"
  };

  return {
    id,
    config: params.config,
    metadata: { ...defaultMetadata, ...params.metadata },
    questionIds: params.questionIds || [],
    questionOrder: params.questionIds || []
  };
}

export const DEFAULT_EXAM_SETTINGS: ExamSettings = {
  totalQuestions: 25,
  totalTime: 60,
  passingScore: 60,
  shuffleQuestions: true,
  shuffleOptions: true,
  showProgressBar: true,
  showTimer: true,
  showCalculator: false,
  showFormulaSheet: false,
  allowBackNavigation: true,
  allowPause: false,
  showResultsImmediately: true,
  showExplanations: true,
  showCorrectAnswers: true
};

export const DEFAULT_EXAM_RULES: ExamRules = {
  attempts: 3,
  autoSubmit: true,
  warningBeforeSubmit: true,
  warningTime: 120,
  negativeMarking: false,
  partialCredit: true,
  showHints: true,
  allowFlagging: true,
  allowBookmarks: true
};

export const DEFAULT_EXAM_ACCESSIBILITY: ExamAccessibility = {
  screenReaderSupport: true,
  voiceExam: false,
  keyboardNavigation: true,
  highContrastMode: false,
  largeText: false,
  reducedDistractions: false,
  brailleCompatible: false
};

export const EXAM_MODE_DESCRIPTIONS: Record<ExamMode, string> = {
  practice: "Practice exam to reinforce learning without time pressure",
  chapter: "Focused exam covering specific chapter content",
  subject: "Comprehensive exam covering entire subject",
  comprehensive: "Final exam covering multiple chapters and topics",
  custom: "Custom exam tailored to specific requirements",
  revision: "Revision exam focusing on weak areas",
  adaptive: "Dynamically adjusted exam based on performance"
};

export const EXAM_DIFFICULTY_LABELS: Record<ExamDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert"
};
