// @ts-nocheck
// Visual Learning Engine — DiagramGenerator
// Feature 1: Auto Diagram Generation, Feature 6: Formula Visualization

import type { Diagram, DiagramNode, DiagramEdge, DiagramInput, DiagramOptions, DiagramType, VisualStyle } from "../models/Diagram";

export interface DiagramGenerationInput {
  type: DiagramType;
  title: string;
  sourceData: {
    concepts?: { name: string; definition?: string; related?: string[] }[];
    formulas?: { formula: string; variables: string[] }[];
    processes?: { step: string; inputs?: string[]; outputs?: string[] }[];
    relationships?: { source: string; target: string; type: string }[];
    hierarchies?: { parent: string; children: string[] }[];
    entities?: { name: string; type?: string; description?: string }[];
    connections?: { from: string; to: string; label?: string }[];
  };
  options?: DiagramOptions;
}

/**
 * Generates educational diagrams from structured data
 */
export class DiagramGenerator {
  private defaultStyle: VisualStyle;

  constructor() {
    this.defaultStyle = this.createDefaultStyle();
  }

  /**
   * Generate diagram from input data
   */
  async generate(input: DiagramInput, options?: DiagramOptions): Promise<Diagram> {
    const opts = { ...options };

    // Create diagram structure
    const diagram: Diagram = {
      id: `diagram_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: input.type,
      title: input.title,
      description: input.sourceData.concepts?.[0]?.definition,

      nodes: [],
      edges: [],

      sourceIds: [],
      conceptIds: [],

      style: opts.colorScheme ? this.styleFromColorScheme(opts.colorScheme) : this.defaultStyle,

      width: 800,
      height: 600,

      altText: "",
      ariaLabel: input.title,

      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Generate based on diagram type
    switch (input.type) {
      case "scientific":
        await this.generateScientificDiagram(diagram, input.sourceData);
        break;
      case "system":
        await this.generateSystemDiagram(diagram, input.sourceData);
        break;
      case "relationship":
        await this.generateRelationshipDiagram(diagram, input.sourceData);
        break;
      case "structural":
        await this.generateStructuralDiagram(diagram, input.sourceData);
        break;
      case "educational":
        await this.generateEducationalDiagram(diagram, input.sourceData);
        break;
      case "process":
        await this.generateProcessDiagram(diagram, input.sourceData);
        break;
      default:
        await this.generateRelationshipDiagram(diagram, input.sourceData);
    }

    // Generate accessibility text
    diagram.altText = this.generateAltText(diagram);
    diagram.ariaLabel = `${diagram.title}. ${diagram.nodes.length} elements.`;

    return diagram;
  }

  private async generateScientificDiagram(diagram: Diagram, data: DiagramInput["sourceData"]): Promise<void> {
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    // Add formula nodes
    if (data.formulas) {
      let y = 50;
      for (const formula of data.formulas.slice(0, 5)) {
        const formulaNode = this.createNode({
          label: formula.formula,
          type: "entity",
          x: 400,
          y: y + 60
        });
        nodes.push(formulaNode);

        // Add variable nodes
        let xOffset = 100;
        for (const variable of formula.variables.slice(0, 5)) {
          const varNode = this.createNode({
            label: variable,
            type: "value",
            x: xOffset,
            y: y
          });
          nodes.push(varNode);

          edges.push(this.createEdge({
            sourceId: formulaNode.id,
            targetId: varNode.id,
            label: "contains"
          }));

          xOffset += 150;
        }
        y += 150;
      }
    }

    diagram.nodes = nodes;
    diagram.edges = edges;
  }

  private async generateSystemDiagram(diagram: Diagram, data: DiagramInput["sourceData"]): Promise<void> {
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    // Create system components
    if (data.entities) {
      let y = 100;
      for (const entity of data.entities.slice(0, 6)) {
        const node = this.createNode({
          label: entity.name,
          type: "entity",
          x: 400,
          y
        });
        nodes.push(node);
        y += 100;
      }
    }

    // Create connections
    if (data.connections) {
      for (const conn of data.connections.slice(0, 10)) {
        const sourceNode = nodes.find(n => n.label === conn.from);
        const targetNode = nodes.find(n => n.label === conn.to);
        if (sourceNode && targetNode) {
          edges.push(this.createEdge({
            sourceId: sourceNode.id,
            targetId: targetNode.id,
            label: conn.label
          }));
        }
      }
    }

    diagram.nodes = nodes;
    diagram.edges = edges;
  }

  private async generateRelationshipDiagram(diagram: Diagram, data: DiagramInput["sourceData"]): Promise<void> {
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    // Create concept nodes
    if (data.concepts) {
      const conceptCount = data.concepts.length;
      const centerX = 400;
      const centerY = 300;
      const radius = Math.min(250, conceptCount * 30);

      for (let i = 0; i < Math.min(conceptCount, 20); i++) {
        const concept = data.concepts[i];
        const angle = (2 * Math.PI * i) / conceptCount;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const node = this.createNode({
          label: concept.name,
          type: "concept",
          x,
          y,
          content: concept.definition
        });
        nodes.push(node);

        // Connect related concepts
        if (concept.related) {
          for (const relatedName of concept.related.slice(0, 3)) {
            const relatedNode = nodes.find(n => n.label === relatedName);
            if (relatedNode) {
              edges.push(this.createEdge({
                sourceId: node.id,
                targetId: relatedNode.id,
                relationship: "related_to"
              }));
            }
          }
        }
      }
    }

    diagram.nodes = nodes;
    diagram.edges = edges;
  }

  private async generateStructuralDiagram(diagram: Diagram, data: DiagramInput["sourceData"]): Promise<void> {
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    // Create hierarchical structure
    if (data.hierarchies) {
      const levels = new Map<number, DiagramNode[]>();
      let currentLevel = 0;

      const processHierarchy = (parent: string, children: string[], level: number) => {
        const parentNode = nodes.find(n => n.label === parent) || this.createNode({
          label: parent,
          type: "group",
          x: 400,
          y: 50 + level * 100
        });

        if (!nodes.find(n => n.id === parentNode.id)) {
          nodes.push(parentNode);
        }

        const levelNodes = levels.get(level) || [];
        levelNodes.push(parentNode);
        levels.set(level, levelNodes);

        for (const child of children.slice(0, 5)) {
          const childNode = this.createNode({
            label: child,
            type: "entity",
            x: 0, // Will be positioned
            y: 50 + (level + 1) * 100
          });
          nodes.push(childNode);

          edges.push(this.createEdge({
            sourceId: parentNode.id,
            targetId: childNode.id,
            relationship: "part_of"
          }));
        }
      };

      for (const hierarchy of data.hierarchies) {
        processHierarchy(hierarchy.parent, hierarchy.children, currentLevel);
        currentLevel++;
      }

      // Position nodes by level
      for (const [level, levelNodes] of levels) {
        const spacing = 800 / (levelNodes.length + 1);
        levelNodes.forEach((node, index) => {
          node.x = spacing * (index + 1);
        });
      }
    }

    diagram.nodes = nodes;
    diagram.edges = edges;
  }

  private async generateEducationalDiagram(diagram: Diagram, data: DiagramInput["sourceData"]): Promise<void> {
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    // Create educational concept with examples
    if (data.concepts) {
      for (let i = 0; i < Math.min(data.concepts.length, 5); i++) {
        const concept = data.concepts[i];

        // Main concept node
        const conceptNode = this.createNode({
          label: concept.name,
          type: "concept",
          x: 400,
          y: 100 + i * 150
        });
        nodes.push(conceptNode);

        // Add definition as content
        if (concept.definition) {
          conceptNode.content = concept.definition;
          conceptNode.width = 300;
          conceptNode.height = 80;
        }

        // Add examples as child nodes
        if (concept.related && concept.related.length > 0) {
          const exampleSpacing = 200 / (concept.related.length + 1);
          for (let j = 0; j < Math.min(concept.related.length, 4); j++) {
            const exampleNode = this.createNode({
              label: concept.related[j],
              type: "entity",
              x: 200 + j * exampleSpacing * 2,
              y: 150 + i * 150
            });
            nodes.push(exampleNode);

            edges.push(this.createEdge({
              sourceId: conceptNode.id,
              targetId: exampleNode.id,
              relationship: "example_of"
            }));
          }
        }
      }
    }

    diagram.nodes = nodes;
    diagram.edges = edges;
  }

  private async generateProcessDiagram(diagram: Diagram, data: DiagramInput["sourceData"]): Promise<void> {
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    // Create process steps
    if (data.processes) {
      let y = 50;
      for (let i = 0; i < Math.min(data.processes.length, 8); i++) {
        const process = data.processes[i];

        const node = this.createNode({
          label: process.step,
          type: "process",
          x: 400,
          y: y + 60
        });
        nodes.push(node);

        // Add next connection
        if (i < data.processes.length - 1) {
          edges.push(this.createEdge({
            sourceId: node.id,
            targetId: nodes[nodes.length - 1]?.id || "",
            relationship: "flow"
          }));
        }

        y += 100;
      }
    }

    diagram.nodes = nodes;
    diagram.edges = edges;
  }

  private createNode(partial: Partial<DiagramNode> & { label: string; type: DiagramNode["type"]; x: number; y: number }): DiagramNode {
    return {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: partial.label,
      type: partial.type,
      x: partial.x,
      y: partial.y,
      width: 120,
      height: 60,
      childIds: [],
      ...partial
    };
  }

  private createEdge(partial: { sourceId: string; targetId: string; relationship?: string }): DiagramEdge {
    return {
      id: `edge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sourceId: partial.sourceId,
      targetId: partial.targetId,
      type: "direct",
      relationship: partial.relationship || "connects",
      label: partial.relationship
    };
  }

