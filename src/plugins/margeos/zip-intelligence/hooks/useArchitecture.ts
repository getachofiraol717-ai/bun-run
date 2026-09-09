// @ts-nocheck
/**
 * useArchitecture Hook
 * React hook for architecture analysis and visualization
 */

import { useState, useCallback, useMemo } from 'react';
import { Project } from '../models/ProjectModel';
import { DependencyGraph, DependencyNode, DependencyEdge } from '../models/DependencyGraph';
import DependencyGraphAnalyzer from '../analyzers/DependencyGraphAnalyzer';
import ArchitectureAnalyzer from '../core/ArchitectureAnalyzer';

export interface UseArchitectureReturn {
  // State
  dependencyGraph: DependencyGraph | null;
  architecture: {
    pattern: string;
    description: string;
    layers: Array<{ name: string; description: string; folders: string[] }>;
  } | null;
  circularDependencies: string[][];
  healthScore: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  analyzeArchitecture: (project: Project) => Promise<void>;
  getNodeDetails: (nodeId: string) => DependencyNode | null;
  getRelatedNodes: (nodeId: string) => DependencyNode[];
  getOutgoingEdges: (nodeId: string) => DependencyEdge[];
  getIncomingEdges: (nodeId: string) => DependencyEdge[];

  // Visualization helpers
  getGraphLayout: () => GraphLayout;
  getFilteredGraph: (options: FilterOptions) => DependencyGraph | null;
}

export interface FilterOptions {
  nodeTypes?: DependencyNode['type'][];
  depth?: number;
  showExternal?: boolean;
}

export interface GraphLayout {
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    path: string;
  }>;
}

