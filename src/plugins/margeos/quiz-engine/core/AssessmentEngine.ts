// @ts-nocheck
// Adaptive Quiz Engine — AssessmentEngine
// Comprehensive quiz assessment and result generation

import type { Quiz, QuizAnswer } from "../models/Quiz";
import type { Question, DifficultyLevel, CognitiveLevel } from "../models/Question";
import type { AnswerEvaluation } from "../models/Answer";
import type {
  QuizResult,
  QuestionResult,
  TopicResult,
  StrengthWeakness,
  TimeAnalysis,
  DifficultyAnalysis,
  ImprovementMetrics,
  MasteryReport
} from "../models/QuizResult";
import type { SessionState, SessionAnswer } from "../models/QuizSession";
import type { UserDifficultyProfile } from "../models/DifficultyProfile";
import { createQuizResult, calculateGrade, identifyStrengthsAndWeaknesses } from "../models/QuizResult";
import { MasteryEngine } from "./MasteryEngine";

export interface AssessmentParams {
  session: SessionState;
  quiz?: Quiz;
  userProfile?: UserDifficultyProfile;
  previousResults?: QuizResult[];
}

export interface AssessmentSummary {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  averageTime: number;
  difficultyLevel: DifficultyLevel;
}

export interface DetailedFeedback {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  recommendations: string[];
}

export class AssessmentEngine {
  private static instance: AssessmentEngine;
  private masteryEngine: MasteryEngine;
  private resultCache: Map<string, QuizResult> = new Map();

  private constructor() {
    this.masteryEngine = MasteryEngine.getInstance();
    this.loadResults();
  }

  static getInstance(): AssessmentEngine {
    if (!AssessmentEngine.instance) {
      AssessmentEngine.instance = new AssessmentEngine();
    }
    return AssessmentEngine.instance;
  }

  private loadResults(): void {
    try {
      const stored = localStorage.getItem("quiz_results");
      if (stored) {
        const results = JSON.parse(stored);
        results.forEach((r: QuizResult) => {
          this.resultCache.set(r.id, r);
        });
      }
    } catch (error) {
      console.warn("Failed to load quiz results:", error);
    }
  }

  private saveResults(): void {
    try {
      const results = Array.from(this.resultCache.values()).slice(-100);
      localStorage.setItem("quiz_results", JSON.stringify(results));
    } catch (error) {
      console.warn("Failed to save quiz results:", error);
    }
  }

