// @ts-nocheck
// Reference Book Engine — ReferenceBookEngine
// Main orchestrator for reference book processing
import type { ReferenceSource, SourceMetadata, SourceType, SubjectArea } from "../models/ReferenceBook";
import type { SourceComparison, UnifiedConcept, AcademicSummary, ConceptNetwork } from "../models/SourceComparison";
import { SourceAnalyzer } from "./SourceAnalyzer";
import { SourceComparator } from "./SourceComparator";
import { ConceptMerger } from "./ConceptMerger";
import { UnifiedExplanationEngine } from "./UnifiedExplanationEngine";
import { CitationEngine } from "./CitationEngine";
import { ConflictResolver } from "./ConflictResolver";
import { SourceRankingEngine } from "./SourceRankingEngine";
import { ReferenceController } from "./ReferenceController";

export interface ReferenceBookEngineConfig {
  autoAnalyzeOnUpload: boolean;
  maxSources: number;
  cacheEnabled: boolean;
  confidenceThreshold: number;
  enableConflictDetection: boolean;
  citationStyle: "apa" | "mla" | "chicago" | "ieee" | "harvard" | "vancouver";
}

const DEFAULT_CONFIG: ReferenceBookEngineConfig = {
  autoAnalyzeOnUpload: true,
  maxSources: 100,
  cacheEnabled: true,
  confidenceThreshold: 0.7,
  enableConflictDetection: true,
  citationStyle: "apa"
};

export interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export interface AnalysisResult {
  source: ReferenceSource;
  comparison?: SourceComparison;
  unifiedConcept?: UnifiedConcept;
  confidence: number;
}

/**
 * Main Reference Book Engine class
 * Orchestrates all reference book processing operations
 */
export class ReferenceBookEngine {
  private config: ReferenceBookEngineConfig;
  private analyzer: SourceAnalyzer;
  private comparator: SourceComparator;
  private merger: ConceptMerger;
  private explanationEngine: UnifiedExplanationEngine;
  private citationEngine: CitationEngine;
  private conflictResolver: ConflictResolver;
  private rankingEngine: SourceRankingEngine;
  private controller: ReferenceController;

  constructor(config?: Partial<ReferenceBookEngineConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.analyzer = new SourceAnalyzer();
    this.comparator = new SourceComparator();
    this.merger = new ConceptMerger();
    this.explanationEngine = new UnifiedExplanationEngine();
    this.citationEngine = new CitationEngine(this.config.citationStyle);
    this.conflictResolver = new ConflictResolver();
    this.rankingEngine = new SourceRankingEngine();
    this.controller = new ReferenceController();
  }

