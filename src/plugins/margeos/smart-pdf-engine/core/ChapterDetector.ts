// Smart PDF Engine — ChapterDetector (Feature 1)
import { extractOutline, type OutlineEntry, type PdfDoc } from "@/lib/pdfjs";
import type { Chapter, ChapterHierarchy, ChapterLevel } from "../types/Chapter";
import { extractPositionedLines } from "../services/TextExtractionService";
import { depthFromNumbering, matchHeading } from "../utils/chapterUtils";

let chapterCounter = 0;
function nextChapterId(): string {
  chapterCounter += 1;
  return `chapter-${chapterCounter}`;
}

function levelFromDepth(depth: number): ChapterLevel {
  if (depth === 0) return "chapter";
  if (depth === 1) return "section";
  return "subsection";
}

/** Assign pageEnd to every entry in a flat, page-sorted list: each entry ends where the next *sibling-or-shallower* entry starts. */
function assignPageEnds(flat: Chapter[], totalPages: number): void {
  for (let i = 0; i < flat.length; i++) {
    const cur = flat[i];
    let end = totalPages + 1;
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[j].depth <= cur.depth) {
        end = flat[j].pageStart;
        break;
      }
    }
    cur.pageEnd = Math.max(cur.pageStart, end);
  }
}

/** Build a nested tree from a flat, page-ordered list using a depth stack. */
function buildTree(flat: Chapter[]): Chapter[] {
  const root: Chapter[] = [];
  const stack: Chapter[] = [];

  for (const ch of flat) {
    while (stack.length && stack[stack.length - 1].depth >= ch.depth) stack.pop();
    if (stack.length === 0) root.push(ch);
    else stack[stack.length - 1].children.push(ch);
    stack.push(ch);
  }
  return root;
}

function fromOutline(entries: OutlineEntry[], totalPages: number): ChapterHierarchy {
  const flat: Chapter[] = entries.map((e) => ({
    id: nextChapterId(),
    title: e.title,
    level: levelFromDepth(e.depth),
    depth: e.depth,
    pageStart: e.pageNumber,
    pageEnd: totalPages + 1,
    numbering: null,
    children: [],
    confidence: 1, // real bookmarks — fully trusted
  }));
  assignPageEnds(flat, totalPages);
  return { tree: buildTree(flat), flatIndex: flat, source: "outline" };
}

/** Heuristic fallback: scan each page's *real* visual lines (reconstructed from positioned
 * text items — see extractPositionedLines) for heading-shaped lines. Plain extracted text
 * (PageText.text) has its whitespace collapsed and can't reliably tell a heading apart from
 * the body text that immediately follows it, which is why this needs the positioned-line path
 * rather than `pages` directly. */
async function fromHeuristics(doc: PdfDoc, totalPages: number): Promise<ChapterHierarchy> {
  const flat: Chapter[] = [];
  for (let page = 1; page <= totalPages; page++) {
    const lines = await extractPositionedLines(doc, page);
    // Headings are most reliable near the top of a page (textbooks rarely start a new
    // chapter mid-page) — only scan the first handful of visual lines.
    for (const { text: line } of lines.slice(0, 8)) {
      const match = matchHeading(line);
      if (!match || match.confidence < 0.5) continue;
      flat.push({
        id: nextChapterId(),
        title: match.title,
        level: match.level,
        depth: depthFromNumbering(match.numbering),
        pageStart: page,
        pageEnd: totalPages + 1,
        numbering: match.numbering,
        children: [],
        confidence: match.confidence,
      });
      break; // at most one heading per page from the heuristic pass
    }
    if (page % 20 === 0) await new Promise((resolve) => setTimeout(resolve, 0)); // keep the UI responsive on big docs
  }
  assignPageEnds(flat, totalPages);
  return { tree: buildTree(flat), flatIndex: flat, source: "heuristic" };
}

export interface ChapterDetectorOptions {
  doc: PdfDoc;
}

/**
 * Detect chapters/sections. PDF bookmarks (the `outline`) are dramatically
 * more reliable than text heuristics, so they're used whenever present;
 * the heuristic pass only runs when there's no usable outline at all.
 */
export async function detectChapters(opts: ChapterDetectorOptions): Promise<ChapterHierarchy> {
  const totalPages = opts.doc.numPages;
  const outline = await extractOutline(opts.doc);
  if (outline.length >= 2) {
    return fromOutline(outline, totalPages);
  }
  const heuristic = await fromHeuristics(opts.doc, totalPages);
  if (heuristic.flatIndex.length === 0 && outline.length === 1) {
    // A single bookmark is better than nothing.
    return fromOutline(outline, totalPages);
  }
  return heuristic;
}
