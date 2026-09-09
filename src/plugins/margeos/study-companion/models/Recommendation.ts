// @ts-nocheck
// Study Companion — Recommendation Model
// Defines personalized learning recommendations

export interface Recommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  subtype?: string;
  priority: number;                // 1-10
  title: string;
  description: string;
  reason: RecommendationReason;
  source: RecommendationSource;
  subject?: string;
  topic?: string;
  subtopic?: string;
  content?: ContentReference;
  estimatedTime: number;           // minutes
  difficulty?: "beginner" | "intermediate" | "advanced" | "adaptive";
  benefits: string[];
  prerequisites: string[];
  deadline?: Date;
  validUntil?: Date;
  completed: boolean;
  dismissed: boolean;
  completedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export type RecommendationType =
  | "lesson"
  | "revision"
  | "practice"
  | "assessment"
  | "break"
  | "exploration"
  | "deep_dive"
  | "quick_review"
  | "spaced_review"
  | "challenge"
  | "review_gap";

export type RecommendationReason =
  | "weak_performance"
  | "knowledge_gap"
  | "spaced_repetition"
  | "goal_alignment"
  | "learning_style_match"
  | "time_optimization"
  | "streak_continuation"
  | "topic_connection"
  | "difficulty_progression"
  | "student_preference"
  | "performance_improvement"
  | "neglected_topic";

export interface RecommendationSource {
  type: "algorithm" | "teacher" | "peer" | "system" | "student_request";
  confidence: number;              // 0-100
  triggeredBy?: string;
}

export interface ContentReference {
  id: string;
  type: "pdf" | "tutor" | "formula" | "reference" | "visual" | "quiz" | "flashcard" | "exam" | "lesson" | "video";
  title: string;
  engine?: string;
  url?: string;
}

export interface RecommendationTemplate {
  type: RecommendationType;
  title: string;
  description: string;
  benefits: string[];
  estimatedTime: number;
  priority: number;
  conditions: RecommendationCondition[];
}

export interface RecommendationCondition {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "in";
  value: any;
}

export interface RecommendationCategory {
  name: string;
  description: string;
  types: RecommendationType[];
  icon?: string;
  color?: string;
}

export interface RecommendationResponse {
  recommendationId: string;
  action: "accepted" | "dismissed" | "snoozed" | "completed";
  feedback?: string;
  actualTimeSpent?: number;
  helpful?: boolean;
  timestamp: Date;
}

export interface RecommendationAnalytics {
  totalGenerated: number;
  totalAccepted: number;
  totalDismissed: number;
  acceptanceRate: number;
  averageCompletionTime: number;
  topPerformingType: RecommendationType;
  improvementRate: number;        // How recommendations improved performance
}

export interface RecommendationBatch {
  id: string;
  userId: string;
  recommendations: Recommendation[];
  generatedAt: Date;
  context: BatchContext;
  totalEstimatedTime: number;
}

export interface BatchContext {
  currentSubject?: string;
  currentGoal?: string;
  sessionType?: "study" | "review" | "practice" | "assessment";
  availableTime?: number;
  energyLevel?: "low" | "medium" | "high";
}

// Personalized Recommendation Engine Types
export interface PersonalizationFactors {
  learningStyle: LearningStyleMatch[];
  preferredTimes: TimePreference[];
  energyPatterns: EnergyPattern[];
  contentPreferences: ContentPreference[];
  pacePreference: "slow" | "moderate" | "fast";
}

export interface LearningStyleMatch {
  style: "visual" | "auditory" | "reading" | "kinesthetic";
  matchScore: number;             // 0-100
  contentTypes: string[];
}

export interface TimePreference {
  timeSlot: string;               // HH:mm-HH:mm
  productivity: number;           // 0-100
  subjectAffinities: string[];
}

export interface EnergyPattern {
  timeSlot: string;
  energyLevel: "low" | "medium" | "high";
  recommendedActivities: RecommendationType[];
}

export interface ContentPreference {
  contentType: string;
  frequency: number;
  successRate: number;
  averageTimeSpent: number;
}

// Goal-based Recommendations
export interface GoalRecommendation extends Recommendation {
  goalId: string;
  goalTitle: string;
  alignmentScore: number;         // How well this supports the goal
  progressImpact: number;         // Estimated progress impact
}

export interface MilestoneRecommendation extends Recommendation {
  milestoneId: string;
  currentProgress: number;
  targetProgress: number;
}

// Spaced Repetition
export interface SpacedRepetitionRecommendation extends Recommendation {
  concept: string;
  subject: string;
  lastReviewed: Date;
  optimalReviewDate: Date;
  decayScore: number;             // How much forgotten (0-100)
  retentionProbability: number;   // Current retention (0-100)
  intervals: number[];           // Previous review intervals
}

export interface KnowledgeDecay {
  concept: string;
  subject: string;
  lastReviewed: Date;
  expectedRetention: number;      // 0-100
  decayRate: number;
  nextOptimalReview: Date;
}

