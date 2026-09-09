// @ts-nocheck
// Knowledge Galaxy — useLearningGraph Hook
// React hook for accessing learning paths and graphs

import { useState, useCallback } from "react";
import { galaxyController } from "../core/GalaxyController";
import type { LearningPath } from "../models";

export function useLearningGraph() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPaths = useCallback(async () => {
    setIsLoading(true);
    try {
      const allPaths = galaxyController.getPaths();
      setPaths(allPaths);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPath = useCallback(async (title: string, subject: string, targetNodeId: string) => {
    return await galaxyController.createLearningPath(title, subject, targetNodeId);
  }, []);

  const updatePathProgress = useCallback(async (pathId: string, nodeId: string, progress: number) => {
    await galaxyController.updatePathProgress(pathId, nodeId, progress);
    await loadPaths();
  }, [loadPaths]);

  const getActivePaths = useCallback(() => {
    return paths.filter(p => p.status === "in_progress");
  }, [paths]);

  const getRecommendedPaths = useCallback(() => {
    return paths.filter(p => p.isRecommended);
  }, [paths]);

  return {
    paths,
    isLoading,
    loadPaths,
    createPath,
    updatePathProgress,
    getActivePaths,
    getRecommendedPaths
  };
}

export default useLearningGraph;
