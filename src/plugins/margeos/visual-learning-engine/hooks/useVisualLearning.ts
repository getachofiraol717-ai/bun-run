// Visual Learning Engine — useVisualLearning hook
// Main hook for visual learning functionality

import { useState, useCallback, useEffect } from "react";
import { VisualLearningEngine, VisualLearningConfig } from "../core/VisualLearningEngine";
import type { Diagram, DiagramInput, DiagramOptions } from "../models/Diagram";
import type { MindMap } from "../models/MindMap";
import type { ConceptMap } from "../models/MindMap";
import type { Flowchart } from "../models/MindMap";
import type { Animation } from "../models/Animation";

export interface UseVisualLearningOptions {
  autoGenerate?: boolean;
  cacheEnabled?: boolean;
  maxNodes?: number;
}

export interface UseVisualLearningResult {
  // State
  loading: boolean;
  error: string | null;

  // Data
  currentDiagram: Diagram | null;
  currentMindMap: MindMap | null;
  currentConceptMap: ConceptMap | null;
  currentFlowchart: Flowchart | null;
  currentAnimation: Animation | null;

  // Actions
  generateDiagram: (input: DiagramInput, options?: DiagramOptions) => Promise<Diagram | null>;
  generateMindMap: (input: any) => Promise<MindMap | null>;
  generateConceptMap: (input: any) => Promise<ConceptMap | null>;
  generateFlowchart: (input: any) => Promise<Flowchart | null>;
  generateAnimation: (input: any) => Promise<Animation | null>;

  // Generation from other engines
  generateFromPDF: (analysis: any) => Promise<Diagram[]>;
  generateFormulaVisualization: (formula: any) => Promise<Diagram | null>;
  generateFromReferences: (sources: any) => Promise<ConceptMap | null>;

  // Utils
  clearError: () => void;
  clearCache: () => void;
  updateConfig: (config: Partial<VisualLearningConfig>) => void;
}

export function useVisualLearning(options?: UseVisualLearningOptions): UseVisualLearningResult {
  const [engine] = useState(() => new VisualLearningEngine({
    autoGenerate: options?.autoGenerate ?? true,
    cacheEnabled: options?.cacheEnabled ?? true,
    maxNodes: options?.maxNodes ?? 100
  }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [currentMindMap, setCurrentMindMap] = useState<MindMap | null>(null);
  const [currentConceptMap, setCurrentConceptMap] = useState<ConceptMap | null>(null);
  const [currentFlowchart, setCurrentFlowchart] = useState<Flowchart | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<Animation | null>(null);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Clear cache
  const clearCache = useCallback(() => engine.clearCache(), [engine]);

  // Update config
  const updateConfig = useCallback((config: Partial<VisualLearningConfig>) => {
    engine.updateConfig(config);
  }, [engine]);

  // Generate diagram
  const generateDiagram = useCallback(async (input: DiagramInput, opts?: DiagramOptions): Promise<Diagram | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await engine.generateDiagram(input, opts);
      setCurrentDiagram(result.data);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate diagram");
      return null;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  // Generate mind map
  const generateMindMap = useCallback(async (input: any): Promise<MindMap | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await engine.generateMindMap(input);
      setCurrentMindMap(result.data);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mind map");
      return null;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  // Generate concept map
  const generateConceptMap = useCallback(async (input: any): Promise<ConceptMap | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await engine.generateConceptMap(input);
      setCurrentConceptMap(result.data);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate concept map");
      return null;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  // Generate flowchart
  const generateFlowchart = useCallback(async (input: any): Promise<Flowchart | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await engine.generateFlowchart(input);
      setCurrentFlowchart(result.data);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate flowchart");
      return null;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  // Generate animation
  const generateAnimation = useCallback(async (input: any): Promise<Animation | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await engine.generateAnimation(input);
      setCurrentAnimation(result.data);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate animation");
      return null;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  // Generate from PDF analysis
  const generateFromPDF = useCallback(async (analysis: any): Promise<Diagram[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await engine.generateFromPDFAnalysis(analysis);
      if (result.success && result.data) {
        return result.data;
      }
      setError(result.error || "Failed to generate from PDF");
      return [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate from PDF");
      return [];
    } finally {
      setLoading(false);
    }
  }, [engine]);

  // Generate formula visualization
  const generateFormulaVisualization = useCallback(async (formula: any): Promise<Diagram | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await engine.generateFormulaVisualization(formula);
      if (result.success && result.data) {
        setCurrentDiagram(result.data);
        return result.data;
      }
      setError(result.error || "Failed to generate formula visualization");
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate formula visualization");
      return null;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  // Generate from references
  const generateFromReferences = useCallback(async (sources: any): Promise<ConceptMap | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await engine.generateFromReferenceBooks(sources);
      if (result.success && result.data) {
        setCurrentConceptMap(result.data);
        return result.data;
      }
      setError(result.error || "Failed to generate from references");
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate from references");
      return null;
    } finally {
      setLoading(false);
    }
  }, [engine]);

  return {
    loading,
    error,
    currentDiagram,
    currentMindMap,
    currentConceptMap,
    currentFlowchart,
    currentAnimation,
    generateDiagram,
    generateMindMap,
    generateConceptMap,
    generateFlowchart,
    generateAnimation,
    generateFromPDF,
    generateFormulaVisualization,
    generateFromReferences,
    clearError,
    clearCache,
    updateConfig
  };
}
