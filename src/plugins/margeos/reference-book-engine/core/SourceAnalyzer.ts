// @ts-nocheck
// Reference Book Engine — SourceAnalyzer
// Feature 2: Source Analysis - Extract content from documents
import type { ReferenceSource, SourceMetadata, SourceChapter, SourceTopic, SourceConcept, SourceDefinition } from "../models/ReferenceBook";
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import { enrichFormula, type EnrichedFormula } from "@/plugins/margeos/formula-engine";

export interface SourceAnalysisResult {
  chapters: SourceChapter[];
  topics: SourceTopic[];
  concepts: SourceConcept[];
  definitions: SourceDefinition[];
  formulas: EnrichedFormula[];
  keyCitations: string[];
  summary: string;
  qualityScore: number;
  completenessScore: number;
}

export interface DocumentAnalysis {
  textContent: string;
  pageCount: number;
  images: { page: number; description: string }[];
  tables: { page: number; headers: string[]; rows: string[][] }[];
  formulas: Formula[];
}

/**
 * Analyzes uploaded source documents and extracts structured content
 * Reuses Smart PDF Engine and Formula Engine for deep analysis
 */
export class SourceAnalyzer {
  private formulaEngineEnabled: boolean = true;

  constructor() {
    // Import formula engine
    this.initFormulaEngine();
  }

  private async initFormulaEngine(): Promise<void> {
    try {
      // Formula engine is loaded dynamically to avoid circular dependencies
    } catch (e) {
      console.warn("Formula Engine not available, formulas will be stored raw");
      this.formulaEngineEnabled = false;
    }
  }

  /**
   * Analyze a reference source document
   */
  async analyzeSource(source: ReferenceSource): Promise<SourceAnalysisResult> {
    // In production, this would analyze the actual document content
    // For now, we prepare the structure that would be filled by actual analysis

    const result: SourceAnalysisResult = {
      chapters: this.extractChapters(source),
      topics: this.extractTopics(source),
      concepts: this.extractConcepts(source),
      definitions: this.extractDefinitions(source),
      formulas: await this.extractFormulas(source),
      keyCitations: this.extractCitations(source),
      summary: await this.generateSummary(source),
      qualityScore: this.assessQuality(source),
      completenessScore: this.assessCompleteness(source)
    };

    return result;
  }

  /**
   * Extract chapters from source
   */
  private extractChapters(source: ReferenceSource): SourceChapter[] {
    // In production: Parse document TOC or detect chapter headings
    return source.chapters.map((ch, index) => ({
      id: ch.id || `chapter_${index + 1}`,
      number: ch.number || index + 1,
      title: ch.title || `Chapter ${index + 1}`,
      startPage: ch.startPage || 1,
      endPage: ch.endPage || ch.startPage || 1,
      summary: ch.summary,
      topics: ch.topics || [],
      keyConcepts: ch.keyConcepts || [],
      subsections: ch.subsections
    }));
  }

  /**
   * Extract topics from source
   */
  private extractTopics(source: ReferenceSource): SourceTopic[] {
    // Merge chapters' topics into flat list
    const topics: SourceTopic[] = [];

    for (const chapter of source.chapters) {
      for (const topicName of chapter.topics || []) {
        topics.push({
          id: this.generateTopicId(topicName),
          name: topicName,
          chapterId: chapter.id,
          relatedConcepts: [],
          explanations: [],
          difficulty: source.metadata.difficulty || "intermediate",
          confidenceScore: 0.8
        });
      }
    }

    // Add topics from source directly
    topics.push(...source.topics);

    return topics;
  }

  /**
   * Extract key concepts from source
   */
  private extractConcepts(source: ReferenceSource): SourceConcept[] {
    const concepts: SourceConcept[] = [];

    // Extract from chapters
    for (const chapter of source.chapters) {
      for (const conceptName of chapter.keyConcepts || []) {
        concepts.push({
          id: this.generateConceptId(conceptName),
          name: conceptName,
          definition: "", // Would be filled from content
          source: source.id,
          pageNumber: chapter.startPage,
          context: `Chapter ${chapter.number}: ${chapter.title}`,
          relatedTopics: [this.generateTopicId(chapter.title)],
          examples: [],
          connections: []
        });
      }
    }

    // Add concepts from source directly
    concepts.push(...source.concepts);

    return concepts;
  }

