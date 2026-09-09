// Adaptive Quiz Engine — KnowledgeGapAnalyzer
// Analyzes and identifies knowledge gaps from quiz performance

import type { QuizResult, QuestionResult, TopicResult } from "../models/QuizResult";
import type { DifficultyLevel, CognitiveLevel } from "../models/Question";
import type { MasteryReport } from "../models/MasteryReport";

export interface KnowledgeGap {
  id: string;
  type: "concept" | "prerequisite" | "skill" | "misconception";
  topic: string;
  subject: string;
  severity: "critical" | "major" | "minor";
  description: string;
  evidence: GapEvidence[];
  impactedAreas: string[];
  rootCauses: string[];
  questionsMissed: string[];
  recommendedActions: RecommendedAction[];
  estimatedReviewTime: number;
  createdAt: Date;
}

export interface GapEvidence {
  type: "question" | "pattern" | "time" | "difficulty";
  description: string;
  questionId?: string;
  data?: any;
}

export interface RecommendedAction {
  type: "review" | "practice" | "tutor" | "formula" | "visual" | "flashcard" | "assessment";
  title: string;
  description: string;
  resourceId?: string;
  priority: number;
  estimatedTime: number;
}

export interface GapAnalysisResult {
  gaps: KnowledgeGap[];
  overallGapScore: number;
  prioritizedTopics: string[];
  recommendations: RecommendedAction[];
  summary: GapAnalysisSummary;
}

export interface GapAnalysisSummary {
  criticalGaps: number;
  majorGaps: number;
  minorGaps: number;
  totalQuestionsWeak: number;
  totalTopicsWeak: number;
  prerequisiteGaps: number;
  misconceptions: number;
}

export interface GapPattern {
  type: "repeated_mistakes" | "difficulty_spike" | "time_overrun" | "topic_cluster" | "cognitive_jump";
  description: string;
  affectedQuestions: string[];
  severity: "critical" | "major" | "minor";
  recommendation: string;
}

export class KnowledgeGapAnalyzer {
  private static instance: KnowledgeGapAnalyzer;
  private gapCache: Map<string, KnowledgeGap[]> = new Map();

  private constructor() {}

  static getInstance(): KnowledgeGapAnalyzer {
    if (!KnowledgeGapAnalyzer.instance) {
      KnowledgeGapAnalyzer.instance = new KnowledgeGapAnalyzer();
    }
    return KnowledgeGapAnalyzer.instance;
  }

  async analyzeResult(result: QuizResult): Promise<GapAnalysisResult> {
    const gaps: KnowledgeGap[] = [];

    // Analyze topic-level gaps
    const topicGaps = this.analyzeTopicGaps(result.topicResults);
    gaps.push(...topicGaps);

    // Analyze difficulty-based gaps
    const difficultyGaps = this.analyzeDifficultyGaps(result.difficultyAnalysis);
    gaps.push(...difficultyGaps);

    // Analyze cognitive-level gaps
    const cognitiveGaps = this.analyzeCognitiveGaps(result.cognitiveResults);
    gaps.push(...cognitiveGaps);

    // Analyze time-based gaps
    const timeGaps = this.analyzeTimeGaps(result.questionResults, result.timeAnalysis);
    gaps.push(...timeGaps);

    // Analyze patterns
    const patternGaps = this.analyzePatterns(result.questionResults);
    gaps.push(...patternGaps);

    // Calculate overall gap score
    const overallGapScore = this.calculateOverallGapScore(gaps);

    // Prioritize topics
    const prioritizedTopics = this.prioritizeTopics(gaps);

    // Generate recommendations
    const recommendations = this.generateRecommendations(gaps);

    // Generate summary
    const summary = this.generateSummary(gaps);

    return {
      gaps,
      overallGapScore,
      prioritizedTopics,
      recommendations,
      summary
    };
  }

