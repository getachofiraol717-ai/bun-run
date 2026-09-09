// Visual Learning Engine — diagramUtils
// Diagram manipulation and calculation utilities

import type { Diagram, DiagramNode, DiagramEdge, DiagramType, NodeType, EdgeType } from "../models/Diagram";

export interface DiagramStatistics {
  nodeCount: number;
  edgeCount: number;
  averageConnections: number;
  maxConnections: number;
  isolatedNodes: number;
  types: Record<NodeType, number>;
}

/**
 * Calculate statistics for a diagram
 */
export function calculateDiagramStatistics(diagram: Diagram): DiagramStatistics {
  const types: Record<NodeType, number> = {
    concept: 0,
    process: 0,
    entity: 0,
    event: 0,
    value: 0,
    group: 0,
    container: 0,
    start: 0,
    end: 0,
    decision: 0,
    action: 0
  };

  const connectionCount = new Map<string, number>();

  for (const node of diagram.nodes) {
    types[node.type] = (types[node.type] || 0) + 1;
    connectionCount.set(node.id, 0);
  }

  for (const edge of diagram.edges) {
    connectionCount.set(edge.sourceId, (connectionCount.get(edge.sourceId) || 0) + 1);
    connectionCount.set(edge.targetId, (connectionCount.get(edge.targetId) || 0) + 1);
  }

  let totalConnections = 0;
  let maxConnections = 0;
  let isolatedNodes = 0;

  for (const count of connectionCount.values()) {
    totalConnections += count;
    maxConnections = Math.max(maxConnections, count);
    if (count === 0) isolatedNodes++;
  }

  return {
    nodeCount: diagram.nodes.length,
    edgeCount: diagram.edges.length,
    averageConnections: diagram.nodes.length > 0 ? totalConnections / diagram.nodes.length : 0,
    maxConnections,
    isolatedNodes,
    types
  };
}

/**
 * Find connected nodes
 */
export function findConnectedNodes(diagram: Diagram, nodeId: string): string[] {
  const connected = new Set<string>();

  for (const edge of diagram.edges) {
    if (edge.sourceId === nodeId) {
      connected.add(edge.targetId);
    }
    if (edge.targetId === nodeId) {
      connected.add(edge.sourceId);
    }
  }

  return Array.from(connected);
}

/**
 * Find path between two nodes
 */
export function findPath(diagram: Diagram, fromId: string, toId: string): string[] | null {
  const visited = new Set<string>();
  const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;

    if (id === toId) {
      return path;
    }

    if (visited.has(id)) continue;
    visited.add(id);

    const connected = findConnectedNodes(diagram, id);
    for (const nextId of connected) {
      if (!visited.has(nextId)) {
        queue.push({ id: nextId, path: [...path, nextId] });
      }
    }
  }

  return null;
}

/**
 * Find all paths between two nodes
 */
export function findAllPaths(diagram: Diagram, fromId: string, toId: string): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();

  function dfs(current: string, path: string[]) {
    if (current === toId) {
      paths.push([...path]);
      return;
    }

    visited.add(current);

    const connected = findConnectedNodes(diagram, current);
    for (const nextId of connected) {
      if (!visited.has(nextId)) {
        path.push(nextId);
        dfs(nextId, path);
        path.pop();
      }
    }

    visited.delete(current);
  }

  dfs(fromId, [fromId]);
  return paths;
}

/**
 * Detect cycles in diagram
 */
