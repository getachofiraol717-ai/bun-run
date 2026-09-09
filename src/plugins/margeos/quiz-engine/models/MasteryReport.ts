// Adaptive Quiz Engine — MasteryReport Model
// Student mastery tracking and reporting data structures

import type { DifficultyLevel } from "./Question";

export type MasteryLevel = "not_started" | "introductory" | "developing" | "proficient" | "mastered" | "expert";

export type MasteryCategory = "concept" | "skill" | "topic" | "chapter" | "subject" | "formula";

export interface MasteryScore {
  current: number;
  previous?: number;
  change: number;
  trend: "improving" | "stable" | "declining";
}

export interface MasteryBreakdown {
  byCategory: Record<MasteryCategory, number>;
  bySubject: Record<string, number>;
  byChapter: Record<string, number>;
  byTopic: Record<string, number>;
  overall: number;
}

export interface ConceptMastery {
  conceptId: string;
  conceptName: string;
  category: MasteryCategory;
  score: MasteryScore;
  level: MasteryLevel;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  timeToMastery?: number;
  prerequisites: string[];
  dependents: string[];
  lastPracticed?: Date;
  masteredAt?: Date;
  weakAreas: string[];
  strongAreas: string[];
  recommendedPractice: string[];
  relatedSkills: string[];
}

export interface SkillMastery {
  skillId: string;
  skillName: string;
  category: MasteryCategory;
  description: string;
  score: MasteryScore;
  level: MasteryLevel;
  components: SkillComponent[];
  applications: string[];
  prerequisites: string[];
  nextLevelRequirements: {
    accuracy: number;
    questionsRequired: number;
    timeRequirement?: number;
  };
  masteredAt?: Date;
  practiceStreak: number;
  decayInfo?: MasteryDecay;
}

export interface SkillComponent {
  componentId: string;
  name: string;
  mastered: boolean;
  accuracy: number;
  questionsAttempted: number;
}

export interface MasteryDecay {
  enabled: boolean;
  decayRate: number;
  decayStartDays: number;
  lastReviewed?: Date;
  decayPercentage: number;
  reviewNeeded: boolean;
}

export interface FormulaMastery {
  formulaId: string;
  formulaName: string;
  formula: string;
  variables: string[];
  score: MasteryScore;
  level: MasteryLevel;
  understanding: {
    definition: number;
    purpose: number;
    application: number;
    derivation: number;
  };
  practiceHistory: Array<{
    date: Date;
    score: number;
    type: "calculation" | "application" | "derivation" | "identification";
  }>;
  commonMistakes: string[];
  relatedFormulas: string[];
  applications: string[];
  masteredAt?: Date;
}

export interface ChapterMastery {
  chapterId: string;
  chapterName: string;
  subject: string;
  score: MasteryScore;
  level: MasteryLevel;
  topics: TopicMastery[];
  overallProgress: number;
  prerequisites: string[];
  estimatedCompletion?: Date;
  completionPercentage: number;
}

export interface TopicMastery {
  topicId: string;
  topicName: string;
  score: MasteryScore;
  level: MasteryLevel;
  concepts: string[];
  skills: string[];
  formulas: string[];
  questionsAttempted: number;
  accuracy: number;
  timeSpent: number;
  weakAreas: WeakArea[];
  resourcesCompleted: string[];
}

export interface WeakArea {
  areaId: string;
  description: string;
  severity: "critical" | "major" | "minor";
  questionsMissed: number;
  relatedTopics: string[];
  improvement: number;
  recommendedActions: string[];
}

export interface SubjectMastery {
  subjectId: string;
  subjectName: string;
  score: MasteryScore;
  level: MasteryLevel;
  chapters: ChapterMastery[];
  overallProgress: number;
  strengthAreas: string[];
  improvementAreas: string[];
  projectedMasteryDate?: Date;
  studyRecommendations: string[];
}

export interface MasteryGoal {
  goalId: string;
  targetId: string;
  targetType: MasteryCategory;
  targetScore: number;
  currentScore: number;
  deadline?: Date;
  priority: "high" | "medium" | "low";
  achieved: boolean;
  achievedAt?: Date;
}

export interface MasteryPrediction {
  targetId: string;
  targetType: MasteryCategory;
  currentLevel: MasteryLevel;
  predictedLevel: MasteryLevel;
  predictedDate?: Date;
  confidence: number;
  factors: PredictionFactor[];
  requiredPractice: {
    questionsPerDay: number;
    daysToMastery: number;
    recommendedIntensity: "light" | "moderate" | "intensive";
  };
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  direction: "positive" | "negative" | "neutral";
}