  /**
   * Add a new source to the library
   */
  async addSource(
    documentId: string,
    metadata: SourceMetadata
  ): Promise<EngineResult<ReferenceSource>> {
    try {
      // Check max sources limit
      const currentCount = await this.controller.getSourceCount();
      if (currentCount >= this.config.maxSources) {
        return {
          success: false,
          error: `Maximum sources limit reached (${this.config.maxSources}). Please remove some sources to add new ones.`
        };
      }

      // Create source entry
      const source = await this.controller.createSource(documentId, metadata);

      // Auto-analyze if enabled
      if (this.config.autoAnalyzeOnUpload) {
        await this.analyzeSource(source.id);
      }

      return { success: true, data: source };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add source"
      };
    }
  }

  /**
   * Analyze a source document
   */
  async analyzeSource(sourceId: string): Promise<EngineResult<AnalysisResult>> {
    try {
      const source = await this.controller.getSource(sourceId);
      if (!source) {
        return { success: false, error: "Source not found" };
      }

      // Update status to analyzing
      await this.controller.updateSourceStatus(sourceId, "analyzing");

      // Analyze the source
      const analysis = await this.analyzer.analyzeSource(source);
      await this.controller.updateSource(sourceId, analysis);

      // Calculate confidence score
      const confidence = this.rankingEngine.calculateSourceConfidence(source);

      // Check for conflicts with existing sources
      let comparison: SourceComparison | undefined;
      if (this.config.enableConflictDetection) {
        const existingSources = await this.controller.getAllSources();
        const otherSources = existingSources.filter(s => s.id !== sourceId);

        if (otherSources.length > 0) {
          comparison = await this.comparator.compareToSources(source, otherSources);
          await this.controller.saveComparison(comparison);
        }
      }

      // Update status to completed
      await this.controller.updateSourceStatus(sourceId, "completed");
      await this.controller.updateSourceConfidence(sourceId, confidence);

      return {
        success: true,
        data: {
          source,
          comparison,
          confidence
        }
      };
    } catch (error) {
      await this.controller.updateSourceStatus(sourceId, "failed");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Analysis failed"
      };
    }
  }

  /**
   * Generate unified explanation for a topic from multiple sources
   */
  async generateUnifiedExplanation(
    topicId: string,
    sourceIds?: string[]
  ): Promise<EngineResult<UnifiedConcept>> {
    try {
      // Get sources to use
      let sources: ReferenceSource[];
      if (sourceIds && sourceIds.length > 0) {
        sources = await Promise.all(
          sourceIds.map(id => this.controller.getSource(id))
        ).then(results => results.filter((s): s is ReferenceSource => s !== null));
      } else {
        sources = await this.controller.getSourcesForTopic(topicId);
      }

      if (sources.length === 0) {
        return { success: false, error: "No sources found for topic" };
      }

      // Get any existing comparison
      const comparison = await this.controller.getComparisonForTopic(topicId);

      // Merge concepts
      const mergedConcept = await this.merger.mergeConcepts(sources, topicId, comparison);

      // Generate unified explanation
      const unifiedConcept = await this.explanationEngine.generate(
        mergedConcept,
        sources,
        comparison
      );

      // Add citations
      unifiedConcept.citations = await this.citationEngine.generateCitations(
        unifiedConcept,
        this.config.citationStyle
      );

      // Save the unified concept
      await this.controller.saveUnifiedConcept(unifiedConcept);

      return { success: true, data: unifiedConcept };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate explanation"
      };
    }
  }

  /**
   * Compare concepts across multiple sources
   */
  async compareSources(sourceIds: string[], topicId: string): Promise<EngineResult<SourceComparison>> {
    try {
      const sources = await Promise.all(
        sourceIds.map(id => this.controller.getSource(id))
      ).then(results => results.filter((s): s is ReferenceSource => s !== null));

      if (sources.length < 2) {
        return { success: false, error: "Need at least 2 sources to compare" };
      }

      const comparison = await this.comparator.compareSources(sources, topicId);
      await this.controller.saveComparison(comparison);

      return { success: true, data: comparison };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Comparison failed"
      };
    }
  }

  /**
   * Resolve conflicts in source comparisons
   */
  async resolveConflicts(comparisonId: string): Promise<EngineResult<SourceComparison>> {
    try {
      const comparison = await this.controller.getComparison(comparisonId);
      if (!comparison) {
        return { success: false, error: "Comparison not found" };
      }

      const resolved = await this.conflictResolver.resolve(comparison);
      await this.controller.saveComparison(resolved);

      return { success: true, data: resolved };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Conflict resolution failed"
      };
    }
  }

  /**
   * Generate academic summary from sources
   */
  async generateSummary(
    sourceIds: string[],
    type: "chapter" | "topic" | "book" | "research" | "multi_source"
  ): Promise<EngineResult<AcademicSummary>> {
    try {
      const sources = await Promise.all(
        sourceIds.map(id => this.controller.getSource(id))
      ).then(results => results.filter((s): s is ReferenceSource => s !== null));

      const summary = await this.explanationEngine.generateSummary(sources, type);
      await this.controller.saveSummary(summary);

      return { success: true, data: summary };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Summary generation failed"
      };
    }
  }

  /**
   * Build concept knowledge network
   */
  async buildConceptNetwork(conceptId: string, depth: number = 2): Promise<EngineResult<ConceptNetwork>> {
    try {
      const network = await this.controller.buildConceptNetwork(conceptId, depth);
      return { success: true, data: network };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network building failed"
      };
    }
  }

  /**
   * Search sources by topic or concept
   */
  async searchSources(query: string): Promise<EngineResult<ReferenceSource[]>> {
    try {
      const results = await this.controller.searchSources(query);
      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Search failed"
      };
    }
  }

  /**
   * Get recommendations based on learning history
   */
  async getRecommendations(
    topicId: string,
    learningHistory?: string[]
  ): Promise<EngineResult<ReferenceSource[]>> {
    try {
      const recommendations = await this.rankingEngine.getRecommendations(
        topicId,
        learningHistory
      );
      return { success: true, data: recommendations };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Recommendations failed"
      };
    }
  }

  /**
   * Generate citation for a concept
   */
  async generateCitation(
    sourceId: string,
    style?: "apa" | "mla" | "chicago" | "ieee" | "harvard" | "vancouver"
  ): Promise<EngineResult<string>> {
    try {
      const source = await this.controller.getSource(sourceId);
      if (!source) {
        return { success: false, error: "Source not found" };
      }

      const citation = await this.citationEngine.generateCitation(
        source.metadata,
        style || this.config.citationStyle
      );

      return { success: true, data: citation };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Citation generation failed"
      };
    }
  }

  /**
   * Get library statistics
   */
  async getLibraryStats(): Promise<{
    totalSources: number;
    byType: Record<SourceType, number>;
    bySubject: Record<SubjectArea, number>;
    averageConfidence: number;
    totalConcepts: number;
  }> {
    return this.controller.getStats();
  }

  /**
   * Export library data
   */
  async exportLibrary(): Promise<EngineResult<string>> {
    try {
      const data = await this.controller.exportLibrary();
      return { success: true, data: JSON.stringify(data, null, 2) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed"
      };
    }
  }

  /**
   * Import library data
   */
  async importLibrary(data: string): Promise<EngineResult<{ imported: number; skipped: number }>> {
    try {
      const result = await this.controller.importLibrary(JSON.parse(data));
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Import failed"
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReferenceBookEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ReferenceBookEngineConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const referenceBookEngine = new ReferenceBookEngine();
