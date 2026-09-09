/**
 * Code Quality Analyzer
 * Analyzes code quality metrics and patterns
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface CodeQualityAnalysis {
  overallScore: number;
  metrics: QualityMetrics;
  issues: QualityIssue[];
  strengths: string[];
  recommendations: string[];
}

export interface QualityMetrics {
  averageLineLength: number;
  maxLineLength: number;
  averageFunctionLength: number;
  maxFunctionLength: number;
  averageFileLength: number;
  maxFileLength: number;
  commentRatio: number;
  documentationCoverage: number;
  namingConsistency: number;
  complexityDistribution: ComplexityDistribution;
}

export interface ComplexityDistribution {
  low: number;
  medium: number;
  high: number;
}

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'style' | 'complexity' | 'documentation' | 'maintainability' | 'best-practice';
  file?: string;
  line?: number;
  message: string;
  suggestion: string;
  pattern?: string;
}

export class CodeQualityAnalyzer {
  private static instance: CodeQualityAnalyzer | null = null;

  private static readonly ISSUE_PATTERNS: Array<{
    pattern: RegExp;
    severity: QualityIssue['severity'];
    category: QualityIssue['category'];
    message: string;
    suggestion: string;
  }> = [
    // Style issues
    {
      pattern: /\t/g,
      severity: 'warning',
      category: 'style',
      message: 'Tab characters detected',
      suggestion: 'Use spaces for consistent indentation',
    },
    {
      pattern: /\r\n/g,
      severity: 'info',
      category: 'style',
      message: 'Windows line endings detected',
      suggestion: 'Use Unix line endings (LF) for cross-platform compatibility',
    },
    {
      pattern: /;\s*$/gm,
      severity: 'info',
      category: 'style',
      message: 'Unnecessary semicolons at end of lines',
      suggestion: 'JavaScript/TypeScript automatically inserts semicolons',
    },
    // Complexity issues
    {
      pattern: /for\s*\(\s*;\s*\);\s*{/g,
      severity: 'warning',
      category: 'complexity',
      message: 'Empty for loop detected',
      suggestion: 'Consider using a while loop or refactoring',
    },
    {
      pattern: /switch\s*\([^)]+\)\s*{[\s\S]{0,50}case[\s\S]{0,200}case[\s\S]{0,200}case[\s\S]{0,200}case/g,
      severity: 'warning',
      category: 'complexity',
      message: 'Switch with many cases detected',
      suggestion: 'Consider using a map/object for better maintainability',
    },
    // Documentation issues
    {
      pattern: /(?:function|const|let|var)\s+\w+\s*[=:]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)/g,
      severity: 'info',
      category: 'documentation',
      message: 'Undocumented function/expression',
      suggestion: 'Add JSDoc comments to explain purpose and parameters',
    },
    // Best practice issues
    {
      pattern: /var\s+\w+/g,
      severity: 'warning',
      category: 'best-practice',
      message: 'Use of var keyword',
      suggestion: 'Use const or let instead for better scoping',
    },
    {
      pattern: /==\s*(?!null|undefined)[^=]/g,
      severity: 'warning',
      category: 'best-practice',
      message: 'Loose equality check',
      suggestion: 'Use strict equality (===) to avoid type coercion issues',
    },
    {
      pattern: /new\s+Array\s*\(/g,
      severity: 'info',
      category: 'best-practice',
      message: 'Array constructor usage',
      suggestion: 'Use array literal [] instead',
    },
    {
      pattern: /new\s+String\s*\(/g,
      severity: 'info',
      category: 'best-practice',
      message: 'String constructor usage',
      suggestion: 'Use string literal "" instead',
    },
    {
      pattern: /new\s+Object\s*\(/g,
      severity: 'info',
      category: 'best-practice',
      message: 'Object constructor usage',
      suggestion: 'Use object literal {} instead',
    },
    {
      pattern: /\.onclick\s*=/g,
      severity: 'warning',
      category: 'best-practice',
      message: 'Inline onclick handler',
      suggestion: 'Use addEventListener for better separation of concerns',
    },
    // Maintainability issues
    {
      pattern: /function\s+\w+[^{]*{[^}]{200,}/g,
      severity: 'warning',
      category: 'maintainability',
      message: 'Very long function detected',
      suggestion: 'Break this function into smaller, focused functions',
    },
    {
      pattern: /if\s*\([^)]+\)\s*{\s*if\s*\([^)]+\)\s*{\s*if\s*\([^)]+\)\s*{/g,
      severity: 'warning',
      category: 'complexity',
      message: 'Deeply nested if statements',
      suggestion: 'Consider using early returns or extracting conditions',
    },
  ];

  private constructor() {}

  static getInstance(): CodeQualityAnalyzer {
    if (!CodeQualityAnalyzer.instance) {
      CodeQualityAnalyzer.instance = new CodeQualityAnalyzer();
    }
    return CodeQualityAnalyzer.instance;
  }

  analyze(project: Project): CodeQualityAnalysis {
    const files = this.flattenFiles(project.rootFolder);
    const codeFiles = files.filter((f) => this.isCodeFile(f.extension) && f.content);

    const metrics = this.calculateMetrics(codeFiles);
    const issues = this.findIssues(codeFiles);
    const strengths = this.identifyStrengths(metrics, issues);
    const recommendations = this.generateRecommendations(metrics, issues);
    const overallScore = this.calculateOverallScore(metrics, issues);

    return {
      overallScore,
      metrics,
      issues,
      strengths,
      recommendations,
    };
  }

  private flattenFiles(folder: ProjectFolder): ProjectFile[] {
    const files: ProjectFile[] = [...folder.files];

    for (const subfolder of folder.subfolders) {
      files.push(...this.flattenFiles(subfolder));
    }

    return files;
  }

  private isCodeFile(ext: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.go', '.rs'];
    return codeExtensions.includes(ext.toLowerCase());
  }

  private calculateMetrics(files: ProjectFile[]): QualityMetrics {
    let totalLineLength = 0;
    let maxLineLength = 0;
    let totalFunctionLength = 0;
    let maxFunctionLength = 0;
    let totalFileLength = 0;
    let maxFileLength = 0;
    let totalCommentLines = 0;
    let totalLines = 0;
    let documentedFunctions = 0;
    let totalFunctions = 0;

    const complexityDistribution: ComplexityDistribution = { low: 0, medium: 0, high: 0 };

    for (const file of files) {
      if (!file.content) continue;

      const lines = file.content.split('\n');
      totalFileLength += lines.length;
      maxFileLength = Math.max(maxFileLength, lines.length);

      for (const line of lines) {
        totalLineLength += line.length;
        maxLineLength = Math.max(maxLineLength, line.length);

        if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
          totalCommentLines++;
        }
      }

      // Detect comments
      const commentMatches = file.content.matchAll(/\/\*[\s\S]*?\*\/|\/\/.*$/gm);
      let commentBlocks = 0;
      for (const _ of commentMatches) {
        commentBlocks++;
        totalCommentLines++;
      }

      totalLines += lines.length;

      // Function detection
      const functionMatches = file.content.matchAll(
        /(?:function|def|fn|func)\s+\w+\s*\([^)]*\)|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)/g
      );

      for (const match of functionMatches) {
        totalFunctions++;

        // Estimate function length
        const startIndex = match.index!;
        const functionCode = file.content.slice(startIndex, startIndex + 1000);
        const braceCount = (functionCode.match(/[{}]/g) || []).length;
        const estimatedLength = Math.min(braceCount * 3, 50);

        totalFunctionLength += estimatedLength;
        maxFunctionLength = Math.max(maxFunctionLength, estimatedLength);

        // Check for JSDoc/documentation
        const beforeFunction = file.content.slice(Math.max(0, startIndex - 200), startIndex);
        if (/\/\*\*|\/\/.*@param|##.*function/.test(beforeFunction)) {
          documentedFunctions++;
        }

        // Categorize complexity
        if (estimatedLength < 15) {
          complexityDistribution.low++;
        } else if (estimatedLength < 30) {
          complexityDistribution.medium++;
        } else {
          complexityDistribution.high++;
        }
      }
    }

    const averageLineLength = totalLines > 0 ? totalLineLength / totalLines : 0;
    const averageFunctionLength = totalFunctions > 0 ? totalFunctionLength / totalFunctions : 0;
    const averageFileLength = files.length > 0 ? totalFileLength / files.length : 0;
    const commentRatio = totalLines > 0 ? (totalCommentLines / totalLines) * 100 : 0;
    const documentationCoverage = totalFunctions > 0 ? (documentedFunctions / totalFunctions) * 100 : 0;

    return {
      averageLineLength: Math.round(averageLineLength * 10) / 10,
      maxLineLength,
      averageFunctionLength: Math.round(averageFunctionLength * 10) / 10,
      maxFunctionLength,
      averageFileLength: Math.round(averageFileLength),
      maxFileLength,
      commentRatio: Math.round(commentRatio * 10) / 10,
      documentationCoverage: Math.round(documentationCoverage),
      namingConsistency: 100, // Placeholder
      complexityDistribution,
    };
  }

  private findIssues(files: ProjectFile[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    for (const file of files) {
      if (!file.content) continue;

      for (const patternDef of CodeQualityAnalyzer.ISSUE_PATTERNS) {
        const matches = file.content.matchAll(new RegExp(patternDef.pattern, 'g'));

        for (const match of matches) {
          const lineNumber = file.content.slice(0, match.index).split('\n').length;

          issues.push({
            severity: patternDef.severity,
            category: patternDef.category,
            file: file.path,
            line: lineNumber,
            message: patternDef.message,
            suggestion: patternDef.suggestion,
            pattern: match[0],
          });
        }
      }

      // Check for long lines
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 120) {
          issues.push({
            severity: 'info',
            category: 'style',
            file: file.path,
            line: i + 1,
            message: `Line exceeds 120 characters (${lines[i].length} chars)`,
            suggestion: 'Consider breaking this line for better readability',
          });
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return issues.filter((issue) => {
      const key = `${issue.file}:${issue.line}:${issue.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private identifyStrengths(metrics: QualityMetrics, issues: QualityIssue[]): string[] {
    const strengths: string[] = [];

    if (metrics.commentRatio > 20) {
      strengths.push('Good inline documentation coverage');
    }

    if (metrics.documentationCoverage > 50) {
      strengths.push('Most functions are well-documented');
    }

    if (metrics.averageLineLength < 80) {
      strengths.push('Lines are appropriately short for readability');
    }

    const criticalIssues = issues.filter((i) => i.severity === 'error').length;
    if (criticalIssues === 0) {
      strengths.push('No critical code quality issues detected');
    }

    if (metrics.complexityDistribution.high < metrics.complexityDistribution.low) {
      strengths.push('Most functions have low complexity');
    }

    return strengths;
  }

  private generateRecommendations(metrics: QualityMetrics, issues: QualityIssue[]): string[] {
    const recommendations: string[] = [];

    // Based on metrics
    if (metrics.averageLineLength > 100) {
      recommendations.push('Reduce average line length by breaking long expressions across multiple lines');
    }

    if (metrics.commentRatio < 10) {
      recommendations.push('Increase code documentation - aim for at least 15-20% comment coverage');
    }

    if (metrics.documentationCoverage < 50) {
      recommendations.push('Add JSDoc comments to undocumented functions');
    }

    if (metrics.maxFileLength > 500) {
      recommendations.push('Consider splitting large files (>500 lines) into smaller, focused modules');
    }

    if (metrics.maxFunctionLength > 50) {
      recommendations.push('Refactor long functions to improve maintainability');
    }

    // Based on issues
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    if (errorCount > 0) {
      recommendations.push(`Address ${errorCount} error-level issues first`);
    }

    if (warningCount > 10) {
      recommendations.push(`Address ${warningCount} warning-level issues to improve code quality`);
    }

    const styleIssues = issues.filter((i) => i.category === 'style').length;
    if (styleIssues > 20) {
      recommendations.push('Consider adding or enforcing a linter (ESLint, Prettier) for consistent style');
    }

    return recommendations;
  }

  private calculateOverallScore(metrics: QualityMetrics, issues: QualityIssue[]): number {
    let score = 100;

    // Deduct for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          score -= 5;
          break;
        case 'warning':
          score -= 2;
          break;
        case 'info':
          score -= 0.5;
          break;
      }
    }

    // Adjust for metrics
    if (metrics.averageLineLength > 100) score -= 5;
    if (metrics.maxFileLength > 500) score -= 5;
    if (metrics.commentRatio < 10) score -= 10;
    if (metrics.documentationCoverage < 50) score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getScoreGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

export default CodeQualityAnalyzer.getInstance();
