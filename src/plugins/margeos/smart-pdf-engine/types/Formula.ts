// Smart PDF Engine — Formula types
// Covers Feature 3 (formula detection) and Feature 4 (formula explanation
// object) from the spec.

export type FormulaSubject = "math" | "physics" | "chemistry" | "statistics" | "unknown";
export type FormulaDifficulty = "beginner" | "intermediate" | "advanced";

/** Feature 4 — generated alongside every detected formula. */
export interface FormulaExplanation {
  formula: string;
  explanation: string;
  variables: { symbol: string; meaning: string }[];
  examples: string[];
  commonMistakes: string[];
  realWorldExamples: string[];
}

export interface Formula {
  id: string;
  /** The raw matched expression, e.g. "F = ma". */
  formula: string;
  variables: string[];
  subject: FormulaSubject;
  difficulty: FormulaDifficulty;
  pageNumber: number;
  /** Surrounding sentence/line for context. */
  context: string;
  explanation: FormulaExplanation;
}
