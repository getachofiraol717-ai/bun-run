// @ts-nocheck
// Knowledge Galaxy — RelationshipAnalysisService
// Service for analyzing relationships between knowledge nodes

import type { KnowledgeNode, KnowledgeEdge, EdgeType } from "../models";

export interface RelationshipAnalysis {
  totalRelationships: number;
  byType: Record<EdgeType, number>;
  averageStrength: number;
  strongestRelationships: KnowledgeEdge[];
  orphanedNodes: string[];
  clusters: string[][];
}

export interface RelationshipPattern {
  pattern: string;
  count: number;
  examples: KnowledgeEdge[];
}

export class RelationshipAnalysisService {
  private static instance: RelationshipAnalysisService;

  private constructor() {}

  public static getInstance(): RelationshipAnalysisService {
    if (!RelationshipAnalysisService.instance) {
      RelationshipAnalysisService.instance = new RelationshipAnalysisService();
    }
    return RelationshipAnalysisService.instance;
  }

  // Analyze all relationships
  public analyzeRelationships(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): RelationshipAnalysis {
    const byType: Record<EdgeType, number> = {
      prerequisite: 0,
      depends_on: 0,
      explains: 0,
      uses: 0,
      extends: 0,
      related_to: 0,
      applied_in: 0,
      contradicts: 0,
      similar_to: 0,
      part_of: 0,
      references: 0,
      examples: 0,
      derives_from: 0,
      leads_to: 0,
      supports: 0
    } as any;

    // Count by type
    for (const edge of edges) {
      byType[edge.type] = (byType[edge.type] || 0) + 1;
    }

    // Calculate average strength
    const totalStrength = edges.reduce((sum, e) => sum + e.weight, 0);
    const averageStrength = edges.length > 0 ? totalStrength / edges.length : 0;

    // Find strongest relationships
    const sortedByStrength = [...edges].sort((a, b) => b.weight - a.weight);
    const strongestRelationships = sortedByStrength.slice(0, 10);

    // Find orphaned nodes
    const connectedNodes = new Set<string>();
    for (const edge of edges) {
      connectedNodes.add(edge.sourceNodeId);
      connectedNodes.add(edge.targetNodeId);
    }

    const orphanedNodes = nodes
      .filter(n => !connectedNodes.has(n.id))
      .map(n => n.id);

    // Find clusters
    const clusters = this.findClusters(nodes, edges);

    return {
      totalRelationships: edges.length,
      byType,
      averageStrength,
      strongestRelationships,
      orphanedNodes,
      clusters
    };
  }

