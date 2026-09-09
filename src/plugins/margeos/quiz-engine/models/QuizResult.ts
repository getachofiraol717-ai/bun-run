// @ts-nocheck
// Adaptive Quiz Engine — QuizResult Model
// Comprehensive quiz result and analytics data structures

import type { Quiz, QuizAnswer } from "./Quiz";
import type { Question, DifficultyLevel, CognitiveLevel } from "./Question";
import type { AnswerEvaluation } from "./Answer";

export type ResultStatus = "in_progress" | "completed" | "graded" | "reviewed" | "expired";

export interface QuizResultSummary {
  resultId: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  status: ResultStatus;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  grade?: string;
  rank?: number;
  totalParticipants?: number;
  timeSpent: number;
  averageTimePerQuestion: number;
  startedAt: Date;
  completedAt?: Date;
  gradedAt?: Date;
}

export interface QuestionResult {
  questionId: string;
  question: Question;
  userAnswer: QuizAnswer;
  evaluation: AnswerEvaluation;
  position: number;
  timeSpent: number;
  difficulty: DifficultyLevel;
  isCorrect: boolean;
  partialCredit?: number;
  pointsEarned: number;
  pointsPossible: number;
  hintsUsed: number;
  skipped: boolean;
}

export interface TopicResult {
  topic: string;
  subject: string;
  totalQuestions: number;
  correctQuestions: number;
  accuracy: number;
  averageTime: number;
  questionsByDifficulty: Record<DifficultyLevel, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
}

export interface CognitiveResult {
  level: CognitiveLevel;
  totalQuestions: number;
  correctQuestions: number;
  accuracy: number;
  averageTime: number;
}

export interface StrengthWeakness {
  type: "strength" | "weakness" | "opportunity" | "threat";
  topic: string;
  subject: string;
  description: string;
  evidence: string[];
  impact: "high" | "medium" | "low";
  recommendations: string[];
}

export interface TimeAnalysis {
  totalTime: number;
  averageTimePerQuestion: number;
  fastestQuestion: { id: string; time: number };
  slowestQuestion: { id: string; time: number };
  timeDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  pacingAssessment: "too_fast" | "optimal" | "too_slow";
}

export interface DifficultyAnalysis {
  overallDifficulty: number;
  questionsByDifficulty: Record<DifficultyLevel, {
    total: number;
    correct: number;
    accuracy: number;
    averageTime: number;
  }>;
  estimatedUserLevel: DifficultyLevel;
  difficultyAccuracy: Record<DifficultyLevel, number>;
}

export interface ImprovementMetrics {
  comparedToPrevious: boolean;
  previousResultId?: string;
  previousPercentage?: number;
  percentageChange: number;
  absoluteChange: number;
  trendDirection: "improving" | "stable" | "declining";
  streakDays?: number;
  recentAttempts?: Array<{
    date: Date;
    percentage: number;
  }>;
}

export interface SkillAssessment {
  skillId: string;
  skillName: string;
  currentLevel: number;
  previousLevel?: number;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  masteryStatus: "not_started" | "developing" | "proficient" | "mastered";
  projectedMasteryDate?: Date;
}

export interface LearningGaps {
  gaps: Array<{
    topic: string;
    subject: string;
    severity: "critical" | "major" | "minor";
    questionsMissed: number;
    conceptsToReview: string[];
    recommendedResources: Array<{
      type: string;
      id: string;
      title: string;
    }>;
  }>;
  overallGapScore: number;
}

export interface QuizResult {
  id: string;
  summary: QuizResultSummary;
  questionResults: QuestionResult[];
  topicResults: TopicResult[];
  cognitiveResults: CognitiveResult[];
  strengthWeaknesses: StrengthWeakness[];
  timeAnalysis: TimeAnalysis;
  difficultyAnalysis: DifficultyAnalysis;
  improvementMetrics?: ImprovementMetrics;
  skillAssessments?: SkillAssessment[];
  learningGaps?: LearningGaps;
  metadata: ResultMetadata;
  createdAt: Date;
}

export interface ResultMetadata {
  quizType: Quiz["config"]["type"];
  difficultyRange: {
    min: DifficultyLevel;
    max: DifficultyLevel;
  };
  questionTypes: Question["type"][];
  adaptiveUsed: boolean;
  hintsUsedTotal: number;
  skipsTotal: number;
  pauseCount: number;
  totalPauseTime: number;
  device: string;
  browser: string;
  platform: string;
  userAgent: string;
  location?: string;
}

