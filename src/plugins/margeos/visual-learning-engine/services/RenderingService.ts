// @ts-nocheck
// Visual Learning Engine — Rendering Service
// Provides rendering utilities and canvas operations

import { RenderingEngine } from "../core/RenderingEngine";
import type { Diagram } from "../models/Diagram";
import type { MindMap } from "../models/MindMap";
import type { ConceptMap } from "../models/MindMap";
import type { Flowchart } from "../models/MindMap";

export type RenderFormat = "svg" | "canvas" | "png" | "webp";

export interface RenderOptions {
  format?: RenderFormat;
  quality?: number; // 0-1 for lossy formats
  scale?: number;
  backgroundColor?: string;
  padding?: number;
  includeMetadata?: boolean;
}

export interface RenderResult {
  content: string | Blob;
  format: RenderFormat;
  width: number;
  height: number;
  size: number;
}

export class RenderingService {
  private renderingEngine: RenderingEngine;
  private canvasCache: Map<string, HTMLCanvasElement> = new Map();

  constructor() {
    this.renderingEngine = new RenderingEngine();
  }

  /**
   * Render diagram to specified format
   */
  async renderDiagram(diagram: Diagram, options?: RenderOptions): Promise<RenderResult> {
    const format = options?.format || "svg";
    const svg = await this.renderingEngine.renderDiagramToSvg(diagram);

    switch (format) {
      case "svg":
        return {
          content: svg,
          format: "svg",
          width: diagram.width,
          height: diagram.height,
          size: svg.length
        };
      case "canvas":
        return await this.svgToCanvas(svg, diagram.width, diagram.height, options);
      case "png":
      case "webp":
        const canvas = await this.svgToCanvas(svg, diagram.width, diagram.height, options);
        const blob = await this.canvasToBlob(canvas.content as HTMLCanvasElement, format, options?.quality);
        return {
          content: blob,
          format,
          width: diagram.width,
          height: diagram.height,
          size: blob.size
        };
      default:
        return {
          content: svg,
          format: "svg",
          width: diagram.width,
          height: diagram.height,
          size: svg.length
        };
    }
  }

  /**
   * Render mind map to SVG
   */
  async renderMindMap(mindMap: MindMap, options?: RenderOptions): Promise<RenderResult> {
    const format = options?.format || "svg";
    const svg = await this.renderingEngine.renderMindMapToSvg(mindMap);
    const width = mindMap.width || 800;
    const height = mindMap.height || 600;

    switch (format) {
      case "svg":
        return {
          content: svg,
          format: "svg",
          width,
          height,
          size: svg.length
        };
      case "canvas":
        return await this.svgToCanvas(svg, width, height, options);
      case "png":
      case "webp":
        const canvas = await this.svgToCanvas(svg, width, height, options);
        const blob = await this.canvasToBlob(canvas.content as HTMLCanvasElement, format, options?.quality);
        return {
          content: blob,
          format,
          width,
          height,
          size: blob.size
        };
      default:
        return {
          content: svg,
          format: "svg",
          width,
          height,
          size: svg.length
        };
    }
  }

  /**
   * Render concept map to SVG
   */
  async renderConceptMap(conceptMap: ConceptMap, options?: RenderOptions): Promise<RenderResult> {
    const format = options?.format || "svg";
    const svg = await this.renderingEngine.renderConceptMapToSvg(conceptMap);
    const width = conceptMap.bounds.width || 800;
    const height = conceptMap.bounds.height || 600;

    switch (format) {
      case "svg":
        return {
          content: svg,
          format: "svg",
          width,
          height,
          size: svg.length
        };
      case "canvas":
        return await this.svgToCanvas(svg, width, height, options);
      case "png":
      case "webp":
        const canvas = await this.svgToCanvas(svg, width, height, options);
        const blob = await this.canvasToBlob(canvas.content as HTMLCanvasElement, format, options?.quality);
        return {
          content: blob,
          format,
          width,
          height,
          size: blob.size
        };
      default:
        return {
          content: svg,
          format: "svg",
          width,
          height,
          size: svg.length
        };
    }
  }

  /**
   * Render flowchart to SVG
   */
  async renderFlowchart(flowchart: Flowchart, options?: RenderOptions): Promise<RenderResult> {
    const format = options?.format || "svg";
    const svg = await this.renderingEngine.renderFlowchartToSvg(flowchart);
    const width = flowchart.bounds.width || 600;
    const height = flowchart.bounds.height || 800;

    switch (format) {
      case "svg":
        return {
          content: svg,
          format: "svg",
          width,
          height,
          size: svg.length
        };
      case "canvas":
        return await this.svgToCanvas(svg, width, height, options);
      case "png":
      case "webp":
        const canvas = await this.svgToCanvas(svg, width, height, options);
        const blob = await this.canvasToBlob(canvas.content as HTMLCanvasElement, format, options?.quality);
        return {
          content: blob,
          format,
          width,
          height,
          size: blob.size
        };
      default:
        return {
          content: svg,
          format: "svg",
          width,
          height,
          size: svg.length
        };
    }
  }

  /**
   * Convert SVG to Canvas
   */
  private async svgToCanvas(
    svg: string,
    width: number,
    height: number,
    options?: RenderOptions
  ): Promise<RenderResult> {
    return new Promise((resolve, reject) => {
      const scale = options?.scale || 1;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const img = new Image();
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        if (options?.backgroundColor) {
          ctx.fillStyle = options.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        resolve({
          content: canvas,
          format: "canvas",
          width,
          height,
          size: canvas.toDataURL().length
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load SVG"));
      };

      img.src = url;
    });
  }

  /**
   * Convert Canvas to Blob
   */
  private async canvasToBlob(
    canvas: HTMLCanvasElement,
    format: "png" | "webp",
    quality: number = 0.92
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        `image/${format}`,
        quality
      );
    });
  }

  /**
   * Download rendered content
   */
  async download(renderResult: RenderResult, filename: string): Promise<void> {
    if (renderResult.format === "svg") {
      const blob = new Blob([renderResult.content as string], { type: "image/svg+xml" });
      this.downloadBlob(blob, `${filename}.svg`);
    } else if (renderResult.format === "canvas") {
      const canvas = renderResult.content as HTMLCanvasElement;
      canvas.toBlob((blob) => {
        if (blob) this.downloadBlob(blob, `${filename}.png`);
      });
    } else {
      this.downloadBlob(renderResult.content as Blob, `${filename}.${renderResult.format}`);
    }
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clear canvas cache
   */
  clearCache(): void {
    this.canvasCache.clear();
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): RenderFormat[] {
    return ["svg", "canvas", "png", "webp"];
  }
}

// Export singleton instance
export const renderingService = new RenderingService();
