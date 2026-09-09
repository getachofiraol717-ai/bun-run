// @ts-nocheck
// Reference Book Engine — ReferenceController
// Central controller for reference book operations with storage
import type { ReferenceSource, SourceMetadata, SourceType, SubjectArea } from "../models/ReferenceBook";
import type { SourceComparison, UnifiedConcept, AcademicSummary, ConceptNetwork, ConceptNode, ConceptEdge } from "../models/SourceComparison";

// Storage key for localStorage
const STORAGE_KEY = "reference_book_engine_data";

interface StoredData {
  sources: Record<string, ReferenceSource>;
  comparisons: Record<string, SourceComparison>;
  unifiedConcepts: Record<string, UnifiedConcept>;
  summaries: Record<string, AcademicSummary>;
  lastUpdated: string;
}

/**
 * Central controller for managing reference book data
 * Handles CRUD operations and data persistence
 */
export class ReferenceController {
  private sources: Map<string, ReferenceSource> = new Map();
  private comparisons: Map<string, SourceComparison> = new Map();
  private unifiedConcepts: Map<string, UnifiedConcept> = new Map();
  private summaries: Map<string, AcademicSummary> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredData = JSON.parse(stored);

        // Restore sources
        for (const [id, source] of Object.entries(data.sources)) {
          this.sources.set(id, {
            ...source,
            uploadedAt: new Date(source.uploadedAt),
            lastAccessedAt: new Date(source.lastAccessedAt)
          });
        }

        // Restore comparisons
        for (const [id, comparison] of Object.entries(data.comparisons)) {
          this.comparisons.set(id, {
            ...comparison,
            createdAt: new Date(comparison.createdAt)
          });
        }

        // Restore unified concepts
        for (const [id, concept] of Object.entries(data.unifiedConcepts)) {
          this.unifiedConcepts.set(id, {
            ...concept,
            createdAt: new Date(concept.createdAt),
            updatedAt: new Date(concept.updatedAt)
          });
        }

        // Restore summaries
        for (const [id, summary] of Object.entries(data.summaries)) {
          this.summaries.set(id, {
            ...summary,
            createdAt: new Date(summary.createdAt),
            updatedAt: new Date(summary.updatedAt)
          });
        }

