// @ts-nocheck
// Knowledge Galaxy — useKnowledgeGalaxy Hook
// React hook for accessing Knowledge Galaxy functionality

import { useState, useEffect, useCallback } from "react";
import { galaxyController } from "../core/GalaxyController";
import type { KnowledgeNode, KnowledgeEdge, GalaxyCluster, LearningPath } from "../models";

export interface UseKnowledgeGalaxyOptions {
  userId: string;
  autoInitialize?: boolean;
}

export interface UseKnowledgeGalaxyReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Data
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  clusters: GalaxyCluster[];
  paths: LearningPath[];

  // Actions
  addContent: (type: "pdf" | "tutor" | "formula" | "reference", data: any) => Promise<KnowledgeNode[]>;
  updateNodeMastery: (nodeId: string, masteryScore: number) => Promise<void>;
  searchNodes: (query: string, filters?: any) => KnowledgeNode[];

  // Navigation
  findPath: (startId: string, endId: string) => Promise<string[]>;
  getConnectedNodes: (nodeId: string, depth?: number) => Promise<KnowledgeNode[]>;
  getSubgraph: (centerId: string, radius: number) => Promise<{ nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }>;

  // Recommendations
  getRecommendations: (options?: any) => Promise<KnowledgeNode[]>;
  getLearningSuggestions: (nodeId: string) => Promise<KnowledgeNode[]>;

  // Utility
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
}

export function useKnowledgeGalaxy(options: UseKnowledgeGalaxyOptions): UseKnowledgeGalaxyReturn {
  const { userId, autoInitialize = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [clusters, setClusters] = useState<GalaxyCluster[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);

  // Initialize
  useEffect(() => {
    if (!userId || !autoInitialize) return;

    const init = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await galaxyController.initialize(userId);
        setIsInitialized(true);
        refreshData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [userId, autoInitialize]);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!isInitialized) return;

    setNodes(galaxyController.getNodes());
    setEdges(galaxyController.getEdges());
    setClusters(galaxyController.getClusters());
    setPaths(galaxyController.getPaths());
  }, [isInitialized]);

  // Add content
  const addContent = useCallback(async (type: any, data: any) => {
    if (!isInitialized) throw new Error("Galaxy not initialized");
    const result = await galaxyController.addContent({ type, data });
    await refreshData();
    return result;
  }, [isInitialized, refreshData]);

  // Update node mastery
  const updateNodeMastery = useCallback(async (nodeId: string, masteryScore: number) => {
    if (!isInitialized) throw new Error("Galaxy not initialized");
    await galaxyController.updateNodeMastery(nodeId, masteryScore);
    await refreshData();
  }, [isInitialized, refreshData]);

  // Search nodes
  const searchNodes = useCallback((query: string, filters?: any) => {
    if (!isInitialized) return [];
    return galaxyController.searchNodes(query, filters);
  }, [isInitialized]);

  // Find path
  const findPath = useCallback(async (startId: string, endId: string) => {
    if (!isInitialized) throw new Error("Galaxy not initialized");
    return await galaxyController.findPath(startId, endId);
  }, [isInitialized]);

  // Get connected nodes
  const getConnectedNodes = useCallback(async (nodeId: string, depth: number = 1) => {
    if (!isInitialized) throw new Error("Galaxy not initialized");
    return await galaxyController.getConnectedNodes(nodeId, depth);
  }, [isInitialized]);

  // Get subgraph
  const getSubgraph = useCallback(async (centerId: string, radius: number) => {
    if (!isInitialized) throw new Error("Galaxy not initialized");
    return await galaxyController.getSubgraph(centerId, radius);
  }, [isInitialized]);

  // Get recommendations
  const getRecommendations = useCallback(async (options?: any) => {
    if (!isInitialized) throw new Error("Galaxy not initialized");
    return await galaxyController.getRecommendations(options);
  }, [isInitialized]);

  // Get learning suggestions
  const getLearningSuggestions = useCallback(async (nodeId: string) => {
    if (!isInitialized) throw new Error("Galaxy not initialized");
    return await galaxyController.getLearningSuggestions(nodeId);
  }, [isInitialized]);

  // Refresh
  const refresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  // Reset
  const reset = useCallback(async () => {
    await galaxyController.reset();
    setIsInitialized(false);
    setNodes([]);
    setEdges([]);
    setClusters([]);
    setPaths([]);
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    nodes,
    edges,
    clusters,
    paths,
    addContent,
    updateNodeMastery,
    searchNodes,
    findPath,
    getConnectedNodes,
    getSubgraph,
    getRecommendations,
    getLearningSuggestions,
    refresh,
    reset
  };
}

export default useKnowledgeGalaxy;
