// @ts-nocheck
// Adaptive Quiz Engine — MasteryEngine
// Tracks and calculates mastery levels for concepts, skills, and topics

import type {
  MasteryReport,
  MasteryLevel,
  MasteryCategory,
  ConceptMastery,
  SkillMastery,
  FormulaMastery,
  TopicMastery,
  ChapterMastery,
  SubjectMastery,
  MasteryGoal,
  MasteryPrediction,
  MasteryInsight,
  MasteryRecommendation,
  MasteryScore
} from "../models/MasteryReport";
import type { QuizResult, QuestionResult } from "../models/QuizResult";
import type { DifficultyLevel } from "../models/Question";
import { createMasteryReport, calculateMasteryLevel, calculateMasteryScore } from "../models/MasteryReport";

export interface MasteryUpdateParams {
  userId: string;
  result: QuizResult;
  previousReport?: MasteryReport;
}

export interface MasteryQuery {
  userId: string;
  category?: MasteryCategory;
  subject?: string;
  topic?: string;
  chapter?: string;
  minLevel?: MasteryLevel;
  maxLevel?: MasteryLevel;
}

export class MasteryEngine {
  private static instance: MasteryEngine;
  private masteryData: Map<string, Map<string, MasteryData>> = new Map();
  private goals: Map<string, MasteryGoal[]> = new Map();

  private constructor() {
    this.loadData();
  }

