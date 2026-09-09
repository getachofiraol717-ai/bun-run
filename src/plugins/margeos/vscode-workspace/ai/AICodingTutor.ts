/**
 * AICodingTutor.ts
 *
 * AI-powered coding tutor for educational guidance and code explanation.
 */

import { FileNode } from '../models/FileNode';
import { EditorTab } from '../models/EditorTab';
import WorkspaceAnalytics from '../core/WorkspaceAnalytics';

export interface TutoringSession {
  id: string;
  userId: string;
  projectId: string;
  language: string;
  topic: string;
  status: 'active' | 'completed' | 'paused';
  startedAt: string;
  endedAt?: string;
  messages: TutoringMessage[];
  conceptsCovered: string[];
  exercises: TutoringExercise[];
}

export interface TutoringMessage {
  id: string;
  role: 'user' | 'tutor' | 'system';
  content: string;
  timestamp: string;
  codeSnippets?: CodeSnippet[];
  resources?: LearningResource[];
  feedback?: TutoringFeedback;
}

export interface CodeSnippet {
  code: string;
  language: string;
  explanation: string;
  lineRange?: { start: number; end: number };
}

export interface TutoringFeedback {
  type: 'correct' | 'incorrect' | 'hint' | 'suggestion';
  message: string;
  score?: number;
  suggestions?: string[];
}

export interface LearningResource {
  title: string;
  url?: string;
  type: 'documentation' | 'tutorial' | 'video' | 'exercise' | 'article';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
}

export interface TutoringExercise {
  id: string;
  title: string;
  description: string;
  instructions: string;
  starterCode?: string;
  solution?: string;
  hints: string[];
  concepts: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  attempts: ExerciseAttempt[];
  createdAt: string;
}

export interface ExerciseAttempt {
  id: string;
  code: string;
  submittedAt: string;
  feedback: TutoringFeedback;
  passed: boolean;
}

export interface LearningConcept {
  id: string;
  name: string;
  description: string;
  category: string;
  concepts: string[];
  prerequisites: string[];
  resources: LearningResource[];
  exercises: TutoringExercise[];
  masteryLevel: number;
}

export interface CodeExplanation {
  summary: string;
  lineByLine?: Array<{ line: number; code: string; explanation: string }>;
  concepts: string[];
  patterns: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  suggestions: string[];
}

export interface ConceptMap {
  nodes: MapNode[];
  edges: MapEdge[];
}

export interface MapNode {
  id: string;
  label: string;
  type: 'concept' | 'skill' | 'pattern';
  x: number;
  y: number;
  connections: number;
}

export interface MapEdge {
  source: string;
  target: string;
  type: 'prerequisite' | 'related' | 'builds_on';
}

