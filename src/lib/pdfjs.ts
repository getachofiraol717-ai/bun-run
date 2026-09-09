// ──────────────────────────────────────────────────────────────────
// pdf.js loader — loaded from CDN at runtime (no bundle bloat)
// Powers: text extraction (AI context), chapter outline, in-doc search
// ──────────────────────────────────────────────────────────────────

const PDFJS_VERSION = "4.0.379";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let loadingPromise: Promise<any> | null = null;

/** Lazily load pdf.js from CDN. Safe to call multiple times. */
export function loadPdfJs(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  const w = window as any;
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PDFJS_CDN}/pdf.min.js`;
    script.async = true;
    script.onload = () => {
      const lib = w.pdfjsLib;
      if (!lib) { reject(new Error("pdf.js failed to load")); return; }
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      resolve(lib);
    };
    script.onerror = () => reject(new Error("pdf.js failed to load from CDN"));
    document.head.appendChild(script);
  });
  return loadingPromise;
}

export interface PdfDoc {
  numPages: number;
  getPage: (n: number) => Promise<any>;
  getOutline: () => Promise<any>;
  getPageIndex: (ref: any) => Promise<number>;
  getDestination: (name: string) => Promise<any>;
}

/** Load a PDF document from a URL (works with blob: URLs too). */
export async function loadPdfDocument(url: string): Promise<PdfDoc> {
  const pdfjsLib = await loadPdfJs();
  const doc = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
  return doc;
}

/** Extract plain text from a single page (1-indexed). */
export async function extractPageText(doc: PdfDoc, pageNum: number): Promise<string> {
  try {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    return content.items.map((it: any) => it.str).join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

/** Extract text from a range of pages, concatenated with page markers. */
export async function extractPageRangeText(doc: PdfDoc, start: number, end: number, maxChars = 16000): Promise<string> {
  const parts: string[] = [];
  let total = 0;
  for (let p = start; p <= Math.min(end, doc.numPages); p++) {
    const text = await extractPageText(doc, p);
    if (!text) continue;
    const chunk = `[Page ${p}]\n${text}`;
    if (total + chunk.length > maxChars) {
      parts.push(chunk.slice(0, Math.max(0, maxChars - total)));
      break;
    }
    parts.push(chunk);
    total += chunk.length;
  }
  return parts.join("\n\n");
}

export interface OutlineEntry {
  title: string;
  pageNumber: number;
  depth: number;
}

/** Extract a flat chapter/section outline from PDF bookmarks. */
export async function extractOutline(doc: PdfDoc): Promise<OutlineEntry[]> {
  try {
    const outline = await doc.getOutline();
    if (!outline || !Array.isArray(outline)) return [];
    const flat: OutlineEntry[] = [];

    const walk = async (items: any[], depth: number) => {
      for (const item of items) {
        let pageNumber = 1;
        try {
          let dest = item.dest;
          if (typeof dest === "string") dest = await doc.getDestination(dest);
          const ref = Array.isArray(dest) ? dest[0] : null;
          if (ref) pageNumber = (await doc.getPageIndex(ref)) + 1;
        } catch { /* fall back to page 1 */ }
        flat.push({ title: String(item.title || "Untitled").trim(), pageNumber, depth });
        if (item.items?.length) await walk(item.items, depth + 1);
      }
    };
    await walk(outline, 0);
    return flat;
  } catch {
    return [];
  }
}

export interface SearchHit {
  page: number;
  snippet: string;
}

/**
 * Search across all pages for a term. Extracts text lazily and caches it.
 * `cache` is a mutable map the caller maintains across searches for speed.
 */
export async function searchDocument(
  doc: PdfDoc,
  term: string,
  cache: Map<number, string>,
  maxResults = 30
): Promise<SearchHit[]> {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (let p = 1; p <= doc.numPages && hits.length < maxResults; p++) {
    let text = cache.get(p);
    if (text === undefined) {
      text = await extractPageText(doc, p);
      cache.set(p, text);
    }
    const lower = text.toLowerCase();
    let idx = lower.indexOf(q);
    while (idx !== -1 && hits.length < maxResults) {
      const start = Math.max(0, idx - 40);
      const end = Math.min(text.length, idx + q.length + 40);
      const snippet = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
      hits.push({ page: p, snippet });
      idx = lower.indexOf(q, idx + q.length);
    }
  }
  return hits;
}

/** Render a PDF page onto an HTMLCanvasElement with scaling. */
export async function renderPageToCanvas(
  doc: PdfDoc,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale = 1.5
): Promise<void> {
  try {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const renderContext = {
      canvasContext: canvas.getContext("2d"),
      viewport: viewport,
    };
    await page.render(renderContext).promise;
  } catch (e) {
    console.warn("Failed to render PDF page on canvas:", e);
    throw e;
  }
}
