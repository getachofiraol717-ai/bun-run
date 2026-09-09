// Reference Book Engine — ConflictResolver
// Feature 6: Conflict Resolution - Handle disagreements between sources
import type { SourceComparison, ConceptConflict, ConflictResolution, ConflictType } from "../models/SourceComparison";

export interface ResolutionStrategy {
  strategy: "majority_rules" | "authoritative_source" | "contextual" | "present_alternatives";
  preferRecent: boolean;
  preferAcademic: boolean;
}

const DEFAULT_STRATEGY: ResolutionStrategy = {
  strategy: "authoritative_source",
  preferRecent: true,
  preferAcademic: true
};

/**
 * Resolves conflicts between different source explanations
 */
export class ConflictResolver {
  private strategy: ResolutionStrategy;

  constructor(strategy?: Partial<ResolutionStrategy>) {
    this.strategy = { ...DEFAULT_STRATEGY, ...strategy };
  }

  /**
   * Resolve all conflicts in a comparison
   */
  async resolve(comparison: SourceComparison): Promise<SourceComparison> {
    const resolvedConflicts: ConceptConflict[] = [];

    for (const conflict of comparison.conflicts) {
      const resolved = this.resolveConflict(conflict, comparison);
      resolvedConflicts.push(resolved);
    }

    return {
      ...comparison,
      conflicts: resolvedConflicts
    };
  }

  /**
   * Resolve a single conflict
   */
  private resolveConflict(
    conflict: ConceptConflict,
    comparison: SourceComparison
  ): ConceptConflict {
    const resolution = this.determineResolution(conflict, comparison);

    return {
      ...conflict,
      resolution
    };
  }

  /**
   * Determine the best resolution strategy
   */
  private determineResolution(
    conflict: ConceptConflict,
    comparison: SourceComparison
  ): ConflictResolution {
    switch (this.strategy.strategy) {
      case "majority_rules":
        return this.resolveByMajority(conflict, comparison);
      case "authoritative_source":
        return this.resolveByAuthority(conflict, comparison);
      case "contextual":
        return this.resolveByContext(conflict, comparison);
      case "present_alternatives":
        return this.presentAlternatives(conflict);
      default:
        return this.resolveByAuthority(conflict, comparison);
    }
  }

  /**
   * Resolve by majority agreement
   */
  private resolveByMajority(
    conflict: ConceptConflict,
    comparison: SourceComparison
  ): ConflictResolution {
    // Count how many sources support each position
    const positionCounts = new Map<string, { source: typeof conflict.sources[0]; count: number }>();

    for (const source of conflict.sources) {
      const key = source.position.slice(0, 50); // Truncate for comparison
      const existing = positionCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        positionCounts.set(key, { source, count: 1 });
      }
    }

    // Find the most common position
    let maxCount = 0;
    let winningPosition = "";
    let winningSource: typeof conflict.sources[0] | null = null;

    for (const [_, data] of positionCounts) {
      if (data.count > maxCount) {
        maxCount = data.count;
        winningPosition = data.source.position;
        winningSource = data.source;
      }
    }

    const totalSources = conflict.sources.length;
    const agreementLevel = maxCount / totalSources;

