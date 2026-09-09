// Visual Learning Engine — ConceptMapGenerator
// Feature 3: Concept Map Engine

import type { ConceptMap, ConceptMapNode, ConceptMapLink, ConceptMapLayout, ConceptRelationshipType } from "../models/MindMap";

export interface ConceptMapInput {
  title: string;
  concepts: {
    id: string;
    name: string;
    definition?: string;
    examples?: string[];
    importance?: number;
  }[];
  relationships: {
    source: string;
    target: string;
    label: string;
    type: ConceptRelationshipType;
  }[];
  options?: {
    layout?: "force" | "hierarchical" | "circular";
    centralConcept?: string;
    clustering?: boolean;
  };
}

/**
 * Generates concept maps from relationships
 */
export class ConceptMapGenerator {
  private defaultLayout: ConceptMapLayout;
  private relationshipColors: Record<ConceptRelationshipType, string>;

  constructor() {
    this.defaultLayout = {
      type: "force",
      spacing: 200,
      clustering: false
    };

    this.relationshipColors = {
      is_a: "#3B82F6",
      part_of: "#8B5CF6",
      related_to: "#94A3B8",
      causes: "#EF4444",
      depends_on: "#F59E0B",
      enables: "#10B981",
      contradicts: "#EC4899",
      similar_to: "#14B8A6",
      example_of: "#06B6D4",
      leads_to: "#F97316",
      requires: "#6366F1",
      produces: "#84CC16"
    };
  }

  /**
   * Generate concept map from input
   */
  async generate(input: ConceptMapInput): Promise<ConceptMap> {
    const options = input.options || {};

    const conceptMap: ConceptMap = {
      id: `conceptmap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: input.title,
      description: `Concept map showing ${input.concepts.length} concepts`,

      nodes: new Map(),
      links: new Map(),

      layout: { ...this.defaultLayout, type: options.layout || "force" },
      bounds: { x: 0, y: 0, width: 800, height: 600 },

      centralConceptId: options.centralConcept || input.concepts[0]?.id,
      focusConceptId: undefined,

      clusters: [],
      topics: [],

      style: this.createDefaultStyle(),

      sourceIds: [],
      topicId: undefined,

      ariaLabel: input.title,

      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create nodes
    for (const concept of input.concepts.slice(0, 50)) {
      const node = this.createNode({
        id: concept.id,
        concept: concept.name,
        definition: concept.definition,
        examples: concept.examples,
        importance: concept.importance || 0.5,
        x: 400 + (Math.random() - 0.5) * 200,
        y: 300 + (Math.random() - 0.5) * 200
      });
      conceptMap.nodes.set(node.id, node);
    }

    // Create links
    for (const rel of input.relationships.slice(0, 100)) {
      const sourceNode = conceptMap.nodes.get(rel.source);
      const targetNode = conceptMap.nodes.get(rel.target);

      if (sourceNode && targetNode) {
        const link = this.createLink({
          sourceId: rel.source,
          targetId: rel.target,
          label: rel.label,
          relationshipType: rel.type
        });
        conceptMap.links.set(link.id, link);

        // Add link reference to nodes
        sourceNode.links.push(rel.target);
        sourceNode.linkLabels.set(rel.target, rel.label);
        targetNode.links.push(rel.source);
      }
    }

    // Calculate bounds
    conceptMap.bounds = this.calculateBounds(conceptMap);

    return conceptMap;
  }

  private createNode(partial: Partial<ConceptMapNode> & { id: string; concept: string; x: number; y: number }): ConceptMapNode {
    const name = partial.concept;
    return {
      id: partial.id,
      concept: name,
      definition: partial.definition,
      x: partial.x,
      y: partial.y,
      width: Math.max(100, name.length * 8 + 40),
      height: 50,
      shape: "ellipse",
      color: "#E0F2FE",
      borderColor: "#0EA5E9",
      examples: partial.examples,
      importance: partial.importance || 0.5,
      links: [],
      linkLabels: new Map(),
      faded: false,
      ...partial
    };
  }

  private createLink(partial: { sourceId: string; targetId: string; label: string; relationshipType: ConceptRelationshipType }): ConceptMapLink {
    return {
      id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sourceId: partial.sourceId,
      targetId: partial.targetId,
      label: partial.label,
      relationshipType: partial.relationshipType,
      color: this.relationshipColors[partial.relationshipType] || "#94A3B8",
      lineStyle: "solid",
      arrowHead: true,
      strength: 1,
      crossTopic: false
    };
  }

  private calculateBounds(map: ConceptMap): { x: number; y: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const node of map.nodes.values()) {
      minX = Math.min(minX, node.x - node.width / 2);
      minY = Math.min(minY, node.y - node.height / 2);
      maxX = Math.max(maxX, node.x + node.width / 2);
      maxY = Math.max(maxY, node.y + node.height / 2);
    }

    return {
      x: minX - 50,
      y: minY - 50,
      width: maxX - minX + 100,
      height: maxY - minY + 100
    };
  }

  private createDefaultStyle(): any {
    return {
      nodeBackgroundColor: "#E0F2FE",
      nodeBorderColor: "#0EA5E9",
      linkColor: "#94A3B8",
      linkWidth: 2,
      fontSize: 14,
      fontFamily: "Inter, system-ui, sans-serif",
      backgroundColor: "#FFFFFF",
      showLabels: true,
      showArrows: true
    };
  }
}
