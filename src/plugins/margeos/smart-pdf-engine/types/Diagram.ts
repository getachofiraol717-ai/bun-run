// Smart PDF Engine — Diagram types (Feature 5)
// True visual classification of a diagram's *contents* needs a vision model,
// which this offline-first module does not call out to (see OCRService.ts
// for the documented extension point). Detection here is caption- and
// layout-driven: it finds figures/diagrams via their captions and embedded
// image regions, which works for the large majority of real textbook PDFs.

export type DiagramType =
  | "flowchart"
  | "scientific_diagram"
  | "graph"
  | "process_chart"
  | "illustration"
  | "unknown";

export interface Diagram {
  id: string;
  diagramType: DiagramType;
  caption: string | null;
  pageNumber: number;
  relatedTopics: string[]; // Topic.id[]
  /** True if an embedded image XObject was actually found on the page (vs. caption-only inference). */
  hasEmbeddedImage: boolean;
  /** 0–1 confidence in the diagramType classification (caption-keyword based). */
  confidence: number;
}
