// @ts-nocheck
// Knowledge Galaxy — GalaxyNavigationEngine
// Handles navigation through the knowledge galaxy

import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface NavigationResult {
  path: string[];
  distance: number;
  edges: KnowledgeEdge[];
}

export interface SubgraphResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  centerNode: KnowledgeNode;
  radius: number;
}

export interface BreadthFirstResult {
  nodeId: string;
  distance: number;
  parentId?: string;
}

export class GalaxyNavigationEngine {
  private static instance: GalaxyNavigationEngine;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): GalaxyNavigationEngine {
    if (!GalaxyNavigationEngine.instance) {
      GalaxyNavigationEngine.instance = new GalaxyNavigationEngine();
    }
    return GalaxyNavigationEngine.instance;
  }

  public async initialize(): Promise<void> {
    this.initialized = true;
  }

  // Find shortest path between two nodes
  public async findPath(
    startNodeId: string,
    endNodeId: string,
    edges: KnowledgeEdge[],
    options?: { maxDepth?: number; includeTypes?: string[] }
  ): Promise<string[]> {
    const { maxDepth = 10, includeTypes } = options || {};

    // Build adjacency list
    const adjacency = this.buildAdjacencyList(edges, includeTypes);

    // BFS to find shortest path
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

      if (path.length >= maxDepth) continue;

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return []; // No path found
  }

  // Get all connected nodes within depth
  public async getConnectedNodes(
    nodeId: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    depth: number = 1
  ): Promise<KnowledgeNode[]> {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const adjacency = this.buildAdjacencyList(edges);

    const visited = new Set<string>();
    const result: KnowledgeNode[] = [];
    const queue: Array<{ nodeId: string; currentDepth: number }> = [
      { nodeId, currentDepth: 0 }
    ];

    while (queue.length > 0) {
      const { nodeId, currentDepth } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (node && currentDepth > 0) {
        result.push(node);
      }

      if (currentDepth >= depth) continue;

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, currentDepth: currentDepth + 1 });
        }
      }
    }

    return result;
  }

  // Get subgraph centered on a node
  public async getSubgraph(
    centerNodeId: string,
    radius: number,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Promise<SubgraphResult> {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const centerNode = nodeMap.get(centerNodeId);

    if (!centerNode) {
      return { nodes: [], edges: [], centerNode: centerNode as any, radius };
    }

    // Get connected nodes
    const connectedNodes = await this.getConnectedNodes(centerNodeId, nodes, edges, radius);
    const includedNodeIds = new Set([centerNodeId, ...connectedNodes.map(n => n.id)]);

    // Filter edges
    const includedEdges = edges.filter(
      e => includedNodeIds.has(e.sourceNodeId) && includedNodeIds.has(e.targetNodeId)
    );

    return {
      nodes: [centerNode, ...connectedNodes],
      edges: includedEdges,
      centerNode,
      radius
    };
  }

  // Find all paths (for learning paths)
  public async findAllPaths(
    startNodeId: string,
    endNodeId: string,
    edges: KnowledgeEdge[],
    maxPaths: number = 5
  ): Promise<string[][]> {
    const adjacency = this.buildAdjacencyList(edges);
    const paths: string[][] = [];

    const dfs = (
      current: string,
      path: string[],
      visited: Set<string>
    ) => {
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

  // Calculate distance between nodes
  public async calculateDistance(
    nodeA: string,
    nodeB: string,
    edges: KnowledgeEdge[]
  ): Promise<number> {
    const path = await this.findPath(nodeA, nodeB, edges, { maxDepth: 100 });
    return path.length > 0 ? path.length - 1 : -1;
  }

  // Get node degree (number of connections)
  public getNodeDegree(nodeId: string, edges: KnowledgeEdge[]): number {
    return edges.filter(
      e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
    ).length;
  }

  // Get neighbors of a node
  public getNeighbors(
    nodeId: string,
    edges: KnowledgeEdge[],
    direction?: "incoming" | "outgoing"
  ): string[] {
    const neighbors: string[] = [];

    for (const edge of edges) {
      if (direction !== "incoming" && edge.sourceNodeId === nodeId) {
        neighbors.push(edge.targetNodeId);
      }
      if (direction !== "outgoing" && edge.targetNodeId === nodeId) {
        neighbors.push(edge.sourceNodeId);
      }
    }

    return [...new Set(neighbors)];
  }

  // Build adjacency list from edges
  private buildAdjacencyList(
    edges: KnowledgeEdge[],
    includeTypes?: string[]
  ): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    for (const edge of edges) {
      if (includeTypes && !includeTypes.includes(edge.type)) continue;

      // Add forward direction
      const forward = adjacency.get(edge.sourceNodeId) || [];
      forward.push(edge.targetNodeId);
      adjacency.set(edge.sourceNodeId, forward);

      // Add reverse for bidirectional
      if (edge.bidirectional) {
        const reverse = adjacency.get(edge.targetNodeId) || [];
        reverse.push(edge.sourceNodeId);
        adjacency.set(edge.targetNodeId, reverse);
      }
    }

    return adjacency;
  }

  // Get shortest path with edge details
  public async findPathWithEdges(
    startNodeId: string,
    endNodeId: string,
    edges: KnowledgeEdge[]
  ): Promise<NavigationResult> {
    const path = await this.findPath(startNodeId, endNodeId, edges);

    if (path.length === 0) {
      return { path: [], distance: -1, edges: [] };
    }

    // Get edges for this path
    const pathEdges: KnowledgeEdge[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const edge = edges.find(
        e => e.sourceNodeId === path[i] && e.targetNodeId === path[i + 1]
      );
      if (edge) {
        pathEdges.push(edge);
      }
    }

    return {
      path,
      distance: path.length - 1,
      edges: pathEdges
    };
  }

  // Find clusters of related nodes
  public async findClusters(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Promise<string[][]> {
    const visited = new Set<string>();
    const clusters: string[][] = [];

    for (const node of nodes) {
      if (visited.has(node.id)) continue;

      const cluster: string[] = [];
      const queue = [node.id];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        cluster.push(current);

        const neighbors = this.getNeighbors(current, edges);
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (cluster.length > 0) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  // Get prerequisite chain
  public async getPrerequisiteChain(
    nodeId: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Promise<KnowledgeNode[]> {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const prerequisiteEdges = edges.filter(e => e.type === "prerequisite");

    const chain: KnowledgeNode[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const prereqs = prerequisiteEdges
        .filter(e => e.targetNodeId === id)
        .map(e => e.sourceNodeId);

      for (const prereqId of prereqs) {
        traverse(prereqId);
      }

      const node = nodeMap.get(id);
      if (node) {
        chain.push(node);
      }
    };

    traverse(nodeId);
    return chain;
  }

  // Get dependent chain (what this node unlocks)
  public async getDependentChain(
    nodeId: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Promise<KnowledgeNode[]> {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const prerequisiteEdges = edges.filter(e => e.type === "prerequisite");

    const chain: KnowledgeNode[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const dependents = prerequisiteEdges
        .filter(e => e.sourceNodeId === id)
        .map(e => e.targetNodeId);

      for (const depId of dependents) {
        traverse(depId);
      }

      const node = nodeMap.get(id);
      if (node && id !== nodeId) {
        chain.push(node);
      }
    };

    traverse(nodeId);
    return chain;
  }

  // Find bridge nodes (articulation points)
  public findBridgeNodes(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): string[] {
    const bridges: string[] = [];
    const visited = new Set<string>();
    const discovery = new Map<string, number>();
    const low = new Map<string, number>();
    const parent = new Map<string, string>();
    let time = 0;

    const adjacency = this.buildAdjacencyList(edges);

    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      discovery.set(nodeId, time);
      low.set(nodeId, time);
      time++;

      let isBridge = true;
      const children = adjacency.get(nodeId) || [];

      for (const neighbor of children) {
        if (!visited.has(neighbor)) {
          parent.set(neighbor, nodeId);
          dfs(neighbor);

          low.set(nodeId, Math.min(low.get(nodeId)!, low.get(neighbor)!));

          if (low.get(neighbor)! > discovery.get(nodeId)!) {
            // This is a bridge edge, but we track bridge nodes
            if (!bridges.includes(nodeId)) {
              bridges.push(nodeId);
            }
          }
        } else if (parent.get(nodeId) !== neighbor) {
          low.set(nodeId, Math.min(low.get(nodeId)!, discovery.get(neighbor)!));
        }
      }
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return bridges;
  }
}

// Singleton export
export const galaxyNavigationEngine = GalaxyNavigationEngine.getInstance();
