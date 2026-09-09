import { describe, it, expect } from "vitest";
import { normalizeKind, summarizeTutorProgress } from "./tutorUtils";
import type { KnowledgeEntry } from "./types";

function entry(category: string, created_at = "2026-06-01T00:00:00Z"): KnowledgeEntry {
  return {
    id: Math.random().toString(36).slice(2),
    user_id: "u",
    category,
    title: "t",
    content: "c",
    source: null,
    tags: [],
    metadata: {},
    created_at,
    updated_at: created_at,
  };
}

describe("normalizeKind", () => {
  it("maps variants and synonyms to canonical kinds", () => {
    expect(normalizeKind("Lesson")).toBe("lesson");
    expect(normalizeKind("quizzes")).toBe("quiz");
    expect(normalizeKind("flashcard")).toBe("flashcards");
    expect(normalizeKind("planner")).toBe("roadmap");
    expect(normalizeKind("notes")).toBe("other");
  });
});

describe("summarizeTutorProgress", () => {
  it("counts per kind, totals, and tracks the latest activity", () => {
    const p = summarizeTutorProgress([
      entry("lesson", "2026-06-01T00:00:00Z"),
      entry("lesson", "2026-06-03T00:00:00Z"),
      entry("flashcard"),
      entry("misc"),
    ]);
    expect(p.total).toBe(4);
    expect(p.byKind.lesson).toBe(2);
    expect(p.byKind.flashcards).toBe(1);
    expect(p.byKind.other).toBe(1);
    expect(p.lastActivity).toBe("2026-06-03T00:00:00Z");
  });

  it("returns zeroed buckets and null activity for an empty vault", () => {
    const p = summarizeTutorProgress([]);
    expect(p.total).toBe(0);
    expect(p.lastActivity).toBeNull();
    expect(p.byKind).toEqual({ lesson: 0, quiz: 0, exam: 0, flashcards: 0, roadmap: 0, other: 0 });
  });
});