export interface MasteryReport {
  id: string;
  userId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: MasteryReportSummary;
  breakdown: MasteryBreakdown;
  conceptMasteries: ConceptMastery[];
  skillMasteries: SkillMastery[];
  formulaMasteries: FormulaMastery[];
  topicMasteries: TopicMastery[];
  chapterMasteries: ChapterMastery[];
  subjectMasteries: SubjectMastery[];
  goals: MasteryGoal[];
  predictions: MasteryPrediction[];
  insights: MasteryInsight[];
  recommendations: MasteryRecommendation[];
}

export interface MasteryReportSummary {
  overallMastery: number;
  level: MasteryLevel;
  conceptsMastered: number;
  skillsMastered: number;
  formulasMastered: number;
  topicsMastered: number;
  chaptersCompleted: number;
  subjectsProgress: number;
  averageAccuracy: number;
  totalStudyTime: number;
  totalQuestions: number;
  improvementRate: number;
  strengths: string[];
  focusAreas: string[];
}

export interface MasteryInsight {
  type: "strength" | "weakness" | "pattern" | "opportunity" | "warning";
  title: string;
  description: string;
  evidence: string[];
  impact: "high" | "medium" | "low";
  relatedAreas: string[];
}

export interface MasteryRecommendation {
  type: "practice" | "review" | "advance" | "strengthen" | "remediate";
  priority: "urgent" | "high" | "medium" | "low";
  targetId: string;
  targetType: MasteryCategory;
  title: string;
  description: string;
  estimatedTime: number;
  resources: Resource[];
  successCriteria: string[];
}

export interface Resource {
  type: "pdf" | "video" | "tutor" | "flashcard" | "quiz" | "practice" | "article";
  id: string;
  title: string;
  url?: string;
  estimatedTime?: number;
  difficulty?: DifficultyLevel;
}

export interface MasteryTrend {
  targetId: string;
  targetType: MasteryCategory;
  dataPoints: Array<{
    date: Date;
    score: number;
    level: MasteryLevel;
  }>;
  trendDirection: "improving" | "stable" | "declining";
  volatility: number;
  projectedScore?: number;
}

export interface MasteryComparison {
  targetId: string;
  targetType: MasteryCategory;
  userScore: number;
  peerAverage?: number;
  percentile?: number;
  rank?: number;
  comparisonPeriod: string;
}

export function calculateMasteryLevel(score: number): MasteryLevel {
  if (score >= 95) return "expert";
  if (score >= 85) return "mastered";
  if (score >= 70) return "proficient";
  if (score >= 50) return "developing";
  if (score >= 20) return "introductory";
  return "not_started";
}

export function calculateMasteryScore(params: {
  correctAnswers: number;
  totalQuestions: number;
  averageTime?: number;
  expectedTime?: number;
  recentAccuracy?: number;
  consistency?: number;
}): number {
  const { correctAnswers, totalQuestions, averageTime, expectedTime, recentAccuracy, consistency } = params;

  if (totalQuestions === 0) return 0;

  // Base accuracy score
  const accuracyScore = (correctAnswers / totalQuestions) * 50;

  // Time efficiency bonus/penalty
  let timeScore = 25;
  if (averageTime && expectedTime) {
    const timeRatio = expectedTime / averageTime;
    timeScore = Math.min(25, timeRatio * 25);
  }

  // Consistency bonus
  const consistencyScore = consistency ? consistency * 15 : 7.5;

  // Recent performance bonus
  const recentScore = recentAccuracy ? (recentAccuracy / 100) * 10 : 5;

  return Math.min(100, accuracyScore + timeScore + consistencyScore + recentScore);
}

export function calculateTimeToMastery(
  currentScore: number,
  targetScore: number,
  recentScores: number[],
  questionsPerDay: number = 10
): number | null {
  if (currentScore >= targetScore) return 0;
  if (recentScores.length < 3) return null;

  // Calculate improvement rate from recent scores
  const avgImprovement = recentScores.reduce((sum, score, i) => {
    if (i === 0) return sum;
    return sum + (score - recentScores[i - 1]);
  }, 0) / (recentScores.length - 1);

  if (avgImprovement <= 0) return null;

  const scoreNeeded = targetScore - currentScore;
  const daysNeeded = Math.ceil(scoreNeeded / (avgImprovement * questionsPerDay * 0.01));

  return Math.max(1, daysNeeded);
}

