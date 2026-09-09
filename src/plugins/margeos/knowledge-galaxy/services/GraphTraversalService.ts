// @ts-nocheck
// Knowledge Galaxy — GraphTraversalService
// Service for traversing and querying the knowledge graph

import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface TraversalOptions {
  maxDepth?: number;
  includeTypes?: string[];
  excludeMastered?: boolean;
  direction?: "both" | "outgoing" | "incoming";
}

export interface TraversalResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  distances: Map<string, number>;
  paths: Map<string, string[]>;
}

export interface BreadthFirstNode {
  nodeId: string;
  distance: number;
  parentId?: string;
  edgeId?: string;
}

export class GraphTraversalService {
  private static instance: GraphTraversalService;

  private constructor() {}

  public static getInstance(): GraphTraversalService {
    if (!GraphTraversalService.instance) {
      GraphTraversalService.instance = new GraphTraversalService();
    }
    return GraphTraversalService.instance;
  }

  // BFS traversal from a starting node
  public breadthFirstSearch(
    startNodeId: string,
    nodes: Map<string, KnowledgeNode>,
    edges: KnowledgeEdge[],
    options?: TraversalOptions
  ): TraversalResult {
    const {
      maxDepth = 10,
      includeTypes,
      excludeMastered = false,
      direction = "both"
    } = options || {};

    const visited = new Set<string>();
    const queue: BreadthFirstNode[] = [{ nodeId: startNodeId, distance: 0 }];
    const resultNodes: KnowledgeNode[] = [];
    const resultEdges: KnowledgeEdge[] = [];
    const distances = new Map<string, number>();
    const paths = new Map<string, string[]>();

    // Build adjacency lists
    const outgoing = this.buildAdjacencyList(edges, "outgoing");
    const incoming = this.buildAdjacencyList(edges, "incoming");

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);

      const node = nodes.get(current.nodeId);
      if (!node) continue;

      // Apply filters
      if (excludeMastered && node.masteryScore >= 80) continue;
      if (includeTypes && !includeTypes.includes(node.type)) continue;

      resultNodes.push(node);
      distances.set(current.nodeId, current.distance);

      if (current.distance > 0) {
        paths.set(current.nodeId, this.reconstructPath(current.nodeId, paths));
      }

      if (current.distance >= maxDepth) continue;

