// @ts-nocheck
// Reference Book Engine — ConceptMerger
// Feature 4: Unified Explanation - Merge concepts from multiple sources
import type { ReferenceSource } from "../models/ReferenceBook";
import type { SourceComparison, UnifiedConcept, ContributingSource, UnifiedExample, TeachingNote } from "../models/SourceComparison";

export interface MergeConfig {
  preferPrimarySource: boolean;
  includeAlternatives: boolean;
  consensusThreshold: number;
  maxExamples: number;
}

const DEFAULT_CONFIG: MergeConfig = {
  preferPrimarySource: true,
  includeAlternatives: true,
  consensusThreshold: 0.7,
  maxExamples: 5
};

/**
 * Merges concepts from multiple sources into unified representations
 */
export class ConceptMerger {
  private config: MergeConfig;

  constructor(config?: Partial<MergeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Merge concepts from multiple sources for a topic
   */
  async mergeConcepts(
    sources: ReferenceSource[],
    topicId: string,
    comparison?: SourceComparison
  ): Promise<MergedConceptData> {
    // Collect all concepts related to the topic
    const allConcepts = this.collectConcepts(sources, topicId);

    // Collect all definitions
    const allDefinitions = this.collectDefinitions(sources, topicId);

    // Collect all examples
    const allExamples = this.collectExamples(sources, topicId);

    // Collect all formulas
    const allFormulas = this.collectFormulas(sources, topicId);

    // Find consensus
    const consensus = this.findConsensus(allDefinitions, comparison);

    // Build merged concept
    return {
      topicId,
      primaryDefinition: consensus.primary || allDefinitions[0]?.definition || "",
      alternativeDefinitions: consensus.alternatives,
      bestExamples: this.selectBestExamples(allExamples),
      formulas: allFormulas,
      consensusLevel: consensus.level,
      contributingSources: this.buildContributingSources(sources, allConcepts),
      conflicts: comparison?.conflicts || []
    };
  }

  /**
   * Collect concepts from all sources
   */
  private collectConcepts(sources: ReferenceSource[], topicId: string): Map<string, SourceConceptData[]> {
    const concepts = new Map<string, SourceConceptData[]>();

    for (const source of sources) {
      for (const concept of source.concepts) {
        if (concept.relatedTopics.includes(topicId)) {
          const existing = concepts.get(concept.name) || [];
          existing.push({
            sourceId: source.id,
            concept
          });
          concepts.set(concept.name, existing);
        }
      }
    }

    return concepts;
  }

  private collectDefinitions(sources: ReferenceSource[], topicId: string): DefinitionData[] {
    const definitions: DefinitionData[] = [];

    for (const source of sources) {
      for (const def of source.definitions) {
        definitions.push({
          sourceId: source.id,
          sourceName: source.metadata.title,
          sourceType: source.metadata.sourceType,
          quality: this.assessDefinitionQuality(source, def),
          definition: def.definition
        });
      }
    }

    return definitions;
  }

  private collectExamples(sources: ReferenceSource[], topicId: string): ExampleData[] {
    const examples: ExampleData[] = [];

    for (const source of sources) {
      for (const concept of source.concepts) {
        if (concept.relatedTopics.includes(topicId)) {
          for (const example of concept.examples) {
            examples.push({
              sourceId: source.id,
              sourceName: source.metadata.title,
              example,
              type: this.categorizeExample(example),
              quality: 3 // Would be assessed
            });
          }
        }
      }
    }

    return examples;
  }

  private collectFormulas(sources: ReferenceSource[], topicId: string): FormulaData[] {
    const formulas: FormulaData[] = [];

    for (const source of sources) {
      for (const formula of source.formulas) {
        if (!formula.topicId || formula.topicId === topicId) {
          formulas.push({
            sourceId: source.id,
            sourceName: source.metadata.title,
            formula: formula.formula,
            context: formula.context
          });
        }
      }
    }

    return formulas;
  }

  private assessDefinitionQuality(source: ReferenceSource, def: any): number {
    let score = source.confidenceScore;

    // Boost for research papers
    if (source.metadata.sourceType === "research_paper") score += 0.1;

    // Boost for primary sources
    if (source.metadata.quality === "primary") score += 0.1;

    return Math.min(1, score);
  }

  /**
   * Find consensus among definitions
   */
  private findConsensus(
    definitions: DefinitionData[],
    comparison?: SourceComparison
  ): { primary: string; alternatives: AlternativeDefinition[]; level: number } {
    if (definitions.length === 0) {
      return { primary: "", alternatives: [], level: 0 };
    }

    // If comparison exists, use it
    if (comparison) {
      const consensus = comparison.consensus.find(c => c.confidence >= this.config.consensusThreshold);
      if (consensus) {
        return {
          primary: consensus.statement,
          alternatives: definitions
            .filter(d => d.definition !== consensus.statement)
            .map(d => ({
              definition: d.definition,
              sourceId: d.sourceId,
              context: `Alternative from ${d.sourceName}`
            })),
          level: consensus.confidence
        };
      }
    }

    // Simple consensus: find most common definition approach
    const primary = definitions.reduce((best, current) =>
      current.quality > best.quality ? current : best
    );

    return {
      primary: primary.definition,
      alternatives: definitions
        .filter(d => d.definition !== primary.definition)
        .map(d => ({
          definition: d.definition,
          sourceId: d.sourceId,
          context: `Alternative from ${d.sourceName}`
        })),
      level: primary.quality
    };
  }

  /**
   * Select best examples
   */
  private selectBestExamples(examples: ExampleData[]): SelectedExample[] {
    // Sort by quality
    const sorted = [...examples].sort((a, b) => b.quality - a.quality);

    // Take top examples, preferring diversity
    const selected: SelectedExample[] = [];
    const seenTypes = new Set<string>();

    for (const example of sorted) {
      if (selected.length >= this.config.maxExamples) break;

      if (!seenTypes.has(example.type)) {
        seenTypes.add(example.type);
        selected.push({
          example: example.example,
          sourceIds: [example.sourceId],
          explanation: `Example from ${example.sourceName}`,
          type: example.type as any,
          difficulty: "intermediate",
          quality: example.quality
        });
      } else if (selected.length < this.config.maxExamples - 1) {
        // Add secondary examples for popular types
        selected.push({
          example: example.example,
          sourceIds: [example.sourceId],
          explanation: `Additional example from ${example.sourceName}`,
          type: example.type as any,
          difficulty: "intermediate",
          quality: example.quality
        });
      }
    }

    return selected;
  }

  private categorizeExample(example: string): string {
    const lower = example.toLowerCase();

    if (/like|imagine|pretend|suppose/.test(lower)) return "analogy";
    if (/calculate|compute|solve|find/.test(lower)) return "problem";
    if (/step|process|first|then|finally/.test(lower)) return "step_by_step";
    if (/graph|chart|draw|show/.test(lower)) return "visual";
    if (/real|actually|in practice|everyday/.test(lower)) return "real_world";

    return "general";
  }

  /**
   * Build contributing sources list
   */
  private buildContributingSources(
    sources: ReferenceSource[],
    concepts: Map<string, SourceConceptData[]>
  ): ContributingSource[] {
    const contributions = new Map<string, { source: ReferenceSource; insights: string[] }>();

    for (const [conceptName, conceptData] of concepts) {
      for (const { sourceId, concept } of conceptData) {
        if (!contributions.has(sourceId)) {
          const source = sources.find(s => s.id === sourceId);
          if (source) {
            contributions.set(sourceId, { source, insights: [] });
          }
        }
        const contribution = contributions.get(sourceId);
        if (contribution) {
          contribution.insights.push(`Explains ${conceptName}`);
        }
      }
    }

    return Array.from(contributions.values()).map(({ source, insights }) => ({
      sourceId: source.id,
      contribution: insights.join("; "),
      weight: source.confidenceScore,
      keyInsights: insights
    }));
  }

  /**
   * Generate unified concept from merged data
   */
  generateUnifiedConcept(
    merged: MergedConceptData,
    sources: ReferenceSource[]
  ): UnifiedConcept {
    // Determine primary source
    const primarySource = merged.contributingSources.reduce((best, current) =>
      current.weight > best.weight ? current : best
    );

    return {
      id: `unified_${merged.topicId}_${Date.now()}`,
      name: merged.topicId,
      topicId: merged.topicId,
      primaryDefinition: merged.primaryDefinition,
      alternativeDefinitions: merged.alternativeDefinitions,
      unifiedExplanation: this.generateUnifiedExplanation(merged),
      keyTakeaways: this.generateKeyTakeaways(merged),
      commonMisconceptions: this.generateMisconceptions(merged),
      contributingSources: merged.contributingSources,
      primarySourceId: primarySource.sourceId,
      bestExamples: merged.bestExamples.map(e => ({
        example: e.example,
        sourceIds: e.sourceIds,
        explanation: e.explanation,
        type: e.type,
        difficulty: e.difficulty,
        quality: e.quality
      })),
      relevantFormulas: merged.formulas.map(f => ({
        formula: f.formula,
        sources: [{ sourceId: f.sourceId, context: f.context, usage: "" }],
        explanation: "",
        whenToUse: "",
        commonMistakes: []
      })),
      diagrams: [],
      tables: [],
      confidenceScore: merged.consensusLevel,
      agreementLevel: merged.consensusLevel >= 0.8 ? "full" :
        merged.consensusLevel >= 0.5 ? "partial" : "mixed",
      relatedConcepts: this.extractRelatedConcepts(merged),
      prerequisites: this.extractPrerequisites(merged),
      leadsTo: this.extractLeadsTo(merged),
      teachingNotes: this.generateTeachingNotes(merged),
      accessibilityFormats: [],
      citations: this.generateCitations(merged, sources),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private generateUnifiedExplanation(merged: MergedConceptData): string {
    const parts: string[] = [];

    parts.push(merged.primaryDefinition);

    if (merged.alternativeDefinitions.length > 0 && this.config.includeAlternatives) {
      parts.push("\n\nAlternate viewpoints:");
      for (const alt of merged.alternativeDefinitions.slice(0, 2)) {
        parts.push(`- ${alt.definition}`);
      }
    }

    if (merged.conflicts.length > 0) {
      parts.push("\n\nNote on disagreements:");
      for (const conflict of merged.conflicts.slice(0, 1)) {
        parts.push(`Some sources interpret this differently. See conflict resolution for details.`);
      }
    }

    return parts.join("");
  }

  private generateKeyTakeaways(merged: MergedConceptData): string[] {
    const takeaways: string[] = [];

    // Extract from primary definition
    if (merged.primaryDefinition) {
      takeaways.push(merged.primaryDefinition.split(".")[0] + ".");
    }

    // From examples
    for (const example of merged.bestExamples.slice(0, 2)) {
      takeaways.push(`Understanding this concept helps with: ${example.example.split(".")[0]}`);
    }

    // From formulas
    for (const formula of merged.formulas.slice(0, 1)) {
      takeaways.push(`Key relationship: ${formula.formula}`);
    }

    return [...new Set(takeaways)].slice(0, 5);
  }

  private generateMisconceptions(merged: MergedConceptData): string[] {
    const misconceptions: string[] = [];

    // Check conflicts for potential misconceptions
    for (const conflict of merged.conflicts) {
      misconceptions.push(`Common misconception: ${conflict.sources[0]?.position?.split(".")[0] || "conflicting interpretations"}`);
    }

    return misconceptions.slice(0, 3);
  }

  private extractRelatedConcepts(merged: MergedConceptData): string[] {
    // Would analyze connections from concepts
    return [];
  }

  private extractPrerequisites(merged: MergedConceptData): string[] {
    // Would analyze what concepts are needed first
    return [];
  }

  private extractLeadsTo(merged: MergedConceptData): string[] {
    // Would analyze what concepts build on this
    return [];
  }

  private generateTeachingNotes(merged: MergedConceptData): TeachingNote[] {
    return [
      {
        ageBand: "14-16",
        learningStyle: "mixed",
        explanation: merged.primaryDefinition,
        tips: ["Start with the definition", "Practice with examples"],
        commonQuestions: ["What does this mean?", "When do we use it?"],
        misconceptions: merged.commonMisconceptions || []
      }
    ];
  }

  private generateCitations(merged: MergedConceptData, sources: ReferenceSource[]): any[] {
    return merged.contributingSources.map(cs => {
      const source = sources.find(s => s.id === cs.sourceId);
      return {
        sourceId: cs.sourceId,
        sourceName: source?.metadata.title || "Unknown",
        citationText: this.formatCitation(source),
        directQuote: undefined,
        paraphrased: true
      };
    });
  }

  private formatCitation(source: ReferenceSource | undefined): string {
    if (!source) return "Unknown source";

    const authors = source.metadata.authors.join(", ");
    const year = source.metadata.publicationDate?.slice(0, 4) || "n.d.";
    const title = source.metadata.title;

    return `${authors} (${year}). ${title}`;
  }
}

// Supporting types
interface SourceConceptData {
  sourceId: string;
  concept: any;
}

interface DefinitionData {
  sourceId: string;
  sourceName: string;
  sourceType: string;
  quality: number;
  definition: string;
}

interface ExampleData {
  sourceId: string;
  sourceName: string;
  example: string;
  type: string;
  quality: number;
}

interface FormulaData {
  sourceId: string;
  sourceName: string;
  formula: string;
  context: string;
}

interface SelectedExample {
  example: string;
  sourceIds: string[];
  explanation: string;
  type: string;
  difficulty: string;
  quality: number;
}

interface AlternativeDefinition {
  definition: string;
  sourceId: string;
  context: string;
}

export interface MergedConceptData {
  topicId: string;
  primaryDefinition: string;
  alternativeDefinitions: AlternativeDefinition[];
  bestExamples: SelectedExample[];
  formulas: FormulaData[];
  consensusLevel: number;
  contributingSources: ContributingSource[];
  conflicts: any[];
  commonMisconceptions?: string[];
}
