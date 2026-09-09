// @ts-nocheck
// Knowledge Galaxy — GalaxyEvolutionEngine
// Manages automatic evolution of the knowledge galaxy

import type { KnowledgeNode, KnowledgeEdge, GalaxyCluster } from "../models";
import { createGalaxyCluster } from "../models/GalaxyCluster";

export interface GalaxyEvolution {
  newNodes: KnowledgeNode[];
  newEdges: KnowledgeEdge[];
  updatedClusters: GalaxyCluster[];
  removedNodes: string[];
  removedEdges: string[];
  evolvedAt: Date;
}

export interface EvolutionTrigger {
  type: "learning" | "content_add" | "milestone" | "weakness_detected" | "recommendation";
  source: string;
  affectedNodes: string[];
}

export class GalaxyEvolutionEngine {
  private static instance: GalaxyEvolutionEngine;
  private lastEvolutionCheck: Date = new Date();
  private evolutionHistory: GalaxyEvolution[] = [];

  private constructor() {}

  public static getInstance(): GalaxyEvolutionEngine {
    if (!GalaxyEvolutionEngine.instance) {
      GalaxyEvolutionEngine.instance = new GalaxyEvolutionEngine();
    }
    return GalaxyEvolutionEngine.instance;
  }

  // Check if evolution is needed
  public async checkEvolution(
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>,
    clusters: Map<string, GalaxyCluster>
  ): Promise<boolean> {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.lastEvolutionCheck.getTime();
    const oneHourMs = 60 * 60 * 1000;

    // Check at least every hour or if enough changes happened
    if (timeSinceLastCheck < oneHourMs) {
      return false;
    }

    // Check for significant changes
    const recentChanges = this.evolutionHistory.filter(
      e => now.getTime() - e.evolvedAt.getTime() < 24 * 60 * 60 * 1000
    );

    // Trigger evolution if significant changes detected
    return recentChanges.length === 0;
  }

  // Evolve the galaxy
  public async evolve(
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>,
    clusters: Map<string, GalaxyCluster>
  ): Promise<GalaxyEvolution> {
    const evolution: GalaxyEvolution = {
      newNodes: [],
      newEdges: [],
      updatedClusters: [],
      removedNodes: [],
      removedEdges: [],
      evolvedAt: new Date()
    };

    // 1. Update cluster assignments
    const clusterUpdates = await this.rebalanceClusters(nodes, edges, clusters);
    evolution.updatedClusters = clusterUpdates;

    // 2. Discover hidden nodes
    const hiddenUpdates = await this.discoverHiddenNodes(nodes);
    evolution.newNodes.push(...hiddenUpdates);

    // 3. Update node connections
    const connectionUpdates = await this.updateConnections(nodes, edges);
    evolution.newEdges.push(...connectionUpdates.newEdges);
    evolution.removedEdges.push(...connectionUpdates.removedEdges);

    // 4. Unlock nodes based on progress
    const unlocks = await this.processUnlocks(nodes, edges);
    evolution.newNodes.push(...unlocks);

    // 5. Detect and mark knowledge gaps
    await this.detectKnowledgeGaps(nodes, edges);

    // 6. Update cluster statistics
    for (const cluster of clusters.values()) {
      const clusterNodes = Array.from(nodes.values()).filter(
        n => cluster.nodeIds.includes(n.id)
      );
      const updated = this.updateClusterStats(cluster, clusterNodes);
      if (updated) {
        evolution.updatedClusters.push(updated);
      }
    }

    // Record evolution
    this.evolutionHistory.push(evolution);
    this.lastEvolutionCheck = new Date();

    // Keep only last 100 evolutions
    if (this.evolutionHistory.length > 100) {
      this.evolutionHistory = this.evolutionHistory.slice(-100);
    }

    return evolution;
  }