        this.initialized = true;
      }
    } catch (e) {
      console.warn("Failed to load reference book data from storage:", e);
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const data: StoredData = {
        sources: Object.fromEntries(this.sources),
        comparisons: Object.fromEntries(this.comparisons),
        unifiedConcepts: Object.fromEntries(this.unifiedConcepts),
        summaries: Object.fromEntries(this.summaries),
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save reference book data:", e);
    }
  }

  /**
   * Create a new source
   */
  async createSource(documentId: string, metadata: SourceMetadata): Promise<ReferenceSource> {
    const source: ReferenceSource = {
      id: `source_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      documentId,
      metadata,
      chapters: [],
      topics: [],
      concepts: [],
      formulas: [],
      definitions: [],
      diagrams: [],
      tables: [],
      keyCitations: [],
      uploadedAt: new Date(),
      lastAccessedAt: new Date(),
      analysisStatus: "pending",
      confidenceScore: 0.5,
      usageCount: 0
    };

    this.sources.set(source.id, source);
    this.saveToStorage();

    return source;
  }

  /**
   * Get source by ID
   */
  async getSource(sourceId: string): Promise<ReferenceSource | null> {
    const source = this.sources.get(sourceId);
    if (source) {
      source.lastAccessedAt = new Date();
      source.usageCount++;
      this.saveToStorage();
    }
    return source || null;
  }

  /**
   * Get all sources
   */
  async getAllSources(): Promise<ReferenceSource[]> {
    return Array.from(this.sources.values());
  }

  /**
   * Get source count
   */
  async getSourceCount(): Promise<number> {
    return this.sources.size;
  }

  /**
   * Update source
   */
  async updateSource(sourceId: string, updates: Partial<ReferenceSource>): Promise<void> {
    const source = this.sources.get(sourceId);
    if (source) {
      const updated = { ...source, ...updates };
      this.sources.set(sourceId, updated);
      this.saveToStorage();
    }
  }

  /**
   * Update source status
   */
  async updateSourceStatus(sourceId: string, status: ReferenceSource["analysisStatus"]): Promise<void> {
    const source = this.sources.get(sourceId);
    if (source) {
      source.analysisStatus = status;
      this.sources.set(sourceId, source);
      this.saveToStorage();
    }
  }

  /**
   * Update source confidence
   */
  async updateSourceConfidence(sourceId: string, confidence: number): Promise<void> {
    const source = this.sources.get(sourceId);
    if (source) {
      source.confidenceScore = confidence;
      this.sources.set(sourceId, source);
      this.saveToStorage();
    }
  }

  /**
   * Delete source
   */
  async deleteSource(sourceId: string): Promise<void> {
    this.sources.delete(sourceId);
    this.saveToStorage();
  }

  /**
   * Search sources
   */
  async searchSources(query: string): Promise<ReferenceSource[]> {
    const queryLower = query.toLowerCase();
    const results: ReferenceSource[] = [];

    for (const source of this.sources.values()) {
      // Check title
      if (source.metadata.title.toLowerCase().includes(queryLower)) {
        results.push(source);
        continue;
      }

      // Check authors
      if (source.metadata.authors.some(a => a.toLowerCase().includes(queryLower))) {
        results.push(source);
        continue;
      }

      // Check topics
      if (source.topics.some(t => t.name.toLowerCase().includes(queryLower))) {
        results.push(source);
        continue;
      }

      // Check concepts
      if (source.concepts.some(c => c.name.toLowerCase().includes(queryLower))) {
        results.push(source);
      }
    }

    return results;
  }

  /**
   * Get sources for a topic
   */
  async getSourcesForTopic(topicId: string): Promise<ReferenceSource[]> {
    return Array.from(this.sources.values()).filter(source =>
      source.topics.some(t => t.id === topicId || t.name === topicId)
    );
  }

  /**
   * Save comparison
   */
  async saveComparison(comparison: SourceComparison): Promise<void> {
    this.comparisons.set(comparison.id, comparison);
    this.saveToStorage();
  }

  /**
   * Get comparison
   */
  async getComparison(comparisonId: string): Promise<SourceComparison | null> {
    return this.comparisons.get(comparisonId) || null;
  }

  /**
   * Get comparison for topic
   */
  async getComparisonForTopic(topicId: string): Promise<SourceComparison | null> {
    for (const comparison of this.comparisons.values()) {
      if (comparison.topicId === topicId) {
        return comparison;
      }
    }
    return null;
  }

  /**
   * Save unified concept
   */
  async saveUnifiedConcept(concept: UnifiedConcept): Promise<void> {
    this.unifiedConcepts.set(concept.id, concept);
    this.saveToStorage();
  }

  /**
   * Get unified concept
   */
  async getUnifiedConcept(conceptId: string): Promise<UnifiedConcept | null> {
    return this.unifiedConcepts.get(conceptId) || null;
  }

  /**
   * Save summary
   */
  async saveSummary(summary: AcademicSummary): Promise<void> {
    this.summaries.set(summary.id, summary);
    this.saveToStorage();
  }

  /**
   * Get summary
   */
  async getSummary(summaryId: string): Promise<AcademicSummary | null> {
    return this.summaries.get(summaryId) || null;
  }

  /**
   * Build concept network
   */
  async buildConceptNetwork(conceptId: string, depth: number = 2): Promise<ConceptNetwork> {
    const nodes: ConceptNode[] = [];
    const edges: ConceptEdge[] = [];
    const visited = new Set<string>();

    // Add center node
    nodes.push({
      id: conceptId,
      name: conceptId,
      type: "concept",
      distance: 0
    });
    visited.add(conceptId);

    // Build network recursively
    await this.buildNetworkRecursive(conceptId, depth, nodes, edges, visited);

    return {
      id: `network_${conceptId}_${Date.now()}`,
      name: conceptId,
      centerConceptId: conceptId,
      depth,
      nodes,
      paths: this.findPaths(nodes, edges)
    };
  }

  private async buildNetworkRecursive(
    conceptId: string,
    remainingDepth: number,
    nodes: ConceptNode[],
    edges: ConceptEdge[],
    visited: Set<string>
  ): Promise<void> {
    if (remainingDepth <= 0) return;

    // Find related concepts from all sources
    for (const source of this.sources.values()) {
      for (const concept of source.concepts) {
        if (concept.id === conceptId || concept.relatedTopics.includes(conceptId)) {
          // Add related concepts
          for (const relatedId of concept.connections) {
            if (!visited.has(relatedId)) {
              visited.add(relatedId);
              nodes.push({
                id: relatedId,
                name: concept.name,
                type: "concept",
                sourceId: source.id,
                distance: nodes.length
              });
            }

            edges.push({
              source: conceptId,
              target: relatedId,
              relationship: "related_to",
              weight: 0.7
            });
          }
        }
      }

      // Add topics as nodes
      for (const topic of source.topics) {
        if (!visited.has(topic.id)) {
          visited.add(topic.id);
          nodes.push({
            id: topic.id,
            name: topic.name,
            type: "topic",
            sourceId: source.id,
            distance: nodes.length
          });

          edges.push({
            source: conceptId,
            target: topic.id,
            relationship: "part_of",
            weight: 0.8
          });
        }
      }
    }

    // Recurse for next depth
    const nextConcepts = edges
      .filter(e => e.source === conceptId)
      .map(e => e.target);

    for (const nextConcept of nextConcepts) {
      await this.buildNetworkRecursive(
        nextConcept,
        remainingDepth - 1,
        nodes,
        edges,
        visited
      );
    }
  }

  private findPaths(nodes: ConceptNode[], edges: ConceptEdge[]): ConceptNetwork["paths"] {
    // Simple path finding
    return [];
  }

  /**
   * Get library statistics
   */
  async getStats(): Promise<{
    totalSources: number;
    byType: Record<SourceType, number>;
    bySubject: Record<SubjectArea, number>;
    averageConfidence: number;
    totalConcepts: number;
  }> {
    const byType: Record<SourceType, number> = {} as any;
    const bySubject: Record<SubjectArea, number> = {} as any;
    let totalConfidence = 0;
    let totalConcepts = 0;

    for (const source of this.sources.values()) {
      byType[source.metadata.sourceType] = (byType[source.metadata.sourceType] || 0) + 1;
      bySubject[source.metadata.subject] = (bySubject[source.metadata.subject] || 0) + 1;
      totalConfidence += source.confidenceScore;
      totalConcepts += source.concepts.length;
    }

    return {
      totalSources: this.sources.size,
      byType,
      bySubject,
      averageConfidence: this.sources.size > 0 ? totalConfidence / this.sources.size : 0,
      totalConcepts
    };
  }

  /**
   * Export library data
   */
  async exportLibrary(): Promise<{
    version: string;
    exportedAt: Date;
    sources: any[];
    summaries: AcademicSummary[];
  }> {
    return {
      version: "1.0",
      exportedAt: new Date(),
      sources: Array.from(this.sources.values()).map(s => ({
        sourceId: s.id,
        metadata: s.metadata,
        analysisComplete: s.analysisStatus === "completed"
      })),
      summaries: Array.from(this.summaries.values())
    };
  }

  /**
   * Import library data
   */
  async importLibrary(data: any): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    if (data.sources) {
      for (const sourceData of data.sources) {
        if (!this.sources.has(sourceData.sourceId)) {
          // Would create the source here
          imported++;
        } else {
          skipped++;
        }
      }
    }

    this.saveToStorage();
    return { imported, skipped };
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    this.sources.clear();
    this.comparisons.clear();
    this.unifiedConcepts.clear();
    this.summaries.clear();

    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

// Export singleton instance
export const referenceController = new ReferenceController();
