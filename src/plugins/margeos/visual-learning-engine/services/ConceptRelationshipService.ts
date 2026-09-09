// Visual Learning Engine — Concept Relationship Service
// Manages concept relationships and semantic connections

import type { ConceptRelationshipType } from "../models/MindMap";

export interface ConceptNode {
  id: string;
  name: string;
  definition?: string;
  importance?: number;
  category?: string;
}

export interface ConceptRelationship {
  sourceId: string;
  targetId: string;
  type: ConceptRelationshipType;
  label?: string;
  strength?: number;
}

export interface RelationshipCluster {
  id: string;
  label: string;
  conceptIds: string[];
  centralConceptId?: string;
}

export class ConceptRelationshipService {
  /**
   * Detect concept relationships from text
   */
  detectRelationships(concepts: ConceptNode[]): ConceptRelationship[] {
    const relationships: ConceptRelationship[] = [];

    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const c1 = concepts[i];
        const c2 = concepts[j];

        // Check for hierarchical relationship
        if (c1.name.includes(c2.name) || this.isGeneralization(c1.name, c2.name)) {
          relationships.push({
            sourceId: c1.id,
            targetId: c2.id,
            type: "is_a",
            strength: 0.8
          });
        }

        // Check for part-whole relationship
        if (this.isPartOf(c1.name, c2.name)) {
          relationships.push({
            sourceId: c1.id,
            targetId: c2.id,
            type: "part_of",
            strength: 0.7
          });
        }

        // Check for causation
        if (this.impliesCausation(c1.name, c2.name)) {
          relationships.push({
            sourceId: c1.id,
            targetId: c2.id,
            type: "causes",
            strength: 0.6
          });
        }

        // Check for similarity
        if (this.areSimilar(c1.name, c2.name)) {
          relationships.push({
            sourceId: c1.id,
            targetId: c2.id,
            type: "similar_to",
            strength: 0.5
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Check if c1 is generalization of c2
   */
  private isGeneralization(general: string, specific: string): boolean {
    const generalLower = general.toLowerCase();
    const specificLower = specific.toLowerCase();

    return generalLower.includes("type") ||
           generalLower.includes("category") ||
           generalLower.includes("class") ||
           generalLower.includes("kind") ||
           (specificLower.includes("is") && specificLower.includes(generalLower));
  }

  /**
   * Check if c1 is part of c2
   */
  private isPartOf(part: string, whole: string): boolean {
    const partLower = part.toLowerCase();
    const wholeLower = whole.toLowerCase();

    return partLower.includes("component") ||
           partLower.includes("element") ||
           partLower.includes("member") ||
           partLower.includes("part") ||
           wholeLower.includes("system") ||
           wholeLower.includes("structure");
  }

  /**
   * Check if c1 implies causation of c2
   */
  private impliesCausation(cause: string, effect: string): boolean {
    const causeLower = cause.toLowerCase();
    const effectLower = effect.toLowerCase();

    return causeLower.includes("cause") ||
           causeLower.includes("lead") ||
           causeLower.includes("result") ||
           effectLower.includes("effect") ||
           effectLower.includes("outcome") ||
           effectLower.includes("result");
  }

  /**
   * Check if concepts are similar
   */
  private areSimilar(c1: string, c2: string): boolean {
    const s1 = c1.toLowerCase().replace(/[^a-z0-9]/g, "");
    const s2 = c2.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (s1 === s2) return true;

    // Simple Levenshtein-like similarity
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return true;

    const similarity = this.longestCommonSubstring(s1, s2) / longer.length;
    return similarity > 0.7;
  }

  /**
   * Calculate longest common substring
   */
  private longestCommonSubstring(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    let max = 0;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
          max = Math.max(max, dp[i][j]);
        }
      }
    }

    return max;
  }

  /**
   * Cluster related concepts
   */
  clusterConcepts(concepts: ConceptNode[], relationships: ConceptRelationship[]): RelationshipCluster[] {
    const clusters: RelationshipCluster[] = [];
    const visited = new Set<string>();

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    for (const rel of relationships) {
      if (!adjacency.has(rel.sourceId)) adjacency.set(rel.sourceId, []);
      if (!adjacency.has(rel.targetId)) adjacency.set(rel.targetId, []);
      adjacency.get(rel.sourceId)!.push(rel.targetId);
      adjacency.get(rel.targetId)!.push(rel.sourceId);
    }

    // Find connected components
    for (const concept of concepts) {
      if (visited.has(concept.id)) continue;

      const clusterConcepts: string[] = [];
      const queue = [concept.id];
      let centralId = concept.id;

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        clusterConcepts.push(current);

        // Track most connected as central
        const connections = adjacency.get(current) || [];
        if (connections.length > (adjacency.get(centralId)?.length || 0)) {
          centralId = current;
        }

        for (const neighbor of connections) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      if (clusterConcepts.length > 0) {
        const centralConcept = concepts.find(c => c.id === centralId);
        clusters.push({
          id: `cluster-${clusters.length}`,
          label: centralConcept?.name || `Cluster ${clusters.length + 1}`,
          conceptIds: clusterConcepts,
          centralConceptId: centralId
        });
      }
    }

    return clusters;
  }

  /**
   * Get relationship color by type
   */
  getRelationshipColor(type: ConceptRelationshipType): string {
    const colors: Record<ConceptRelationshipType, string> = {
      "is_a": "#3B82F6",
      "part_of": "#8B5CF6",
      "related_to": "#6B7280",
      "causes": "#EF4444",
      "depends_on": "#F59E0B",
      "enables": "#10B981",
      "contradicts": "#DC2626",
      "similar_to": "#6366F1",
      "example_of": "#14B8A6",
      "leads_to": "#F97316",
      "requires": "#8B5CF6",
      "produces": "#22C55E"
    };

    return colors[type] || "#6B7280";
  }

  /**
   * Get relationship line style by type
   */
  getRelationshipLineStyle(type: ConceptRelationshipType): "solid" | "dashed" | "dotted" {
    switch (type) {
      case "is_a":
      case "part_of":
      case "causes":
        return "solid";
      case "related_to":
      case "similar_to":
        return "dashed";
      case "depends_on":
      case "requires":
        return "dotted";
      default:
        return "solid";
    }
  }

  /**
   * Get all relationship types
   */
  getRelationshipTypes(): ConceptRelationshipType[] {
    return [
      "is_a", "part_of", "related_to", "causes", "depends_on",
      "enables", "contradicts", "similar_to", "example_of",
      "leads_to", "requires", "produces"
    ];
  }
}

// Export singleton instance
export const conceptRelationshipService = new ConceptRelationshipService();