// Gap-based Recommendations
export interface GapRecommendation extends Recommendation {
  gapType: "prerequisite" | "weakness" | "forgotten" | "misunderstanding";
  severity: "critical" | "major" | "minor";
  blockedConcepts: string[];
  estimatedTimeToFill: number;
}

export interface KnowledgeGap {
  id: string;
  concept: string;
  subject: string;
  topic: string;
  severity: "critical" | "major" | "minor";
  detectedAt: Date;
  evidence: string[];
  blockedConcepts: string[];
  resolutionStrategy?: string;
}

// Quick Recommendations
export interface QuickRecommendation {
  type: "micro_lesson" | "flash_review" | "stretch_break" | "motivation";
  duration: number;               // seconds for quick actions
  title: string;
  action: string;
  icon?: string;
}

// Recommendation Filters
export interface RecommendationFilter {
  types?: RecommendationType[];
  subjects?: string[];
  minPriority?: number;
  maxEstimatedTime?: number;
  includeCompleted?: boolean;
  includeDismissed?: boolean;
  validOnly?: boolean;
}

export interface RecommendationSort {
  field: "priority" | "createdAt" | "estimatedTime" | "reason";
  direction: "asc" | "desc";
}

// Factory functions
export function createRecommendation(
  userId: string,
  type: RecommendationType,
  title: string,
  description: string,
  reason: RecommendationReason,
  options?: Partial<Recommendation>
): Recommendation {
  return {
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    priority: 5,
    title,
    description,
    reason,
    source: {
      type: "algorithm",
      confidence: 75
    },
    estimatedTime: 15,
    benefits: [],
    prerequisites: [],
    completed: false,
    dismissed: false,
    createdAt: new Date(),
    ...options
  };
}

export function createSpacedRepetitionRecommendation(
  userId: string,
  concept: string,
  subject: string,
  lastReviewed: Date,
  options?: Partial<SpacedRepetitionRecommendation>
): SpacedRepetitionRecommendation {
  const now = new Date();
  const daysSinceReview = Math.floor((now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24));

  // Simplified decay calculation
  const decayScore = Math.min(100, daysSinceReview * 15);
  const retentionProbability = Math.max(0, 100 - decayScore);

  return {
    id: `sr-rec-${Date.now()}`,
    userId,
    type: "spaced_review",
    subtype: "memory_boost",
    priority: retentionProbability < 50 ? 8 : 5,
    title: `Review: ${concept}`,
    description: `Time to reinforce your knowledge of ${concept}.`,
    reason: "spaced_repetition",
    source: {
      type: "algorithm",
      confidence: 90
    },
    subject,
    topic: concept,
    estimatedTime: 10,
    completed: false,
    dismissed: false,
    createdAt: new Date(),
    concept,
    lastReviewed,
    optimalReviewDate: lastReviewed,
    decayScore,
    retentionProbability,
    intervals: [],
    ...options
  } as SpacedRepetitionRecommendation;
}

export function createGapRecommendation(
  userId: string,
  gap: KnowledgeGap,
  options?: Partial<GapRecommendation>
): GapRecommendation {
  return {
    id: `gap-rec-${Date.now()}`,
    userId,
    type: "review_gap",
    priority: gap.severity === "critical" ? 9 : gap.severity === "major" ? 7 : 5,
    title: `Fill Gap: ${gap.concept}`,
    description: `Review ${gap.concept} to strengthen your foundation.`,
    reason: "knowledge_gap",
    source: {
      type: "algorithm",
      confidence: 85
    },
    subject: gap.subject,
    topic: gap.topic,
    estimatedTime: gap.estimatedTimeToFill || 20,
    benefits: ["Stronger foundation", "Better understanding of advanced topics"],
    prerequisites: [],
    completed: false,
    dismissed: false,
    createdAt: new Date(),
    gapType: gap.severity === "critical" ? "prerequisite" : "weakness",
    severity: gap.severity,
    blockedConcepts: gap.blockedConcepts,
    estimatedTimeToFill: gap.estimatedTimeToFill || 20,
    ...options
  } as GapRecommendation;
}

// Predefined templates
export const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  {
    type: "revision",
    title: "Quick Review",
    description: "Reinforce previously learned material",
    benefits: ["Better retention", "Stronger connections"],
    estimatedTime: 10,
    priority: 6,
    conditions: []
  },
  {
    type: "practice",
    title: "Practice Session",
    description: "Apply your knowledge with exercises",
    benefits: ["Skill development", "Confidence building"],
    estimatedTime: 20,
    priority: 7,
    conditions: []
  },
  {
    type: "spaced_review",
    title: "Memory Boost",
    description: "Review concepts before you forget them",
    benefits: ["Combat forgetting", "Long-term retention"],
    estimatedTime: 10,
    priority: 8,
    conditions: []
  },
  {
    type: "deep_dive",
    title: "Deep Dive",
    description: "Explore a topic in greater depth",
    benefits: ["Comprehensive understanding", "Expert knowledge"],
    estimatedTime: 45,
    priority: 5,
    conditions: []
  }
];
