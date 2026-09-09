// Adaptive Quiz Engine — QuestionGenerator Interface
// Public API types for question generation

import type { Question, QuestionType, DifficultyLevel, QuestionFilter } from "../models/Question";
import type { QuestionMetadata } from "../models/Question";

export interface IQuestionGenerator {
  // Question Generation
  generateQuestions(request: QuestionGenerationRequest): Promise<Question[]>;
  generateSingleQuestion(request: SingleQuestionRequest): Promise<Question | null>;

  // Question Retrieval
  getQuestionById(questionId: string): Promise<Question | null>;
  getQuestionsByFilter(filter: QuestionFilter, limit?: number): Promise<Question[]>;
  getQuestionsByTopic(topic: string): Promise<Question[]>;
  getQuestionsBySubject(subject: string): Promise<Question[]>;
  getQuestionsByDifficulty(difficulty: DifficultyLevel): Promise<Question[]>;

  // Question Management
  addQuestion(question: Question): void;
  updateQuestion(questionId: string, updates: Partial<Question>): Question | null;
  deleteQuestion(questionId: string): boolean;

  // Statistics
  getQuestionStats(): QuestionStatistics;
  getRandomQuestions(filter?: QuestionFilter, count?: number): Promise<Question[]>;
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

export interface SingleQuestionRequest extends QuestionGenerationRequest {
  count: 1;
}

export interface QuestionStatistics {
  totalQuestions: number;
  byType: Record<QuestionType, number>;
  byDifficulty: Record<DifficultyLevel, number>;
  bySubject: Record<string, number>;
  averageSuccessRate: number;
}

// Source types for question generation
export type QuestionSource =
  | "pdf"           // From Smart PDF Engine
  | "tutor"         // From AI Tutor Engine
  | "formula"       // From Formula Engine
  | "reference"     // From Reference Book Engine
  | "visual"        // From Visual Learning Engine
  | "knowledge_galaxy" // From Knowledge Galaxy Engine
  | "manual"        // Manually created
  | "ai_generated"; // AI-generated

// Cognitive levels (Bloom's Taxonomy)
export type CognitiveLevel =
  | "remember"   // Recall facts
  | "understand" // Explain concepts
  | "apply"      // Use in new situations
  | "analyze"    // Draw connections
  | "evaluate"   // Justify decisions
  | "create";    // Produce new work

// Question template for generation
export interface QuestionTemplate {
  id: string;
  name: string;
  type: QuestionType;
  prompt: string;
  variables: TemplateVariable[];
  difficultyAdjustment: number;
  requiredFields: string[];
  options?: TemplateOption[];
}

export interface TemplateVariable {
  name: string;
  type: "text" | "number" | "list";
  values?: string[];
  range?: { min: number; max: number };
}

export interface TemplateOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

// Generation context
export interface GenerationContext {
  source: QuestionSource;
  sourceId?: string;
  chapterId?: string;
  lessonId?: string;
  existingQuestions?: Question[];
  userProfile?: {
    level: DifficultyLevel;
    strongTopics?: string[];
    weakTopics?: string[];
  };
}

// Validation result
export interface QuestionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

// Difficulty estimation
export interface DifficultyEstimation {
  estimatedDifficulty: DifficultyLevel;
  confidence: number;
  factors: EstimationFactor[];
}

export interface EstimationFactor {
  name: string;
  contribution: number;
  weight: number;
}

// Content extraction
export interface ExtractedContent {
  title: string;
  keyConcepts: string[];
  definitions: Map<string, string>;
  formulas: string[];
  examples: string[];
  relatedTopics: string[];
}

// Integration with other engines
export interface EngineIntegration {
  pdfEngine?: {
    extractContent: (sourceId: string) => Promise<ExtractedContent>;
    generateQuestions: (content: ExtractedContent, count: number) => Promise<Question[]>;
  };
  tutorEngine?: {
    getExplanation: (topic: string) => Promise<string>;
    generatePractice: (topic: string, difficulty: DifficultyLevel) => Promise<Question[]>;
  };
  formulaEngine?: {
    getFormulas: (topic: string) => Promise<string[]>;
    generateFormulaQuestions: (formula: string, count: number) => Promise<Question[]>;
  };
  knowledgeGalaxyEngine?: {
    getRelatedNodes: (topic: string) => Promise<string[]>;
    getPrerequisites: (topic: string) => Promise<string[]>;
  };
}