export function createMasteryReport(params: {
  userId: string;
  conceptMasteries: ConceptMastery[];
  skillMasteries: SkillMastery[];
  formulaMasteries: FormulaMastery[];
  topicMasteries: TopicMastery[];
  chapterMasteries: ChapterMastery[];
  subjectMasteries: SubjectMastery[];
  period: { start: Date; end: Date };
}): MasteryReport {
  const id = `mastery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const allMasteries = [
    ...params.conceptMasteries,
    ...params.skillMasteries,
    ...params.formulaMasteries,
    ...params.topicMasteries,
    ...params.chapterMasteries,
    ...params.subjectMasteries
  ];

  const conceptsMastered = params.conceptMasteries.filter(m => m.level === "mastered" || m.level === "expert").length;
  const skillsMastered = params.skillMasteries.filter(m => m.level === "mastered" || m.level === "expert").length;
  const formulasMastered = params.formulaMasteries.filter(m => m.level === "mastered" || m.level === "expert").length;
  const topicsMastered = params.topicMasteries.filter(m => m.level === "mastered" || m.level === "expert").length;
  const chaptersCompleted = params.chapterMasteries.filter(m => m.completionPercentage >= 100).length;

  const totalScore = allMasteries.reduce((sum, m) => sum + m.score.current, 0);
  const overallMastery = allMasteries.length > 0 ? totalScore / allMasteries.length : 0;

  const summary: MasteryReportSummary = {
    overallMastery,
    level: calculateMasteryLevel(overallMastery),
    conceptsMastered,
    skillsMastered,
    formulasMastered,
    topicsMastered,
    chaptersCompleted,
    subjectsProgress: params.subjectMasteries.length,
    averageAccuracy: allMasteries.reduce((sum, m) => {
      if ('accuracy' in m) return sum + (m as any).accuracy;
      return sum;
    }, 0) / allMasteries.length,
    totalStudyTime: 0,
    totalQuestions: allMasteries.reduce((sum, m) => {
      if ('questionsAttempted' in m) return sum + (m as any).questionsAttempted;
      return sum;
    }, 0),
    improvementRate: allMasteries.reduce((sum, m) => sum + m.score.change, 0) / allMasteries.length,
    strengths: params.conceptMasteries
      .filter(m => m.level === "mastered" || m.level === "expert")
      .slice(0, 3)
      .map(m => m.conceptName),
    focusAreas: params.topicMasteries
      .filter(m => m.accuracy < 50)
      .slice(0, 3)
      .map(m => m.topicName)
  };

  const breakdown: MasteryBreakdown = {
    byCategory: {
      concept: params.conceptMasteries.length > 0
        ? params.conceptMasteries.reduce((sum, m) => sum + m.score.current, 0) / params.conceptMasteries.length
        : 0,
      skill: params.skillMasteries.length > 0
        ? params.skillMasteries.reduce((sum, m) => sum + m.score.current, 0) / params.skillMasteries.length
        : 0,
      topic: params.topicMasteries.length > 0
        ? params.topicMasteries.reduce((sum, m) => sum + m.score.current, 0) / params.topicMasteries.length
        : 0,
      chapter: params.chapterMasteries.length > 0
        ? params.chapterMasteries.reduce((sum, m) => sum + m.score.current, 0) / params.chapterMasteries.length
        : 0,
      subject: params.subjectMasteries.length > 0
        ? params.subjectMasteries.reduce((sum, m) => sum + m.score.current, 0) / params.subjectMasteries.length
        : 0,
      formula: params.formulaMasteries.length > 0
        ? params.formulaMasteries.reduce((sum, m) => sum + m.score.current, 0) / params.formulaMasteries.length
        : 0
    },
    bySubject: {},
    byChapter: {},
    byTopic: {},
    overall: overallMastery
  };

  return {
    id,
    userId: params.userId,
    generatedAt: new Date(),
    period: params.period,
    summary,
    breakdown,
    conceptMasteries: params.conceptMasteries,
    skillMasteries: params.skillMasteries,
    formulaMasteries: params.formulaMasteries,
    topicMasteries: params.topicMasteries,
    chapterMasteries: params.chapterMasteries,
    subjectMasteries: params.subjectMasteries,
    goals: [],
    predictions: [],
    insights: [],
    recommendations: []
  };
}

export const MASTERY_LEVEL_THRESHOLDS = {
  not_started: { min: 0, max: 20 },
  introductory: { min: 20, max: 50 },
  developing: { min: 50, max: 70 },
  proficient: { min: 70, max: 85 },
  mastered: { min: 85, max: 95 },
  expert: { min: 95, max: 100 }
};

export const TIME_TO_MASTERY_ESTIMATES = {
  concept: { min: 5, max: 20 },
  skill: { min: 10, max: 50 },
  topic: { min: 20, max: 100 },
  chapter: { min: 50, max: 200 },
  subject: { min: 200, max: 500 }
};
