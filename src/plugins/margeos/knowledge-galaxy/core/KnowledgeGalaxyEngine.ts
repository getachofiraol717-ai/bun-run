// @ts-nocheck
// Knowledge Galaxy — KnowledgeGalaxyEngine
// Main orchestrator for the Knowledge Galaxy system

import type { KnowledgeNode, KnowledgeEdge, GalaxyCluster, LearningPath } from "../models";
import { knowledgeGraphBuilder } from "./KnowledgeGraphBuilder";
import { nodeGenerator } from "./NodeGenerator";
import { relationshipEngine } from "./RelationshipEngine";
import { skillGraphEngine } from "./SkillGraphEngine";
import { learningPathGraph } from "./LearningPathGraph";
import { galaxyEvolutionEngine } from "./GalaxyEvolutionEngine";
import { galaxyNavigationEngine } from "./GalaxyNavigationEngine";
import { knowledgeRecommendationEngine } from "./KnowledgeRecommendationEngine";
import { graphPersistenceService } from "../services/GraphPersistenceService";

export type GalaxyEventType =
  | "INITIALIZED"
  | "NODES_ADDED"
  | "EDGES_ADDED"
  | "CLUSTERS_UPDATED"
  | "GALAXY_EVOLVED"
  | "PATH_UPDATED"
  | "ERROR";

export interface GalaxyEvent {
  type: GalaxyEventType;
  payload: any;
  timestamp: Date;
}

export type GalaxyEventHandler = (event: GalaxyEvent) => void;

export class KnowledgeGalaxyEngine {
  private static instance: KnowledgeGalaxyEngine;
  private initialized: boolean = false;
  private userId: string | null = null;
  private eventHandlers: Map<GalaxyEventType, GalaxyEventHandler[]> = new Map();
  private autoSaveInterval: NodeJS.Timeout | null = null;

  // Sub-engines
  private graphBuilder = knowledgeGraphBuilder;
  private nodeGen = nodeGenerator;
  private relEngine = relationshipEngine;
  private skillEngine = skillGraphEngine;
  private pathGraph = learningPathGraph;
  private evolutionEngine = galaxyEvolutionEngine;
  private navigationEngine = galaxyNavigationEngine;
  private recommendationEngine = knowledgeRecommendationEngine;

  // Cached data
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: Map<string, KnowledgeEdge> = new Map();
  private clusters: Map<string, GalaxyCluster> = new Map();
  private paths: Map<string, LearningPath> = new Map();

  private constructor() {}

  public static getInstance(): KnowledgeGalaxyEngine {
    if (!KnowledgeGalaxyEngine.instance) {
      KnowledgeGalaxyEngine.instance = new KnowledgeGalaxyEngine();
    }
    return KnowledgeGalaxyEngine.instance;
  }

