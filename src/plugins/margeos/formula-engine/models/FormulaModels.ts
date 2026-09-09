// @ts-nocheck
// Formula Engine — Core data models
// Feature 1 (Formula Classification), Feature 2 (Variable Explanation),
// Feature 4 (Formula Explanation), Feature 6 (Practice Questions)
import type { Formula, FormulaExplanation, FormulaSubject, FormulaDifficulty } from "@/plugins/margeos/smart-pdf-engine";

export type { Formula, FormulaExplanation, FormulaSubject, FormulaDifficulty };

export type ExplanationMode = "simple" | "detailed" | "technical" | "story" | "analogy" | "exam_prep";
export type AgeBand = "8-10" | "11-13" | "14-16" | "17-19" | "university" | "professional";
export type LearningStyle = "visual" | "auditory" | "reading" | "kinesthetic" | "mixed";

/** Extended formula with all computed learning artifacts. */
export interface EnrichedFormula extends Formula {
  /** Re-explanation in a specific mode (may differ from base .explanation). */
  explanationModes: Partial<Record<ExplanationMode, FormulaExplanation>>;
  /** Step-by-step solving breakdown. */
  solvingSteps: SolvingStep[];
  /** Worked examples with solutions. */
  workedExamples: WorkedExample[];
  /** Practice questions with answers. */
  practiceQuestions: PracticeQuestion[];
  /** Common mistakes with corrections. */
  commonMistakes: MistakeEntry[];
  /** Visual representations (LaTeX, diagrams, etc.). */
  visualRepresentations: VisualRepresentation[];
  /** Memory/visualization tips. */
  memoryTips: string[];
  /** Related formulas from the same document. */
  relatedFormulas: string[];
  /** Learning analytics. */
  analytics: FormulaAnalytics;
}

export interface SolvingStep {
  stepNumber: number;
  description: string;
  formula: string;
  variables?: { symbol: string; value: string }[];
  explanation: string;
  isKeyStep: boolean;
}

export interface WorkedExample {
  title: string;
  problem: string;
  given: Record<string, string>;
  find: string;
  solution: string;
  steps: SolvingStep[];
  result: string;
  difficulty: FormulaDifficulty;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  given: Record<string, string>;
  find: string;
  correctAnswer: string;
  options?: string[];
  difficulty: FormulaDifficulty;
  hint?: string;
  explanation: string;
}

export interface MistakeEntry {
  mistake: string;
  why: string;
  correction: string;
  prevention: string;
}

export interface VisualRepresentation {
  type: "latex" | "diagram" | "table" | "graph" | "animation_description";
  content: string;
  description: string;
}

export interface FormulaAnalytics {
  estimatedSolveTime: number; // minutes
  prerequisiteTopics: string[];
  estimatedMasteryAttempts: number;
  confidenceScore: number;
}

/** Input for generating formula learning content. */
export interface FormulaGenerationInput {
  formula: Formula;
  ageBand: AgeBand;
  learningStyle: LearningStyle;
  explanationMode: ExplanationMode;
  count?: number;
}

/** Result of formula analysis. */
export interface FormulaAnalysisResult {
  formula: EnrichedFormula;
  classification: FormulaClassification;
  confidence: number;
  suggestions: string[];
}
