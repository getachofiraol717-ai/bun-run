// Smart PDF Engine — PDFAnalysisEngine
// Orchestrates the full pipeline: extract → detect chapters/topics/formulas/
// diagrams/tables → generate learning path → assemble PDFAnalysisResult.
// Each phase is given a slice of the 0–100 progress range so the UI can show
// one continuous, meaningful progress bar instead of five separate ones.
import type { PdfDoc } from "@/lib/pdfjs";
import { countWords, extractAllPages, type PageText } from "../services/TextExtractionService";
import { deriveDocumentId, readMetadata } from "../services/PDFMetadataService";
import { detectChapters } from "./ChapterDetector";
import { extractTopics } from "./TopicExtractor";
import { detectFormulas } from "./FormulaDetector";
import { detectDiagrams } from "./DiagramDetector";
import { detectTables } from "./TableDetector";
import { generateLearningPath } from "./LearningPathGenerator";
import type { AnalysisProgress, PDFAnalysisResult } from "../types/PDFAnalysis";

export const ENGINE_VERSION = "1.0.0";

export interface AnalyzeOptions {
  doc: PdfDoc;
  /** Stable source identifier (URL/blob URL/filename) used to derive the cache key. */
  source: string;
  subject?: string | null;
  onProgress?: (progress: AnalysisProgress) => void;
  signal?: AbortSignal;
}

// Phase weights must sum to 100.
const PHASES = {
  extract: 40,
  chapters: 10,
  topics: 20,
  formulas: 12,
  diagrams: 10,
  tables: 6,
  learningPath: 2,
} as const;

function phaseStart(phase: keyof typeof PHASES): number {
  const order: (keyof typeof PHASES)[] = ["extract", "chapters", "topics", "formulas", "diagrams", "tables", "learningPath"];
  let sum = 0;
  for (const p of order) {
    if (p === phase) return sum;
    sum += PHASES[p];
  }
  return sum;
}

export async function analyzePDF(opts: AnalyzeOptions): Promise<PDFAnalysisResult> {
  const totalPages = opts.doc.numPages;
  const report = (status: AnalysisProgress["status"], phase: keyof typeof PHASES, within: number, currentStep: string, pagesProcessed = 0) => {
    const percent = Math.min(100, Math.round(phaseStart(phase) + within * PHASES[phase]));
    opts.onProgress?.({ status, percent, currentStep, pagesProcessed, totalPages });
  };

  // ── 1. Extract text from every page ──────────────────────────
  report("extracting", "extract", 0, "Reading PDF pages…");
  const pages: PageText[] = await extractAllPages(opts.doc, {
    signal: opts.signal,
    onProgress: (done, total) => report("extracting", "extract", done / total, `Reading page ${done}/${total}`, done),
  });

  // ── 2. Chapters (Feature 1) — needs the outline + raw text fallback ──
  report("analyzing", "chapters", 0, "Detecting chapters & sections…");
  const chapters = await detectChapters({ doc: opts.doc });

  // ── 3. Topics + knowledge graph (Features 2 + 7) ─────────────
  report("analyzing", "topics", 0, "Extracting topics & concepts…");
  const topics = await extractTopics({
    pages,
    subject: opts.subject ?? null,
    onProgress: (done, total) => report("analyzing", "topics", done / total, `Extracting topics (${done}/${total})`, done),
  });

  // ── 4. Formulas + explanations (Features 3 + 4) ──────────────
  report("analyzing", "formulas", 0, "Detecting formulas…");
  const formulas = await detectFormulas({
    pages,
    onProgress: (done, total) => report("analyzing", "formulas", done / total, `Scanning formulas (${done}/${total})`, done),
  });

  // ── 5. Diagrams (Feature 5) ───────────────────────────────────
  report("analyzing", "diagrams", 0, "Detecting diagrams & figures…");
  const diagrams = await detectDiagrams({ pages, doc: opts.doc, topics: topics.nodes });

  // ── 6. Tables (Feature 6) ─────────────────────────────────────
  report("analyzing", "tables", 0, "Detecting tables…");
  const tables = await detectTables({ pages, doc: opts.doc });

  // ── 7. Learning path (Feature 8) ──────────────────────────────
  report("analyzing", "learningPath", 0, "Building learning path…");
  const learningPath = generateLearningPath({ chapters, topics });

  const meta = await readMetadata(opts.doc);
  const documentId = deriveDocumentId(opts.source, totalPages);

  const result: PDFAnalysisResult = {
    documentId,
    metadata: {
      title: meta.title,
      author: meta.author,
      numPages: totalPages,
      documentId,
      wordCount: countWords(pages),
      analyzedAt: new Date().toISOString(),
    },
    chapters,
    topics,
    formulas,
    diagrams,
    tables,
    learningPath,
    engineVersion: ENGINE_VERSION,
  };

  report("complete", "learningPath", 1, "Analysis complete");
  return result;
}
