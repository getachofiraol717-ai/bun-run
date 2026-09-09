import type { SubjectType } from "./SubjectType";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type LessonCardType =
  | "explanation"
  | "code"
  | "formula"
  | "diagram"
  | "timeline"
  | "summary"
  | "practice"
  | "quiz"
  | "flashcard"
  | "reference"
  | "mistakes"
  | "tips"
  | "challenge"
  | "next"
  | "progress";

export interface LessonCardBase {
  id: string;
  type: LessonCardType;
  title?: string;
}

export interface ExplanationCardData extends LessonCardBase {
  type: "explanation";
  body: string;
}
export interface CodeCardData extends LessonCardBase {
  type: "code";
  language: string;
  code: string;
  explanation?: string;
}
export interface FormulaCardData extends LessonCardBase {
  type: "formula";
  latex: string;
  explanation?: string;
}
export interface DiagramCardData extends LessonCardBase {
  type: "diagram";
  description: string;
  ascii?: string;
}
export interface TimelineCardData extends LessonCardBase {
  type: "timeline";
  events: { when: string; what: string }[];
}
export interface SummaryCardData extends LessonCardBase {
  type: "summary";
  bullets: string[];
}
export interface PracticeCardData extends LessonCardBase {
  type: "practice";
  prompt: string;
  hint?: string;
  answer?: string;
}
export interface QuizCardData extends LessonCardBase {
  type: "quiz";
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}
export interface FlashcardCardData extends LessonCardBase {
  type: "flashcard";
  front: string;
  back: string;
}
export interface ReferenceCardData extends LessonCardBase {
  type: "reference";
  source: string;
  quote?: string;
  url?: string;
}
export interface MistakesCardData extends LessonCardBase {
  type: "mistakes";
  items: string[];
}
export interface TipsCardData extends LessonCardBase {
  type: "tips";
  items: string[];
}
export interface ChallengeCardData extends LessonCardBase {
  type: "challenge";
  prompt: string;
}
export interface NextCardData extends LessonCardBase {
  type: "next";
  topics: string[];
}
export interface ProgressCardData extends LessonCardBase {
  type: "progress";
  percent: number;
  note?: string;
}

export type LessonCard =
  | ExplanationCardData
  | CodeCardData
  | FormulaCardData
  | DiagramCardData
  | TimelineCardData
  | SummaryCardData
  | PracticeCardData
  | QuizCardData
  | FlashcardCardData
  | ReferenceCardData
  | MistakesCardData
  | TipsCardData
  | ChallengeCardData
  | NextCardData
  | ProgressCardData;

export interface Lesson {
  id: string;
  subject: SubjectType;
  difficulty: Difficulty;
  title: string;
  cards: LessonCard[];
  createdAt: number;
}
