// @ts-nocheck
// Study Companion — Learning History Model
// Tracks comprehensive learning history

export interface LearningHistory {
  id: string;
  userId: string;
  entries: HistoryEntry[];
  aggregatedMetrics: AggregatedMetrics;
  milestones: HistoryMilestone[];
  lastUpdated: Date;
}

export interface HistoryEntry {
  id: string;
  date: Date;
  type: HistoryEntryType;
  subject?: string;
  topic?: string;
  subtopic?: string;
  contentId?: string;
  contentType?: string;
  contentTitle?: string;
  duration: number;              // minutes
  result?: LearningResult;
  metadata?: Record<string, any>;
}

export type HistoryEntryType =
  | "study_session"
  | "content_viewed"
  | "content_completed"
  | "quiz_taken"
  | "quiz_passed"
  | "concept_learned"
  | "concept_reviewed"
  | "formula_practiced"
  | "flashcard_reviewed"
  | "exam_taken"
  | "goal_completed"
  | "milestone_reached"
  | "streak_continued";

export interface LearningResult {
  score?: number;                // 0-100
  correctAnswers?: number;
  totalQuestions?: number;
  completionRate?: number;       // 0-100
  masteryLevel?: MasteryLevel;
  timeTaken?: number;           // seconds
  attempts?: number;
}

export type MasteryLevel = "not_started" | "familiar" | "proficient" | "mastered";

export interface AggregatedMetrics {
  totalStudyTime: number;         // minutes
  totalSessions: number;
  totalContentCompleted: number;
  totalQuizzesTaken: number;
  totalConceptsLearned: number;
  averageSessionLength: number;
  averageQuizScore: number;
  currentStreak: number;
  longestStreak: number;
  strongestSubject: string;
  weakestSubject: string;
  mostStudiedSubject: string;
  leastStudiedSubject: string;
}

export interface HistoryMilestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  achievedAt: Date;
  relatedEntry?: string;
}

export type MilestoneType =
  | "first_session"
  | "hour_milestone"
  | "day_streak"
  | "subject_mastery"
  | "quiz_perfect"
  | "content_completion"
  | "topic_coverage";

// Subject-specific history
export interface SubjectHistory {
  subject: string;
  totalTime: number;
  sessions: SubjectSession[];
  contentProgress: ContentProgress[];
  assessments: AssessmentResult[];
  concepts: ConceptHistory[];
  timeline: TimelineEntry[];
}

export interface SubjectSession {
  date: Date;
  sessionId: string;
  duration: number;
  topics: string[];
  productivity: number;
  completedGoals: string[];
}

export interface ContentProgress {
  contentId: string;
  contentType: string;
  title: string;
  startedAt: Date;
  completedAt?: Date;
  completionRate: number;
  totalTime: number;
  attempts: number;
  lastPosition?: number;
}

export interface AssessmentResult {
  assessmentId: string;
  type: "quiz" | "test" | "exam";
  date: Date;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  topics: string[];
  areasForImprovement: string[];
}

export interface ConceptHistory {
  concept: string;
  topic: string;
  firstLearned: Date;
  lastReviewed: Date;
  reviewCount: number;
  masteryLevel: MasteryLevel;
  assessments: {
    date: Date;
    score: number;
  }[];
}

export interface TimelineEntry {
  date: Date;
  type: TimelineEntryType;
  title: string;
  description: string;
  subject?: string;
  topic?: string;
  duration?: number;
  result?: string;
}

export type TimelineEntryType =
  | "study"
  | "learning"
  | "revision"
  | "assessment"
  | "achievement"
  | "goal";

// Concept tracking
export interface ConceptRecord {
  id: string;
  concept: string;
  subject: string;
  topic: string;
  definition?: string;
  examples?: string[];
  relatedConcepts: string[];
  prerequisites: string[];

  // Learning tracking
  firstEncountered: Date;
  firstLearned?: Date;
  mastered?: Date;

  // Review tracking
  reviewHistory: ConceptReview[];
  nextReviewDate?: Date;
  reviewCount: number;

  // Mastery
  masteryLevel: MasteryLevel;
  masteryScore: number;         // 0-100