  // Rebalance cluster assignments
  private async rebalanceClusters(
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>,
    clusters: Map<string, GalaxyCluster>
  ): Promise<GalaxyCluster[]> {
    const updated: GalaxyCluster[] = [];

    // Group nodes by subject
    const subjectGroups = new Map<string, KnowledgeNode[]>();
    for (const node of nodes.values()) {
      const existing = subjectGroups.get(node.subject) || [];
      existing.push(node);
      subjectGroups.set(node.subject, existing);
    }

    // Update or create clusters
    for (const [subject, subjectNodes] of subjectGroups) {
      let cluster = Array.from(clusters.values()).find(
        c => c.name === subject && c.type === "subject"
      );

      if (!cluster) {
        cluster = createGalaxyCluster(subject, "subject", {
          description: `Knowledge cluster for ${subject}`,
          sourceEngine: "evolution"
        });
        clusters.set(cluster.id, cluster);
      }

      // Update node IDs
      cluster.nodeIds = subjectNodes.map(n => n.id);
      cluster.totalNodes = subjectNodes.length;
      cluster.updatedAt = new Date();

      updated.push(cluster);
    }

    return updated;
  }

  // Discover hidden nodes
  private async discoverHiddenNodes(
    nodes: Map<string, KnowledgeNode>
  ): Promise<KnowledgeNode[]> {
    const discovered: KnowledgeNode[] = [];

    for (const node of nodes.values()) {
      if (node.status === "hidden") {
        // Check if prerequisites are met
        const allPrereqsMet = node.prerequisiteIds.every(prereqId =>
          nodes.has(prereqId) && (nodes.get(prereqId)?.masteryScore || 0) >= 50
        );

        if (allPrereqsMet || node.prerequisiteIds.length === 0) {
          node.status = "discovered";
          node.discoveredAt = new Date();
          discovered.push(node);
        }
      }
    }

    return discovered;
  }

  // Update node connections
  private async updateConnections(
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>
  ): Promise<{ newEdges: KnowledgeEdge[]; removedEdges: string[] }> {
    const newEdges: KnowledgeEdge[] = [];
    const removedEdges: string[] = [];

    // Build edge lookup
    const existingConnections = new Map<string, Set<string>>();
    for (const edge of edges.values()) {
      const key = `${edge.sourceNodeId}-${edge.targetNodeId}`;
      const existing = existingConnections.get(edge.sourceNodeId) || new Set();
      existing.add(edge.targetNodeId);
      existingConnections.set(edge.sourceNodeId, existing);
    }

    // Find new potential connections
    for (const node of nodes.values()) {
      if (node.status === "hidden") continue;

      // Find related nodes by keywords
      const relatedNodes = this.findRelatedNodes(node, nodes, existingConnections);
      for (const related of relatedNodes) {
        const edge = this.createEdge(node, related);
        edges.set(edge.id, edge);
        newEdges.push(edge);
      }
    }

    // Remove weak edges (low weight, not used)
    for (const edge of edges.values()) {
      if (edge.weight < 0.2 && edge.useCount < 3) {
        edges.delete(edge.id);
        removedEdges.push(edge.id);
      }
    }

    return { newEdges, removedEdges };
  }

  // Find related nodes
  private findRelatedNodes(
    node: KnowledgeNode,
    nodes: Map<string, KnowledgeNode>,
    existingConnections: Map<string, Set<string>>
  ): KnowledgeNode[] {
    const related: KnowledgeNode[] = [];

    for (const other of nodes.values()) {
      if (other.id === node.id) continue;
      if (other.status === "hidden") continue;

      // Check if already connected
      const connected = existingConnections.get(node.id);
      if (connected?.has(other.id)) continue;

      // Calculate relevance
      const relevance = this.calculateRelevance(node, other);
      if (relevance > 0.5) {
        related.push(other);
      }
    }

    // Sort by relevance and limit
    return related
      .sort((a, b) => this.calculateRelevance(node, a) - this.calculateRelevance(node, b))
      .reverse()
      .slice(0, 5);
  }

  // Calculate relevance between nodes
  private calculateRelevance(a: KnowledgeNode, b: KnowledgeNode): number {
    let score = 0;

    // Same subject
    if (a.subject === b.subject) score += 0.3;

    // Same chapter
    if (a.chapter && a.chapter === b.chapter) score += 0.2;

    // Shared keywords
    const keywordsA = new Set([...a.keywords, ...a.tags].map(k => k.toLowerCase()));
    const keywordsB = new Set([...b.keywords, ...b.tags].map(k => k.toLowerCase()));
    const sharedKeywords = [...keywordsA].filter(k => keywordsB.has(k)).length;
    score += Math.min(0.3, sharedKeywords * 0.1);

    // Similar importance
    if (Math.abs(a.importance - b.importance) <= 1) score += 0.1;

    return score;
  }

