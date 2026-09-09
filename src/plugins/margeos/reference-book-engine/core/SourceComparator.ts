// @ts-nocheck
// Reference Book Engine — SourceComparator
// Feature 3: Concept Comparison - Compare how different sources explain topics
import type { ReferenceSource } from "../models/ReferenceBook";
import type {
  SourceComparison,
  SourceComparisonData,
  TerminologyMapping,
  DefinitionComparison,
  ExampleComparison,
  ComparisonSummary,
  ConceptConflict,
  ConsensusPoint
} from "../models/SourceComparison";

export interface ComparisonCriteria {
  includeTerminology: boolean;
  includeDefinitions: boolean;
  includeExamples: boolean;
  includeDifficulty: boolean;
  includeMethodology: boolean;
}

const DEFAULT_CRITERIA: ComparisonCriteria = {
  includeTerminology: true,
  includeDefinitions: true,
  includeExamples: true,
  includeDifficulty: true,
  includeMethodology: true
};

/**
 * Compares how multiple sources explain the same concept or topic
 */
export class SourceComparator {
  /**
   * Compare a source against multiple other sources for a specific topic
   */
  async compareToSources(
    source: ReferenceSource,
    otherSources: ReferenceSource[],
    topicId?: string
  ): Promise<SourceComparison> {
    const comparisonData: SourceComparisonData[] = [];

    // Build comparison for the primary source
    comparisonData.push({
      sourceId: source.id,
      sourceName: source.metadata.title,
      sourceType: source.metadata.sourceType,
      terminologies: this.extractTerminology(source, topicId),
      definitions: this.extractDefinitions(source, topicId),
      examples: this.extractExamples(source, topicId),
      explanations: this.extractExplanations(source, topicId),
      difficulty: source.metadata.difficulty || "intermediate",
      confidence: source.confidenceScore,
      quality: this.assessQuality(source)
    });

    // Build comparison for other sources
    for (const other of otherSources) {
      comparisonData.push({
        sourceId: other.id,
        sourceName: other.metadata.title,
        sourceType: other.metadata.sourceType,
        terminologies: this.extractTerminology(other, topicId),
        definitions: this.extractDefinitions(other, topicId),
        examples: this.extractExamples(other, topicId),
        explanations: this.extractExplanations(other, topicId),
        difficulty: other.metadata.difficulty || "intermediate",
        confidence: other.confidenceScore,
        quality: this.assessQuality(other)
      });
    }

    // Generate comparison summary
    const summary = this.generateSummary(comparisonData);

    // Identify conflicts
    const conflicts = this.identifyConflicts(comparisonData);

    // Identify consensus
    const consensus = this.identifyConsensus(comparisonData);

    return {
      id: `comparison_${source.id}_${Date.now()}`,
      topicId: topicId || this.inferTopicId(source),
      sources: comparisonData,
      comparisonSummary: summary,
      conflicts,
      consensus,
      createdAt: new Date()
    };
  }

  /**
   * Compare multiple sources against each other
   */
  async compareSources(
    sources: ReferenceSource[],
    topicId: string
  ): Promise<SourceComparison> {
    if (sources.length < 2) {
      throw new Error("Need at least 2 sources to compare");
    }

    const comparisonData: SourceComparisonData[] = sources.map(source => ({
      sourceId: source.id,
      sourceName: source.metadata.title,
      sourceType: source.metadata.sourceType,
      terminologies: this.extractTerminology(source, topicId),
      definitions: this.extractDefinitions(source, topicId),
      examples: this.extractExamples(source, topicId),
      explanations: this.extractExplanations(source, topicId),
      difficulty: source.metadata.difficulty || "intermediate",
      confidence: source.confidenceScore,
      quality: this.assessQuality(source)
    }));

    const summary = this.generateSummary(comparisonData);
    const conflicts = this.identifyConflicts(comparisonData);
    const consensus = this.identifyConsensus(comparisonData);

    return {
      id: `comparison_${sources.map(s => s.id).join("_")}_${Date.now()}`,
      topicId,
      sources: comparisonData,
      comparisonSummary: summary,
      conflicts,
      consensus,
      createdAt: new Date()
    };
  }

  /**
   * Extract terminology used in a source for a topic
   */
  private extractTerminology(source: ReferenceSource, topicId?: string): TerminologyMapping[] {
    const mappings: TerminologyMapping[] = [];

    // Extract from concepts
    for (const concept of source.concepts) {
      if (!topicId || concept.relatedTopics.includes(topicId)) {
        mappings.push({
          conceptId: concept.id,
          sourceTerminology: concept.name,
          standardTerminology: concept.name, // Would be mapped to standard
          alternatives: [concept.name] // Would include synonyms
        });
      }
    }

    return mappings;
  }

