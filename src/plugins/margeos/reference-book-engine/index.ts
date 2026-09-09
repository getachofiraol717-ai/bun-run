// ════════════════════════════════════════════════════════════════
// MargeOS Reference Book Intelligence Engine
// src/plugins/margeos/reference-book-engine/
//
// An intelligent reference system that allows students to build
// a personal academic library from uploaded textbooks, research
// papers, teacher guides, and personal notes.
//
// Key Features:
// - Multi-Source Library (Feature 1)
// - Source Analysis (Feature 2)
// - Concept Comparison (Feature 3)
// - Unified Explanations (Feature 4)
// - Source Citations (Feature 5)
// - Conflict Resolution (Feature 6)
// - Smart Recommendations (Feature 7)
// - Knowledge Network (Feature 8)
// - Personal Notes Integration (Feature 9)
// - Academic Summary (Feature 10)
// - Learning Confidence (Feature 11)
// - AI Tutor Integration (Feature 12)
// - Accessibility Preparation (Feature 13)
// - Engine Integration (Feature 14)
// - Performance (Feature 15)
//
// Usage:
//   import { ReferenceBookEngine, useReferenceBooks } from '@/plugins/margeos/reference-book-engine';
//
// Integration with:
// - Smart PDF Engine (document analysis)
// - AI Tutor Engine (teaching context)
// - Formula Engine (formula handling)
// - Memory Vault (learning history)
// - Knowledge Galaxy (concept connections)
// - Quiz Engine, Flashcard Engine, Exam Simulator
//
// Nothing in this module mutates other engines — it is purely
// additive and safe to import from anywhere in the app.
// ════════════════════════════════════════════════════════════════

// ─── Core ───────────────────────────────────────────────────────────────────

export { ReferenceBookEngine, referenceBookEngine } from "./core/ReferenceBookEngine";
export type { ReferenceBookEngineConfig, EngineResult, AnalysisResult } from "./core/ReferenceBookEngine";

export { SourceAnalyzer } from "./core/SourceAnalyzer";
export type { SourceAnalysisResult, DocumentAnalysis } from "./core/SourceAnalyzer";

export { SourceComparator } from "./core/SourceComparator";
export type { ComparisonCriteria } from "./core/SourceComparator";

export { ConceptMerger } from "./core/ConceptMerger";
export type { MergeConfig, MergedConceptData } from "./core/ConceptMerger";

export { CitationEngine } from "./core/CitationEngine";
export type { CitationConfig } from "./core/CitationEngine";

export { ConflictResolver } from "./core/ConflictResolver";
export type { ResolutionStrategy } from "./core/ConflictResolver";

export { UnifiedExplanationEngine } from "./core/UnifiedExplanationEngine";
export type { ExplanationConfig } from "./core/UnifiedExplanationEngine";

export { SourceRankingEngine } from "./core/SourceRankingEngine";
export type { RankingCriteria, RankedSource } from "./core/SourceRankingEngine";

export { ReferenceController, referenceController } from "./core/ReferenceController";

// ─── Models ─────────────────────────────────────────────────────────────────
export * from "./models/ReferenceBook";
export * from "./models/SourceComparison";

// ─── Hooks ──────────────────────────────────────────────────────────────────
export * from "./hooks/useReferenceBooks";

// ─── Store ──────────────────────────────────────────────────────────────────
export * from "./store/referenceBookStore";

// ─── Interfaces ──────────────────────────────────────────────────────────────
export * from "./interfaces/ReferenceEngine";

// ─── Utils ──────────────────────────────────────────────────────────────────

export {
  calculateTextSimilarity,
  extractKeyTerms,
  formatSourceTitle,
  formatCitation,
  truncateText,
  generateExcerpt,
  estimateReadingTime,
  countWords,
  isAcademicSource,
  getSourceTypeDisplay,
  getSubjectDisplay,
  compareDates,
  formatDate,
  isValidCitationStyle,
  generateId,
  deepClone,
  debounce,
  groupBy,
  unique,
  mergeUnique,
  arraysEqual
} from "./utils/comparisonUtils";