export function detectCycles(diagram: Diagram): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const connected = findConnectedNodes(diagram, nodeId);
    for (const nextId of connected) {
      if (!visited.has(nextId)) {
        if (dfs(nextId, path)) {
          return true;
        }
      } else if (recursionStack.has(nextId)) {
        const cycleStart = path.indexOf(nextId);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return true;
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of diagram.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

/**
 * Topological sort
 */
export function topologicalSort(diagram: Diagram): string[] | null {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // Initialize
  for (const node of diagram.nodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  // Build adjacency list and in-degree
  for (const edge of diagram.edges) {
    adjList.get(edge.sourceId)?.push(edge.targetId);
    inDegree.set(edge.targetId, (inDegree.get(edge.targetId) || 0) + 1);
  }

  // Find nodes with no incoming edges
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  const sorted: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Check for cycles
  if (sorted.length !== diagram.nodes.length) {
    return null;
  }

  return sorted;
}

/**
 * Find root nodes (no incoming edges)
 */
export function findRootNodes(diagram: Diagram): DiagramNode[] {
  const hasIncoming = new Set<string>();

  for (const edge of diagram.edges) {
    hasIncoming.add(edge.targetId);
  }

  return diagram.nodes.filter(node => !hasIncoming.has(node.id));
}

/**
 * Find leaf nodes (no outgoing edges)
 */
export function findLeafNodes(diagram: Diagram): DiagramNode[] {
  const hasOutgoing = new Set<string>();

  for (const edge of diagram.edges) {
    hasOutgoing.add(edge.sourceId);
  }

  return diagram.nodes.filter(node => !hasOutgoing.has(node.id));
}

/**
 * Get node type color
 */
export function getNodeTypeColor(type: NodeType): string {
  const colors: Record<NodeType, string> = {
    concept: "#3B82F6",
    process: "#10B981",
    entity: "#8B5CF6",
    event: "#F59E0B",
    value: "#EC4899",
    group: "#6B7280",
    container: "#14B8A6",
    start: "#22C55E",
    end: "#EF4444",
    decision: "#F97316",
    action: "#6366F1"
  };
  return colors[type] || "#6B7280";
}

/**
 * Get edge type name
 */
export function getEdgeTypeName(type: EdgeType): string {
  const names: Record<EdgeType, string> = {
    direct: "Direct",
    curved: "Curved",
    orthogonal: "Orthogonal",
    bezier: "Bezier",
    step: "Step",
    smooth: "Smooth"
  };
  return names[type] || "Direct";
}

/**
 * Get diagram type name
 */
export function getDiagramTypeName(type: DiagramType): string {
  const names: Record<DiagramType, string> = {
    scientific: "Scientific Diagram",
    system: "System Diagram",
    relationship: "Relationship Diagram",
    structural: "Structural Diagram",
    educational: "Educational Diagram",
    anatomical: "Anatomical Diagram",
    mechanical: "Mechanical Diagram",
    electrical: "Electrical Diagram",
    chemical: "Chemical Diagram",
    process: "Process Diagram"
  };
  return names[type] || "Diagram";
}

/**
 * Create empty diagram
 */
export function createEmptyDiagram(
  title: string,
  type: DiagramType = "relationship"
): Diagram {
  return {
    id: `diagram-${Date.now()}`,
    type,
    title,
    nodes: [],
    edges: [],
    sourceIds: [],
    conceptIds: [],
    style: {
      colorScheme: {
        primary: "#3B82F6",
        secondary: "#8B5CF6",
        accent: "#F59E0B",
        background: "#FFFFFF",
        text: "#1F2937",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        nodes: ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"]
      },
      fontFamily: "system-ui, sans-serif",
      fontSize: 14,
      backgroundColor: "#FFFFFF",
      nodeStyle: {
        borderRadius: 8,
        borderWidth: 2,
        shadow: true,
        padding: 10,
        minWidth: 80,
        maxWidth: 200
      },
      edgeStyle: {
        strokeWidth: 2,
        strokeStyle: "solid",
        arrowHead: "arrow",
        labelPosition: 0.5
      }
    },
    width: 800,
    height: 600,
    altText: title,
    ariaLabel: title,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Clone diagram
 */
export function cloneDiagram(diagram: Diagram): Diagram {
  return {
    ...diagram,
    id: `diagram-${Date.now()}`,
    nodes: diagram.nodes.map(n => ({ ...n })),
    edges: diagram.edges.map(e => ({ ...e })),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
