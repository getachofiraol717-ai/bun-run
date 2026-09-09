// Smart PDF Engine — top-level analysis types
import type { ChapterHierarchy } from "./Chapter";
import type { TopicGraph } from "./Topic";
import type { Formula } from "./Formula";
import type { Diagram } from "./Diagram";
import type { PDFTable } from "./Table";
import type { LearningPath } from "./LearningPath";

export type AnalysisStatus = "idle" | "extracting" | "analyzing" | "complete" | "error";

export interface AnalysisProgress {
  status: AnalysisStatus;
  /** 0–100 */
  percent: number;
  /** Human-readable current step, e.g. "Detecting chapters (page 42/300)". */
  currentStep: string;
  pagesProcessed: number;
  totalPages: number;
}

export interface PDFMetadata {
  title: string | null;
  author: string | null;
  numPages: number;
  /** Cache key derived from source URL/blob + numPages (see PDFMetadataService). */
  documentId: string;
  wordCount: number;
  analyzedAt: string; // ISO timestamp
}

/** The complete output of the Smart PDF Understanding Engine for one document. */
export interface PDFAnalysisResult {
  documentId: string;
  metadata: PDFMetadata;
  chapters: ChapterHierarchy;
  topics: TopicGraph;
  formulas: Formula[];
  diagrams: Diagram[];
  tables: PDFTable[];
  learningPath: LearningPath;
  /** Engine version that produced this result — bump to invalidate old caches. */
  engineVersion: string;
}

// ────────────────────────────────────────────────────────────────
// Feature 9 — AI Tutor integration preparation.
// These are deliberately *interfaces only* (no implementation) so future
// systems (Summary Engine, Quiz Engine, Flashcards Engine, Memory Vault,
// Knowledge Galaxy, Accessibility Engine) have a stable, typed contract to
// build against once they're ready to consume PDFAnalysisResult.
// ────────────────────────────────────────────────────────────────

export interface SummaryEngineAdapter {
  generateSummary(analysis: PDFAnalysisResult, chapterId?: string): Promise<string>;
}

export interface QuizEngineAdapter {
  generateQuiz(analysis: PDFAnalysisResult, chapterId?: string, count?: number): Promise<unknown>;
}

export interface FlashcardsEngineAdapter {
  generateFlashcards(analysis: PDFAnalysisResult, chapterId?: string): Promise<unknown>;
}

export interface MemoryVaultAdapter {
  recordInsight(analysis: PDFAnalysisResult, insight: Record<string, unknown>): Promise<void>;
}

export interface KnowledgeGalaxyAdapter {
  toGalaxyNodes(analysis: PDFAnalysisResult): unknown;
}

export interface AccessibilityEngineAdapter {
  describeForScreenReader(analysis: PDFAnalysisResult, pageNumber: number): string;
}