    return {
      resolutionType: "majority_rules",
      explanation: `${maxCount} of ${totalSources} sources agree on this interpretation.`,
      recommendedPosition: winningPosition,
      alternativePositions: Array.from(positionCounts.entries())
        .filter(([key]) => key !== winningPosition.slice(0, 50))
        .map(([key]) => key)
    };
  }

  /**
   * Resolve by authoritative sources
   */
  private resolveByAuthority(
    conflict: ConceptConflict,
    comparison: SourceComparison
  ): ConflictResolution {
    // Find the most authoritative source
    let bestSource = conflict.sources[0];
    let bestStrength = 0;

    for (const source of conflict.sources) {
      // Get source details from comparison
      const sourceData = comparison.sources.find(s => s.sourceId === source.sourceId);
      if (sourceData) {
        // Calculate authority score
        let authorityScore = sourceData.quality * 10;

        // Boost for research papers
        if (sourceData.sourceType === "research_paper") authorityScore *= 1.5;

        // Boost for recency (would check publication date)
        if (this.strategy.preferRecent) authorityScore *= 1.1;

        if (authorityScore > bestStrength) {
          bestStrength = authorityScore;
          bestSource = source;
        }
      }
    }

    // Get alternative positions
    const alternatives = conflict.sources
      .filter(s => s !== bestSource)
      .map(s => s.position);

    return {
      resolutionType: "authoritative_source",
      explanation: `This interpretation is supported by the most authoritative source.`,
      recommendedPosition: bestSource?.position,
      alternativePositions: alternatives
    };
  }

  /**
   * Resolve by context (present both based on context)
   */
  private resolveByContext(
    conflict: ConceptConflict,
    comparison: SourceComparison
  ): ConflictResolution {
    // Analyze the type of conflict
    const contextAnalysis = this.analyzeConflictContext(conflict);

    // Build contextual explanation
    let explanation = "";
    let recommendedPosition = "";
    const alternatives: string[] = [];

    for (const source of conflict.sources) {
      const sourceData = comparison.sources.find(s => s.sourceId === source.sourceId);
      const context = sourceData?.sourceType || "unknown";

      explanation += `In ${context} contexts, ${source.position.slice(0, 100)}. `;
      alternatives.push(source.position);

      // Select recommendation based on context
      if (context === "textbook" || context === "research_paper") {
        recommendedPosition = source.position;
      }
    }

    return {
      resolutionType: "contextual",
      explanation: explanation.trim(),
      recommendedPosition: recommendedPosition || conflict.sources[0]?.position,
      alternativePositions: alternatives
    };
  }

  /**
   * Present all alternatives without resolving
   */
  private presentAlternatives(conflict: ConceptConflict): ConflictResolution {
    const alternatives = conflict.sources.map(s => s.position);

    return {
      resolutionType: "presented_as_alternatives",
      explanation: "Different sources present different interpretations. Consider exploring both views.",
      alternativePositions: alternatives
    };
  }

  /**
   * Analyze the context of a conflict
   */
  private analyzeConflictContext(conflict: ConceptConflict): {
    type: ConflictType;
    severity: "minor" | "moderate" | "major";
    explanation: string;
  } {
    // Calculate severity based on source disagreement
    const positions = new Set(conflict.sources.map(s => s.position.slice(0, 50)));
    const uniquenessRatio = positions.size / conflict.sources.length;

    let severity: "minor" | "moderate" | "major";
    if (uniquenessRatio < 0.3) severity = "minor";
    else if (uniquenessRatio < 0.7) severity = "moderate";
    else severity = "major";

    return {
      type: conflict.conflictType,
      severity,
      explanation: this.getConflictExplanation(conflict.conflictType, severity)
    };
  }

  private getConflictExplanation(type: ConflictType, severity: "minor" | "moderate" | "major"): string {
    const explanations: Record<ConflictType, Record<string, string>> = {
      definitional: {
        minor: "Minor wording differences in definitions.",
        moderate: "Different emphasis in how the concept is defined.",
        major: "Fundamentally different definitions of the same term."
      },
      numerical: {
        minor: "Minor numerical differences.",
        moderate: "Different values or constants being used.",
        major: "Significantly different numerical results."
      },
      methodological: {
        minor: "Minor procedural differences.",
        moderate: "Different approaches to solving similar problems.",
        major: "Completely different methodologies."
      },
      interpretive: {
        minor: "Different ways of explaining the same thing.",
        moderate: "Different interpretations of evidence.",
        major: "Conflicting conclusions from the same data."
      },
      contextual: {
        minor: "Context-dependent interpretations.",
        moderate: "Different applications in different contexts.",
        major: "Context determines which interpretation is correct."
      },
      historical: {
        minor: "Minor historical differences.",
        moderate: "Different historical accounts.",
        major: "Conflicting historical narratives."
      }
    };

    return explanations[type]?.[severity] || "A conflict between sources.";
  }

  /**
   * Generate discussion points for AI Tutor
   */
  generateDiscussionPoints(conflict: ConceptConflict): {
    question: string;
    points: string[];
    recommendations: string[];
  } {
    const type = conflict.conflictType;

    let question = "";
    switch (type) {
      case "definitional":
        question = "How do different definitions affect your understanding of this concept?";
        break;
      case "numerical":
        question = "Why might different sources give different numerical values?";
        break;
      case "methodological":
        question = "Which approach do you find more intuitive, and why?";
        break;
      case "interpretive":
        question = "How does perspective influence how we interpret information?";
        break;
      default:
        question = "Can you identify why these sources might disagree?";
    }

    const points = conflict.sources.map(s =>
      `- ${s.sourceId}: ${s.position.slice(0, 100)}...`
    );

    const recommendations = [
      "Consider the context of each source",
      "Evaluate the authority of each source",
      "Think about which explanation makes more sense to you"
    ];

    return { question, points, recommendations };
  }

  /**
   * Update resolution strategy
   */
  setStrategy(strategy: Partial<ResolutionStrategy>): void {
    this.strategy = { ...this.strategy, ...strategy };
  }

  /**
   * Get current strategy
   */
  getStrategy(): ResolutionStrategy {
    return { ...this.strategy };
  }
}
