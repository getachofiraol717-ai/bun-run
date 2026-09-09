// @ts-nocheck
/**
 * Improvement Engine
 * Generates project improvement suggestions
 */

import { Project } from '../models/ProjectModel';
import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport } from '../models/BugReport';

export interface Improvement {
  id: string;
  category: 'code' | 'structure' | 'documentation' | 'testing' | 'security' | 'performance' | 'maintainability';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  rationale: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  files?: string[];
  example?: string;
  learningPoints: string[];
}

export interface ImprovementReport {
  projectId: string;
  generatedAt: Date;
  improvements: Improvement[];
  summary: string;
  estimatedTime: string;
}

export class ImprovementEngine {
  private static instance: ImprovementEngine | null = null;

  private constructor() {}

  static getInstance(): ImprovementEngine {
    if (!ImprovementEngine.instance) {
      ImprovementEngine.instance = new ImprovementEngine();
    }
    return ImprovementEngine.instance;
  }

  generateImprovements(
    project: Project,
    analysis?: AnalysisReport,
    bugReport?: BugReport
  ): ImprovementReport {
    const improvements: Improvement[] = [];

    // Generate improvements based on analysis
    if (analysis) {
      improvements.push(...this.fromAnalysis(analysis));
    }

    // Generate improvements based on bug report
    if (bugReport) {
      improvements.push(...this.fromBugReport(bugReport));
    }

    // Generate improvements based on project structure
    improvements.push(...this.fromStructure(project));

    // Generate educational improvements
    improvements.push(...this.educationalImprovements(project));

    // Sort by priority
    improvements.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      projectId: project.id,
      generatedAt: new Date(),
      improvements,
      summary: this.generateSummary(improvements),
      estimatedTime: this.estimateTime(improvements),
    };
  }

  private fromAnalysis(analysis: AnalysisReport): Improvement[] {
    const improvements: Improvement[] = [];

    // Documentation improvements
    if (!analysis.details.documentation.hasReadme) {
      improvements.push({
        id: 'add-readme',
        category: 'documentation',
        priority: 'high',
        title: 'Add README.md',
        description: 'Create a comprehensive README.md file explaining the project.',
        rationale: 'README files help developers understand the project quickly.',
        impact: 'Improved developer onboarding and project discoverability',
        effort: 'low',
        learningPoints: [
          'A good README includes: project description, installation, usage, and contribution guidelines.',
          'Clear documentation reduces support questions and improves collaboration.',
        ],
      });
    }

    if (analysis.details.documentation.documentationCoverage < 50) {
      improvements.push({
        id: 'improve-docs',
        category: 'documentation',
        priority: 'medium',
        title: 'Improve inline documentation',
        description: 'Add more inline comments and JSDoc/docstring comments.',
        rationale: 'Well-documented code is easier to maintain and understand.',
        impact: 'Better code maintainability and team collaboration',
        effort: 'medium',
        learningPoints: [
          'Document the "why" not the "what" - good comments explain reasoning.',
          'Use consistent documentation style throughout the codebase.',
        ],
      });
    }

    // Testing improvements
    if (!analysis.details.testing?.hasTests) {
      improvements.push({
        id: 'add-tests',
        category: 'testing',
        priority: 'high',
        title: 'Add test coverage',
        description: 'Create tests for core functionality.',
        rationale: 'Tests prevent regressions and give confidence when making changes.',
        impact: 'Fewer bugs, better refactoring capability',
        effort: 'medium',
        learningPoints: [
          'Start with testing the most critical, frequently-used functions.',
          'Test-driven development (TDD) can improve code design.',
        ],
      });
    }

    // Code quality improvements
    if (analysis.details.codeQuality.issues.length > 0) {
      const criticalIssues = analysis.details.codeQuality.issues.filter(
        (i) => i.severity === 'error' || i.severity === 'warning'
      );

      if (criticalIssues.length > 0) {
        improvements.push({
          id: 'fix-issues',
          category: 'code',
          priority: 'medium',
          title: 'Address code quality issues',
          description: `Fix ${criticalIssues.length} code quality issue(s).`,
          rationale: 'Code quality issues can lead to bugs and technical debt.',
          impact: 'Cleaner, more maintainable code',
          effort: 'medium',
          files: criticalIssues.filter((i) => i.file).map((i) => i.file!),
          learningPoints: [
            'Consistent code style improves readability.',
            'Linting tools can catch many issues automatically.',
          ],
        });
      }
    }

    // Structure improvements
    if (analysis.details.structure.maxDepth > 6) {
      improvements.push({
        id: 'flatten-structure',
        category: 'structure',
        priority: 'low',
        title: 'Reduce directory nesting',
        description: 'Consider flattening the directory structure.',
        rationale: 'Deep nesting makes files harder to find and imports more complex.',
        impact: 'Easier navigation and simpler import paths',
        effort: 'medium',
        learningPoints: [
          'Follow the principle of "three clicks or less" for finding files.',
          'Group related functionality, but avoid over-organization.',
        ],
      });
    }

    // Security improvements
    if (analysis.details.security.vulnerabilities.length > 0) {
      improvements.push({
        id: 'fix-security',
        category: 'security',
        priority: 'high',
        title: 'Address security vulnerabilities',
        description: `Fix ${analysis.details.security.vulnerabilities.length} security issue(s).`,
        rationale: 'Security vulnerabilities can lead to data breaches and system compromise.',
        impact: 'Protected users and data',
        effort: 'high',
        files: analysis.details.security.vulnerabilities
          .filter((v) => v.file)
          .map((v) => v.file!),
        learningPoints: [
          'Never trust user input - always validate and sanitize.',
          'Keep dependencies up to date to patch known vulnerabilities.',
        ],
      });
    }

    return improvements;
  }

  private fromBugReport(report: BugReport): Improvement[] {
    const improvements: Improvement[] = [];

    // Group bugs by category and priority
    const criticalBugs = report.bugs.filter((b) => b.severity === 'critical');
    const majorBugs = report.bugs.filter((b) => b.severity === 'major');

    if (criticalBugs.length > 0) {
      improvements.push({
        id: 'fix-critical-bugs',
        category: 'code',
        priority: 'high',
        title: 'Fix critical bugs',
        description: `Address ${criticalBugs.length} critical bug(s) identified.`,
        rationale: 'Critical bugs can cause crashes, security issues, or data loss.',
        impact: 'More stable and secure application',
        effort: 'high',
        files: criticalBugs.filter((b) => b.file).map((b) => b.file!),
        learningPoints: criticalBugs
          .filter((b) => b.educationalExplanation)
          .map((b) => b.educationalExplanation!),
      });
    }

    if (majorBugs.length > 0) {
      improvements.push({
        id: 'fix-major-bugs',
        category: 'code',
        priority: 'medium',
        title: 'Fix major bugs',
        description: `Address ${majorBugs.length} major bug(s).`,
        rationale: 'Major bugs can cause unexpected behavior or poor user experience.',
        impact: 'Better user experience',
        effort: 'medium',
        files: majorBugs.filter((b) => b.file).map((b) => b.file!),
        learningPoints: majorBugs
          .filter((b) => b.educationalExplanation)
          .map((b) => b.educationalExplanation!),
      });
    }

    return improvements;
  }

  private fromStructure(project: Project): Improvement[] {
    const improvements: Improvement[] = [];

    // Check for missing common directories
    const hasTests = this.hasDirectory(project.rootFolder, ['test', 'tests', 'spec', '__tests__']);
    const hasDocs = this.hasDirectory(project.rootFolder, ['docs', 'documentation']);
    const hasSrc = this.hasDirectory(project.rootFolder, ['src', 'lib', 'app']);

    if (!hasSrc) {
      improvements.push({
        id: 'add-src',
        category: 'structure',
        priority: 'low',
        title: 'Consider adding a src directory',
        description: 'Standard project structure often includes a src directory for source code.',
        rationale: 'Consistent structure makes projects easier to understand.',
        impact: 'Better code organization',
        effort: 'low',
        learningPoints: [
          'Common patterns: src/ for source, tests/ for tests, docs/ for documentation.',
          'Frameworks often have opinionated structures - follow their conventions.',
        ],
      });
    }

    if (!hasTests) {
      improvements.push({
        id: 'add-test-dir',
        category: 'testing',
        priority: 'medium',
        title: 'Add a dedicated test directory',
        description: 'Create a tests or spec directory for test files.',
        rationale: 'Separating tests from source code makes them easier to find and manage.',
        impact: 'Better test organization',
        effort: 'low',
      });
    }

    return improvements;
  }

  private educationalImprovements(project: Project): Improvement[] {
    const improvements: Improvement[] = [];

    // Suggest learning opportunities based on technologies
    const hasReact = project.technologyProfile.frameworks.some((f) =>
      f.name.toLowerCase().includes('react')
    );
    const hasTypeScript = project.technologyProfile.languages.some((l) =>
      l.name.toLowerCase().includes('typescript')
    );

    if (hasReact) {
      improvements.push({
        id: 'learn-react-patterns',
        category: 'maintainability',
        priority: 'low',
        title: 'Learn React best practices',
        description: 'Consider implementing common React patterns.',
        rationale: 'Following best practices makes code more maintainable.',
        impact: 'Better React code quality',
        effort: 'low',
        learningPoints: [
          'Use functional components with hooks over class components.',
          'Keep components small and focused on a single responsibility.',
          'Use React.memo() and useMemo() for performance optimization.',
        ],
      });
    }

    if (!hasTypeScript && project.technologyProfile.languages.some((l) => l.name.includes('JavaScript'))) {
      improvements.push({
        id: 'consider-typescript',
        category: 'maintainability',
        priority: 'low',
        title: 'Consider TypeScript',
        description: 'TypeScript adds static typing to JavaScript.',
        rationale: 'TypeScript can catch errors at compile time and improve code quality.',
        impact: 'Better type safety and developer experience',
        effort: 'high',
        learningPoints: [
          'TypeScript provides better IDE support and refactoring.',
          'Start with basic types, then gradually add more advanced features.',
        ],
      });
    }

    return improvements;
  }

  private hasDirectory(folder: ProjectFolder, names: string[]): boolean {
    const folderNames = folder.subfolders.map((f) => f.name.toLowerCase());
    return names.some((name) => folderNames.includes(name.toLowerCase()));
  }

  private generateSummary(improvements: Improvement[]): string {
    const highPriority = improvements.filter((i) => i.priority === 'high').length;
    const mediumPriority = improvements.filter((i) => i.priority === 'medium').length;
    const lowPriority = improvements.filter((i) => i.priority === 'low').length;

    return `Found ${improvements.length} improvement(s): ${highPriority} high priority, ${mediumPriority} medium priority, ${lowPriority} low priority.`;
  }

  private estimateTime(improvements: Improvement[]): string {
    let totalHours = 0;

    for (const imp of improvements) {
      switch (imp.effort) {
        case 'low':
          totalHours += 0.5;
          break;
        case 'medium':
          totalHours += 2;
          break;
        case 'high':
          totalHours += 8;
          break;
      }
    }

    if (totalHours < 1) {
      return 'Less than an hour';
    } else if (totalHours < 8) {
      return `${Math.round(totalHours)} hour(s)`;
    } else {
      return `${Math.round(totalHours / 8)} day(s)`;
    }
  }

  generateMarkdownReport(report: ImprovementReport): string {
    let markdown = `# Improvement Report\n\n`;
    markdown += `Generated: ${report.generatedAt.toISOString()}\n\n`;
    markdown += `## Summary\n\n${report.summary}\n\n`;
    markdown += `**Estimated Implementation Time:** ${report.estimatedTime}\n\n`;

    const byPriority = {
      high: report.improvements.filter((i) => i.priority === 'high'),
      medium: report.improvements.filter((i) => i.priority === 'medium'),
      low: report.improvements.filter((i) => i.priority === 'low'),
    };

    for (const [priority, improvements] of Object.entries(byPriority)) {
      if (improvements.length === 0) continue;

      markdown += `## ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n\n`;

      for (const imp of improvements) {
        markdown += `### ${imp.title}\n\n`;
        markdown += `**Category:** ${imp.category}\n\n`;
        markdown += `${imp.description}\n\n`;
        markdown += `**Rationale:** ${imp.rationale}\n\n`;
        markdown += `**Impact:** ${imp.impact}\n\n`;
        markdown += `**Effort:** ${imp.effort}\n\n`;

        if (imp.files && imp.files.length > 0) {
          markdown += `**Affected Files:**\n`;
          for (const file of imp.files.slice(0, 5)) {
            markdown += `- \`${file}\`\n`;
          }
          markdown += '\n';
        }

        if (imp.learningPoints.length > 0) {
          markdown += `**Learning Points:**\n`;
          for (const point of imp.learningPoints) {
            markdown += `- ${point}\n`;
          }
          markdown += '\n';
        }

        markdown += '---\n\n';
      }
    }

    return markdown;
  }
}

export default ImprovementEngine.getInstance();
