// Smart PDF Engine — SmartPDFController
// The single public entry point for running analysis. Handles: cache lookup
// (skip re-analysis of a previously-seen document), de-duping concurrent
// requests for the same document, and keeping the reactive store in sync so
// any number of hook instances can observe progress/results.
import type { PdfDoc } from "@/lib/pdfjs";
import { analyzePDF } from "./PDFAnalysisEngine";
import { deriveDocumentId } from "../services/PDFMetadataService";
import { getCachedAnalysis, getState, setCachedAnalysis, setState, type DocumentState } from "../store/smartPDFStore";
import type { PDFAnalysisResult } from "../types/PDFAnalysis";

const inFlight = new Map<string, Promise<PDFAnalysisResult>>();

export interface RunAnalysisOptions {
  doc: PdfDoc;
  /** Stable identifier for the source file (URL, blob URL, or filename) — used to derive the cache key. */
  source: string;
  subject?: string | null;
  /** Skip the persisted-cache lookup and force a fresh analysis. */
  forceRefresh?: boolean;
  signal?: AbortSignal;
}

export function computeDocumentId(doc: PdfDoc, source: string): string {
  return deriveDocumentId(source, doc.numPages);
}

/**
 * Run (or resume) Smart PDF Engine analysis for a document. Safe to call
 * repeatedly (e.g. once per hook mount) — concurrent calls for the same
 * document share a single in-flight analysis instead of duplicating work.
 */
export async function runAnalysis(opts: RunAnalysisOptions): Promise<PDFAnalysisResult> {
  const documentId = computeDocumentId(opts.doc, opts.source);

  const existing = getState(documentId);
  if (existing.analysis && !opts.forceRefresh) return existing.analysis;

  if (!opts.forceRefresh) {
    const cached = getCachedAnalysis(documentId);
    if (cached) {
      setState(documentId, {
        status: "complete",
        analysis: cached,
        progress: { status: "complete", percent: 100, currentStep: "Loaded from cache", pagesProcessed: cached.metadata.numPages, totalPages: cached.metadata.numPages },
        error: null,
      });
      return cached;
    }
  }

  const pending = inFlight.get(documentId);
  if (pending) return pending;

  setState(documentId, { status: "extracting", error: null, progress: { status: "extracting", percent: 0, currentStep: "Starting…", pagesProcessed: 0, totalPages: opts.doc.numPages } });

  const run = analyzePDF({
    doc: opts.doc,
    source: opts.source,
    subject: opts.subject,
    signal: opts.signal,
    onProgress: (progress) => setState(documentId, { status: progress.status, progress }),
  })
    .then((analysis) => {
      setState(documentId, { status: "complete", analysis, error: null });
      setCachedAnalysis(documentId, analysis);
      return analysis;
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Smart PDF analysis failed";
      setState(documentId, { status: "error", error: message });
      throw err;
    })
    .finally(() => inFlight.delete(documentId));

  inFlight.set(documentId, run);
  return run;
}

export function getDocumentState(documentId: string): DocumentState {
  return getState(documentId);
}
