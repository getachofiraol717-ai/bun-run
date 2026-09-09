// @ts-nocheck
/**
 * Explanation Service
 * Provides AI-powered code explanations and learning assistance
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import { Explanation, CodeReference } from '../core/CodebaseExplainer';

export interface ExplanationContext {
  project: Project;
  files: ProjectFile[];
  currentFile?: string;
  selection?: {
    start: number;
    end: number;
    text: string;
  };
}

export interface ExplanationRequest {
  question: string;
  context?: ExplanationContext;
  options?: {
    includeCodeReferences?: boolean;
    includeExamples?: boolean;
    includeRelatedConcepts?: boolean;
    language?: 'en' | 'zh' | 'es';
  };
}

export interface ExplanationResult {
  explanation: Explanation;
  relatedQuestions: string[];
  learningResources?: LearningResource[];
}

export interface LearningResource {
  title: string;
  type: 'documentation' | 'tutorial' | 'article' | 'video' | 'course';
  url?: string;
  description: string;
  relevance: number;
}

export class ExplanationService {
  private static instance: ExplanationService | null = null;
  private context: ExplanationContext | null = null;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  private constructor() {}

  static getInstance(): ExplanationService {
    if (!ExplanationService.instance) {
      ExplanationService.instance = new ExplanationService();
    }
    return ExplanationService.instance;
  }

  setContext(context: ExplanationContext): void {
    this.context = context;
    this.conversationHistory = [];
  }

  clearContext(): void {
    this.context = null;
    this.conversationHistory = [];
  }

  async explain(request: ExplanationRequest): Promise<ExplanationResult> {
    if (!this.context && !request.context) {
      return {
        explanation: {
          question: request.question,
          answer: 'No project context available. Please upload a project first.',
          relatedFiles: [],
          codeReferences: [],
          confidence: 0,
          educational: false,
        },
        relatedQuestions: [],
      };
    }

    const ctx = request.context || this.context!;

    // Update context if provided in request
    if (request.context) {
      this.context = request.context;
    }

    const options = request.options || {
      includeCodeReferences: true,
      includeExamples: true,
      includeRelatedConcepts: true,
      language: 'en',
    };

    // Generate explanation based on question type
    const questionType = this.classifyQuestion(request.question);
    let answer = '';
    let codeReferences: CodeReference[] = [];
    let confidence = 0.5;

    switch (questionType) {
      case 'project-overview':
        answer = this.explainProjectOverview(ctx.project);
        confidence = 0.9;
        break;

      case 'folder-structure':
        answer = this.explainFolderStructure(ctx.project);
        confidence = 0.85;
        break;

      case 'technology':
        answer = this.explainTechnologies(ctx.project);
        confidence = 0.9;
        break;

      case 'feature':
        answer = this.explainFeature(ctx, request.question);
        codeReferences = this.findCodeReferences(ctx, request.question);
        confidence = 0.7;
        break;

      case 'authentication':
        answer = this.explainAuthentication(ctx);
        codeReferences = this.findAuthReferences(ctx);
        confidence = 0.8;
        break;

      case 'database':
        answer = this.explainDatabase(ctx);
        codeReferences = this.findDatabaseReferences(ctx);
        confidence = 0.75;
        break;

      case 'api':
        answer = this.explainAPI(ctx);
        codeReferences = this.findAPIReferences(ctx);
        confidence = 0.8;
        break;

      case 'component':
        answer = this.explainComponent(ctx, request.question);
        codeReferences = this.findComponentReferences(ctx, request.question);
        confidence = 0.75;
        break;

      case 'testing':
        answer = this.explainTesting(ctx);
        confidence = 0.85;
        break;

      case 'general':
      default:
        answer = this.explainGeneral(ctx, request.question);
        codeReferences = this.findGeneralReferences(ctx, request.question);
        confidence = 0.5;
    }

    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: request.question });
    this.conversationHistory.push({ role: 'assistant', content: answer });

    const relatedQuestions = this.generateRelatedQuestions(questionType, ctx);

    const explanation: Explanation = {
      question: request.question,
      answer,
      relatedFiles: codeReferences.map((r) => r.file),
      codeReferences,
      confidence,
      educational: true,
    };

    return {
      explanation,
      relatedQuestions,
      learningResources: options.includeRelatedConcepts ? this.findLearningResources(questionType) : undefined,
    };
  }

  private classifyQuestion(question: string): string {
    const lower = question.toLowerCase();

    if (/what (is|does|does this|does the)|describe|overview/i.test(lower)) {
      if (/project|application|codebase/i.test(lower)) return 'project-overview';
      if (/structure|folder|directory|files/i.test(lower)) return 'folder-structure';
      if (/tech|language|framework|library|dependency/i.test(lower)) return 'technology';
      return 'project-overview';
    }

    if (/how (does|works|work|to|can I)/i.test(lower)) return 'feature';
    if (/auth|login|password|user.*account|jwt|token/i.test(lower)) return 'authentication';
    if (/database|db|data.*storage|model|schema/i.test(lower)) return 'database';
    if (/api|endpoint|route|request|controller/i.test(lower)) return 'api';
    if (/component|ui|render|display|page|view/i.test(lower)) return 'component';
    if (/test|spec|testing|jest|cypress/i.test(lower)) return 'testing';

    return 'general';
  }

  private explainProjectOverview(project: Project): string {
    const lines: string[] = [];

    lines.push(`# ${project.name}\n`);
    lines.push(project.description || 'A software project.');
    lines.push('');

    lines.push('## Project Overview');
    lines.push(`- **Complexity:** ${project.technologyProfile.overallComplexity}`);
    lines.push(`- **Files:** ${project.structure.totalFiles}`);
    lines.push(`- **Lines of Code:** ${project.statistics.codeLines}`);
    lines.push(`- **Architecture:** ${project.architecture.pattern.name}`);
    lines.push('');

    lines.push('## Technologies');
    if (project.technologyProfile.languages.length > 0) {
      lines.push(`**Languages:** ${project.technologyProfile.languages.map((l) => l.name).join(', ')}`);
    }
    if (project.technologyProfile.frameworks.length > 0) {
      lines.push(`**Frameworks:** ${project.technologyProfile.frameworks.map((f) => f.name).join(', ')}`);
    }
    lines.push('');

    return lines.join('\n');
  }

  private explainFolderStructure(project: Project): string {
    const lines: string[] = [];

    lines.push('## Project Structure\n');
    lines.push(`The project has ${project.structure.totalFiles} files across ${project.structure.totalFolders} folders.`);
    lines.push(`Maximum nesting depth: ${project.structure.maxDepth} levels.\n`);
    lines.push('### Top-Level Folders');

    for (const folder of project.rootFolder.subfolders.slice(0, 10)) {
      lines.push(`- **${folder.name}/** - ${folder.fileCount} files`);
    }

    return lines.join('\n');
  }

  private explainTechnologies(project: Project): string {
    const lines: string[] = [];

    lines.push('## Technologies Used\n');

    lines.push('### Programming Languages');
    for (const lang of project.technologyProfile.languages) {
      lines.push(`- **${lang.name}** (${lang.percentage.toFixed(1)}%, ${lang.files} files)`);
    }

    if (project.technologyProfile.frameworks.length > 0) {
      lines.push('\n### Frameworks & Libraries');
      for (const fw of project.technologyProfile.frameworks.slice(0, 5)) {
        lines.push(`- **${fw.name}** - ${fw.purpose}`);
      }
    }

    if (project.technologyProfile.detectedFeatures.length > 0) {
      lines.push('\n### Detected Features');
      for (const feature of project.technologyProfile.detectedFeatures) {
        lines.push(`- ${feature}`);
      }
    }

    return lines.join('\n');
  }

  private explainFeature(ctx: ExplanationContext, question: string): string {
    const lines: string[] = [];

    // Extract the feature being asked about
    const featureMatch = question.match(/how (does|to) (.+?)(?: work|\?| in)/i);
    const featureName = featureMatch ? featureMatch[2].trim() : 'this';

    lines.push(`## ${featureName.charAt(0).toUpperCase() + featureName.slice(1)} Implementation\n`);
    lines.push(`This project implements the **${featureName}** feature.`);

    return lines.join('\n');
  }

  private explainAuthentication(ctx: ExplanationContext): string {
    const lines: string[] = [];

    lines.push('## Authentication System\n');
    lines.push('Based on the project structure, here\'s what we found:\n');

    const authFiles = ctx.files.filter(
      (f) => /auth|login|password|user|account|token|jwt/i.test(f.name)
    );

    if (authFiles.length > 0) {
      lines.push('### Key Files');
      for (const file of authFiles.slice(0, 5)) {
        lines.push(`- \`${file.path}\``);
      }
    } else {
      lines.push('No dedicated authentication files detected.');
      lines.push('This could mean:');
      lines.push('- Authentication is handled externally');
      lines.push('- The project uses a third-party auth service');
      lines.push('- Authentication is minimal or not implemented');
    }

    return lines.join('\n');
  }

  private explainDatabase(ctx: ExplanationContext): string {
    const lines: string[] = [];

    lines.push('## Database Implementation\n');

    const dbFiles = ctx.files.filter(
      (f) => /database|db|model|schema|sql|mongo|prisma|sequelize/i.test(f.name) ||
             f.extension === '.sql'
    );

    if (dbFiles.length > 0) {
      lines.push('### Database Files');
      for (const file of dbFiles.slice(0, 5)) {
        lines.push(`- \`${file.path}\``);
      }
    } else {
      lines.push('No specific database files detected.');
      lines.push('Possible scenarios:');
      lines.push('- Client-side storage (localStorage, IndexedDB)');
      lines.push('- External API calls for data');
      lines.push('- No persistent storage needed');
    }

    return lines.join('\n');
  }

  private explainAPI(ctx: ExplanationContext): string {
    const lines: string[] = [];

    lines.push('## API Implementation\n');

    const apiFiles = ctx.files.filter(
      (f) => /api|route|endpoint|controller|server/i.test(f.name)
    );

    if (apiFiles.length > 0) {
      lines.push('### API Files');
      for (const file of apiFiles.slice(0, 5)) {
        lines.push(`- \`${file.path}\``);
      }
    } else {
      lines.push('No dedicated API files detected.');
      lines.push('This may be a client-side application.');
    }

    return lines.join('\n');
  }

  private explainComponent(ctx: ExplanationContext, question: string): string {
    const lines: string[] = [];

    lines.push('## UI Component\n');

    const componentFiles = ctx.files.filter(
      (f) => /component|ui|page|view|template|element/i.test(f.name) ||
             f.extension === '.vue' || f.extension === '.jsx'
    );

    if (componentFiles.length > 0) {
      lines.push('### Found Components');
      for (const file of componentFiles.slice(0, 5)) {
        lines.push(`- \`${file.path}\``);
      }
    }

    return lines.join('\n');
  }

  private explainTesting(ctx: ExplanationContext): string {
    const lines: string[] = [];

    lines.push('## Testing\n');

    const testFiles = ctx.files.filter(
      (f) => /test|spec|__tests__|testing|jest|cypress|mocha/i.test(f.name)
    );

    if (testFiles.length > 0) {
      lines.push(`Found ${testFiles.length} test file(s):`);
      for (const file of testFiles.slice(0, 5)) {
        lines.push(`- \`${file.path}\``);
      }
    } else {
      lines.push('No test files detected.');
      lines.push('Consider adding tests for:');
      lines.push('- Critical business logic');
      lines.push('- Utility functions');
      lines.push('- API endpoints');
    }

    return lines.join('\n');
  }

  private explainGeneral(ctx: ExplanationContext, question: string): string {
    const lines: string[] = [];

    lines.push('## General Explanation\n');
    lines.push(`You asked: "${question}"\n`);
    lines.push('Based on the project structure, I can provide the following insights:\n');

    const relevantFiles = this.findGeneralReferences(ctx, question);
    if (relevantFiles.length > 0) {
      lines.push('### Related Files');
      for (const ref of relevantFiles.slice(0, 5)) {
        lines.push(`- \`${ref.file}\``);
      }
    } else {
      lines.push('No direct matches found. Try asking about:');
      lines.push('- What technologies are used');
      lines.push('- How the folder structure is organized');
      lines.push('- How authentication/database/API works');
    }

    return lines.join('\n');
  }

  private findCodeReferences(ctx: ExplanationContext, query: string): CodeReference[] {
    const results: CodeReference[] = [];
    const lowerQuery = query.toLowerCase();

    for (const file of ctx.files.slice(0, 20)) {
      if (file.content && file.content.toLowerCase().includes(lowerQuery)) {
        const lines = file.content.split('\n');
        const relevantLines = lines
          .map((line, i) => ({ line, index: i + 1 }))
          .filter(({ line }) => line.toLowerCase().includes(lowerQuery))
          .slice(0, 5);

        if (relevantLines.length > 0) {
          results.push({
            file: file.path,
            line: relevantLines[0].index,
            code: relevantLines.map((r) => r.line.trim()).join('\n'),
            explanation: `Code related to ${query}`,
          });
        }
      }
    }

    return results.slice(0, 5);
  }

  private findAuthReferences(ctx: ExplanationContext): CodeReference[] {
    return this.findCodeReferences(ctx, 'auth');
  }

  private findDatabaseReferences(ctx: ExplanationContext): CodeReference[] {
    return this.findCodeReferences(ctx, 'database');
  }

  private findAPIReferences(ctx: ExplanationContext): CodeReference[] {
    return this.findCodeReferences(ctx, 'api');
  }

  private findComponentReferences(ctx: ExplanationContext, question: string): CodeReference[] {
    const componentMatch = question.match(/component|ui|page|view/i);
    if (!componentMatch) return [];

    const componentFiles = ctx.files.filter(
      (f) => /component|page|view|template/i.test(f.name)
    );

    return componentFiles.slice(0, 3).map((file) => ({
      file: file.path,
      code: file.content?.slice(0, 200) || '',
      explanation: `Component: ${file.name}`,
    }));
  }

  private findGeneralReferences(ctx: ExplanationContext, query: string): CodeReference[] {
    return this.findCodeReferences(ctx, query.split(' ').slice(-2).join(' '));
  }

  private generateRelatedQuestions(questionType: string, ctx: ExplanationContext): string[] {
    const baseQuestions: Record<string, string[]> = {
      'project-overview': [
        'How is the project structured?',
        'What technologies are used?',
        'How does the authentication work?',
      ],
      'folder-structure': [
        'What does the project do?',
        'What are the main components?',
        'Where is the main entry point?',
      ],
      'technology': [
        'What is the project architecture?',
        'How is the code organized?',
        'What frameworks are used?',
      ],
      'feature': [
        'What is the project about?',
        'How is the code structured?',
        'What are the main features?',
      ],
      'authentication': [
        'How is data stored?',
        'What is the API structure?',
        'How are components organized?',
      ],
      'database': [
        'How does authentication work?',
        'What is the API structure?',
        'How is the frontend organized?',
      ],
      'api': [
        'How is data stored?',
        'What technologies are used?',
        'How is the frontend organized?',
      ],
      'component': [
        'How is the project structured?',
        'What is the overall architecture?',
        'How does routing work?',
      ],
      'testing': [
        'What is the project overview?',
        'How is the code organized?',
        'What technologies are used?',
      ],
      'general': [
        'What does this project do?',
        'How is it structured?',
        'What technologies are used?',
      ],
    };

    return baseQuestions[questionType] || baseQuestions['general'];
  }

  private findLearningResources(questionType: string): LearningResource[] {
    const resources: Record<string, LearningResource[]> = {
      'project-overview': [
        { title: 'Reading Code', type: 'article', description: 'How to understand an unfamiliar codebase', relevance: 0.9 },
      ],
      'technology': [
        { title: 'Technology Stack Guide', type: 'documentation', description: 'Common technology stacks and when to use them', relevance: 0.9 },
      ],
      'architecture': [
        { title: 'Software Architecture 101', type: 'course', description: 'Learn fundamental software architecture patterns', relevance: 0.95 },
      ],
      'general': [
        { title: 'Codebase Analysis Guide', type: 'article', description: 'Best practices for understanding new codebases', relevance: 0.8 },
      ],
    };

    return resources[questionType] || resources['general'];
  }

  getConversationHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }
}

export default ExplanationService.getInstance();
