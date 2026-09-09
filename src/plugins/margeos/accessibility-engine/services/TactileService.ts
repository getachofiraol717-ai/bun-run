// @ts-nocheck
// Accessibility Engine — Tactile Service
// Manages tactile content and braille translation

import type { AccessibilityProfile } from "../models/AccessibilityProfile";
import { brailleTranslationEngine } from "../deafblind-support/BrailleTranslationEngine";
import { brailleEngine } from "../deafblind-support/BrailleEngine";

export interface TactileContent {
  id: string;
  type: "text" | "braille" | "graphic" | "mixed";
  text: string;
  braille?: string;
  tactileData?: TactileGraphicData;
}

export interface TactileGraphicData {
  type: "svg" | "image" | "canvas";
  data: string;
  dimensions: { width: number; height: number };
  elements?: TactileElement[];
}

export interface TactileElement {
  type: "circle" | "rect" | "line" | "path" | "text" | "braille";
  attributes: Record<string, string | number>;
  content?: string;
}

export class TactileService {
  private static instance: TactileService;
  private profile: AccessibilityProfile | null = null;
  private contentLibrary: Map<string, TactileContent> = new Map();
  private listeners: Set<(content: TactileContent | null) => void> = new Set();

  private constructor() {}

  static getInstance(): TactileService {
    if (!TactileService.instance) {
      TactileService.instance = new TactileService();
    }
    return TactileService.instance;
  }

  initialize(profile: AccessibilityProfile | null): void {
    this.profile = profile;
    brailleTranslationEngine.initialize({ profile, settings: {} });
    brailleEngine.initialize({ profile, settings: {} });
  }

  isAvailable(): boolean {
    return typeof window !== "undefined";
  }

  // Convert text to tactile content
  createTactileContent(text: string, options?: {
    includeBraille?: boolean;
    grade?: 1 | 2;
    format?: "text" | "braille" | "mixed";
  }): TactileContent {
    const grade = options?.grade || this.profile?.deafblind?.brailleGrade || 1;
    const format = options?.format || (options?.includeBraille ? "mixed" : "text");

    const content: TactileContent = {
      id: `tactile-${Date.now()}`,
      type: format as TactileContent["type"],
      text
    };

    if (format === "braille" || format === "mixed") {
      const result = brailleTranslationEngine.translate(text, { grade });
      content.braille = result.braille;
    }

    this.contentLibrary.set(content.id, content);
    return content;
  }

  // Generate tactile graphic from data
  createTactileGraphic(elements: TactileElement[], options?: {
    width?: number;
    height?: number;
    includeLabels?: boolean;
  }): TactileGraphicData {
    const width = options?.width || 200;
    const height = options?.height || 200;

    return {
      type: "svg",
      data: this.generateSVG(elements, width, height),
      dimensions: { width, height },
      elements
    };
  }

  private generateSVG(elements: TactileElement[], width: number, height: number): string {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
    svg += `<rect width="${width}" height="${height}" fill="white" stroke="black" stroke-width="2"/>`;

    for (const element of elements) {
      switch (element.type) {
        case "circle":
          svg += `<circle
            cx="${element.attributes.cx || 0}"
            cy="${element.attributes.cy || 0}"
            r="${element.attributes.r || 10}"
            fill="${element.attributes.fill || "none"}"
            stroke="${element.attributes.stroke || "black"}"
            stroke-width="${element.attributes.strokeWidth || 2}"
          />`;
          break;
        case "rect":
          svg += `<rect
            x="${element.attributes.x || 0}"
            y="${element.attributes.y || 0}"
            width="${element.attributes.width || 50}"
            height="${element.attributes.height || 50}"
            fill="${element.attributes.fill || "none"}"
            stroke="${element.attributes.stroke || "black"}"
            stroke-width="${element.attributes.strokeWidth || 2}"
          />`;
          break;
        case "line":
          svg += `<line
            x1="${element.attributes.x1 || 0}"
            y1="${element.attributes.y1 || 0}"
            x2="${element.attributes.x2 || 100}"
            y2="${element.attributes.y2 || 100}"
            stroke="${element.attributes.stroke || "black"}"
            stroke-width="${element.attributes.strokeWidth || 2}"
          />`;
          break;
        case "text":
          svg += `<text
            x="${element.attributes.x || 0}"
            y="${element.attributes.y || 20}"
            font-size="${element.attributes.fontSize || 14}"
          >${element.content || ""}</text>`;
          break;
        case "braille":
          svg += `<text
            x="${element.attributes.x || 0}"
            y="${element.attributes.y || 20}"
            font-family="monospace"
            font-size="${element.attributes.fontSize || 16}"
          >${element.content || ""}</text>`;
          break;
      }
    }

    svg += `</svg>`;
    return svg;
  }