  // Spaced repetition
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface ConceptReview {
  date: Date;
  result: "correct" | "incorrect" | "partial";
  score: number;
  timeTaken: number;
  method?: "recall" | "recognition" | "application";
}

export interface ConceptGap {
  conceptId: string;
  concept: string;
  subject: string;
  topic: string;
  gapType: GapType;
  severity: GapSeverity;
  evidence: string[];
  blockedConcepts: string[];
  prerequisiteConcepts: string[];
  recommendedReview: {
    contentId: string;
    title: string;
    type: string;
    estimatedTime: number;
  }[];
  estimatedTimeToFill: number;
}

export type GapType =
  | "missing_prerequisite"
  | "forgotten"
  | "misunderstood"
  | "weak_foundation"
  | "incomplete_chapter";

export type GapSeverity = "critical" | "major" | "minor";

// Progress tracking
export interface ProgressRecord {
  date: Date;
  subject?: string;
  topic?: string;
  type: ProgressType;
  value: number;
  previousValue: number;
  change: number;
  context?: string;
}

export type ProgressType =
  | "mastery_score"
  | "completion_rate"
  | "quiz_score"
  | "study_time"
  | "streak"
  | "concept_count";

// Milestone definitions
export const MILESTONE_DEFINITIONS = [
  {
    type: "first_session",
    title: "First Step",
    description: "Completed your first study session",
    threshold: 1,
    metric: "sessions"
  },
  {
    type: "hour_milestone",
    title: "Hour Master",
    description: "Studied for 1 hour total",
    threshold: 60,
    metric: "studyTime"
  },
  {
    type: "day_streak",
    title: "Consistency King",
    description: "Maintained a 7-day study streak",
    threshold: 7,
    metric: "streak"
  },
  {
    type: "quiz_master",
    title: "Quiz Master",
    description: "Completed 10 quizzes",
    threshold: 10,
    metric: "quizzesTaken"
  },
  {
    type: "concept_explorer",
    title: "Concept Explorer",
    description: "Learned 50 concepts",
    threshold: 50,
    metric: "conceptsLearned"
  }
];

// Factory functions
export function createHistoryEntry(
  userId: string,
  type: HistoryEntryType,
  options?: Partial<HistoryEntry>
): HistoryEntry {
  return {
    id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    date: new Date(),
    type,
    duration: 0,
    ...options
  };
}

export function createConceptRecord(
  concept: string,
  subject: string,
  topic: string,
  options?: Partial<ConceptRecord>
): ConceptRecord {
  return {
    id: `concept-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    concept,
    subject,
    topic,
    relatedConcepts: [],
    prerequisites: [],
    firstEncountered: new Date(),
    reviewHistory: [],
    reviewCount: 0,
    masteryLevel: "not_started",
    masteryScore: 0,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    ...options
  };
}

export function createConceptGap(
  conceptId: string,
  concept: string,
  subject: string,
  topic: string,
  gapType: GapType,
  severity: GapSeverity
): ConceptGap {
  return {
    conceptId,
    concept,
    subject,
    topic,
    gapType,
    severity,
    evidence: [],
    blockedConcepts: [],
    prerequisiteConcepts: [],
    recommendedReview: [],
    estimatedTimeToFill: 30
  };
}

export function calculateMasteryScore(
  assessments: { score: number; date: Date }[]
): number {
  if (assessments.length === 0) return 0;

  // Weight recent assessments more heavily
  const weights = assessments.map((_, i) => Math.pow(0.8, assessments.length - 1 - i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const weightedSum = assessments.reduce((sum, a, i) => {
    return sum + a.score * weights[i];
  }, 0);

  return Math.round(weightedSum / totalWeight);
}

export function getSpacedRepetitionInterval(
  concept: ConceptRecord,
  wasCorrect: boolean
): { interval: number; easeFactor: number } {
  let { interval, easeFactor, repetitions } = concept;

  if (wasCorrect) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;

    // Adjust ease factor based on performance
    if (wasCorrect) {
      easeFactor = Math.max(1.3, easeFactor - 0.14);
    }
  } else {
    // Reset on failure
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  return { interval, easeFactor };
}

export function aggregateSubjectHistory(
  entries: HistoryEntry[],
  subject: string
): AggregatedMetrics {
  const subjectEntries = entries.filter(e => e.subject === subject);

  const totalStudyTime = subjectEntries
    .filter(e => e.type === "study_session" || e.type === "content_viewed")
    .reduce((sum, e) => sum + e.duration, 0);

  const totalSessions = subjectEntries
    .filter(e => e.type === "study_session").length;

  const totalContentCompleted = subjectEntries
    .filter(e => e.type === "content_completed").length;

  const quizResults = subjectEntries
    .filter(e => e.type === "quiz_taken" && e.result?.score !== undefined)
    .map(e => e.result!.score!);

  const averageQuizScore = quizResults.length > 0
    ? quizResults.reduce((a, b) => a + b, 0) / quizResults.length
    : 0;

  return {
    totalStudyTime,
    totalSessions,
    totalContentCompleted,
    totalQuizzesTaken: quizResults.length,
    totalConceptsLearned: 0, // Would need concept tracking
    averageSessionLength: totalSessions > 0 ? totalStudyTime / totalSessions : 0,
    averageQuizScore,
    currentStreak: 0,
    longestStreak: 0,
    strongestSubject: subject,
    weakestSubject: subject,
    mostStudiedSubject: subject,
    leastStudiedSubject: subject
  };
}