  private analyzeTopicGaps(topicResults: TopicResult[]): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    topicResults.forEach(topic => {
      const accuracy = topic.accuracy;
      const totalQuestions = topic.totalQuestions;
      const correctQuestions = topic.correctQuestions;

      // Critical gap: < 40% accuracy with 3+ questions
      if (accuracy < 40 && totalQuestions >= 3) {
        gaps.push({
          id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: "concept",
          topic: topic.topic,
          subject: topic.subject,
          severity: "critical",
          description: `Major knowledge gap in ${topic.topic} with only ${accuracy.toFixed(1)}% accuracy`,
          evidence: [{
            type: "pattern",
            description: `${correctQuestions}/${totalQuestions} questions incorrect`
          }],
          impactedAreas: [topic.topic],
          rootCauses: ["Insufficient foundational knowledge", "Missing prerequisite understanding"],
          questionsMissed: [],
          recommendedActions: this.getTopicRecommendations(topic, "critical"),
          estimatedReviewTime: this.estimateReviewTime(topic.totalQuestions, "critical"),
          createdAt: new Date()
        });
      }
      // Major gap: 40-60% accuracy
      else if (accuracy >= 40 && accuracy < 60) {
        gaps.push({
          id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: "concept",
          topic: topic.topic,
          subject: topic.subject,
          severity: "major",
          description: `Moderate weakness in ${topic.topic} with ${accuracy.toFixed(1)}% accuracy`,
          evidence: [{
            type: "pattern",
            description: `${correctQuestions}/${totalQuestions} questions correct`
          }],
          impactedAreas: [topic.topic],
          rootCauses: ["Partial understanding", "Some misconceptions present"],
          questionsMissed: [],
          recommendedActions: this.getTopicRecommendations(topic, "major"),
          estimatedReviewTime: this.estimateReviewTime(topic.totalQuestions, "major"),
          createdAt: new Date()
        });
      }
      // Minor gap: 60-75% accuracy
      else if (accuracy >= 60 && accuracy < 75) {
        gaps.push({
          id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: "skill",
          topic: topic.topic,
          subject: topic.subject,
          severity: "minor",
          description: `Minor improvement needed in ${topic.topic}`,
          evidence: [{
            type: "pattern",
            description: `${accuracy.toFixed(1)}% accuracy suggests room for improvement`
          }],
          impactedAreas: [topic.topic],
          rootCauses: ["Minor gaps in understanding", "Need more practice"],
          questionsMissed: [],
          recommendedActions: this.getTopicRecommendations(topic, "minor"),
          estimatedReviewTime: this.estimateReviewTime(topic.totalQuestions, "minor"),
          createdAt: new Date()
        });
      }
    });

