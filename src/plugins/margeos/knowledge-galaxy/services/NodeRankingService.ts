// @ts-nocheck
// Knowledge Galaxy — NodeRankingService
// Service for ranking and scoring knowledge nodes

import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface NodeScore {
  nodeId: string;
  score: number;
  factors: {
    centrality: number;
    importance: number;
    learningValue: number;
    relevance: number;
  };
}

export interface RankingOptions {
  method?: "pagerank" | "degree" | "betweenness" | "combined";
  limit?: number;
  subject?: string;
  excludeMastered?: boolean;
}

export class NodeRankingService {
  private static instance: NodeRankingService;
  private cachedScores: Map<string, NodeScore> = new Map();
  private lastCalculation: Date | null = null;

  private constructor() {}

  public static getInstance(): NodeRankingService {
    if (!NodeRankingService.instance) {
      NodeRankingService.instance = new NodeRankingService();
    }
    return NodeRankingService.instance;
  }

  // Rank nodes using various methods
  public rankNodes(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    options?: RankingOptions
  ): NodeScore[] {
    const { method = "combined", limit = 10, subject, excludeMastered = false } = options || {};

    // Filter nodes
    let filteredNodes = nodes;
    if (subject) {
      filteredNodes = filteredNodes.filter(n => n.subject === subject);
    }
    if (excludeMastered) {
      filteredNodes = filteredNodes.filter(n => n.masteryScore < 80);
    }

    // Calculate scores based on method
    let scores: NodeScore[];

    switch (method) {
      case "pagerank":
        scores = this.calculatePageRank(filteredNodes, edges);
        break;
      case "degree":
        scores = this.calculateDegreeCentrality(filteredNodes, edges);
        break;
      case "betweenness":
        scores = this.calculateBetweennessCentrality(filteredNodes, edges);
        break;
      case "combined":
      default:
        scores = this.calculateCombinedScore(filteredNodes, edges);
        break;
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Apply limit
    return scores.slice(0, limit);
  }

  // Calculate PageRank
  private calculatePageRank(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): NodeScore[] {
    const dampingFactor = 0.85;
    const iterations = 20;
    const tolerance = 0.0001;

    // Initialize ranks
    const ranks = new Map<string, number>();
    for (const node of nodes) {
      ranks.set(node.id, 1 / nodes.length);
    }

    // Build adjacency for outgoing edges
    const outgoing = new Map<string, Set<string>>();
    for (const edge of edges) {
      const existing = outgoing.get(edge.sourceNodeId) || new Set();
      existing.add(edge.targetNodeId);
      outgoing.set(edge.sourceNodeId, existing);
    }

    // Iterative calculation
    for (let i = 0; i < iterations; i++) {
      const newRanks = new Map<string, number>();
      let maxDiff = 0;

      for (const node of nodes) {
        let rank = (1 - dampingFactor) / nodes.length;

        // Sum contributions from incoming edges
        for (const edge of edges) {
          if (edge.targetNodeId === node.id) {
            const outLinks = outgoing.get(edge.sourceNodeId);
            if (outLinks && outLinks.size > 0) {
              const contribution = ranks.get(edge.sourceNodeId)! / outLinks.size;
              rank += dampingFactor * contribution;
            }
          }
        }

        newRanks.set(node.id, rank);
        maxDiff = Math.max(maxDiff, Math.abs(rank - ranks.get(node.id)!));
      }

      ranks.clear();
      newRanks.forEach((v, k) => ranks.set(k, v));

      if (maxDiff < tolerance) break;
    }

    // Build result
    return Array.from(ranks.entries()).map(([nodeId, score]) => ({
      nodeId,
      score: score * nodes.length, // Normalize
      factors: {
        centrality: score * nodes.length,
        importance: 0,
        learningValue: 0,
        relevance: 0
      }
    }));
  }

  // Calculate degree centrality
  private calculateDegreeCentrality(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): NodeScore[] {
    const degreeCounts = new Map<string, number>();

    for (const node of nodes) {
      degreeCounts.set(node.id, 0);
    }

    for (const edge of edges) {
      degreeCounts.set(
        edge.sourceNodeId,
        (degreeCounts.get(edge.sourceNodeId) || 0) + 1
      );
      if (edge.bidirectional) {
        degreeCounts.set(
          edge.targetNodeId,
          (degreeCounts.get(edge.targetNodeId) || 0) + 1
        );
      }
    }

    const maxDegree = Math.max(...Array.from(degreeCounts.values()), 1);

    return Array.from(degreeCounts.entries()).map(([nodeId, degree]) => ({
      nodeId,
      score: degree / maxDegree,
      factors: {
        centrality: degree / maxDegree,
        importance: 0,
        learningValue: 0,
        relevance: 0
      }
    }));
  }

  // Calculate betweenness centrality (simplified)
  private calculateBetweennessCentrality(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): NodeScore[] {
    const betweenness = new Map<string, number>();

    for (const node of nodes) {
      betweenness.set(node.id, 0);
    }

    // Calculate for all pairs
    for (const source of nodes) {
      for (const target of nodes) {
        if (source.id === target.id) continue;

        // Find shortest path
        const path = this.findShortestPath(source.id, target.id, edges);
        if (path.length > 1) {
          // Increment betweenness for intermediate nodes
          for (let i = 1; i < path.length - 1; i++) {
            betweenness.set(
              path[i],
              (betweenness.get(path[i]) || 0) + 1
            );
          }
        }
      }
    }

    // Normalize
    const maxBetweenness = Math.max(...Array.from(betweenness.values()), 1);

    return Array.from(betweenness.entries()).map(([nodeId, value]) => ({
      nodeId,
      score: value / maxBetweenness,
      factors: {
        centrality: value / maxBetweenness,
        importance: 0,
        learningValue: 0,
        relevance: 0
      }
    }));
  }

  // Calculate combined score
  private calculateCombinedScore(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): NodeScore[] {
    // Calculate individual scores
    const pagerank = this.calculatePageRank(nodes, edges);
    const degree = this.calculateDegreeCentrality(nodes, edges);
    const betweenness = this.calculateBetweennessCentrality(nodes, edges);

    // Combine scores
    const scores: NodeScore[] = [];

    for (const node of nodes) {
      const pr = pagerank.find(s => s.nodeId === node.id);
      const deg = degree.find(s => s.nodeId === node.id);
      const bet = betweenness.find(s => s.nodeId === node.id);

      // Learning value (based on mastery gap and difficulty)
      const learningValue = this.calculateLearningValue(node);

      // Importance
      const importance = node.importance / 5;

      // Combined score with weights
      const combinedScore =
        (pr?.factors.centrality || 0) * 0.3 +
        (deg?.factors.centrality || 0) * 0.2 +
        (bet?.factors.centrality || 0) * 0.1 +
        importance * 0.2 +
        learningValue * 0.2;

      scores.push({
        nodeId: node.id,
        score: combinedScore,
        factors: {
          centrality: (pr?.factors.centrality || 0) * 0.5 + (deg?.factors.centrality || 0) * 0.5,
          importance,
          learningValue,
          relevance: 0
        }
      });
    }

    return scores;
  }

  // Calculate learning value
  private calculateLearningValue(node: KnowledgeNode): number {
    // Higher value for nodes that are:
    // - Not yet mastered
    // - Have prerequisites that are mastered
    // - Have dependents in progress

    const masteryGap = 1 - (node.masteryScore / 100);
    const difficultyBonus = node.difficulty / 5;

    return masteryGap * 0.7 + difficultyBonus * 0.3;
  }

  // Find shortest path between two nodes
  private findShortestPath(
    startId: string,
    endId: string,
    edges: KnowledgeEdge[]
  ): string[] {
    const adjacency = new Map<string, string[]>();

    for (const edge of edges) {
      const existing = adjacency.get(edge.sourceNodeId) || [];
      existing.push(edge.targetNodeId);
      adjacency.set(edge.sourceNodeId, existing);

      if (edge.bidirectional) {
        const rev = adjacency.get(edge.targetNodeId) || [];
        rev.push(edge.sourceNodeId);
        adjacency.set(edge.targetNodeId, rev);
      }
    }

    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: startId, path: [startId] }
    ];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      if (nodeId === endId) {
        return path;
      }

      const neighbors = adjacency.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return [];
  }

  // Get top recommended nodes for learning
  public getTopRecommendations(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    limit: number = 10
  ): KnowledgeNode[] {
    const ranked = this.rankNodes(nodes, edges, { method: "combined", limit: limit * 2 });

    // Filter to available nodes (not mastered, not locked)
    const available = nodes.filter(n =>
      n.status !== "locked" &&
      n.status !== "hidden" &&
      n.masteryScore < 80
    );

    const rankedAvailable = ranked.filter(r =>
      available.some(n => n.id === r.nodeId)
    );

    return rankedAvailable
      .slice(0, limit)
      .map(r => available.find(n => n.id === r.nodeId)!)
      .filter(Boolean);
  }

  // Clear cache
  public clearCache(): void {
    this.cachedScores.clear();
    this.lastCalculation = null;
  }
}

// Singleton export
export const nodeRankingService = NodeRankingService.getInstance();
