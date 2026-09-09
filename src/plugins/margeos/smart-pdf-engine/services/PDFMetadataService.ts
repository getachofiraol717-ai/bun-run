// Smart PDF Engine — PDFMetadataService
// Extracts document metadata (title/author) via pdf.js when available, and
// derives a stable documentId used as the cache key throughout the engine.
import type { PdfDoc } from "@/lib/pdfjs";

export interface RawMetadata {
  title: string | null;
  author: string | null;
}

/** Best-effort metadata read — pdf.js exposes getMetadata() on the underlying document proxy. */
export async function readMetadata(doc: PdfDoc): Promise<RawMetadata> {
  try {
    const anyDoc = doc as unknown as { getMetadata?: () => Promise<{ info?: Record<string, unknown> }> };
    if (typeof anyDoc.getMetadata !== "function") return { title: null, author: null };
    const meta = await anyDoc.getMetadata();
    const info = meta?.info ?? {};
    return {
      title: typeof info.Title === "string" && info.Title.trim() ? info.Title.trim() : null,
      author: typeof info.Author === "string" && info.Author.trim() ? info.Author.trim() : null,
    };
  } catch {
    return { title: null, author: null };
  }
}

/** Small, fast, deterministic string hash (FNV-1a) — good enough for a cache key, no crypto needed. */
function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Derive a stable documentId for caching from a source identifier (URL,
 * blob URL, or filename) plus page count. Two different PDFs are extremely
 * unlikely to collide; the same PDF reloaded produces the same id, which is
 * exactly what the cache layer needs.
 */
export function deriveDocumentId(source: string, numPages: number): string {
  return `pdf-${hashString(source)}-${numPages}`;
}
