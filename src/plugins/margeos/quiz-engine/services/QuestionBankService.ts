// @ts-nocheck
// Adaptive Quiz Engine — QuestionBankService
// Manages question storage, retrieval, and organization

import type { Question, QuestionFilter, QuestionType, DifficultyLevel, QuestionMetadata } from "../models/Question";

export interface QuestionBankConfig {
  maxCacheSize: number;
  cacheExpiration: number;
  enablePersistence: boolean;
  syncEnabled: boolean;
}

export interface QuestionStats {
  totalQuestions: number;
  byType: Record<QuestionType, number>;
  byDifficulty: Record<DifficultyLevel, number>;
  bySubject: Record<string, number>;
  averageSuccessRate: number;
}

export class QuestionBankService {
  private static instance: QuestionBankService;
  private config: QuestionBankConfig;
  private questions: Map<string, Question> = new Map();
  private index: QuestionIndex = new QuestionIndex();

  private constructor(config?: Partial<QuestionBankConfig>) {
    this.config = {
      maxCacheSize: 10000,
      cacheExpiration: 7 * 24 * 60 * 60 * 1000,
      enablePersistence: true,
      syncEnabled: false,
      ...config
    };
    this.loadQuestions();
  }

  static getInstance(config?: Partial<QuestionBankConfig>): QuestionBankService {
    if (!QuestionBankService.instance) {
      QuestionBankService.instance = new QuestionBankService(config);
    }
    return QuestionBankService.instance;
  }

  private loadQuestions(): void {
    if (!this.config.enablePersistence) return;

    try {
      const stored = localStorage.getItem("quiz_question_bank");
      if (stored) {
        const data = JSON.parse(stored);
        data.questions?.forEach((q: Question) => {
          this.questions.set(q.id, q);
        });
        this.rebuildIndex();
      }
    } catch (error) {
      console.warn("Failed to load question bank:", error);
    }
  }