export interface QuizComparison {
  resultIds: string[];
  comparisons: Array<{
    metric: string;
    values: number[];
    changes: number[];
    best: number;
    worst: number;
  }>;
  overallTrend: "improving" | "stable" | "declining" | "inconsistent";
}

export interface ResultFilter {
  quizId?: string;
  quizType?: Quiz["config"]["type"][];
  subject?: string;
  status?: ResultStatus[];
  passed?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
}

export interface ResultSortOptions {
  field: "date" | "score" | "percentage" | "timeSpent" | "accuracy";
  direction: "asc" | "desc";
}

export function createQuizResult(params: {
  quiz: Quiz;
  userId: string;
  answers: Map<string, QuizAnswer>;
  evaluations: Map<string, AnswerEvaluation>;
  questions: Question[];
  startedAt: Date;
  completedAt: Date;
}): QuizResult {
  const id = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const questionResults: QuestionResult[] = [];
  const topicResultsMap = new Map<string, TopicResult>();
  const cognitiveResultsMap = new Map<CognitiveLevel, CognitiveResult>();
  let totalScore = 0;
  let maxScore = 0;
  let totalTime = 0;
  let correctCount = 0;

  params.questions.forEach((question, index) => {
    const answer = params.answers.get(question.id);
    const evaluation = params.evaluations.get(question.id);

    if (answer && evaluation) {
      totalScore += evaluation.score;
      maxScore += evaluation.maxScore;
      totalTime += answer.timeSpent;
      if (evaluation.isCorrect) correctCount++;

      questionResults.push({
        questionId: question.id,
        question,
        userAnswer: answer,
        evaluation,
        position: index + 1,
        timeSpent: answer.timeSpent,
        difficulty: question.metadata.difficulty || "medium",
        isCorrect: evaluation.isCorrect,
        partialCredit: evaluation.partialCredit,
        pointsEarned: evaluation.score,
        pointsPossible: evaluation.maxScore,
        hintsUsed: 0,
        skipped: answer.status === "skipped"
      });

      // Aggregate topic results
      const topic = question.metadata.topic;
      const subject = question.metadata.subject;
      const topicKey = `${subject}:${topic}`;

      if (!topicResultsMap.has(topicKey)) {
        topicResultsMap.set(topicKey, {
          topic,
          subject,
          totalQuestions: 0,
          correctQuestions: 0,
          accuracy: 0,
          averageTime: 0,
          questionsByDifficulty: {
            easy: { total: 0, correct: 0, accuracy: 0 },
            medium: { total: 0, correct: 0, accuracy: 0 },
            hard: { total: 0, correct: 0, accuracy: 0 },
            expert: { total: 0, correct: 0, accuracy: 0 }
          }
        });
      }

      const topicResult = topicResultsMap.get(topicKey)!;
      topicResult.totalQuestions++;
      if (evaluation.isCorrect) topicResult.correctQuestions++;
      topicResult.averageTime = (topicResult.averageTime * (topicResult.totalQuestions - 1) + answer.timeSpent) / topicResult.totalQuestions;

      const diff = question.metadata.difficulty || "medium";
      topicResult.questionsByDifficulty[diff].total++;
      if (evaluation.isCorrect) topicResult.questionsByDifficulty[diff].correct++;

      // Aggregate cognitive results
      const cognitiveLevel = question.metadata.bloomLevel || "understand";
      if (!cognitiveResultsMap.has(cognitiveLevel)) {
        cognitiveResultsMap.set(cognitiveLevel, {
          level: cognitiveLevel,
          totalQuestions: 0,
          correctQuestions: 0,
          accuracy: 0,
          averageTime: 0
        });
      }

      const cogResult = cognitiveResultsMap.get(cognitiveLevel)!;
      cogResult.totalQuestions++;
      if (evaluation.isCorrect) cogResult.correctQuestions++;
      cogResult.averageTime = (cogResult.averageTime * (cogResult.totalQuestions - 1) + answer.timeSpent) / cogResult.totalQuestions;
    }
  });

  // Calculate accuracy for topics
  topicResultsMap.forEach(result => {
    result.accuracy = result.totalQuestions > 0
      ? (result.correctQuestions / result.totalQuestions) * 100
      : 0;
    Object.values(result.questionsByDifficulty).forEach(diff => {
      diff.accuracy = diff.total > 0 ? (diff.correct / diff.total) * 100 : 0;
    });
  });

  // Calculate accuracy for cognitive levels
  cognitiveResultsMap.forEach(result => {
    result.accuracy = result.totalQuestions > 0
      ? (result.correctQuestions / result.totalQuestions) * 100
      : 0;
  });

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const passed = percentage >= params.quiz.config.settings.passingScore;

  const summary: QuizResultSummary = {
    resultId: id,
    quizId: params.quiz.id,
    quizTitle: params.quiz.config.title,
    userId: params.userId,
    status: "completed",
    score: totalScore,
    maxScore,
    percentage,
    passed,
    timeSpent: totalTime,
    averageTimePerQuestion: params.questions.length > 0 ? totalTime / params.questions.length : 0,
    startedAt: params.startedAt,
    completedAt: params.completedAt
  };

  // Find fastest and slowest questions
  const sortedByTime = [...questionResults].sort((a, b) => a.timeSpent - b.timeSpent);
  const fastestQuestion = sortedByTime[0] || { id: "", time: 0 };
  const slowestQuestion = sortedByTime[sortedByTime.length - 1] || { id: "", time: 0 };

  return {
    id,
    summary,
    questionResults,
    topicResults: Array.from(topicResultsMap.values()),
    cognitiveResults: Array.from(cognitiveResultsMap.values()),
    strengthWeaknesses: [],
    timeAnalysis: {
      totalTime,
      averageTimePerQuestion: summary.averageTimePerQuestion,
      fastestQuestion: { id: fastestQuestion.questionId, time: fastestQuestion.timeSpent },
      slowestQuestion: { id: slowestQuestion.questionId, time: slowestQuestion.timeSpent },
      timeDistribution: [],
      pacingAssessment: "optimal"
    },
    difficultyAnalysis: {
      overallDifficulty: 0,
      questionsByDifficulty: {
        easy: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
        medium: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
        hard: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
        expert: { total: 0, correct: 0, accuracy: 0, averageTime: 0 }
      },
      estimatedUserLevel: "medium",
      difficultyAccuracy: {}
    },
    metadata: {
      quizType: params.quiz.config.type,
      difficultyRange: params.quiz.difficultyRange || { min: "easy", max: "hard" },
      questionTypes: params.questions.map(q => q.type),
      adaptiveUsed: params.quiz.metadata.isAdaptive,
      hintsUsedTotal: 0,
      skipsTotal: 0,
      pauseCount: 0,
      totalPauseTime: 0,
      device: "web",
      browser: "unknown",
      platform: "web"
    },
    createdAt: new Date()
  };
}

