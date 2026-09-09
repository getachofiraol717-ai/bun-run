// @ts-nocheck
/**
 * ExamGenerator.ts
 *
 * Generates exam content based on configuration, topics, and difficulty settings.
 * Integrates with Knowledge Galaxy for topic relationships and Adaptive Quiz
 * for difficulty calibration.
 */

import type { Exam, ExamMode, ExamConfig } from '../models';
import type { ExamQuestion, ExamQuestionContent, ExamOption } from '../models/ExamQuestion';
import { examStorage } from '../store/examSimulatorStore';

export interface GeneratedQuestion {
  question: ExamQuestion;
  source: 'question_bank' | 'ai_generated' | 'adaptive';
  confidence: number;
  difficulty: number;
}

export interface GenerationContext {
  topics: string[];
  subject?: string;
  chapter?: string;
  excludedQuestions?: string[];
  requiredQuestionTypes?: string[];
  targetDifficulty?: number;
}

export class ExamGenerator {
  private static instance: ExamGenerator;
  private initialized: boolean = false;
  private questionBank: Map<string, ExamQuestion[]> = new Map();
  private difficultyCalibration: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ExamGenerator {
    if (!ExamGenerator.instance) {
      ExamGenerator.instance = new ExamGenerator();
    }
    return ExamGenerator.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load existing questions from storage
    const allQuestions = examStorage.getAllQuestions();
    allQuestions.forEach(q => {
      const topic = q.content.topic || 'general';
      const questions = this.questionBank.get(topic) || [];
      questions.push(q);
      this.questionBank.set(topic, questions);
    });

    this.initialized = true;
  }

  /**
   * Generate a complete exam based on configuration
   */
  async generateExam(config: ExamConfig): Promise<Exam> {
    const questions = await this.generateQuestions(config);

    const exam: Exam = {
      id: this.generateExamId(),
      title: config.title,
      description: config.description,
      mode: config.mode,
      status: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {
        mode: config.mode,
        duration: config.duration,
        totalQuestions: questions.length,
        passingScore: config.passingScore,
        topics: config.topics,
        difficulty: config.difficulty,
        shuffleQuestions: config.shuffleQuestions,
        shuffleOptions: config.shuffleOptions,
        showResults: config.showResults,
        showSolutions: config.showSolutions,
        allowPause: config.allowPause,
        allowReview: config.allowReview,
        randomizeDifficulty: config.randomizeDifficulty,
        adaptiveDifficulty: config.adaptiveDifficulty,
        questionTypes: config.questionTypes,
        subject: config.subject,
        chapter: config.chapter,
        difficultyDistribution: config.difficultyDistribution,
        tags: config.tags,
        settings: config.settings,
        rules: config.rules,
        accessibility: config.accessibility,
        metadata: config.metadata
      },
      questions,
      settings: config.settings,
      rules: config.rules,
      accessibility: config.accessibility,
      metadata: config.metadata || {}
    };

    examStorage.saveExam(exam);
    return exam;
  }

  /**
   * Generate questions based on exam configuration
   */
  async generateQuestions(config: ExamConfig): Promise<ExamQuestion[]> {
    const context: GenerationContext = {
      topics: config.topics,
      subject: config.subject,
      chapter: config.chapter,
      excludedQuestions: [],
      requiredQuestionTypes: config.questionTypes,
      targetDifficulty: this.getAverageDifficulty(config.difficultyDistribution)
    };

    let questions: GeneratedQuestion[] = [];

    // Get questions from question bank
    for (const topic of config.topics) {
      const topicQuestions = await this.getQuestionsFromBank(topic, config);
      questions.push(...topicQuestions);
    }

    // Fill remaining slots with AI-generated questions
    if (questions.length < config.totalQuestions) {
      const remaining = config.totalQuestions - questions.length;
      const generatedQuestions = await this.generateAIQuestions(
        remaining,
        context,
        config.difficultyDistribution
      );
      questions.push(...generatedQuestions);
    }

    // Apply shuffling if needed
    if (config.shuffleQuestions) {
      questions = this.shuffleArray(questions);
    }

    // Take only the required number of questions
    questions = questions.slice(0, config.totalQuestions);

    // Finalize questions
    return questions.map((gq, index) => ({
      ...gq.question,
      order: index + 1
    }));
  }

  /**
   * Generate AI-powered questions
   */
  async generateAIQuestions(
    count: number,
    context: GenerationContext,
    difficultyDistribution?: Record<string, number>
  ): Promise<GeneratedQuestion[]> {
    const questions: GeneratedQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const difficulty = this.selectDifficulty(difficultyDistribution);
      const question = await this.createAIQuestion(context, difficulty);

      questions.push({
        question,
        source: 'ai_generated',
        confidence: 0.85,
        difficulty
      });
    }

