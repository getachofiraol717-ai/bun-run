// Formula Engine — Integration interfaces
// Feature 14: Engine integration interfaces for external systems
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type {
  EnrichedFormula,
  AgeBand,
  LearningStyle,
  ExplanationMode,
  PracticeQuestion,
  FormulaAnalytics,
} from "../models/FormulaModels";
import type { PracticeSession } from "../core/PracticeGenerator";

// ─── Smart PDF Engine Integration ───────────────────────────────────────

export interface SmartPDFEngineAdapter {
  /** Consume a formula detected by Smart PDF Engine */
  onFormulaDetected(formula: Formula): Promise<void>;
  /** Get formulas for a specific document */
  getFormulasForDocument(documentId: string): Promise<Formula[]>;
  /** Subscribe to new formula detections */
  subscribeToFormulaDetection(callback: (formula: Formula) => void): () => void;
}

// ─── AI Tutor Engine Integration ─────────────────────────────────────────

export interface AITutorEngineAdapter {
  /** Provide formula explanation to AI Tutor */
  provideFormulaExplanation(
    formula: EnrichedFormula,
    mode: ExplanationMode,
    ageBand: AgeBand
  ): Promise<string>;

  /** Provide practice questions to AI Tutor */
  providePracticeQuestions(formula: EnrichedFormula): Promise<PracticeQuestion[]>;

  /** Get formula context for tutoring session */
  getFormulaContext(formulaId: string): Promise<FormulaContext | null>;

  /** Report student performance on formula */
  reportPerformance(
    formulaId: string,
    result: { correct: boolean; timeSpent: number }
  ): Promise<void>;
}

export interface FormulaContext {
  formula: EnrichedFormula;
  studentLevel: AgeBand;
  relatedFormulas: string[];
  commonMistakes: string[];
  memoryTips: string[];
}

// ─── Memory Vault Integration ─────────────────────────────────────────────

export interface MemoryVaultAdapter {
  /** Save formula learning progress to memory */
  saveFormulaProgress(formulaId: string, progress: FormulaProgress): Promise<void>;

  /** Get formula progress from memory */
  getFormulaProgress(formulaId: string): Promise<FormulaProgress | null>;

  /** Get formulas student is learning */
  getLearningFormulas(): Promise<FormulaProgress[]>;

  /** Add formula to strong subjects */
  markAsStrongSubject(formulaId: string): Promise<void>;

  /** Add formula to weak subjects */
  markAsWeakSubject(formulaId: string, reason: string): Promise<void>;
}

export interface FormulaProgress {
  formulaId: string;
  formulaName: string;
  masteryLevel: "not_started" | "introduced" | "practicing" | "mastered";
  lastStudied: Date;
  timesPracticed: number;
  accuracy: number;
}

// ─── Knowledge Galaxy Integration ────────────────────────────────────────

export interface KnowledgeGalaxyAdapter {
  /** Convert formula to galaxy node data */
  toGalaxyNode(formula: EnrichedFormula): GalaxyNode;

  /** Get related formulas as galaxy connections */
  getRelatedNodes(formulaId: string): GalaxyNode[];

  /** Update formula position in galaxy based on mastery */
  updateNodePosition(formulaId: string, masteryLevel: string): void;
}

export interface GalaxyNode {
  id: string;
  label: string;
  type: "formula" | "concept" | "topic";
  subject: string;
  size: number; // Based on importance
  color: string; // Based on subject
  connections: string[];
}

// ─── World Builder Integration ────────────────────────────────────────────

export interface WorldBuilderAdapter {
  /** Convert formula to world building assets */
  toWorldBuilderAssets(formula: EnrichedFormula): WorldBuilderAsset[];
}

export interface WorldBuilderAsset {
  type: "character" | "item" | "location" | "quest";
  name: string;
  description: string;
  attributes: Record<string, any>;
}

// ─── Summary Engine Integration ───────────────────────────────────────────

export interface SummaryEngineAdapter {
  /** Generate formula summary */
  generateFormulaSummary(formula: EnrichedFormula): Promise<string>;

  /** Generate chapter summary including formulas */
  generateChapterSummary(chapterId: string, formulas: Formula[]): Promise<string>;
}

// ─── Quiz Engine Integration ───────────────────────────────────────────────

export interface QuizEngineAdapter {
  /** Generate quiz questions from formulas */
  generateQuizQuestions(
    formulas: Formula[],
    count: number,
    difficulty: "easy" | "medium" | "hard"
  ): Promise<QuizQuestion[]>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  formula: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

// ─── Accessibility Engine Integration ─────────────────────────────────────

export interface AccessibilityEngineAdapter {
  /** Generate screen reader description for formula */
  describeForScreenReader(formula: EnrichedFormula): string;

  /** Get audio description for formula */
  getAudioDescription(formula: EnrichedFormula): Promise<string>;

  /** Get Braille representation */
  getBrailleRepresentation(formula: string): string;
}

// ─── Analytics Integration ─────────────────────────────────────────────────

export interface FormulaAnalyticsAdapter {
  /** Track formula interaction */
  trackInteraction(
    formulaId: string,
    type: "view" | "practice" | "solve" | "master"
  ): void;

  /** Get analytics for formula */
  getAnalytics(formulaId: string): Promise<FormulaAnalytics>;

  /** Get learning path recommendations */
  getLearningRecommendations(
    completedFormulas: string[],
    targetFormula: string
  ): Promise<LearningRecommendation[]>;
}

export interface LearningRecommendation {
  formulaId: string;
  formulaName: string;
  reason: string;
  priority: number;
}

// ─── Voice Tutor Integration ──────────────────────────────────────────────

export interface VoiceTutorAdapter {
  /** Speak formula explanation */
  speak(message: string): Promise<void>;

  /** Listen for student input */
  listen(): Promise<string>;

  /** Stop speaking */
  stop(): void;
}