  // Find clusters using connected components
  private findClusters(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): string[][] {
    const adjacency = new Map<string, Set<string>>();

    for (const node of nodes) {
      adjacency.set(node.id, new Set());
    }

    for (const edge of edges) {
      adjacency.get(edge.sourceNodeId)?.add(edge.targetNodeId);
      if (edge.bidirectional) {
        adjacency.get(edge.targetNodeId)?.add(edge.sourceNodeId);
      }
    }

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

        const neighbors = adjacency.get(current) || new Set();
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

  // Identify relationship patterns
  public identifyPatterns(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): RelationshipPattern[] {
    const patterns: RelationshipPattern[] = [];

    // Pattern: Chain (A -> B -> C)
    const chains = this.findChains(nodes, edges);
    if (chains.length > 0) {
      patterns.push({
        pattern: "Chain (sequential learning)",
        count: chains.length,
        examples: chains.slice(0, 5).flat()
      });
    }

    // Pattern: Hub (node with many connections)
    const hubs = this.findHubs(edges);
    if (hubs.length > 0) {
      patterns.push({
        pattern: "Hub (central concepts)",
        count: hubs.length,
        examples: hubs
      });
    }

    // Pattern: Star (one node connected to many)
    const stars = this.findStars(edges);
    if (stars.length > 0) {
      patterns.push({
        pattern: "Star (foundational concepts)",
        count: stars.length,
        examples: stars
      });
    }

    // Pattern: Cycle (A -> B -> C -> A)
    const cycles = this.findCycles(nodes, edges);
    if (cycles.length > 0) {
      patterns.push({
        pattern: "Cycle (related concepts)",
        count: cycles.length,
        examples: cycles.slice(0, 5).flat()
      });
    }

    return patterns;
  }

  // Find chain patterns
  private findChains(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): KnowledgeEdge[][] {
    const chains: KnowledgeEdge[][] = [];

    // Look for prerequisite chains
    const prereqs = edges.filter(e => e.type === "prerequisite");
    const chainEdges = new Set<string>();

    for (const prereq of prereqs) {
      const chain = this.traceChain(prereq.sourceNodeId, prereqs);
      if (chain.length >= 2) {
        chains.push(chain);
        chain.forEach(e => chainEdges.add(e.id));
      }
    }

    return chains;
  }

  // Trace a chain
  private traceChain(startId: string, edges: KnowledgeEdge[]): KnowledgeEdge[] {
    const chain: KnowledgeEdge[] = [];
    let currentId = startId;

    // Find outgoing edge from current
    const findOutgoing = (nodeId: string): KnowledgeEdge | undefined => {
      return edges.find(e => e.sourceNodeId === nodeId);
    };

    let edge = findOutgoing(currentId);
    while (edge && chain.length < 10) {
      chain.push(edge);
      currentId = edge.targetNodeId;
      edge = findOutgoing(currentId);
    }

    return chain;
  }

  // Find hub nodes
  private findHubs(edges: KnowledgeEdge[]): KnowledgeEdge[] {
    const counts = new Map<string, number>();

    for (const edge of edges) {
      counts.set(edge.sourceNodeId, (counts.get(edge.sourceNodeId) || 0) + 1);
      counts.set(edge.targetNodeId, (counts.get(edge.targetNodeId) || 0) + 1);
    }

    const avgConnections = Array.from(counts.values()).reduce((a, b) => a + b, 0) / counts.size;
    const hubs = Array.from(counts.entries())
      .filter(([_, count]) => count > avgConnections * 2)
      .map(([nodeId, count]) => edges.find(e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId))
      .filter(Boolean) as KnowledgeEdge[];

    return hubs.slice(0, 10);
  }

  // Find star patterns
  private findStars(edges: KnowledgeEdge[]): KnowledgeEdge[] {
    const outgoingCounts = new Map<string, number>();

    for (const edge of edges) {
      outgoingCounts.set(edge.sourceNodeId, (outgoingCounts.get(edge.sourceNodeId) || 0) + 1);
    }

    const avgOutgoing = Array.from(outgoingCounts.values()).reduce((a, b) => a + b, 0) / Math.max(outgoingCounts.size, 1);
    const stars = Array.from(outgoingCounts.entries())
      .filter(([_, count]) => count > avgOutgoing * 2 && count >= 3)
      .map(([nodeId]) => edges.find(e => e.sourceNodeId === nodeId))
      .filter(Boolean) as KnowledgeEdge[];

    return stars.slice(0, 10);
  }

  // Find cycles
  private findCycles(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): KnowledgeEdge[][] {
    const cycles: KnowledgeEdge[][] = [];
    const visited = new Set<string>();

    // Build adjacency
    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
      const existing = adjacency.get(edge.sourceNodeId) || [];
      existing.push(edge.targetNodeId);
      adjacency.set(edge.sourceNodeId, existing);
    }

    // DFS to find cycles
    const findCycles = (startId: string, path: string[], pathEdges: KnowledgeEdge[]) => {
      if (path.includes(startId) && path.length >= 2) {
        const cycleStart = path.indexOf(startId);
        const cycle = path.slice(cycleStart);
        cycles.push(pathEdges.slice(cycleStart));
        return;
      }

      if (visited.has(startId)) return;

      visited.add(startId);
      path.push(startId);

      const neighbors = adjacency.get(startId) || [];
      for (const neighbor of neighbors) {
        const edge = edges.find(e => e.sourceNodeId === startId && e.targetNodeId === neighbor);
        if (edge) {
          findCycles(neighbor, path, [...pathEdges, edge]);
        }
      }

      path.pop();
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        findCycles(node.id, [], []);
      }
    }

    return cycles.slice(0, 10);
  }

  // Suggest new relationships
  public suggestRelationships(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Array<{ source: string; target: string; reason: string; strength: number }> {
    const suggestions: Array<{ source: string; target: string; reason: string; strength: number }> = [];

    // Find nodes with similar keywords
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Skip if already connected
        const alreadyConnected = edges.some(
          e => (e.sourceNodeId === nodeA.id && e.targetNodeId === nodeB.id) ||
               (e.sourceNodeId === nodeB.id && e.targetNodeId === nodeA.id)
        );

        if (alreadyConnected) continue;

        // Check for shared keywords
        const sharedKeywords = nodeA.keywords.filter(k =>
          nodeB.keywords.includes(k)
        );

        if (sharedKeywords.length >= 2) {
          suggestions.push({
            source: nodeA.id,
            target: nodeB.id,
            reason: `Shared topics: ${sharedKeywords.slice(0, 3).join(", ")}`,
            strength: Math.min(sharedKeywords.length / 5, 0.8)
          });
        }

        // Check for same chapter
        if (nodeA.chapter && nodeA.chapter === nodeB.chapter && nodeA.id !== nodeB.id) {
          suggestions.push({
            source: nodeA.id,
            target: nodeB.id,
            reason: `Same chapter: ${nodeA.chapter}`,
            strength: 0.6
          });
        }
      }
    }

    // Sort by strength
    suggestions.sort((a, b) => b.strength - a.strength);

    return suggestions.slice(0, 20);
  }

  // Get relationship statistics
  public getStatistics(edges: KnowledgeEdge[]): {
    total: number;
    byType: Record<string, number>;
    byStrength: { weak: number; medium: number; strong: number };
    bidirectionalRatio: number;
  } {
    const byType: Record<string, number> = {};
    let weak = 0, medium = 0, strong = 0;
    let bidirectional = 0;

    for (const edge of edges) {
      byType[edge.type] = (byType[edge.type] || 0) + 1;

      if (edge.weight < 0.33) weak++;
      else if (edge.weight < 0.66) medium++;
      else strong++;

      if (edge.bidirectional) bidirectional++;
    }

    return {
      total: edges.length,
      byType,
      byStrength: { weak, medium, strong },
      bidirectionalRatio: edges.length > 0 ? bidirectional / edges.length : 0
    };
  }
}

// Singleton export
export const relationshipAnalysisService = RelationshipAnalysisService.getInstance();
