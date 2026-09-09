// @ts-nocheck
// Reference Book Engine — SourceRankingEngine
// Feature 7: Smart Recommendations - Suggest additional reading
import type { ReferenceSource } from "../models/ReferenceBook";
import type { RecommendationReason } from "../models/ReferenceBook";

export interface RankingCriteria {
  relevanceWeight: number;
  qualityWeight: number;
  recencyWeight: number;
  popularityWeight: number;
  diversityWeight: number;
}

const DEFAULT_CRITERIA: RankingCriteria = {
  relevanceWeight: 0.4,
  qualityWeight: 0.25,
  recencyWeight: 0.15,
  popularityWeight: 0.1,
  diversityWeight: 0.1
};

/**
 * Ranks and recommends sources based on various criteria
 */
export class SourceRankingEngine {
  private criteria: RankingCriteria;

  constructor(criteria?: Partial<RankingCriteria>) {
    this.criteria = { ...DEFAULT_CRITERIA, ...criteria };
  }

  /**
   * Calculate overall confidence score for a source
   */
  calculateSourceConfidence(source: ReferenceSource): number {
    let score = 0;

    // Quality indicators
    const qualityIndicators = this.calculateQualityIndicators(source);
    score += qualityIndicators * 0.4;

    // Completeness
    const completeness = this.calculateCompleteness(source);
    score += completeness * 0.3;

    // Usage/engagement
    const engagement = Math.min(1, source.usageCount / 10);
    score += engagement * 0.15;

    // Recency
    const recency = this.calculateRecency(source);
    score += recency * 0.15;

    return Math.min(1, Math.max(0, score));
  }

  private calculateQualityIndicators(source: ReferenceSource): number {
    let score = 0;

    // Source type quality
    const typeScores: Record<string, number> = {
      research_paper: 0.9,
      textbook: 0.8,
      teacher_guide: 0.7,
      study_note: 0.5,
      lecture_slide: 0.4,
      personal_document: 0.3
    };
    score += typeScores[source.metadata.sourceType] || 0.5;

    // Author information
    if (source.metadata.authors.length > 0) score += 0.1;

    // Publication info
    if (source.metadata.publisher || source.metadata.publicationDate) score += 0.1;

    // Academic identifiers
    if (source.metadata.doi || source.metadata.isbn) score += 0.1;

    // Quality rating
    if (source.metadata.quality === "primary") score += 0.15;
    else if (source.metadata.quality === "secondary") score += 0.1;

    return Math.min(1, score / 1.45); // Normalize
  }

  private calculateCompleteness(source: ReferenceSource): number {
    let score = 0;

    // Content presence
    if (source.chapters.length > 0) score += 0.2;
    if (source.topics.length > 0) score += 0.2;
    if (source.concepts.length > 0) score += 0.2;
    if (source.definitions.length > 0) score += 0.15;
    if (source.formulas.length > 0) score += 0.15;
    if (source.keyCitations.length > 0) score += 0.1;

    return Math.min(1, score);
  }

  private calculateRecency(source: ReferenceSource): number {
    if (!source.metadata.publicationDate) return 0.5; // Unknown age

    const publishYear = parseInt(source.metadata.publicationDate.slice(0, 4));
    const currentYear = new Date().getFullYear();
    const age = currentYear - publishYear;

    // Exponential decay based on age
    if (age <= 2) return 1;
    if (age <= 5) return 0.9;
    if (age <= 10) return 0.7;
    if (age <= 20) return 0.5;
    return 0.3;
  }

  /**
   * Get recommendations for a topic
   */
  async getRecommendations(
    topicId: string,
    learningHistory?: string[],
    limit: number = 5
  ): Promise<RankedSource[]> {
    // This would typically query the database
    // For now, return empty array (would be populated by ReferenceController)
    return [];
  }

