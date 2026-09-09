// Smart PDF Engine — DiagramDetector (Feature 5)
import { pseudoLines, type PageText } from "../services/TextExtractionService";
import { pageHasEmbeddedImage } from "../services/OCRService";
import type { Diagram, DiagramType } from "../types/Diagram";
import type { Topic } from "../types/Topic";
import type { PdfDoc } from "@/lib/pdfjs";

let diagramCounter = 0;
function nextDiagramId(): string {
  diagramCounter += 1;
  return `diagram-${diagramCounter}`;
}

const CAPTION_RE = /^(figure|fig\.?|diagram|chart|illustration)\s*[\d.]*[:.\-–]?\s*(.*)$/i;

const TYPE_KEYWORDS: { type: DiagramType; words: RegExp }[] = [
  { type: "flowchart", words: /flow\s*chart|process\s*flow|workflow/i },
  { type: "process_chart", words: /process|steps?|cycle/i },
  { type: "graph", words: /graph|plot|axis|curve/i },
  { type: "scientific_diagram", words: /diagram|cell|anatomy|structure|circuit|reaction/i },
];

function classifyCaption(caption: string): { type: DiagramType; confidence: number } {
  for (const { type, words } of TYPE_KEYWORDS) {
    if (words.test(caption)) return { type, confidence: 0.7 };
  }
  return { type: "illustration", confidence: 0.4 };
}

/** Topics whose label appears in the caption — cheap relevance link, refined later by the knowledge graph. */
function relatedTopicIds(caption: string, topics: Topic[]): string[] {
  const lower = caption.toLowerCase();
  return topics.filter((t) => lower.includes(t.label.toLowerCase())).map((t) => t.id).slice(0, 5);
}

export interface DiagramDetectorOptions {
  pages: PageText[];
  doc: PdfDoc;
  topics: Topic[];
  /** Skip the (slightly more expensive) embedded-image confirmation above this many caption hits, to stay fast on huge documents. */
  maxImageChecks?: number;
}

export async function detectDiagrams(opts: DiagramDetectorOptions): Promise<Diagram[]> {
  const out: Diagram[] = [];
  const maxImageChecks = opts.maxImageChecks ?? 150;
  let imageChecks = 0;
  const imageCheckCache = new Map<number, boolean>();

  for (const { page, text } of opts.pages) {
    if (!text) continue;
    for (const line of pseudoLines(text)) {
      const m = line.match(CAPTION_RE);
      if (!m) continue;
      const caption = (m[2] || m[0]).trim();
      const { type, confidence } = classifyCaption(caption);

      let hasEmbeddedImage = imageCheckCache.get(page) ?? false;
      if (!imageCheckCache.has(page) && imageChecks < maxImageChecks) {
        hasEmbeddedImage = await pageHasEmbeddedImage(opts.doc, page);
        imageCheckCache.set(page, hasEmbeddedImage);
        imageChecks += 1;
      }

      out.push({
        id: nextDiagramId(),
        diagramType: type,
        caption: caption || null,
        pageNumber: page,
        relatedTopics: relatedTopicIds(caption, opts.topics),
        hasEmbeddedImage,
        confidence,
      });
    }
  }

  return out;
}
