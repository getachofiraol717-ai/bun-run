// Reference Book Engine — UnifiedExplanationEngine
// Feature 4: Generate unified explanations from multiple sources
import type { ReferenceSource } from "../models/ReferenceBook";
import type { SourceComparison, UnifiedConcept, AcademicSummary, SummarySection } from "../models/SourceComparison";
import { MergedConceptData, ConceptMerger } from "./ConceptMerger";

export interface ExplanationConfig {
  preferredLength: "short" | "medium" | "long";
  includeExamples: boolean;
  includeCitations: boolean;
  includeAlternatives: boolean;
  targetAgeBand?: "8-10" | "11-13" | "14-16" | "17-19" | "university" | "professional";
}

const DEFAULT_CONFIG: ExplanationConfig = {
  preferredLength: "medium",
  includeExamples: true,
  includeCitations: true,
  includeAlternatives: true
};

/**
 * Generates unified explanations that combine strengths of multiple sources
 */
export class UnifiedExplanationEngine {
  private merger: ConceptMerger;

  constructor() {
    this.merger = new ConceptMerger();
  }

  /**
   * Generate unified concept from merged data
   */
  async generate(
    merged: MergedConceptData,
    sources: ReferenceSource[],
    comparison?: SourceComparison
  ): Promise<UnifiedConcept> {
    return this.merger.generateUnifiedConcept(merged, sources);
  }

  /**
   * Generate explanation with specific configuration
   */
  generateWithConfig(
    concept: UnifiedConcept,
    config: ExplanationConfig
  ): string {
    const parts: string[] = [];

    // Introduction
    parts.push(this.generateIntroduction(concept, config));

    // Main explanation
    if (config.preferredLength !== "short") {
      parts.push(this.generateDetailedExplanation(concept, config));
    }

    // Examples
    if (config.includeExamples && concept.bestExamples.length > 0) {
      parts.push(this.generateExamplesSection(concept, config));
    }

    // Alternative viewpoints
    if (config.includeAlternatives && concept.alternativeDefinitions.length > 0) {
      parts.push(this.generateAlternativesSection(concept));
    }

    // Key takeaways
    if (config.preferredLength === "long") {
      parts.push(this.generateTakeawaysSection(concept));
    }

    return parts.join("\n\n");
  }

  private generateIntroduction(concept: UnifiedConcept, config: ExplanationConfig): string {
    let intro = concept.primaryDefinition;

    if (config.targetAgeBand) {
      intro = this.adjustForAgeBand(intro, config.targetAgeBand);
    }

    return intro;
  }

  private generateDetailedExplanation(concept: UnifiedConcept, config: ExplanationConfig): string {
    const parts: string[] = [];

    // Explanation of the concept
    parts.push(concept.unifiedExplanation);

    // Related formulas
    if (concept.relevantFormulas.length > 0) {
      parts.push("\n**Key Formulas:**");
      for (const formula of concept.relevantFormulas.slice(0, 3)) {
        parts.push(`- ${formula.formula}`);
      }
    }

    // Common misconceptions
    if (concept.commonMisconceptions.length > 0) {
      parts.push("\n**Common Misconceptions:**");
      for (const misconception of concept.commonMisconceptions) {
        parts.push(`- ${misconception}`);
      }
    }

    return parts.join("\n");
  }

  private generateExamplesSection(concept: UnifiedConcept, config: ExplanationConfig): string {
    const parts: string[] = [];
    const maxExamples = config.preferredLength === "short" ? 1 :
      config.preferredLength === "medium" ? 3 : 5;

    parts.push("\n**Examples:**");
    for (const example of concept.bestExamples.slice(0, maxExamples)) {
      parts.push(`- ${example.example}`);
    }

    return parts.join("\n");
  }

  private generateAlternativesSection(concept: UnifiedConcept): string {
    const parts: string[] = [];

    parts.push("\n**Alternative Perspectives:**");
    for (const alt of concept.alternativeDefinitions.slice(0, 2)) {
      parts.push(`- ${alt.definition}`);
      parts.push(`  (Source: ${alt.sourceId})`);
    }

    return parts.join("\n");
  }

  private generateTakeawaysSection(concept: UnifiedConcept): string {
    const parts: string[] = [];

    parts.push("\n**Key Takeaways:**");
    for (const takeaway of concept.keyTakeaways) {
      parts.push(`- ${takeaway}`);
    }

    return parts.join("\n");
  }

  private adjustForAgeBand(text: string, ageBand: string): string {
    // Simplify text for younger audiences
    if (ageBand === "8-10") {
      return text.replace(/complex/gi, "interesting")
        .replace(/methodology/gi, "way")
        .replace(/paradigm/gi, "idea");
    }
    if (ageBand === "11-13") {
      return text.replace(/substantially/gi, "a lot")
        .replace(/methodology/gi, "method");
    }
    return text;
  }