  /**
   * Extract definitions from a source
   */
  private extractDefinitions(source: ReferenceSource, topicId?: string): DefinitionComparison[] {
    const comparisons: DefinitionComparison[] = [];

    // Filter definitions by topic
    const relevantDefinitions = source.definitions.filter(def => {
      if (!topicId) return true;
      // Would check if definition relates to topic
      return true;
    });

    for (const def of relevantDefinitions) {
      comparisons.push({
        conceptId: def.id,
        definitions: [{
          sourceId: source.id,
          definition: def.definition,
          completeness: this.assessCompleteness(def.definition),
          clarity: this.assessClarity(def.definition)
        }]
      });
    }

    return comparisons;
  }

  /**
   * Extract examples from a source
   */
  private extractExamples(source: ReferenceSource, topicId?: string): ExampleComparison[] {
    const comparisons: ExampleComparison[] = [];

    // Extract from concepts
    for (const concept of source.concepts) {
      if (!topicId || concept.relatedTopics.includes(topicId)) {
        comparisons.push({
          conceptId: concept.id,
          examples: concept.examples.map(ex => ({
            sourceId: source.id,
            example: ex,
            quality: 3, // Default quality score
            appropriateness: 0.8
          }))
        });
      }
    }

    return comparisons;
  }

  /**
   * Extract explanations from a source
   */
  private extractExplanations(source: ReferenceSource, topicId?: string): string[] {
    const explanations: string[] = [];

    // Get explanations from concepts
    for (const concept of source.concepts) {
      if (!topicId || concept.relatedTopics.includes(topicId)) {
        explanations.push(concept.definition);
      }
    }

    // Get chapter summaries
    for (const chapter of source.chapters) {
      if (chapter.summary) {
        explanations.push(chapter.summary);
      }
    }

    return explanations;
  }

