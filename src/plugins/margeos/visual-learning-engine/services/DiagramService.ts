// @ts-nocheck
// Visual Learning Engine — Diagram Service
// Provides diagram operations and management

import { DiagramGenerator } from "../core/DiagramGenerator";
import { LayoutEngine } from "../core/LayoutEngine";
import { RenderingEngine } from "../core/RenderingEngine";
import type { Diagram, DiagramInput, DiagramOptions, DiagramType } from "../models/Diagram";

export interface DiagramMetadata {
  id: string;
  type: DiagramType;
  title: string;
  nodeCount: number;
  edgeCount: number;
  complexity: "simple" | "moderate" | "complex";
  generatedAt: Date;
  cached: boolean;
}

export class DiagramService {
  private diagramGenerator: DiagramGenerator;
  private layoutEngine: LayoutEngine;
  private renderingEngine: RenderingEngine;

  constructor() {
    this.diagramGenerator = new DiagramGenerator();
    this.layoutEngine = new LayoutEngine();
    this.renderingEngine = new RenderingEngine();
  }

  /**
   * Create a diagram from input data
   */
  async createDiagram(input: DiagramInput, options?: DiagramOptions): Promise<Diagram> {
    const diagram = await this.diagramGenerator.generate(input, options);
    await this.layoutEngine.applyLayout(diagram, options?.layout || "auto");
    return diagram;
  }

  /**
   * Render diagram to SVG string
   */
  async renderToSvg(diagram: Diagram): Promise<string> {
    return this.renderingEngine.renderDiagramToSvg(diagram);
  }

  /**
   * Get diagram metadata
   */
  getDiagramMetadata(diagram: Diagram): DiagramMetadata {
    const complexity = this.calculateComplexity(diagram.nodes.length, diagram.edges.length);

    return {
      id: diagram.id,
      type: diagram.type,
      title: diagram.title,
      nodeCount: diagram.nodes.length,
      edgeCount: diagram.edges.length,
      complexity,
      generatedAt: diagram.createdAt,
      cached: !!diagram.cachedAt
    };
  }

  /**
   * Calculate diagram complexity
   */
  private calculateComplexity(nodeCount: number, edgeCount: number): "simple" | "moderate" | "complex" {
    const score = nodeCount + edgeCount * 2;
    if (score < 10) return "simple";
    if (score < 30) return "moderate";
    return "complex";
  }

  /**
   * Update diagram node position
   */
  updateNodePosition(diagram: Diagram, nodeId: string, x: number, y: number): Diagram {
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      diagram.updatedAt = new Date();
    }
    return diagram;
  }

  /**
   * Update diagram node style
   */
  updateNodeStyle(diagram: Diagram, nodeId: string, style: Partial<DiagramNode>): Diagram {
    const node = diagram.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node, style);
      diagram.updatedAt = new Date();
    }
    return diagram;
  }

  /**
   * Add node to diagram
   */
  addNode(diagram: Diagram, node: DiagramNode): Diagram {
    diagram.nodes.push(node);
    diagram.updatedAt = new Date();
    return diagram;
  }

  /**
   * Remove node from diagram
   */
  removeNode(diagram: Diagram, nodeId: string): Diagram {
    diagram.nodes = diagram.nodes.filter(n => n.id !== nodeId);
    diagram.edges = diagram.edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId);
    diagram.updatedAt = new Date();
    return diagram;
  }

  /**
   * Add edge to diagram
   */
  addEdge(diagram: Diagram, edge: DiagramEdge): Diagram {
    diagram.edges.push(edge);
    diagram.updatedAt = new Date();
    return diagram;
  }

  /**
   * Remove edge from diagram
   */
  removeEdge(diagram: Diagram, edgeId: string): Diagram {
    diagram.edges = diagram.edges.filter(e => e.id !== edgeId);
    diagram.updatedAt = new Date();
    return diagram;
  }

  /**
   * Re-layout diagram
   */
  async relayoutDiagram(diagram: Diagram, layoutType: "hierarchical" | "force" | "circular" | "grid"): Promise<Diagram> {
    await this.layoutEngine.applyLayout(diagram, layoutType);
    diagram.updatedAt = new Date();
    return diagram;
  }

  /**
   * Get all diagram types
   */
  getDiagramTypes(): DiagramType[] {
    return ["scientific", "system", "relationship", "structural", "educational", "anatomical", "mechanical", "electrical", "chemical", "process"];
  }
}

// Import DiagramNode type
import type { DiagramNode, DiagramEdge } from "../models/Diagram";

// Export singleton instance
export const diagramService = new DiagramService();