    return questions;
  }

  /**
   * Create a single AI-generated question
   */
  private async createAIQuestion(
    context: GenerationContext,
    difficulty: number
  ): Promise<ExamQuestion> {
    const questionTypes = context.requiredQuestionTypes || ['MCQ'];
    const questionType = this.randomFromArray(questionTypes);

    const questionContent: ExamQuestionContent = {
      id: this.generateQuestionId(),
      type: questionType as any,
      text: this.generateQuestionText(context, questionType, difficulty),
      options: this.generateOptions(questionType, difficulty),
      correctAnswer: '',
      explanation: this.generateExplanation(context, difficulty),
      topic: context.topics[0] || 'general',
      difficulty: difficulty,
      tags: context.topics,
      hints: this.generateHints(context, difficulty),
      timeAllocation: this.calculateTimeAllocation(difficulty),
      points: this.calculatePoints(difficulty)
    };

    if (questionType === 'MCQ' || questionType === 'T_F' || questionType === 'MULTI_SELECT') {
      const correctIdx = questionContent.options?.findIndex(o => o.isCorrect) ?? -1;
      if (correctIdx >= 0) {
        questionContent.correctAnswer = String.fromCharCode(65 + correctIdx);
      }
    }

    return {
      id: questionContent.id,
      content: questionContent,
      solution: {
        explanation: questionContent.explanation || '',
        stepByStep: this.generateStepSolution(questionContent),
        relatedConcepts: this.generateRelatedConcepts(context),
        commonMistakes: this.generateCommonMistakes(context, questionType),
        keyTakeaway: this.generateKeyTakeaway(context)
      },
      metadata: {
        source: 'ai_generated',
        confidence: 0.85,
        generatedAt: new Date().toISOString(),
        calibrated: false
      }
    };
  }

  /**
   * Generate question text based on context
   */
  private generateQuestionText(
    context: GenerationContext,
    questionType: string,
    difficulty: number
  ): string {
    const templates = this.getQuestionTemplates(context.topics[0], questionType);
    const template = this.randomFromArray(templates);

    return template
      .replace('{TOPIC}', context.topics[0] || 'the subject')
      .replace('{SUBJECT}', context.subject || 'this topic')
      .replace('{DIFFICULTY}', difficulty > 0.7 ? 'advanced' : difficulty > 0.4 ? 'intermediate' : 'basic');
  }

  /**
   * Generate options for MCQ/Multi-select questions
   */
  private generateOptions(
    questionType: string,
    difficulty: number
  ): ExamOption[] | undefined {
    if (questionType === 'SHORT_ANSWER' || questionType === 'ESSAY') {
      return undefined;
    }

    if (questionType === 'T_F') {
      return [
        { id: 'A', text: 'True', isCorrect: Math.random() > 0.5 },
        { id: 'B', text: 'False', isCorrect: Math.random() <= 0.5 }
      ];
    }

    const optionCount = questionType === 'MULTI_SELECT' ? 5 : 4;
    const options: ExamOption[] = [];

    for (let i = 0; i < optionCount; i++) {
      options.push({
        id: String.fromCharCode(65 + i),
        text: `Option ${String.fromCharCode(65 + i)} - Generated answer`,
        isCorrect: i === 0
      });
    }

    // Shuffle and ensure correct answer position is randomized
    if (options.length > 0) {
      const correctIdx = Math.floor(Math.random() * options.length);
      options.forEach((opt, idx) => opt.isCorrect = idx === correctIdx);
    }

    return options;
  }

  /**
   * Generate explanation for the question
   */
  private generateExplanation(context: GenerationContext, difficulty: number): string {
    const explanations = [
      `This question tests your understanding of ${context.topics[0] || 'key concepts'}.`,
      `Understanding ${context.topics[0] || 'this topic'} is essential for ${context.subject || 'mastering the subject'}.`,
      `This concept builds on foundational knowledge in ${context.topics[0] || 'the subject area'}.`
    ];
    return this.randomFromArray(explanations);
  }

  /**
   * Generate hints for the question
   */
  private generateHints(context: GenerationContext, difficulty: number): string[] {
    const hints: string[] = [];

    if (difficulty < 0.5) {
      hints.push(`Remember the core principles of ${context.topics[0] || 'this topic'}.`);
      hints.push('Consider the fundamental definition.');
    }

    if (difficulty >= 0.5) {
      hints.push('Think about how this relates to other concepts.');
      hints.push('Consider the application in practical scenarios.');
    }

    return hints;
  }

  /**
   * Calculate time allocation for a question
   */
  private calculateTimeAllocation(difficulty: number): number {
    const baseTime = 60; // seconds
    const difficultyMultiplier = 1 + (difficulty * 0.5);
    return Math.round(baseTime * difficultyMultiplier);
  }

  /**
   * Calculate points for a question
   */
  private calculatePoints(difficulty: number): number {
    if (difficulty < 0.3) return 1;
    if (difficulty < 0.6) return 2;
    if (difficulty < 0.8) return 3;
    return 5;
  }

  /**
   * Generate step-by-step solution
   */
  private generateStepSolution(content: ExamQuestionContent): { step: string; explanation: string }[] {
    return [
      {
        step: 'Understand the Question',
        explanation: 'Carefully analyze what is being asked.'
      },
      {
        step: 'Identify Key Concepts',
        explanation: `This question relates to ${content.topic || 'the topic'}.`
      },
      {
        step: 'Apply Solution Method',
        explanation: 'Use the appropriate approach to solve.'
      },
      {
        step: 'Verify Answer',
        explanation: 'Check your work to ensure accuracy.'
      }
    ];
  }

  /**
   * Generate related concepts
   */
  private generateRelatedConcepts(context: GenerationContext): string[] {
    return [
      context.topics[0] || 'core concepts',
      context.subject || 'related topics',
      'foundational principles'
    ];
  }

  /**
   * Generate common mistakes
   */
  private generateCommonMistakes(context: GenerationContext, questionType: string): string[] {
    return [
      'Not reading the question carefully',
      `Confusing similar concepts in ${context.topics[0] || 'the topic'}`,
      'Missing key details in the options'
    ];
  }

  /**
   * Generate key takeaway
   */
  private generateKeyTakeaway(context: GenerationContext): string {
    return `Understanding ${context.topics[0] || 'this concept'} is crucial for ${context.subject || 'mastering the subject'}.`;
  }

  /**
   * Get questions from the question bank
   */
  private async getQuestionsFromBank(
    topic: string,
    config: ExamConfig
  ): Promise<GeneratedQuestion[]> {
    const questions = this.questionBank.get(topic) || [];

    const filtered = questions.filter(q => {
      if (config.questionTypes && !config.questionTypes.includes(q.content.type)) {
        return false;
      }
      if (config.difficulty) {
        const diff = q.content.difficulty;
        if (config.difficulty === 'easy' && diff > 0.4) return false;
        if (config.difficulty === 'medium' && (diff < 0.3 || diff > 0.7)) return false;
        if (config.difficulty === 'hard' && diff < 0.6) return false;
      }
      return true;
    });

    return filtered.map(q => ({
      question: q,
      source: 'question_bank' as const,
      confidence: q.metadata?.confidence || 1,
      difficulty: q.content.difficulty
    }));
  }

  /**
   * Add questions to the question bank
   */
  addToQuestionBank(questions: ExamQuestion[]): void {
    questions.forEach(q => {
      const topic = q.content.topic || 'general';
      const bankQuestions = this.questionBank.get(topic) || [];
      bankQuestions.push(q);
      this.questionBank.set(topic, bankQuestions);
    });
  }

  /**
   * Get question bank statistics
   */
  getQuestionBankStats(): { topic: string; count: number }[] {
    const stats: { topic: string; count: number }[] = [];

    this.questionBank.forEach((questions, topic) => {
      stats.push({ topic, count: questions.length });
    });

    return stats.sort((a, b) => b.count - a.count);
  }

  private getAverageDifficulty(distribution?: Record<string, number>): number {
    if (!distribution) return 0.5;

    let weightedSum = 0;
    let total = 0;

    const difficultyValues: Record<string, number> = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.8
    };

    Object.entries(distribution).forEach(([level, percentage]) => {
      const value = difficultyValues[level] || 0.5;
      weightedSum += value * percentage;
      total += percentage;
    });

    return total > 0 ? weightedSum / total : 0.5;
  }

  private selectDifficulty(distribution?: Record<string, number>): number {
    if (!distribution) return 0.5;

    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const [level, percentage] of Object.entries(distribution)) {
      cumulative += percentage;
      if (rand <= cumulative) {
        const values: Record<string, number> = {
          easy: 0.2 + Math.random() * 0.2,
          medium: 0.4 + Math.random() * 0.2,
          hard: 0.7 + Math.random() * 0.2
        };
        return values[level] || 0.5;
      }
    }

    return 0.5;
  }

  private getQuestionTemplates(topic: string, type: string): string[] {
    const templates: Record<string, string[]> = {
      MCQ: [
        `Which of the following best describes {TOPIC}?`,
        `What is the primary purpose of {TOPIC}?`,
        `Which statement about {TOPIC} is correct?`
      ],
      T_F: [
        `{TOPIC} is a fundamental concept in {SUBJECT}.`,
        `The principle of {TOPIC} applies to all cases.`,
        `{TOPIC} can be applied in {DIFFICULTY} scenarios.`
      ],
      SHORT_ANSWER: [
        `Explain the relationship between {TOPIC} and {SUBJECT}.`,
        `Describe the key characteristics of {TOPIC}.`,
        `What are the main applications of {TOPIC}?`
      ],
      MULTI_SELECT: [
        `Which of the following are true about {TOPIC}?`,
        `Select all that apply regarding {TOPIC}.`,
        `Identify the correct statements about {TOPIC}.`
      ],
      ESSAY: [
        `Discuss the importance of {TOPIC} in {SUBJECT}.`,
        `Analyze the impact of {TOPIC} on modern applications.`,
        `Compare and contrast different approaches to {TOPIC}.`
      ]
    };

    return templates[type] || templates.MCQ;
  }

  private generateExamId(): string {
    return `EXAM-${Date.now()}-${this.generateRandomString(8)}`;
  }

  private generateQuestionId(): string {
    return `Q-${Date.now()}-${this.generateRandomString(6)}`;
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private randomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

export default ExamGenerator;