  // Event handling
  public on(event: GalaxyEventType, handler: GalaxyEventHandler): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  public off(event: GalaxyEventType, handler: GalaxyEventHandler): void {
    const handlers = this.eventHandlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.eventHandlers.set(event, handlers);
    }
  }

  private emit(event: GalaxyEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }

  // Initialization
  public async initialize(userId: string): Promise<void> {
    if (this.initialized && this.userId === userId) {
      return;
    }

    this.userId = userId;

    try {
      // Initialize persistence service
      await graphPersistenceService.initialize(userId);

      // Load existing data
      const existingData = await graphPersistenceService.loadGraph();

      if (existingData) {
        this.nodes = new Map(existingData.nodes.map(n => [n.id, n]));
        this.edges = new Map(existingData.edges.map(e => [e.id, e]));
        this.clusters = new Map(existingData.clusters.map(c => [c.id, c]));
        this.paths = new Map(existingData.paths.map(p => [p.id, p]));
      }

      // Initialize sub-engines
      await this.graphBuilder.initialize(this.nodes, this.edges);
      await this.skillEngine.initialize(userId);
      await this.pathGraph.initialize(userId);
      await this.navigationEngine.initialize();
      await this.recommendationEngine.initialize(userId);

      this.initialized = true;

      // Setup auto-save
      this.setupAutoSave();

      this.emit({
        type: "INITIALIZED",
        payload: { nodeCount: this.nodes.size, edgeCount: this.edges.size },
        timestamp: new Date()
      });
    } catch (error) {
      this.emit({
        type: "ERROR",
        payload: { message: `Initialization failed: ${error}` },
        timestamp: new Date()
      });
      throw error;
    }
  }

  private setupAutoSave(): void {
    this.autoSaveInterval = setInterval(async () => {
      if (this.userId) {
        await this.saveGraph();
      }
    }, 60000); // Auto-save every minute
  }

  public async destroy(): Promise<void> {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    await this.saveGraph();
    this.initialized = false;
    this.userId = null;
    this.nodes.clear();
    this.edges.clear();
    this.clusters.clear();
    this.paths.clear();
  }

  // Persistence
  public async saveGraph(): Promise<void> {
    if (!this.userId) return;

    await graphPersistenceService.saveGraph({
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      clusters: Array.from(this.clusters.values()),
      paths: Array.from(this.paths.values())
    });
  }

  // Node operations
  public async addNode(node: KnowledgeNode): Promise<void> {
    this.nodes.set(node.id, node);

    // Generate relationships for new node
    const newEdges = await this.relEngine.findRelationships(node, Array.from(this.nodes.values()));
    newEdges.forEach(edge => {
      this.edges.set(edge.id, edge);
    });

    // Update clusters
    await this.updateClusters();

    this.emit({
      type: "NODES_ADDED",
      payload: { nodes: [node], edges: newEdges },
      timestamp: new Date()
    });
  }

  public async addNodes(newNodes: KnowledgeNode[]): Promise<void> {
    const addedEdges: KnowledgeEdge[] = [];

    for (const node of newNodes) {
      this.nodes.set(node.id, node);

      const edges = await this.relEngine.findRelationships(
        node,
        Array.from(this.nodes.values())
      );
      edges.forEach(edge => {
        this.edges.set(edge.id, edge);
        addedEdges.push(edge);
      });
    }

    await this.updateClusters();

    this.emit({
      type: "NODES_ADDED",
      payload: { nodes: newNodes, edges: addedEdges },
      timestamp: new Date()
    });
  }

  public getNode(nodeId: string): KnowledgeNode | undefined {
    return this.nodes.get(nodeId);
  }

  public getAllNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  public async updateNode(nodeId: string, updates: Partial<KnowledgeNode>): Promise<void> {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const updatedNode = { ...node, ...updates, updatedAt: new Date() };
    this.nodes.set(nodeId, updatedNode);

    // Trigger evolution check
    await this.evolutionEngine.checkEvolution(this.nodes, this.edges, this.clusters);
  }

  public async deleteNode(nodeId: string): Promise<void> {
    this.nodes.delete(nodeId);

    // Remove related edges
    const edgesToRemove = Array.from(this.edges.values()).filter(
      e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
    );
    edgesToRemove.forEach(e => this.edges.delete(e.id));

    await this.updateClusters();
  }

  // Edge operations
  public getEdge(edgeId: string): KnowledgeEdge | undefined {
    return this.edges.get(edgeId);
  }

  public getAllEdges(): KnowledgeEdge[] {
    return Array.from(this.edges.values());
  }

  public getNodeEdges(nodeId: string): KnowledgeEdge[] {
    return Array.from(this.edges.values()).filter(
      e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId
    );
  }

  public async addEdge(edge: KnowledgeEdge): Promise<void> {
    this.edges.set(edge.id, edge);

    this.emit({
      type: "EDGES_ADDED",
      payload: { edges: [edge] },
      timestamp: new Date()
    });
  }

  // Cluster operations
  public getCluster(clusterId: string): GalaxyCluster | undefined {
    return this.clusters.get(clusterId);
  }

  public getAllClusters(): GalaxyCluster[] {
    return Array.from(this.clusters.values());
  }

  private async updateClusters(): Promise<void> {
    const subjects = new Set(Array.from(this.nodes.values()).map(n => n.subject));

    for (const subject of subjects) {
      const subjectNodes = Array.from(this.nodes.values()).filter(n => n.subject === subject);

      if (subjectNodes.length > 0) {
        const cluster = this.graphBuilder.buildSubjectCluster(subject, subjectNodes);
        this.clusters.set(cluster.id, cluster);
      }
    }

    this.emit({
      type: "CLUSTERS_UPDATED",
      payload: { clusters: Array.from(this.clusters.values()) },
      timestamp: new Date()
    });
  }

  // Learning path operations
  public getPath(pathId: string): LearningPath | undefined {
    return this.paths.get(pathId);
  }

  public getAllPaths(): LearningPath[] {
    return Array.from(this.paths.values());
  }

  public async createPath(path: LearningPath): Promise<void> {
    this.paths.set(path.id, path);
  }

  public async updatePath(pathId: string, updates: Partial<LearningPath>): Promise<void> {
    const path = this.paths.get(pathId);
    if (!path) return;

    const updatedPath = { ...path, ...updates, updatedAt: new Date() };
    this.paths.set(pathId, updatedPath);

    this.emit({
      type: "PATH_UPDATED",
      payload: { path: updatedPath },
      timestamp: new Date()
    });
  }

  // Galaxy evolution
  public async evolveGalaxy(): Promise<void> {
    const evolution = await this.evolutionEngine.evolve(
      this.nodes,
      this.edges,
      this.clusters
    );

    // Apply evolution changes
    evolution.newNodes.forEach(node => this.nodes.set(node.id, node));
    evolution.newEdges.forEach(edge => this.edges.set(edge.id, edge));

    if (evolution.updatedClusters.length > 0) {
      evolution.updatedClusters.forEach(cluster => {
        this.clusters.set(cluster.id, cluster);
      });
    }

    if (evolution.removedNodes.length > 0) {
      evolution.removedNodes.forEach(id => this.nodes.delete(id));
    }

    this.emit({
      type: "GALAXY_EVOLVED",
      payload: evolution,
      timestamp: new Date()
    });
  }

  // Navigation
  public async findPath(
    startNodeId: string,
    endNodeId: string,
    options?: { maxDepth?: number; includeTypes?: string[] }
  ): Promise<string[]> {
    return await this.navigationEngine.findPath(
      startNodeId,
      endNodeId,
      Array.from(this.edges.values()),
      options
    );
  }

  public async getConnectedNodes(
    nodeId: string,
    depth: number = 1
  ): Promise<KnowledgeNode[]> {
    return await this.navigationEngine.getConnectedNodes(
      nodeId,
      Array.from(this.nodes.values()),
      Array.from(this.edges.values()),
      depth
    );
  }

  public async getSubgraph(
    centerNodeId: string,
    radius: number
  ): Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }> {
    return await this.navigationEngine.getSubgraph(
      centerNodeId,
      radius,
      Array.from(this.nodes.values()),
      Array.from(this.edges.values())
    );
  }

  // Recommendations
  public async getRecommendations(options?: {
    limit?: number;
    type?: string;
    subject?: string;
  }): Promise<KnowledgeNode[]> {
    return await this.recommendationEngine.getRecommendations(
      Array.from(this.nodes.values()),
      Array.from(this.edges.values()),
      options
    );
  }

  public async getLearningSuggestions(
    currentNodeId: string
  ): Promise<KnowledgeNode[]> {
    return await this.recommendationEngine.getNextSteps(
      currentNodeId,
      Array.from(this.nodes.values()),
      Array.from(this.edges.values())
    );
  }

  // Skill graph
  public async getSkillGraph(skillId?: string): Promise<any> {
    return await this.skillEngine.getSkillGraph(skillId);
  }

  public async updateSkillProgress(
    skillId: string,
    progress: number
  ): Promise<void> {
    await this.skillEngine.updateSkillProgress(skillId, progress);
  }

  // Graph generation from various sources
  public async generateFromPDF(pdfContent: any): Promise<void> {
    const nodes = await this.graphBuilder.generateFromPDF(pdfContent);
    await this.addNodes(nodes);
  }

  public async generateFromTutor(topic: string, explanation: string): Promise<void> {
    const nodes = await this.graphBuilder.generateFromTutor(topic, explanation);
    await this.addNodes(nodes);
  }

  public async generateFromFormulas(formulas: any[]): Promise<void> {
    const nodes = await this.graphBuilder.generateFromFormulas(formulas);
    await this.addNodes(nodes);
  }

  // Statistics
  public getStatistics(): {
    nodeCount: number;
    edgeCount: number;
    clusterCount: number;
    pathCount: number;
    averageConnections: number;
    mostConnectedNode: string | null;
  } {
    const nodeCount = this.nodes.size;
    const edgeCount = this.edges.size;

    let mostConnected: { id: string; count: number } | null = null;
    let totalConnections = 0;

    this.nodes.forEach(node => {
      const connections = Array.from(this.edges.values()).filter(
        e => e.sourceNodeId === node.id || e.targetNodeId === node.id
      ).length;
      totalConnections += connections;

      if (!mostConnected || connections > mostConnected.count) {
        mostConnected = { id: node.id, count: connections };
      }
    });

    return {
      nodeCount,
      edgeCount,
      clusterCount: this.clusters.size,
      pathCount: this.paths.size,
      averageConnections: nodeCount > 0 ? Math.round(totalConnections / nodeCount) : 0,
      mostConnectedNode: mostConnected?.id || null
    };
  }
}

// Singleton export
export const knowledgeGalaxyEngine = KnowledgeGalaxyEngine.getInstance();
