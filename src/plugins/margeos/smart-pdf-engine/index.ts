// ════════════════════════════════════════════════════════════════
// MargeOS Smart PDF Understanding Engine
// src/plugins/margeos/smart-pdf-engine/
//
// Transforms the existing PDF Reader's plain text extraction into a full
// analysis pipeline: chapters, topics/knowledge-graph, formulas (with
// explanations), diagrams, tables, and an auto-generated learning path.
//
// Usage (typical):
//   const { doc } = ... // from @/lib/pdfjs, as already used by PDFReader.tsx
//   const analysis = usePDFAnalysis({ doc, source: fileUrl });
//   const { steps } = useLearningPath(analysis.documentId, analysis);
//
// Nothing in this module mutates or depends on existing PDF Reader UI — it
// is purely additive and safe to import from anywhere in the app.
// ════════════════════════════════════════════════════════════════

// Core
export { analyzePDF, ENGINE_VERSION } from "./core/PDFAnalysisEngine";
export { runAnalysis, computeDocumentId, getDocumentState } from "./core/SmartPDFController";
export { detectChapters } from "./core/ChapterDetector";
export { extractTopics } from "./core/TopicExtractor";
export { detectFormulas } from "./core/FormulaDetector";
export { detectDiagrams } from "./core/DiagramDetector";
export { detectTables } from "./core/TableDetector";
export { generateLearningPath } from "./core/LearningPathGenerator";

// Services
export { extractAllPages, countWords, pseudoLines } from "./services/TextExtractionService";
export { readMetadata, deriveDocumentId } from "./services/PDFMetadataService";
export { buildKnowledgeGraph } from "./services/SemanticAnalysisService";
export { setOCRBackend, getOCRBackend, pageHasEmbeddedImage, NullOCRBackend } from "./services/OCRService";
export type { OCRBackend, OCRResult } from "./services/OCRService";

// Store
export {
  getState as getSmartPDFState,
  subscribe as subscribeSmartPDF,
  getCachedAnalysis,
  setCachedAnalysis,
  clearCachedAnalysis,
  getCompletedSteps,
  setStepCompleted,
} from "./store/smartPDFStore";
export type { DocumentState } from "./store/smartPDFStore";

// Hooks
export { usePDFAnalysis } from "./hooks/usePDFAnalysis";
export { useFormulaDetection } from "./hooks/useFormulaDetection";
export { useLearningPath } from "./hooks/useLearningPath";
export { useTopicExtraction } from "./hooks/useTopicExtraction";

// Components
export { default as AnalysisPanel } from "./components/AnalysisPanel";

// Types
export * from "./types/PDFAnalysis";
export * from "./types/Chapter";
export * from "./types/Topic";
export * from "./types/Formula";
export * from "./types/Diagram";
export * from "./types/Table";
export * from "./types/LearningPath";

// Utils
export * from "./utils/chapterUtils";
export * from "./utils/formulaUtils";
export * from "./utils/learningPathUtils";
export * from "./utils/topicUtils";