  /**
   * Extract definitions from source
   */
  private extractDefinitions(source: ReferenceSource): SourceDefinition[] {
    const definitions: SourceDefinition[] = [];

    for (const def of source.definitions) {
      definitions.push({
        id: def.id,
        term: def.term,
        definition: def.definition,
        source: source.id,
        pageNumber: def.pageNumber,
        examples: def.examples,
        relatedTerms: def.relatedTerms,
        field: source.metadata.subject
      });
    }

    return definitions;
  }

  /**
   * Extract and enrich formulas using Formula Engine
   */
  private async extractFormulas(source: ReferenceSource): Promise<EnrichedFormula[]> {
    const enrichedFormulas: EnrichedFormula[] = [];

    for (const formula of source.formulas) {
      try {
        if (this.formulaEngineEnabled) {
          // Use Formula Engine to enrich the formula
          const enriched = enrichFormula(formula, {
            ageBand: "14-16",
            learningStyle: "mixed",
            explanationMode: "detailed"
          });
          enrichedFormulas.push(enriched.enrichedFormula);
        } else {
          // Store raw formula
          enrichedFormulas.push({
            ...formula,
            explanationModes: {},
            solvingSteps: [],
            workedExamples: [],
            practiceQuestions: [],
            commonMistakes: [],
            visualRepresentations: [],
            memoryTips: [],
            relatedFormulas: [],
            analytics: {
              estimatedSolveTime: 5,
              prerequisiteTopics: [],
              estimatedMasteryAttempts: 5,
              confidenceScore: 0.7
            }
          } as EnrichedFormula);
        }
      } catch (e) {
        console.warn(`Failed to enrich formula ${formula.formula}:`, e);
        enrichedFormulas.push({
          ...formula,
          explanationModes: {},
          solvingSteps: [],
          workedExamples: [],
          practiceQuestions: [],
          commonMistakes: [],
          visualRepresentations: [],
          memoryTips: [],
          relatedFormulas: [],
          analytics: {
            estimatedSolveTime: 5,
            prerequisiteTopics: [],
            estimatedMasteryAttempts: 5,
            confidenceScore: 0.5
          }
        } as EnrichedFormula);
      }
    }

    return enrichedFormulas;
  }

  /**
   * Extract citations from source
   */
  private extractCitations(source: ReferenceSource): string[] {
    return source.keyCitations.map(c => c.citationText);
  }

  /**
   * Generate summary of source content
   */
  private async generateSummary(source: ReferenceSource): Promise<string> {
    const chapterCount = source.chapters.length;
    const topicCount = source.topics.length;
    const conceptCount = source.concepts.length;
    const formulaCount = source.formulas.length;

    return `${source.metadata.title} by ${source.metadata.authors.join(", ")}. ` +
      `A ${source.metadata.sourceType} covering ${chapterCount} chapters, ` +
      `${topicCount} topics, ${conceptCount} concepts, and ${formulaCount} formulas. ` +
      `Subject: ${source.metadata.subject}. ` +
      `Language: ${source.metadata.language}.`;
  }

