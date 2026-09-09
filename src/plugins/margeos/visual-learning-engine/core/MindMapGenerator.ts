// Visual Learning Engine — MindMapGenerator
// Feature 2: Mind Map Generator

import type { MindMap, MindMapNode, MindMapLayout, MindMapStyle } from "../models/MindMap";

export interface MindMapInput {
  title: string;
  centralConcept: string;
  concepts: {
    name: string;
    children?: string[];
    details?: string;
    examples?: string[];
  }[];
  options?: {
    layout?: "radial" | "tree" | "horizontal";
    maxDepth?: number;
    branchColors?: string[];
  };
}

/**
 * Generates interactive mind maps from concept hierarchies
 */
export class MindMapGenerator {
  private defaultStyle: MindMapStyle;

  constructor() {
    this.defaultStyle = this.createDefaultStyle();
  }

  /**
   * Generate mind map from input
   */
  async generate(input: MindMapInput): Promise<MindMap> {
    const options = input.options || {};
    const maxDepth = options.maxDepth || 4;

    const mindMap: MindMap = {
      id: `mindmap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: input.title,
      rootText: input.centralConcept,

      rootId: "",
      nodes: new Map(),
      layout: this.createLayout(options.layout || "radial"),
      centerX: 400,
      centerY: 300,
      radiusStep: 150,
      angleSpread: Math.PI * 2,

      style: this.defaultStyle,

      branchCount: 0,
      maxDepth: 0,

      sourceIds: [],
      topicId: undefined,

      ariaLabel: input.title,

      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create root node
    const rootNode = this.createNode({
      text: input.centralConcept,
      type: "root",
      x: mindMap.centerX,
      y: mindMap.centerY,
      depth: 0,
      angle: 0,
      radius: 0,
      childIds: []
    });
    mindMap.rootId = rootNode.id;
    mindMap.nodes.set(rootNode.id, rootNode);

    // Create branch nodes recursively
    const processedConcepts = new Set<string>();
    let branchCount = 0;
    let maxDepthReached = 0;

    const processConcept = (
      conceptName: string,
      parentNode: MindMapNode,
      depth: number,
      startAngle: number,
      angleSpan: number
    ) => {
      if (depth > maxDepth || processedConcepts.has(conceptName)) return;

      processedConcepts.add(conceptName);
      maxDepthReached = Math.max(maxDepthReached, depth);

      // Find concept data
      const conceptData = input.concepts.find(c => c.name === conceptName);

      // Calculate position
      const radius = (depth + 1) * mindMap.radiusStep;
      const angle = startAngle + angleSpan / 2;

      const node = this.createNode({
        text: conceptName,
        type: depth === maxDepth ? "leaf" : "branch",
        x: mindMap.centerX + radius * Math.cos(angle),
        y: mindMap.centerY + radius * Math.sin(angle),
        depth,
        angle,
        radius,
        parentId: parentNode.id,
        childIds: [],
        details: conceptData?.details,
        collapsed: depth >= 2
      });

      mindMap.nodes.set(node.id, node);
      parentNode.childIds.push(node.id);
      branchCount++;

      // Process children
      if (conceptData?.children && depth < maxDepth) {
        const childCount = conceptData.children.length;
        const childAngleSpan = angleSpan / Math.max(childCount, 1);

        for (let i = 0; i < Math.min(childCount, 10); i++) {
          const childAngle = startAngle + (i * angleSpan / childCount) + (childAngleSpan / 2);
          processConcept(
            conceptData.children[i],
            node,
            depth + 1,
            startAngle + i * angleSpan / childCount,
            childAngleSpan
          );
        }
      }
    };

    // Start with root's children
    const rootConcept = input.concepts.find(c => c.name === input.centralConcept);
    if (rootConcept?.children) {
      const childCount = rootConcept.children.length;
      const angleSpan = Math.PI * 2;
      const childAngleSpan = angleSpan / Math.max(childCount, 1);

      for (let i = 0; i < Math.min(childCount, 12); i++) {
        const startAngle = (i * angleSpan / childCount);
        processConcept(
          rootConcept.children[i],
          mindMap.nodes.get(mindMap.rootId)!,
          1,
          startAngle,
          childAngleSpan
        );
      }
    } else {
      // Add all concepts as branches from root
      const concepts = input.concepts.filter(c => c.name !== input.centralConcept).slice(0, 12);
      const angleSpan = Math.PI * 2;
      const conceptAngleSpan = angleSpan / Math.max(concepts.length, 1);

      for (let i = 0; i < concepts.length; i++) {
        processConcept(
          concepts[i].name,
          mindMap.nodes.get(mindMap.rootId)!,
          1,
          i * conceptAngleSpan,
          conceptAngleSpan
        );
      }
    }

    mindMap.branchCount = branchCount;
    mindMap.maxDepth = maxDepthReached;

    return mindMap;
  }

  private createNode(partial: Partial<MindMapNode> & { text: string; type: MindMapNode["type"]; x: number; y: number; depth: number; angle: number; radius: number }): MindMapNode {
    return {
      id: `mm_node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: partial.text,
      type: partial.type,
      x: partial.x,
      y: partial.y,
      width: partial.text.length * 8 + 40,
      height: 40,
      depth: partial.depth,
      angle: partial.angle,
      radius: partial.radius,
      parentId: partial.parentId,
      childIds: partial.childIds || [],
      collapsed: partial.collapsed || false,
      ...partial
    };
  }

  private createLayout(type: MindMapLayout["type"]): MindMapLayout {
    return {
      type,
      direction: "clockwise",
      spacing: {
        levelGap: 150,
        siblingGap: 30,
        nodeWidth: 100,
        nodeHeight: 40
      }
    };
  }

  private createDefaultStyle(): MindMapStyle {
    return {
      rootColor: "#3B82F6",
      branchColors: ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#F97316"],
      leafColor: "#94A3B8",
      fontSize: 14,
      fontFamily: "Inter, system-ui, sans-serif",
      lineColor: "#CBD5E1",
      lineWidth: 2,
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      padding: 16
    };
  }
}
