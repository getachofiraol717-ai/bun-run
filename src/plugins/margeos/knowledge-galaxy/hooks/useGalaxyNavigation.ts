// @ts-nocheck
// Knowledge Galaxy — useGalaxyNavigation Hook
// React hook for navigating the knowledge galaxy

import { useState, useCallback } from "react";
import { galaxyController } from "../core/GalaxyController";
import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface NavigationState {
  currentNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  selectedNodeIds: string[];
  hoveredNodeId: string | null;
}

export function useGalaxyNavigation() {
  const [state, setState] = useState<NavigationState>({
    currentNodeId: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    selectedNodeIds: [],
    hoveredNodeId: null
  });

  const setCurrentNode = useCallback((nodeId: string | null) => {
    setState(prev => ({ ...prev, currentNodeId: nodeId }));
  }, []);

  const updateViewport = useCallback((viewport: Partial<NavigationState["viewport"]>) => {
    setState(prev => ({
      ...prev,
      viewport: { ...prev.viewport, ...viewport }
    }));
  }, []);

  const selectNode = useCallback((nodeId: string, multiSelect: boolean = false) => {
    setState(prev => {
      const current = prev.selectedNodeIds;
      let newSelection: string[];

      if (multiSelect) {
        if (current.includes(nodeId)) {
          newSelection = current.filter(id => id !== nodeId);
        } else {
          newSelection = [...current, nodeId];
        }
      } else {
        newSelection = [nodeId];
      }

      return { ...prev, selectedNodeIds: newSelection };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedNodeIds: [] }));
  }, []);

  const setHoveredNode = useCallback((nodeId: string | null) => {
    setState(prev => ({ ...prev, hoveredNodeId: nodeId }));
  }, []);

  const findPathTo = useCallback(async (targetId: string) => {
    if (!state.currentNodeId) return [];

    return await galaxyController.findPath(state.currentNodeId, targetId);
  }, [state.currentNodeId]);

  const getConnectedNodes = useCallback(async (depth: number = 1) => {
    if (!state.currentNodeId) return [];

    return await galaxyController.getConnectedNodes(state.currentNodeId, depth);
  }, [state.currentNodeId]);

  const getSubgraph = useCallback(async (radius: number) => {
    if (!state.currentNodeId) return { nodes: [], edges: [] };

    return await galaxyController.getSubgraph(state.currentNodeId, radius);
  }, [state.currentNodeId]);

  return {
    ...state,
    setCurrentNode,
    updateViewport,
    selectNode,
    clearSelection,
    setHoveredNode,
    findPathTo,
    getConnectedNodes,
    getSubgraph
  };
}

export default useGalaxyNavigation;
