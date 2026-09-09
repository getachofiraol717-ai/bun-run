// Visual Learning Engine — LayoutEngine
// Applies layout algorithms to visualizations

import type { Diagram, DiagramNode } from "../models/Diagram";
import type { MindMap, MindMapNode } from "../models/MindMap";
import type { ConceptMap, ConceptMapNode } from "../models/MindMap";
import type { Flowchart, FlowchartNode } from "../models/MindMap";

export interface LayoutConfig {
  width: number;
  height: number;
  padding: number;
  nodeSpacing: number;
  levelSpacing: number;
}

/**
 * Layout engine for positioning visualization elements
 */
export class LayoutEngine {
  private defaultConfig: LayoutConfig;

  constructor() {
    this.defaultConfig = {
      width: 800,
      height: 600,
      padding: 50,
      nodeSpacing: 100,
      levelSpacing: 120
    };
  }

  /**
   * Apply layout to diagram
   */
  async applyLayout(diagram: Diagram, layoutType: "auto" | "hierarchical" | "force" | "circular" = "auto"): Promise<void> {
    const config = this.defaultConfig;

    switch (layoutType) {
      case "hierarchical":
        this.applyHierarchicalLayout(diagram, config);
        break;
      case "force":
        this.applyForceLayout(diagram, config);
        break;
      case "circular":
        this.applyCircularLayout(diagram, config);
        break;
      case "auto":
      default:
        // Choose best layout based on node count
        if (diagram.nodes.length < 20) {
          this.applyCircularLayout(diagram, config);
        } else {
          this.applyHierarchicalLayout(diagram, config);
        }
    }
  }

  /**
   * Apply hierarchical (tree) layout
   */
  private applyHierarchicalLayout(diagram: Diagram, config: LayoutConfig): void {
    const nodes = diagram.nodes;
    const levels = this.assignLevels(nodes);

    // Group nodes by level
    const levelGroups = new Map<number, DiagramNode[]>();
    for (const node of nodes) {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level)!.push(node);
    }

    // Position nodes
    const centerX = config.width / 2;

