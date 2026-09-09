// @ts-nocheck
// Adaptive Quiz Engine — Question Model
// Core question data structure for all question types

export type QuestionType =
  | "mcq"           // Multiple Choice Question
  | "true_false"    // True/False
  | "short_answer"  // Short Answer
  | "long_answer"  // Long Answer/Essay
  | "numerical"     // Numerical Calculation
  | "formula"       // Formula-based Question
  | "diagram"       // Diagram-based Question
  | "matching"      // Matching Question
  | "sequencing"    // Sequencing/Ordering Question
  | "scenario";     // Scenario-based Question

export type DifficultyLevel = "easy" | "medium" | "hard" | "expert";

export type CognitiveLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";

export interface Option {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface DiagramData {
  imageUrl?: string;
  svgData?: string;
  hotspots?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  }>;
  labels?: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
  }>;
}

export interface FormulaQuestion {
  formula: string;
  variables: Array<{
    symbol: string;
    name: string;
    value: string;
    unit?: string;
  }>;
  solveFor?: string;
  expectedAnswer: string | number;
  tolerance?: number;
  steps?: string[];
}

export interface MatchingPair {
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
  isCorrect: boolean;
}

export interface SequenceItem {
  id: string;
  text: string;
  correctPosition: number;
}

export interface ScenarioData {
  context: string;
  situation: string;
  characters?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  setting?: string;
}

export interface QuestionMetadata {
  source: "pdf" | "tutor" | "formula" | "reference" | "visual" | "knowledge_galaxy" | "manual" | "ai_generated";
  sourceId?: string;
  chapterId?: string;
  lessonId?: string;
  subject: string;
  topic: string;
  subtopic?: string;
  tags: string[];
  bloomLevel?: CognitiveLevel;
  estimatedTime: number; // in seconds
  points: number;
  language?: string;
}

export interface QuestionStatistics {
  totalAttempts: number;
  correctAttempts: number;
  averageTime: number;
  lastAttempted?: Date;
  difficultyHistory: DifficultyLevel[];
  commonMistakes: string[];
  successRate: number;
}

export interface PartialCredit {
  enabled: boolean;
  partialPoints?: number;
  acceptableAnswers?: string[];
}

export interface Question {
  id: string;
  type: QuestionType;
  content: QuestionContent;
  options?: Option[];
  correctAnswer?: string | string[] | number | boolean;
  correctSequence?: string[];
  correctMatches?: MatchingPair[];
  diagram?: DiagramData;
  formulaData?: FormulaQuestion;
  matchingPairs?: MatchingPair[];
  sequenceItems?: SequenceItem[];
  scenario?: ScenarioData;
  metadata: QuestionMetadata;
  hints: string[];
  explanation?: {
    correct: string;
    steps?: string[];
    reasoning?: string;
    commonMistakes?: string[];
    relatedConcepts?: string[];
  };
  partialCredit?: PartialCredit;
  settings: QuestionSettings;
  statistics?: QuestionStatistics;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionContent {
  text: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  codeSnippet?: string;
  tableData?: Array<Array<string>>;
}

export interface QuestionSettings {
  timeLimit?: number; // in seconds, 0 = no limit
  maxAttempts?: number;
  showFeedback: boolean;
  showHints: boolean;
  allowSkip: boolean;
  allowCalculator?: boolean;
  allowFormulaSheet?: boolean;
  randomizeOptions?: boolean;
  caseSensitive?: boolean; // for text answers
  orderedMatching?: boolean; // for matching questions
}

export interface QuestionFilter {
  types?: QuestionType[];
  difficulty?: DifficultyLevel[];
  subjects?: string[];
  topics?: string[];
  source?: QuestionMetadata["source"][];
  tags?: string[];
  minSuccessRate?: number;
  maxSuccessRate?: number;
  chapterId?: string;
  lessonId?: string;
}

export interface QuestionGenerationRequest {
  source: QuestionMetadata["source"];
  sourceId?: string;
  subject: string;
  topic: string;
  difficulty: DifficultyLevel;
  count: number;
  types?: QuestionType[];
  excludeIds?: string[];
  cognitiveLevel?: CognitiveLevel;
  metadata?: Partial<QuestionMetadata>;
}

export interface QuestionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function createQuestion(params: {
  type: QuestionType;
  content: QuestionContent;
  metadata: QuestionMetadata;
  options?: Option[];
  correctAnswer?: string | string[] | number | boolean;
  settings?: Partial<QuestionSettings>;
}): Question {
  const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    type: params.type,
    content: params.content,
    options: params.options,
    correctAnswer: params.correctAnswer,
    metadata: params.metadata,
    hints: [],
    settings: {
      showFeedback: true,
      showHints: true,
      allowSkip: true,
      randomizeOptions: params.type === "mcq",
      ...params.settings
    },
    statistics: {
      totalAttempts: 0,
      correctAttempts: 0,
      averageTime: 0,
      difficultyHistory: [params.metadata.difficulty || "medium"],
      commonMistakes: [],
      successRate: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function validateQuestion(question: Question): QuestionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!question.content.text && !question.content.imageUrl) {
    errors.push("Question must have text or image content");
  }

  if (question.type === "mcq") {
    if (!question.options || question.options.length < 2) {
      errors.push("MCQ must have at least 2 options");
    }
    const correctOptions = question.options?.filter(o => o.isCorrect) || [];
    if (correctOptions.length === 0) {
      errors.push("MCQ must have at least one correct option");
    }
    if (correctOptions.length > 1 && !question.partialCredit?.enabled) {
      warnings.push("MCQ has multiple correct options - consider enabling partial credit");
    }
  }

  if (question.type === "numerical" || question.type === "formula") {
    if (question.correctAnswer === undefined || question.correctAnswer === null) {
      errors.push("Numerical/formula questions must have a correct answer");
    }
    if (!question.formulaData) {
      warnings.push("Formula questions should include formula data for better assessment");
    }
  }

  if (!question.metadata.subject || !question.metadata.topic) {
    errors.push("Question must have subject and topic");
  }

  if (!question.metadata.difficulty) {
    warnings.push("Question difficulty not specified");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
