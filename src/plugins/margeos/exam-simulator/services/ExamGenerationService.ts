// @ts-nocheck
/**
 * ExamGenerationService.ts
 *
 * Service for exam generation operations including question bank management,
 * AI-powered question generation, and exam composition.
 */

import type { Exam, ExamConfig, ExamMode } from '../models';
import type { ExamQuestion, ExamQuestionContent } from '../models/ExamQuestion';
import { ExamGenerator } from '../core/ExamGenerator';
import { examStorage } from '../store/examSimulatorStore';

export interface GenerationOptions {
  topics: string[];
  subject?: string;
  chapter?: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes?: string[];
  includeAI: boolean;
  timeLimit?: number;
  passingScore?: number;
}

export interface QuestionBankFilter {
  topics?: string[];
  questionTypes?: string[];
  difficulty?: { min?: number; max?: number };
  tags?: string[];
  limit?: number;
}

class ExamGenerationService {
  private static instance: ExamGenerationService;
  private examGenerator: ExamGenerator;
  private questionCache: Map<string, ExamQuestion[]> = new Map();

  private constructor() {
    this.examGenerator = ExamGenerator.getInstance();
  }

  static getInstance(): ExamGenerationService {
    if (!ExamGenerationService.instance) {
      ExamGenerationService.instance = new ExamGenerationService();
    }
    return ExamGenerationService.instance;
  }

  /**
   * Generate a complete exam
   */
  async generateExam(options: GenerationOptions): Promise<Exam> {
    const config: ExamConfig = {
      mode: this.determineExamMode(options),
      title: options.title || `Custom ${options.subject || 'Subject'} Exam`,
      description: options.description || '',
      duration: options.timeLimit || 60,
      totalQuestions: options.questionCount,
      passingScore: options.passingScore || 60,
      topics: options.topics,
      difficulty: options.difficulty,
      shuffleQuestions: true,
      shuffleOptions: true,
      showResults: true,
      showSolutions: true,
      allowPause: true,
      allowReview: true,
      randomizeDifficulty: true,
      adaptiveDifficulty: false,
      questionTypes: options.questionTypes || ['MCQ', 'T_F'],
      subject: options.subject,
      chapter: options.chapter,
      difficultyDistribution: this.getDefaultDifficultyDistribution(options.difficulty),
      tags: options.topics,
      settings: {},
      rules: {},
      accessibility: {},
      metadata: {}
    };

    return await this.examGenerator.generateExam(config);
  }

  /**
   * Generate questions for a specific topic
   */
  async generateQuestionsForTopic(
    topic: string,
    count: number,
    difficulty: number = 0.5
  ): Promise<ExamQuestion[]> {
    const config: ExamConfig = {
      mode: 'practice',
      title: `${topic} Practice Questions`,
      description: '',
      duration: 30,
      totalQuestions: count,
      passingScore: 50,
      topics: [topic],
      difficulty: this.difficultyToLevel(difficulty),
      shuffleQuestions: false,
      shuffleOptions: true,
      showResults: true,
      showSolutions: true,
      allowPause: true,
      allowReview: true,
      randomizeDifficulty: false,
      adaptiveDifficulty: false,
      questionTypes: ['MCQ'],
      subject: topic,
      chapter: '',
      difficultyDistribution: { easy: 100 },
      tags: [topic],
      settings: {},
      rules: {},
      accessibility: {},
      metadata: {}
    };

    const exam = await this.examGenerator.generateExam(config);
    return exam.questions;
  }

  /**
   * Add questions to the question bank
   */
  addQuestionsToBank(questions: ExamQuestion[]): void {
    this.examGenerator.addToQuestionBank(questions);
    examStorage.saveQuestions(questions);
  }

  /**
   * Get questions from bank with filtering
   */
  getQuestionsFromBank(filter: QuestionBankFilter): ExamQuestion[] {
    let questions = examStorage.getAllQuestions();

    if (filter.topics && filter.topics.length > 0) {
      questions = questions.filter(q =>
        filter.topics!.some(t =>
          q.content.topic === t ||
          q.content.tags?.includes(t)
        )
      );
    }

    if (filter.questionTypes && filter.questionTypes.length > 0) {
      questions = questions.filter(q =>
        filter.questionTypes!.includes(q.content.type)
      );
    }

    if (filter.difficulty) {
      questions = questions.filter(q => {
        const diff = q.content.difficulty;
        if (filter.difficulty!.min !== undefined && diff < filter.difficulty!.min) return false;
        if (filter.difficulty!.max !== undefined && diff > filter.difficulty!.max) return false;
        return true;
      });
    }

    if (filter.limit && filter.limit > 0) {
      questions = questions.slice(0, filter.limit);
    }

    return questions;
  }

