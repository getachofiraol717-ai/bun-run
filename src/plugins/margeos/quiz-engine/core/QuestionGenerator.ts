// @ts-nocheck
// Adaptive Quiz Engine — QuestionGenerator
// AI-powered question generation from various content sources

import type {
  Question,
  QuestionType,
  QuestionContent,
  DifficultyLevel,
  QuestionFilter,
  QuestionGenerationRequest,
  QuestionMetadata,
  CognitiveLevel,
  Option
} from "../models/Question";
import type { Quiz } from "../models/Quiz";

export interface GenerationContext {
  source: QuestionMetadata["source"];
  sourceId?: string;
  chapterId?: string;
  lessonId?: string;
  existingQuestions?: Question[];
  userProfile?: {
    level: DifficultyLevel;
    strongTopics?: string[];
    weakTopics?: string[];
  };
}

export interface GeneratedQuestion {
  question: Question;
  confidence: number;
  suggestedDifficulty: DifficultyLevel;
  validation: {
    isValid: boolean;
    issues: string[];
  };
}

export class QuestionGenerator {
  private static instance: QuestionGenerator;
  private questionCache: Map<string, Question> = new Map();
  private templates: Map<string, QuestionTemplate> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.loadTemplates();
    this.loadCachedQuestions();
  }

  static getInstance(): QuestionGenerator {
    if (!QuestionGenerator.instance) {
      QuestionGenerator.instance = new QuestionGenerator();
    }
    return QuestionGenerator.instance;
  }

  private loadTemplates(): void {
    // Built-in question templates
    const builtInTemplates: QuestionTemplate[] = [
      {
        id: "definition",
        name: "Definition Question",
        type: "short_answer",
        prompt: "What is the definition of {concept}?",
        requiredFields: ["concept"],
        difficultyAdjustment: 0
      },
      {
        id: "concept_explanation",
        name: "Concept Explanation",
        type: "short_answer",
        prompt: "Explain how {concept} works in the context of {context}.",
        requiredFields: ["concept", "context"],
        difficultyAdjustment: 0.1
      },
      {
        id: "comparison",
        name: "Comparison Question",
        type: "mcq",
        prompt: "Which of the following best describes the difference between {item1} and {item2}?",
        requiredFields: ["item1", "item2"],
        optionsCount: 4,
        difficultyAdjustment: 0.05
      },
      {
        id: "application",
        name: "Application Question",
        type: "scenario",
        prompt: "Given the following situation: {scenario}\n\nHow would you apply {concept} to solve this problem?",
        requiredFields: ["scenario", "concept"],
        difficultyAdjustment: 0.15
      },
      {
        id: "calculation",
        name: "Calculation Question",
        type: "numerical",
        prompt: "Calculate {calculation} given {variables}.",
        requiredFields: ["calculation", "variables"],
        difficultyAdjustment: 0.1
      },
      {
        id: "true_false_correct",
        name: "True/False Question",
        type: "true_false",
        prompt: "{statement}",
        requiredFields: ["statement"],
        difficultyAdjustment: -0.1
      },
      {
        id: "sequence",
        name: "Sequencing Question",
        type: "sequencing",
        prompt: "Arrange the following steps in the correct order: {steps}",
        requiredFields: ["steps"],
        difficultyAdjustment: 0.1
      },
      {
        id: "matching",
        name: "Matching Question",
        type: "matching",
        prompt: "Match the items in Column A with their corresponding items in Column B.",
        requiredFields: ["columnA", "columnB"],
        difficultyAdjustment: 0.05
      }
    ];

    builtInTemplates.forEach(t => this.templates.set(t.id, t));
  }

  private loadCachedQuestions(): void {
    try {
      const stored = localStorage.getItem("quiz_question_cache");
      if (stored) {
        const questions = JSON.parse(stored) as Question[];
        questions.forEach(q => {
          this.questionCache.set(q.id, q);
        });
      }
    } catch (error) {
      console.warn("Failed to load cached questions:", error);
    }
  }

  private saveCachedQuestions(): void {
    try {
      const questions = Array.from(this.questionCache.values()).slice(-1000);
      localStorage.setItem("quiz_question_cache", JSON.stringify(questions));
    } catch (error) {
      console.warn("Failed to save question cache:", error);
    }
  }

  async generateQuestions(request: QuestionGenerationRequest): Promise<Question[]> {
    const questions: Question[] = [];
    const excludeSet = new Set(request.excludeIds || []);

    for (let i = 0; i < request.count; i++) {
      const question = await this.generateSingleQuestion(request, excludeSet);
      if (question) {
        questions.push(question);
        excludeSet.add(question.id);
      }
    }

    return questions;
  }

  async generateSingleQuestion(
    request: QuestionGenerationRequest,
    excludeIds?: Set<string>
  ): Promise<Question | null> {
    // Check cache first
    const cacheKey = `${request.subject}:${request.topic}:${request.difficulty}:${request.type}`;

    // Generate based on source
    let content: QuestionContent;
    let options: Option[] | undefined;
    let correctAnswer: any;
    let hints: string[] = [];
    let explanation: Question["explanation"];

    switch (request.source) {
      case "pdf":
        ({ content, options, correctAnswer, hints, explanation } = await this.generateFromPDF(request));
        break;
      case "tutor":
        ({ content, options, correctAnswer, hints, explanation } = await this.generateFromTutor(request));
        break;
      case "formula":
        ({ content, options, correctAnswer, hints, explanation } = await this.generateFromFormula(request));
        break;
      case "reference":
        ({ content, options, correctAnswer, hints, explanation } = await this.generateFromReference(request));
        break;
      case "visual":
        ({ content, options, correctAnswer, hints, explanation } = await this.generateFromVisual(request));
        break;
      case "knowledge_galaxy":
        ({ content, options, correctAnswer, hints, explanation } = await this.generateFromKnowledgeGalaxy(request));
        break;
      default:
        ({ content, options, correctAnswer, hints, explanation } = await this.generateGenericQuestion(request));
    }

    const metadata: QuestionMetadata = {
      source: request.source,
      sourceId: request.sourceId,
      subject: request.subject,
      topic: request.topic,
      tags: [request.subject, request.topic],
      difficulty: request.difficulty,
      estimatedTime: this.getEstimatedTime(request.difficulty, request.types?.[0]),
      points: this.getPoints(request.difficulty),
      bloomLevel: request.cognitiveLevel
    };

    const question: Question = {
      id: this.generateQuestionId(),
      type: request.types?.[0] || "mcq",
      content,
      options,
      correctAnswer,
      metadata,
      hints,
      explanation,
      settings: {
        showFeedback: true,
        showHints: true,
        allowSkip: true,
        randomizeOptions: true
      },
      statistics: {
        totalAttempts: 0,
        correctAttempts: 0,
        averageTime: 0,
        difficultyHistory: [request.difficulty],
        commonMistakes: [],
        successRate: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.questionCache.set(question.id, question);
    this.saveCachedQuestions();

    return question;
  }

  private async generateFromPDF(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    // Integration with Smart PDF Engine
    // This would fetch content from PDF engine and generate questions
    return this.generateGenericQuestion(request);
  }

  private async generateFromTutor(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    // Integration with AI Tutor Engine
    return this.generateGenericQuestion(request);
  }

  private async generateFromFormula(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    // Integration with Formula Engine
    // Generate formula-based questions
    const content: QuestionContent = {
      text: `Apply the formula to solve: Given x = ${Math.floor(Math.random() * 10) + 1} and y = ${Math.floor(Math.random() * 10) + 1}, calculate x + y.`
    };

    return {
      content,
      correctAnswer: request.difficulty === "expert" ? `${Math.floor(Math.random() * 20) + 2}` : Math.floor(Math.random() * 20) + 2,
      options: undefined,
      hints: ["Identify the operation needed", "Add the numbers together"],
      explanation: {
        correct: "The answer is the sum of x and y",
        steps: ["Identify x and y values", "Add the values together", "Write the final answer"]
      }
    };
  }

  private async generateFromReference(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    return this.generateGenericQuestion(request);
  }

  private async generateFromVisual(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    // Generate diagram-based questions
    const content: QuestionContent = {
      text: `Study the diagram and answer: What does component A represent in this ${request.topic}?`,
      imageUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="20" y="20" width="160" height="160" fill="%23f0f0f0" stroke="%23333"/><text x="100" y="100" text-anchor="middle" font-size="14">Diagram: ${request.topic}</text></svg>`
    };

    return {
      content,
      correctAnswer: "Component A represents the main input",
      options: [
        { id: "a", text: "Component A represents the main input", isCorrect: true },
        { id: "b", text: "Component A represents the output", isCorrect: false },
        { id: "c", text: "Component A represents processing", isCorrect: false },
        { id: "d", text: "Component A represents storage", isCorrect: false }
      ],
      hints: ["Look at the flow direction", "Identify the starting point"],
      explanation: {
        correct: "Component A is the main input point",
        steps: ["Follow the arrow direction", "Identify where the flow begins"]
      }
    };
  }

  private async generateFromKnowledgeGalaxy(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    // Integration with Knowledge Galaxy Engine
    return this.generateGenericQuestion(request);
  }

  private async generateGenericQuestion(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    const difficulty = request.difficulty;
    let type = request.types?.[0] || this.getDefaultQuestionType(difficulty);

    const template = this.templates.get(this.getTemplateForType(type));

    let content: QuestionContent;
    let options: Option[] | undefined;
    let correctAnswer: any;

    switch (type) {
      case "mcq":
        content = {
          text: `${request.topic.charAt(0).toUpperCase() + request.topic.slice(1)} - ${this.getMCQPrompt(difficulty)}`
        };
        const correctOption = this.generateCorrectOption(request.topic);
        const incorrectOptions = this.generateIncorrectOptions(request.topic, difficulty);
        options = this.shuffleOptions([correctOption, ...incorrectOptions]);
        correctAnswer = options.find(o => o.isCorrect)?.id;
        break;

      case "true_false":
        content = {
          text: `${request.topic} is a fundamental concept in ${request.subject}.`
        };
        correctAnswer = true;
        break;

      case "short_answer":
        content = {
          text: `Describe the key characteristics of ${request.topic} in ${request.subject}.`
        };
        correctAnswer = `Key characteristics include understanding the fundamental principles and practical applications.`;
        break;

      case "numerical":
        const num1 = this.getNumberForDifficulty(difficulty);
        const num2 = this.getNumberForDifficulty(difficulty);
        content = {
          text: `Calculate: ${num1} + ${num2} = ?`
        };
        correctAnswer = num1 + num2;
        break;

      case "formula":
        content = {
          text: `Using the appropriate formula, solve for the result when applying ${request.topic}.`
        };
        correctAnswer = `Solution requires applying the formula step by step.`;
        break;

      case "scenario":
        content = {
          text: `Scenario: A student encounters a problem related to ${request.topic}. How should they approach solving it?`
        };
        correctAnswer = `Break down the problem, identify relevant concepts, and apply systematic problem-solving steps.`;
        break;

      default:
        content = {
          text: `What are the main aspects of ${request.topic} in ${request.subject}?`
        };
        correctAnswer = `The main aspects include theory, application, and practice.`;
    }

    const hints = this.generateHints(type, difficulty);

    return {
      content,
      options,
      correctAnswer,
      hints,
      explanation: {
        correct: "This is the correct answer",
        steps: ["Understand the concept", "Apply the knowledge", "Verify the solution"],
        commonMistakes: ["Confusing similar concepts", "Missing key details"]
      }
    };
  }

  private getMCQPrompt(difficulty: DifficultyLevel): string {
    const prompts: Record<DifficultyLevel, string[]> = {
      easy: [
        "Which of the following is true about this concept?",
        "What is the basic definition of this topic?",
        "Select the correct statement about"
      ],
      medium: [
        "Which option best describes the relationship between",
        "What is the primary function of",
        "How does this concept relate to"
      ],
      hard: [
        "Given the complexity of this topic, which explanation most accurately describes",
        "What is the most significant implication of",
        "Which analysis of is most comprehensive?"
      ],
      expert: [
        "Evaluate the following statement about and provide the most accurate interpretation:",
        "Synthesizing the various perspectives, which conclusion about is most valid?",
        "Considering the nuanced aspects of, which option represents the expert-level understanding?"
      ]
    };

    const difficultyPrompts = prompts[difficulty];
    return difficultyPrompts[Math.floor(Math.random() * difficultyPrompts.length)];
  }

  private generateCorrectOption(topic: string): Option {
    return {
      id: "a",
      text: `${topic.charAt(0).toUpperCase() + topic.slice(1)} is correctly defined as the fundamental concept that provides the basis for understanding.`,
      isCorrect: true,
      explanation: "This is the correct understanding of the concept."
    };
  }

  private generateIncorrectOptions(topic: string, difficulty: DifficultyLevel): Option[] {
    const count = difficulty === "easy" ? 3 : 3;
    const options: Option[] = [];
    const baseTexts = [
      `This is an incorrect interpretation of ${topic}.`,
      `${topic} does not relate to this concept.`,
      `This statement misrepresents ${topic}.`,
      `${topic} should not be confused with this alternative.`
    ];

    for (let i = 0; i < count && i < baseTexts.length; i++) {
      options.push({
        id: String.fromCharCode(98 + i), // b, c, d
        text: baseTexts[i],
        isCorrect: false,
        explanation: "This is not the correct answer."
      });
    }

    return options;
  }

  private shuffleOptions(options: Option[]): Option[] {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.map((opt, idx) => ({ ...opt, id: String.fromCharCode(97 + idx) }));
  }

  private getNumberForDifficulty(difficulty: DifficultyLevel): number {
    switch (difficulty) {
      case "easy": return Math.floor(Math.random() * 10) + 1;
      case "medium": return Math.floor(Math.random() * 50) + 10;
      case "hard": return Math.floor(Math.random() * 100) + 50;
      case "expert": return Math.floor(Math.random() * 500) + 100;
    }
  }

  private getDefaultQuestionType(difficulty: DifficultyLevel): QuestionType {
    const types: QuestionType[] = ["mcq", "true_false", "short_answer"];
    if (difficulty === "medium" || difficulty === "hard") {
      types.push("numerical", "scenario");
    }
    if (difficulty === "hard" || difficulty === "expert") {
      types.push("formula", "matching", "sequencing");
    }
    return types[Math.floor(Math.random() * types.length)];
  }

  private getTemplateForType(type: QuestionType): string {
    const typeToTemplate: Record<QuestionType, string> = {
      mcq: "comparison",
      true_false: "true_false_correct",
      short_answer: "definition",
      long_answer: "concept_explanation",
      numerical: "calculation",
      formula: "calculation",
      diagram: "application",
      matching: "matching",
      sequencing: "sequence",
      scenario: "application"
    };
    return typeToTemplate[type] || "definition";
  }

  private generateHints(type: QuestionType, difficulty: DifficultyLevel): string[] {
    const baseHints: string[] = [
      "Review the fundamental definitions.",
      "Consider the core principles involved."
    ];

    const difficultyHints: Record<DifficultyLevel, string[]> = {
      easy: ["Focus on basic definitions."],
      medium: ["Consider how concepts relate to each other."],
      hard: ["Think about complex interactions and implications."],
      expert: ["Analyze the deeper implications and edge cases."]
    };

    return [...baseHints, ...difficultyHints[difficulty]];
  }

  private getEstimatedTime(difficulty: DifficultyLevel, type?: QuestionType): number {
    const baseTime: Record<QuestionType, number> = {
      mcq: 60,
      true_false: 30,
      short_answer: 120,
      long_answer: 300,
      numerical: 180,
      formula: 240,
      diagram: 150,
      matching: 120,
      sequencing: 120,
      scenario: 180
    };

    const base = type ? baseTime[type] : 60;
    const multiplier: Record<DifficultyLevel, number> = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.2,
      expert: 1.5
    };

    return Math.floor(base * multiplier[difficulty]);
  }

  private getPoints(difficulty: DifficultyLevel): number {
    const points: Record<DifficultyLevel, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
      expert: 5
    };
    return points[difficulty];
  }

  private generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getQuestionById(questionId: string): Promise<Question | null> {
    return this.questionCache.get(questionId) || null;
  }

  async getQuestionsByFilter(filter: QuestionFilter, limit?: number): Promise<Question[]> {
    let questions = Array.from(this.questionCache.values());

    if (filter.types?.length) {
      questions = questions.filter(q => filter.types!.includes(q.type));
    }
    if (filter.difficulty?.length) {
      questions = questions.filter(q => filter.difficulty!.includes(q.metadata.difficulty));
    }
    if (filter.subjects?.length) {
      questions = questions.filter(q => filter.subjects!.includes(q.metadata.subject));
    }
    if (filter.topics?.length) {
      questions = questions.filter(q => filter.topics!.includes(q.metadata.topic));
    }
    if (filter.source?.length) {
      questions = questions.filter(q => filter.source!.includes(q.metadata.source));
    }

    if (limit) {
      questions = questions.slice(0, limit);
    }

    return questions;
  }

  clearCache(): void {
    this.questionCache.clear();
    localStorage.removeItem("quiz_question_cache");
  }

  destroy(): void {
    this.questionCache.clear();
    this.templates.clear();
    QuestionGenerator.instance = null as any;
  }
}

interface QuestionTemplate {
  id: string;
  name: string;
  type: QuestionType;
  prompt: string;
  requiredFields: string[];
  optionsCount?: number;
  difficultyAdjustment: number;
}

interface QuestionGenerationResult {
  content: QuestionContent;
  options?: Option[];
  correctAnswer: any;
  hints: string[];
  explanation?: Question["explanation"];
}

export default QuestionGenerator;
