// Smart PDF Engine — chapter/heading heuristics
import type { ChapterLevel } from "../types/Chapter";

export interface HeadingMatch {
  level: ChapterLevel;
  numbering: string | null;
  title: string;
  confidence: number;
}

// Ordered most-specific-first so "1.1.2 Foo" doesn't get mistaken for "1 Foo".
const PATTERNS: { level: ChapterLevel; re: RegExp; confidence: number }[] = [
  { level: "chapter", re: /^chapter\s+(\d+)[:.\-–]?\s*(.*)$/i, confidence: 0.95 },
  { level: "lesson", re: /^lesson\s+(\d+)[:.\-–]?\s*(.*)$/i, confidence: 0.95 },
  { level: "subsection", re: /^(\d+\.\d+\.\d+)\s+(.+)$/, confidence: 0.85 },
  { level: "section", re: /^(\d+\.\d+)\s+(.+)$/, confidence: 0.85 },
  { level: "section", re: /^section\s+(\d+)[:.\-–]?\s*(.*)$/i, confidence: 0.8 },
  { level: "chapter", re: /^unit\s+(\d+)[:.\-–]?\s*(.*)$/i, confidence: 0.8 },
  // Bare top-level number followed by a Title-Case-ish heading, e.g. "1 Introduction"
  { level: "chapter", re: /^(\d+)\s+([A-Z][^.]{2,80})$/, confidence: 0.55 },
];

/** A line is "heading-shaped" if it's short, doesn't end mid-sentence, and isn't mostly lowercase prose. */
function looksLikeHeading(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 90) return false;
  if (/[.,;:]\s\w/.test(t)) return false; // contains an internal sentence break — likely prose
  return true;
}

/** Try to classify a single line of extracted text as a chapter/section heading. */
export function matchHeading(line: string): HeadingMatch | null {
  const t = line.trim().replace(/\s+/g, " ");
  if (!looksLikeHeading(t)) return null;

  for (const p of PATTERNS) {
    const m = t.match(p.re);
    if (m) {
      const numbering = m[1] ?? null;
      const title = (m[2] ?? t).trim() || t;
      return { level: p.level, numbering, title, confidence: p.confidence };
    }
  }

  // ALL CAPS short line — common for section headers in scanned/simple PDFs.
  if (t.length >= 4 && t.length <= 60 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
    return { level: "section", numbering: null, title: t, confidence: 0.4 };
  }
  return null;
}

/** Depth implied by numbering, e.g. "1" → 0, "1.1" → 1, "1.1.2" → 2. */
export function depthFromNumbering(numbering: string | null): number {
  if (!numbering) return 0;
  return Math.max(0, numbering.split(".").length - 1);
}