  /**
   * Generate academic summary from sources
   */
  async generateSummary(
    sources: ReferenceSource[],
    type: "chapter" | "topic" | "book" | "research" | "multi_source"
  ): Promise<AcademicSummary> {
    const source = sources[0];

    const sections = await this.generateSections(sources, type);

    return {
      id: `summary_${type}_${Date.now()}`,
      type,
      title: this.generateSummaryTitle(sources, type),
      executiveSummary: this.generateExecutiveSummary(sources),
      keyPoints: this.generateKeyPoints(sources),
      mainTakeaways: this.generateMainTakeaways(sources),
      detailedContent: sections.map(s => `${s.title}\n\n${s.content}`).join("\n\n---\n\n"),
      sourceIds: sources.map(s => s.id),
      primarySourceId: sources[0]?.id,
      sections,
      completenessScore: this.calculateCompleteness(sources),
      qualityScore: this.calculateQuality(sources),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
  }

  private async generateSections(
    sources: ReferenceSource[],
    type: string
  ): Promise<SummarySection[]> {
    const sections: SummarySection[] = [];

    // Introduction section
    sections.push({
      title: "Introduction",
      content: this.generateIntroSection(sources),
      keyPoints: ["Overview of the topic", "Why it matters"],
      sources: sources.map(s => s.id)
    });

    // Main content based on type
    if (type === "book" || type === "chapter") {
      sections.push({
        title: "Main Themes",
        content: this.generateThemesSection(sources),
        keyPoints: this.extractMainThemes(sources),
        sources: sources.map(s => s.id)
      });

      sections.push({
        title: "Key Concepts",
        content: this.generateConceptsSection(sources),
        keyPoints: sources.flatMap(s => s.concepts.slice(0, 5).map(c => c.name)),
        sources: sources.map(s => s.id)
      });
    }

    // Conclusion
    sections.push({
      title: "Summary and Conclusions",
      content: this.generateConclusionsSection(sources),
      keyPoints: this.generateKeyPoints(sources).slice(0, 5),
      sources: sources.map(s => s.id)
    });

    return sections;
  }

  private generateSummaryTitle(sources: ReferenceSource[], type: string): string {
    if (sources.length === 1) {
      return sources[0].metadata.title;
    }

    const subjects = [...new Set(sources.map(s => s.metadata.subject))];
    return `Summary: ${subjects.join(", ")} - ${type}`;
  }

  private generateExecutiveSummary(sources: ReferenceSource[]): string {
    const topics = sources.flatMap(s => s.topics.map(t => t.name));
    const uniqueTopics = [...new Set(topics)].slice(0, 5);

    return `This summary covers ${sources.length} source(s) examining ${uniqueTopics.join(", ")}. ` +
      `The sources provide comprehensive coverage of key concepts with ${sources.length > 1 ? "multiple perspectives" : "detailed analysis"}.`;
  }

  private generateKeyPoints(sources: ReferenceSource[]): string[] {
    const points: string[] = [];

    for (const source of sources) {
      for (const chapter of source.chapters.slice(0, 3)) {
        if (chapter.summary) {
          points.push(chapter.summary.split(".")[0]);
        }
      }
    }

    return [...new Set(points)].slice(0, 10);
  }

  private generateMainTakeaways(sources: ReferenceSource[]): string[] {
    const takeaways: string[] = [];

    // From concepts
    for (const source of sources) {
      for (const concept of source.concepts.slice(0, 3)) {
        takeaways.push(`${concept.name}: ${concept.definition.split(".")[0]}`);
      }
    }

    // From formulas
    for (const source of sources) {
      for (const formula of source.formulas.slice(0, 2)) {
        takeaways.push(`Formula: ${formula.formula}`);
      }
    }

    return takeaways.slice(0, 7);
  }

  private generateIntroSection(sources: ReferenceSource[]): string {
    const authors = sources.flatMap(s => s.metadata.authors);
    const uniqueAuthors = [...new Set(authors)];

    return `This academic summary draws from ${sources.length} source(s) by ${uniqueAuthors.slice(0, 3).join(", ")}${uniqueAuthors.length > 3 ? " et al." : ""}. ` +
      `The sources cover ${sources.flatMap(s => s.topics.map(t => t.name)).slice(0, 5).join(", ")}.`;
  }

  private generateThemesSection(sources: ReferenceSource[]): string {
    const themes: string[] = [];

    for (const source of sources) {
      for (const chapter of source.chapters) {
        themes.push(chapter.title);
      }
    }

    return themes.slice(0, 10).join("\n\n");
  }

  private generateConceptsSection(sources: ReferenceSource[]): string {
    const concepts: string[] = [];

    for (const source of sources) {
      for (const concept of source.concepts.slice(0, 10)) {
        concepts.push(`**${concept.name}**: ${concept.definition.slice(0, 100)}...`);
      }
    }

    return concepts.join("\n\n");
  }

  private generateConclusionsSection(sources: ReferenceSource[]): string {
    return `This summary has covered the key aspects of the topic. ` +
      `Key insights include the fundamental concepts and their applications. ` +
      `For deeper understanding, refer to the original sources listed below.`;
  }

  private extractMainThemes(sources: ReferenceSource[]): string[] {
    return sources.flatMap(s => s.chapters.slice(0, 3).map(c => c.title));
  }

  private calculateCompleteness(sources: ReferenceSource[]): number {
    let total = 0;
    for (const source of sources) {
      total += source.chapters.length > 0 ? 0.3 : 0;
      total += source.topics.length > 0 ? 0.2 : 0;
      total += source.concepts.length > 0 ? 0.2 : 0;
      total += source.formulas.length > 0 ? 0.15 : 0;
      total += source.definitions.length > 0 ? 0.15 : 0;
    }
    return Math.min(1, total / sources.length);
  }

  private calculateQuality(sources: ReferenceSource[]): number {
    const avgConfidence = sources.reduce((sum, s) => sum + s.confidenceScore, 0) / sources.length;
    return avgConfidence;
  }
}
