// Smart PDF Engine — OCRService
//
// IMPORTANT (read before wiring this into anything user-facing):
// Recognizing the *contents* of a scanned image or diagram requires a real
// OCR/vision backend. This module does not call one — there is no network
// dependency baked into Smart PDF Engine by default. What it *can* do
// reliably, offline, is detect that a page contains an embedded image
// (via pdf.js's operator list), which is enough signal for DiagramDetector
// to flag "this page likely has a diagram" even when there's no caption.
//
// `OCRBackend` is the seam for plugging in real OCR/vision later (e.g. a
// new edge function calling a vision-capable model). Until one is wired up,
// `NullOCRBackend` is used and openly reports `available: false`.
import { loadPdfJs, type PdfDoc } from "@/lib/pdfjs";

export interface OCRResult {
  available: boolean;
  recognizedText: string | null;
}

export interface OCRBackend {
  readonly name: string;
  recognize(imageData: unknown): Promise<OCRResult>;
}

export const NullOCRBackend: OCRBackend = {
  name: "null",
  async recognize(): Promise<OCRResult> {
    return { available: false, recognizedText: null };
  },
};

let activeBackend: OCRBackend = NullOCRBackend;

/** Swap in a real OCR/vision backend at app startup. No-op by default. */
export function setOCRBackend(backend: OCRBackend): void {
  activeBackend = backend;
}

export function getOCRBackend(): OCRBackend {
  return activeBackend;
}

/**
 * Detect whether a page contains at least one embedded raster image
 * (paintImageXObject / paintInlineImageXObject in the page's operator list).
 * This is real signal pdf.js gives us for free — no OCR needed for presence
 * detection, only for reading what's *inside* the image.
 */
export async function pageHasEmbeddedImage(doc: PdfDoc, pageNumber: number): Promise<boolean> {
  try {
    const pdfjsLib = await loadPdfJs();
    const page = await doc.getPage(pageNumber);
    const opList = await page.getOperatorList();
    const OPS = pdfjsLib.OPS;
    const imageOps = new Set([OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageXObjectRepeat]);
    return (opList.fnArray as number[]).some((fn) => imageOps.has(fn));
  } catch {
    return false;
  }
}
