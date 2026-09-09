// Knowledge Galaxy — KnowledgeGraph Model
// Represents the complete knowledge graph structure

import type { KnowledgeNode } from "./KnowledgeNode";
import type { KnowledgeEdge } from "./KnowledgeEdge";
import type { GalaxyCluster } from "./GalaxyCluster";

export interface KnowledgeGraph {
  id: string;
  name: string;
  description: string;

  // Core elements
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  clusters: GalaxyCluster[];

  // Graph metadata
  nodeCount: number;
  edgeCount: number;
  clusterCount: number;

  // Statistics
  averageMastery: number;
  totalStudyTime: number;
  discoveredNodes: number;
  masteredNodes: number;

  // Graph properties
  isDirected: boolean;
  isWeighted: boolean;
  density: number;
  diameter?: number;

  // Source
  sourceEngines: string[];
  lastUpdated: Date;

  // Versioning
  version: string;
  createdAt: Date;
  updatedAt: Date;

  // Additional
  metadata: Record<string, any>;
}

export interface KnowledgeGraphExtended extends KnowledgeGraph {
  // Extended properties
  nodeMap: Map<string, KnowledgeNode>;
  edgeMap: Map<string, KnowledgeEdge>;
  clusterMap: Map<string, GalaxyCluster>;

  // Subject-based grouping
  subjects: SubjectGraph[];

  // Graph algorithms
  adjacencyList: Map<string, string[]>;
  reverseAdjacencyList: Map<string, string[]>;
  centralityScores: Map<string, number>;

  // User-specific
  userNodeStates: Map<string, NodeState>;
}

export interface SubjectGraph {
  subject: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  mastery: number;
  progress: number;
}

export interface NodeState {
  nodeId: string;
  status: "undiscovered" | "discovered" | "in_progress" | "mastered";
  masteryScore: number;
  lastAccessedAt?: Date;
  timesAccessed: number;
}

export interface GraphStatistics {
  totalNodes: number;
  totalEdges: number;
  averageDegree: number;
  density: number;
  clusteringCoefficient: number;
  connectedComponents: number;
  diameter?: number;
  averagePathLength?: number;
}

export interface GraphMetrics {
  coverage: number; // % of potential nodes discovered
  masteryProgress: number;
  learningVelocity: number;
  explorationRate: number;
  interconnectionDegree: number;
}

