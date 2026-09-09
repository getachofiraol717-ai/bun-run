// @ts-nocheck
/**
 * Codebase Explainer
 * AI-powered explanations of project code
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import { redactSecrets } from '../utils/redactSecrets';

export interface Explanation {
  question: string;
  answer: string;
  relatedFiles: string[];
  codeReferences: CodeReference[];
  confidence: number;
  educational: boolean;
}

export interface CodeReference {
  file: string;
  line?: number;
  code: string;
  explanation: string;
}

export interface Context {
  files: ProjectFile[];
  project: Project;
}

export class CodebaseExplainer {
  private static instance: CodebaseExplainer | null = null;
  private context: Context | null = null;

  private constructor() {}

  static getInstance(): CodebaseExplainer {
    if (!CodebaseExplainer.instance) {
      CodebaseExplainer.instance = new CodebaseExplainer();
    }
    return CodebaseExplainer.instance;
  }

  setContext(context: Context): void {
    this.context = context;
  }

  async explainQuestion(project: Project, question: string): Promise<string> {
    this.setContext({ project, files: project.files });
    const exp = await this.explain(question);
    return redactSecrets(exp.answer);
  }

  async explain(question: string): Promise<Explanation> {
    if (!this.context) {
      return {
        question,
        answer: 'No project context available. Please upload a project first.',
        relatedFiles: [],
        codeReferences: [],
        confidence: 0,
        educational: false,
      };
    }

    const lowerQuestion = question.toLowerCase();

    // Route to appropriate explanation
    if (this.matchesPattern(lowerQuestion, ['what does', 'what is', 'explain', 'describe'])) {
      return this.explainProject(lowerQuestion);
    }

    if (this.matchesPattern(lowerQuestion, ['folder', 'directory', 'structure', 'files'])) {
      return this.explainStructure(lowerQuestion);
    }

    if (this.matchesPattern(lowerQuestion, ['how does', 'how works', 'explain how', 'where is', 'find'])) {
      return this.explainFeature(lowerQuestion);
    }

    if (this.matchesPattern(lowerQuestion, ['authentication', 'auth', 'login', 'user'])) {
      return this.explainAuthentication();
    }

    if (this.matchesPattern(lowerQuestion, ['database', 'db', 'storage', 'data'])) {
      return this.explainDatabase();
    }

    if (this.matchesPattern(lowerQuestion, ['api', 'endpoint', 'route', 'request'])) {
      return this.explainAPI();
    }

    if (this.matchesPattern(lowerQuestion, ['component', 'ui', 'render', 'display'])) {
      return this.explainUI();
    }

    if (this.matchesPattern(lowerQuestion, ['test', 'testing', 'spec'])) {
      return this.explainTesting();
    }

    return this.generalExplanation(question);
  }

  private matchesPattern(question: string, patterns: string[]): boolean {
    return patterns.some((p) => question.includes(p));
  }

  private explainProject(lowerQuestion: string): Explanation {
    const project = this.context!.project;

    let answer = `## Project Overview\n\n`;
    answer += `**${project.name}** is a ${project.technologyProfile.overallComplexity} complexity project.\n\n`;
    answer += `### Technologies Used\n\n`;

    if (project.technologyProfile.languages.length > 0) {
      answer += `- **Languages:** ${project.technologyProfile.languages.map((l) => l.name).join(', ')}\n`;
    }

    if (project.technologyProfile.frameworks.length > 0) {
      answer += `- **Frameworks:** ${project.technologyProfile.frameworks.map((f) => f.name).join(', ')}\n`;
    }

    answer += `\n### Project Statistics\n\n`;
    answer += `- Total Files: ${project.structure.totalFiles}\n`;
    answer += `- Total Folders: ${project.structure.totalFolders}\n`;
    answer += `- Lines of Code: ${project.statistics.codeLines}\n`;
    answer += `- Architecture: ${project.architecture.pattern.name}\n`;

    if (project.architecture.description) {
      answer += `\n### Architecture\n\n${project.architecture.description}`;
    }

    return {
      question: lowerQuestion,
      answer,
      relatedFiles: [],
      codeReferences: [],
      confidence: 0.9,
      educational: true,
    };
  }

  private explainStructure(lowerQuestion: string): Explanation {
    const project = this.context!.project;
    const relatedFiles = this.findFilesByPattern('index,main,app,src');
    const structure = this.describeStructure(project.rootFolder);

    let answer = `## Project Structure\n\n`;
    answer += `The project is organized with a maximum depth of ${project.structure.maxDepth} levels.\n\n`;
    answer += `### Top-Level Folders\n\n`;

    for (const subfolder of project.rootFolder.subfolders.slice(0, 10)) {
      answer += `- **${subfolder.name}/** - ${subfolder.fileCount} files\n`;
    }

    answer += `\n### Structure Details\n\n${structure}`;

    return {
      question: lowerQuestion,
      answer,
      relatedFiles: relatedFiles.map((f) => f.path),
      codeReferences: [],
      confidence: 0.85,
      educational: true,
    };
  }

  private describeStructure(folder: ProjectFolder, depth: number = 0): string {
    if (depth > 2) return '';

    let result = '';

    for (const subfolder of folder.subfolders.slice(0, 5)) {
      const indent = '  '.repeat(depth);
      result += `${indent}- ${subfolder.name}/\n`;
      result += this.describeStructure(subfolder, depth + 1);
    }

    return result;
  }

  private explainFeature(lowerQuestion: string): Explanation {
    const feature = this.extractFeature(lowerQuestion);
    const relatedFiles = this.findFilesByFeature(feature);
    const codeRefs = this.extractCodeReferences(relatedFiles, feature);

    let answer = `## ${this.capitalizeFirst(feature)} Implementation\n\n`;

    if (relatedFiles.length === 0) {
      answer += `No specific implementation found for "${feature}".\n\n`;
      answer += `Try searching for related terms or check the overall project structure.`;
    } else {
      answer += `The ${feature} functionality is implemented across ${relatedFiles.length} file(s).\n\n`;

      for (const file of relatedFiles.slice(0, 3)) {
        answer += `### ${file.name}\n\n`;
        answer += `**Path:** \`${file.path}\`\n\n`;
        if (file.content) {
          const summary = this.summarizeContent(file.content, feature);
          answer += `${summary}\n\n`;
        }
      }
    }

    return {
      question: lowerQuestion,
      answer,
      relatedFiles: relatedFiles.map((f) => f.path),
      codeReferences: codeRefs,
      confidence: relatedFiles.length > 0 ? 0.8 : 0.3,
      educational: true,
    };
  }

  private extractFeature(question: string): string {
    const patterns = [
      /how does (.+?) work/i,
      /explain (.+?)$/i,
      /where is (.+?)$/i,
      /find (.+?)$/i,
    ];

    for (const pattern of patterns) {
      const match = question.match(pattern);
      if (match) return match[1].trim();
    }

    return question.split(' ').slice(-3).join(' ');
  }

  private findFilesByFeature(feature: string): ProjectFile[] {
    const results: ProjectFile[] = [];
    const lowerFeature = feature.toLowerCase();

    const search = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        if (
          file.name.toLowerCase().includes(lowerFeature) ||
          file.content?.toLowerCase().includes(lowerFeature)
        ) {
          results.push(file);
        }
      }

      for (const subfolder of folder.subfolders) {
        search(subfolder);
      }
    };

    search(this.context!.project.rootFolder);
    return results.slice(0, 10);
  }

  private extractCodeReferences(files: ProjectFile[], feature: string): CodeReference[] {
    return files
      .filter((f) => f.content)
      .slice(0, 3)
      .map((f) => ({
        file: f.path,
        code: this.extractRelevantCode(f.content!, feature),
        explanation: `This code relates to ${feature}`,
      }));
  }

  private extractRelevantCode(content: string, feature: string): string {
    const lines = content.split('\n');
    const relevantLines = lines.filter((l) =>
      l.toLowerCase().includes(feature.toLowerCase())
    );

    return relevantLines.slice(0, 5).join('\n');
  }

  private explainAuthentication(): Explanation {
    const authFiles = this.findFilesByPattern('auth,login,user,account');
    const codeRefs = authFiles.slice(0, 2).map((f) => ({
      file: f.path,
      code: f.content?.slice(0, 200) || '',
      explanation: `This file handles authentication-related functionality.`,
    }));

    let answer = `## Authentication System\n\n`;

    if (authFiles.length === 0) {
      answer += `No specific authentication implementation found.\n\n`;
      answer += `This could mean:\n`;
      answer += `- Authentication is handled externally\n`;
      answer += `- The project doesn't require authentication\n`;
      answer += `- Authentication is minimal or not implemented\n`;
    } else {
      answer += `The authentication system is implemented in ${authFiles.length} file(s).\n\n`;
      answer += `### Key Files\n\n`;
      for (const file of authFiles.slice(0, 3)) {
        answer += `- \`${file.path}\`\n`;
      }
    }

    return {
      question: 'authentication',
      answer,
      relatedFiles: authFiles.map((f) => f.path),
      codeReferences: codeRefs,
      confidence: authFiles.length > 0 ? 0.8 : 0.4,
      educational: true,
    };
  }

  private explainDatabase(): Explanation {
    const dbFiles = this.findFilesByPattern('database,db,model,schema,sql,mongo');

    let answer = `## Database Implementation\n\n`;

    if (dbFiles.length === 0) {
      answer += `No database-specific files found.\n\n`;
      answer += `This could mean:\n`;
      answer += `- The project uses external APIs for data\n`;
      answer += `- Data is stored client-side\n`;
      answer += `- No persistent storage is used\n`;
    } else {
      answer += `Database-related code found in ${dbFiles.length} file(s).\n\n`;
      answer += `### Database Files\n\n`;
      for (const file of dbFiles.slice(0, 5)) {
        answer += `- \`${file.path}\`\n`;
      }
    }

    return {
      question: 'database',
      answer,
      relatedFiles: dbFiles.map((f) => f.path),
      codeReferences: [],
      confidence: dbFiles.length > 0 ? 0.8 : 0.4,
      educational: true,
    };
  }

  private explainAPI(): Explanation {
    const apiFiles = this.findFilesByPattern('api,route,endpoint,controller');

    let answer = `## API Implementation\n\n`;

    if (apiFiles.length === 0) {
      answer += `No specific API implementation found.\n\n`;
      answer += `This could mean:\n`;
      answer += `- It's a client-side only application\n`;
      answer += `- API calls are integrated directly in components\n`;
    } else {
      answer += `API-related code found in ${apiFiles.length} file(s).\n\n`;
      answer += `### Key API Files\n\n`;
      for (const file of apiFiles.slice(0, 3)) {
        answer += `- \`${file.path}\`\n`;
      }
    }

    return {
      question: 'api',
      answer,
      relatedFiles: apiFiles.map((f) => f.path),
      codeReferences: [],
      confidence: apiFiles.length > 0 ? 0.8 : 0.3,
      educational: true,
    };
  }

  private explainUI(): Explanation {
    const uiFiles = this.findFilesByPattern('component,page,view,template');

    let answer = `## UI Components\n\n`;

    answer += `The project contains ${uiFiles.length} UI-related file(s).\n\n`;

    if (uiFiles.length > 0) {
      answer += `### Component Structure\n\n`;
      for (const file of uiFiles.slice(0, 5)) {
        answer += `- \`${file.path}\` - ${this.determineComponentType(file)}\n`;
      }
    }

    return {
      question: 'ui',
      answer,
      relatedFiles: uiFiles.map((f) => f.path),
      codeReferences: [],
      confidence: uiFiles.length > 0 ? 0.8 : 0.4,
      educational: true,
    };
  }

  private explainTesting(): Explanation {
    const testFiles = this.findFilesByPattern('test,spec,__test__');

    let answer = `## Testing\n\n`;

    if (testFiles.length === 0) {
      answer += `No test files found.\n\n`;
      answer += `Consider adding tests to:\n`;
      answer += `- Verify functionality\n`;
      answer += `- Prevent regressions\n`;
      answer += `- Document expected behavior\n`;
    } else {
      answer += `The project has ${testFiles.length} test file(s).\n\n`;
      answer += `### Test Files\n\n`;
      for (const file of testFiles.slice(0, 5)) {
        answer += `- \`${file.path}\`\n`;
      }
    }

    return {
      question: 'testing',
      answer,
      relatedFiles: testFiles.map((f) => f.path),
      codeReferences: [],
      confidence: testFiles.length > 0 ? 0.8 : 0.5,
      educational: true,
    };
  }

  private generalExplanation(question: string): Explanation {
    const relatedFiles = this.findFilesByPattern(question);

    let answer = `## Response to Your Question\n\n`;
    answer += `You asked: "${question}"\n\n`;

    if (relatedFiles.length > 0) {
      answer += `I found ${relatedFiles.length} potentially relevant file(s).\n\n`;
      answer += `### Related Files\n\n`;
      for (const file of relatedFiles.slice(0, 5)) {
        answer += `- \`${file.path}\`\n`;
      }
    } else {
      answer += `I couldn't find direct matches for your question.\n\n`;
      answer += `Try asking about:\n`;
      answer += `- What the project does\n`;
      answer += `- How the folder structure is organized\n`;
      answer += `- How a specific feature works\n`;
      answer += `- Where authentication/database/API is implemented\n`;
    }

    return {
      question,
      answer,
      relatedFiles: relatedFiles.map((f) => f.path),
      codeReferences: [],
      confidence: 0.5,
      educational: true,
    };
  }

  private findFilesByPattern(pattern: string): ProjectFile[] {
    const results: ProjectFile[] = [];
    const patterns = pattern.split(',').map((p) => p.trim().toLowerCase());

    const search = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        for (const p of patterns) {
          if (file.name.toLowerCase().includes(p)) {
            results.push(file);
            break;
          }
        }
      }

      for (const subfolder of folder.subfolders) {
        search(subfolder);
      }
    };

    if (this.context) {
      search(this.context.project.rootFolder);
    }

    return results;
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private summarizeContent(content: string, feature: string): string {
    const lines = content.split('\n');
    const relevantLines = lines.filter((l) =>
      l.toLowerCase().includes(feature.toLowerCase())
    );

    if (relevantLines.length === 0) {
      return 'Content found but no direct matches for the feature.';
    }

    return relevantLines.slice(0, 3).join('\n');
  }

  private determineComponentType(file: ProjectFile): string {
    const name = file.name.toLowerCase();

    if (name.includes('button')) return 'Button component';
    if (name.includes('input')) return 'Form input component';
    if (name.includes('card')) return 'Card component';
    if (name.includes('modal')) return 'Modal dialog';
    if (name.includes('nav')) return 'Navigation component';
    if (name.includes('header')) return 'Header component';
    if (name.includes('footer')) return 'Footer component';
    if (name.includes('layout')) return 'Layout component';
    if (name.includes('page')) return 'Page component';
    if (name.includes('form')) return 'Form component';

    return 'UI component';
  }
}

export default CodebaseExplainer.getInstance();