  // Create edge between nodes
  private createEdge(source: KnowledgeNode, target: KnowledgeNode): KnowledgeEdge {
    const edge: KnowledgeEdge = {
      id: `edge-evolved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "related_to",
      sourceNodeId: source.id,
      targetNodeId: target.id,
      strength: "medium",
      weight: 0.5,
      bidirectional: true,
      discoveredAt: new Date(),
      useCount: 0,
      sourceEngine: "evolution",
      tags: ["auto-generated"]
    };

    return edge;
  }

  // Process unlocks
  private async processUnlocks(
    nodes: Map<string, KnowledgeNode>
  ): Promise<KnowledgeNode[]> {
    const unlocked: KnowledgeNode[] = [];

    for (const node of nodes.values()) {
      if (node.status === "locked") {
        const allPrereqsMet = node.prerequisiteIds.every(prereqId => {
          const prereq = nodes.get(prereqId);
          return prereq && prereq.masteryScore >= 50;
        });

        if (allPrereqsMet && node.prerequisiteIds.length > 0) {
          node.status = "discovered";
          node.discoveredAt = new Date();
          unlocked.push(node);
        }
      }
    }

    return unlocked;
  }

  // Detect knowledge gaps
  private async detectKnowledgeGaps(
    nodes: Map<string, KnowledgeNode>,
    edges: Map<string, KnowledgeEdge>
  ): Promise<void> {
    // Find weak nodes (low mastery but high importance)
    for (const node of nodes.values()) {
      if (node.importance >= 4 && node.masteryScore < 50) {
        node.customData = {
          ...node.customData,
          isWeakPoint: true,
          gapDetected: new Date()
        };
      }
    }

    // Find broken prerequisite chains
    for (const edge of edges.values()) {
      if (edge.type === "prerequisite") {
        const prereq = nodes.get(edge.sourceNodeId);
        const dependent = nodes.get(edge.targetNodeId);

        if (prereq && dependent) {
          // Check if there's a mastery gap
          if (prereq.masteryScore > dependent.masteryScore + 30) {
            // Gap is fine
          } else if (prereq.masteryScore < 30 && dependent.masteryScore > 50) {
            // Broken chain
            edge.customData = {
              ...edge.customData,
              hasGap: true,
              gapSeverity: "high"
            };
          }
        }
      }
    }
  }

  // Update cluster statistics
  private updateClusterStats(
    cluster: GalaxyCluster,
    nodes: KnowledgeNode[]
  ): GalaxyCluster | null {
    const mastered = nodes.filter(n => n.masteryScore >= 80).length;
    const inProgress = nodes.filter(n => n.status === "in_progress").length;
    const avgMastery = nodes.length > 0
      ? Math.round(nodes.reduce((sum, n) => sum + n.masteryScore, 0) / nodes.length)
      : 0;

    if (cluster.totalNodes !== nodes.length ||
        cluster.masteredNodes !== mastered ||
        cluster.averageMastery !== avgMastery) {
      return {
        ...cluster,
        totalNodes: nodes.length,
        masteredNodes: mastered,
        inProgressNodes: inProgress,
        averageMastery: avgMastery,
        updatedAt: new Date()
      };
    }

    return null;
  }

  // Get evolution history
  public getEvolutionHistory(): GalaxyEvolution[] {
    return [...this.evolutionHistory];
  }

  // Get evolution statistics
  public getEvolutionStats(): {
    totalEvolutions: number;
    recentEvolutions: number;
    averageChanges: number;
    lastEvolution: Date | null;
  } {
    const recent = this.evolutionHistory.filter(
      e => new Date().getTime() - e.evolvedAt.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    const avgChanges = this.evolutionHistory.length > 0
      ? this.evolutionHistory.reduce((sum, e) =>
          sum + e.newNodes.length + e.newEdges.length, 0
        ) / this.evolutionHistory.length
      : 0;

    return {
      totalEvolutions: this.evolutionHistory.length,
      recentEvolutions: recent.length,
      averageChanges: Math.round(avgChanges),
      lastEvolution: this.evolutionHistory.length > 0
        ? this.evolutionHistory[this.evolutionHistory.length - 1].evolvedAt
        : null
    };
  }
}

// Singleton export
export const galaxyEvolutionEngine = GalaxyEvolutionEngine.getInstance();
