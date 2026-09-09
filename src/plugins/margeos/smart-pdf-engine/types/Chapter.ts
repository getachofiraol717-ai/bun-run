// Smart PDF Engine — Chapter types
// A Chapter is any detected heading: chapter, lesson, section, or subsection.
// Chapters nest into a tree via `children`, and also exist as a flat list
// (`flatIndex`) for fast page-based lookups.

export type ChapterLevel = "chapter" | "lesson" | "section" | "subsection";

export interface Chapter {
  id: string;
  title: string;
  level: ChapterLevel;
  /** Nesting depth, 0 = top-level (e.g. "Chapter 1"). */
  depth: number;
  pageStart: number;
  /** Exclusive upper bound — last page before the next sibling/parent starts. */
  pageEnd: number;
  /** Raw heading number captured from the text, e.g. "1", "1.1", "2.3.1". */
  numbering: string | null;
  children: Chapter[];
  /** Confidence 0–1 that this heading was correctly detected (heuristic-based). */
  confidence: number;
}

export interface ChapterHierarchy {
  /** Top-level chapters with nested children. */
  tree: Chapter[];
  /** Every chapter/section flattened in document order — convenient for page lookups. */
  flatIndex: Chapter[];
  /** Source of the hierarchy: PDF bookmarks are far more reliable than text heuristics. */
  source: "outline" | "heuristic" | "hybrid";
}

/** Find the chapter (deepest match) that contains a given page number. */
export function findChapterForPage(hierarchy: ChapterHierarchy, page: number): Chapter | null {
  let best: Chapter | null = null;
  for (const ch of hierarchy.flatIndex) {
    if (page >= ch.pageStart && page < ch.pageEnd) {
      if (!best || ch.depth > best.depth) best = ch;
    }
  }
  return best;
}
