// @ts-nocheck
// Knowledge Galaxy — KnowledgeRecommendationEngine
// Generates personalized knowledge recommendations

import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface Recommendation {
  node: KnowledgeNode;
  reason: string;
  priority: number;
  type: "next_step" | "review" | "weakness" | "exploration" | "prerequisite";
}

export interface RecommendationOptions {
  limit?: number;
  type?: string;
  subject?: string;
}

export class KnowledgeRecommendationEngine {
  private static instance: KnowledgeRecommendationEngine;
  private initialized: boolean = false;
  private userId: string | null = null;

  // Recommendation history
  private recommendationHistory: Map<string, Date> = new Map();

  private constructor() {}

  public static getInstance(): KnowledgeRecommendationEngine {
    if (!KnowledgeRecommendationEngine.instance) {
      KnowledgeRecommendationEngine.instance = new KnowledgeRecommendationEngine();
    }
    return KnowledgeRecommendationEngine.instance;
  }

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
    this.initialized = true;
  }

  // Get recommendations for the user
  public async getRecommendations(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    options?: RecommendationOptions
  ): Promise<KnowledgeNode[]> {
    const { limit = 10, type, subject } = options || {};

    const recommendations: Array<{ node: KnowledgeNode; score: number; type: string }> = [];

    // Filter by subject if specified
    let candidates = nodes;
    if (subject) {
      candidates = nodes.filter(n => n.subject === subject);
    }

    // Generate different types of recommendations
    for (const node of candidates) {
      if (node.status === "mastered" || node.status === "hidden") continue;

      const recommendation = this.evaluateNode(node, nodes, edges);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);

    // Apply type filter
    let filtered = recommendations;
    if (type) {
      filtered = recommendations.filter(r => r.type === type);
    }

    return filtered.slice(0, limit).map(r => r.node);
  }

  // Evaluate a node for recommendation
  private evaluateNode(
    node: KnowledgeNode,
    allNodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): { node: KnowledgeNode; score: number; type: string } | null {
    let score = 0;
    let type = "exploration";

    // Check if node is unlocked
    if (node.status === "locked") return null;

    // Check if already recommended recently
    const lastRecommended = this.recommendationHistory.get(node.id);
    if (lastRecommended) {
      const hoursSince = (Date.now() - lastRecommended.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        score -= 50;
      }
    }

    // Calculate based on mastery level
    if (node.masteryScore < 50) {
      score += 30;
      type = "next_step";
    }

    if (node.masteryScore >= 50 && node.masteryScore < 80) {
      score += 20;
      type = "review";
    }

    // Check for weak points
    if (node.customData?.isWeakPoint) {
      score += 25;
      type = "weakness";
    }

    // Check for prerequisites
    const hasPrereqs = node.prerequisiteIds.length > 0;
    if (hasPrereqs) {
      const prereqMastery = node.prerequisiteIds.every(prereqId => {
        const prereq = allNodes.find(n => n.id === prereqId);
        return prereq && prereq.masteryScore >= 50;
      });

      if (prereqMastery) {
        score += 15;
        type = "next_step";
      } else {
        score -= 20;
      }
    }

    // Check importance
    score += node.importance * 2;

    // Check difficulty (prefer slightly challenging nodes)
    const optimalDifficulty = 3;
    const difficultyDiff = Math.abs(node.difficulty - optimalDifficulty);
    score += (3 - difficultyDiff) * 5;

    // Check for dependents that are in progress
    const hasDependentInProgress = edges.some(
      e => e.sourceNodeId === node.id &&
           e.type === "prerequisite" &&
           (allNodes.find(n => n.id === e.targetNodeId)?.status === "in_progress")
    );

    if (hasDependentInProgress) {
      score += 20;
      type = "prerequisite";
    }

    // Check for related nodes being studied
    const relatedStudied = edges.some(
      e => e.sourceNodeId === node.id &&
           e.type === "related_to" &&
           (allNodes.find(n => n.id === e.targetNodeId)?.status === "in_progress")
    );

    if (relatedStudied) {
      score += 10;
    }

    // Subject importance
    const subjectCounts = this.countBySubject(allNodes);
    const subjectFrequency = subjectCounts.get(node.subject) || 1;
    score += Math.min(10, subjectFrequency);

    if (score > 0) {
      return { node, score, type };
    }

    return null;
  }

  // Count nodes by subject
  private countBySubject(nodes: KnowledgeNode[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const node of nodes) {
      counts.set(node.subject, (counts.get(node.subject) || 0) + 1);
    }
    return counts;
  }

  // Get next steps for a specific node
  public async getNextSteps(
    currentNodeId: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Promise<KnowledgeNode[]> {
    const recommendations: KnowledgeNode[] = [];

    // Find nodes that depend on current node
    const dependentEdges = edges.filter(
      e => e.sourceNodeId === currentNodeId && e.type === "prerequisite"
    );

    for (const edge of dependentEdges) {
      const dependent = nodes.find(n => n.id === edge.targetNodeId);
      if (dependent && dependent.status !== "locked" && dependent.masteryScore < 80) {
        recommendations.push(dependent);
      }
    }

    // Find related nodes
    const relatedEdges = edges.filter(
      e => (e.sourceNodeId === currentNodeId || e.targetNodeId === currentNodeId) &&
           e.type === "related_to"
    );

    for (const edge of relatedEdges) {
      const relatedId = edge.sourceNodeId === currentNodeId
        ? edge.targetNodeId
        : edge.sourceNodeId;
      const related = nodes.find(n => n.id === relatedId);

      if (related && related.status !== "locked" && related.masteryScore < 80) {
        if (!recommendations.find(r => r.id === related.id)) {
          recommendations.push(related);
        }
      }
    }

    // Sort by mastery need (lower mastery = higher priority)
    recommendations.sort((a, b) => a.masteryScore - b.masteryScore);

    return recommendations.slice(0, 5);
  }

  // Get review recommendations (spaced repetition)
  public async getReviewRecommendations(
    nodes: KnowledgeNode[],
    maxResults: number = 5
  ): Promise<KnowledgeNode[]> {
    const mastered = nodes.filter(n => n.masteryScore >= 50 && n.masteryScore < 90);

    // Sort by last studied
    mastered.sort((a, b) => {
      const aTime = a.lastStudiedAt?.getTime() || 0;
      const bTime = b.lastStudiedAt?.getTime() || 0;
      return aTime - bTime;
    });

    return mastered.slice(0, maxResults);
  }

  // Get weakness-based recommendations
  public async getWeaknessRecommendations(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    maxResults: number = 5
  ): Promise<KnowledgeNode[]> {
    const weaknesses = nodes.filter(
      n => (n.customData?.isWeakPoint || n.masteryScore < 40) && n.status !== "hidden"
    );

    // Sort by importance
    weaknesses.sort((a, b) => b.importance - a.importance);

    return weaknesses.slice(0, maxResults);
  }

  // Get exploration recommendations
  public async getExplorationRecommendations(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    maxResults: number = 5
  ): Promise<KnowledgeNode[]> {
    const unexplored = nodes.filter(
      n => n.status === "discovered" && n.masteryScore === 0
    );

    // Sort by importance and connections
    unexplored.sort((a, b) => {
      const aConnections = edges.filter(
        e => e.sourceNodeId === a.id || e.targetNodeId === a.id
      ).length;
      const bConnections = edges.filter(
        e => e.sourceNodeId === b.id || e.targetNodeId === b.id
      ).length;

      const aScore = a.importance + aConnections;
      const bScore = b.importance + bConnections;

      return bScore - aScore;
    });

    return unexplored.slice(0, maxResults);
  }

  // Get learning path recommendations
  public async getLearningPathRecommendations(
    targetNodeId: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    maxResults: number = 10
  ): Promise<KnowledgeNode[]> {
    const path: KnowledgeNode[] = [];
    const visited = new Set<string>();

    const traverse = async (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      // Check prerequisites first
      const prereqEdges = edges.filter(
        e => e.targetNodeId === nodeId && e.type === "prerequisite"
      );

      for (const edge of prereqEdges) {
        await traverse(edge.sourceNodeId);
      }

      // Add this node if not mastered
      if (node.masteryScore < 80 && node.status !== "hidden") {
        path.push(node);
      }
    };

    await traverse(targetNodeId);

    return path.slice(0, maxResults);
  }

  // Generate full recommendation report
  public async generateReport(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Promise<{
    nextSteps: Recommendation[];
    reviews: Recommendation[];
    weaknesses: Recommendation[];
    exploration: Recommendation[];
  }> {
    const [nextSteps, reviews, weaknesses, exploration] = await Promise.all([
      this.getRecommendations(nodes, edges, { limit: 5, type: "next_step" }),
      this.getReviewRecommendations(nodes, 5),
      this.getWeaknessRecommendations(nodes, edges, 5),
      this.getExplorationRecommendations(nodes, edges, 5)
    ]);

    return {
      nextSteps: nextSteps.map(n => ({
        node: n,
        reason: this.getRecommendationReason(n, "next_step"),
        priority: n.importance,
        type: "next_step" as const
      })),
      reviews: reviews.map(n => ({
        node: n,
        reason: "Time for spaced repetition review",
        priority: 7,
        type: "review" as const
      })),
      weaknesses: weaknesses.map(n => ({
        node: n,
        reason: "Identified as a weak area",
        priority: n.importance,
        type: "weakness" as const
      })),
      exploration: exploration.map(n => ({
        node: n,
        reason: "Related to your current studies",
        priority: n.importance,
        type: "exploration" as const
      }))
    };
  }

  // Get reason for recommendation
  private getRecommendationReason(
    node: KnowledgeNode,
    type: string
  ): string {
    switch (type) {
      case "next_step":
        return `Next step in ${node.subject}`;
      case "review":
        return `Time to review ${node.title}`;
      case "weakness":
        return `Strengthen your understanding of ${node.title}`;
      case "exploration":
        return `Explore ${node.title}`;
      case "prerequisite":
        return `Required for advanced topics`;
      default:
        return `Recommended for your learning path`;
    }
  }

  // Mark recommendation as shown
  public markAsRecommended(nodeId: string): void {
    this.recommendationHistory.set(nodeId, new Date());
  }

  // Clear recommendation history
  public clearHistory(): void {
    this.recommendationHistory.clear();
  }
}

// Singleton export
export const knowledgeRecommendationEngine = KnowledgeRecommendationEngine.getInstance();