      // Get neighbors based on direction
      let neighbors: string[] = [];
      if (direction === "both" || direction === "outgoing") {
        neighbors.push(...(outgoing.get(current.nodeId) || []));
      }
      if (direction === "both" || direction === "incoming") {
        neighbors.push(...(incoming.get(current.nodeId) || []));
      }

      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          queue.push({
            nodeId: neighborId,
            distance: current.distance + 1,
            parentId: current.nodeId
          });
        }
      }
    }

    // Get edges between result nodes
    const resultNodeIds = new Set(resultNodes.map(n => n.id));
    for (const edge of edges) {
      if (resultNodeIds.has(edge.sourceNodeId) && resultNodeIds.has(edge.targetNodeId)) {
        if (!includeTypes || includeTypes.includes(edge.type)) {
          resultEdges.push(edge);
        }
      }
    }

    return { nodes: resultNodes, edges: resultEdges, distances, paths };
  }

  // DFS traversal
  public depthFirstSearch(
    startNodeId: string,
    nodes: Map<string, KnowledgeNode>,
    edges: KnowledgeEdge[],
    options?: TraversalOptions
  ): TraversalResult {
    const { maxDepth = 10, includeTypes, excludeMastered = false } = options || {};

    const visited = new Set<string>();
    const resultNodes: KnowledgeNode[] = [];
    const resultEdges: KnowledgeEdge[] = [];
    const distances = new Map<string, number>();

    // Build adjacency list
    const adjacency = this.buildAdjacencyList(edges, "outgoing");

    const dfs = (nodeId: string, depth: number) => {
      if (visited.has(nodeId) || depth > maxDepth) return;
      visited.add(nodeId);

      const node = nodes.get(nodeId);
      if (!node) return;

      if (excludeMastered && node.masteryScore >= 80) return;
      if (includeTypes && !includeTypes.includes(node.type)) return;

      resultNodes.push(node);
      distances.set(nodeId, depth);

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighborId of neighbors) {
        dfs(neighborId, depth + 1);
      }
    };

    dfs(startNodeId, 0);

    // Get edges
    const resultNodeIds = new Set(resultNodes.map(n => n.id));
    for (const edge of edges) {
      if (resultNodeIds.has(edge.sourceNodeId) && resultNodeIds.has(edge.targetNodeId)) {
        resultEdges.push(edge);
      }
    }

    return { nodes: resultNodes, edges: resultEdges, distances, paths: new Map() };
  }

  // Find all paths between two nodes
  public findAllPaths(
    startNodeId: string,
    endNodeId: string,
    edges: KnowledgeEdge[],
    maxPaths: number = 10
  ): string[][] {
    const adjacency = this.buildAdjacencyList(edges, "outgoing");
    const paths: string[][] = [];

    const dfs = (current: string, path: string[], visited: Set<string>) => {
      if (current === endNodeId) {
        paths.push([...path]);
        return;
      }

      if (paths.length >= maxPaths) return;

      const neighbors = adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          path.push(neighbor);
          dfs(neighbor, path, visited);
          path.pop();
          visited.delete(neighbor);
        }
      }
    };

    const visited = new Set([startNodeId]);
    dfs(startNodeId, [startNodeId], visited);

    return paths;
  }

  // Find shortest path
  public findShortestPath(
    startNodeId: string,
    endNodeId: string,
    edges: KnowledgeEdge[]
  ): string[] {
    const adjacency = this.buildAdjacencyList(edges, "outgoing");
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: startNodeId, path: [startNodeId] }
    ];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      if (nodeId === endNodeId) {
        return path;
      }

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return []; // No path found
  }

  // Get neighbors of a node
  public getNeighbors(
    nodeId: string,
    edges: KnowledgeEdge[],
    direction: "outgoing" | "incoming" | "both" = "both"
  ): string[] {
    const neighbors: string[] = [];

    for (const edge of edges) {
      if (direction === "outgoing" || direction === "both") {
        if (edge.sourceNodeId === nodeId) {
          neighbors.push(edge.targetNodeId);
        }
      }
      if (direction === "incoming" || direction === "both") {
        if (edge.targetNodeId === nodeId) {
          neighbors.push(edge.sourceNodeId);
        }
      }
    }

    return [...new Set(neighbors)];
  }

  // Get subgraph centered on a node
  public getSubgraph(
    centerNodeId: string,
    radius: number,
    nodes: Map<string, KnowledgeNode>,
    edges: KnowledgeEdge[]
  ): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const traversal = this.breadthFirstSearch(centerNodeId, nodes, edges, {
      maxDepth: radius
    });

    return { nodes: traversal.nodes, edges: traversal.edges };
  }

  // Build adjacency list
  private buildAdjacencyList(
    edges: KnowledgeEdge[],
    direction: "outgoing" | "incoming"
  ): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    for (const edge of edges) {
      if (direction === "outgoing") {
        const existing = adjacency.get(edge.sourceNodeId) || [];
        existing.push(edge.targetNodeId);
        adjacency.set(edge.sourceNodeId, existing);
      } else {
        const existing = adjacency.get(edge.targetNodeId) || [];
        existing.push(edge.sourceNodeId);
        adjacency.set(edge.targetNodeId, existing);
      }
    }

    return adjacency;
  }

  // Reconstruct path from BFS result
  private reconstructPath(
    nodeId: string,
    paths: Map<string, string[]>
  ): string[] {
    // Simplified - in real implementation would track parents properly
    const path: string[] = [nodeId];
    return path;
  }

  // Get nodes at specific depth
  public getNodesAtDepth(
    startNodeId: string,
    targetDepth: number,
    nodes: Map<string, KnowledgeNode>,
    edges: KnowledgeEdge[]
  ): KnowledgeNode[] {
    const traversal = this.breadthFirstSearch(startNodeId, nodes, edges, {
      maxDepth: targetDepth
    });

    return traversal.nodes.filter(n => traversal.distances.get(n.id) === targetDepth);
  }

  // Get all connected components
  public getConnectedComponents(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    // Build adjacency list
    const adjacency = this.buildAdjacencyList(edges, "both");

    for (const node of nodes) {
      if (visited.has(node.id)) continue;

      const component: string[] = [];
      const queue = [node.id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        component.push(current);

        const neighbors = adjacency.get(current) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (component.length > 0) {
        components.push(component);
      }
    }

    return components;
  }
}

// Singleton export
export const graphTraversalService = GraphTraversalService.getInstance();
