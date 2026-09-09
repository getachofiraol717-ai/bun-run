// Smart PDF Engine — usePDFAnalysis
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { PdfDoc } from "@/lib/pdfjs";
import { computeDocumentId, runAnalysis } from "../core/SmartPDFController";
import { getState, subscribe, type DocumentState } from "../store/smartPDFStore";

export interface UsePDFAnalysisOptions {
  /** A loaded pdf.js document (from @/lib/pdfjs's loadPdfDocument), or null until it's ready. */
  doc: PdfDoc | null;
  /** Stable source identifier (URL/blob URL/filename) — required once `doc` is set. */
  source: string | null;
  subject?: string | null;
  /** Run automatically once `doc`/`source` are available. Defaults to true. */
  auto?: boolean;
}

export interface UsePDFAnalysisResult extends DocumentState {
  documentId: string | null;
  /** Manually (re-)trigger analysis, e.g. a "Re-analyze" button or auto=false workflows. */
  analyze: (forceRefresh?: boolean) => void;
}

const IDLE: DocumentState = { status: "idle", progress: null, analysis: null, error: null };

export function usePDFAnalysis(opts: UsePDFAnalysisOptions): UsePDFAnalysisResult {
  const { doc, source, subject, auto = true } = opts;
  const documentId = doc && source ? computeDocumentId(doc, source) : null;

  const state = useSyncExternalStore(
    useCallback((listener) => (documentId ? subscribe(documentId, listener) : () => {}), [documentId]),
    () => (documentId ? getState(documentId) : IDLE)
  );

  const triggeredFor = useRef<string | null>(null);

  const analyze = useCallback(
    (forceRefresh = false) => {
      if (!doc || !source) return;
      triggeredFor.current = computeDocumentId(doc, source);
      runAnalysis({ doc, source, subject, forceRefresh }).catch(() => {
        /* error is already captured in store state via SmartPDFController */
      });
    },
    [doc, source, subject]
  );

  useEffect(() => {
    if (!auto || !doc || !source || !documentId) return;
    if (triggeredFor.current === documentId) return;
    analyze(false);
  }, [auto, doc, source, documentId]);

  return { ...state, documentId, analyze };
}
