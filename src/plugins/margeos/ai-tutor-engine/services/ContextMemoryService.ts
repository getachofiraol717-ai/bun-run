// AI Tutor Engine — ContextMemoryService
// Feature 1 (Page Awareness) — reads an already-computed Smart PDF Engine
// PDFAnalysisResult; never re-analyzes.
// Feature 10 (Student Memory → "Connect to Memory Vault Engine") — the app
// already has a real per-user memory table (ai_memory) with an
// upsert_ai_memory RPC and a get_memory_context RPC that the existing AI
// Tutor chat already reads from for personalization. Writing this engine's
// learning signals into that same table (rather than a siloed local-only
// store) means the two features genuinely share memory in both directions.
import { supabase } from "@/integrations/supabase/client";
import {
  findChapterForPage,
  getDocumentState,
  type Diagram,
  type Formula,
  type PDFAnalysisResult,
  type PDFTable,
  type Topic,
} from "@/plugins/margeos/smart-pdf-engine";
import type { PageContext } from "../models/TeachingSession";

/** Look up the cached/in-progress Smart PDF Engine analysis for a document. Returns null if analysis hasn't completed yet — callers should prompt Smart PDF Engine to run (Task 1's usePDFAnalysis) rather than this service ever triggering it itself. */
export function getAnalysisResult(documentId: string): PDFAnalysisResult | null {
  return getDocumentState(documentId).analysis ?? null;
}

function topicsOnPage(analysis: PDFAnalysisResult, page: number): Topic[] {
  return analysis.topics.nodes.filter((t) => t.pages.includes(page)).sort((a, b) => b.weight - a.weight);
}

function formulasOnPage(analysis: PDFAnalysisResult, page: number): Formula[] {
  return analysis.formulas.filter((f) => f.pageNumber === page);
}

function diagramsOnPage(analysis: PDFAnalysisResult, page: number): Diagram[] {
  return analysis.diagrams.filter((d) => d.pageNumber === page);
}

function tablesOnPage(analysis: PDFAnalysisResult, page: number): PDFTable[] {
  return analysis.tables.filter((t) => t.pageNumber === page);
}

/** Build the Feature-1 PageContext for a given page from an already-computed analysis. */
export function buildPageContext(documentId: string, pageNumber: number, analysis: PDFAnalysisResult): PageContext {
  return {
    documentId,
    pageNumber,
    chapter: findChapterForPage(analysis.chapters, pageNumber),
    topics: topicsOnPage(analysis, pageNumber),
    formulas: formulasOnPage(analysis, pageNumber),
    diagrams: diagramsOnPage(analysis, pageNumber),
    tables: tablesOnPage(analysis, pageNumber),
  };
}

/** Convenience: look up the analysis for `documentId` and build the page context in one call. Returns null if Smart PDF Engine hasn't finished analyzing this document yet. */
export function getPageContext(documentId: string, pageNumber: number): PageContext | null {
  const analysis = getAnalysisResult(documentId);
  if (!analysis) return null;
  return buildPageContext(documentId, pageNumber, analysis);
}

// ── Feature 10 — Memory Vault bridge ────────────────────────
/** Allowed memory_type values this engine writes — a subset of ai_memory's CHECK constraint chosen for the closest honest semantic fit; this engine does not invent new memory types (that would need a migration). */
export type VaultMemoryType = "strong_subject" | "weak_subject" | "struggle_pattern" | "preferred_style";

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Best-effort, fire-and-forget sync of one student-memory signal into the
 * shared ai_memory table. Never throws and never blocks the lesson — memory
 * sync is a nice-to-have on top of the local StudentProfile cache (which
 * remains the synchronous source of truth this engine actually reads from),
 * not a requirement for the engine to keep working offline.
 */
export async function syncMemoryToVault(memoryType: VaultMemoryType, content: string, subject?: string | null): Promise<void> {
  try {
    const userId = await currentUserId();
    if (!userId) return;
    await (supabase as any).rpc("upsert_ai_memory", {
      _user_id: userId,
      _memory_type: memoryType,
      _content: content,
      _subject: subject ?? null,
      _source: "conversation",
    });
  } catch {
    // Non-critical — see function doc above.
  }
}
