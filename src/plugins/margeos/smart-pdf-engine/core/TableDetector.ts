// Smart PDF Engine — TableDetector (Feature 6)
// Most table-detection approaches that only look at flattened text guess
// wildly at column boundaries. pdf.js exposes each text run's real (x, y)
// position via getTextContent(), so this detector clusters runs into rows
// by y-proximity and into cells by x-gap — a structurally honest approach
// that actually reflects the PDF's visual layout.
import type { PdfDoc } from "@/lib/pdfjs";
import { pseudoLines, type PageText } from "../services/TextExtractionService";
import type { PDFTable, TableType } from "../types/Table";

let tableCounter = 0;
function nextTableId(): string {
  tableCounter += 1;
  return `table-${tableCounter}`;
}

interface PositionedItem {
  str: string;
  x: number;
  y: number;
}

async function getPositionedItems(doc: PdfDoc, pageNumber: number): Promise<PositionedItem[]> {
  try {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    return (content.items as { str: string; transform: number[] }[])
      .filter((it) => it.str.trim())
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));
  } catch {
    return [];
  }
}

/** Group text runs into visual rows (same baseline ± tolerance), top-to-bottom. */
function groupIntoRows(items: PositionedItem[], yTolerance = 3): PositionedItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: PositionedItem[][] = [];
  for (const item of sorted) {
    const row = rows.find((r) => Math.abs(r[0].y - item.y) <= yTolerance);
    if (row) row.push(item);
    else rows.push([item]);
  }
  for (const row of rows) row.sort((a, b) => a.x - b.x);
  return rows;
}

/** Merge a row's runs into cells: a big horizontal gap means a new column; a small gap is just word-spacing. */
function rowToCells(row: PositionedItem[], xGapThreshold = 12): string[] {
  if (row.length === 0) return [];
  const cells: string[] = [row[0].str];
  for (let i = 1; i < row.length; i++) {
    const gap = row[i].x - row[i - 1].x;
    if (gap > xGapThreshold) cells.push(row[i].str);
    else cells[cells.length - 1] += row[i].str;
  }
  return cells.map((c) => c.replace(/\s+/g, " ").trim()).filter(Boolean);
}

/** Cheap pre-filter so the positioned-item pass (a second getTextContent() call) only runs where it's likely to pay off.
 * Note: the shared extractPageText() (used to build PageText.text everywhere in this app) collapses all
 * whitespace runs to a single space, so a multi-space/column-spacing heuristic can never fire here — instead
 * this looks for an explicit "Table N:" caption, or a high density of short numeric tokens, which is a strong
 * and whitespace-independent signal that a row of data (prices, counts, percentages, scores…) is nearby. */
function pageLooksTabular(text: string): boolean {
  if (!text) return false;
  if (/\btable\s*\d*[:.\-]/i.test(text)) return true;
  const numericTokens = text.match(/\b\d+(\.\d+)?%?\b/g) ?? [];
  return numericTokens.length >= 8;
}

function classifyTable(caption: string | null, headers: string[]): TableType {
  const hay = `${caption ?? ""} ${headers.join(" ")}`.toLowerCase();
  if (/formula|equation/.test(hay)) return "formula_table";
  if (/vs\.?|compar/.test(hay)) return "comparison";
  if (/study|result|experiment|sample size|p-value/.test(hay)) return "research";
  return headers.length ? "data" : "unknown";
}

function findCaption(rows: string[][], blockStart: number): string | null {
  for (let i = Math.max(0, blockStart - 2); i < blockStart; i++) {
    const joined = rows[i]?.join(" ") ?? "";
    const m = joined.match(/table\s*\d*[:.\-–]?\s*(.*)$/i);
    if (m) return (m[1] || joined).trim() || null;
  }
  return null;
}

export interface TableDetectorOptions {
  pages: PageText[];
  doc: PdfDoc;
}

export async function detectTables(opts: TableDetectorOptions): Promise<PDFTable[]> {
  const out: PDFTable[] = [];

  for (const { page, text } of opts.pages) {
    if (!pageLooksTabular(text)) continue;

    const items = await getPositionedItems(opts.doc, page);
    if (items.length === 0) continue;
    const rowItems = groupIntoRows(items);
    const rows = rowItems.map((r) => rowToCells(r));

    // Walk rows looking for a run of >=3 consecutive rows with a stable (±1) cell count >=2 — a structural table.
    let i = 0;
    while (i < rows.length) {
      if (rows[i].length < 2) { i++; continue; }
      let j = i + 1;
      while (j < rows.length && rows[j].length >= 2 && Math.abs(rows[j].length - rows[i].length) <= 1) j++;
      const blockLen = j - i;
      if (blockLen >= 3) {
        const block = rows.slice(i, j);
        const looksLikeHeader = block[0].every((c) => c.length <= 24 && !/^\d+(\.\d+)?$/.test(c));
        const headers = looksLikeHeader ? block[0] : block[0].map((_, idx) => `Column ${idx + 1}`);
        const dataRows = looksLikeHeader ? block.slice(1) : block;
        const caption = findCaption(rows, i);
        out.push({
          id: nextTableId(),
          tableType: classifyTable(caption, headers),
          caption,
          pageNumber: page,
          headers,
          rows: dataRows,
          confidence: Math.min(0.9, 0.45 + blockLen * 0.08),
        });
        i = j;
      } else {
        i++;
      }
    }

    // Fallback: a "Table N:" caption with no detectable column structure still gets recorded (low confidence) —
    // better to surface "there's a table here, open the PDF to see it" than to silently drop it.
    if (!out.some((t) => t.pageNumber === page)) {
      const captionLine = pseudoLines(text).find((l) => /^table\s*\d*[:.\-–]/i.test(l));
      if (captionLine) {
        out.push({
          id: nextTableId(),
          tableType: "unknown",
          caption: captionLine.replace(/^table\s*\d*[:.\-–]?\s*/i, "").trim() || null,
          pageNumber: page,
          headers: [],
          rows: [],
          confidence: 0.3,
        });
      }
    }
  }

  return out;
}
