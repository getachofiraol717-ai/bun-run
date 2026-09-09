// @ts-nocheck
// Knowledge Galaxy — GalaxyController
// Main controller that coordinates all galaxy sub-systems

import { knowledgeGalaxyEngine } from "./KnowledgeGalaxyEngine";
import { knowledgeGraphBuilder } from "./KnowledgeGraphBuilder";
import { nodeGenerator } from "./NodeGenerator";
import { relationshipEngine } from "./RelationshipEngine";
import { skillGraphEngine } from "./SkillGraphEngine";
import { learningPathGraph } from "./LearningPathGraph";
import { galaxyEvolutionEngine } from "./GalaxyEvolutionEngine";
import { galaxyNavigationEngine } from "./GalaxyNavigationEngine";
import { knowledgeRecommendationEngine } from "./KnowledgeRecommendationEngine";

import type { KnowledgeNode, KnowledgeEdge, GalaxyCluster, LearningPath } from "../models";

export interface GalaxyControllerState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export class GalaxyController {
  private static instance: GalaxyController;
  private state: GalaxyControllerState = {
    isInitialized: false,
    isLoading: false,
    error: null,
    lastUpdated: null
  };

  private constructor() {}

  public static getInstance(): GalaxyController {
    if (!GalaxyController.instance) {
      GalaxyController.instance = new GalaxyController();
    }
    return GalaxyController.instance;
  }

  // Initialize the galaxy
  public async initialize(userId: string): Promise<void> {
    if (this.state.isInitialized) return;

    this.state.isLoading = true;
    this.state.error = null;

    try {
      // Initialize main engine
      await knowledgeGalaxyEngine.initialize(userId);

      this.state.isInitialized = true;
      this.state.lastUpdated = new Date();
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : "Initialization failed";
      throw error;
    } finally {
      this.state.isLoading = false;
    }
  }

  // Get current state
  public getState(): GalaxyControllerState {
    return { ...this.state };
  }

  // Add content from various sources
  public async addContent(content: {
    type: "pdf" | "tutor" | "formula" | "reference";
    data: any;
  }): Promise<KnowledgeNode[]> {
    this.ensureInitialized();

    switch (content.type) {
      case "pdf":
        return await knowledgeGalaxyEngine.generateFromPDF(content.data);
      case "tutor":
        return await knowledgeGalaxyEngine.generateFromTutor(content.data.topic, content.data.explanation);
      case "formula":
        return await knowledgeGalaxyEngine.generateFromFormulas(content.data);
      default:
        return [];
    }
  }

  // Get all nodes
  public getNodes(): KnowledgeNode[] {
    this.ensureInitialized();
    return knowledgeGalaxyEngine.getAllNodes();
  }

  // Get node by ID
  public getNode(nodeId: string): KnowledgeNode | undefined {
    this.ensureInitialized();
    return knowledgeGalaxyEngine.getNode(nodeId);
  }

  // Get all edges
  public getEdges(): KnowledgeEdge[] {
    this.ensureInitialized();
    return knowledgeGalaxyEngine.getAllEdges();
  }

  // Get all clusters
  public getClusters(): GalaxyCluster[] {
    this.ensureInitialized();
    return knowledgeGalaxyEngine.getAllClusters();
  }

  // Get all learning paths
  public getPaths(): LearningPath[] {
    this.ensureInitialized();
    return knowledgeGalaxyEngine.getAllPaths();
  }

  // Update node mastery
  public async updateNodeMastery(nodeId: string, masteryScore: number): Promise<void> {
    this.ensureInitialized();
    await knowledgeGalaxyEngine.updateNode(nodeId, {
      masteryScore,
      status: masteryScore >= 80 ? "mastered" : masteryScore > 0 ? "in_progress" : "discovered",
      timesStudied: (knowledgeGalaxyEngine.getNode(nodeId)?.timesStudied || 0) + 1,
      lastStudiedAt: new Date()
    });
  }

  // Find path between nodes
  public async findPath(startId: string, endId: string): Promise<string[]> {
    this.ensureInitialized();
    return await knowledgeGalaxyEngine.findPath(startId, endId);
  }

  // Get connected nodes
  public async getConnectedNodes(nodeId: string, depth: number = 1): Promise<KnowledgeNode[]> {
    this.ensureInitialized();
    return await knowledgeGalaxyEngine.getConnectedNodes(nodeId, depth);
  }

  // Get subgraph
  public async getSubgraph(centerId: string, radius: number): Promise<{
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
  }> {
    this.ensureInitialized();
    return await knowledgeGalaxyEngine.getSubgraph(centerId, radius);
  }

  // Get recommendations
  public async getRecommendations(options?: {
    limit?: number;
    type?: string;
    subject?: string;
  }): Promise<KnowledgeNode[]> {
    this.ensureInitialized();
    return await knowledgeGalaxyEngine.getRecommendations(options);
  }

  // Get learning suggestions for a node
  public async getLearningSuggestions(nodeId: string): Promise<KnowledgeNode[]> {
    this.ensureInitialized();
    return await knowledgeGalaxyEngine.getLearningSuggestions(nodeId);
  }