export function useArchitecture(): UseArchitectureReturn {
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraph | null>(null);
  const [architecture, setArchitecture] = useState<UseArchitectureReturn['architecture']>(null);
  const [circularDependencies, setCircularDependencies] = useState<string[][]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depAnalyzer = useMemo(() => DependencyGraphAnalyzer.getInstance(), []);
  const archAnalyzer = useMemo(() => ArchitectureAnalyzer.getInstance(), []);

  const analyzeArchitecture = useCallback(async (project: Project) => {
    setIsLoading(true);
    setError(null);

    try {
      // Analyze dependency graph
      const depResult = depAnalyzer.analyze(project);
      setDependencyGraph(depResult.graph);
      setCircularDependencies(depResult.circularDependencies);
      setHealthScore(depResult.healthScore);

      // Analyze architecture pattern
      const archResult = archAnalyzer.analyze(project);
      setArchitecture({
        pattern: archResult.pattern.name,
        description: archResult.pattern.description,
        layers: archResult.layers.map((layer) => ({
          name: layer.name,
          description: layer.description,
          folders: layer.folders,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Architecture analysis failed');
    } finally {
      setIsLoading(false);
    }
  }, [depAnalyzer, archAnalyzer]);

  const getNodeDetails = useCallback((nodeId: string): DependencyNode | null => {
    if (!dependencyGraph) return null;
    return dependencyGraph.nodes.find((n) => n.id === nodeId) || null;
  }, [dependencyGraph]);

  const getRelatedNodes = useCallback((nodeId: string): DependencyNode[] => {
    if (!dependencyGraph) return [];

    const related: DependencyNode[] = [];
    const visited = new Set<string>();

    const addRelated = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = dependencyGraph.nodes.find((n) => n.id === id);
      if (node) related.push(node);
    };

    // Add dependencies
    const edges = dependencyGraph.edges.filter((e) => e.from === nodeId);
    for (const edge of edges) {
      addRelated(edge.to);
    }

    // Add dependents
    const incoming = dependencyGraph.edges.filter((e) => e.to === nodeId);
    for (const edge of incoming) {
      addRelated(edge.from);
    }

    return related;
  }, [dependencyGraph]);

  const getOutgoingEdges = useCallback((nodeId: string): DependencyEdge[] => {
    if (!dependencyGraph) return [];
    return dependencyGraph.edges.filter((e) => e.from === nodeId);
  }, [dependencyGraph]);

  const getIncomingEdges = useCallback((nodeId: string): DependencyEdge[] => {
    if (!dependencyGraph) return [];
    return dependencyGraph.edges.filter((e) => e.to === nodeId);
  }, [dependencyGraph]);

  const getGraphLayout = useCallback((): GraphLayout => {
    if (!dependencyGraph) {
      return { nodes: [], edges: [] };
    }

    const nodePositions: GraphLayout['nodes'] = [];
    const levelMap = new Map<string, number>();
    const levels = new Map<number, string[]>();

    // Calculate levels (BFS from entry points)
    const entryNodes = dependencyGraph.nodes.filter((n) => n.type === 'entry' || n.dependents.length === 0);
    const queue: Array<{ id: string; level: number }> = entryNodes.map((n) => ({ id: n.id, level: 0 }));

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;

      if (levelMap.has(id)) continue;
      levelMap.set(id, level);

      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(id);

      // Add dependents to queue
      const outgoing = dependencyGraph.edges.filter((e) => e.from === id);
      for (const edge of outgoing) {
        if (!levelMap.has(edge.to)) {
          queue.push({ id: edge.to, level: level + 1 });
        }
      }
    }

    // Position nodes
    const nodeWidth = 120;
    const nodeHeight = 40;
    const horizontalSpacing = 40;
    const verticalSpacing = 60;

    for (const [level, nodeIds] of levels) {
      const x = level * (nodeWidth + horizontalSpacing) + 50;
      const totalHeight = nodeIds.length * (nodeHeight + verticalSpacing);
      const startY = -totalHeight / 2 + nodeHeight / 2;

      nodeIds.forEach((id, index) => {
        nodePositions.push({
          id,
          x,
          y: startY + index * (nodeHeight + verticalSpacing),
          width: nodeWidth,
          height: nodeHeight,
        });
      });
    }

    // Generate edge paths
    const edgePaths: GraphLayout['edges'] = [];
    const positionMap = new Map(nodePositions.map((p) => [p.id, p]));

    for (const edge of dependencyGraph.edges) {
      const fromPos = positionMap.get(edge.from);
      const toPos = positionMap.get(edge.to);

      if (fromPos && toPos) {
        const path = `M ${fromPos.x + fromPos.width} ${fromPos.y + fromPos.height / 2}
                       C ${fromPos.x + fromPos.width + 50} ${fromPos.y + fromPos.height / 2},
                         ${toPos.x - 50} ${toPos.y + toPos.height / 2},
                         ${toPos.x} ${toPos.y + toPos.height / 2}`;

        edgePaths.push({
          from: edge.from,
          to: edge.to,
          path,
        });
      }
    }

    return {
      nodes: nodePositions,
      edges: edgePaths,
    };
  }, [dependencyGraph]);

  const getFilteredGraph = useCallback((options: FilterOptions): DependencyGraph | null => {
    if (!dependencyGraph) return null;

    let filteredNodes = dependencyGraph.nodes;
    let filteredEdges = dependencyGraph.edges;

    // Filter by node types
    if (options.nodeTypes && options.nodeTypes.length > 0) {
      const nodeIds = new Set(filteredNodes.filter((n) => options.nodeTypes!.includes(n.type)).map((n) => n.id));
      filteredEdges = filteredEdges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
      filteredNodes = filteredNodes.filter((n) => nodeIds.has(n.id));
    }

    // Filter external dependencies
    if (!options.showExternal) {
      filteredEdges = filteredEdges.filter((e) => e.type !== 'external');
      const connectedNodes = new Set<string>();
      filteredEdges.forEach((e) => {
        connectedNodes.add(e.from);
        connectedNodes.add(e.to);
      });
      filteredNodes = filteredNodes.filter((n) => connectedNodes.has(n.id));
    }

    return {
      ...dependencyGraph,
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  }, [dependencyGraph]);

  return {
    dependencyGraph,
    architecture,
    circularDependencies,
    healthScore,
    isLoading,
    error,
    analyzeArchitecture,
    getNodeDetails,
    getRelatedNodes,
    getOutgoingEdges,
    getIncomingEdges,
    getGraphLayout,
    getFilteredGraph,
  };
}

export default useArchitecture;
