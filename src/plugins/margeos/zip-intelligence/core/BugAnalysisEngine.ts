// @ts-nocheck
/**
 * Bug Analysis Engine
 * Identifies and explains potential bugs in projects
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import { BugReport, Bug, BugPattern, COMMON_BUG_PATTERNS } from '../models/BugReport';

export interface BugPatternDefinition {
  pattern: RegExp;
  category: Bug['category'];
  severity: Bug['severity'];
  title: string;
  explanation: string;
  suggestion: string;
  example?: string;
  fixExample?: string;
}

export class BugAnalysisEngine {
  private static instance: BugAnalysisEngine | null = null;
  private customPatterns: BugPatternDefinition[] = [];

  private constructor() {
    this.initializeCustomPatterns();
  }

  static getInstance(): BugAnalysisEngine {
    if (!BugAnalysisEngine.instance) {
      BugAnalysisEngine.instance = new BugAnalysisEngine();
    }
    return BugAnalysisEngine.instance;
  }

  private initializeCustomPatterns(): void {
    // JavaScript/TypeScript patterns
    this.customPatterns.push({
      pattern: /==\s*(true|false|null|undefined)/g,
      category: 'logic',
      severity: 'major',
      title: 'Loose equality check',
      explanation: 'Using loose equality (==) with primitive values can lead to unexpected type coercion. For example, 0 == false evaluates to true.',
      suggestion: 'Use strict equality (===) instead to check both value and type.',
      example: 'if (value == null) // problematic',
      fixExample: 'if (value === null || value === undefined)',
    });

    this.customPatterns.push({
      pattern: /\.innerHTML\s*=/g,
      category: 'security',
      severity: 'critical',
      title: 'Potential XSS vulnerability',
      explanation: 'Directly setting innerHTML with untrusted data can allow Cross-Site Scripting (XSS) attacks.',
      suggestion: 'Use textContent for text, or sanitize HTML before setting innerHTML.',
      example: 'element.innerHTML = userInput;',
      fixExample: 'element.textContent = userInput;',
    });

    this.customPatterns.push({
      pattern: /eval\s*\(/g,
      category: 'security',
      severity: 'critical',
      title: 'Use of eval()',
      explanation: 'eval() executes arbitrary code, which is dangerous and hard to secure. It also impacts performance.',
      suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse() for JSON.',
      example: 'eval("var x = " + userInput);',
      fixExample: 'JSON.parse(userInput)',
    });

    // Python patterns
    this.customPatterns.push({
      pattern: /except\s*:/g,
      category: 'logic',
      severity: 'major',
      title: 'Bare except clause',
      explanation: 'Catching all exceptions with a bare except: can hide bugs and make debugging difficult.',
      suggestion: 'Catch specific exceptions or log the error type.',
      example: 'try:\n    ...\nexcept:\n    ...',
      fixExample: 'try:\n    ...\nexcept ValueError as e:\n    print(f"Error: {e}")',
    });

    this.customPatterns.push({
      pattern: /from\s+\w+\s+import\s+\*/g,
      category: 'style',
      severity: 'minor',
      title: 'Wildcard import',
      explanation: 'Wildcard imports (from module import *) pollute the namespace and make code harder to understand.',
      suggestion: 'Import specific names instead.',
      example: 'from utils import *',
      fixExample: 'from utils import helper1, helper2',
    });

    // General patterns
    this.customPatterns.push({
      pattern: /console\.(log|debug|info)\s*\(/g,
      category: 'style',
      severity: 'info',
      title: 'Console statement in code',
      explanation: 'Console statements are useful for debugging but should not remain in production code.',
      suggestion: 'Remove console statements or use a proper logging library.',
    });

    this.customPatterns.push({
      pattern: /TODO|FIXME|HACK|XXX/gi,
      category: 'documentation',
      severity: 'minor',
      title: 'Incomplete work marker',
      explanation: 'TODO/FIXME markers indicate incomplete work that should be addressed.',
      suggestion: 'Create issues or tickets to track these items.',
    });

    this.customPatterns.push({
      pattern: /\+\s*""\s*\+|\s*\+\s*''\s*\+/g,
      category: 'performance',
      severity: 'minor',
      title: 'Concatenating with empty string',
      explanation: 'While not an error, using template literals is clearer and sometimes faster.',
      suggestion: 'Consider using template literals for string interpolation.',
      example: 'const str = value + ""',
      fixExample: 'const str = `${value}`',
    });
  }

  addCustomPattern(pattern: BugPatternDefinition): void {
    this.customPatterns.push(pattern);
  }

  analyze(project: Project): BugReport {
    const bugs: Bug[] = [];
    let bugId = 1;

    const analyzeFile = (file: ProjectFile) => {
      if (!file.content) return;

      const fileBugs = this.analyzeFile(file);
      for (const bug of fileBugs) {
        bug.id = `bug-${bugId++}`;
        bugs.push(bug);
      }
    };

    const analyzeFolder = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        analyzeFile(file);
      }
      for (const subfolder of folder.subfolders) {
        analyzeFolder(subfolder);
      }
    };

    analyzeFolder(project.rootFolder);

    return {
      id: `bug-report-${Date.now()}`,
      projectId: project.id,
      createdAt: new Date(),
      bugs,
      statistics: this.calculateStatistics(bugs),
      severityBreakdown: this.calculateSeverityBreakdown(bugs),
      categoryBreakdown: this.calculateCategoryBreakdown(bugs),
    };
  }

  private analyzeFile(file: ProjectFile): Bug[] {
    const bugs: Bug[] = [];

    // Analyze with custom patterns
    for (const pattern of this.customPatterns) {
      const matches = file.content.match(pattern.pattern);
      if (matches) {
        bugs.push({
          severity: pattern.severity,
          category: pattern.category,
          title: pattern.title,
          description: `${pattern.explanation}\n\nFound ${matches.length} occurrence(s).`,
          file: file.path,
          suggestion: pattern.suggestion,
          educationalExplanation: pattern.explanation,
          effort: pattern.severity === 'critical' ? 'high' : pattern.severity === 'major' ? 'medium' : 'low',
          autoFixable: this.isAutoFixable(pattern),
          fixSuggestion: pattern.fixExample,
        });
      }
    }

    // Check for long files
    if (file.content.split('\n').length > 500) {
      bugs.push({
        severity: 'info',
        category: 'style',
        title: 'Large file detected',
        description: `This file has ${file.content.split('\n').length} lines. Large files can be harder to maintain.`,
        file: file.path,
        suggestion: 'Consider splitting this file into smaller, focused modules.',
        effort: 'medium',
      });
    }

    // Check for deeply nested code
    const maxNesting = this.getMaxNestingLevel(file.content);
    if (maxNesting > 5) {
      bugs.push({
        severity: 'minor',
        category: 'style',
        title: 'Deep nesting detected',
        description: `This file has code nested up to ${maxNesting} levels deep.`,
        file: file.path,
        suggestion: 'Consider extracting nested code into separate functions.',
        effort: 'medium',
      });
    }

    return bugs;
  }

  private getMaxNestingLevel(content: string): number {
    let maxLevel = 0;
    let currentLevel = 0;

    for (const char of content) {
      if (char === '{' || char === '(' || char === '[') {
        currentLevel++;
        maxLevel = Math.max(maxLevel, currentLevel);
      } else if (char === '}' || char === ')' || char === ']') {
        currentLevel = Math.max(0, currentLevel - 1);
      }
    }

    return maxLevel;
  }

  private isAutoFixable(pattern: BugPatternDefinition): boolean {
    const autoFixablePatterns = ['console.log', 'TODO', 'FIXME'];
    return autoFixablePatterns.some((p) => pattern.title.toLowerCase().includes(p.toLowerCase()));
  }

  private calculateStatistics(bugs: Bug[]): BugReport['statistics'] {
    const bugsPerFile: Record<string, number> = {};
    const bugsPerCategory: Record<string, number> = {};

    for (const bug of bugs) {
      if (bug.file) {
        bugsPerFile[bug.file] = (bugsPerFile[bug.file] || 0) + 1;
      }
      bugsPerCategory[bug.category] = (bugsPerCategory[bug.category] || 0) + 1;
    }

    return {
      totalBugs: bugs.length,
      criticalBugs: bugs.filter((b) => b.severity === 'critical').length,
      majorBugs: bugs.filter((b) => b.severity === 'major').length,
      minorBugs: bugs.filter((b) => b.severity === 'minor').length,
      infoBugs: bugs.filter((b) => b.severity === 'info').length,
      autoFixableBugs: bugs.filter((b) => b.autoFixable).length,
      bugsPerFile,
      bugsPerCategory,
    };
  }

  private calculateSeverityBreakdown(bugs: Bug[]): Record<Bug['severity'], number> {
    return {
      critical: bugs.filter((b) => b.severity === 'critical').length,
      major: bugs.filter((b) => b.severity === 'major').length,
      minor: bugs.filter((b) => b.severity === 'minor').length,
      info: bugs.filter((b) => b.severity === 'info').length,
    };
  }

  private calculateCategoryBreakdown(bugs: Bug[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const bug of bugs) {
      breakdown[bug.category] = (breakdown[bug.category] || 0) + 1;
    }
    return breakdown;
  }

  generateReport(report: BugReport): string {
    let output = `# Bug Analysis Report\n\n`;
    output += `Generated: ${report.createdAt.toISOString()}\n\n`;
    output += `## Summary\n\n`;
    output += `- **Total Issues:** ${report.statistics.totalBugs}\n`;
    output += `- **Critical:** ${report.statistics.criticalBugs}\n`;
    output += `- **Major:** ${report.statistics.majorBugs}\n`;
    output += `- **Minor:** ${report.statistics.minorBugs}\n`;
    output += `- **Info:** ${report.statistics.infoBugs}\n`;
    output += `- **Auto-fixable:** ${report.statistics.autoFixableBugs}\n\n`;

    if (report.statistics.criticalBugs > 0) {
      output += `## Critical Issues\n\n`;
      for (const bug of report.bugs.filter((b) => b.severity === 'critical')) {
        output += this.formatBug(bug);
      }
    }

    if (report.statistics.majorBugs > 0) {
      output += `## Major Issues\n\n`;
      for (const bug of report.bugs.filter((b) => b.severity === 'major')) {
        output += this.formatBug(bug);
      }
    }

    if (report.statistics.minorBugs > 0) {
      output += `## Minor Issues\n\n`;
      for (const bug of report.bugs.filter((b) => b.severity === 'minor')) {
        output += this.formatBug(bug);
      }
    }

    if (report.statistics.infoBugs > 0) {
      output += `## Informational\n\n`;
      for (const bug of report.bugs.filter((b) => b.severity === 'info')) {
        output += this.formatBug(bug);
      }
    }

    return output;
  }

  private formatBug(bug: Bug): string {
    let output = `### ${bug.title}\n\n`;
    output += `**Severity:** ${bug.severity}\n`;
    output += `**Category:** ${bug.category}\n`;
    if (bug.file) {
      output += `**File:** \`${bug.file}\`\n`;
    }
    output += `\n${bug.description}\n`;
    if (bug.suggestion) {
      output += `\n**Suggestion:** ${bug.suggestion}\n`;
    }
    if (bug.educationalExplanation) {
      output += `\n**Why This Matters:** ${bug.educationalExplanation}\n`;
    }
    if (bug.fixSuggestion) {
      output += `\n**Fix Example:**\n\`\`\`\n${bug.fixSuggestion}\n\`\`\`\n`;
    }
    output += '\n---\n\n';

    return output;
  }

  prioritizeFixes(report: BugReport): Bug[] {
    const priority: Bug[] = [];

    // First: critical and auto-fixable
    priority.push(
      ...report.bugs.filter((b) => b.severity === 'critical' && b.autoFixable)
    );
    priority.push(
      ...report.bugs.filter((b) => b.severity === 'critical' && !b.autoFixable)
    );

    // Then: major and auto-fixable
    priority.push(
      ...report.bugs.filter((b) => b.severity === 'major' && b.autoFixable)
    );
    priority.push(
      ...report.bugs.filter((b) => b.severity === 'major' && !b.autoFixable)
    );

    // Then: minor
    priority.push(...report.bugs.filter((b) => b.severity === 'minor'));

    // Finally: info
    priority.push(...report.bugs.filter((b) => b.severity === 'info'));

    return priority;
  }
}

export default BugAnalysisEngine.getInstance();
