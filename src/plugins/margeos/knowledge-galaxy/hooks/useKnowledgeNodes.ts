// @ts-nocheck
// Knowledge Galaxy — useKnowledgeNodes Hook
// React hook for accessing knowledge nodes

import { useState, useCallback } from "react";
import { galaxyController } from "../core/GalaxyController";
import type { KnowledgeNode } from "../models";

export function useKnowledgeNodes(nodeIds?: string[]) {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const allNodes = galaxyController.getNodes();
      if (nodeIds) {
        setNodes(allNodes.filter(n => nodeIds.includes(n.id)));
      } else {
        setNodes(allNodes);
      }
    } finally {
      setIsLoading(false);
    }
  }, [nodeIds]);

  const getNode = useCallback((nodeId: string) => {
    return galaxyController.getNode(nodeId);
  }, []);

  const getNodesBySubject = useCallback((subject: string) => {
    return galaxyController.getNodes().filter(n => n.subject === subject);
  }, []);

  const getNodesByType = useCallback((type: string) => {
    return galaxyController.getNodes().filter(n => n.type === type);
  }, []);

  return {
    nodes,
    isLoading,
    loadNodes,
    getNode,
    getNodesBySubject,
    getNodesByType
  };
}

export default useKnowledgeNodes;
