// @ts-nocheck
// AI Exam Simulator — ExamResult Model
// Comprehensive exam results and analytics

import type { ExamMode, ExamDifficulty } from "./Exam";
import type { DifficultyLevel, QuestionType } from "../models/Question";

export type ResultStatus = "in_progress" | "completed" | "submitted" | "graded" | "reviewed";

export interface ExamResultSummary {
  resultId: string;
  examId: string;
  examTitle: string;
  userId: string;
  status: ResultStatus;
  score: number;
  maxScore: number;
  percentage: number;
  grade?: string;
  passed: boolean;
  rank?: number;
  percentile?: number;
  totalParticipants?: number;
  timeSpent: number;
  averageTimePerQuestion: number;
  startedAt: Date;
  completedAt?: Date;
  submittedAt?: Date;
  gradedAt?: Date;
}

export interface QuestionResult {
  questionId: string;
  questionType: QuestionType;
  questionText: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  partialCredit?: number;
  pointsEarned: number;
  pointsPossible: number;
  timeSpent: number;
  difficulty: DifficultyLevel;
  hintsUsed: number;
  flagged: boolean;
  feedback?: string;
  explanation?: string;
}

export interface TopicResult {
  topic: string;
  subject: string;
  chapter?: string;
  questionsTotal: number;
  questionsCorrect: number;
  questionsPartial: number;
  accuracy: number;
  averageTime: number;
  questionsByDifficulty: Record<DifficultyLevel, TopicDifficultyResult>;
}

export interface TopicDifficultyResult {
  total: number;
  correct: number;
  accuracy: number;
  averageTime: number;
}

export interface TimeAnalysis {
  totalTime: number;
  averageTimePerQuestion: number;
  fastestQuestion: { id: string; time: number };
  slowestQuestion: { id: string; time: number };
  timeDistribution: TimeDistributionItem[];
  pacingAssessment: "too_fast" | "optimal" | "too_slow";
  timeManagementScore: number;
}

export interface TimeDistributionItem {
  range: string;
  count: number;
  percentage: number;
}

export interface DifficultyAnalysis {
  questionsByDifficulty: Record<DifficultyLevel, DifficultyResult>;
  estimatedUserLevel: DifficultyLevel;
  difficultyMatch: number;
  recommendation: string;
}

export interface DifficultyResult {
  total: number;
  correct: number;
  accuracy: number;
  averageTime: number;
}

export interface QuestionTypeAnalysis {
  type: QuestionType;
  total: number;
  correct: number;
  accuracy: number;
  averageTime: number;
  partialCreditUsed: number;
}

export interface StrengthWeakness {
  type: "strength" | "weakness";
  area: string;
  description: string;
  evidence: string[];
  impact: "high" | "medium" | "low";
  score: number;
}

export interface ImprovementMetrics {
  comparedToPrevious: boolean;
  previousResultId?: string;
  previousPercentage?: number;
  percentageChange: number;
  absoluteChange: number;
  trendDirection: "improving" | "stable" | "declining";
  streakCount?: number;
  recentAttempts?: Array<{ date: Date; percentage: number }>;
}

export interface SkillAssessment {
  skillId: string;
  skillName: string;
  score: number;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  improvement: number;
}

