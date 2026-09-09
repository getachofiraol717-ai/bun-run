// @ts-nocheck
// Study Companion — Subject Performance Model
// Tracks and analyzes subject-level performance

export interface SubjectPerformance {
  subject: string;
  category: SubjectCategory;
  metrics: PerformanceMetrics;
  timeline: TimelineData[];
  comparisons: SubjectComparison[];
  insights: SubjectInsight[];
  recommendations: SubjectRecommendation[];
  lastUpdated: Date;
}

export type SubjectCategory =
  | "science"
  | "mathematics"
  | "languages"
  | "humanities"
  | "arts"
  | "technology"
  | "business"
  | "other";

export interface PerformanceMetrics {
  totalTimeSpent: number;        // minutes
  sessionsCount: number;
  averageSessionLength: number;   // minutes
  contentCompleted: number;
  quizzesTaken: number;
  quizzesPassed: number;
  averageQuizScore: number;      // 0-100
  practiceAttempts: number;
  practiceAccuracy: number;       // 0-100
  conceptMastery: number;         // 0-100
  improvementRate: number;        // -100 to 100
  consistencyScore: number;       // 0-100
  engagementScore: number;       // 0-100
}

export interface TimelineData {
  date: Date;
  timeSpent: number;             // minutes
  sessions: number;
  contentCompleted: number;
  quizScore?: number;
  topicsCovered: string[];
}

export interface SubjectComparison {
  comparedSubject: string;
  metric: keyof PerformanceMetrics;
  difference: number;
  percentageDifference: number;
  trend: "ahead" | "behind" | "similar";
}

export interface SubjectInsight {
  id: string;
  type: "strength" | "weakness" | "opportunity" | "risk" | "pattern";
  title: string;
  description: string;
  evidence: string[];
  severity: "low" | "medium" | "high";
  actionable: boolean;
}

export interface SubjectRecommendation {
  id: string;
  type: "focus" | "revision" | "practice" | "skip" | "deepen" | "explore";
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  estimatedTime: number;         // minutes
  reasons: string[];
}

export interface TopicPerformance {
  topic: string;
  subject: string;
  metrics: TopicMetrics;
  subtopics: SubtopicPerformance[];
  questions: QuestionAnalysis[];
  history: TopicHistoryEntry[];
  mastery: MasteryLevel;
  trend: PerformanceTrend;
  lastStudied?: Date;
}

export interface TopicMetrics {
  timesStudied: number;
  totalTime: number;            // minutes
  contentViewed: number;
  exercisesAttempted: number;
  exercisesCorrect: number;
  quizzesTaken: number;
  averageScore: number;
  masteryScore: number;          // 0-100
}

export interface SubtopicPerformance {
  name: string;
  topic: string;
  status: SubtopicStatus;
  score: number;
  attempts: number;
  lastAttempt?: Date;
}

export type SubtopicStatus = "not_started" | "learning" | "practicing" | "mastered" | "needs_review";

export interface QuestionAnalysis {
  questionId: string;
  topic: string;
  subtopic?: string;
  correct: boolean;
  timeSpent: number;
  attempts: number;
  hintsUsed: number;
  difficulty: "easy" | "medium" | "hard";
  date: Date;
}

export interface TopicHistoryEntry {
  date: Date;
  activity: "study" | "practice" | "quiz" | "review";
  duration: number;
  result?: {
    score?: number;
    correct?: number;
    total?: number;
  };
}

export type PerformanceTrend = "improving" | "stable" | "declining" | "volatile";

export type MasteryLevel = "novice" | "beginner" | "intermediate" | "advanced" | "expert";

export interface LearningPattern {
  id: string;
  name: string;
  type: "time" | "content" | "method" | "session";
  description: string;
  data: PatternData;
  confidence: number;            // 0-100
  lastDetected: Date;
}

export interface PatternData {
  mostProductiveTime?: string;   // HH:mm
  averageSessionLength?: number;
  preferredBreakFrequency?: number;
  mostStudiedDays?: string[];    // ["Monday", "Tuesday", ...]
  contentPreferences?: ContentPreference[];
  studyVelocity?: number;        // content per hour
  focusQuality?: number;         // 0-100
}

export interface ContentPreference {
  contentType: string;
  frequency: number;
  averageTimeSpent: number;
  completionRate: number;
}

export interface KnowledgeStrength {
  concept: string;
  subject: string;
  topic: string;
  strength: number;              // 0-100
  evidence: string[];
  lastDemonstrated: Date;
}