    for (const [level, levelNodes] of levelGroups) {
      const y = config.padding + level * config.levelSpacing;
      const spacing = config.width / (levelNodes.length + 1);

      levelNodes.forEach((node, index) => {
        node.x = spacing * (index + 1);
        node.y = y;
      });
    }
  }

  /**
   * Apply force-directed layout
   */
  private applyForceLayout(diagram: Diagram, config: LayoutConfig): void {
    const nodes = diagram.nodes;
    const edges = diagram.edges;

    // Initialize positions
    nodes.forEach((node, i) => {
      node.x = config.width / 2 + (Math.random() - 0.5) * 200;
      node.y = config.height / 2 + (Math.random() - 0.5) * 200;
    });

    // Simple force simulation (3 iterations)
    for (let iter = 0; iter < 3; iter++) {
      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = 5000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          nodes[i].x -= fx * 0.1;
          nodes[i].y -= fy * 0.1;
          nodes[j].x += fx * 0.1;
          nodes[j].y += fy * 0.1;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        const source = nodes.find(n => n.id === edge.sourceId);
        const target = nodes.find(n => n.id === edge.targetId);
        if (!source || !target) continue;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = dist * 0.01;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        source.x += fx;
        source.y += fy;
        target.x -= fx;
        target.y -= fy;
      }

      // Keep within bounds
      for (const node of nodes) {
        node.x = Math.max(config.padding, Math.min(config.width - config.padding, node.x));
        node.y = Math.max(config.padding, Math.min(config.height - config.padding, node.y));
      }
    }
  }

  /**
   * Apply circular layout
   */
  private applyCircularLayout(diagram: Diagram, config: LayoutConfig): void {
    const nodes = diagram.nodes;
    const centerX = config.width / 2;
    const centerY = config.height / 2;
    const radius = Math.min(centerX, centerY) - config.padding;

    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, i) => {
      const angle = i * angleStep - Math.PI / 2;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });
  }

  /**
   * Assign levels for hierarchical layout
   */
  private assignLevels(nodes: DiagramNode[]): Map<string, number> {
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    // Find root nodes (nodes with no incoming edges)
    const hasIncoming = new Set<string>();
    // This would need edges - simplified for now

    // BFS from roots
    const queue: { id: string; level: number }[] = [];

    // Start with nodes that seem like roots
    for (const node of nodes) {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
        queue.push({ id: node.id, level: 0 });
      }
    }

    // Simplified: just assign based on index
    nodes.forEach((node, i) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, Math.floor(i / 5));
      }
    });

    return levels;
  }

  /**
   * Apply layout to mind map
   */
  async applyMindMapLayout(mindMap: MindMap): Promise<void> {
    const nodes = Array.from(mindMap.nodes.values());
    const root = mindMap.nodes.get(mindMap.rootId);

    if (!root) return;

    // Radial layout
    const centerX = mindMap.centerX;
    const centerY = mindMap.centerY;
    const radiusStep = mindMap.radiusStep;

    // Position root
    root.x = centerX;
    root.y = centerY;

    // Position children by depth and angle
    for (const node of nodes) {
      if (node.id === root.id) continue;

      const radius = (node.depth + 1) * radiusStep;
      node.x = centerX + radius * Math.cos(node.angle);
      node.y = centerY + radius * Math.sin(node.angle);

      // Calculate dimensions based on text
      node.width = node.text.length * 8 + 40;
      node.height = 36;
    }
  }

  /**
   * Apply layout to concept map
   */
  async applyConceptMapLayout(conceptMap: ConceptMap): Promise<void> {
    const nodes = Array.from(conceptMap.nodes.values());

    // Use force layout
    const width = conceptMap.bounds.width || 800;
    const height = conceptMap.bounds.height || 600;

    // Initialize positions
    nodes.forEach((node, i) => {
      if (!node.x || !node.y) {
        node.x = width / 2 + (Math.random() - 0.5) * 200;
        node.y = height / 2 + (Math.random() - 0.5) * 200;
      }
    });

    // Simple force simulation
    for (let iter = 0; iter < 5; iter++) {
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = 10000 / (dist * dist);
          nodes[i].x -= (dx / dist) * force * 0.5;
          nodes[i].y -= (dy / dist) * force * 0.5;
          nodes[j].x += (dx / dist) * force * 0.5;
          nodes[j].y += (dy / dist) * force * 0.5;
        }
      }

      // Keep in bounds
      for (const node of nodes) {
        node.x = Math.max(50, Math.min(width - 50, node.x));
        node.y = Math.max(50, Math.min(height - 50, node.y));
      }
    }
  }

  /**
   * Apply layout to flowchart
   */
  async applyFlowchartLayout(flowchart: Flowchart): Promise<void> {
    const nodes = Array.from(flowchart.nodes.values());
    const startNode = flowchart.nodes.get(flowchart.startNodeId);

    if (!startNode) return;

    // Vertical layout
    const nodeWidth = 180;
    const nodeHeight = 60;
    const verticalGap = 80;

    let currentY = 50;

    // BFS for level assignment
    const levels = new Map<string, number>();
    const queue: { id: string; level: number }[] = [{ id: startNode.id, level: 0 }];

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (levels.has(id)) continue;

      levels.set(id, level);
      const node = flowchart.nodes.get(id);
      if (!node) continue;

      // Add children to queue
      for (const childId of node.nextIds) {
        queue.push({ id: childId, level: level + 1 });
      }
      if (node.yesNextId) queue.push({ id: node.yesNextId, level: level + 1 });
      if (node.noNextId) queue.push({ id: node.noNextId, level: level + 1 });
    }

    // Group by level
    const levelGroups = new Map<number, typeof nodes>();
    for (const node of nodes) {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level)!.push(node);
    }

    // Position nodes
    const maxNodesInLevel = Math.max(...Array.from(levelGroups.values()).map(g => g.length));
    const horizontalSpacing = flowchart.bounds.width / (maxNodesInLevel + 1);

    for (const [level, levelNodes] of levelGroups) {
      const y = level * (nodeHeight + verticalGap) + 50;
      const levelSpacing = flowchart.bounds.width / (levelNodes.length + 1);

      levelNodes.forEach((node, i) => {
        node.y = y;
        node.x = levelSpacing * (i + 1);
      });
    }
  }
}
