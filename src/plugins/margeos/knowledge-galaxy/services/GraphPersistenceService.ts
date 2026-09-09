// @ts-nocheck
// Knowledge Galaxy — GraphPersistenceService
// Service for persisting and loading the knowledge graph

import type { KnowledgeNode, KnowledgeEdge, GalaxyCluster, LearningPath } from "../models";

export interface PersistedGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  clusters: GalaxyCluster[];
  paths: LearningPath[];
  metadata: {
    userId: string;
    version: string;
    lastSaved: string;
    nodeCount: number;
    edgeCount: number;
  };
}

export class GraphPersistenceService {
  private static instance: GraphPersistenceService;
  private userId: string | null = null;
  private storageKey: string = "margeos-knowledge-galaxy";
  private cache: PersistedGraph | null = null;

  private constructor() {}

  public static getInstance(): GraphPersistenceService {
    if (!GraphPersistenceService.instance) {
      GraphPersistenceService.instance = new GraphPersistenceService();
    }
    return GraphPersistenceService.instance;
  }

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
    this.storageKey = `margeos-knowledge-galaxy-${userId}`;
  }

  // Save graph to storage
  public async saveGraph(data: {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    clusters: GalaxyCluster[];
    paths: LearningPath[];
  }): Promise<void> {
    if (!this.userId) {
      throw new Error("Service not initialized");
    }

    const persisted: PersistedGraph = {
      nodes: data.nodes,
      edges: data.edges,
      clusters: data.clusters,
      paths: data.paths,
      metadata: {
        userId: this.userId,
        version: "1.0.0",
        lastSaved: new Date().toISOString(),
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length
      }
    };

    try {
      // Use localStorage for persistence
      localStorage.setItem(this.storageKey, JSON.stringify(persisted));
      this.cache = persisted;
    } catch (error) {
      console.error("Failed to save graph:", error);
      throw error;
    }
  }

  // Load graph from storage
  public async loadGraph(): Promise<PersistedGraph | null> {
    if (!this.userId) {
      throw new Error("Service not initialized");
    }

    // Check cache first
    if (this.cache) {
      return this.cache;
    }

    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return null;
      }

      const persisted: PersistedGraph = JSON.parse(data);

      // Convert date strings back to Date objects
      this.deserializeDates(persisted);

      this.cache = persisted;
      return persisted;
    } catch (error) {
      console.error("Failed to load graph:", error);
      return null;
    }
  }

  // Deserialize date strings to Date objects
  private deserializeDates(persisted: PersistedGraph): void {
    // Nodes
    for (const node of persisted.nodes) {
      node.createdAt = new Date(node.createdAt);
      node.updatedAt = new Date(node.updatedAt);
      if (node.lastStudiedAt) node.lastStudiedAt = new Date(node.lastStudiedAt);
      if (node.discoveredAt) node.discoveredAt = new Date(node.discoveredAt);
    }

    // Edges
    for (const edge of persisted.edges) {
      edge.discoveredAt = new Date(edge.discoveredAt);
      if (edge.lastUsedAt) edge.lastUsedAt = new Date(edge.lastUsedAt);
    }

    // Clusters
    for (const cluster of persisted.clusters) {
      cluster.createdAt = new Date(cluster.createdAt);
      cluster.updatedAt = new Date(cluster.updatedAt);
      if (cluster.lastExploredAt) cluster.lastExploredAt = new Date(cluster.lastExploredAt);
    }

    // Paths
    for (const path of persisted.paths) {
      path.createdAt = new Date(path.createdAt);
      path.updatedAt = new Date(path.updatedAt);
      if (path.startedAt) path.startedAt = new Date(path.startedAt);
      if (path.completedAt) path.completedAt = new Date(path.completedAt);
      if (path.lastAccessedAt) path.lastAccessedAt = new Date(path.lastAccessedAt);
    }

    // Metadata
    persisted.metadata.lastSaved = new Date(persisted.metadata.lastSaved).toISOString();
  }

  // Delete graph from storage
  public async deleteGraph(): Promise<void> {
    if (!this.userId) {
      throw new Error("Service not initialized");
    }

    try {
      localStorage.removeItem(this.storageKey);
      this.cache = null;
    } catch (error) {
      console.error("Failed to delete graph:", error);
      throw error;
    }
  }

  // Check if graph exists
  public async graphExists(): Promise<boolean> {
    if (!this.userId) {
      throw new Error("Service not initialized");
    }

    return localStorage.getItem(this.storageKey) !== null;
  }

  // Get storage size
  public async getStorageSize(): Promise<number> {
    if (!this.userId) {
      throw new Error("Service not initialized");
    }

    const data = localStorage.getItem(this.storageKey);
    return data ? new Blob([data]).size : 0;
  }

  // Export graph to JSON
  public async exportGraph(): Promise<string> {
    const data = await this.loadGraph();
    if (!data) {
      throw new Error("No graph data to export");
    }

    return JSON.stringify(data, null, 2);
  }

  // Import graph from JSON
  public async importGraph(json: string): Promise<void> {
    try {
      const data: PersistedGraph = JSON.parse(json);

      // Validate structure
      if (!data.nodes || !data.edges) {
        throw new Error("Invalid graph data structure");
      }

      this.deserializeDates(data);
      await this.saveGraph({
        nodes: data.nodes,
        edges: data.edges,
        clusters: data.clusters || [],
        paths: data.paths || []
      });
    } catch (error) {
      console.error("Failed to import graph:", error);
      throw error;
    }
  }

  // Clear cache
  public clearCache(): void {
    this.cache = null;
  }

  // Get last save timestamp
  public async getLastSaveTime(): Promise<Date | null> {
    const data = await this.loadGraph();
    if (!data || !data.metadata.lastSaved) {
      return null;
    }

    return new Date(data.metadata.lastSaved);
  }
}

// Singleton export
export const graphPersistenceService = GraphPersistenceService.getInstance();
