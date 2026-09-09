// Knowledge Galaxy — NodeGenerator
// Generates knowledge nodes from various sources

import type { KnowledgeNode, NodeType } from "../models/KnowledgeNode";
import { createKnowledgeNode } from "../models/KnowledgeNode";

interface NodeGenerationContext {
  subject: string;
  chapter?: string;
  sourceEngine: "pdf" | "tutor" | "formula" | "reference" | "visual" | "quiz" | "flashcard" | "manual";
  sourceId?: string;
  sourceName?: string;
}

interface ExtractedConcept {
  name: string;
  description?: string;
  type: NodeType;
  importance?: number;
  difficulty?: number;
  keywords?: string[];
  relatedTo?: string[];
}

interface TextAnalysisResult {
  concepts: ExtractedConcept[];
  topics: string[];
  keyTerms: string[];
  relationships: Array<{ from: string; to: string; type: string }>;
}

export class NodeGenerator {
  private cache: Map<string, KnowledgeNode> = new Map();

  // Generate node from text content
  public generateFromText(
    content: string,
    context: NodeGenerationContext
  ): KnowledgeNode[] {
    const analysis = this.analyzeText(content);
    const nodes: KnowledgeNode[] = [];

    for (const concept of analysis.concepts) {
      const node = this.createNodeFromConcept(concept, context);
      nodes.push(node);
      this.cache.set(node.id, node);
    }

    return nodes;
  }

  // Analyze text to extract concepts
  public analyzeText(content: string): TextAnalysisResult {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const concepts: ExtractedConcept[] = [];
    const topics: string[] = [];
    const keyTerms: string[] = [];

    // Simple concept extraction (in production, would use NLP)
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);

      // Look for capitalized terms (potential concepts)
      for (const word of words) {
        if (this.isPotentialConcept(word)) {
          concepts.push({
            name: this.cleanConceptName(word),
            type: this.inferConceptType(word, sentence),
            importance: this.calculateImportance(word, content),
            keywords: this.extractKeywords(sentence)
          });
        }
      }

      // Extract key terms
      const terms = this.extractKeyTerms(sentence);
      keyTerms.push(...terms);

      // Extract topics (nouns after common patterns)
      const topicMatch = sentence.match(/(?:is|are|refers to|describes|explains)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (topicMatch) {
        topics.push(topicMatch[1]);
      }
    }

    // Deduplicate and limit
    const uniqueConcepts = this.deduplicateConcepts(concepts).slice(0, 20);
    const uniqueTopics = [...new Set(topics)].slice(0, 10);
    const uniqueTerms = [...new Set(keyTerms)].slice(0, 30);