  /**
   * Generate a chapter-based exam
   */
  async generateChapterExam(
    chapter: string,
    subject: string,
    questionCount: number = 20
  ): Promise<Exam> {
    const options: GenerationOptions = {
      topics: [chapter],
      subject,
      chapter,
      questionCount,
      difficulty: 'mixed',
      questionTypes: ['MCQ', 'T_F', 'SHORT_ANSWER'],
      includeAI: true,
      timeLimit: 45,
      passingScore: 60
    };

    return await this.generateExam(options);
  }

  /**
   * Generate a subject-wide exam
   */
  async generateSubjectExam(
    subject: string,
    questionCount: number = 30
  ): Promise<Exam> {
    const options: GenerationOptions = {
      topics: await this.getTopicsForSubject(subject),
      subject,
      questionCount,
      difficulty: 'mixed',
      questionTypes: ['MCQ', 'T_F', 'SHORT_ANSWER', 'MULTI_SELECT'],
      includeAI: true,
      timeLimit: 90,
      passingScore: 60
    };

    return await this.generateExam(options);
  }

  /**
   * Generate a comprehensive exam
   */
  async generateComprehensiveExam(
    subjects: string[],
    questionCount: number = 50
  ): Promise<Exam> {
    const allTopics: string[] = [];

    for (const subject of subjects) {
      const topics = await this.getTopicsForSubject(subject);
      allTopics.push(...topics);
    }

    const options: GenerationOptions = {
      topics: allTopics,
      subject: subjects.join(' & '),
      questionCount,
      difficulty: 'mixed',
      questionTypes: ['MCQ', 'T_F', 'SHORT_ANSWER', 'MULTI_SELECT', 'MATCHING'],
      includeAI: true,
      timeLimit: 120,
      passingScore: 60
    };

    return await this.generateExam(options);
  }

  /**
   * Generate an adaptive exam
   */
  async generateAdaptiveExam(
    topics: string[],
    initialDifficulty: number = 0.5
  ): Promise<Exam> {
    const config: ExamConfig = {
      mode: 'adaptive',
      title: 'Adaptive Practice Exam',
      description: 'Difficulty adjusts based on your performance',
      duration: 60,
      totalQuestions: 25,
      passingScore: 60,
      topics,
      difficulty: this.difficultyToLevel(initialDifficulty),
      shuffleQuestions: false,
      shuffleOptions: true,
      showResults: true,
      showSolutions: true,
      allowPause: true,
      allowReview: true,
      randomizeDifficulty: false,
      adaptiveDifficulty: true,
      questionTypes: ['MCQ', 'T_F', 'SHORT_ANSWER'],
      subject: topics[0] || '',
      chapter: '',
      difficultyDistribution: { easy: 33, medium: 34, hard: 33 },
      tags: topics,
      settings: {},
      rules: {},
      accessibility: {},
      metadata: {}
    };

    return await this.examGenerator.generateExam(config);
  }

  /**
   * Generate a revision exam focusing on weak areas
   */
  async generateRevisionExam(weakTopics: string[]): Promise<Exam> {
    const options: GenerationOptions = {
      topics: weakTopics,
      subject: weakTopics[0] || '',
      questionCount: 15,
      difficulty: 'mixed',
      questionTypes: ['MCQ', 'T_F'],
      includeAI: true,
      timeLimit: 30,
      passingScore: 70
    };

    return await this.generateExam(options);
  }

  /**
   * Get question bank statistics
   */
  getQuestionBankStats(): { topic: string; count: number }[] {
    return this.examGenerator.getQuestionBankStats();
  }

  /**
   * Clear question cache
   */
  clearCache(): void {
    this.questionCache.clear();
  }

  private determineExamMode(options: GenerationOptions): ExamMode {
    if (options.chapter) return 'chapter';
    if (options.topics.length === 1) return 'subject';
    return 'custom';
  }

  private getDefaultDifficultyDistribution(difficulty: string): Record<string, number> {
    switch (difficulty) {
      case 'easy':
        return { easy: 70, medium: 30, hard: 0 };
      case 'medium':
        return { easy: 30, medium: 50, hard: 20 };
      case 'hard':
        return { easy: 0, medium: 30, hard: 70 };
      default:
        return { easy: 30, medium: 40, hard: 30 };
    }
  }

  private difficultyToLevel(difficulty: number): 'easy' | 'medium' | 'hard' | 'mixed' {
    if (difficulty < 0.35) return 'easy';
    if (difficulty < 0.65) return 'medium';
    return 'hard';
  }

  private async getTopicsForSubject(subject: string): Promise<string[]> {
    // In production, this would integrate with Knowledge Galaxy
    return [subject, `${subject} - Fundamentals`, `${subject} - Advanced Topics`];
  }
}

export const examGenerationService = ExamGenerationService.getInstance();
export default examGenerationService;