  // Create diagram as tactile
  createTactileDiagram(data: {
    nodes: { id: string; label: string; x: number; y: number; shape?: "circle" | "rect" }[];
    edges: { from: string; to: string }[];
  }): TactileGraphicData {
    const elements: TactileElement[] = [];
    const nodeMap = new Map(data.nodes.map(n => [n.id, n]));

    // Add nodes
    for (const node of data.nodes) {
      if (node.shape === "circle") {
        elements.push({
          type: "circle",
          attributes: { cx: node.x, cy: node.y, r: 25, stroke: "black", strokeWidth: 2 }
        });
      } else {
        elements.push({
          type: "rect",
          attributes: { x: node.x - 30, y: node.y - 15, width: 60, height: 30, stroke: "black", strokeWidth: 2 }
        });
      }

      elements.push({
        type: "text",
        attributes: { x: node.x, y: node.y + 4 },
        content: node.label
      });
    }

    // Add edges
    for (const edge of data.edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);

      if (from && to) {
        elements.push({
          type: "line",
          attributes: { x1: from.x, y1: from.y, x2: to.x, y2: to.y, stroke: "black", strokeWidth: 2 }
        });
      }
    }

    return this.createTactileGraphic(elements, { width: 400, height: 300 });
  }

  // Create chart as tactile
  createTactileChart(data: {
    type: "bar" | "line" | "pie";
    labels: string[];
    values: number[];
    title?: string;
  }): TactileGraphicData {
    const elements: TactileElement[] = [];
    const width = 400;
    const height = 300;
    const chartHeight = 200;
    const chartTop = 50;

    // Add title
    if (data.title) {
      elements.push({
        type: "text",
        attributes: { x: width / 2, y: 25 },
        content: data.title
      });
    }

    if (data.type === "bar") {
      const barWidth = Math.min(50, (width - 60) / data.values.length - 10);
      const maxValue = Math.max(...data.values);
      let x = 30;

      for (let i = 0; i < data.values.length; i++) {
        const barHeight = (data.values[i] / maxValue) * chartHeight;
        const y = chartTop + chartHeight - barHeight;

        elements.push({
          type: "rect",
          attributes: { x, y, width: barWidth, height: barHeight, stroke: "black", strokeWidth: 2 }
        });

        // Label below bar
        elements.push({
          type: "text",
          attributes: { x: x + barWidth / 2, y: chartTop + chartHeight + 20 },
          content: data.labels[i]
        });

        x += barWidth + 10;
      }

      // Axis
      elements.push({
        type: "line",
        attributes: { x1: 20, y1: chartTop, x2: 20, y2: chartTop + chartHeight, stroke: "black", strokeWidth: 2 }
      });
      elements.push({
        type: "line",
        attributes: { x1: 20, y1: chartTop + chartHeight, x2: width - 20, y2: chartTop + chartHeight, stroke: "black", strokeWidth: 2 }
      });
    }

    return this.createTactileGraphic(elements, { width, height });
  }

  // Set active content
  setActiveContent(content: TactileContent | null): void {
    this.notifyListeners(content);
  }

  // Get content from library
  getContent(id: string): TactileContent | undefined {
    return this.contentLibrary.get(id);
  }

  // Get all content
  getAllContent(): TactileContent[] {
    return Array.from(this.contentLibrary.values());
  }

  // Add to library
  addToLibrary(content: TactileContent): void {
    this.contentLibrary.set(content.id, content);
  }

  // Remove from library
  removeFromLibrary(id: string): void {
    this.contentLibrary.delete(id);
  }

  // Subscribe to changes
  subscribe(listener: (content: TactileContent | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(content: TactileContent | null): void {
    for (const listener of this.listeners) {
      listener(content);
    }
  }

  // Cleanup
  destroy(): void {
    this.contentLibrary.clear();
    this.listeners.clear();
  }
}

export const tactileService = TactileService.getInstance();
