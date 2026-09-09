// @ts-nocheck
// Knowledge Galaxy — useRecommendations Hook
// React hook for accessing recommendations

import { useState, useCallback } from "react";
import { galaxyController } from "../core/GalaxyController";
import type { KnowledgeNode } from "../models";

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<KnowledgeNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadRecommendations = useCallback(async (options?: any) => {
    setIsLoading(true);
    try {
      const recs = await galaxyController.getRecommendations(options);
      setRecommendations(recs);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSuggestionsForNode = useCallback(async (nodeId: string) => {
    return await galaxyController.getLearningSuggestions(nodeId);
  }, []);

  const getKnowledgeGaps = useCallback(async () => {
    return await galaxyController.getKnowledgeGaps();
  }, []);

  return {
    recommendations,
    isLoading,
    loadRecommendations,
    getSuggestionsForNode,
    getKnowledgeGaps
  };
}

export default useRecommendations;
