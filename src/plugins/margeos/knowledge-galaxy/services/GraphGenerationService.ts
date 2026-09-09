// @ts-nocheck
// Knowledge Galaxy — GraphGenerationService
// Service for generating knowledge graphs from various sources

import { nodeGenerator } from "../core/NodeGenerator";
import { relationshipEngine } from "../core/RelationshipEngine";
import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface GraphGenerationResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  subjects: string[];
  statistics: {
    nodesGenerated: number;
    edgesGenerated: number;
    subjects: number;
  };
}

export interface PDFToGraphOptions {
  extractFormulas?: boolean;
  extractDefinitions?: boolean;
  extractExamples?: boolean;
  minConceptLength?: number;
}

export class GraphGenerationService {
  private static instance: GraphGenerationService;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): GraphGenerationService {
    if (!GraphGenerationService.instance) {
      GraphGenerationService.instance = new GraphGenerationService();
    }
    return GraphGenerationService.instance;
  }

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
  }

  // Generate graph from PDF content
  public async generateFromPDF(
    pdfData: {
      title: string;
      content: string;
      chapters?: Array<{
        title: string;
        content: string;
      }>;
    },
    options?: PDFToGraphOptions
  ): Promise<GraphGenerationResult> {
    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];
    const subjects = new Set<string>();

    const opts = {
      extractFormulas: true,
      extractDefinitions: true,
      extractExamples: true,
      minConceptLength: 3,
      ...options
    };

    // Extract subject from title
    const subject = this.extractSubject(pdfData.title);
    subjects.add(subject);

    // Process chapters
    if (pdfData.chapters) {
      for (const chapter of pdfData.chapters) {
        const chapterNodes = await this.processChapter(
          chapter.title,
          chapter.content,
          subject,
          opts
        );
        nodes.push(...chapterNodes);
      }
    } else {
      // Process whole content
      const contentNodes = await this.processText(
        pdfData.content,
        subject,
        opts
      );
      nodes.push(...contentNodes);
    }

    // Generate relationships
    const allNodes = [...nodes];
    for (const node of nodes) {
      const relationships = await relationshipEngine.findRelationships(node, allNodes);
      edges.push(...relationships);
    }

    return {
      nodes,
      edges,
      subjects: Array.from(subjects),
      statistics: {
        nodesGenerated: nodes.length,
        edgesGenerated: edges.length,
        subjects: subjects.size
      }
    };
  }

  // Process chapter
  private async processChapter(
    title: string,
    content: string,
    subject: string,
    options: Required<PDFToGraphOptions>
  ): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];

    // Create chapter node
    const chapterNode = nodeGenerator.generateTopicNode(title, subject, undefined, {
      description: `Chapter: ${title}`,
      importance: 4,
      difficulty: 3
    });
    nodes.push(chapterNode);

    // Extract concepts from content
    const conceptNodes = await this.processText(content, subject, options, chapterNode.id);
    nodes.push(...conceptNodes);

    return nodes;
  }

  // Process text content
  private async processText(
    content: string,
    subject: string,
    options: Required<PDFToGraphOptions>,
    parentId?: string
  ): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];

    // Split into sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

    for (const sentence of sentences) {
      // Extract concepts
      const concepts = this.extractConcepts(sentence, options.minConceptLength);

      for (const concept of concepts) {
        const conceptNode = nodeGenerator.generateConceptNode(
          concept,
          subject,
          {
            description: sentence.trim(),
            parentId,
            tags: [subject]
          }
        );
        nodes.push(conceptNode);
      }

      // Extract formulas if enabled
      if (options.extractFormulas) {
        const formulas = this.extractFormulas(sentence);
        for (const formula of formulas) {
          const formulaNode = nodeGenerator.generateFormulaNode(
            formula.name,
            formula.expression,
            subject,
            { parentId }
          );
          nodes.push(formulaNode);
        }
      }

      // Extract definitions if enabled
      if (options.extractDefinitions) {
        const definition = this.extractDefinition(sentence);
        if (definition) {
          const defNode = nodeGenerator.generateDefinitionNode(
            definition.term,
            definition.definition,
            subject,
            { parentId }
          );
          nodes.push(defNode);
        }
      }

      // Extract examples if enabled
      if (options.extractExamples) {
        const examples = this.extractExamples(sentence);
        for (const example of examples) {
          const exampleNode = nodeGenerator.generateExampleNode(
            `Example: ${example.substring(0, 30)}...`,
            example,
            subject,
            parentId
          );
          nodes.push(exampleNode);
        }
      }
    }

    return nodes;
  }

  // Extract concepts from text
  private extractConcepts(text: string, minLength: number): string[] {
    const concepts: string[] = [];

    // Look for capitalized phrases
    const matches = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);

    if (matches) {
      for (const match of matches) {
        const cleaned = match.trim();
        if (cleaned.length >= minLength && !this.isCommonWord(cleaned)) {
          concepts.push(cleaned);
        }
      }
    }

    // Deduplicate
    return [...new Set(concepts)];
  }

  // Extract formulas
  private extractFormulas(text: string): Array<{ name: string; expression: string }> {
    const formulas: Array<{ name: string; expression: string }> = [];

    // Look for equations (contains =)
    const equationMatches = text.match(/([A-Za-z_]\w*)\s*=\s*([^.]+)/g);

    if (equationMatches) {
      for (const match of equationMatches) {
        const parts = match.split("=");
        if (parts.length === 2) {
          formulas.push({
            name: parts[0].trim(),
            expression: match.trim()
          });
        }
      }
    }

    // Look for mathematical expressions
    const mathMatches = text.match(/[A-Za-z]+\s*\([^)]+\)\s*[+\-*/=]\s*[A-Za-z0-9\s]+/g);

    if (mathMatches) {
      for (const match of mathMatches) {
        const name = match.substring(0, 20).trim();
        formulas.push({
          name,
          expression: match.trim()
        });
      }
    }

    return formulas;
  }

  // Extract definition
  private extractDefinition(text: string): { term: string; definition: string } | null {
    const patterns = [
      /(?:is|are|refers to|means)\s+([^.]+)/i,
      /"([^"]+)"\s+(?:is|means|refers to)\s+([^.]+)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is\s+(?:the|a|an)\s+([^.]+)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match.length >= 2) {
        return {
          term: match[1].trim(),
          definition: match[2].trim()
        };
      }
    }

    return null;
  }

  // Extract examples
  private extractExamples(text: string): string[] {
    const examples: string[] = [];

    // Look for example patterns
    const patterns = [
      /for example[,\s]+([^.]+)/gi,
      /such as[,\s]+([^.]+)/gi,
      /e\.g\.\s*([^.]+)/gi,
      /instance[,\s]+([^.]+)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        examples.push(match[1].trim());
      }
    }

    return examples;
  }

  // Extract subject from title
  private extractSubject(title: string): string {
    // Remove common prefixes/suffixes
    let subject = title
      .replace(/^(introduction|chapter|part|section)\s+[\d:\s]+/i, "")
      .replace(/\s*[-:]\s*(pdf|ebook|book|course)$/i, "")
      .trim();

    return subject || "General";
  }

  // Check if word is common
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      "The", "This", "That", "These", "Those", "Which", "What", "When",
      "Where", "Why", "How", "All", "Some", "Any", "Each", "Every",
      "Both", "Few", "More", "Most", "Other", "Same", "Such",
      "Only", "Very", "Just", "Also", "Now", "Then", "Here", "There"
    ]);

    return commonWords.has(word);
  }

  // Merge multiple graphs
  public mergeGraphs(graphs: GraphGenerationResult[]): GraphGenerationResult {
    const allNodes: KnowledgeNode[] = [];
    const allEdges: KnowledgeEdge[] = [];
    const subjects = new Set<string>();

    for (const graph of graphs) {
      allNodes.push(...graph.nodes);
      allEdges.push(...graph.edges);
      graph.subjects.forEach(s => subjects.add(s));
    }

    return {
      nodes: allNodes,
      edges: allEdges,
      subjects: Array.from(subjects),
      statistics: {
        nodesGenerated: allNodes.length,
        edgesGenerated: allEdges.length,
        subjects: subjects.size
      }
    };
  }
}

// Singleton export
export const graphGenerationService = GraphGenerationService.getInstance();
