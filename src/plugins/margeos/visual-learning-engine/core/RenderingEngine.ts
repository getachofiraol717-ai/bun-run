// @ts-nocheck
// Visual Learning Engine — RenderingEngine
// Renders visualizations to SVG

import type { Diagram, DiagramNode, DiagramEdge } from "../models/Diagram";
import type { MindMap, MindMapNode } from "../models/MindMap";
import type { ConceptMap, ConceptMapNode } from "../models/MindMap";
import type { Flowchart, FlowchartNode } from "../models/MindMap";

/**
 * Renders visualizations to SVG format
 */
export class RenderingEngine {
  /**
   * Render diagram to SVG
   */
  async renderDiagramToSvg(diagram: Diagram): Promise<string> {
    const { width, height, style } = diagram;
    const nodes = diagram.nodes;
    const edges = diagram.edges;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${diagram.ariaLabel}">`;

    // Background
    svg += `<rect width="100%" height="100%" fill="${style.backgroundColor}"/>`;

    // Edges first (behind nodes)
    svg += `<g class="edges">`;
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.sourceId);
      const target = nodes.find(n => n.id === edge.targetId);
      if (!source || !target) continue;

      svg += this.renderEdge(source, target, edge);
    }
    svg += `</g>`;

    // Nodes
    svg += `<g class="nodes">`;
    for (const node of nodes) {
      svg += this.renderDiagramNode(node, style);
    }
    svg += `</g>`;

    svg += `</svg>`;
    return svg;
  }

  /**
   * Render single diagram node
   */
  private renderDiagramNode(node: DiagramNode, style: any): string {
    const { x, y, width, height, label, type, color } = node;
    const { nodeStyle, colorScheme } = style;

    const bgColor = color || colorScheme.nodes[0];
    const borderRadius = nodeStyle.borderRadius;

    let shape = `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="${borderRadius}" fill="${bgColor}" stroke="${style.text}" stroke-width="${nodeStyle.borderWidth}"/>`;

    let text = `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${style.fontFamily}" font-size="${style.fontSize}" fill="${style.text}">${this.escapeHtml(label)}</text>`;

    return `<g class="node" data-id="${node.id}">${shape}${text}</g>`;
  }

  /**
   * Render edge between nodes
   */
  private renderEdge(source: DiagramNode, target: DiagramNode, edge: DiagramEdge): string {
    const { type, style, label } = edge;

    let path = "";
    const sx = source.x;
    const sy = source.y;
    const tx = target.x;
    const ty = target.y;

    switch (type) {
      case "curved":
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        const cp1x = midX;
        const cp1y = sy;
        const cp2x = midX;
        const cp2y = ty;
        path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
        break;
      case "bezier":
        path = `M ${sx} ${sy} Q ${(sx + tx) / 2} ${sy} ${tx} ${ty}`;
        break;
      default:
        path = `M ${sx} ${sy} L ${tx} ${ty}`;
    }

    let svg = `<path d="${path}" fill="none" stroke="${style?.color || "#94A3B8"}" stroke-width="${style?.strokeWidth || 2}"`;

    if (edge.arrowHead) {
      svg += ` marker-end="url(#arrowhead)"`;
    }

    svg += `/>`;

    if (label) {
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;
      svg += `<text x="${midX}" y="${midY - 5}" text-anchor="middle" font-size="12" fill="#64748B">${this.escapeHtml(label)}</text>`;
    }

    return svg;
  }

  /**
   * Render mind map to SVG
   */
  async renderMindMapToSvg(mindMap: MindMap): Promise<string> {
    const { width = 800, height = 600 } = mindMap;
    const nodes = Array.from(mindMap.nodes.values());
    const { style } = mindMap;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${mindMap.ariaLabel}">`;

    // Background
    svg += `<rect width="100%" height="100%" fill="${style.backgroundColor}"/>`;

    // Arrow marker
    svg += `<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#CBD5E1"/></marker></defs>`;

    // Edges (lines from parent to children)
    svg += `<g class="edges">`;
    for (const node of nodes) {
      if (node.parentId) {
        const parent = mindMap.nodes.get(node.parentId);
        if (parent) {
          svg += `<line x1="${parent.x}" y1="${parent.y}" x2="${node.x}" y2="${node.y}" stroke="${style.lineColor}" stroke-width="${style.lineWidth}"/>`;
        }
      }
    }
    svg += `</g>`;

    // Nodes
    svg += `<g class="nodes">`;
    for (const node of nodes) {
      svg += this.renderMindMapNode(node, mindMap);
    }
    svg += `</g>`;

    svg += `</svg>`;
    return svg;
  }

  /**
   * Render mind map node
   */
  private renderMindMapNode(node: MindMapNode, mindMap: MindMap): string {
    const { x, y, width, height, text, type } = node;
    const { style } = mindMap;

    let bgColor: string;
    switch (type) {
      case "root":
        bgColor = style.rootColor;
        break;
      case "leaf":
        bgColor = style.leafColor;
        break;
      default:
        bgColor = style.branchColors[node.depth % style.branchColors.length];
    }

    const shape = `<ellipse cx="${x}" cy="${y}" rx="${width / 2}" ry="${height / 2}" fill="${bgColor}" stroke="${style.lineColor}" stroke-width="1"/>`;
    const textEl = `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${style.fontFamily}" font-size="${style.fontSize}" fill="white" font-weight="${type === "root" ? "bold" : "normal"}">${this.escapeHtml(text)}</text>`;

    return `<g class="node" data-id="${node.id}">${shape}${textEl}</g>`;
  }

  /**
   * Render concept map to SVG
   */
  async renderConceptMapToSvg(conceptMap: ConceptMap): Promise<string> {
    const { bounds, style } = conceptMap;
    const width = bounds.width || 800;
    const height = bounds.height || 600;
    const nodes = Array.from(conceptMap.nodes.values());
    const links = Array.from(conceptMap.links.values());

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${conceptMap.ariaLabel}">`;

    // Background
    svg += `<rect width="100%" height="100%" fill="${style.backgroundColor}"/>`;

    // Links
    svg += `<g class="links">`;
    for (const link of links) {
      const source = nodes.find(n => n.id === link.sourceId);
      const target = nodes.find(n => n.id === link.targetId);
      if (!source || !target) continue;

      svg += this.renderConceptLink(source, target, link);
    }
    svg += `</g>`;

    // Nodes
    svg += `<g class="nodes">`;
    for (const node of nodes) {
      svg += this.renderConceptNode(node, style);
    }
    svg += `</g>`;

    svg += `</svg>`;
    return svg;
  }

  /**
   * Render concept node
   */
  private renderConceptNode(node: ConceptMapNode, style: any): string {
    const { x, y, width, height, concept, shape, color, borderColor, faded } = node;

    let shapeEl: string;
    const opacity = faded ? 0.3 : 1;

    switch (shape) {
      case "ellipse":
        shapeEl = `<ellipse cx="${x}" cy="${y}" rx="${width / 2}" ry="${height / 2}" fill="${color}" stroke="${borderColor}" stroke-width="2" opacity="${opacity}"/>`;
        break;
      case "diamond":
        const points = `${x},${y - height / 2} ${x + width / 2},${y} ${x},${y + height / 2} ${x - width / 2},${y}`;
        shapeEl = `<polygon points="${points}" fill="${color}" stroke="${borderColor}" stroke-width="2" opacity="${opacity}"/>`;
        break;
      default:
        shapeEl = `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="8" fill="${color}" stroke="${borderColor}" stroke-width="2" opacity="${opacity}"/>`;
    }

    const text = `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${style.fontFamily}" font-size="${style.fontSize}" fill="#1F2937">${this.escapeHtml(concept)}</text>`;

    return `<g class="node" data-id="${node.id}">${shapeEl}${text}</g>`;
  }

  /**
   * Render concept link
   */
  private renderConceptLink(source: ConceptMapNode, target: ConceptMapNode, link: any): string {
    const sx = source.x;
    const sy = source.y;
    const tx = target.x;
    const ty = target.y;

    let dashArray = link.lineStyle === "dashed" ? "5,5" : link.lineStyle === "dotted" ? "2,2" : "";

    let svg = `<line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="${link.color}" stroke-width="${link.strength * 3}" stroke-dasharray="${dashArray}"`;

    if (link.arrowHead) {
      svg += ` marker-end="url(#arrow-${link.id})"/>`;
      svg += `<defs><marker id="arrow-${link.id}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${link.color}"/></marker></defs>`;
    } else {
      svg += `/>`;
    }

    if (link.label && link.label !== "related_to") {
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2 - 8;
      svg += `<text x="${midX}" y="${midY}" text-anchor="middle" font-size="11" fill="#64748B">${this.escapeHtml(link.label)}</text>`;
    }

    return svg;
  }

  /**
   * Render flowchart to SVG
   */
  async renderFlowchartToSvg(flowchart: Flowchart): Promise<string> {
    const { bounds, style } = flowchart;
    const width = bounds.width || 600;
    const height = bounds.height || 800;
    const nodes = Array.from(flowchart.nodes.values());

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${flowchart.ariaLabel}">`;

    // Background
    svg += `<rect width="100%" height="100%" fill="${style.backgroundColor}"/>`;

    // Links
    svg += `<g class="links">`;
    const links = Array.from(flowchart.links.values());
    for (const link of links) {
      const source = nodes.find(n => n.id === link.sourceId);
      const target = nodes.find(n => n.id === link.targetId);
      if (!source || !target) continue;

      svg += `<line x1="${source.x}" y1="${source.y + source.height / 2}" x2="${target.x}" y2="${target.y - target.height / 2}" stroke="${style.linkColor}" stroke-width="2" marker-end="url(#flow-arrow)"/>`;
    }
    svg += `</g>`;

    // Arrow marker
    svg += `<defs><marker id="flow-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="${style.linkColor}"/></marker></defs>`;

    // Nodes
    svg += `<g class="nodes">`;
    for (const node of nodes) {
      svg += this.renderFlowchartNode(node, style);
    }
    svg += `</g>`;

    svg += `</svg>`;
    return svg;
  }

  /**
   * Render flowchart node
   */
  private renderFlowchartNode(node: FlowchartNode, style: any): string {
    const { x, y, width, height, label, shape, color } = node;

    let shapeEl: string;

    switch (shape) {
      case "oval":
        shapeEl = `<ellipse cx="${x}" cy="${y}" rx="${width / 2}" ry="${height / 2}" fill="${color}" stroke="#374151" stroke-width="1"/>`;
        break;
      case "diamond":
        const points = `${x},${y - height / 2} ${x + width / 2},${y} ${x},${y + height / 2} ${x - width / 2},${y}`;
        shapeEl = `<polygon points="${points}" fill="${color}" stroke="#374151" stroke-width="1"/>`;
        break;
      case "parallelogram":
        const offset = 15;
        const paraPoints = `${x - width / 2 + offset},${y - height / 2} ${x + width / 2},${y - height / 2} ${x + width / 2 - offset},${y + height / 2} ${x - width / 2},${y + height / 2}`;
        shapeEl = `<polygon points="${paraPoints}" fill="${color}" stroke="#374151" stroke-width="1"/>`;
        break;
      default:
        shapeEl = `<rect x="${x - width / 2}" y="${y - height / 2}" width="${width}" height="${height}" rx="4" fill="${color}" stroke="#374151" stroke-width="1"/>`;
    }

    const text = `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${style.fontFamily}" font-size="${style.fontSize}" fill="white">${this.escapeHtml(label)}</text>`;

    return `<g class="node" data-id="${node.id}">${shapeEl}${text}</g>`;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text?: string | null): string {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