export interface KnowledgeWeakness {
  concept: string;
  subject: string;
  topic: string;
  weakness: number;              // 0-100
  evidence: string[];
  prerequisites?: string[];
  recommendedReview?: string[];
}

export interface KnowledgeGap {
  gap: string;
  subject: string;
  topic: string;
  severity: "critical" | "major" | "minor";
  blockedConcepts: string[];
  recommendedAction: string;
  estimatedTimeToClose: number; // minutes
}

export interface PerformanceReport {
  id: string;
  userId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: ReportSummary;
  subjects: SubjectPerformance[];
  overallMetrics: OverallMetrics;
  achievements: Achievement[];
  trends: TrendAnalysis[];
  recommendations: Recommendation[];
}

export interface ReportSummary {
  totalStudyTime: number;
  sessionsCompleted: number;
  goalsAchieved: number;
  averageProgress: number;
  standoutAchievement: string;
}

export interface OverallMetrics {
  totalStudyTime: number;
  totalSessions: number;
  averageSessionLength: number;
  currentStreak: number;
  longestStreak: number;
  totalContentCompleted: number;
  overallMastery: number;
  strongestSubject: string;
  weakestSubject: string;
  mostImproved: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: "milestone" | "streak" | "mastery" | "consistency" | "improvement";
  earnedAt: Date;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface TrendAnalysis {
  metric: string;
  direction: "up" | "down" | "stable";
  change: number;
  explanation: string;
}

// Factory functions
export function createDefaultSubjectPerformance(
  subject: string,
  category: SubjectCategory
): SubjectPerformance {
  return {
    subject,
    category,
    metrics: {
      totalTimeSpent: 0,
      sessionsCount: 0,
      averageSessionLength: 0,
      contentCompleted: 0,
      quizzesTaken: 0,
      quizzesPassed: 0,
      averageQuizScore: 0,
      practiceAttempts: 0,
      practiceAccuracy: 0,
      conceptMastery: 0,
      improvementRate: 0,
      consistencyScore: 0,
      engagementScore: 0
    },
    timeline: [],
    comparisons: [],
    insights: [],
    recommendations: [],
    lastUpdated: new Date()
  };
}

export function calculateMasteryLevel(score: number): MasteryLevel {
  if (score >= 90) return "expert";
  if (score >= 75) return "advanced";
  if (score >= 50) return "intermediate";
  if (score >= 25) return "beginner";
  return "novice";
}

export function calculatePerformanceTrend(
  history: { score: number; date: Date }[]
): PerformanceTrend {
  if (history.length < 3) return "stable";

  const recent = history.slice(-3).map(h => h.score);
  const older = history.slice(-6, -3).map(h => h.score);

  if (older.length === 0) return "stable";

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  const change = ((recentAvg - olderAvg) / olderAvg) * 100;

  if (change > 10) return "improving";
  if (change < -10) return "declining";

  // Check volatility
  const variance = recent.reduce((sum, s) => sum + Math.pow(s - recentAvg, 2), 0) / recent.length;
  if (variance > 100) return "volatile";

  return "stable";
}

export function identifySubjectCategory(subject: string): SubjectCategory {
  const scienceKeywords = ["physics", "chemistry", "biology", "science", "anatomy", "physiology"];
  const mathKeywords = ["math", "algebra", "calculus", "geometry", "statistics", "probability"];
  const languageKeywords = ["english", "spanish", "french", "german", "chinese", "japanese", "language", "grammar"];
  const humanitiesKeywords = ["history", "geography", "philosophy", "psychology", "sociology"];
  const artsKeywords = ["art", "music", "design", "drawing", "painting"];
  const techKeywords = ["programming", "computer", "coding", "software", "technology", "IT"];
  const businessKeywords = ["business", "economics", "finance", "marketing", "management"];

  const lower = subject.toLowerCase();

  if (techKeywords.some(k => lower.includes(k))) return "technology";
  if (mathKeywords.some(k => lower.includes(k))) return "mathematics";
  if (scienceKeywords.some(k => lower.includes(k))) return "science";
  if (languageKeywords.some(k => lower.includes(k))) return "languages";
  if (humanitiesKeywords.some(k => lower.includes(k))) return "humanities";
  if (artsKeywords.some(k => lower.includes(k))) return "arts";
  if (businessKeywords.some(k => lower.includes(k))) return "business";

  return "other";
}