// Factory functions
export function createKnowledgeGraph(
  name: string,
  options?: Partial<KnowledgeGraph>
): KnowledgeGraph {
  const id = `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    name,
    description: "",
    nodes: [],
    edges: [],
    clusters: [],
    nodeCount: 0,
    edgeCount: 0,
    clusterCount: 0,
    averageMastery: 0,
    totalStudyTime: 0,
    discoveredNodes: 0,
    masteredNodes: 0,
    isDirected: true,
    isWeighted: true,
    density: 0,
    sourceEngines: [],
    lastUpdated: new Date(),
    version: "1.0.0",
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
    ...options
  };
}

// Build graph from nodes and edges
export function buildKnowledgeGraph(
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[],
  clusters?: GalaxyCluster[]
): KnowledgeGraph {
  const nodeIds = new Set(nodes.map(n => n.id));
  const validEdges = edges.filter(
    e => nodeIds.has(e.sourceNodeId) && nodeIds.has(e.targetNodeId)
  );

  const totalMastery = nodes.reduce((sum, n) => sum + n.masteryScore, 0);
  const masteredCount = nodes.filter(n => n.masteryScore >= 80).length;
  const discoveredCount = nodes.filter(n => n.status !== "hidden").length;

  // Calculate density
  const maxEdges = nodes.length * (nodes.length - 1);
  const density = maxEdges > 0 ? validEdges.length / maxEdges : 0;

  // Extract source engines
  const sourceEngines = [...new Set(nodes.map(n => n.sourceEngine))];

  return createKnowledgeGraph("Knowledge Graph", {
    nodes,
    edges: validEdges,
    clusters: clusters || [],
    nodeCount: nodes.length,
    edgeCount: validEdges.length,
    clusterCount: (clusters || []).length,
    averageMastery: nodes.length > 0 ? Math.round(totalMastery / nodes.length) : 0,
    discoveredNodes: discoveredCount,
    masteredNodes: masteredCount,
    density,
    sourceEngines
  });
}

// Calculate graph statistics
export function calculateGraphStatistics(graph: KnowledgeGraph): GraphStatistics {
  const nodeCount = graph.nodes.length;
  const edgeCount = graph.edges.length;

  if (nodeCount === 0) {
    return {
      totalNodes: 0,
      totalEdges: 0,
      averageDegree: 0,
      density: 0,
      clusteringCoefficient: 0,
      connectedComponents: 0
    };
  }

  // Build adjacency list
  const adjacencyList = new Map<string, Set<string>>();
  for (const node of graph.nodes) {
    adjacencyList.set(node.id, new Set());
  }

  for (const edge of graph.edges) {
    adjacencyList.get(edge.sourceNodeId)?.add(edge.targetNodeId);
    if (edge.bidirectional) {
      adjacencyList.get(edge.targetNodeId)?.add(edge.sourceNodeId);
    }
  }

  // Calculate average degree
  let totalDegree = 0;
  for (const neighbors of adjacencyList.values()) {
    totalDegree += neighbors.size;
  }
  const averageDegree = totalDegree / nodeCount;

  // Calculate density
  const maxPossibleEdges = graph.isDirected
    ? nodeCount * (nodeCount - 1)
    : (nodeCount * (nodeCount - 1)) / 2;
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

  // Simplified clustering coefficient (local clustering for each node)
  let totalLocalClustering = 0;
  let nodesWithNeighbors = 0;

  for (const [nodeId, neighbors] of adjacencyList) {
    const neighborArray = Array.from(neighbors);
    if (neighborArray.length < 2) continue;

    nodesWithNeighbors++;
    let triangles = 0;
    const maxTriangles = (neighborArray.length * (neighborArray.length - 1)) / 2;

    for (let i = 0; i < neighborArray.length; i++) {
      for (let j = i + 1; j < neighborArray.length; j++) {
        const neighbor1 = adjacencyList.get(neighborArray[i]);
        if (neighbor1?.has(neighborArray[j])) {
          triangles++;
        }
      }
    }

    totalLocalClustering += triangles / maxTriangles;
  }

  const clusteringCoefficient = nodesWithNeighbors > 0
    ? totalLocalClustering / nodesWithNeighbors
    : 0;

  // Count connected components (simplified BFS)
  const visited = new Set<string>();
  let connectedComponents = 0;

  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue;

    // BFS
    const queue = [node.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = adjacencyList.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }

    connectedComponents++;
  }

  return {
    totalNodes: nodeCount,
    totalEdges: edgeCount,
    averageDegree: Math.round(averageDegree * 100) / 100,
    density: Math.round(density * 1000) / 1000,
    clusteringCoefficient: Math.round(clusteringCoefficient * 1000) / 1000,
    connectedComponents
  };
}

// Calculate graph metrics
export function calculateGraphMetrics(graph: KnowledgeGraph): GraphMetrics {
  const nodeCount = graph.nodes.length;
  const discoveredCount = graph.discoveredNodes;
  const masteredCount = graph.masteredNodes;

  const coverage = nodeCount > 0 ? (discoveredCount / nodeCount) * 100 : 0;
  const masteryProgress = nodeCount > 0 ? (masteredCount / nodeCount) * 100 : 0;

  // Learning velocity (mastered per total study time)
  const learningVelocity = graph.totalStudyTime > 0
    ? (masteredCount / graph.totalStudyTime) * 1000
    : 0;

  // Exploration rate
  const explorationRate = coverage;

  // Interconnection degree (based on density)
  const interconnectionDegree = graph.density * 100;

  return {
    coverage: Math.round(coverage * 100) / 100,
    masteryProgress: Math.round(masteryProgress * 100) / 100,
    learningVelocity: Math.round(learningVelocity * 1000) / 1000,
    explorationRate: Math.round(explorationRate * 100) / 100,
    interconnectionDegree: Math.round(interconnectionDegree * 100) / 100
  };
}

// Merge two graphs
export function mergeGraphs(graphs: KnowledgeGraph[]): KnowledgeGraph {
  if (graphs.length === 0) {
    return createKnowledgeGraph("Empty Graph");
  }

  if (graphs.length === 1) {
    return graphs[0];
  }

  const allNodes: KnowledgeNode[] = [];
  const allEdges: KnowledgeEdge[] = [];
  const allClusters: GalaxyCluster[] = [];
  const nodeIds = new Set<string>();
  const allSourceEngines = new Set<string>();

  for (const graph of graphs) {
    for (const node of graph.nodes) {
      if (!nodeIds.has(node.id)) {
        nodeIds.add(node.id);
        allNodes.push(node);
        allSourceEngines.add(node.sourceEngine);
      }
    }

    for (const edge of graph.edges) {
      if (nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId)) {
        allEdges.push(edge);
      }
    }

    allClusters.push(...graph.clusters);
  }

  return buildKnowledgeGraph(allNodes, allEdges, allClusters);
}

// Add node to graph
export function addNodeToGraph(
  graph: KnowledgeGraph,
  node: KnowledgeNode
): KnowledgeGraph {
  if (graph.nodes.some(n => n.id === node.id)) {
    return graph;
  }

  return {
    ...graph,
    nodes: [...graph.nodes, node],
    nodeCount: graph.nodeCount + 1,
    discoveredNodes: node.status !== "hidden" ? graph.discoveredNodes + 1 : graph.discoveredNodes,
    lastUpdated: new Date(),
    updatedAt: new Date()
  };
}

// Remove node from graph
export function removeNodeFromGraph(
  graph: KnowledgeGraph,
  nodeId: string
): KnowledgeGraph {
  return {
    ...graph,
    nodes: graph.nodes.filter(n => n.id !== nodeId),
    edges: graph.edges.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId),
    nodeCount: graph.nodeCount - 1,
    edgeCount: graph.edges.length,
    lastUpdated: new Date(),
    updatedAt: new Date()
  };
}

// Add edge to graph
export function addEdgeToGraph(
  graph: KnowledgeGraph,
  edge: KnowledgeEdge
): KnowledgeGraph {
  if (graph.edges.some(e => e.id === edge.id)) {
    return graph;
  }

  // Validate node existence
  if (!graph.nodes.some(n => n.id === edge.sourceNodeId) ||
      !graph.nodes.some(n => n.id === edge.targetNodeId)) {
    return graph;
  }

  // Update node connections
  const updatedNodes = graph.nodes.map(node => {
    if (node.id === edge.sourceNodeId) {
      return {
        ...node,
        connectedNodeIds: [...new Set([...node.connectedNodeIds, edge.targetNodeId])]
      };
    }
    if (node.id === edge.targetNodeId) {
      return {
        ...node,
        connectedNodeIds: [...new Set([...node.connectedNodeIds, edge.sourceNodeId])]
      };
    }
    return node;
  });

  return {
    ...graph,
    nodes: updatedNodes,
    edges: [...graph.edges, edge],
    edgeCount: graph.edgeCount + 1,
    lastUpdated: new Date(),
    updatedAt: new Date()
  };
}

// Validate graph integrity
export function validateGraphIntegrity(graph: KnowledgeGraph): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for orphan nodes
  const connectedNodeIds = new Set<string>();
  for (const edge of graph.edges) {
    connectedNodeIds.add(edge.sourceNodeId);
    connectedNodeIds.add(edge.targetNodeId);
  }

  for (const node of graph.nodes) {
    if (!connectedNodeIds.has(node.id) && graph.nodes.length > 1) {
      warnings.push(`Node "${node.title}" has no connections`);
    }
  }

  // Check for self-loops
  for (const edge of graph.edges) {
    if (edge.sourceNodeId === edge.targetNodeId) {
      errors.push(`Edge "${edge.id}" has self-loop`);
    }
  }

  // Check for duplicate edges
  const edgePairs = new Set<string>();
  for (const edge of graph.edges) {
    const pair = `${edge.sourceNodeId}-${edge.targetNodeId}`;
    if (edgePairs.has(pair)) {
      warnings.push(`Duplicate edge between "${edge.sourceNodeId}" and "${edge.targetNodeId}"`);
    }
    edgePairs.add(pair);
  }

  // Check for missing cluster nodes
  for (const cluster of graph.clusters) {
    for (const nodeId of cluster.nodeIds) {
      if (!graph.nodes.some(n => n.id === nodeId)) {
        warnings.push(`Cluster "${cluster.name}" references missing node "${nodeId}"`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Serialize graph for storage
export function serializeGraph(graph: KnowledgeGraph): string {
  return JSON.stringify(graph, null, 2);
}

// Deserialize graph from storage
export function deserializeGraph(json: string): KnowledgeGraph {
  const data = JSON.parse(json);

  // Convert date strings back to Date objects
  data.createdAt = new Date(data.createdAt);
  data.updatedAt = new Date(data.updatedAt);
  data.lastUpdated = new Date(data.lastUpdated);

  for (const node of data.nodes) {
    node.createdAt = new Date(node.createdAt);
    node.updatedAt = new Date(node.updatedAt);
    if (node.lastStudiedAt) node.lastStudiedAt = new Date(node.lastStudiedAt);
  }

  for (const edge of data.edges) {
    edge.discoveredAt = new Date(edge.discoveredAt);
    if (edge.lastUsedAt) edge.lastUsedAt = new Date(edge.lastUsedAt);
  }

  for (const cluster of data.clusters) {
    cluster.createdAt = new Date(cluster.createdAt);
    cluster.updatedAt = new Date(cluster.updatedAt);
    if (cluster.lastExploredAt) cluster.lastExploredAt = new Date(cluster.lastExploredAt);
  }

  return data;
}