  async generateResult(params: AssessmentParams): Promise<QuizResult> {
    const { session, quiz, userProfile } = params;

    const questionResults: QuestionResult[] = [];
    const topicResultsMap = new Map<string, TopicResult>();
    const cognitiveResultsMap = new Map<CognitiveLevel, CognitiveResult>();

    let totalScore = 0;
    let maxScore = 0;
    let totalTime = 0;
    let correctCount = 0;
    let hintsUsed = 0;
    let skipsCount = 0;
    let flagsCount = 0;

    // Process each answer
    let questionIndex = 0;
    for (const [questionId, sessionAnswer] of session.answers.entries()) {
      const { answer, timeSpent } = sessionAnswer;
      questionIndex++;

      if (!answer.evaluation) {
        continue;
      }

      const evaluation = answer.evaluation;
      totalScore += evaluation.score;
      maxScore += evaluation.maxScore;
      totalTime += timeSpent;
      hintsUsed += sessionAnswer.hintsUsed;
      if (sessionAnswer.skipped) skipsCount++;
      if (sessionAnswer.flagged) flagsCount++;

      if (evaluation.isCorrect) {
        correctCount++;
      }

      // Get question metadata (would need to fetch from question bank)
      const question: Question = {
        id: questionId,
        type: "mcq",
        content: { text: "" },
        metadata: {
          source: "ai_generated",
          subject: quiz?.config.subject || "unknown",
          topic: quiz?.config.topics[0] || "unknown",
          difficulty: "medium",
          estimatedTime: 60,
          points: 1,
          tags: []
        },
        hints: [],
        settings: { showFeedback: true, showHints: true, allowSkip: true, randomizeOptions: true },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      questionResults.push({
        questionId,
        question,
        userAnswer: answer,
        evaluation,
        position: questionIndex,
        timeSpent,
        difficulty: question.metadata.difficulty,
        isCorrect: evaluation.isCorrect,
        partialCredit: evaluation.partialCredit,
        pointsEarned: evaluation.score,
        pointsPossible: evaluation.maxScore,
        hintsUsed: sessionAnswer.hintsUsed,
        skipped: sessionAnswer.skipped
      });

      // Aggregate by topic
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
      topicResult.averageTime = ((topicResult.averageTime * (topicResult.totalQuestions - 1)) + timeSpent) / topicResult.totalQuestions;

      const diff = question.metadata.difficulty;
      topicResult.questionsByDifficulty[diff].total++;
      if (evaluation.isCorrect) topicResult.questionsByDifficulty[diff].correct++;

      // Aggregate by cognitive level
      const cognitive = question.metadata.bloomLevel || "understand";
      if (!cognitiveResultsMap.has(cognitive)) {
        cognitiveResultsMap.set(cognitive, {
          level: cognitive,
          totalQuestions: 0,
          correctQuestions: 0,
          accuracy: 0,
          averageTime: 0
        });
      }

      const cogResult = cognitiveResultsMap.get(cognitive)!;
      cogResult.totalQuestions++;
      if (evaluation.isCorrect) cogResult.correctQuestions++;
      cogResult.averageTime = ((cogResult.averageTime * (cogResult.totalQuestions - 1)) + timeSpent) / cogResult.totalQuestions;
    }

    // Calculate accuracies
    topicResultsMap.forEach(result => {
      result.accuracy = result.totalQuestions > 0
        ? (result.correctQuestions / result.totalQuestions) * 100
        : 0;
      Object.values(result.questionsByDifficulty).forEach(diff => {
        diff.accuracy = diff.total > 0 ? (diff.correct / diff.total) * 100 : 0;
      });
    });

    cognitiveResultsMap.forEach(result => {
      result.accuracy = result.totalQuestions > 0
        ? (result.correctQuestions / result.totalQuestions) * 100
        : 0;
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passingScore = quiz?.config.settings.passingScore || 70;
    const passed = percentage >= passingScore;

    // Build result object
    const result: QuizResult = {
      id: `result_${Date.now()}`,
      summary: {
        resultId: "",
        quizId: session.quizId,
        quizTitle: quiz?.config.title || "Quiz",
        userId: session.userId,
        status: "completed",
        score: totalScore,
        maxScore,
        percentage,
        passed,
        grade: calculateGrade(percentage),
        timeSpent: totalTime,
        averageTimePerQuestion: questionResults.length > 0 ? totalTime / questionResults.length : 0,
        startedAt: session.startedAt,
        completedAt: session.submittedAt || new Date()
      },
      questionResults,
      topicResults: Array.from(topicResultsMap.values()),
      cognitiveResults: Array.from(cognitiveResultsMap.values()),
      strengthWeaknesses: [],
      timeAnalysis: this.analyzeTime(questionResults, totalTime),
      difficultyAnalysis: this.analyzeDifficulty(topicResultsMap, questionResults),
      improvementMetrics: this.calculateImprovement(params.previousResults, percentage),
      metadata: {
        quizType: quiz?.config.type || "practice",
        difficultyRange: quiz?.difficultyRange || { min: "easy", max: "hard" },
        questionTypes: questionResults.map(q => q.question.type),
        adaptiveUsed: session.difficultyProfile !== undefined,
        hintsUsedTotal: hintsUsed,
        skipsTotal: skipsCount,
        pauseCount: 0,
        totalPauseTime: session.totalPausedTime,
        device: session.metadata.device,
        browser: session.metadata.browser,
        platform: session.metadata.platform
      },
      createdAt: new Date()
    };

    result.summary.resultId = result.id;
    result.strengthWeaknesses = identifyStrengthsAndWeaknesses(result);

    // Update mastery
    await this.masteryEngine.updateMastery(session.userId, result);

    // Cache result
    this.resultCache.set(result.id, result);
    this.saveResults();

    return result;
  }

  private analyzeTime(questionResults: QuestionResult[], totalTime: number): TimeAnalysis {
    const times = questionResults.map(q => q.timeSpent).filter(t => t > 0);

    if (times.length === 0) {
      return {
        totalTime,
        averageTimePerQuestion: 0,
        fastestQuestion: { id: "", time: 0 },
        slowestQuestion: { id: "", time: 0 },
        timeDistribution: [],
        pacingAssessment: "optimal"
      };
    }

    const sorted = [...questionResults].sort((a, b) => a.timeSpent - b.timeSpent);
    const fastest = sorted.find(q => q.timeSpent > 0);
    const slowest = [...sorted].reverse().find(q => q.timeSpent > 0);

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

    // Calculate time distribution
    const ranges = ["<30s", "30-60s", "60-90s", "90-120s", ">120s"];
    const distribution = ranges.map(range => ({ range, count: 0, percentage: 0 }));

    times.forEach(time => {
      if (time < 30) distribution[0].count++;
      else if (time < 60) distribution[1].count++;
      else if (time < 90) distribution[2].count++;
      else if (time < 120) distribution[3].count++;
      else distribution[4].count++;
    });

    distribution.forEach(d => {
      d.percentage = (d.count / times.length) * 100;
    });

    // Assess pacing
    let pacingAssessment: TimeAnalysis["pacingAssessment"] = "optimal";
    const tooFast = times.filter(t => t < avgTime * 0.5).length;
    const tooSlow = times.filter(t => t > avgTime * 1.5).length;

    if (tooFast > times.length * 0.3) pacingAssessment = "too_fast";
    else if (tooSlow > times.length * 0.3) pacingAssessment = "too_slow";

    return {
      totalTime,
      averageTimePerQuestion: avgTime,
      fastestQuestion: { id: fastest?.questionId || "", time: fastest?.timeSpent || 0 },
      slowestQuestion: { id: slowest?.questionId || "", time: slowest?.timeSpent || 0 },
      timeDistribution: distribution,
      pacingAssessment
    };
  }

  private analyzeDifficulty(
    topicResults: Map<string, TopicResult>,
    questionResults: QuestionResult[]
  ): DifficultyAnalysis {
    const difficulties: Record<DifficultyLevel, { total: number; correct: number; time: number }> = {
      easy: { total: 0, correct: 0, time: 0 },
      medium: { total: 0, correct: 0, time: 0 },
      hard: { total: 0, correct: 0, time: 0 },
      expert: { total: 0, correct: 0, time: 0 }
    };

    questionResults.forEach(q => {
      const diff = q.difficulty;
      difficulties[diff].total++;
      if (q.isCorrect) difficulties[diff].correct++;
      difficulties[diff].time += q.timeSpent;
    });

    const questionsByDifficulty: Record<DifficultyLevel, {
      total: number;
      correct: number;
      accuracy: number;
      averageTime: number;
    }> = {
      easy: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
      medium: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
      hard: { total: 0, correct: 0, accuracy: 0, averageTime: 0 },
      expert: { total: 0, correct: 0, accuracy: 0, averageTime: 0 }
    };

    Object.entries(difficulties).forEach(([diff, data]) => {
      questionsByDifficulty[diff as DifficultyLevel] = {
        total: data.total,
        correct: data.correct,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        averageTime: data.total > 0 ? data.time / data.total : 0
      };
    });

    // Estimate user level based on performance
    let estimatedLevel: DifficultyLevel = "medium";
    const hardCorrect = questionsByDifficulty.hard.accuracy;
    const mediumCorrect = questionsByDifficulty.medium.accuracy;

    if (hardCorrect >= 80 && questionsByDifficulty.expert.total > 0) {
      estimatedLevel = "expert";
    } else if (hardCorrect >= 70) {
      estimatedLevel = "hard";
    } else if (mediumCorrect >= 60) {
      estimatedLevel = "medium";
    } else {
      estimatedLevel = "easy";
    }

    const difficultyAccuracy: Record<DifficultyLevel, number> = {
      easy: questionsByDifficulty.easy.accuracy,
      medium: questionsByDifficulty.medium.accuracy,
      hard: questionsByDifficulty.hard.accuracy,
      expert: questionsByDifficulty.expert.accuracy
    };

    const overallDifficulty = Object.values(questionsByDifficulty)
      .reduce((sum, d) => sum + d.accuracy, 0) / 4;

    return {
      overallDifficulty,
      questionsByDifficulty,
      estimatedUserLevel: estimatedLevel,
      difficultyAccuracy
    };
  }

  private calculateImprovement(
    previousResults: QuizResult[] | undefined,
    currentPercentage: number
  ): ImprovementMetrics | undefined {
    if (!previousResults || previousResults.length === 0) {
      return {
        comparedToPrevious: false,
        percentageChange: 0,
        absoluteChange: 0,
        trendDirection: "stable"
      };
    }

    const lastResult = previousResults[previousResults.length - 1];
    const previousPercentage = lastResult.summary.percentage;
    const change = currentPercentage - previousPercentage;

    let trendDirection: "improving" | "stable" | "declining";
    if (change > 5) trendDirection = "improving";
    else if (change < -5) trendDirection = "declining";
    else trendDirection = "stable";

    return {
      comparedToPrevious: true,
      previousResultId: lastResult.id,
      previousPercentage,
      percentageChange: change,
      absoluteChange: change,
      trendDirection,
      recentAttempts: previousResults.slice(-5).map(r => ({
        date: r.createdAt,
        percentage: r.summary.percentage
      }))
    };
  }

  async getDetailedFeedback(result: QuizResult): Promise<DetailedFeedback> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];
    const recommendations: string[] = [];

    // Analyze topic results
    result.topicResults.forEach(topic => {
      if (topic.accuracy >= 80) {
        strengths.push(`Strong understanding of ${topic.topic} (${topic.accuracy.toFixed(1)}% accuracy)`);
      } else if (topic.accuracy < 50) {
        weaknesses.push(`${topic.topic} needs improvement (${topic.accuracy.toFixed(1)}% accuracy)`);
        improvements.push(`Review fundamentals of ${topic.topic}`);
        recommendations.push(`Practice more questions on ${topic.topic}`);
      }
    });

    // Analyze cognitive levels
    result.cognitiveResults.forEach(cog => {
      if (cog.level === "create" && cog.accuracy < 60) {
        weaknesses.push("Need to improve creative/application skills");
        recommendations.push("Practice scenario-based questions");
      }
      if (cog.level === "evaluate" && cog.accuracy < 60) {
        weaknesses.push("Need to improve evaluation skills");
        recommendations.push("Work on analysis and evaluation exercises");
      }
    });

    // Analyze time management
    if (result.timeAnalysis.pacingAssessment === "too_fast") {
      recommendations.push("Slow down and check answers carefully");
    } else if (result.timeAnalysis.pacingAssessment === "too_slow") {
      recommendations.push("Practice time management to improve speed");
    }

    return { strengths, weaknesses, improvements, recommendations };
  }

  async getResultById(resultId: string): Promise<QuizResult | null> {
    return this.resultCache.get(resultId) || null;
  }

  async getResultsForUser(userId: string, limit?: number): Promise<QuizResult[]> {
    const results = Array.from(this.resultCache.values())
      .filter(r => r.summary.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? results.slice(0, limit) : results;
  }

  getSummary(params: AssessmentParams): AssessmentSummary {
    const { session, quiz } = params;

    let totalScore = 0;
    let maxScore = 0;
    let totalTime = 0;
    let correctCount = 0;
    let totalQuestions = 0;

    for (const [, sessionAnswer] of session.answers.entries()) {
      if (sessionAnswer.answer.evaluation) {
        totalScore += sessionAnswer.answer.evaluation.score;
        maxScore += sessionAnswer.answer.evaluation.maxScore;
        totalTime += sessionAnswer.timeSpent;
        correctCount++;
        totalQuestions++;
      }
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passingScore = quiz?.config.settings.passingScore || 70;

    let difficultyLevel: DifficultyLevel = "medium";
    if (session.difficultyProfile) {
      difficultyLevel = session.difficultyProfile.currentLevel;
    }

    return {
      totalScore,
      maxScore,
      percentage,
      grade: calculateGrade(percentage),
      passed: percentage >= passingScore,
      correctCount,
      totalQuestions,
      averageTime: totalQuestions > 0 ? totalTime / totalQuestions : 0,
      difficultyLevel
    };
  }

  destroy(): void {
    this.resultCache.clear();
    AssessmentEngine.instance = null as any;
  }
}

interface CognitiveResult {
  level: CognitiveLevel;
  totalQuestions: number;
  correctQuestions: number;
  accuracy: number;
  averageTime: number;
}

export default AssessmentEngine;