  /**
   * Assess quality of source
   */
  private assessQuality(source: ReferenceSource): number {
    let score = 0.5;

    // Academic sources are higher quality
    if (source.metadata.sourceType === "research_paper") score += 0.3;
    else if (source.metadata.sourceType === "textbook") score += 0.2;
    else if (source.metadata.sourceType === "teacher_guide") score += 0.1;

    // Has author information
    if (source.metadata.authors.length > 0) score += 0.1;

    // Has publication info
    if (source.metadata.publisher || source.metadata.publicationDate) score += 0.1;

    // Has DOI/ISBN
    if (source.metadata.doi || source.metadata.isbn) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Generate comparison summary
   */
  private generateSummary(data: SourceComparisonData[]): ComparisonSummary {
    // Calculate overall agreement
    let totalAgreement = 0;
    let agreementCount = 0;

    // Check terminology overlap
    const allTerms = data.flatMap(d => d.terminologies.map(t => t.sourceTerminology.toLowerCase()));
    const uniqueTerms = [...new Set(allTerms)];
    const overlapRatio = data.length > 1
      ? uniqueTerms.length / (data.length * uniqueTerms.length / data.length)
      : 1;

    totalAgreement += overlapRatio;
    agreementCount++;

    // Check definition agreement (simplified)
    const definitionAgreement = 0.8; // Would be calculated from actual comparison
    totalAgreement += definitionAgreement;
    agreementCount++;

    const overallAgreement = totalAgreement / agreementCount;

    return {
      overallAgreement,
      terminologyDifferences: this.findTerminologyDifferences(data),
      methodologyDifferences: this.findMethodologyDifferences(data),
      gaps: this.findGaps(data),
      strengths: this.findStrengths(data)
    };
  }

  /**
   * Identify conflicts between sources
   */
  private identifyConflicts(data: SourceComparisonData[]): ConceptConflict[] {
    const conflicts: ConceptConflict[] = [];

    // Check for conflicting definitions
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const sourceA = data[i];
        const sourceB = data[j];

        // Compare definitions for same concept
        for (const defA of sourceA.definitions) {
          const defB = sourceB.definitions.find(d => d.conceptId === defA.conceptId);
          if (defB) {
            const similarity = this.calculateSimilarity(
              defA.definitions[0].definition,
              defB.definitions[0].definition
            );

            if (similarity < 0.5) {
              conflicts.push({
                conceptId: defA.conceptId,
                conflictType: this.detectConflictType(defA, defB),
                sources: [
                  {
                    sourceId: sourceA.sourceId,
                    position: defA.definitions[0].definition,
                    evidence: "Definition provided",
                    strength: sourceA.confidence
                  },
                  {
                    sourceId: sourceB.sourceId,
                    position: defB.definitions[0].definition,
                    evidence: "Definition provided",
                    strength: sourceB.confidence
                  }
                ]
              });
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Identify consensus points
   */
  private identifyConsensus(data: SourceComparisonData[]): ConsensusPoint[] {
    const consensus: ConsensusPoint[] = [];

    // Find concepts that all sources agree on
    const conceptSources = new Map<string, string[]>();

    for (const source of data) {
      for (const term of source.terminologies) {
        const existing = conceptSources.get(term.conceptId) || [];
        existing.push(source.sourceId);
        conceptSources.set(term.conceptId, existing);
      }
    }

    for (const [conceptId, sourceIds] of conceptSources) {
      if (sourceIds.length === data.length) {
        // All sources mention this concept
        const definition = data[0].definitions.find(d => d.conceptId === conceptId);
        if (definition) {
          consensus.push({
            conceptId,
            statement: definition.definitions[0].definition,
            supportingSources: sourceIds,
            confidence: sourceIds.length / data.length
          });
        }
      }
    }

    return consensus;
  }

  /**
   * Calculate text similarity (simplified)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Detect type of conflict
   */
  private detectConflictType(
    defA: DefinitionComparison,
    defB: DefinitionComparison
  ): ConceptConflict["conflictType"] {
    // Simplified detection based on content
    if (/different|numbers|differ|value/.test(defA.definitions[0].definition + defB.definitions[0].definition)) {
      return "numerical";
    }
    if (/interpret|meaning|understand|view/.test(defA.definitions[0].definition + defB.definitions[0].definition)) {
      return "interpretive";
    }
    return "definitional";
  }

  private findTerminologyDifferences(data: SourceComparisonData[]): string[] {
    const differences: string[] = [];

    // Find concepts with different terms
    const conceptTerms = new Map<string, string[]>();
    for (const source of data) {
      for (const term of source.terminologies) {
        const existing = conceptTerms.get(term.conceptId) || [];
        existing.push(term.sourceTerminology);
        conceptTerms.set(term.conceptId, existing);
      }
    }

    for (const [conceptId, terms] of conceptTerms) {
      const uniqueTerms = [...new Set(terms)];
      if (uniqueTerms.length > 1) {
        differences.push(`Concept ${conceptId}: ${uniqueTerms.join(" vs ")}`);
      }
    }

    return differences;
  }

  private findMethodologyDifferences(data: SourceComparisonData[]): string[] {
    // Simplified - would analyze actual methodology
    return [];
  }

  private findGaps(data: SourceComparisonData[]): string[] {
    const gaps: string[] = [];

    // Find topics covered by some but not all
    const allTopics = new Set<string>();
    const sourceTopics = new Map<string, Set<string>>();

    for (const source of data) {
      sourceTopics.set(source.sourceId, new Set(source.terminologies.map(t => t.conceptId)));
      source.terminologies.forEach(t => allTopics.add(t.conceptId));
    }

    for (const topic of allTopics) {
      const coveringSources = [...sourceTopics.entries()].filter(([_, topics]) => topics.has(topic));
      if (coveringSources.length < data.length) {
        gaps.push(`Topic ${topic} covered by ${coveringSources.length}/${data.length} sources`);
      }
    }

    return gaps;
  }

  private findStrengths(data: SourceComparisonData[]): string[] {
    const strengths: string[] = [];

    // Find sources that are particularly strong in areas
    for (const source of data) {
      if (source.quality >= 0.8) {
        strengths.push(`${source.sourceName} is a high-quality source`);
      }
      if (source.examples.length > 3) {
        strengths.push(`${source.sourceName} provides multiple examples`);
      }
    }

    return strengths;
  }

  private assessCompleteness(definition: string): number {
    // Simple heuristic based on length and structure
    const words = definition.split(/\s+/).length;
    if (words < 20) return 0.5;
    if (words < 50) return 0.7;
    return 0.9;
  }

  private assessClarity(definition: string): number {
    // Simple heuristic
    if (definition.includes("(") && definition.includes(")")) return 0.8;
    if (definition.includes(":")) return 0.7;
    return 0.6;
  }

  private inferTopicId(source: ReferenceSource): string {
    return source.topics[0]?.id || source.chapters[0]?.id || source.id;
  }
}