export interface ExamResult {
  id: string;
  summary: ExamResultSummary;
  questionResults: QuestionResult[];
  topicResults: TopicResult[];
  timeAnalysis: TimeAnalysis;
  difficultyAnalysis: DifficultyAnalysis;
  questionTypeAnalysis: QuestionTypeAnalysis[];
  strengthWeaknesses: StrengthWeakness[];
  improvementMetrics?: ImprovementMetrics;
  skillAssessments?: SkillAssessment[];
  metadata: ExamResultMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamResultMetadata {
  examMode: ExamMode;
  examDifficulty: ExamDifficulty;
  questionTypes: QuestionType[];
  difficultyRange: { min: DifficultyLevel; max: DifficultyLevel };
  totalQuestions: number;
  hintsUsedTotal: number;
  flagsTotal: number;
  bookmarksTotal: number;
  pauseCount: number;
  totalPauseTime: number;
  device: string;
  browser: string;
  platform: string;
  userAgent: string;
  location?: string;
}

export interface ExamComparison {
  resultIds: string[];
  metrics: ExamComparisonMetric[];
  overallTrend: "improving" | "stable" | "declining" | "inconsistent";
  bestResult: string;
  worstResult: string;
}

export interface ExamComparisonMetric {
  metric: string;
  values: number[];
  changes: number[];
  average: number;
  best: number;
  worst: number;
}

export interface ExamResultFilter {
  examId?: string;
  userId?: string;
  status?: ResultStatus[];
  passed?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
  mode?: ExamMode[];
}

export function createExamResult(params: {
  examId: string;
  examTitle: string;
  userId: string;
  questionResults: QuestionResult[];
  topicResults: TopicResult[];
  startedAt: Date;
  completedAt: Date;
  examMode: ExamMode;
  examDifficulty: ExamDifficulty;
  difficultyRange: { min: DifficultyLevel; max: DifficultyLevel };
  questionTypes: QuestionType[];
}): ExamResult {
  const id = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate summary
  let totalScore = 0;
  let maxScore = 0;
  let totalTime = 0;
  let correctCount = 0;
  let hintsUsed = 0;
  let flagsTotal = 0;

  const topicResultsMap = new Map<string, TopicResult>();
  const difficultyResults: Record<DifficultyLevel, DifficultyResult> = {
    easy: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
    medium: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
    hard: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
    expert: { total: 0, correct: 0, accuracy: 0, averageTime: 0 }
  };

  params.questionResults.forEach(qr => {
    totalScore += qr.pointsEarned;
    maxScore += qr.pointsPossible;
    totalTime += qr.timeSpent;
    if (qr.isCorrect) correctCount++;
    hintsUsed += qr.hintsUsed;
    if (qr.flagged) flagsTotal++;

    // Aggregate difficulty results
    difficultyResults[qr.difficulty].total++;
    if (qr.isCorrect) difficultyResults[qr.difficulty].correct++;
    difficultyResults[qr.difficulty].averageTime += qr.timeSpent;

    // Aggregate topic results
    const topicKey = qr.questionText.split(" ")[0];
    if (!topicResultsMap.has(topicKey)) {
      topicResultsMap.set(topicKey, {
        topic: topicKey,
        subject: "General",
        questionsTotal: 0,
        questionsCorrect: 0,
        questionsPartial: 0,
        accuracy: 0,
        averageTime: 0,
        questionsByDifficulty: {
          easy: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
          medium: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
          hard: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
          expert: { total: 0, correct: 0, accuracy: 0, averageTime: 0 }
        }
      });
    }

    const topic = topicResultsMap.get(topicKey)!;
    topic.questionsTotal++;
    if (qr.isCorrect) topic.questionsCorrect++;
    topic.averageTime += qr.timeSpent;
  });

  // Calculate accuracies
  Object.values(difficultyResults).forEach(dr => {
    dr.accuracy = dr.total > 0 ? (dr.correct / dr.total) * 100 : 0;
    dr.averageTime = dr.total > 0 ? dr.averageTime / dr.total : 0;
  });

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const passingScore = 60;

  const summary: ExamResultSummary = {
    resultId: id,
    examId: params.examId,
    examTitle: params.examTitle,
    userId: params.userId,
    status: "completed",
    score: totalScore,
    maxScore,
    percentage,
    grade: calculateGrade(percentage),
    passed: percentage >= passingScore,
    timeSpent: totalTime,
    averageTimePerQuestion: params.questionResults.length > 0 ? totalTime / params.questionResults.length : 0,
    startedAt: params.startedAt,
    completedAt: params.completedAt
  };

  // Find fastest and slowest questions
  const sorted = [...params.questionResults].sort((a, b) => a.timeSpent - b.timeSpent);
  const fastestQuestion = sorted[0];
  const slowestQuestion = sorted[sorted.length - 1];

  return {
    id,
    summary,
    questionResults: params.questionResults,
    topicResults: Array.from(topicResultsMap.values()),
    timeAnalysis: {
      totalTime,
      averageTimePerQuestion: summary.averageTimePerQuestion,
      fastestQuestion: { id: fastestQuestion?.questionId || "", time: fastestQuestion?.timeSpent || 0 },
      slowestQuestion: { id: slowestQuestion?.questionId || "", time: slowestQuestion?.timeSpent || 0 },
      timeDistribution: [],
      pacingAssessment: "optimal",
      timeManagementScore: 85
    },
    difficultyAnalysis: {
      questionsByDifficulty: difficultyResults,
      estimatedUserLevel: calculateEstimatedLevel(difficultyResults),
      difficultyMatch: calculateDifficultyMatch(difficultyResults),
      recommendation: ""
    },
    questionTypeAnalysis: [],
    strengthWeaknesses: identifyStrengthsAndWeaknesses(topicResultsMap),
    metadata: {
      examMode: params.examMode,
      examDifficulty: params.examDifficulty,
      questionTypes: params.questionTypes,
      difficultyRange: params.difficultyRange,
      totalQuestions: params.questionResults.length,
      hintsUsedTotal: hintsUsed,
      flagsTotal: flagsTotal,
      bookmarksTotal: 0,
      pauseCount: 0,
      totalPauseTime: 0,
      device: "web",
      browser: "unknown",
      platform: "web"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 80) return "A-";
  if (percentage >= 75) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 65) return "B-";
  if (percentage >= 60) return "C+";
  if (percentage >= 55) return "C";
  if (percentage >= 50) return "C-";
  if (percentage >= 45) return "D+";
  if (percentage >= 40) return "D";
  if (percentage >= 35) return "D-";
  return "F";
}

function calculateEstimatedLevel(difficulties: Record<DifficultyLevel, DifficultyResult>): DifficultyLevel {
  let totalCorrect = 0;
  let total = 0;

  Object.values(difficulties).forEach(d => {
    totalCorrect += d.correct;
    total += d.total;
  });

  const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;

  if (accuracy >= 85) return "expert";
  if (accuracy >= 70) return "hard";
  if (accuracy >= 50) return "medium";
  return "easy";
}

function calculateDifficultyMatch(difficulties: Record<DifficultyLevel, DifficultyResult>): number {
  let weightedAccuracy = 0;
  let total = 0;

  Object.entries(difficulties).forEach(([diff, d]) => {
    if (d.total > 0) {
      const weight = d.total;
      weightedAccuracy += d.accuracy * weight;
      total += weight;
    }
  });

  return total > 0 ? weightedAccuracy / total : 0;
}

function identifyStrengthsAndWeaknesses(topics: Map<string, TopicResult>): StrengthWeakness[] {
  const results: StrengthWeakness[] = [];

  topics.forEach((topic, name) => {
    topic.accuracy = topic.questionsTotal > 0
      ? (topic.questionsCorrect / topic.questionsTotal) * 100
      : 0;

    if (topic.accuracy >= 80) {
      results.push({
        type: "strength",
        area: name,
        description: `Strong performance in ${name}`,
        evidence: [`${topic.accuracy.toFixed(1)}% accuracy`, `${topic.questionsCorrect}/${topic.questionsTotal} correct`],
        impact: topic.accuracy >= 90 ? "high" : "medium",
        score: topic.accuracy
      });
    } else if (topic.accuracy < 50) {
      results.push({
        type: "weakness",
        area: name,
        description: `Needs improvement in ${name}`,
        evidence: [`${topic.accuracy.toFixed(1)}% accuracy`, `${topic.questionsCorrect}/${topic.questionsTotal} correct`],
        impact: topic.accuracy < 30 ? "high" : "medium",
        score: topic.accuracy
      });
    }
  });

  return results;
}