export class AICodingTutor {
  private static instance: AICodingTutor;
  private currentSession: TutoringSession | null = null;
  private sessions: Map<string, TutoringSession> = new Map();
  private concepts: Map<string, LearningConcept> = new Map();
  private analytics: WorkspaceAnalytics;
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    this.analytics = WorkspaceAnalytics.getInstance();
    this.initializeConcepts();
  }

  static getInstance(): AICodingTutor {
    if (!AICodingTutor.instance) {
      AICodingTutor.instance = new AICodingTutor();
    }
    return AICodingTutor.instance;
  }

  private initializeConcepts(): void {
    // JavaScript Concepts
    this.concepts.set('js-variables', {
      id: 'js-variables',
      name: 'Variables & Data Types',
      description: 'Understanding variables, constants, and primitive data types in JavaScript',
      category: 'Fundamentals',
      prerequisites: [],
      resources: [
        { title: 'MDN: Variables', type: 'documentation', difficulty: 'beginner' },
        { title: 'JavaScript Data Types', type: 'tutorial', difficulty: 'beginner' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    this.concepts.set('js-functions', {
      id: 'js-functions',
      name: 'Functions',
      description: 'Creating and using functions, parameters, and return values',
      category: 'Fundamentals',
      prerequisites: ['js-variables'],
      resources: [
        { title: 'MDN: Functions', type: 'documentation', difficulty: 'beginner' },
        { title: 'Arrow Functions', type: 'tutorial', difficulty: 'beginner' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    this.concepts.set('js-arrays', {
      id: 'js-arrays',
      name: 'Arrays & Iteration',
      description: 'Working with arrays and array methods like map, filter, reduce',
      category: 'Data Structures',
      prerequisites: ['js-variables', 'js-functions'],
      resources: [
        { title: 'MDN: Array', type: 'documentation', difficulty: 'intermediate' },
        { title: 'Array Methods', type: 'tutorial', difficulty: 'intermediate' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    this.concepts.set('js-objects', {
      id: 'js-objects',
      name: 'Objects & Classes',
      description: 'Object-oriented programming with JavaScript objects and classes',
      category: 'Data Structures',
      prerequisites: ['js-variables', 'js-functions'],
      resources: [
        { title: 'MDN: Objects', type: 'documentation', difficulty: 'intermediate' },
        { title: 'ES6 Classes', type: 'tutorial', difficulty: 'intermediate' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    this.concepts.set('js-async', {
      id: 'js-async',
      name: 'Async/Await & Promises',
      description: 'Asynchronous programming with promises and async/await',
      category: 'Advanced',
      prerequisites: ['js-functions', 'js-arrays'],
      resources: [
        { title: 'MDN: Async', type: 'documentation', difficulty: 'advanced' },
        { title: 'Promise Tutorial', type: 'tutorial', difficulty: 'advanced' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    // Python Concepts
    this.concepts.set('py-variables', {
      id: 'py-variables',
      name: 'Variables & Types',
      description: 'Python variables, dynamic typing, and basic types',
      category: 'Fundamentals',
      prerequisites: [],
      resources: [
        { title: 'Python Docs: Data Types', type: 'documentation', difficulty: 'beginner' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    this.concepts.set('py-functions', {
      id: 'py-functions',
      name: 'Functions & Scope',
      description: 'Defining functions, parameters, and variable scope in Python',
      category: 'Fundamentals',
      prerequisites: ['py-variables'],
      resources: [
        { title: 'Python Docs: Functions', type: 'documentation', difficulty: 'beginner' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    this.concepts.set('py-lists', {
      id: 'py-lists',
      name: 'Lists & Comprehensions',
      description: 'Working with lists and list comprehensions in Python',
      category: 'Data Structures',
      prerequisites: ['py-variables', 'py-functions'],
      resources: [
        { title: 'Python Docs: Lists', type: 'documentation', difficulty: 'intermediate' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    // TypeScript Concepts
    this.concepts.set('ts-types', {
      id: 'ts-types',
      name: 'TypeScript Types',
      description: 'Static typing, interfaces, and type annotations',
      category: 'Fundamentals',
      prerequisites: ['js-variables'],
      resources: [
        { title: 'TypeScript Handbook', type: 'documentation', difficulty: 'beginner' }
      ],
      exercises: [],
      masteryLevel: 0
    });

    this.concepts.set('ts-generics', {
      id: 'ts-generics',
      name: 'Generics',
      description: 'Generic types and type parameters',
      category: 'Advanced',
      prerequisites: ['ts-types', 'js-functions'],
      resources: [
        { title: 'TypeScript Generics', type: 'documentation', difficulty: 'advanced' }
      ],
      exercises: [],
      masteryLevel: 0
    });
  }

  // Session Management
  createSession(userId: string, projectId: string, language: string, topic?: string): TutoringSession {
    const session: TutoringSession = {
      id: `TUTOR-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      userId,
      projectId,
      language,
      topic: topic || 'General',
      status: 'active',
      startedAt: new Date().toISOString(),
      messages: [],
      conceptsCovered: [],
      exercises: []
    };

    this.sessions.set(session.id, session);
    this.currentSession = session;

    this.analytics.trackAIEvent('session_created', { sessionId: session.id, language, topic });
    this.emit('sessionCreated', session);

    return session;
  }

  getSession(sessionId: string): TutoringSession | undefined {
    return this.sessions.get(sessionId);
  }

  getCurrentSession(): TutoringSession | null {
    return this.currentSession;
  }

  pauseSession(): void {
    if (this.currentSession) {
      this.currentSession.status = 'paused';
      this.emit('sessionPaused', { sessionId: this.currentSession.id });
    }
  }

  resumeSession(): void {
    if (this.currentSession && this.currentSession.status === 'paused') {
      this.currentSession.status = 'active';
      this.emit('sessionResumed', { sessionId: this.currentSession.id });
    }
  }

  endSession(): void {
    if (this.currentSession) {
      this.currentSession.status = 'completed';
      this.currentSession.endedAt = new Date().toISOString();
      this.emit('sessionEnded', { sessionId: this.currentSession.id });
      this.currentSession = null;
    }
  }

  // Messaging
  sendMessage(content: string, codeSnippets?: CodeSnippet[]): TutoringMessage {
    if (!this.currentSession) {
      throw new Error('No active tutoring session');
    }

    const message: TutoringMessage = {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      codeSnippets
    };

    this.currentSession.messages.push(message);
    this.emit('messageSent', message);

    // Generate tutor response
    const tutorResponse = this.generateTutorResponse(message);
    this.currentSession.messages.push(tutorResponse);
    this.emit('tutorResponse', tutorResponse);

    return message;
  }

  private generateTutorResponse(userMessage: TutoringMessage): TutoringMessage {
    // AI response generation logic
    const response = this.analyzeAndRespond(userMessage);

    return {
      id: `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      role: 'tutor',
      content: response.content,
      timestamp: new Date().toISOString(),
      codeSnippets: response.snippets,
      resources: response.resources
    };
  }

  private analyzeAndRespond(message: TutoringMessage): { content: string; snippets?: CodeSnippet[]; resources?: LearningResource[] } {
    const content = message.content.toLowerCase();

    if (content.includes('explain') || content.includes('what is')) {
      return {
        content: this.generateExplanation(content),
        resources: this.findRelevantResources(content)
      };
    }

    if (content.includes('how to') || content.includes('how do')) {
      return {
        content: this.generateHowToGuide(content),
        snippets: this.generateCodeExamples(content)
      };
    }

    if (content.includes('error') || content.includes('bug')) {
      return {
        content: this.generateErrorHelp(content),
        snippets: this.generateCodeExamples(content)
      };
    }

    if (content.includes('help') || content.includes('tutorial')) {
      return {
        content: this.generateTutorial(content),
        resources: this.findRelevantResources(content)
      };
    }

    return {
      content: 'I\'m here to help you with your coding journey! You can ask me to explain concepts, help with errors, or guide you through tutorials.'
    };
  }

  private generateExplanation(topic: string): string {
    const explanations: Record<string, string> = {
      'variable': 'Variables are containers for storing data values. In JavaScript, you can declare variables using `var`, `let`, or `const`.',
      'function': 'Functions are reusable blocks of code that perform a specific task. They can take parameters and return values.',
      'array': 'Arrays are ordered collections of items. You can access items by their index starting from 0.',
      'object': 'Objects are collections of key-value pairs. They allow you to group related data and functionality.',
      'loop': 'Loops allow you to repeat code multiple times. Common types include `for`, `while`, and `forEach` loops.',
      'class': 'Classes are blueprints for creating objects with shared properties and methods.'
    };

    for (const [key, explanation] of Object.entries(explanations)) {
      if (topic.includes(key)) {
        return explanation;
      }
    }

    return 'I\'d be happy to explain this concept! Could you provide more details about what you\'d like to understand?';
  }

  private generateHowToGuide(topic: string): string {
    return 'Here\'s how you can accomplish that:\n\n1. First, identify the starting point\n2. Break down the task into smaller steps\n3. Write the code for each step\n4. Test and debug as needed\n5. Refactor for better readability';
  }

  private generateErrorHelp(error: string): string {
    return 'Let me help you debug this error:\n\n1. Check the error message carefully\n2. Look at the line number mentioned\n3. Verify the syntax is correct\n4. Make sure all variables are defined\n5. Check for matching brackets and parentheses';
  }

  private generateTutorial(topic: string): string {
    return 'Let me guide you through this step by step. First, let\'s start with the basics and build up from there.';
  }

  private generateCodeExamples(topic: string): CodeSnippet[] {
    const snippets: CodeSnippet[] = [];

    if (topic.includes('function')) {
      snippets.push({
        code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));',
        language: 'javascript',
        explanation: 'This example shows a simple function that takes a name parameter and returns a greeting.'
      });
    }

    if (topic.includes('array')) {
      snippets.push({
        code: 'const numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\nconsole.log(doubled); // [2, 4, 6, 8, 10]',
        language: 'javascript',
        explanation: 'This shows how to use the map method to transform array elements.'
      });
    }

    if (topic.includes('loop')) {
      snippets.push({
        code: 'for (let i = 0; i < 5; i++) {\n  console.log(`Iteration ${i}`);\n}',
        language: 'javascript',
        explanation: 'A basic for loop that runs 5 times.'
      });
    }

    return snippets;
  }

  private findRelevantResources(topic: string): LearningResource[] {
    const resources: LearningResource[] = [];
    const lowerTopic = topic.toLowerCase();

    this.concepts.forEach(concept => {
      if (concept.name.toLowerCase().includes(lowerTopic) ||
          concept.description.toLowerCase().includes(lowerTopic)) {
        resources.push(...concept.resources);
      }
    });

    return resources.slice(0, 3);
  }

  // Code Explanation
  explainCode(code: string, language: string, context?: string): CodeExplanation {
    const lines = code.split('\n');
    const lineByLine: Array<{ line: number; code: string; explanation: string }> = [];
    const concepts: string[] = [];
    const patterns: string[] = [];
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      let explanation = '';

      if (!trimmed || trimmed.startsWith('//')) {
        explanation = trimmed.startsWith('//') ? 'Comment: ' + trimmed.slice(2) : 'Empty line';
      } else if (trimmed.includes('function') || trimmed.includes('def ')) {
        explanation = 'Function definition';
        if (!concepts.includes('Functions')) concepts.push('Functions');
        patterns.push('Function Declaration');
        complexity = complexity === 'simple' ? 'moderate' : complexity;
      } else if (trimmed.includes('const ') || trimmed.includes('let ') || trimmed.includes('var ')) {
        explanation = 'Variable declaration';
        if (!concepts.includes('Variables')) concepts.push('Variables');
      } else if (trimmed.includes('class ')) {
        explanation = 'Class definition';
        if (!concepts.includes('Classes')) concepts.push('Classes');
        complexity = 'complex';
      } else if (trimmed.includes('=>') || trimmed.includes('lambda')) {
        explanation = 'Arrow/lambda function';
        if (!concepts.includes('Arrow Functions')) concepts.push('Arrow Functions');
      } else if (trimmed.includes('async') || trimmed.includes('await')) {
        explanation = 'Asynchronous operation';
        if (!concepts.includes('Async/Await')) concepts.push('Async/Await');
        complexity = 'complex';
      } else if (trimmed.includes('import') || trimmed.includes('from')) {
        explanation = 'Module import';
        if (!concepts.includes('Modules')) concepts.push('Modules');
      } else if (trimmed.includes('for ') || trimmed.includes('while ')) {
        explanation = 'Loop iteration';
        if (!concepts.includes('Loops')) concepts.push('Loops');
        patterns.push('Iteration');
      } else if (trimmed.includes('if ') || trimmed.includes('else')) {
        explanation = 'Conditional statement';
        if (!concepts.includes('Conditionals')) concepts.push('Conditionals');
        patterns.push('Branching');
      } else if (trimmed.includes('try') || trimmed.includes('catch')) {
        explanation = 'Error handling';
        if (!concepts.includes('Error Handling')) concepts.push('Error Handling');
        complexity = complexity === 'simple' ? 'moderate' : complexity;
      } else {
        explanation = 'Code statement';
      }

      lineByLine.push({ line: index + 1, code: line, explanation });
    });

    const suggestions = this.generateSuggestions(concepts, patterns, complexity);

    this.analytics.trackAIEvent('code_explained', {
      language,
      conceptsCount: concepts.length,
      complexity
    });

    return {
      summary: this.generateSummary(lineByLine, concepts, complexity),
      lineByLine,
      concepts,
      patterns,
      complexity,
      suggestions
    };
  }

  private generateSummary(lineByLine: any[], concepts: string[], complexity: string): string {
    const lineCount = lineByLine.length;
    const conceptCount = concepts.length;

    return `This code consists of ${lineCount} lines and covers ${conceptCount} concept${conceptCount !== 1 ? 's' : ''}: ${concepts.join(', ')}. The overall complexity is ${complexity}.`;
  }

  private generateSuggestions(concepts: string[], patterns: string[], complexity: string): string[] {
    const suggestions: string[] = [];

    if (complexity === 'complex') {
      suggestions.push('Consider breaking this into smaller functions for better readability');
    }

    if (patterns.includes('Iteration')) {
      suggestions.push('You could use array methods like map, filter, or reduce for cleaner code');
    }

    if (!concepts.includes('Error Handling')) {
      suggestions.push('Adding try-catch blocks would make this more robust');
    }

    if (!concepts.includes('Testing')) {
      suggestions.push('Consider adding unit tests to verify the behavior');
    }

    return suggestions;
  }

  // Exercise Management
  createExercise(
    title: string,
    description: string,
    instructions: string,
    hints: string[],
    concepts: string[],
    difficulty: TutoringExercise['difficulty'],
    starterCode?: string,
    solution?: string
  ): TutoringExercise {
    const exercise: TutoringExercise = {
      id: `EX-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title,
      description,
      instructions,
      starterCode,
      solution,
      hints,
      concepts,
      difficulty,
      status: 'pending',
      attempts: [],
      createdAt: new Date().toISOString()
    };

    if (this.currentSession) {
      this.currentSession.exercises.push(exercise);
      this.emit('exerciseCreated', exercise);
    }

    return exercise;
  }

  startExercise(exerciseId: string): TutoringExercise | undefined {
    if (!this.currentSession) return undefined;

    const exercise = this.currentSession.exercises.find(e => e.id === exerciseId);
    if (exercise) {
      exercise.status = 'in_progress';
      this.emit('exerciseStarted', exercise);
    }
    return exercise;
  }

  submitExercise(exerciseId: string, code: string): TutoringFeedback {
    if (!this.currentSession) {
      return { type: 'incorrect', message: 'No active session' };
    }

    const exercise = this.currentSession.exercises.find(e => e.id === exerciseId);
    if (!exercise) {
      return { type: 'incorrect', message: 'Exercise not found' };
    }

    const attempt: ExerciseAttempt = {
      id: `ATT-${Date.now()}`,
      code,
      submittedAt: new Date().toISOString(),
      feedback: this.evaluateSubmission(code, exercise),
      passed: false
    };

    attempt.passed = attempt.feedback.type === 'correct';
    exercise.attempts.push(attempt);

    if (attempt.passed) {
      exercise.status = 'completed';
      this.updateConceptMastery(exercise.concepts);
    }

    this.emit('exerciseSubmitted', { exercise, attempt });
    return attempt.feedback;
  }

  private evaluateSubmission(code: string, exercise: TutoringExercise): TutoringFeedback {
    if (!exercise.solution) {
      return { type: 'correct', message: 'Exercise completed!', score: 100 };
    }

    // Simple evaluation - check if key patterns are present
    const solutionPatterns = exercise.solution.toLowerCase();
    const codePatterns = code.toLowerCase();

    let matches = 0;
    let total = 0;

    exercise.concepts.forEach(concept => {
      total++;
      if (codePatterns.includes(concept.toLowerCase())) {
        matches++;
      }
    });

    const score = Math.round((matches / total) * 100);

    if (score === 100) {
      return { type: 'correct', message: 'Perfect! You\'ve completed the exercise.', score };
    } else if (score >= 70) {
      return {
        type: 'suggestion',
        message: 'Good progress! Here are some suggestions for improvement.',
        score,
        suggestions: this.generateHints(exercise)
      };
    } else {
      return {
        type: 'hint',
        message: 'Keep trying! Review the hints and try again.',
        score,
        suggestions: [exercise.hints[0]]
      };
    }
  }

  private generateHints(exercise: TutoringExercise): string[] {
    return exercise.hints.slice(0, 2);
  }

  skipExercise(exerciseId: string): void {
    if (!this.currentSession) return;

    const exercise = this.currentSession.exercises.find(e => e.id === exerciseId);
    if (exercise) {
      exercise.status = 'skipped';
      this.emit('exerciseSkipped', exercise);
    }
  }

  // Concept Tracking
  private updateConceptMastery(concepts: string[]): void {
    concepts.forEach(conceptName => {
      this.concepts.forEach((concept, key) => {
        if (concept.concepts.includes(conceptName) || concept.name.includes(conceptName)) {
          concept.masteryLevel = Math.min(100, concept.masteryLevel + 10);
        }
      });
    });
  }

  getConcept(conceptId: string): LearningConcept | undefined {
    return this.concepts.get(conceptId);
  }

  getAllConcepts(): LearningConcept[] {
    return Array.from(this.concepts.values());
  }

  getConceptsByCategory(category: string): LearningConcept[] {
    return Array.from(this.concepts.values()).filter(c => c.category === category);
  }

  getConceptsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): LearningConcept[] {
    return Array.from(this.concepts.values()).filter(c => {
      const exercise = c.exercises[0];
      return exercise?.difficulty === difficulty;
    });
  }

  // Concept Map
  getConceptMap(language?: string): ConceptMap {
    const nodes: MapNode[] = [];
    const edges: MapEdge[] = [];
    const relevantConcepts = language
      ? Array.from(this.concepts.values()).filter(c => c.id.startsWith(language.split('-')[0]))
      : Array.from(this.concepts.values());

    let index = 0;
    const gridSize = Math.ceil(Math.sqrt(relevantConcepts.length));

    relevantConcepts.forEach(concept => {
      const x = (index % gridSize) * 150 + 50;
      const y = Math.floor(index / gridSize) * 150 + 50;

      nodes.push({
        id: concept.id,
        label: concept.name,
        type: 'concept',
        x,
        y,
        connections: concept.prerequisites.length + concept.resources.length
      });

      concept.prerequisites.forEach(prereq => {
        edges.push({
          source: prereq,
          target: concept.id,
          type: 'prerequisite'
        });
      });

      index++;
    });

    return { nodes, edges };
  }

  // Progress Tracking
  getSessionProgress(): { completed: number; total: number; percentage: number } {
    if (!this.currentSession) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = this.currentSession.exercises.filter(e => e.status === 'completed').length;
    const total = this.currentSession.exercises.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }

  getMasteryProgress(): Map<string, number> {
    const progress = new Map<string, number>();
    this.concepts.forEach((concept, id) => {
      progress.set(id, concept.masteryLevel);
    });
    return progress;
  }

  // Events
  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }
}

export default AICodingTutor;
