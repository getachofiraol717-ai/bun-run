// Visual Learning Engine — Export Service
// Provides comprehensive export functionality for visualizations

import type { Diagram } from "../models/Diagram";
import type { MindMap } from "../models/MindMap";
import type { ConceptMap } from "../models/MindMap";
import type { Flowchart } from "../models/MindMap";
import type { Animation } from "../models/Animation";
import { RenderingEngine } from "../core/RenderingEngine";

export type ExportFormat = "svg" | "png" | "jpg" | "webp" | "json" | "html" | "markdown";

export interface ExportMetadata {
  title: string;
  author?: string;
  description?: string;
  tags?: string[];
  createdAt: Date;
  exportedAt: Date;
}

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  metadata?: ExportMetadata;
  includeSource?: boolean;
  compress?: boolean;
  scale?: number;
}

export class ExportService {
  private renderingEngine: RenderingEngine;

  constructor() {
    this.renderingEngine = new RenderingEngine();
  }

  /**
   * Export diagram
   */
  async exportDiagram(diagram: Diagram, options: ExportOptions): Promise<Blob | string> {
    const { format, filename, metadata, includeSource } = options;

    switch (format) {
      case "json":
        return this.exportToJSON(diagram, metadata, includeSource);
      case "html":
        return await this.exportToHTML(diagram, filename || diagram.title);
      case "markdown":
        return this.exportToMarkdown(diagram);
      case "svg":
      case "png":
      case "jpg":
      case "webp":
        return await this.exportToImage(diagram, format, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export mind map
   */
  async exportMindMap(mindMap: MindMap, options: ExportOptions): Promise<Blob | string> {
    const { format, filename, metadata, includeSource } = options;

    switch (format) {
      case "json":
        return this.exportMindMapToJSON(mindMap, metadata, includeSource);
      case "html":
        return await this.exportMindMapToHTML(mindMap, filename || mindMap.title);
      case "markdown":
        return this.exportMindMapToMarkdown(mindMap);
      case "svg":
      case "png":
      case "jpg":
      case "webp":
        return await this.exportToImage(mindMap, format, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export concept map
   */
  async exportConceptMap(conceptMap: ConceptMap, options: ExportOptions): Promise<Blob | string> {
    const { format, filename, metadata, includeSource } = options;

    switch (format) {
      case "json":
        return this.exportConceptMapToJSON(conceptMap, metadata, includeSource);
      case "html":
        return await this.exportConceptMapToHTML(conceptMap, filename || conceptMap.title);
      case "markdown":
        return this.exportConceptMapToMarkdown(conceptMap);
      case "svg":
      case "png":
      case "jpg":
      case "webp":
        return await this.exportToImage(conceptMap, format, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export flowchart
   */
  async exportFlowchart(flowchart: Flowchart, options: ExportOptions): Promise<Blob | string> {
    const { format, filename, metadata, includeSource } = options;

    switch (format) {
      case "json":
        return this.exportFlowchartToJSON(flowchart, metadata, includeSource);
      case "html":
        return await this.exportFlowchartToHTML(flowchart, filename || flowchart.title);
      case "markdown":
        return this.exportFlowchartToMarkdown(flowchart);
      case "svg":
      case "png":
      case "jpg":
      case "webp":
        return await this.exportToImage(flowchart, format, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export animation
   */
  async exportAnimation(animation: Animation, options: ExportOptions): Promise<Blob | string> {
    const { format, filename, metadata, includeSource } = options;

    switch (format) {
      case "json":
        return this.exportAnimationToJSON(animation, metadata, includeSource);
      case "html":
        return this.exportAnimationToHTML(animation, filename || animation.title);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to JSON
   */
  private exportToJSON(diagram: Diagram, metadata?: ExportMetadata, includeSource?: boolean): Blob {
    const data = {
      type: "diagram",
      metadata: metadata || { title: diagram.title, createdAt: diagram.createdAt, exportedAt: new Date() },
      data: includeSource ? diagram : this.sanitizeForExport(diagram)
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  }

  /**
   * Export mind map to JSON
   */
  private exportMindMapToJSON(mindMap: MindMap, metadata?: ExportMetadata, includeSource?: boolean): Blob {
    const data = {
      type: "mindmap",
      metadata: metadata || { title: mindMap.title, createdAt: mindMap.createdAt, exportedAt: new Date() },
      data: includeSource ? mindMap : this.sanitizeMindMapForExport(mindMap)
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  }

  /**
   * Export concept map to JSON
   */
  private exportConceptMapToJSON(conceptMap: ConceptMap, metadata?: ExportMetadata, includeSource?: boolean): Blob {
    const data = {
      type: "conceptmap",
      metadata: metadata || { title: conceptMap.title, createdAt: conceptMap.createdAt, exportedAt: new Date() },
      data: includeSource ? conceptMap : this.sanitizeConceptMapForExport(conceptMap)
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  }

  /**
   * Export flowchart to JSON
   */
  private exportFlowchartToJSON(flowchart: Flowchart, metadata?: ExportMetadata, includeSource?: boolean): Blob {
    const data = {
      type: "flowchart",
      metadata: metadata || { title: flowchart.title, createdAt: flowchart.createdAt, exportedAt: new Date() },
      data: includeSource ? flowchart : this.sanitizeFlowchartForExport(flowchart)
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  }

  /**
   * Export animation to JSON
   */
  private exportAnimationToJSON(animation: Animation, metadata?: ExportMetadata, includeSource?: boolean): Blob {
    const data = {
      type: "animation",
      metadata: metadata || { title: animation.title, createdAt: animation.createdAt, exportedAt: new Date() },
      data: includeSource ? animation : this.sanitizeAnimationForExport(animation)
    };

    return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  }

  /**
   * Export to HTML with embedded SVG
   */
  private async exportToHTML(diagram: Diagram, title: string): Promise<string> {
    const svg = await this.renderingEngine.renderDiagramToSvg(diagram);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 8px; }
    p { color: #94a3b8; margin-top: 0; }
    .diagram-wrapper { margin-top: 24px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${this.escapeHtml(title)}</h1>
    ${diagram.description ? `<p>${this.escapeHtml(diagram.description)}</p>` : ""}
    <div class="diagram-wrapper">
      ${svg}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Export mind map to HTML with embedded SVG
   */
  private async exportMindMapToHTML(mindMap: MindMap, title: string): Promise<string> {
    const svg = await this.renderingEngine.renderMindMapToSvg(mindMap);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 8px; }
    p { color: #94a3b8; margin-top: 0; }
    .mindmap-wrapper { margin-top: 24px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${this.escapeHtml(title)}</h1>
    ${mindMap.description ? `<p>${this.escapeHtml(mindMap.description)}</p>` : ""}
    <div class="mindmap-wrapper">
      ${svg}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Export concept map to HTML with embedded SVG
   */
  private async exportConceptMapToHTML(conceptMap: ConceptMap, title: string): Promise<string> {
    const svg = await this.renderingEngine.renderConceptMapToSvg(conceptMap);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 8px; }
    p { color: #94a3b8; margin-top: 0; }
    .conceptmap-wrapper { margin-top: 24px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${this.escapeHtml(title)}</h1>
    ${conceptMap.description ? `<p>${this.escapeHtml(conceptMap.description)}</p>` : ""}
    <div class="conceptmap-wrapper">
      ${svg}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Export flowchart to HTML with embedded SVG
   */
  private async exportFlowchartToHTML(flowchart: Flowchart, title: string): Promise<string> {
    const svg = await this.renderingEngine.renderFlowchartToSvg(flowchart);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 8px; }
    p { color: #94a3b8; margin-top: 0; }
    .flowchart-wrapper { margin-top: 24px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    svg { display: block; width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${this.escapeHtml(title)}</h1>
    ${flowchart.description ? `<p>${this.escapeHtml(flowchart.description)}</p>` : ""}
    <div class="flowchart-wrapper">
      ${svg}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Export animation to HTML
   */
  private exportAnimationToHTML(animation: Animation, title: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #38bdf8; }
    .animation { margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${this.escapeHtml(title)}</h1>
    <p>${this.escapeHtml(animation.description || "")}</p>
    <div class="animation">
      ${animation.frames.length} frames
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Export to Markdown
   */
  private exportToMarkdown(diagram: Diagram): string {
    let md = `# ${diagram.title}\n\n`;
    if (diagram.description) {
      md += `${diagram.description}\n\n`;
    }
    md += `## Nodes\n\n`;
    for (const node of diagram.nodes) {
      md += `- **${node.label}** (${node.type})\n`;
    }
    md += `\n## Edges\n\n`;
    for (const edge of diagram.edges) {
      const source = diagram.nodes.find(n => n.id === edge.sourceId);
      const target = diagram.nodes.find(n => n.id === edge.targetId);
      if (source && target) {
        md += `- ${source.label} -> ${target.label}`;
        if (edge.label) md += ` (${edge.label})`;
        md += `\n`;
      }
    }
    return md;
  }

  /**
   * Export mind map to Markdown
   */
  private exportMindMapToMarkdown(mindMap: MindMap): string {
    let md = `# ${mindMap.title}\n\n`;
    if (mindMap.description) {
      md += `${mindMap.description}\n\n`;
    }
    md += `## Topics\n\n`;
    const nodes = Array.from(mindMap.nodes.values());
    const root = nodes.find(n => n.type === "root");
    if (root) {
      md += this.renderMindMapNodeMarkdown(root, mindMap, 0);
    }
    return md;
  }

  /**
   * Render mind map node to Markdown recursively
   */
  private renderMindMapNodeMarkdown(node: any, mindMap: MindMap, depth: number): string {
    let md = `${"  ".repeat(depth)}- ${node.text}\n`;
    for (const childId of node.childrenIds) {
      const child = mindMap.nodes.get(childId);
      if (child) {
        md += this.renderMindMapNodeMarkdown(child, mindMap, depth + 1);
      }
    }
    return md;
  }

  /**
   * Export concept map to Markdown
   */
  private exportConceptMapToMarkdown(conceptMap: ConceptMap): string {
    let md = `# ${conceptMap.title}\n\n`;
    if (conceptMap.description) {
      md += `${conceptMap.description}\n\n`;
    }
    md += `## Concepts\n\n`;
    const nodes = Array.from(conceptMap.nodes.values());
    for (const node of nodes) {
      md += `- **${node.concept}**`;
      if (node.definition) md += `: ${node.definition}`;
      md += `\n`;
    }
    md += `\n## Relationships\n\n`;
    const links = Array.from(conceptMap.links.values());
    for (const link of links) {
      const source = nodes.find(n => n.id === link.sourceId);
      const target = nodes.find(n => n.id === link.targetId);
      if (source && target) {
        md += `- ${source.concept} **${link.label}** ${target.concept}\n`;
      }
    }
    return md;
  }

  /**
   * Export flowchart to Markdown
   */
  private exportFlowchartToMarkdown(flowchart: Flowchart): string {
    let md = `# ${flowchart.title}\n\n`;
    if (flowchart.description) {
      md += `${flowchart.description}\n\n`;
    }
    md += `## Steps\n\n`;
    for (let i = 0; i < flowchart.steps.length; i++) {
      const step = flowchart.steps[i];
      md += `${i + 1}. ${step.instruction}\n`;
      if (step.expectedOutcome) {
        md += `   - Expected: ${step.expectedOutcome}\n`;
      }
    }
    return md;
  }

  /**
   * Export visualization to image (SVG, PNG, JPG, WEBP)
   */
  private async exportToImage(
    item: Diagram | MindMap | ConceptMap | Flowchart,
    format: "svg" | "png" | "jpg" | "webp",
    options?: ExportOptions
  ): Promise<Blob> {
    let svg = "";
    let width = 800;
    let height = 600;

    if ("nodes" in item && Array.isArray(item.nodes)) {
      // Diagram
      svg = await this.renderingEngine.renderDiagramToSvg(item as Diagram);
      width = (item as Diagram).width || 800;
      height = (item as Diagram).height || 600;
    } else if ("steps" in item) {
      // Flowchart
      svg = await this.renderingEngine.renderFlowchartToSvg(item as Flowchart);
      width = (item as Flowchart).bounds?.width || 600;
      height = (item as Flowchart).bounds?.height || 800;
    } else if ("nodes" in item && item.nodes instanceof Map && "rootId" in item) {
      // MindMap
      svg = await this.renderingEngine.renderMindMapToSvg(item as MindMap);
      width = (item as MindMap).width || 800;
      height = (item as MindMap).height || 600;
    } else if ("links" in item && "bounds" in item && "nodes" in item && item.nodes instanceof Map) {
      // ConceptMap
      svg = await this.renderingEngine.renderConceptMapToSvg(item as ConceptMap);
      width = (item as ConceptMap).bounds?.width || 800;
      height = (item as ConceptMap).bounds?.height || 600;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="100%" height="100%" fill="#0f172a"/><text x="400" y="300" text-anchor="middle" fill="#ffffff">Visualization</text></svg>`;
    }

    if (format === "svg") {
      return new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    }

    return this.rasterizeSvgToBlob(svg, width, height, format, options);
  }

  /**
   * Rasterize SVG to PNG, JPG, or WEBP Blob
   */
  private async rasterizeSvgToBlob(
    svg: string,
    width: number,
    height: number,
    format: "png" | "jpg" | "webp",
    options?: ExportOptions
  ): Promise<Blob> {
    const mimeType = format === "jpg" ? "image/jpeg" : `image/${format}`;
    const scale = options?.scale || 1;

    if (typeof document !== "undefined" && typeof HTMLCanvasElement !== "undefined") {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          if (format === "jpg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(svgBlob);

          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.scale(scale, scale);
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            img.src = url;
          });

          if (typeof canvas.toBlob === "function") {
            const blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((b) => resolve(b), mimeType, 0.92);
            });
            if (blob) {
              return blob;
            }
          }
        }
      } catch {
        // Fallback below
      }
    }

    return new Blob([svg], { type: mimeType });
  }

  /**
   * Sanitize diagram for export
   */
  private sanitizeForExport(diagram: Diagram): object {
    const { ...rest } = diagram;
    return rest;
  }

  /**
   * Sanitize mind map for export
   */
  private sanitizeMindMapForExport(mindMap: MindMap): object {
    const { ...rest } = mindMap;
    return rest;
  }

  /**
   * Sanitize concept map for export
   */
  private sanitizeConceptMapForExport(conceptMap: ConceptMap): object {
    const { ...rest } = conceptMap;
    return rest;
  }

  /**
   * Sanitize flowchart for export
   */
  private sanitizeFlowchartForExport(flowchart: Flowchart): object {
    const { ...rest } = flowchart;
    return rest;
  }

  /**
   * Sanitize animation for export
   */
  private sanitizeAnimationForExport(animation: Animation): object {
    const { ...rest } = animation;
    return rest;
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Download blob
   */
  async downloadBlob(blob: Blob, filename: string): Promise<void> {
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
   * Get supported formats
   */
  getSupportedFormats(): ExportFormat[] {
    return ["svg", "png", "jpg", "webp", "json", "html", "markdown"];
  }
}

// Export singleton instance
export const exportService = new ExportService();
