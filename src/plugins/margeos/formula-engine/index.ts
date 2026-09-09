// @ts-nocheck
// ════════════════════════════════════════════════════════════════
// MargeOS Formula Solver Engine
// src/plugins/margeos/formula-engine/
//
// Transforms detected formulas from Smart PDF Engine into complete
// learning experiences: explanations, solvers, practice questions,
// common mistakes, memory tips, and learning analytics.
//
// Usage (typical):
//   import { enrichFormula, useFormulaEngine } from '@/plugins/margeos/formula-engine';
//   const { enrichedFormula } = enrichFormula(detectedFormula, { ageBand: '14-16' });
//
// Integration with Smart PDF Engine:
//   - Consumes Formula type from smart-pdf-engine/types/Formula.ts
//   - Works alongside detected chapters, topics, diagrams, tables
//   - Provides learning content for AI Tutor Engine
//
// Nothing in this module mutates Smart PDF Engine or AI Tutor Engine —
//
// it is purely additive and safe to import from anywhere in the app.
// ════════════════════════════════════════════════════════════════

// Core
export {
  enrichFormula,
  enrichFormulas,
  analyzeFormula,
  solveProblem,
  checkAnswer,
  createFormulaPracticeSession,
} from "./core/FormulaController";
export type { FormulaControllerConfig, FormulaEnrichmentResult } from "./core/FormulaController";

export { classifyFormula, suggestAgeAppropriateDifficulty } from "./core/FormulaClassifier";
export type { FormulaClassification, FormulaType, FormulaDomain } from "./core/FormulaClassifier";

export { analyzeVariables, generateVariableExplanation } from "./core/VariableAnalyzer";
export type { VariableInfo, VariableAnalysisResult } from "./core/VariableAnalyzer";

export { generateExplanation, generateMultipleModeExplanations } from "./core/FormulaExplainer";
export type { ExplanationConfig } from "./core/FormulaExplainer";

export { solveFormula, generateWorkedExample, verifySolution } from "./core/FormulaSolver";
export type { SolverConfig, SolverResult } from "./core/FormulaSolver";

export { generateExamples } from "./core/ExampleGenerator";

export { generatePracticeQuestions, createPracticeSession, evaluateAnswer } from "./core/PracticeGenerator";
export type { PracticeSession, PracticeConfig } from "./core/PracticeGenerator";

export { getCommonMistakes, analyzeStudentMistake } from "./core/MistakeAnalyzer";
export type { MistakeAnalysis, StudentMistake, MistakeEntry } from "./core/MistakeAnalyzer";

export { assessDifficulty, adaptDifficulty, generateAnalyticsForFormula } from "./core/FormulaDifficultyEngine";
export type { DifficultyAssessment, DifficultyFactor } from "./core/FormulaDifficultyEngine";

// Services
export { generateMemoryTechniques, generateMemoryTips, generateVisualRepresentations } from "./services/FormulaMemoryService";
export type { MemoryTechnique, MemoryTip } from "./services/FormulaMemoryService";

export {
  calculateMasteryLevel,
  updateProgress,
  identifyWeakAreas,
  identifyStrongAreas,
  generateStudyRecommendations,
  calculateStudyAnalytics,
  generateProgressReport,
} from "./services/FormulaAnalyticsService";
export type {
  LearningProgress,
  MasteryLevel,
  StudyAnalytics,
} from "./services/FormulaAnalyticsService";

// Hooks
export { useFormulaEngine, useFormula } from "./hooks/useFormulaEngine";

// Store
export {
  formulaStore,
  getFormulaConfig,
  getCurrentFormula,
  getEnrichedFormula,
  getMasteryLevel,
  subscribeToFormulaStore,
} from "./store/formulaStore";
export type { FormulaConfig, FormulaState } from "./store/formulaStore";

// Utils
export * from "./utils/formulaUtils";

// Interfaces
export * from "./interfaces/FormulaIntegrations";

// Models & Types
export * from "./models/FormulaModels";