  private saveQuestions(): void {
    if (!this.config.enablePersistence) return;

    try {
      const questionsArray = Array.from(this.questions.values());
      localStorage.setItem("quiz_question_bank", JSON.stringify({
        questions: questionsArray,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.warn("Failed to save question bank:", error);
    }
  }

  private rebuildIndex(): void {
    this.index = new QuestionIndex();
    this.questions.forEach(q => {
      this.index.add(q);
    });
  }

  addQuestion(question: Question): void {
    this.questions.set(question.id, question);
    this.index.add(question);
    this.saveQuestions();
  }

  addQuestions(questions: Question[]): void {
    questions.forEach(q => this.addQuestion(q));
  }

  getQuestion(id: string): Question | undefined {
    return this.questions.get(id);
  }

  getQuestions(filter?: QuestionFilter, limit?: number): Question[] {
    let results = this.index.search(filter);

    if (limit && limit > 0) {
      results = results.slice(0, limit);
    }

    return results;
  }

  updateQuestion(id: string, updates: Partial<Question>): Question | null {
    const existing = this.questions.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date()
    };

    this.questions.set(id, updated);
    this.rebuildIndex();
    this.saveQuestions();

    return updated;
  }

  deleteQuestion(id: string): boolean {
    const deleted = this.questions.delete(id);
    if (deleted) {
      this.rebuildIndex();
      this.saveQuestions();
    }
    return deleted;
  }

  getStats(): QuestionStats {
    const stats: QuestionStats = {
      totalQuestions: this.questions.size,
      byType: this.initializeTypeCounts(),
      byDifficulty: this.initializeDifficultyCounts(),
      bySubject: {},
      averageSuccessRate: 0
    };

    let totalSuccess = 0;
    let questionsWithStats = 0;

    this.questions.forEach(q => {
      // By type
      if (stats.byType[q.type] !== undefined) {
        stats.byType[q.type]++;
      }

      // By difficulty
      const difficulty = q.metadata.difficulty || "medium";
      stats.byDifficulty[difficulty]++;

      // By subject
      const subject = q.metadata.subject;
      stats.bySubject[subject] = (stats.bySubject[subject] || 0) + 1;

      // Success rate
      if (q.statistics && q.statistics.totalAttempts > 0) {
        totalSuccess += q.statistics.successRate;
        questionsWithStats++;
      }
    });

    stats.averageSuccessRate = questionsWithStats > 0
      ? totalSuccess / questionsWithStats
      : 0;

    return stats;
  }

  private initializeTypeCounts(): Record<QuestionType, number> {
    return {
      mcq: 0,
      true_false: 0,
      short_answer: 0,
      long_answer: 0,
      numerical: 0,
      formula: 0,
      diagram: 0,
      matching: 0,
      sequencing: 0,
      scenario: 0
    };
  }

  private initializeDifficultyCounts(): Record<DifficultyLevel, number> {
    return {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0
    };
  }

  getQuestionsByTopic(topic: string): Question[] {
    return this.getQuestions({ topics: [topic] });
  }

  getQuestionsBySubject(subject: string): Question[] {
    return this.getQuestions({ subjects: [subject] });
  }

  getQuestionsByDifficulty(difficulty: DifficultyLevel): Question[] {
    return this.getQuestions({ difficulty: [difficulty] });
  }

  getQuestionsByType(type: QuestionType): Question[] {
    return this.getQuestions({ types: [type] });
  }

  getRandomQuestions(filter?: QuestionFilter, count: number = 10): Question[] {
    const all = this.getQuestions(filter);
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getDifficultQuestions(minDifficulty: DifficultyLevel, count: number = 10): Question[] {
    const difficultyOrder: DifficultyLevel[] = ["easy", "medium", "hard", "expert"];
    const minIndex = difficultyOrder.indexOf(minDifficulty);
    const difficulties = difficultyOrder.slice(minIndex);

    return this.getQuestions({ difficulty: difficulties }, count);
  }

  getEasyQuestions(count: number = 10): Question[] {
    return this.getQuestionsByDifficulty("easy").slice(0, count);
  }

  searchQuestions(query: string): Question[] {
    const lowerQuery = query.toLowerCase();
    const results: Question[] = [];

    this.questions.forEach(q => {
      if (
        q.content.text.toLowerCase().includes(lowerQuery) ||
        q.metadata.topic.toLowerCase().includes(lowerQuery) ||
        q.metadata.subject.toLowerCase().includes(lowerQuery) ||
        q.metadata.tags.some(t => t.toLowerCase().includes(lowerQuery))
      ) {
        results.push(q);
      }
    });

    return results;
  }

  updateQuestionStats(
    questionId: string,
    stats: { isCorrect: boolean; timeSpent: number }
  ): void {
    const question = this.questions.get(questionId);
    if (!question || !question.statistics) return;

    question.statistics.totalAttempts++;
    if (stats.isCorrect) {
      question.statistics.correctAttempts++;
    }

    const total = question.statistics.totalAttempts;
    question.statistics.averageTime =
      (question.statistics.averageTime * (total - 1) + stats.timeSpent) / total;

    question.statistics.successRate =
      (question.statistics.correctAttempts / total) * 100;

    question.statistics.lastAttempted = new Date();

    this.questions.set(questionId, question);
    this.saveQuestions();
  }

  clearCache(): void {
    this.questions.clear();
    this.rebuildIndex();
    localStorage.removeItem("quiz_question_bank");
  }

  exportQuestions(): Question[] {
    return Array.from(this.questions.values());
  }

  importQuestions(questions: Question[]): number {
    let imported = 0;
    questions.forEach(q => {
      if (!this.questions.has(q.id)) {
        this.questions.set(q.id, q);
        imported++;
      }
    });

    if (imported > 0) {
      this.rebuildIndex();
      this.saveQuestions();
    }

    return imported;
  }

  destroy(): void {
    this.questions.clear();
    QuestionBankService.instance = null as any;
  }
}

class QuestionIndex {
  private bySubject: Map<string, Set<string>> = new Map();
  private byTopic: Map<string, Set<string>> = new Map();
  private byType: Map<QuestionType, Set<string>> = new Map();
  private byDifficulty: Map<DifficultyLevel, Set<string>> = new Map();
  private bySource: Map<string, Set<string>> = new Map();
  private allIds: Set<string> = new Set();

  add(question: Question): void {
    const id = question.id;
    this.allIds.add(id);

    // By subject
    const subject = question.metadata.subject;
    if (!this.bySubject.has(subject)) {
      this.bySubject.set(subject, new Set());
    }
    this.bySubject.get(subject)!.add(id);

    // By topic
    const topic = question.metadata.topic;
    if (!this.byTopic.has(topic)) {
      this.byTopic.set(topic, new Set());
    }
    this.byTopic.get(topic)!.add(id);

    // By type
    if (!this.byType.has(question.type)) {
      this.byType.set(question.type, new Set());
    }
    this.byType.get(question.type)!.add(id);

    // By difficulty
    const difficulty = question.metadata.difficulty || "medium";
    if (!this.byDifficulty.has(difficulty)) {
      this.byDifficulty.set(difficulty, new Set());
    }
    this.byDifficulty.get(difficulty)!.add(id);

    // By source
    const source = question.metadata.source;
    if (!this.bySource.has(source)) {
      this.bySource.set(source, new Set());
    }
    this.bySource.get(source)!.add(id);
  }

  search(filter?: QuestionFilter): Question[] {
    let resultIds: Set<string> | null = null;

    if (filter?.subjects?.length) {
      const subjectSet = new Set<string>();
      filter.subjects.forEach(s => {
        this.bySubject.get(s)?.forEach(id => subjectSet.add(id));
      });
      resultIds = subjectSet;
    }

    if (filter?.topics?.length) {
      const topicSet = new Set<string>();
      filter.topics.forEach(t => {
        this.byTopic.get(t)?.forEach(id => topicSet.add(id));
      });
      resultIds = resultIds
        ? new Set([...resultIds].filter(id => topicSet.has(id)))
        : topicSet;
    }

    if (filter?.types?.length) {
      const typeSet = new Set<string>();
      filter.types.forEach(t => {
        this.byType.get(t)?.forEach(id => typeSet.add(id));
      });
      resultIds = resultIds
        ? new Set([...resultIds].filter(id => typeSet.has(id)))
        : typeSet;
    }

    if (filter?.difficulty?.length) {
      const diffSet = new Set<string>();
      filter.difficulty.forEach(d => {
        this.byDifficulty.get(d)?.forEach(id => diffSet.add(id));
      });
      resultIds = resultIds
        ? new Set([...resultIds].filter(id => diffSet.has(id)))
        : diffSet;
    }

    if (filter?.source?.length) {
      const sourceSet = new Set<string>();
      filter.source.forEach(s => {
        this.bySource.get(s)?.forEach(id => sourceSet.add(id));
      });
      resultIds = resultIds
        ? new Set([...resultIds].filter(id => sourceSet.has(id)))
        : sourceSet;
    }

    const ids = resultIds || this.allIds;
    return Array.from(ids) as any;
  }
}

export default QuestionBankService;
