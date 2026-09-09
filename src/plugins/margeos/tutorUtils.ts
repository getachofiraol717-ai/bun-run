// Pure helpers for the Tutor progress tracker. Buckets Knowledge Vault entries
// by normalized tutor "kind" so the panel can show real learning-output progress
// without any extra storage. Kept React-free for unit testing.
import type { KnowledgeEntry } from "./types";

export const TUTOR_KINDS = ["lesson", "quiz", "exam", "flashcards", "roadmap"] as const;
export type NormalizedKind = (typeof TUTOR_KINDS)[number] | "other";

/** Map a free-form category string to a canonical tutor kind. */
export function normalizeKind(category: string): NormalizedKind {
  const c = category.trim().toLowerCase();
  if (c.startsWith("lesson")) return "lesson";
  if (c.startsWith("quiz")) return "quiz";
  if (c.startsWith("exam")) return "exam";
  if (c.startsWith("flashcard")) return "flashcards";
  if (c.startsWith("roadmap") || c.startsWith("plan")) return "roadmap";
  return "other";
}

export interface TutorProgress {
  byKind: Record<NormalizedKind, number>;
  total: number;
  /** Most recent entry timestamp (ISO) or null when the vault is empty. */
  lastActivity: string | null;
}

/** Summarize vault entries into per-kind counts + total + last activity. */
export function summarizeTutorProgress(entries: KnowledgeEntry[]): TutorProgress {
  const byKind: Record<NormalizedKind, number> = {
    lesson: 0, quiz: 0, exam: 0, flashcards: 0, roadmap: 0, other: 0,
  };
  let lastActivity: string | null = null;
  for (const e of entries) {
    byKind[normalizeKind(e.category)] += 1;
    if (e.created_at && (!lastActivity || e.created_at > lastActivity)) lastActivity = e.created_at;
  }
  return { byKind, total: entries.length, lastActivity };
}
