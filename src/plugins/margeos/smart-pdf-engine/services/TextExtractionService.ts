// Smart PDF Engine — TextExtractionService
// Wraps the project's existing pdf.js loader (@/lib/pdfjs) rather than
// re-implementing PDF parsing. Adds: chunked extraction with progress
// reporting and cooperative yielding so 300–1000 page documents don't
// freeze the UI thread (Feature 10 — performance).
import { extractPageText, type PdfDoc } from "@/lib/pdfjs";

export interface PageText {
  page: number;
  text: string;
}

export interface ExtractionOptions {
  /** Yield to the event loop after this many pages (keeps the UI responsive). */
  yieldEvery?: number;
  onProgress?: (pagesProcessed: number, totalPages: number) => void;
  signal?: AbortSignal;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Extract text for every page of the document, yielding control to the main
 * thread periodically so large documents don't block rendering/input.
 */
export async function extractAllPages(doc: PdfDoc, opts: ExtractionOptions = {}): Promise<PageText[]> {
  const yieldEvery = opts.yieldEvery ?? 10;
  const out: PageText[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    if (opts.signal?.aborted) break;
    const text = await extractPageText(doc, p);
    out.push({ page: p, text });
    opts.onProgress?.(p, doc.numPages);
    if (p % yieldEvery === 0) await yieldToMain();
  }
  return out;
}

/** Total word count across already-extracted pages (used for metadata + reading-time estimates). */
export function countWords(pages: PageText[]): number {
  return pages.reduce((sum, p) => sum + (p.text.match(/\S+/g)?.length ?? 0), 0);
}

/** Split a page's text into heuristic "lines" — pdf.js text content has no real line breaks,
 * so this re-splits on multiple spaces / vertical-tab-ish gaps that pdf.js sometimes inserts,
 * falling back to sentence-ish boundaries for dense paragraphs. */
export function pseudoLines(text: string): string[] {
  if (!text) return [];
  const bySpacing = text.split(/ {2,}|\u00a0{2,}/).map((s) => s.trim()).filter(Boolean);
  if (bySpacing.length > 1) return bySpacing;
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((s) => s.trim()).filter(Boolean);
}

// ── Positioned (real) lines ──────────────────────────────────────
// extractPageText() above collapses every whitespace run to a single space,
// which destroys real line breaks — fine for AI context/search, but useless
// for heading/layout detection. When that matters (ChapterDetector,
// TableDetector), pull raw text items with their real (x, y) position and
// reconstruct genuine visual lines by clustering on y-coordinate instead.
export interface PositionedLine {
  y: number;
  text: string;
}

export async function extractPositionedLines(doc: PdfDoc, pageNumber: number, yTolerance = 3): Promise<PositionedLine[]> {
  try {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const items = (content.items as { str: string; transform: number[] }[])
      .filter((it) => it.str.trim())
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));
    if (items.length === 0) return [];

    const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
    const rows: { y: number; items: typeof items }[] = [];
    for (const it of sorted) {
      const row = rows.find((r) => Math.abs(r.y - it.y) <= yTolerance);
      if (row) row.items.push(it);
      else rows.push({ y: it.y, items: [it] });
    }

    return rows
      .map((r) => ({
        y: r.y,
        text: [...r.items].sort((a, b) => a.x - b.x).map((i) => i.str).join(" ").replace(/\s+/g, " ").trim(),
      }))
      .filter((l) => l.text);
  } catch {
    return [];
  }
}