  /**
   * Assess quality of source
   */
  private assessQuality(source: ReferenceSource): number {
    let score = 0.5; // Base score

    // Author credibility
    if (source.metadata.authors.length > 0) {
      score += 0.1;
    }

    // Publication info
    if (source.metadata.publisher || source.metadata.publicationDate) {
      score += 0.1;
    }

    // DOI/ISBN (academic validation)
    if (source.metadata.doi || source.metadata.isbn) {
      score += 0.15;
    }

    // Source type quality weight
    const typeQuality: Record<string, number> = {
      research_paper: 0.15,
      textbook: 0.1,
      teacher_guide: 0.05,
      study_note: 0,
      lecture_slide: -0.05,
      personal_document: -0.1
    };
    score += typeQuality[source.metadata.sourceType] || 0;

    // Completeness
    if (source.chapters.length > 0) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Assess completeness of source
   */
  private assessCompleteness(source: ReferenceSource): number {
    let score = 0;

    // Check various content types
    if (source.chapters.length > 0) score += 0.25;
    if (source.topics.length > 0) score += 0.2;
    if (source.concepts.length > 0) score += 0.2;
    if (source.definitions.length > 0) score += 0.15;
    if (source.formulas.length > 0) score += 0.1;
    if (source.keyCitations.length > 0) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Analyze raw document content
   */
  async analyzeDocument(
    documentId: string,
    pages: { pageNumber: number; text: string; images?: string[]; tables?: any[] }[]
  ): Promise<DocumentAnalysis> {
    const allText = pages.map(p => p.text).join("\n\n");

    return {
      textContent: allText,
      pageCount: pages.length,
      images: pages.flatMap(p =>
        (p.images || []).map(img => ({ page: p.pageNumber, description: img }))
      ),
      tables: pages.flatMap(p =>
        (p.tables || []).map(t => ({ page: p.pageNumber, headers: t.headers, rows: t.rows }))
      ),
      formulas: this.extractRawFormulas(allText)
    };
  }

  /**
   * Extract raw formulas from text
   */
  private extractRawFormulas(text: string): Formula[] {
    const formulas: Formula[] = [];

    // Common formula patterns
    const patterns = [
      /([A-Z]\s*=\s*[A-Za-z0-9+\-*/^()√²³]+)/g,  // F = ma, E = mc^2
      /(∫[A-Za-z0-9+\-*/^()√²³\s]+d[A-Za-z])/g,  // Integrals
      /(Σ[A-Za-z0-9+\-*/^()]+)/g,                  // Summations
      /(∂[A-Za-z]/g,                               // Partial derivatives
      /(log|ln|sin|cos|tan)[A-Za-z0-9+\-*/^()]+/g // Trig/log functions
    ];

    let foundFormulas: string[] = [];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        foundFormulas.push(...matches);
      }
    }

    // Deduplicate
    foundFormulas = [...new Set(foundFormulas)];

    // Create Formula objects
    for (let i = 0; i < foundFormulas.length; i++) {
      const formulaStr = foundFormulas[i];
      formulas.push({
        id: `formula_${documentId}_${i}`,
        formula: formulaStr,
        variables: this.extractVariables(formulaStr),
        subject: this.identifyFormulaSubject(formulaStr),
        difficulty: "intermediate",
        pageNumber: 1,
        context: `Formula found in document`,
        explanation: {
          formula: formulaStr,
          explanation: "",
          variables: [],
          examples: [],
          commonMistakes: [],
          realWorldExamples: []
        }
      });
    }

    return formulas;
  }

  /**
   * Extract variables from formula
   */
  private extractVariables(formula: string): string[] {
    const variables: string[] = [];
    const matches = formula.match(/[a-zA-Z][₀₁₂₃₄₅₆₇₈₉₀]*/g) || [];

    for (const match of matches) {
      if (!["sin", "cos", "tan", "log", "ln", "exp", "max", "min", "det"].includes(match.toLowerCase())) {
        if (!variables.includes(match)) {
          variables.push(match);
        }
      }
    }

    return variables;
  }

  /**
   * Identify the subject of a formula
   */
  private identifyFormulaSubject(formula: string): "math" | "physics" | "chemistry" | "statistics" | "unknown" {
    const lower = formula.toLowerCase();

    if (/[Ff]\s*=\s*[mM][aA]/.test(formula)) return "physics";
    if (/[Ee]\s*=\s*[mM][cC]/.test(formula)) return "physics";
    if (/[Pp]\s*[Hh]\s*=/.test(formula)) return "chemistry";
    if (/μ|σ|mean|variance/.test(lower)) return "statistics";
    if (/∫|∑|∂|lim/.test(formula)) return "math";

    return "unknown";
  }

  private generateTopicId(name: string): string {
    return `topic_${name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;
  }

  private generateConceptId(name: string): string {
    return `concept_${name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;
  }
}
