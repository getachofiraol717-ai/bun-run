// AI Tutor Engine — TutorInterface (the public contract TutorController implements)
import type { TeachingSession } from "../models/TeachingSession";
import type { TeachingResult } from "../models/TeachingResult";
import type { SessionSummary } from "../models/TeachingResult";
import type { ExplanationMode } from "../models/StudentProfile";

export interface StartSessionOptions {
  documentId: string;
  pageNumber: number;
}

export interface ExplainConceptOptions {
  documentId: string;
  pageNumber: number;
  conceptLabel: string;
  mode?: ExplanationMode;
  onChunk?: (partial: string) => void;
}

export interface TeachFormulaOptions {
  documentId: string;
  pageNumber: number;
  formulaId: string;
  onChunk?: (partial: string) => void;
}

export interface ITutorController {
  startSession(opts: StartSessionOptions): Promise<TeachingSession>;
  /** Feature 2 — proactively begin teaching the page's first block. */
  teachNextBlock(documentId: string, pageNumber: number): Promise<TeachingResult | null>;
  explainConcept(opts: ExplainConceptOptions): Promise<TeachingResult>;
  teachFormula(opts: TeachFormulaOptions): Promise<TeachingResult>;
  getExample(documentId: string, pageNumber: number, conceptLabel: string): Promise<TeachingResult>;
  /** Feature 13 — student re-requested the same concept; escalate (simplify → more examples → new analogy → visual description) and return the resulting content. */
  recordConfusion(documentId: string, pageNumber: number, conceptLabel: string): Promise<TeachingResult | null>;
  /** Feature 10 — student explicitly marked a concept as understood/skipped. */
  markMastered(documentId: string, pageNumber: number, conceptLabel: string): void;
  markSkipped(conceptLabel: string): void;
  endSession(documentId: string, pageNumber: number): SessionSummary | null;
}
