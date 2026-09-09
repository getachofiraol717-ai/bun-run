// Canonical Quiz & Adaptive Mastery System Type Definitions
// Specification: KNOWLEDGE22VV

export type QuizSourceType =
  | 'AI_TUTOR'
  | 'LIBRARY_AI_TUTOR'
  | 'MARGEOS_AI_TUTOR'
  | 'TEACHER_CREATED'
  | 'STUDENT_CREATED'
  | 'REFERENCE_BOOK'
  | 'PDF'
  | 'CLASSROOM'
  | 'EXAM_SIMULATOR';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Advanced';

export interface ParameterVariable {
  name: string;
  type: 'number' | 'choice';
  min?: number;
  max?: number;
  step?: number;
  value?: number | string;
  options?: string[];
}

export interface QuestionTemplate {
  familyId: string; // e.g., 'MATH_LINEAR_EQUATION'
  pattern: string; // e.g., "Solve for x: {a}x + {b} = {c}"
  variables: Record<string, ParameterVariable>;
  constraints?: string[]; // e.g., ["(c - b) % a === 0", "a !== 0"]
  formula?: string; // JavaScript formula expression to derive correct answer
  explanationTemplate?: string;
  distractorRules?: string[];
}

export interface CanonicalQuestion {
  id: string;
  variantId: string;
  familyId: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  hint?: string;
  subject: string;
  topic: string;
  chapter?: string;
  grade?: number;
  difficulty: QuizDifficulty;
  learningObjective: string;
  template?: QuestionTemplate;
  variablesUsed?: Record<string, any>;
}

export interface QuizOriginMetadata {
  quizId: string;
  title: string;
  subject: string;
  topic: string;
  chapter?: string;
  sourceType: QuizSourceType;
  sourceDocumentId?: string;
  sourcePage?: number;
  createdBy: string;
  createdAt: string;
  difficulty: QuizDifficulty;
  questionCount: number;
  estimatedMinutes: number;
  learningObjectives: string[];
  status: 'active' | 'completed' | 'draft';
}

export interface CanonicalQuiz extends QuizOriginMetadata {
  questions: CanonicalQuestion[];
}

export type ErrorClassificationType =
  | 'CALCULATION_ERROR'
  | 'CONCEPT_MISUNDERSTANDING'
  | 'FORMULA_REVERSAL'
  | 'MISREAD_QUESTION'
  | 'RANDOM_GUESS'
  | 'NONE';

export interface QuestionAttempt {
  questionId: string;
  variantId: string;
  familyId?: string;
  learningObjective?: string;
  questionText?: string;
  selectedOptionIndex?: number;
  selectedOption?: number;
  correctOptionIndex?: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  errorClassification?: ErrorClassificationType;
  retryCount?: number;
  timestamp?: string;
}

export interface QuizAttemptRecord {
  attemptId: string;
  quizId: string;
  attemptNumber?: number;
  timestamp?: string;
  score?: number;
  total?: number;
  percentage?: number;
  passed: boolean;
  timeSpentTotalSeconds?: number;
  difficulty?: QuizDifficulty;
  questionAttempts?: QuestionAttempt[];
  masteryGained?: Record<string, number>; // learningObjective -> score gain
  studentId?: string;
  attemptedAt?: string;
  scorePercentage?: number;
  attempts?: QuestionAttempt[];
  consecutiveFailures?: Record<string, number>;
  subject?: string;
  totalQuestions?: number;
  timeSpentSeconds?: number;
  completedAt?: string;
}

export type MasteryStatus = 'NEEDS_PRACTICE' | 'DEVELOPING' | 'MASTERED';

export interface ConceptMasteryRecord {
  conceptId: string;
  subject: string;
  topic: string;
  learningObjective: string;
  masteryScore: number; // 0 to 100
  consecutiveCorrect: number;
  totalAttempts: number;
  successfulVariantsCount: number;
  status: MasteryStatus;
  lastAttemptAt: string;
}

export type RetryActionType =
  | 'RETRY_VARIANT'
  | 'EXPLAIN_CONCEPT'
  | 'SHOW_HINT'
  | 'REDUCE_DIFFICULTY'
  | 'CHANGE_REPRESENTATION'
  | 'GIVE_WORKED_EXAMPLE'
  | 'TRIGGER_REMEDIATION'
  | 'ADVANCE';

export interface RetryDecision {
  action: RetryActionType;
  message: string;
  hintText?: string;
  remediationExplanation?: string;
  workedExample?: string;
  nextVariant?: CanonicalQuestion;
}