export function calculateGrade(percentage: number): string {
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

export function identifyStrengthsAndWeaknesses(result: QuizResult): StrengthWeakness[] {
  const results: StrengthWeakness[] = [];

  // Find strengths (topics with >80% accuracy)
  result.topicResults.forEach(topic => {
    if (topic.accuracy >= 80) {
      results.push({
        type: "strength",
        topic: topic.topic,
        subject: topic.subject,
        description: `Strong performance in ${topic.topic}`,
        evidence: [
          `${topic.accuracy.toFixed(1)}% accuracy`,
          `${topic.correctQuestions}/${topic.totalQuestions} correct`
        ],
        impact: topic.accuracy >= 90 ? "high" : "medium",
        recommendations: ["Practice advanced problems", "Explore related topics"]
      });
    } else if (topic.accuracy < 50 && topic.totalQuestions >= 2) {
      results.push({
        type: "weakness",
        topic: topic.topic,
        subject: topic.subject,
        description: `Needs improvement in ${topic.topic}`,
        evidence: [
          `${topic.accuracy.toFixed(1)}% accuracy`,
          `${topic.correctQuestions}/${topic.totalQuestions} correct`
        ],
        impact: topic.accuracy < 30 ? "high" : "medium",
        recommendations: ["Review fundamentals", "Practice with guided exercises"]
      });
    }
  });

  return results;
}