    return gaps;
  }

  private analyzeDifficultyGaps(analysis: any): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    if (!analysis || !analysis.questionsByDifficulty) return gaps;

    Object.entries(analysis.questionsByDifficulty).forEach(([difficulty, data]: [string, any]) => {
      if (data.total > 0 && data.accuracy < 50) {
        gaps.push({
          id: `gap_diff_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: "skill",
          topic: `${difficulty} level questions`,
          subject: "all",
          severity: data.accuracy < 30 ? "critical" : "major",
          description: `Struggling with ${difficulty} difficulty questions (${data.accuracy.toFixed(1)}% accuracy)`,
          evidence: [{
            type: "difficulty",
            description: `${data.correct}/${data.total} correct at ${difficulty} level`
          }],
          impactedAreas: [],
          rootCauses: [`Difficulty with ${difficulty}-level content`],
          questionsMissed: [],
          recommendedActions: this.getDifficultyRecommendations(difficulty as DifficultyLevel, data.accuracy),
          estimatedReviewTime: 30,
          createdAt: new Date()
        });
      }
    });

    return gaps;
  }

  private analyzeCognitiveGaps(cognitiveResults: any[]): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    const cognitiveLevels: CognitiveLevel[] = ["remember", "understand", "apply", "analyze", "evaluate", "create"];

    cognitiveResults.forEach(result => {
      if (result.totalQuestions >= 2 && result.accuracy < 60) {
        const levelIndex = cognitiveLevels.indexOf(result.level);

        // If struggling with higher cognitive levels
        if (levelIndex >= 3 && result.accuracy < 70) {
          gaps.push({
            id: `gap_cog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: "skill",
            topic: `${result.level} skills`,
            subject: "all",
            severity: result.accuracy < 50 ? "major" : "minor",
            description: `Need to strengthen ${result.level} abilities`,
            evidence: [{
              type: "pattern",
              description: `${result.accuracy.toFixed(1)}% accuracy at ${result.level} level`
            }],
            impactedAreas: [],
            rootCauses: [`Limited experience with ${result.level} questions`],
            questionsMissed: [],
            recommendedActions: this.getCognitiveRecommendations(result.level, result.accuracy),
            estimatedReviewTime: 20,
            createdAt: new Date()
          });
        }
      }
    });

    return gaps;
  }

  private analyzeTimeGaps(questionResults: QuestionResult[], timeAnalysis: any): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    // Find questions with abnormally high time but incorrect
    const slowIncorrect = questionResults.filter(q =>
      !q.isCorrect && q.timeSpent > timeAnalysis.averageTimePerQuestion * 1.5
    );

    if (slowIncorrect.length > 0) {
      slowIncorrect.forEach(q => {
        gaps.push({
          id: `gap_time_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: "concept",
          topic: q.question.metadata.topic,
          subject: q.question.metadata.subject,
          severity: "minor",
          description: `Spent significant time but answer was incorrect`,
          evidence: [{
            type: "time",
            description: `Took ${q.timeSpent}s (avg: ${timeAnalysis.averageTimePerQuestion.toFixed(0)}s)`
          }],
          impactedAreas: [q.question.metadata.topic],
          rootCauses: ["Possibly guessed after overthinking", "Misapplied concepts"],
          questionsMissed: [q.questionId],
          recommendedActions: [{
            type: "review",
            title: "Review this topic",
            description: "Go back to fundamentals",
            priority: 2,
            estimatedTime: 15
          }],
          estimatedReviewTime: 15,
          createdAt: new Date()
        });
      });
    }

    return gaps;
  }

  private analyzePatterns(questionResults: QuestionResult[]): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];

    // Find repeated mistakes on similar topics
    const mistakesByTopic = new Map<string, QuestionResult[]>();

    questionResults.forEach(q => {
      if (!q.isCorrect) {
        const topic = q.question.metadata.topic;
        if (!mistakesByTopic.has(topic)) {
          mistakesByTopic.set(topic, []);
        }
        mistakesByTopic.get(topic)!.push(q);
      }
    });

    mistakesByTopic.forEach((mistakes, topic) => {
      if (mistakes.length >= 2) {
        gaps.push({
          id: `gap_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: "misconception",
          topic,
          subject: mistakes[0].question.metadata.subject,
          severity: mistakes.length >= 3 ? "critical" : "major",
          description: `Repeated mistakes in ${topic} suggest a misconception`,
          evidence: mistakes.map(m => ({
            type: "question",
            description: `Question missed`,
            questionId: m.questionId
          })),
          impactedAreas: [topic],
          rootCauses: ["Possible misconception", "Fundamental misunderstanding"],
          questionsMissed: mistakes.map(m => m.questionId),
          recommendedActions: this.getMisconceptionRecommendations(topic),
          estimatedReviewTime: this.estimateReviewTime(mistakes.length * 2, "major"),
          createdAt: new Date()
        });
      }
    });

    return gaps;
  }

  private calculateOverallGapScore(gaps: KnowledgeGap[]): number {
    if (gaps.length === 0) return 0;

    let weightedScore = 0;
    let totalWeight = 0;

    gaps.forEach(gap => {
      const weight = gap.severity === "critical" ? 3 : (gap.severity === "major" ? 2 : 1);
      weightedScore += weight;
      totalWeight += weight;
    });

    return (weightedScore / (gaps.length * 3)) * 100;
  }

  private prioritizeTopics(gaps: KnowledgeGap[]): string[] {
    return gaps
      .filter(g => g.severity === "critical")
      .map(g => g.topic)
      .concat(gaps.filter(g => g.severity === "major").map(g => g.topic))
      .concat(gaps.filter(g => g.severity === "minor").map(g => g.topic));
  }

  private generateRecommendations(gaps: KnowledgeGap[]): RecommendedAction[] {
    const recommendations: RecommendedAction[] = [];

    gaps.forEach(gap => {
      recommendations.push(...gap.recommendedActions);
    });

    // Deduplicate and sort by priority
    const unique = new Map<string, RecommendedAction>();
    recommendations.forEach(rec => {
      const key = `${rec.type}_${rec.title}`;
      if (!unique.has(key) || unique.get(key)!.priority > rec.priority) {
        unique.set(key, rec);
      }
    });

    return Array.from(unique.values()).sort((a, b) => a.priority - b.priority);
  }

  private generateSummary(gaps: KnowledgeGap[]): GapAnalysisSummary {
    return {
      criticalGaps: gaps.filter(g => g.severity === "critical").length,
      majorGaps: gaps.filter(g => g.severity === "major").length,
      minorGaps: gaps.filter(g => g.severity === "minor").length,
      totalQuestionsWeak: gaps.reduce((sum, g) => sum + g.questionsMissed.length, 0),
      totalTopicsWeak: new Set(gaps.map(g => g.topic)).size,
      prerequisiteGaps: gaps.filter(g => g.type === "prerequisite").length,
      misconceptions: gaps.filter(g => g.type === "misconception").length
    };
  }

  private getTopicRecommendations(topic: TopicResult, severity: "critical" | "major" | "minor"): RecommendedAction[] {
    const actions: RecommendedAction[] = [];

    if (severity === "critical") {
      actions.push({
        type: "tutor",
        title: "Schedule AI Tutor session",
        description: "Get personalized help on this topic",
        priority: 1,
        estimatedTime: 30
      });
      actions.push({
        type: "review",
        title: "Review fundamentals",
        description: "Go back to basic concepts",
        priority: 2,
        estimatedTime: 45
      });
      actions.push({
        type: "practice",
        title: "Targeted practice",
        description: "Practice more questions on this topic",
        priority: 3,
        estimatedTime: 30
      });
    } else if (severity === "major") {
      actions.push({
        type: "practice",
        title: "More practice questions",
        description: "Strengthen understanding through practice",
        priority: 1,
        estimatedTime: 20
      });
      actions.push({
        type: "flashcard",
        title: "Create flashcards",
        description: "Review key concepts",
        priority: 2,
        estimatedTime: 10
      });
    } else {
      actions.push({
        type: "practice",
        title: "Light review",
        description: "Quick refresher on the topic",
        priority: 1,
        estimatedTime: 10
      });
    }

    return actions;
  }

  private getDifficultyRecommendations(difficulty: DifficultyLevel, accuracy: number): RecommendedAction[] {
    return [{
      type: "practice",
      title: `Practice ${difficulty} questions`,
      description: `Build confidence at ${difficulty} level`,
      priority: 1,
      estimatedTime: 20
    }];
  }

  private getCognitiveRecommendations(level: CognitiveLevel, accuracy: number): RecommendedAction[] {
    const levelNames: Record<CognitiveLevel, string> = {
      remember: "Recall",
      understand: "Understanding",
      apply: "Application",
      analyze: "Analysis",
      evaluate: "Evaluation",
      create: "Creation"
    };

    return [{
      type: "practice",
      title: `Practice ${levelNames[level]} skills`,
      description: `Strengthen your ${level} abilities`,
      priority: 1,
      estimatedTime: 25
    }];
  }

  private getMisconceptionRecommendations(topic: string): RecommendedAction[] {
    return [
      {
        type: "tutor",
        title: "Clarify misconceptions",
        description: "Work with AI Tutor to clear up misunderstandings",
        priority: 1,
        estimatedTime: 30
      },
      {
        type: "visual",
        title: "Use visual explanations",
        description: "Watch video explanations of this topic",
        priority: 2,
        estimatedTime: 15
      },
      {
        type: "practice",
        title: "Targeted practice",
        description: "Apply the corrected understanding",
        priority: 3,
        estimatedTime: 20
      }
    ];
  }

  private estimateReviewTime(questionsMissed: number, severity: "critical" | "major" | "minor"): number {
    const baseTime = {
      critical: 45,
      major: 25,
      minor: 15
    };
    return baseTime[severity] + (questionsMissed * 5);
  }

  getGapsForUser(userId: string): KnowledgeGap[] {
    return this.gapCache.get(userId) || [];
  }

  clearCache(): void {
    this.gapCache.clear();
  }

  destroy(): void {
    this.gapCache.clear();
    KnowledgeGapAnalyzer.instance = null as any;
  }
}

export default KnowledgeGapAnalyzer;