  // Get skill graph
  public async getSkillGraph(skillId?: string): Promise<any> {
    this.ensureInitialized();
    return await knowledgeGalaxyEngine.getSkillGraph(skillId);
  }

  // Update skill progress
  public async updateSkillProgress(skillId: string, progress: number): Promise<void> {
    this.ensureInitialized();
    await knowledgeGalaxyEngine.updateSkillProgress(skillId, progress);
  }

  // Get learning paths
  public async getLearningPaths(options?: {
    startId?: string;
    endId?: string;
    maxNodes?: number;
  }): Promise<LearningPath[]> {
    this.ensureInitialized();
    const allPaths = knowledgeGalaxyEngine.getAllPaths();

    if (options?.startId && options?.endId) {
      return allPaths.filter(p =>
        p.nodes.some(n => n.nodeId === options.startId) &&
        p.nodes.some(n => n.nodeId === options.endId)
      );
    }

    return allPaths;
  }

  // Create learning path
  public async createLearningPath(
    title: string,
    subject: string,
    targetNodeId: string
  ): Promise<LearningPath> {
    this.ensureInitialized();

    const nodes = knowledgeGalaxyEngine.getAllNodes();
    const edges = knowledgeGalaxyEngine.getAllEdges();

    const path = learningPathGraph.generatePath(title, subject, nodes, edges, {
      endNodeId: targetNodeId
    });

    await knowledgeGalaxyEngine.createPath(path);
    return path;
  }

  // Update path progress
  public async updatePathProgress(pathId: string, nodeId: string, progress: number): Promise<void> {
    this.ensureInitialized();
    await learningPathGraph.updateNodeProgress(pathId, nodeId, progress);
  }

  // Get statistics
  public getStatistics(): {
    nodes: number;
    edges: number;
    clusters: number;
    paths: number;
    averageConnections: number;
  } {
    this.ensureInitialized();
    return knowledgeGalaxyEngine.getStatistics();
  }

  // Evolve galaxy
  public async evolveGalaxy(): Promise<void> {
    this.ensureInitialized();
    await knowledgeGalaxyEngine.evolveGalaxy();
    this.state.lastUpdated = new Date();
  }

  // Search nodes
  public searchNodes(query: string, filters?: {
    types?: string[];
    subjects?: string[];
    masteryLevels?: string[];
  }): KnowledgeNode[] {
    this.ensureInitialized();

    const nodes = knowledgeGalaxyEngine.getAllNodes();
    const lowerQuery = query.toLowerCase();

    return nodes.filter(node => {
      // Search query
      const matchesQuery =
        node.title.toLowerCase().includes(lowerQuery) ||
        node.description.toLowerCase().includes(lowerQuery) ||
        node.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
        node.keywords.some(k => k.toLowerCase().includes(lowerQuery));

      if (!matchesQuery) return false;

      // Type filter
      if (filters?.types?.length && !filters.types.includes(node.type)) {
        return false;
      }

      // Subject filter
      if (filters?.subjects?.length && !filters.subjects.includes(node.subject)) {
        return false;
      }

      // Mastery filter
      if (filters?.masteryLevels?.length) {
        const level = this.getMasteryLevel(node.masteryScore);
        if (!filters.masteryLevels.includes(level)) {
          return false;
        }
      }

      return true;
    });
  }

  // Get mastery level from score
  private getMasteryLevel(score: number): string {
    if (score >= 80) return "expert";
    if (score >= 60) return "advanced";
    if (score >= 40) return "intermediate";
    if (score >= 20) return "beginner";
    return "none";
  }

  // Get knowledge gaps
  public async getKnowledgeGaps(): Promise<KnowledgeNode[]> {
    this.ensureInitialized();

    const nodes = knowledgeGalaxyEngine.getAllNodes();

    return nodes.filter(node => {
      // High importance but low mastery
      if (node.importance >= 4 && node.masteryScore < 50) {
        return true;
      }

      // Broken prerequisite chains
      const edges = knowledgeGalaxyEngine.getEdges();
      const prereqEdges = edges.filter(
        e => e.targetNodeId === node.id && e.type === "prerequisite"
      );

      for (const edge of prereqEdges) {
        const prereq = knowledgeGalaxyEngine.getNode(edge.sourceNodeId);
        if (prereq && prereq.masteryScore < node.masteryScore - 30) {
          return true;
        }
      }

      return false;
    });
  }

  // Save state
  public async save(): Promise<void> {
    this.ensureInitialized();
    await knowledgeGalaxyEngine.saveGraph();
  }

  // Reset
  public async reset(): Promise<void> {
    await knowledgeGalaxyEngine.destroy();
    this.state = {
      isInitialized: false,
      isLoading: false,
      error: null,
      lastUpdated: null
    };
  }

  // Ensure initialized
  private ensureInitialized(): void {
    if (!this.state.isInitialized) {
      throw new Error("Galaxy not initialized. Call initialize() first.");
    }
  }
}

// Singleton export
export const galaxyController = GalaxyController.getInstance();