    return {
      concepts: uniqueConcepts,
      topics: uniqueTopics,
      keyTerms: uniqueTerms,
      relationships: this.extractRelationships(uniqueConcepts)
    };
  }

  // Generate concept node
  public generateConceptNode(
    name: string,
    subject: string,
    options?: Partial<KnowledgeNode>
  ): KnowledgeNode {
    return createKnowledgeNode("concept", name, subject, {
      description: options?.description || `Understanding ${name}`,
      importance: options?.importance || 3,
      difficulty: options?.difficulty || 3,
      estimatedStudyTime: options?.estimatedStudyTime || 30,
      ...options
    });
  }

  // Generate formula node
  public generateFormulaNode(
    name: string,
    expression: string,
    subject: string,
    options?: Partial<KnowledgeNode>
  ): KnowledgeNode {
    return createKnowledgeNode("formula", name, subject, {
      description: expression,
      importance: options?.importance || 4,
      difficulty: options?.difficulty || 3,
      estimatedStudyTime: options?.estimatedStudyTime || 20,
      ...options
    });
  }

  // Generate definition node
  public generateDefinitionNode(
    term: string,
    definition: string,
    subject: string,
    options?: Partial<KnowledgeNode>
  ): KnowledgeNode {
    return createKnowledgeNode("definition", term, subject, {
      description: definition,
      importance: options?.importance || 3,
      difficulty: options?.difficulty || 2,
      estimatedStudyTime: options?.estimatedStudyTime || 15,
      ...options
    });
  }

  // Generate example node
  public generateExampleNode(
    title: string,
    content: string,
    subject: string,
    parentId?: string,
    options?: Partial<KnowledgeNode>
  ): KnowledgeNode {
    return createKnowledgeNode("example", title, subject, {
      description: content,
      parentId,
      importance: options?.importance || 2,
      difficulty: options?.difficulty || 2,
      estimatedStudyTime: options?.estimatedStudyTime || 10,
      ...options
    });
  }

  // Generate topic node
  public generateTopicNode(
    title: string,
    subject: string,
    chapter?: string,
    options?: Partial<KnowledgeNode>
  ): KnowledgeNode {
    return createKnowledgeNode("topic", title, subject, {
      chapter,
      description: options?.description || `Topic: ${title}`,
      importance: options?.importance || 4,
      difficulty: options?.difficulty || 3,
      estimatedStudyTime: options?.estimatedStudyTime || 60,
      ...options
    });
  }

  // Generate skill node
  public generateSkillNode(
    name: string,
    subject: string,
    options?: Partial<KnowledgeNode>
  ): KnowledgeNode {
    return createKnowledgeNode("skill", name, subject, {
      description: options?.description || `Skill: ${name}`,
      importance: options?.importance || 3,
      difficulty: options?.difficulty || 3,
      estimatedStudyTime: options?.estimatedStudyTime || 45,
      ...options
    });
  }

  // Create node from extracted concept
  private createNodeFromConcept(
    concept: ExtractedConcept,
    context: NodeGenerationContext
  ): KnowledgeNode {
    return createKnowledgeNode(concept.type, concept.name, context.subject, {
      description: concept.description || "",
      importance: concept.importance || 3,
      difficulty: concept.difficulty || 3,
      keywords: concept.keywords || [],
      sourceEngine: context.sourceEngine,
      sourceId: context.sourceId,
      sourceName: context.sourceName,
      chapter: context.chapter
    });
  }

  // Check if word could be a concept
  private isPotentialConcept(word: string): boolean {
    // Skip short words, common words, and punctuation
    if (word.length < 3) return false;

    const commonWords = [
      "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "must", "shall", "can", "need", "dare",
      "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
      "into", "through", "during", "before", "after", "above", "below",
      "and", "but", "or", "nor", "so", "yet", "both", "either", "neither"
    ];

    if (commonWords.includes(word.toLowerCase())) return false;

    // Check if capitalized (title case)
    return /^[A-Z][a-z]+$/.test(word) || /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(word);
  }

  // Clean concept name
  private cleanConceptName(name: string): string {
    return name
      .trim()
      .replace(/^\s+|\s+$/g, "")
      .replace(/\s+/g, " ");
  }

  // Infer concept type
  private inferConceptType(word: string, context: string): NodeType {
    const lowerContext = context.toLowerCase();

    // Formula indicators
    if (lowerContext.includes("equation") || lowerContext.includes("formula") ||
        lowerContext.includes("=") || lowerContext.includes("theorem")) {
      return "formula";
    }

    // Definition indicators
    if (lowerContext.includes("defined as") || lowerContext.includes("means") ||
        lowerContext.includes("refers to") || lowerContext.includes("is the")) {
      return "definition";
    }

    // Skill indicators
    if (lowerContext.includes("skill") || lowerContext.includes("ability") ||
        lowerContext.includes("can do") || lowerContext.includes("how to")) {
      return "skill";
    }

    // Example indicators
    if (lowerContext.includes("for example") || lowerContext.includes("such as") ||
        lowerContext.includes("instance")) {
      return "example";
    }

    // Default to concept
    return "concept";
  }

  // Calculate importance score
  private calculateImportance(term: string, content: string): number {
    const occurrences = (content.match(new RegExp(term, "gi")) || []).length;
    const position = content.indexOf(term);
    const earlyPosition = position < content.length * 0.3 ? 1 : 0;

    // Base importance from frequency
    let importance = 3;
    if (occurrences > 5) importance = 4;
    if (occurrences > 10) importance = 5;

    // Boost for early mention
    if (earlyPosition) importance++;

    return Math.min(5, importance);
  }

  // Extract keywords from sentence
  private extractKeywords(sentence: string): string[] {
    const words = sentence.split(/\s+/);
    const keywords: string[] = [];

    // Simple keyword extraction (nouns and adjectives)
    for (const word of words) {
      const cleaned = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (cleaned.length > 4 && !this.isCommonWord(cleaned)) {
        keywords.push(cleaned);
      }
    }

    return [...new Set(keywords)].slice(0, 5);
  }

  // Check if word is common
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      "this", "that", "these", "those", "which", "what", "when", "where",
      "why", "how", "very", "more", "most", "some", "any", "all", "each",
      "every", "both", "few", "more", "most", "other", "such", "only",
      "same", "than", "too", "very", "just", "also", "now", "then"
    ]);
    return commonWords.has(word);
  }

  // Extract key terms
  private extractKeyTerms(sentence: string): string[] {
    const terms: string[] = [];

    // Extract quoted terms
    const quotes = sentence.match(/"([^"]+)"/g);
    if (quotes) {
      terms.push(...quotes.map(q => q.replace(/"/g, "")));
    }

    // Extract terms in parentheses
    const parens = sentence.match(/\(([^)]+)\)/g);
    if (parens) {
      terms.push(...parens.map(p => p.replace(/[()]/g, "")));
    }

    return terms;
  }

  // Extract relationships between concepts
  private extractRelationships(concepts: ExtractedConcept[]): Array<{
    from: string;
    to: string;
    type: string;
  }> {
    const relationships: Array<{ from: string; to: string; type: string }> = [];

    // Create "related to" relationships for adjacent concepts
    for (let i = 0; i < concepts.length - 1; i++) {
      if (Math.random() > 0.5) { // Simulate relationship detection
        relationships.push({
          from: concepts[i].name,
          to: concepts[i + 1].name,
          type: "related_to"
        });
      }
    }

    return relationships;
  }

  // Deduplicate concepts
  private deduplicateConcepts(concepts: ExtractedConcept[]): ExtractedConcept[] {
    const seen = new Set<string>();
    const unique: ExtractedConcept[] = [];

    for (const concept of concepts) {
      const key = concept.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(concept);
      }
    }

    return unique;
  }

  // Generate nodes from quiz/assessment results
  public generateFromQuizResults(
    results: Array<{
      question: string;
      correct: boolean;
      topic: string;
    }>,
    subject: string
  ): KnowledgeNode[] {
    const nodes: KnowledgeNode[] = [];
    const weakTopics = results.filter(r => !r.correct).map(r => r.topic);
    const weakSet = new Set(weakTopics);

    for (const topic of weakSet) {
      const node = this.generateConceptNode(topic, subject, {
        description: `Weak area identified from quiz`,
        difficulty: 4, // Mark as challenging
        status: "in_progress"
      });
      nodes.push(node);
    }

    return nodes;
  }

  // Generate reference node
  public generateReferenceNode(
    title: string,
    url: string,
    subject: string,
    options?: Partial<KnowledgeNode>
  ): KnowledgeNode {
    return createKnowledgeNode("reference", title, subject, {
      description: url,
      sourceEngine: "reference",
      importance: options?.importance || 3,
      estimatedStudyTime: options?.estimatedStudyTime || 15,
      ...options
    });
  }

  // Clear cache
  public clearCache(): void {
    this.cache.clear();
  }

  // Get cached node
  public getCachedNode(id: string): KnowledgeNode | undefined {
    return this.cache.get(id);
  }
}

// Singleton export
export const nodeGenerator = new NodeGenerator();
