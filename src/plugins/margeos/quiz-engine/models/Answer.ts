// Adaptive Quiz Engine — Answer Model
// Answer submission and evaluation data structures

import type { Question, QuestionType, Option } from "./Question";

export type AnswerStatus = "unanswered" | "answered" | "skipped" | "flagged" | "reviewed";

export interface AnswerEvaluation {
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  score: number;
  maxScore: number;
  partialCredit?: number;
  feedback?: AnswerFeedback;
  corrections?: AnswerCorrection[];
  metadata: AnswerEvaluationMetadata;
}

export interface AnswerFeedback {
  summary: string;
  correctAnswer: string | string[] | number | boolean;
  explanation?: string;
  stepByStepSolution?: string[];
  hints?: string[];
  commonMistakes?: string[];
  relatedConcepts?: string[];
  learningResources?: LearningResource[];
}

export interface LearningResource {
  id: string;
  type: "pdf" | "video" | "article" | "tutor" | "formula" | "flashcard";
  title: string;
  url?: string;
  contentId?: string;
  estimatedTime?: number;
}

export interface AnswerCorrection {
  expected: string;
  received: string;
  explanation: string;
  severity: "minor" | "major" | "critical";
}

export interface AnswerEvaluationMetadata {
  evaluationTime: number;
  algorithm: "exact_match" | "partial_match" | "keyword" | "semantic" | "formula" | "rubric";
  confidence: number;
  processingSteps: string[];
}

export interface Answer {
  id: string;
  questionId: string;
  sessionId: string;
  userId: string;
  content: AnswerContent;
  status: AnswerStatus;
  submittedAt: Date;
  evaluation?: AnswerEvaluation;
  timeSpent: number;
  attempts: number;
  metadata: AnswerMetadata;
}

export interface AnswerContent {
  type: QuestionType;
  text?: string;
  selectedOptions?: string[];
  booleanValue?: boolean;
  sequence?: string[];
  matches?: Array<{ leftId: string; rightId: string }>;
  numericalValue?: number;
  formulaResult?: string;
  diagramSelections?: string[];
  codeSnippet?: string;
}

export interface AnswerMetadata {
  device: string;
  location?: string;
  attemptNumber: number;
  hintsUsed: number;
  timeOnHints: number;
  calculatorUsed: boolean;
  formulaSheetUsed: boolean;
  browserInfo?: string;
}

export interface AnswerValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: AnswerContent;
}

export interface AnswerPattern {
  answerId: string;
  questionId: string;
  userId: string;
  pattern: string;
  confidence: number;
  detectedAt: Date;
}

export interface PartialCreditRule {
  id: string;
  description: string;
  condition: PartialCreditCondition;
  pointsAwarded: number;
  maxPoints: number;
}

export interface PartialCreditCondition {
  type: "contains_keyword" | "partial_match" | "close_numerical" | "wrong_order" | "missing_element";
  parameters: Record<string, any>;
}

export interface RubricCriterion {
  id: string;
  description: string;
  maxPoints: number;
  indicators: RubricIndicator[];
}

export interface RubricIndicator {
  level: number;
  description: string;
  points: number;
  example?: string;
}

export interface LongAnswerRubric {
  criteria: RubricCriterion[];
  totalPoints: number;
  passingPoints: number;
}

export interface ShortAnswerEvaluationOptions {
  caseSensitive: boolean;
  trimWhitespace: boolean;
  ignorePunctuation: boolean;
  acceptSynonyms: boolean;
  keywordWeight: number;
  partialMatchThreshold: number;
}

export interface NumericalEvaluationOptions {
  tolerance: number;
  toleranceType: "absolute" | "relative" | "significant_figures";
  significantFigures?: number;
  acceptUnitVariants: boolean;
  unitConversion?: boolean;
}

export interface MatchingEvaluationOptions {
  ordered: boolean;
  partialCredit: boolean;
  creditPerMatch: number;
}

export interface SequenceEvaluationOptions {
  partialCredit: boolean;
  creditPerAdjacentSwap: number;
  allowPartialPosition: boolean;
}

export interface EvaluationContext {
  question: Question;
  userAnswer: AnswerContent;
  options?: ShortAnswerEvaluationOptions | NumericalEvaluationOptions | MatchingEvaluationOptions | SequenceEvaluationOptions;
  rubric?: LongAnswerRubric;
  previousAnswers?: Answer[];
  userProfile?: {
    nativeLanguage?: string;
    educationLevel?: string;
    accessibilityNeeds?: string[];
  };
}

export function createAnswer(params: {
  questionId: string;
  sessionId: string;
  userId: string;
  content: AnswerContent;
  timeSpent: number;
}): Answer {
  const id = `ans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    questionId: params.questionId,
    sessionId: params.sessionId,
    userId: params.userId,
    content: params.content,
    status: "answered",
    submittedAt: new Date(),
    timeSpent: params.timeSpent,
    attempts: 1,
    metadata: {
      device: "web",
      attemptNumber: 1,
      hintsUsed: 0,
      timeOnHints: 0,
      calculatorUsed: false,
      formulaSheetUsed: false
    }
  };
}

export function validateAnswerContent(
  content: AnswerContent,
  questionType: QuestionType
): AnswerValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (questionType) {
    case "mcq":
      if (!content.selectedOptions || content.selectedOptions.length === 0) {
        errors.push("No option selected");
      }
      break;

    case "true_false":
      if (content.booleanValue === undefined) {
        errors.push("No true/false selection");
      }
      break;

    case "short_answer":
      if (!content.text || content.text.trim().length === 0) {
        errors.push("No answer text provided");
      }
      break;

    case "long_answer":
      if (!content.text || content.text.trim().length < 10) {
        warnings.push("Answer seems too short");
      }
      break;

    case "numerical":
      if (content.numericalValue === undefined || isNaN(content.numericalValue)) {
        errors.push("No numerical value provided");
      }
      break;

    case "matching":
      if (!content.matches || content.matches.length === 0) {
        errors.push("No matches provided");
      }
      break;

    case "sequencing":
      if (!content.sequence || content.sequence.length === 0) {
        errors.push("No sequence provided");
      }
      break;

    case "scenario":
      if (!content.text || content.text.trim().length === 0) {
        warnings.push("No scenario response provided");
      }
      break;
  }

  const sanitized: AnswerContent = { ...content };
  if (sanitized.text) {
    sanitized.text = sanitized.text.trim();
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedContent: sanitized
  };
}

export function calculatePartialCredit(
  correctCount: number,
  totalCount: number,
  creditPerMatch: number
): number {
  if (totalCount === 0) return 0;
  return (correctCount / totalCount) * creditPerMatch * totalCount;
}

export function evaluateSequenceDistance(
  submitted: string[],
  correct: string[]
): { distance: number; maxDistance: number; partialCredit: number } {
  if (submitted.length !== correct.length) {
    return { distance: Infinity, maxDistance: 0, partialCredit: 0 };
  }

  let distance = 0;
  for (let i = 0; i < submitted.length; i++) {
    if (submitted[i] !== correct[i]) {
      distance++;
    }
  }

  const maxDistance = submitted.length;
  const partialCredit = Math.max(0, (maxDistance - distance) / maxDistance);

  return { distance, maxDistance, partialCredit };
}
