// Reference Book Engine — useReferenceBooks hook
// React hook for accessing reference book functionality
import { useState, useCallback, useEffect } from "react";
import { referenceController } from "../core/ReferenceController";
import type { ReferenceSource, SourceMetadata, SourceType } from "../models/ReferenceBook";
import type { SourceComparison, UnifiedConcept, AcademicSummary } from "../models/SourceComparison";

export interface UseReferenceBooksOptions {
  autoLoad?: boolean;
}

const DEFAULT_OPTIONS: UseReferenceBooksOptions = {
  autoLoad: true
};

export function useReferenceBooks(options: UseReferenceBooksOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [sources, setSources] = useState<ReferenceSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalSources: number;
    byType: Record<SourceType, number>;
    bySubject: Record<string, number>;
    averageConfidence: number;
    totalConcepts: number;
  } | null>(null);

  // Load sources on mount
  useEffect(() => {
    if (opts.autoLoad) {
      loadSources();
    }
  }, [opts.autoLoad]);

  // Load all sources
  const loadSources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allSources = await referenceController.getAllSources();
      setSources(allSources);

      const libraryStats = await referenceController.getStats();
      setStats(libraryStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sources");
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new source
  const addSource = useCallback(async (documentId: string, metadata: SourceMetadata) => {
    setLoading(true);
    setError(null);

    try {
      const source = await referenceController.createSource(documentId, metadata);
      setSources(prev => [...prev, source]);
      await loadSources(); // Refresh stats
      return source;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add source");
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadSources]);

  // Get source by ID
  const getSource = useCallback(async (sourceId: string) => {
    return referenceController.getSource(sourceId);
  }, []);

  // Update source
  const updateSource = useCallback(async (sourceId: string, updates: Partial<ReferenceSource>) => {
    await referenceController.updateSource(sourceId, updates);
    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, ...updates } : s));
  }, []);

  // Delete source
  const deleteSource = useCallback(async (sourceId: string) => {
    await referenceController.deleteSource(sourceId);
    setSources(prev => prev.filter(s => s.id !== sourceId));
    await loadSources(); // Refresh stats
  }, [loadSources]);

  // Search sources
  const searchSources = useCallback(async (query: string) => {
    if (!query.trim()) {
      return sources;
    }
    return referenceController.searchSources(query);
  }, [sources]);

  // Get sources for topic
  const getSourcesForTopic = useCallback(async (topicId: string) => {
    return referenceController.getSourcesForTopic(topicId);
  }, []);

  return {
    // State
    sources,
    loading,
    error,
    stats,

    // Actions
    loadSources,
    addSource,
    getSource,
    updateSource,
    deleteSource,
    searchSources,
    getSourcesForTopic
  };
}

// Hook for single source
export function useReferenceSource(sourceId: string | null) {
  const [source, setSource] = useState<ReferenceSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceId) {
      setSource(null);
      return;
    }

    setLoading(true);
    referenceController.getSource(sourceId)
      .then(result => {
        setSource(result);
        setError(null);
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : "Failed to load source");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sourceId]);

  const updateSource = useCallback(async (updates: Partial<ReferenceSource>) => {
    if (!sourceId) return;
    await referenceController.updateSource(sourceId, updates);
    setSource(prev => prev ? { ...prev, ...updates } : null);
  }, [sourceId]);

  return { source, loading, error, updateSource };
}

// Hook for source comparison
export function useSourceComparison(topicId: string | null) {
  const [comparison, setComparison] = useState<SourceComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComparison = useCallback(async () => {
    if (!topicId) return;

    setLoading(true);
    try {
      const result = await referenceController.getComparisonForTopic(topicId);
      setComparison(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comparison");
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  return { comparison, loading, error, reload: loadComparison };
}

// Hook for unified explanation
export function useUnifiedExplanation(topicId: string | null) {
  const [concept, setConcept] = useState<UnifiedConcept | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConcept = useCallback(async () => {
    if (!topicId) return;

    setLoading(true);
    try {
      // Would call ReferenceBookEngine here
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load concept");
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    loadConcept();
  }, [loadConcept]);

  return { concept, loading, error, reload: loadConcept };
}

// Hook for citation generation
export function useCitation() {
  const [loading, setLoading] = useState(false);

  const generateCitation = useCallback(async (
    sourceId: string,
    style: "apa" | "mla" | "chicago" | "ieee" | "harvard" | "vancouver" = "apa"
  ) => {
    setLoading(true);
    try {
      const source = await referenceController.getSource(sourceId);
      if (!source) return "";

      // Generate citation using CitationEngine
      const { CitationEngine } = await import("../core/CitationEngine");
      const engine = new CitationEngine(style);
      return engine.generateCitation(source.metadata);
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateCitation, loading };
}

// Hook for recommendations
export function useRecommendations(topicId: string | null, limit: number = 5) {
  const [recommendations, setRecommendations] = useState<ReferenceSource[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecommendations = useCallback(async () => {
    if (!topicId) return;

    setLoading(true);
    try {
      // Would call SourceRankingEngine here
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return { recommendations, loading, reload: loadRecommendations };
}