  /**
   * Rank sources by relevance to a query
   */
  rankByRelevance(
    sources: ReferenceSource[],
    query: string,
    topics?: string[]
  ): RankedSource[] {
    const queryLower = query.toLowerCase();
    const topicSet = new Set(topics?.map(t => t.toLowerCase()) || []);

    const scored = sources.map(source => {
      let score = 0;

      // Title match
      if (source.metadata.title.toLowerCase().includes(queryLower)) {
        score += 0.3;
      }

      // Author match
      for (const author of source.metadata.authors) {
        if (author.toLowerCase().includes(queryLower)) {
          score += 0.15;
          break;
        }
      }

      // Subject match
      if (source.metadata.subject.toLowerCase().includes(queryLower)) {
        score += 0.2;
      }

      // Topic match
      for (const topic of source.topics) {
        if (topic.name.toLowerCase().includes(queryLower)) {
          score += 0.25;
        }
        if (topicSet.has(topic.name.toLowerCase())) {
          score += 0.3;
        }
      }

      // Concept match
      for (const concept of source.concepts) {
        if (concept.name.toLowerCase().includes(queryLower)) {
          score += 0.2;
        }
      }

      // Quality bonus
      score += source.confidenceScore * 0.2;

      return {
        source,
        score: Math.min(1, score),
        reasons: this.getMatchReasons(source, query, topics)
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private getMatchReasons(
    source: ReferenceSource,
    query: string,
    topics?: string[]
  ): string[] {
    const reasons: string[] = [];
    const queryLower = query.toLowerCase();

    if (source.metadata.title.toLowerCase().includes(queryLower)) {
      reasons.push("Title match");
    }

    for (const topic of source.topics) {
      if (topic.name.toLowerCase().includes(queryLower)) {
        reasons.push(`Covers topic: ${topic.name}`);
      }
    }

    if (topics) {
      const covered = topics.filter(t =>
        source.topics.some(st => st.name.toLowerCase() === t.toLowerCase())
      );
      if (covered.length > 0) {
        reasons.push(`Related to ${covered.length} of your interests`);
      }
    }

    if (source.metadata.sourceType === "research_paper") {
      reasons.push("Peer-reviewed source");
    }

    return reasons;
  }

  /**
   * Rank by quality
   */
  rankByQuality(sources: ReferenceSource[], limit?: number): RankedSource[] {
    const ranked = sources.map(source => ({
      source,
      score: this.calculateSourceConfidence(source),
      reasons: this.getQualityReasons(source)
    }));

    return ranked
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private getQualityReasons(source: ReferenceSource): string[] {
    const reasons: string[] = [];

    if (source.metadata.sourceType === "research_paper") {
      reasons.push("Research paper (peer-reviewed)");
    } else if (source.metadata.sourceType === "textbook") {
      reasons.push("Textbook (comprehensive)");
    }

    if (source.metadata.doi) {
      reasons.push("Has DOI (verified source)");
    }

    if (source.metadata.quality === "primary") {
      reasons.push("Primary source");
    }

    if (source.chapters.length > 5) {
      reasons.push("Well-structured with chapters");
    }

    if (source.keyCitations.length > 10) {
      reasons.push("Well-cited and referenced");
    }

    return reasons;
  }

  /**
   * Rank for diverse recommendations
   */
  rankForDiversity(
    sources: ReferenceSource[],
    currentSources: ReferenceSource[],
    limit: number = 5
  ): RankedSource[] {
    const currentTypes = new Set(currentSources.map(s => s.metadata.sourceType));
    const currentSubjects = new Set(currentSources.map(s => s.metadata.subject));

    const scored = sources.map(source => {
      let score = 0;

      // Bonus for new source types
      if (!currentTypes.has(source.metadata.sourceType)) {
        score += 0.3;
      }

      // Bonus for new subjects
      if (!currentSubjects.has(source.metadata.subject)) {
        score += 0.2;
      }

      // Quality still matters
      score += source.confidenceScore * 0.4;

      return {
        source,
        score,
        reasons: this.getDiversityReasons(source, currentSources)
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private getDiversityReasons(
    source: ReferenceSource,
    currentSources: ReferenceSource[]
  ): string[] {
    const reasons: string[] = [];

    const currentTypes = new Set(currentSources.map(s => s.metadata.sourceType));
    const currentSubjects = new Set(currentSources.map(s => s.metadata.subject));

    if (!currentTypes.has(source.metadata.sourceType)) {
      reasons.push(`New perspective: ${source.metadata.sourceType}`);
    }

    if (!currentSubjects.has(source.metadata.subject)) {
      reasons.push(`New subject area: ${source.metadata.subject}`);
    }

    return reasons;
  }

  /**
   * Get recommendations based on learning path
   */
  getRecommendationsForLearningPath(
    sources: ReferenceSource[],
    completedTopics: string[],
    nextTopics: string[],
    limit: number = 5
  ): RankedSource[] {
    const completedSet = new Set(completedTopics.map(t => t.toLowerCase()));
    const nextSet = new Set(nextTopics.map(t => t.toLowerCase()));

    const scored = sources.map(source => {
      let score = 0;

      // Matches next topics in learning path
      for (const topic of source.topics) {
        if (nextSet.has(topic.name.toLowerCase())) {
          score += 0.5;
        }
      }

      // Doesn't repeat completed topics too much
      let completedOverlap = 0;
      for (const topic of source.topics) {
        if (completedSet.has(topic.name.toLowerCase())) {
          completedOverlap++;
        }
      }
      score -= (completedOverlap / source.topics.length) * 0.3;

      // Quality bonus
      score += source.confidenceScore * 0.3;

      return {
        source,
        score,
        reasons: this.getLearningPathReasons(source, completedTopics, nextTopics)
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private getLearningPathReasons(
    source: ReferenceSource,
    completed: string[],
    next: string[]
  ): string[] {
    const reasons: string[] = [];

    const matchingNext = next.filter(n =>
      source.topics.some(t => t.name.toLowerCase() === n.toLowerCase())
    );

    if (matchingNext.length > 0) {
      reasons.push(`Advances your learning: covers ${matchingNext.slice(0, 2).join(", ")}`);
    }

    if (source.metadata.sourceType === "textbook") {
      reasons.push("Good for systematic learning");
    }

    if (source.metadata.sourceType === "research_paper") {
      reasons.push("Deepens understanding with research");
    }

    return reasons;
  }

  /**
   * Update ranking criteria
   */
  setCriteria(criteria: Partial<RankingCriteria>): void {
    this.criteria = { ...this.criteria, ...criteria };
  }
}

export interface RankedSource {
  source: ReferenceSource;
  score: number;
  reasons: string[];
}