  private createDefaultStyle(): VisualStyle {
    return {
      colorScheme: {
        primary: "#3B82F6",
        secondary: "#8B5CF6",
        accent: "#10B981",
        background: "#FFFFFF",
        text: "#1F2937",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        nodes: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"]
      },
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 14,
      backgroundColor: "#FFFFFF",
      nodeStyle: {
        borderRadius: 8,
        borderWidth: 2,
        shadow: true,
        padding: 12,
        minWidth: 80,
        maxWidth: 200
      },
      edgeStyle: {
        strokeWidth: 2,
        strokeStyle: "solid",
        arrowHead: "arrow",
        labelPosition: 0.5
      }
    };
  }

  private styleFromColorScheme(scheme: any): VisualStyle {
    return {
      ...this.createDefaultStyle(),
      colorScheme: scheme
    };
  }

  private generateAltText(diagram: Diagram): string {
    const parts: string[] = [];
    parts.push(diagram.title);

    if (diagram.description) {
      parts.push(diagram.description);
    }

    parts.push(`${diagram.nodes.length} nodes connected by ${diagram.edges.length} relationships.`);

    const concepts = diagram.nodes.filter(n => n.type === "concept").map(n => n.label);
    if (concepts.length > 0) {
      parts.push(`Main concepts: ${concepts.slice(0, 5).join(", ")}${concepts.length > 5 ? "..." : ""}`);
    }

    return parts.join(". ");
  }
}
