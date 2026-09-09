// @ts-nocheck
// AI Exam Simulator — ExamQuestion Model
// Question data for exams

import type { QuestionType, DifficultyLevel, Option } from "../models/Question";

export interface ExamQuestion {
  id: string;
  examId: string;
  type: QuestionType;
  content: ExamQuestionContent;
  options?: ExamOption[];
  correctAnswer?: ExamCorrectAnswer;
  solution?: ExamSolution;
  metadata: ExamQuestionMetadata;
  hints: string[];
  settings: ExamQuestionSettings;
  position: number;
  weight: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamQuestionContent {
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  codeSnippet?: string;
  tableData?: string[][];
  diagramData?: DiagramData;
}

export interface DiagramData {
  type: "chart" | "graph" | "diagram" | "image" | "flowchart";
  data?: any;
  imageUrl?: string;
  description?: string;
}

export interface ExamOption {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
  explanation?: string;
}

export type ExamCorrectAnswer =
  | string                    // For short answer
  | boolean                    // For true/false
  | number                     // For numerical
  | string[]                   // For multiple choice, matching, sequencing
  | Record<string, string>;    // For matching {leftId: rightId}

export interface ExamSolution {
  correctAnswer: string;
  explanation: string;
  stepByStep?: StepSolution[];
  commonMistakes?: CommonMistake[];
  relatedConcepts?: RelatedConcept[];
  references?: SolutionReference[];
}

export interface StepSolution {
  step: number;
  description: string;
  formula?: string;
  calculation?: string;
  result?: string;
}

export interface CommonMistake {
  mistake: string;
  explanation: string;
  correction?: string;
}

export interface RelatedConcept {
  conceptId: string;
  conceptName: string;
  url?: string;
  type: "lesson" | "formula" | "reference" | "visual" | "flashcard";
}

export interface SolutionReference {
  type: "pdf" | "tutor" | "formula" | "reference" | "visual" | "knowledge_galaxy";
  id: string;
  title: string;
  url?: string;
  description?: string;
}

export interface ExamQuestionMetadata {
  source: "pdf" | "tutor" | "formula" | "reference" | "visual" | "knowledge_galaxy" | "quiz" | "ai_generated" | "manual";
  sourceId?: string;
  subject: string;
  topic: string;
  chapter?: string;
  subtopic?: string;
  tags: string[];
  difficulty: DifficultyLevel;
  cognitiveLevel?: CognitiveLevel;
  estimatedTime: number;
  points: number;
  bloomLevel?: string;
  skills?: string[];
  prerequisites?: string[];
}

export type CognitiveLevel = "knowledge" | "comprehension" | "application" | "analysis" | "synthesis" | "evaluation";

export interface ExamQuestionSettings {
  required: boolean;
  allowPartialCredit: boolean;
  partialCreditRules?: PartialCreditRule[];
  showHintAfter?: number; // seconds
  autoGrade: boolean;
  manualGradingRequired: boolean;
}

export interface PartialCreditRule {
  condition: string;
  percentage: number;
}

export interface ExamQuestionResponse {
  questionId: string;
  userId: string;
  examId: string;
  sessionId: string;
  answer: ExamAnswer;
  timeSpent: number;
  hintsUsed: number;
  flagged: boolean;
  bookmarked: boolean;
  answeredAt: Date;
  isCorrect?: boolean;
  score?: number;
  maxScore?: number;
  feedback?: string;
}

export type ExamAnswer =
  | string                    // For short answer, long answer, scenario
  | boolean                   // For true/false
  | number                    // For numerical
  | string[]                  // For multiple selection, sequencing
  | Record<string, string>;   // For matching

export interface ExamQuestionFilter {
  types?: QuestionType[];
  difficulty?: DifficultyLevel[];
  topics?: string[];
  subjects?: string[];
  chapters?: string[];
  tags?: string[];
  cognitiveLevels?: CognitiveLevel[];
  minPoints?: number;
  maxPoints?: number;
  source?: ExamQuestionMetadata["source"][];
}

export interface ExamQuestionStats {
  totalAttempts: number;
  correctAttempts: number;
  averageTime: number;
  averageScore: number;
  difficultyRating: number;
  successRate: number;
}

export function createExamQuestion(params: {
  examId: string;
  type: QuestionType;
  content: ExamQuestionContent;
  options?: ExamOption[];
  correctAnswer: ExamCorrectAnswer;
  metadata: ExamQuestionMetadata;
  position: number;
  solution?: ExamSolution;
}): ExamQuestion {
  const id = `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    examId: params.examId,
    type: params.type,
    content: params.content,
    options: params.options,
    correctAnswer: params.correctAnswer,
    solution: params.solution,
    metadata: params.metadata,
    hints: [],
    settings: {
      required: true,
      allowPartialCredit: true,
      autoGrade: params.type !== "long_answer" && params.type !== "essay",
      manualGradingRequired: params.type === "long_answer" || params.type === "essay"
    },
    position: params.position,
    weight: 1,
    points: params.metadata.points || 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export const QUESTION_TYPE_EXAM_SPECIFIC: Record<QuestionType, {
  name: string;
  icon: string;
  autoGradable: boolean;
  typicalPoints: number;
}> = {
  mcq: { name: "Multiple Choice", icon: "list-bullets", autoGradable: true, typicalPoints: 2 },
  true_false: { name: "True/False", icon: "check-circle", autoGradable: true, typicalPoints: 1 },
  short_answer: { name: "Short Answer", icon: "pencil", autoGradable: true, typicalPoints: 3 },
  long_answer: { name: "Long Answer", icon: "document-text", autoGradable: false, typicalPoints: 5 },
  numerical: { name: "Numerical", icon: "calculator", autoGradable: true, typicalPoints: 2 },
  formula: { name: "Formula", icon: "function", autoGradable: true, typicalPoints: 3 },
  diagram: { name: "Diagram", icon: "photograph", autoGradable: true, typicalPoints: 3 },
  matching: { name: "Matching", icon: "link", autoGradable: true, typicalPoints: 4 },
  sequencing: { name: "Sequencing", icon: "arrows-expand", autoGradable: true, typicalPoints: 3 },
  scenario: { name: "Scenario", icon: "compass", autoGradable: false, typicalPoints: 5 }
};