  static getInstance(): MasteryEngine {
    if (!MasteryEngine.instance) {
      MasteryEngine.instance = new MasteryEngine();
    }
    return MasteryEngine.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem("quiz_mastery_data");
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([userId, userData]: [string, any]) => {
          const userMap = new Map<string, MasteryData>();
          Object.entries(userData).forEach(([key, value]) => {
            userMap.set(key, value as MasteryData);
          });
          this.masteryData.set(userId, userMap);
        });
      }
    } catch (error) {
      console.warn("Failed to load mastery data:", error);
    }
  }

  private saveData(): void {
    try {
      const data: Record<string, Record<string, MasteryData>> = {};
      this.masteryData.forEach((userMap, userId) => {
        data[userId] = Object.fromEntries(userMap);
      });
      localStorage.setItem("quiz_mastery_data", JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save mastery data:", error);
    }
  }

  async updateMastery(userId: string, result: QuizResult): Promise<MasteryReport> {
    let userData = this.masteryData.get(userId);
    if (!userData) {
      userData = new Map();
      this.masteryData.set(userId, userData);
    }

    // Update concept mastery
    const conceptMasteries = this.updateConceptMasteries(userData, result);

    // Update skill mastery
    const skillMasteries = this.updateSkillMasteries(userData, result);

    // Update topic mastery
    const topicMasteries = this.updateTopicMasteries(userData, result);

    // Update chapter mastery
    const chapterMasteries = this.updateChapterMasteries(userData, result);

    // Update subject mastery
    const subjectMasteries = this.updateSubjectMasteries(userData, result);

    // Update formula mastery
    const formulaMasteries = this.updateFormulaMasteries(userData, result);

    // Get or create goals
    const goals = this.goals.get(userId) || [];

    // Generate predictions
    const predictions = this.generatePredictions(conceptMasteries, skillMasteries);

    // Generate insights
    const insights = this.generateInsights(conceptMasteries, topicMasteries);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      conceptMasteries,
      skillMasteries,
      topicMasteries,
      insights
    );

    // Create report
    const report = createMasteryReport({
      userId,
      conceptMasteries,
      skillMasteries,
      formulaMasteries,
      topicMasteries,
      chapterMasteries,
      subjectMasteries,
      period: {
        start: result.createdAt,
        end: new Date()
      }
    });

    report.goals = goals;
    report.predictions = predictions;
    report.insights = insights;
    report.recommendations = recommendations;

    this.saveData();
    return report;
  }

  private updateConceptMasteries(
    userData: Map<string, MasteryData>,
    result: QuizResult
  ): ConceptMastery[] {
    const conceptMap = new Map<string, ConceptMasteryData>();
    const conceptResults: ConceptMasteryData = {
      totalQuestions: 0,
      correctAnswers: 0,
      totalTime: 0,
      questions: [],
      weakAreas: [],
      strongAreas: [],
      history: []
    };

    result.questionResults.forEach(qr => {
      const topic = qr.question.metadata.topic;
      if (!conceptMap.has(topic)) {
        conceptMap.set(topic, {
          totalQuestions: 0,
          correctAnswers: 0,
          totalTime: 0,
          questions: [],
          weakAreas: [],
          strongAreas: [],
          history: []
        });
      }

      const data = conceptMap.get(topic)!;
      data.totalQuestions++;
      data.totalTime += qr.timeSpent;
      data.questions.push({
        id: qr.questionId,
        isCorrect: qr.isCorrect,
        timeSpent: qr.timeSpent
      });

      if (qr.isCorrect) {
        data.correctAnswers++;
      } else {
        data.weakAreas.push(topic);
      }

      data.history.push({
        date: new Date(),
        isCorrect: qr.isCorrect,
        accuracy: qr.isCorrect ? 100 : 0
      });
    });

    // Update stored data
    conceptMap.forEach((data, topic) => {
      const key = `concept:${topic}`;
      const existing = userData.get(key) as ConceptMasteryData | undefined;

      if (existing) {
        existing.totalQuestions += data.totalQuestions;
        existing.correctAnswers += data.correctAnswers;
        existing.totalTime += data.totalTime;
        existing.questions.push(...data.questions);
        existing.history.push(...data.history);
      } else {
        userData.set(key, data);
      }
    });

    // Convert to ConceptMastery array
    const masteries: ConceptMastery[] = [];
    conceptMap.forEach((data, topic) => {
      const score = calculateMasteryScore({
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        averageTime: data.totalQuestions > 0 ? data.totalTime / data.totalQuestions : 0,
        recentAccuracy: this.getRecentAccuracy(data.history)
      });

      masteries.push({
        conceptId: topic,
        conceptName: topic,
        category: "concept",
        score: {
          current: score,
          previous: score - 5,
          change: 5,
          trend: "improving"
        },
        level: calculateMasteryLevel(score),
        questionsAttempted: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        accuracy: data.totalQuestions > 0 ? (data.correctAnswers / data.totalQuestions) * 100 : 0,
        averageTime: data.totalQuestions > 0 ? data.totalTime / data.totalQuestions : 0,
        prerequisites: [],
        dependents: [],
        weakAreas: data.weakAreas.slice(0, 3),
        strongAreas: data.strongAreas.slice(0, 3),
        recommendedPractice: data.weakAreas.slice(0, 2)
      });
    });

    return masteries;
  }

  private updateSkillMasteries(
    userData: Map<string, MasteryData>,
    result: QuizResult
  ): SkillMastery[] {
    // Simplified skill mastery tracking
    const skillMap = new Map<string, any>();

    result.cognitiveResults.forEach(cog => {
      skillMap.set(cog.level, {
        totalQuestions: cog.totalQuestions,
        correctAnswers: cog.correctQuestions,
        totalTime: cog.averageTime * cog.totalQuestions
      });
    });

    const masteries: SkillMastery[] = [];
    skillMap.forEach((data, skillName) => {
      const score = calculateMasteryScore({
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions
      });

      masteries.push({
        skillId: skillName,
        skillName: `${skillName} skills`,
        category: "skill",
        description: `Mastery of ${skillName}-level cognitive skills`,
        score: {
          current: score,
          change: 0,
          trend: "stable"
        },
        level: calculateMasteryLevel(score),
        components: [],
        applications: [],
        prerequisites: [],
        nextLevelRequirements: {
          accuracy: 85,
          questionsRequired: 20
        },
        practiceStreak: 0
      });
    });

    return masteries;
  }

  private updateFormulaMasteries(
    userData: Map<string, MasteryData>,
    result: QuizResult
  ): FormulaMastery[] {
    // Track formula mastery from formula-type questions
    const formulaResults = result.questionResults.filter(
      qr => qr.question.type === "formula"
    );

    const formulaMap = new Map<string, any>();

    formulaResults.forEach(qr => {
      const topic = qr.question.metadata.topic;
      if (!formulaMap.has(topic)) {
        formulaMap.set(topic, {
          totalQuestions: 0,
          correctAnswers: 0,
          history: []
        });
      }

      const data = formulaMap.get(topic)!;
      data.totalQuestions++;
      if (qr.isCorrect) data.correctAnswers++;

      data.history.push({
        date: new Date(),
        score: qr.isCorrect ? 100 : 0,
        type: "calculation" as const
      });
    });

    const masteries: FormulaMastery[] = [];
    formulaMap.forEach((data, formulaName) => {
      const score = calculateMasteryScore({
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions
      });

      masteries.push({
        formulaId: formulaName,
        formulaName,
        formula: "",
        variables: [],
        score: {
          current: score,
          change: 0,
          trend: "stable"
        },
        level: calculateMasteryLevel(score),
        understanding: {
          definition: score,
          purpose: score,
          application: score,
          derivation: score * 0.8
        },
        practiceHistory: data.history,
        commonMistakes: [],
        relatedFormulas: [],
        applications: []
      });
    });

    return masteries;
  }

  private updateTopicMasteries(
    userData: Map<string, MasteryData>,
    result: QuizResult
  ): TopicMastery[] {
    const masteries: TopicMastery[] = [];

    result.topicResults.forEach(topicResult => {
      const score = calculateMasteryScore({
        correctAnswers: topicResult.correctQuestions,
        totalQuestions: topicResult.totalQuestions,
        averageTime: topicResult.averageTime
      });

      masteries.push({
        topicId: topicResult.topic,
        topicName: topicResult.topic,
        score: {
          current: score,
          change: 0,
          trend: "stable"
        },
        level: calculateMasteryLevel(score),
        concepts: [topicResult.topic],
        skills: [],
        formulas: [],
        questionsAttempted: topicResult.totalQuestions,
        accuracy: topicResult.accuracy,
        timeSpent: topicResult.averageTime * topicResult.totalQuestions,
        weakAreas: [],
        resourcesCompleted: []
      });
    });

    return masteries;
  }

  private updateChapterMasteries(
    userData: Map<string, MasteryData>,
    result: QuizResult
  ): ChapterMastery[] {
    const chapterMap = new Map<string, any>();

    result.topicResults.forEach(topic => {
      const chapterId = topic.topic.split(".")[0] || topic.topic;
      if (!chapterMap.has(chapterId)) {
        chapterMap.set(chapterId, {
          chapterName: chapterId,
          subject: topic.subject,
          topics: [],
          totalQuestions: 0,
          correctQuestions: 0,
          totalTime: 0
        });
      }

      const chapter = chapterMap.get(chapterId)!;
      chapter.topics.push(topic.topic);
      chapter.totalQuestions += topic.totalQuestions;
      chapter.correctQuestions += topic.correctQuestions;
      chapter.totalTime += topic.averageTime * topic.totalQuestions;
    });

    const masteries: ChapterMastery[] = [];
    chapterMap.forEach((data, chapterId) => {
      const score = calculateMasteryScore({
        correctAnswers: data.correctQuestions,
        totalQuestions: data.totalQuestions
      });

      masteries.push({
        chapterId,
        chapterName: data.chapterName,
        subject: data.subject,
        score: {
          current: score,
          change: 0,
          trend: "stable"
        },
        level: calculateMasteryLevel(score),
        topics: [],
        overallProgress: score,
        prerequisites: [],
        completionPercentage: score
      });
    });

    return masteries;
  }

  private updateSubjectMasteries(
    userData: Map<string, MasteryData>,
    result: QuizResult
  ): SubjectMastery[] {
    const subjectMap = new Map<string, any>();

    result.topicResults.forEach(topic => {
      if (!subjectMap.has(topic.subject)) {
        subjectMap.set(topic.subject, {
          subjectName: topic.subject,
          chapters: [],
          totalQuestions: 0,
          correctQuestions: 0
        });
      }

      const subject = subjectMap.get(topic.subject)!;
      subject.totalQuestions += topic.totalQuestions;
      subject.correctQuestions += topic.correctQuestions;
    });

    const masteries: SubjectMastery[] = [];
    subjectMap.forEach((data, subjectId) => {
      const score = calculateMasteryScore({
        correctAnswers: data.correctQuestions,
        totalQuestions: data.totalQuestions
      });

      masteries.push({
        subjectId,
        subjectName: data.subjectName,
        score: {
          current: score,
          change: 0,
          trend: "stable"
        },
        level: calculateMasteryLevel(score),
        chapters: data.chapters,
        overallProgress: score,
        strengthAreas: [],
        improvementAreas: [],
        studyRecommendations: []
      });
    });

    return masteries;
  }

  private generatePredictions(
    conceptMasteries: ConceptMastery[],
    skillMasteries: SkillMastery[]
  ): MasteryPrediction[] {
    const predictions: MasteryPrediction[] = [];

    conceptMasteries.forEach(concept => {
      if (concept.level !== "mastered" && concept.level !== "expert") {
        predictions.push({
          targetId: concept.conceptId,
          targetType: "concept",
          currentLevel: concept.level,
          predictedLevel: this.predictNextLevel(concept.level),
          confidence: 0.7,
          factors: [
            {
              factor: "Recent practice",
              impact: 0.3,
              direction: "positive"
            }
          ],
          requiredPractice: {
            questionsPerDay: 5,
            daysToMastery: 7,
            recommendedIntensity: "moderate"
          }
        });
      }
    });

    return predictions;
  }

  private predictNextLevel(currentLevel: MasteryLevel): MasteryLevel {
    const levelOrder: MasteryLevel[] = [
      "not_started",
      "introductory",
      "developing",
      "proficient",
      "mastered",
      "expert"
    ];

    const currentIndex = levelOrder.indexOf(currentLevel);
    if (currentIndex < levelOrder.length - 1) {
      return levelOrder[currentIndex + 1];
    }
    return currentLevel;
  }

  private generateInsights(
    conceptMasteries: ConceptMastery[],
    topicMasteries: TopicMastery[]
  ): MasteryInsight[] {
    const insights: MasteryInsight[] = [];

    // Find strongest concepts
    const strong = conceptMasteries
      .filter(m => m.level === "mastered" || m.level === "expert")
      .slice(0, 3);

    if (strong.length > 0) {
      insights.push({
        type: "strength",
        title: "Strong Concepts",
        description: `You demonstrate mastery in ${strong.map(s => s.conceptName).join(", ")}`,
        evidence: strong.map(s => `${s.conceptName}: ${s.level}`),
        impact: "high",
        relatedAreas: strong.map(s => s.conceptName)
      });
    }

    // Find weakest concepts
    const weak = conceptMasteries
      .filter(m => m.level === "not_started" || m.level === "introductory")
      .slice(0, 3);

    if (weak.length > 0) {
      insights.push({
        type: "weakness",
        title: "Areas Needing Attention",
        description: `${weak.length} concepts need significant development`,
        evidence: weak.map(w => `${w.conceptName}: ${w.level}`),
        impact: "high",
        relatedAreas: weak.map(w => w.conceptName)
      });
    }

    return insights;
  }

  private generateRecommendations(
    conceptMasteries: ConceptMastery[],
    skillMasteries: SkillMastery[],
    topicMasteries: TopicMastery[],
    insights: MasteryInsight[]
  ): MasteryRecommendation[] {
    const recommendations: MasteryRecommendation[] = [];

    // Recommend practice for weak concepts
    conceptMasteries
      .filter(m => m.level === "not_started" || m.level === "introductory")
      .slice(0, 3)
      .forEach(concept => {
        recommendations.push({
          type: "practice",
          priority: "high",
          targetId: concept.conceptId,
          targetType: "concept",
          title: `Practice ${concept.conceptName}`,
          description: "Build foundational understanding",
          estimatedTime: 30,
          resources: [],
          successCriteria: ["Complete 10 practice questions", "Achieve 70% accuracy"]
        });
      });

    // Recommend review for developing concepts
    conceptMasteries
      .filter(m => m.level === "developing")
      .slice(0, 2)
      .forEach(concept => {
        recommendations.push({
          type: "review",
          priority: "medium",
          targetId: concept.conceptId,
          targetType: "concept",
          title: `Review ${concept.conceptName}`,
          description: "Strengthen understanding",
          estimatedTime: 15,
          resources: [],
          successCriteria: ["Review key points", "Complete 5 questions"]
        });
      });

    return recommendations;
  }

  private getRecentAccuracy(history: { accuracy: number }[]): number {
    const recent = history.slice(-10);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, h) => sum + h.accuracy, 0) / recent.length;
  }

  async getMasteryReport(userId: string): Promise<MasteryReport | null> {
    const userData = this.masteryData.get(userId);
    if (!userData) return null;

    // Rebuild report from stored data
    const conceptMasteries: ConceptMastery[] = [];
    const topicMasteries: TopicMastery[] = [];

    userData.forEach((data, key) => {
      if (key.startsWith("concept:")) {
        const conceptName = key.replace("concept:", "");
        const masteryData = data as ConceptMasteryData;
        conceptMasteries.push({
          conceptId: conceptName,
          conceptName,
          category: "concept",
          score: {
            current: calculateMasteryScore({
              correctAnswers: masteryData.correctAnswers,
              totalQuestions: masteryData.totalQuestions
            }),
            change: 0,
            trend: "stable"
          },
          level: "developing",
          questionsAttempted: masteryData.totalQuestions,
          correctAnswers: masteryData.correctAnswers,
          accuracy: masteryData.totalQuestions > 0
            ? (masteryData.correctAnswers / masteryData.totalQuestions) * 100
            : 0,
          averageTime: masteryData.totalQuestions > 0
            ? masteryData.totalTime / masteryData.totalQuestions
            : 0,
          prerequisites: [],
          dependents: [],
          weakAreas: [],
          strongAreas: [],
          recommendedPractice: []
        });
      } else if (key.startsWith("topic:")) {
        const topicName = key.replace("topic:", "");
        const masteryData = data as any;
        topicMasteries.push({
          topicId: topicName,
          topicName,
          score: {
            current: 50,
            change: 0,
            trend: "stable"
          },
          level: "developing",
          concepts: [],
          skills: [],
          formulas: [],
          questionsAttempted: 0,
          accuracy: 0,
          timeSpent: 0,
          weakAreas: [],
          resourcesCompleted: []
        });
      }
    });

    return createMasteryReport({
      userId,
      conceptMasteries,
      skillMasteries: [],
      formulaMasteries: [],
      topicMasteries,
      chapterMasteries: [],
      subjectMasteries: [],
      period: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() }
    });
  }

  async getMasteryLevel(
    userId: string,
    category: MasteryCategory,
    targetId: string
  ): Promise<MasteryLevel | null> {
    const userData = this.masteryData.get(userId);
    if (!userData) return null;

    const key = `${category}:${targetId}`;
    const data = userData.get(key);

    if (!data) return "not_started";

    const score = calculateMasteryScore({
      correctAnswers: (data as any).correctAnswers || 0,
      totalQuestions: (data as any).totalQuestions || 0
    });

    return calculateMasteryLevel(score);
  }

  setGoal(goal: MasteryGoal): void {
    const userGoals = this.goals.get(goal.userId) || [];
    const existingIndex = userGoals.findIndex(g => g.goalId === goal.goalId);

    if (existingIndex >= 0) {
      userGoals[existingIndex] = goal;
    } else {
      userGoals.push(goal);
    }

    this.goals.set(goal.userId, userGoals);
  }

  clearCache(): void {
    this.masteryData.clear();
    this.goals.clear();
    localStorage.removeItem("quiz_mastery_data");
  }

  destroy(): void {
    this.masteryData.clear();
    this.goals.clear();
    MasteryEngine.instance = null as any;
  }
}

interface MasteryData {
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  [key: string]: any;
}

interface ConceptMasteryData extends MasteryData {
  questions: Array<{
    id: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;
  weakAreas: string[];
  strongAreas: string[];
  history: Array<{
    date: Date;
    isCorrect: boolean;
    accuracy: number;
  }>;
}

export default MasteryEngine;
