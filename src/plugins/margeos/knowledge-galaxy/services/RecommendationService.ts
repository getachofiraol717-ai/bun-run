// @ts-nocheck
// Knowledge Galaxy — RecommendationService
// Service for generating learning recommendations based on the knowledge graph

import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface Recommendation {
  node: KnowledgeNode;
  type: "next_step" | "review" | "weakness" | "exploration" | "prerequisite";
  reason: string;
  priority: number;
  estimatedTime: number;
}

export interface RecommendationOptions {
  limit?: number;
  subject?: string;
  type?: string;
  excludeCompleted?: boolean;
}

export class RecommendationService {
  private static instance: RecommendationService;
  private userId: string | null = null;
  private lastRecommendations: Map<string, Date> = new Map();

  private constructor() {}

  public static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
  }

  // Get all recommendations
  public async getRecommendations(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[],
    options?: RecommendationOptions
  ): Promise<Recommendation[]> {
    const { limit = 10, subject, type, excludeCompleted = true } = options || {};

    // Filter nodes
    let candidates = nodes;

    if (subject) {
      candidates = candidates.filter(n => n.subject === subject);
    }

    if (excludeCompleted) {
      candidates = candidates.filter(n => n.status !== "mastered");
    }

    // Generate recommendations of different types
    const recommendations: Recommendation[] = [];

    // Next steps
    if (!type || type === "next_step") {
      recommendations.push(...this.getNextSteps(candidates, edges));
    }

    // Reviews
    if (!type || type === "review") {
      recommendations.push(...this.getReviews(candidates));
    }

    // Weaknesses
    if (!type || type === "weakness") {
      recommendations.push(...this.getWeaknesses(candidates, edges));
    }

    // Exploration
    if (!type || type === "exploration") {
      recommendations.push(...this.getExplorations(candidates, edges));
    }

    // Sort by priority
    recommendations.sort((a, b) => b.priority - a.priority);

    // Apply limit
    return recommendations.slice(0, limit);
  }

  // Get next step recommendations
  private getNextSteps(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const node of nodes) {
      if (node.status === "locked" || node.status === "hidden") continue;
      if (node.masteryScore >= 80) continue;

      // Calculate priority
      let priority = 0;
      let reason = "";

      // Higher priority for nodes with mastered prerequisites
      const prereqsMet = this.checkPrerequisites(node, edges, nodes);
      if (prereqsMet) {
        priority += 30;
        reason = "Prerequisites mastered - ready to learn";
      }

      // Higher priority for nodes with dependents in progress
      const dependentInProgress = this.hasDependentInProgress(node, edges, nodes);
      if (dependentInProgress) {
        priority += 20;
        reason = "Unlocks topics you're currently learning";
      }

      // Factor in importance
      priority += node.importance * 5;

      // Factor in difficulty (prefer slightly challenging)
      const optimalDifficulty = 3;
      const difficultyDiff = Math.abs(node.difficulty - optimalDifficulty);
      priority += (3 - difficultyDiff) * 3;

      if (priority > 20) {
        recommendations.push({
          node,
          type: "next_step",
          reason,
          priority,
          estimatedTime: node.estimatedStudyTime
        });
      }
    }

    return recommendations;
  }

  // Get review recommendations (spaced repetition)
  private getReviews(nodes: KnowledgeNode[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (const node of nodes) {
      if (node.masteryScore < 30 || node.masteryScore >= 90) continue;
      if (!node.lastStudiedAt) continue;

      const daysSinceStudy = (now.getTime() - node.lastStudiedAt.getTime()) / oneDayMs;

      // Calculate review priority based on time since last study
      let priority = 0;
      if (daysSinceStudy >= 1) priority += 20;
      if (daysSinceStudy >= 3) priority += 15;
      if (daysSinceStudy >= 7) priority += 10;
      if (daysSinceStudy >= 14) priority += 10;

      // Higher priority for nodes with lower mastery
      priority += Math.round((80 - node.masteryScore) / 10) * 5;

      if (priority > 20) {
        recommendations.push({
          node,
          type: "review",
          reason: `Last reviewed ${Math.round(daysSinceStudy)} days ago`,
          priority,
          estimatedTime: Math.max(10, node.estimatedStudyTime / 2)
        });
      }
    }

    return recommendations;
  }

  // Get weakness-based recommendations
  private getWeaknesses(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const node of nodes) {
      if (node.status === "hidden") continue;
      if (node.masteryScore >= 60) continue;

      // Check if marked as weak point
      const isWeakPoint = node.customData?.isWeakPoint;

      // Check for failed practice
      const hasFailedPractice = node.timesStudied > 0 && node.masteryScore < 40;

      if (isWeakPoint || hasFailedPractice) {
        const priority = isWeakPoint ? 40 : 25;

        recommendations.push({
          node,
          type: "weakness",
          reason: isWeakPoint
            ? "Identified as a knowledge gap"
            : "Needs reinforcement through practice",
          priority,
          estimatedTime: node.estimatedStudyTime
        });
      }
    }

    return recommendations;
  }

  // Get exploration recommendations
  private getExplorations(
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find unexplored nodes
    for (const node of nodes) {
      if (node.status !== "discovered") continue;
      if (node.masteryScore > 0) continue;
      if (node.timesStudied > 0) continue;

      // Calculate priority based on connections
      const connectionCount = edges.filter(
        e => e.sourceNodeId === node.id || e.targetNodeId === node.id
      ).length;

      // Higher priority for well-connected nodes
      const priority = Math.min(30, 10 + connectionCount * 2);

      if (priority > 15) {
        recommendations.push({
          node,
          type: "exploration",
          reason: `Explore ${node.type} with ${connectionCount} connections`,
          priority,
          estimatedTime: node.estimatedStudyTime
        });
      }
    }

    return recommendations;
  }

  // Check if prerequisites are met
  private checkPrerequisites(
    node: KnowledgeNode,
    edges: KnowledgeEdge[],
    nodes: KnowledgeNode[]
  ): boolean {
    const prereqEdges = edges.filter(
      e => e.targetNodeId === node.id && e.type === "prerequisite"
    );

    if (prereqEdges.length === 0) return true;

    for (const edge of prereqEdges) {
      const prereq = nodes.find(n => n.id === edge.sourceNodeId);
      if (!prereq || prereq.masteryScore < 50) {
        return false;
      }
    }

    return true;
  }

  // Check if node has dependents in progress
  private hasDependentInProgress(
    node: KnowledgeNode,
    edges: KnowledgeEdge[],
    nodes: KnowledgeNode[]
  ): boolean {
    const dependentEdges = edges.filter(
      e => e.sourceNodeId === node.id && e.type === "prerequisite"
    );

    for (const edge of dependentEdges) {
      const dependent = nodes.find(n => n.id === edge.targetNodeId);
      if (dependent && dependent.status === "in_progress") {
        return true;
      }
    }

    return false;
  }

  // Get prerequisite recommendations
  public async getPrerequisites(
    nodeId: string,
    nodes: KnowledgeNode[],
    edges: KnowledgeEdge[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    const prereqEdges = edges.filter(
      e => e.targetNodeId === nodeId && e.type === "prerequisite"
    );

    for (const edge of prereqEdges) {
      const prereq = nodes.find(n => n.id === edge.sourceNodeId);
      if (prereq && prereq.masteryScore < 80) {
        recommendations.push({
          node: prereq,
          type: "prerequisite",
          reason: `Required for current topic`,
          priority: 50 - prereq.masteryScore / 2,
          estimatedTime: prereq.estimatedStudyTime
        });
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  // Mark recommendation as shown
  public markAsShown(nodeId: string): void {
    this.lastRecommendations.set(nodeId, new Date());
  }

  // Clear recommendation history
  public clearHistory(): void {
    this.lastRecommendations.clear();
  }
}

// Singleton export
export const recommendationService = RecommendationService.getInstance();
