// Smart PDF Engine — smartPDFStore
// A tiny framework-agnostic store (no new dependency — same subscribe/getState
// shape React's useSyncExternalStore expects) keyed by documentId. Mirrors the
// localStorage-cache convention already used in src/lib/offlineCache.ts.
import { ENGINE_VERSION } from "../core/PDFAnalysisEngine";
import type { AnalysisProgress, PDFAnalysisResult } from "../types/PDFAnalysis";

const CACHE_KEY = "ku_smart_pdf_cache";
const MAX_CACHED_DOCS = 5;

export interface DocumentState {
  status: AnalysisProgress["status"];
  progress: AnalysisProgress | null;
  analysis: PDFAnalysisResult | null;
  error: string | null;
}

const EMPTY_STATE: DocumentState = { status: "idle", progress: null, analysis: null, error: null };

type Listener = () => void;

const states = new Map<string, DocumentState>();
const listeners = new Map<string, Set<Listener>>();

function notify(documentId: string): void {
  listeners.get(documentId)?.forEach((l) => l());
}

export function getState(documentId: string): DocumentState {
  return states.get(documentId) ?? EMPTY_STATE;
}

export function setState(documentId: string, patch: Partial<DocumentState>): void {
  states.set(documentId, { ...getState(documentId), ...patch });
  notify(documentId);
}

export function subscribe(documentId: string, listener: Listener): () => void {
  const set = listeners.get(documentId) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(documentId, set);
  return () => set.delete(listener);
}

// ── Persisted cache (so re-opening the same PDF skips re-analysis) ────────
interface CacheEntry {
  documentId: string;
  analysis: PDFAnalysisResult;
  cachedAt: number;
}

function loadCache(): CacheEntry[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheEntry[]) : [];
  } catch {
    return [];
  }
}

function saveCache(entries: CacheEntry[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded or storage unavailable — analysis still works in-memory for this session.
  }
}

/** Look up a cached analysis. Returns null if absent or produced by an older engine version. */
export function getCachedAnalysis(documentId: string): PDFAnalysisResult | null {
  const entry = loadCache().find((e) => e.documentId === documentId);
  if (!entry || entry.analysis.engineVersion !== ENGINE_VERSION) return null;
  return entry.analysis;
}

export function setCachedAnalysis(documentId: string, analysis: PDFAnalysisResult): void {
  const entries = loadCache().filter((e) => e.documentId !== documentId);
  entries.unshift({ documentId, analysis, cachedAt: Date.now() });
  saveCache(entries.slice(0, MAX_CACHED_DOCS));
}

export function clearCachedAnalysis(documentId: string): void {
  saveCache(loadCache().filter((e) => e.documentId !== documentId));
}

// ── Learning-path step completion (small, separate from the big analysis cache) ──
const PROGRESS_KEY = "ku_smart_pdf_progress";

function loadCompletedMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function saveCompletedMap(map: Record<string, string[]>): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch { /* storage full — progress just won't persist across reloads */ }
}

// In-memory cache so getCompletedSteps returns the *same* Set reference
// between real changes. This matters because it's used directly as a
// useSyncExternalStore snapshot (see useLearningPath) — if it returned a
// freshly-constructed Set on every call, React would see a "new" snapshot
// on every render and could loop indefinitely re-rendering.
const completedCache = new Map<string, Set<string>>();

export function getCompletedSteps(documentId: string): Set<string> {
  let set = completedCache.get(documentId);
  if (!set) {
    set = new Set(loadCompletedMap()[documentId] ?? []);
    completedCache.set(documentId, set);
  }
  return set;
}

export function setStepCompleted(documentId: string, stepId: string, completed: boolean): void {
  const next = new Set(getCompletedSteps(documentId));
  if (completed) next.add(stepId);
  else next.delete(stepId);
  completedCache.set(documentId, next); // swap reference only when something actually changed

  const map = loadCompletedMap();
  map[documentId] = [...next];
  saveCompletedMap(map);
  notify(documentId);
}
