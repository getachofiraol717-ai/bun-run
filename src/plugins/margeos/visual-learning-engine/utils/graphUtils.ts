// Visual Learning Engine — graphUtils
// Graph algorithms and utilities

export interface GraphNode<T = any> {
  id: string;
  data?: T;
  x?: number;
  y?: number;
}

export interface GraphEdge<T = any> {
  source: string;
  target: string;
  weight?: number;
  data?: T;
}

export interface Graph<T = any, E = any> {
  nodes: Map<string, GraphNode<T>>;
  edges: GraphEdge<E>[];
}

/**
 * Create a new graph
 */
export function createGraph<T = any, E = any>(): Graph<T, E> {
  return {
    nodes: new Map(),
    edges: []
  };
}

/**
 * Add node to graph
 */
export function addGraphNode<T = any>(graph: Graph<T, any>, node: GraphNode<T>): void {
  graph.nodes.set(node.id, node);
}

/**
 * Add edge to graph
 */
export function addGraphEdge<E = any>(graph: Graph<any, E>, edge: GraphEdge<E>): void {
  graph.edges.push(edge);
}

/**
 * Get neighbors of a node
 */
export function getNeighbors(graph: Graph, nodeId: string): string[] {
  const neighbors = new Set<string>();

  for (const edge of graph.edges) {
    if (edge.source === nodeId) {
      neighbors.add(edge.target);
    }
    if (edge.target === nodeId) {
      neighbors.add(edge.source);
    }
  }

  return Array.from(neighbors);
}

/**
 * Get outgoing neighbors
 */
export function getOutgoingNeighbors(graph: Graph, nodeId: string): string[] {
  return graph.edges
    .filter(edge => edge.source === nodeId)
    .map(edge => edge.target);
}

/**
 * Get incoming neighbors
 */
export function getIncomingNeighbors(graph: Graph, nodeId: string): string[] {
  return graph.edges
    .filter(edge => edge.target === nodeId)
    .map(edge => edge.source);
}

/**
 * Check if edge exists
 */
export function edgeExists(graph: Graph, from: string, to: string): boolean {
  return graph.edges.some(e => e.source === from && e.target === to);
}

/**
 * Get edge weight
 */
export function getEdgeWeight(graph: Graph, from: string, to: string): number {
  const edge = graph.edges.find(e => e.source === from && e.target === to);
  return edge?.weight || 1;
}

/**
 * Breadth-first search
 */
export function bfs(graph: Graph, startId: string): string[] {
  const visited = new Set<string>();
  const queue = [startId];
  const result: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    result.push(nodeId);

    const neighbors = getNeighbors(graph, nodeId);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}

/**
 * Depth-first search
 */
export function dfs(graph: Graph, startId: string): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    result.push(nodeId);

    const neighbors = getNeighbors(graph, nodeId);
    for (const neighbor of neighbors) {
      visit(neighbor);
    }
  }

  visit(startId);
  return result;
}

/**
 * Dijkstra's shortest path
 */
export function dijkstra(
  graph: Graph,
  startId: string,
  endId: string
): { path: string[]; distance: number } | null {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const nodeId of graph.nodes.keys()) {
    distances.set(nodeId, Infinity);
    unvisited.add(nodeId);
  }

  distances.set(startId, 0);
  previous.set(startId, null);

  while (unvisited.size > 0) {
    // Find minimum distance node
    let minNode: string | null = null;
    let minDist = Infinity;
    for (const nodeId of unvisited) {
      const dist = distances.get(nodeId) || Infinity;
      if (dist < minDist) {
        minDist = dist;
        minNode = nodeId;
      }
    }

    if (minNode === null || minNode === endId) break;

    unvisited.delete(minNode);

    const neighbors = getOutgoingNeighbors(graph, minNode);
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor)) continue;

      const edgeWeight = getEdgeWeight(graph, minNode, neighbor);
      const alt = (distances.get(minNode) || Infinity) + edgeWeight;
      const currentDist = distances.get(neighbor) || Infinity;

      if (alt < currentDist) {
        distances.set(neighbor, alt);
        previous.set(neighbor, minNode);
      }
    }
  }

  // Reconstruct path
  if (distances.get(endId) === Infinity) return null;

  const path: string[] = [];
  let current: string | null = endId;

  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
  }

  return {
    path,
    distance: distances.get(endId) || Infinity
  };
}

