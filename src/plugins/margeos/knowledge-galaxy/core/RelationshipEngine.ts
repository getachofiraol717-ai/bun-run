// @ts-nocheck
// Knowledge Galaxy — RelationshipEngine
// Handles discovery and management of relationships between nodes

import type { KnowledgeNode, KnowledgeEdge, EdgeType } from "../models";
import { createKnowledgeEdge, EDGE_TYPE_CONFIG } from "../models/KnowledgeEdge";

export class RelationshipEngine {
  private relationshipPatterns: Map<string, EdgeType> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    // Define keyword patterns that indicate relationship types
    this.relationshipPatterns.set("prerequisite", "prerequisite");
    this.relationshipPatterns.set("requires", "prerequisite");
    this.relationshipPatterns.set("must know", "prerequisite");
    this.relationshipPatterns.set("depends on", "depends_on");
    this.relationshipPatterns.set("based on", "depends_on");
    this.relationshipPatterns.set("explains", "explains");
    this.relationshipPatterns.set("clarifies", "explains");
    this.relationshipPatterns.set("uses", "uses");
    this.relationshipPatterns.set("applies", "uses");
    this.relationshipPatterns.set("extends", "extends");
    this.relationshipPatterns.set("builds on", "extends");
    this.relationshipPatterns.set("similar to", "similar_to");
    this.relationshipPatterns.set("like", "similar_to");
    this.relationshipPatterns.set("part of", "part_of");
    this.relationshipPatterns.set("belongs to", "part_of");
    this.relationshipPatterns.set("example of", "examples");
    this.relationshipPatterns.set("such as", "examples");
    this.relationshipPatterns.set("references", "references");
    this.relationshipPatterns.set("cited in", "references");
    this.relationshipPatterns.set("derived from", "derives_from");
    this.relationshipPatterns.set("originates from", "derives_from");
    this.relationshipPatterns.set("leads to", "leads_to");
    this.relationshipPatterns.set("results in", "leads_to");
  }

  // Find relationships for a new node
  public async findRelationships(
    node: KnowledgeNode,
    existingNodes: KnowledgeNode[]
  ): Promise<KnowledgeEdge[]> {
    const edges: KnowledgeEdge[] = [];

    for (const existingNode of existingNodes) {
      if (existingNode.id === node.id) continue;

      // Check for various relationship types
      const relationship = this.analyzeRelationship(node, existingNode);
      if (relationship) {
        edges.push(relationship);
      }
    }

    // Also analyze relationships in reverse
    for (const existingNode of existingNodes) {
      if (existingNode.id === node.id) continue;

      const relationship = this.analyzeRelationship(existingNode, node);
      if (relationship && !edges.some(e =>
        e.sourceNodeId === relationship.sourceNodeId &&
        e.targetNodeId === relationship.targetNodeId
      )) {
        edges.push(relationship);
      }
    }

    return edges;
  }

  // Analyze relationship between two nodes
  private analyzeRelationship(
    sourceNode: KnowledgeNode,
    targetNode: KnowledgeNode
  ): KnowledgeEdge | null {
    // Check for prerequisite relationship
    if (this.isPrerequisite(sourceNode, targetNode)) {
      return this.createEdge(sourceNode, targetNode, "prerequisite");
    }

    // Check for same subject relationship
    if (sourceNode.subject === targetNode.subject) {
      // Same chapter
      if (sourceNode.chapter && sourceNode.chapter === targetNode.chapter) {
        // Both in same topic area
        if (this.hasSharedKeywords(sourceNode, targetNode)) {
          return this.createEdge(sourceNode, targetNode, "related_to", "medium");
        }
      }
    }

    // Check for formula-concept relationship
    if (sourceNode.type === "formula" && targetNode.type === "concept") {
      if (this.usesConcept(sourceNode, targetNode)) {
        return this.createEdge(sourceNode, targetNode, "uses");
      }
    }

    if (sourceNode.type === "concept" && targetNode.type === "formula") {
      if (this.usesConcept(targetNode, sourceNode)) {
        return this.createEdge(sourceNode, targetNode, "uses");
      }
    }

    // Check for definition-concept relationship
    if (sourceNode.type === "definition" && targetNode.type === "concept") {
      return this.createEdge(sourceNode, targetNode, "explains");
    }

    // Check for example-concept relationship
    if (sourceNode.type === "example" && targetNode.type === "concept") {
      return this.createEdge(sourceNode, targetNode, "examples");
    }

    // Check for topic-chapter relationship
    if (sourceNode.type === "topic" && targetNode.type === "chapter") {
      return this.createEdge(sourceNode, targetNode, "part_of");
    }

    if (sourceNode.type === "chapter" && targetNode.type === "topic") {
      return this.createEdge(sourceNode, targetNode, "part_of");
    }

    // Check for subject-chapter relationship
    if (sourceNode.type === "chapter" && targetNode.type === "subject") {
      return this.createEdge(sourceNode, targetNode, "part_of");
    }

    return null;
  }

  // Check if source is prerequisite for target
  private isPrerequisite(source: KnowledgeNode, target: KnowledgeNode): boolean {
    // Check explicit prerequisites
    if (target.prerequisiteIds?.includes(source.id)) {
      return true;
    }

    // Check based on type hierarchy
    if (source.type === "concept" && target.type === "concept") {
      // Concepts earlier in alphabetical order might be prerequisites
      return source.title < target.title && this.hasSharedSubject(source, target);
    }

    // Check based on difficulty
    if (source.difficulty < target.difficulty) {
      return this.hasSharedKeywords(source, target);
    }

    return false;
  }

  // Check if nodes share the same subject
  private hasSharedSubject(a: KnowledgeNode, b: KnowledgeNode): boolean {
    return a.subject === b.subject;
  }

  // Check if nodes share keywords
  private hasSharedKeywords(a: KnowledgeNode, b: KnowledgeNode): boolean {
    const keywordsA = new Set([...a.keywords, ...a.tags].map(k => k.toLowerCase()));
    const keywordsB = new Set([...b.keywords, ...b.tags].map(k => k.toLowerCase()));

    for (const keyword of keywordsA) {
      if (keywordsB.has(keyword)) {
        return true;
      }
    }

    // Also check title words
    const wordsA = new Set(a.title.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.title.toLowerCase().split(/\s+/));

    for (const word of wordsA) {
      if (wordsB.has(word) && word.length > 3) {
        return true;
      }
    }

    return false;
  }

  // Check if formula uses a concept
  private usesConcept(formula: KnowledgeNode, concept: KnowledgeNode): boolean {
    // Check if concept keyword is in formula description or title
    const formulaText = `${formula.title} ${formula.description}`.toLowerCase();
    const conceptName = concept.title.toLowerCase();

    return formulaText.includes(conceptName);
  }

  // Create edge with appropriate strength
  private createEdge(
    source: KnowledgeNode,
    target: KnowledgeNode,
    type: EdgeType,
    defaultStrength: "weak" | "medium" | "strong" = "medium"
  ): KnowledgeEdge {
    // Calculate strength based on relevance
    let strength = defaultStrength;

    if (this.hasSharedKeywords(source, target)) {
      strength = "strong";
    }

    if (source.subject === target.subject) {
      strength = source.chapter === target.chapter ? "strong" : "medium";
    }

    // Check importance
    if (source.importance >= 4 && target.importance >= 4) {
      strength = "strong";
    }

    return createKnowledgeEdge(source.id, target.id, type, {
      strength,
      weight: strength === "strong" ? 0.8 : strength === "medium" ? 0.5 : 0.2,
      sourceEngine: "relationship"
    });
  }

  // Infer relationship from text
  public inferRelationshipFromText(
    sourceNode: KnowledgeNode,
    targetNode: KnowledgeNode,
    relationshipText: string
  ): KnowledgeEdge | null {
    const text = relationshipText.toLowerCase();

    for (const [pattern, edgeType] of this.relationshipPatterns) {
      if (text.includes(pattern)) {
        return this.createEdge(sourceNode, targetNode, edgeType);
      }
    }

    // Default to related_to
    return this.createEdge(sourceNode, targetNode, "related_to", "weak");
  }

  // Get relationship type between nodes
  public getRelationshipType(
    sourceId: string,
    targetId: string,
    edges: KnowledgeEdge[]
  ): EdgeType | null {
    const edge = edges.find(
      e => e.sourceNodeId === sourceId && e.targetNodeId === targetId
    );

    return edge?.type || null;
  }

  // Get all connected nodes
  public getConnectedNodes(
    nodeId: string,
    edges: KnowledgeEdge[]
  ): { incoming: string[]; outgoing: string[] } {
    const incoming = edges
      .filter(e => e.targetNodeId === nodeId)
      .map(e => e.sourceNodeId);

    const outgoing = edges
      .filter(e => e.sourceNodeId === nodeId)
      .map(e => e.targetNodeId);

    return { incoming, outgoing };
  }

  // Calculate relationship strength
  public calculateRelationshipStrength(
    edge: KnowledgeEdge,
    usageData?: { sourceUsage: number; targetUsage: number }
  ): number {
    let strength = edge.weight;

    if (usageData) {
      // Increase strength based on usage correlation
      const usageCorrelation = Math.min(
        usageData.sourceUsage,
        usageData.targetUsage
      ) / Math.max(usageData.sourceUsage, usageData.targetUsage, 1);

      strength = Math.min(1, strength + usageCorrelation * 0.2);
    }

    return strength;
  }

  // Suggest new relationships
  public suggestRelationships(
    nodes: KnowledgeNode[],
    existingEdges: KnowledgeEdge[]
  ): Array<{ source: KnowledgeNode; target: KnowledgeNode; reason: string }> {
    const suggestions: Array<{ source: KnowledgeNode; target: KnowledgeNode; reason: string }> = [];
    const connectedPairs = new Set<string>();

    // Build existing connections set
    for (const edge of existingEdges) {
      connectedPairs.add(`${edge.sourceNodeId}-${edge.targetNodeId}`);
    }

    // Find potential relationships
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const source = nodes[i];
        const target = nodes[j];
        const pairKey = `${source.id}-${target.id}`;
        const reverseKey = `${target.id}-${source.id}`;

        if (connectedPairs.has(pairKey) || connectedPairs.has(reverseKey)) {
          continue;
        }

        const reason = this.evaluatePotentialRelationship(source, target);
        if (reason) {
          suggestions.push({ source, target, reason });
        }
      }
    }

    // Sort by strength of reason
    return suggestions.sort((a, b) => {
      const aScore = this.scoreReason(a.reason);
      const bScore = this.scoreReason(b.reason);
      return bScore - aScore;
    });
  }

  // Evaluate potential relationship
  private evaluatePotentialRelationship(
    source: KnowledgeNode,
    target: KnowledgeNode
  ): string | null {
    // Same subject with shared keywords
    if (source.subject === target.subject && this.hasSharedKeywords(source, target)) {
      return "Same subject with related content";
    }

    // Sequential topics
    if (source.type === "topic" && target.type === "topic" &&
        source.chapter === target.chapter) {
      return "Sequential topics in same chapter";
    }

    // Formula and concept
    if ((source.type === "formula" && target.type === "concept") ||
        (source.type === "concept" && target.type === "formula")) {
      return "Formula-concept relationship";
    }

    // Definition and concept
    if ((source.type === "definition" && target.type === "concept") ||
        (source.type === "concept" && target.type === "definition")) {
      return "Definition explains concept";
    }

    return null;
  }

  // Score reason strength
  private scoreReason(reason: string): number {
    if (reason.includes("formula")) return 5;
    if (reason.includes("definition")) return 4;
    if (reason.includes("sequential")) return 3;
    if (reason.includes("related")) return 2;
    return 1;
  }

  // Merge duplicate relationships
  public mergeDuplicateRelationships(edges: KnowledgeEdge[]): KnowledgeEdge[] {
    const merged = new Map<string, KnowledgeEdge>();
    const reverseLookup = new Map<string, string>();

    for (const edge of edges) {
      const key = `${edge.sourceNodeId}-${edge.targetNodeId}`;
      const reverseKey = `${edge.targetNodeId}-${edge.sourceNodeId}`;

      // Check if reverse edge exists
      const existing = merged.get(reverseKey);
      if (existing && existing.bidirectional) {
        // Keep the bidirectional relationship
        reverseLookup.set(key, reverseKey);
        continue;
      }

      // Check for existing edge
      const existingEdge = merged.get(key);
      if (existingEdge) {
        // Merge by taking stronger weight
        if (edge.weight > existingEdge.weight) {
          merged.set(key, edge);
        }
      } else {
        merged.set(key, edge);
      }
    }

    return Array.from(merged.values());
  }
}

// Singleton export
export const relationshipEngine = new RelationshipEngine();