/**
 * Find connected components
 */
export function findConnectedComponents(graph: Graph): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const nodeId of graph.nodes.keys()) {
    if (visited.has(nodeId)) continue;

    const component = bfs(graph, nodeId);
    component.forEach(id => visited.add(id));
    components.push(component);
  }

  return components;
}

/**
 * Find bridges (edges whose removal disconnects the graph)
 */
export function findBridges(graph: Graph): [string, string][] {
  const bridges: [string, string][] = [];
  const visited = new Set<string>();
  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  const parent = new Map<string, string | null>();
  let time = 0;

  function dfs(u: string) {
    visited.add(u);
    disc.set(u, ++time);
    low.set(u, time);

    const neighbors = getNeighbors(graph, u);
    for (const v of neighbors) {
      if (!visited.has(v)) {
        parent.set(v, u);
        dfs(v);

        low.set(u, Math.min(low.get(u)!, low.get(v)!));

        if (low.get(v)! > disc.get(u)!) {
          bridges.push([u, v]);
        }
      } else if (parent.get(u) !== v) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    }
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      parent.set(nodeId, null);
      dfs(nodeId);
    }
  }

  return bridges;
}

/**
 * Calculate node centrality (degree centrality)
 */
export function degreeCentrality(graph: Graph): Map<string, number> {
  const centrality = new Map<string, number>();

  for (const nodeId of graph.nodes.keys()) {
    centrality.set(nodeId, getNeighbors(graph, nodeId).length);
  }

  return centrality;
}

/**
 * Calculate betweenness centrality (simplified)
 */
export function betweennessCentrality(graph: Graph): Map<string, number> {
  const centrality = new Map<string, number>();

  for (const nodeId of graph.nodes.keys()) {
    centrality.set(nodeId, 0);
  }

  for (const source of graph.nodes.keys()) {
    for (const target of graph.nodes.keys()) {
      if (source === target) continue;

      const path = dijkstra(graph, source, target);
      if (path) {
        for (const nodeId of path.path.slice(1, -1)) {
          centrality.set(nodeId, (centrality.get(nodeId) || 0) + 1);
        }
      }
    }
  }

  return centrality;
}

/**
 * Detect cycles using DFS
 */
export function hasCycle(graph: Graph): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = getNeighbors(graph, nodeId);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) return true;
    }
  }

  return false;
}

/**
 * Topological sort (Kahn's algorithm)
 */
export function topologicalSort(graph: Graph): string[] | null {
  if (hasCycle(graph)) return null;

  const inDegree = new Map<string, number>();
  const queue: string[] = [];
  const result: string[] = [];

  // Initialize in-degrees
  for (const nodeId of graph.nodes.keys()) {
    inDegree.set(nodeId, 0);
  }

  // Calculate in-degrees
  for (const edge of graph.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Find nodes with no incoming edges
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const neighbors = getOutgoingNeighbors(graph, nodeId);
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}

/**
 * Convert graph to adjacency list
 */
export function toAdjacencyList(graph: Graph): Map<string, string[]> {
  const adj = new Map<string, string[]>();

  for (const nodeId of graph.nodes.keys()) {
    adj.set(nodeId, []);
  }

  for (const edge of graph.edges) {
    adj.get(edge.source)?.push(edge.target);
  }

  return adj;
}

/**
 * Convert adjacency list to graph
 */
export function fromAdjacencyList<T = any, E = any>(
  adj: Map<string, string[]>,
  nodeData?: Map<string, T>
): Graph<T, E> {
  const graph = createGraph<T, E>();

  for (const nodeId of adj.keys()) {
    addGraphNode(graph, {
      id: nodeId,
      data: nodeData?.get(nodeId)
    });
  }

  for (const [source, targets] of adj) {
    for (const target of targets) {
      addGraphEdge(graph, { source, target });
    }
  }

  return graph;
}
