// @ts-nocheck
/**
 * Performance Analyzer
 * Identifies potential performance issues and optimization opportunities
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface PerformanceAnalysis {
  score: number;
  issues: PerformanceIssue[];
  metrics: PerformanceMetrics;
  recommendations: string[];
  optimizations: OptimizationSuggestion[];
}

export interface PerformanceIssue {
  severity: 'critical' | 'major' | 'minor';
  category: 'memory' | 'computation' | 'network' | 'rendering' | 'database' | 'caching';
  title: string;
  description: string;
  file?: string;
  line?: number;
  impact: string;
  suggestion: string;
  estimatedImpact?: string;
}

export interface PerformanceMetrics {
  averageFileSize: number;
  largeFiles: number;
  nestedLoops: number;
  missingMemoization: number;
  inefficientArrayOps: number;
  heavyDependencies: number;
  bundleSizeEstimate: number;
}

export interface OptimizationSuggestion {
  category: string;
  title: string;
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
  codeExample?: string;
}

export class PerformanceAnalyzer {
  private static instance: PerformanceAnalyzer | null = null;

  private static readonly ISSUE_PATTERNS: Array<{
    pattern: RegExp;
    severity: PerformanceIssue['severity'];
    category: PerformanceIssue['category'];
    title: string;
    description: string;
    impact: string;
    suggestion: string;
    estimatedImpact?: string;
  }> = [
    // Computation issues
    {
      pattern: /for\s*\([^)]+\)\s*{[\s\S]*?for\s*\([^)]+\)/g,
      severity: 'major',
      category: 'computation',
      title: 'Nested Loop Detected',
      description: 'Nested loops can lead to O(n²) or worse time complexity.',
      impact: 'May cause significant slowdowns with large datasets',
      suggestion: 'Consider using hash maps for O(1) lookups or algorithm optimization',
      estimatedImpact: 'High - O(n²) complexity',
    },
    {
      pattern: /JSON\.parse|JSON\.stringify/g,
      severity: 'minor',
      category: 'computation',
      title: 'JSON Serialization',
      description: 'Frequent JSON parsing/serialization can impact performance.',
      impact: 'Moderate CPU usage during large data processing',
      suggestion: 'Cache parsed results and minimize unnecessary conversions',
      estimatedImpact: 'Medium - CPU intensive operation',
    },
    {
      pattern: /\.sort\s*\(\s*(?:function|\([^)]*\)\s*=>)/g,
      severity: 'minor',
      category: 'computation',
      title: 'Custom Sort Function',
      description: 'Custom sort comparators can be slower than built-in sorting.',
      impact: 'Moderate - sorting overhead',
      suggestion: 'Use built-in comparators when possible',
      estimatedImpact: 'Low - varies by dataset size',
    },
    // Memory issues
    {
      pattern: /\b(?:let|const)\s+\w+\s*=\s*\[[\s\S]{500,}\]/g,
      severity: 'major',
      category: 'memory',
      title: 'Large Inline Array',
      description: 'Large arrays created inline consume significant memory.',
      impact: 'High memory usage, potential out-of-memory errors',
      suggestion: 'Move large data to external files or generate dynamically',
      estimatedImpact: 'High - memory allocation',
    },
    {
      pattern: /new\s+Array\s*\(\s*\d+\s*\)/g,
      severity: 'minor',
      category: 'memory',
      title: 'Pre-allocated Array with Size',
      description: 'Creating arrays with explicit sizes may allocate more memory than needed.',
      impact: 'Minor - potential memory waste',
      suggestion: 'Consider using array literals or dynamic growth',
    },
    {
      pattern: /useEffect\s*\(\s*\(\)\s*=>\s*{[\s\S]{500,}/g,
      severity: 'major',
      category: 'memory',
      title: 'Large useEffect Callback',
      description: 'Large effect callbacks are harder to optimize and debug.',
      impact: 'May cause unnecessary re-renders',
      suggestion: 'Split into smaller, focused effects',
      estimatedImpact: 'Medium - maintenance and performance',
    },
    // Network issues
    {
      pattern: /fetch\s*\([^)]*\)(?!\s*\.(?:then|catch|finally))/g,
      severity: 'minor',
      category: 'network',
      title: 'Unhandled Fetch Promise',
      description: 'Fetch without proper error handling may cause silent failures.',
      impact: 'User experience issues when requests fail',
      suggestion: 'Add .catch() or use async/await with try/catch',
    },
    {
      pattern: /axios\.(?:get|post|put|delete)\s*\([^,]+,(?!\s*{)/g,
      severity: 'minor',
      category: 'network',
      title: 'Request Without Config',
      description: 'API requests without configuration may use default timeout.',
      impact: 'May hang indefinitely on slow networks',
      suggestion: 'Add timeout configuration',
    },
    // Rendering issues (React)
    {
      pattern: /useState\s*\(\s*(?!false|null|undefined|["'{}[\]0-9])/g,
      severity: 'major',
      category: 'rendering',
      title: 'Complex Initial State',
      description: 'Complex objects as initial state are created on every render.',
      impact: 'Unnecessary object creation and potential re-renders',
      suggestion: 'Use lazy initialization or memoization',
      estimatedImpact: 'Medium - per-render overhead',
    },
    {
      pattern: /\.map\s*\([^)]*\.map\s*\(/g,
      severity: 'minor',
      category: 'rendering',
      title: 'Nested Array.map()',
      description: 'Chained map operations can be optimized into a single pass.',
      impact: 'Moderate - multiple iterations',
      suggestion: 'Consider using flatMap or a single reduce',
      estimatedImpact: 'Low - O(n) extra iterations',
    },
    // Database issues
    {
      pattern: /\.find\s*\(\s*\([^)]+\)\s*=>\s*true\s*\)/g,
      severity: 'minor',
      category: 'database',
      title: 'Inefficient Array Search',
      description: 'Using find with always-true predicate is inefficient.',
      impact: 'Unnecessary iteration',
      suggestion: 'Consider using filter or direct access',
    },
    {
      pattern: /\.filter\s*\([^)]+\)\.map\s*\(/g,
      severity: 'minor',
      category: 'database',
      title: 'Chained Filter and Map',
      description: 'Two passes over data can often be combined.',
      impact: 'Double iteration',
      suggestion: 'Use reduce to combine filter and map operations',
      estimatedImpact: 'Low - 2x iterations',
    },
    // Caching issues
    {
      pattern: /useMemo\s*\(\s*\(\)\s*=>\s*\{[\s\S]{0,50}return\s+\w+\.find/g,
      severity: 'minor',
      category: 'caching',
      title: 'Expensive Operation in useMemo',
      description: 'Memoized value contains expensive find operation.',
      impact: 'Memoization may not provide expected benefits',
      suggestion: 'Ensure the operation is actually expensive enough to memoize',
    },
    {
      pattern: /useCallback\s*\(\s*\(\)\s*=>/g,
      severity: 'info',
      category: 'caching',
      title: 'useCallback Usage',
      description: 'useCallback can prevent unnecessary re-renders of child components.',
      impact: 'Depends on usage frequency',
      suggestion: 'Use with React.memo for optimal results',
    },
  ];

  private constructor() {}

  static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer();
    }
    return PerformanceAnalyzer.instance;
  }

  analyze(project: Project): PerformanceAnalysis {
    const files = this.flattenFiles(project.rootFolder);
    const codeFiles = files.filter((f) => this.isCodeFile(f.extension) && f.content);

    const metrics = this.calculateMetrics(codeFiles);
    const issues = this.findIssues(codeFiles);
    const recommendations = this.generateRecommendations(issues, metrics);
    const optimizations = this.suggestOptimizations(codeFiles);
    const score = this.calculateScore(metrics, issues);

    return {
      score,
      issues,
      metrics,
      recommendations,
      optimizations,
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
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go'];
    return codeExtensions.includes(ext.toLowerCase());
  }

  private calculateMetrics(files: ProjectFile[]): PerformanceMetrics {
    let totalSize = 0;
    let largeFiles = 0;
    let nestedLoops = 0;
    let missingMemoization = 0;
    let inefficientArrayOps = 0;
    let heavyDependencies = 0;
    let bundleSizeEstimate = 0;

    for (const file of files) {
      if (!file.content) continue;

      const lines = file.content.split('\n').length;
      totalSize += lines;

      if (lines > 300) largeFiles++;

      // Nested loops detection
      const nestedLoopRegex = /for\s*\([^)]+\)\s*{[\s\S]*?for\s*\(/g;
      const nestedMatches = file.content.match(nestedLoopRegex);
      if (nestedMatches) nestedLoops += nestedMatches.length;

      // Missing memoization (functions without useMemo/useCallback in React)
      if (file.extension.includes('tsx') || file.extension.includes('jsx')) {
        const hasUseMemo = /useMemo\s*\(/.test(file.content);
        const hasComplexLogic = /\.filter|\.map|\.find|\.reduce/.test(file.content);
        if (hasComplexLogic && !hasUseMemo && lines > 100) {
          missingMemoization++;
        }
      }

      // Inefficient array operations
      const inefficientOps = file.content.match(/\.(?:filter|map|reduce|forEach)\s*\(/g);
      if (inefficientOps) inefficientArrayOps += inefficientOps.length;

      // Bundle size estimation (simple heuristic)
      if (this.isCodeFile(file.extension)) {
        bundleSizeEstimate += lines * 0.5; // Rough estimate in KB
      }
    }

    return {
      averageFileSize: files.length > 0 ? Math.round(totalSize / files.length) : 0,
      largeFiles,
      nestedLoops,
      missingMemoization,
      inefficientArrayOps,
      heavyDependencies,
      bundleSizeEstimate: Math.round(bundleSizeEstimate),
    };
  }

  private findIssues(files: ProjectFile[]): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    for (const file of files) {
      if (!file.content) continue;

      for (const pattern of PerformanceAnalyzer.ISSUE_PATTERNS) {
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        const matches = file.content.matchAll(regex);

        for (const match of matches) {
          const lineNumber = file.content.slice(0, match.index).split('\n').length;

          issues.push({
            severity: pattern.severity,
            category: pattern.category,
            title: pattern.title,
            description: pattern.description,
            file: file.path,
            line: lineNumber,
            impact: pattern.impact,
            suggestion: pattern.suggestion,
            estimatedImpact: pattern.estimatedImpact,
          });
        }
      }
    }

    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, minor: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private generateRecommendations(issues: PerformanceIssue[], metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    const criticalIssues = issues.filter((i) => i.severity === 'critical');
    const majorIssues = issues.filter((i) => i.severity === 'major');

    if (criticalIssues.length > 0) {
      recommendations.push(
        `Address ${criticalIssues.length} critical performance issue(s) - these are likely causing noticeable slowdowns.`
      );
    }

    if (majorIssues.length > 0) {
      recommendations.push(
        `${majorIssues.length} major performance improvements available.`
      );
    }

    if (metrics.nestedLoops > 5) {
      recommendations.push(
        `Found ${metrics.nestedLoops} nested loops. Consider using hash maps for O(1) lookups.`
      );
    }

    if (metrics.largeFiles > 10) {
      recommendations.push(
        `${metrics.largeFiles} large files (>300 lines) detected. Consider splitting them into smaller modules.`
      );
    }

    if (metrics.missingMemoization > 0) {
      recommendations.push(
        `Consider adding useMemo/useCallback for expensive computations in ${metrics.missingMemoization} file(s).`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'No significant performance issues detected. Continue following best practices.'
      );
    }

    return recommendations;
  }

  private suggestOptimizations(files: ProjectFile[]): OptimizationSuggestion[] {
    const optimizations: OptimizationSuggestion[] = [];

    // Check for React patterns
    const hasReact = files.some((f) => f.extension.includes('tsx') || f.extension.includes('jsx'));

    if (hasReact) {
      optimizations.push({
        category: 'React',
        title: 'Use React.memo for Pure Components',
        description: 'Wrap components that render the same output for the same props.',
        benefit: 'Prevents unnecessary re-renders, improving overall performance',
        effort: 'low',
        codeExample: 'const MyComponent = React.memo(({ data }) => { ... });',
      });

      optimizations.push({
        category: 'React',
        title: 'Virtualize Long Lists',
        description: 'Use windowing libraries like react-window for long lists.',
        benefit: 'Renders only visible items, dramatically reducing DOM nodes',
        effort: 'medium',
        codeExample: 'import { FixedSizeList } from "react-window";',
      });
    }

    // Check for loops
    const hasLoops = files.some((f) => f.content?.includes('for') && f.content.includes('while'));

    if (hasLoops) {
      optimizations.push({
        category: 'Algorithms',
        title: 'Consider Caching Results',
        description: 'Use memoization to cache expensive loop results.',
        benefit: 'Avoids redundant computations in repeated calls',
        effort: 'medium',
        codeExample: 'const cache = new Map();\nconst cached = cache.get(key) ?? computeExpensive(key);',
      });
    }

    // Check for array operations
    const hasArrayOps = files.some((f) => f.content?.includes('.map') || f.content?.includes('.filter'));

    if (hasArrayOps) {
      optimizations.push({
        category: 'Arrays',
        title: 'Use Lazy Evaluation',
        description: 'Consider generators for processing large arrays.',
        benefit: 'Reduces memory usage by processing one item at a time',
        effort: 'low',
        codeExample: 'function* generator(arr) { for (const item of arr) yield process(item); }',
      });
    }

    // Add general optimizations
    optimizations.push({
      category: 'General',
      title: 'Code Splitting',
      description: 'Split large bundles into smaller chunks loaded on demand.',
      benefit: 'Faster initial load time, especially for large applications',
      effort: 'medium',
      codeExample: 'const LazyComponent = React.lazy(() => import("./HeavyComponent"));',
    });

    optimizations.push({
      category: 'General',
      title: 'Optimize Dependencies',
      description: 'Review and remove unused or heavy dependencies.',
      benefit: 'Reduced bundle size and faster load times',
      effort: 'low',
    });

    return optimizations;
  }

  private calculateScore(metrics: PerformanceMetrics, issues: PerformanceIssue[]): number {
    let score = 100;

    // Deduct for metrics
    if (metrics.largeFiles > 10) score -= 10;
    if (metrics.nestedLoops > 5) score -= 15;
    if (metrics.missingMemoization > 5) score -= 10;

    // Deduct for issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'major':
          score -= 8;
          break;
        case 'minor':
          score -= 2;
          break;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  getPerformanceReport(analysis: PerformanceAnalysis): string {
    const lines: string[] = [];

    lines.push('# Performance Analysis Report\n');
    lines.push(`**Score:** ${analysis.score}/100\n`);
    lines.push('## Metrics\n');
    lines.push(`- Average file size: ${analysis.metrics.averageFileSize} lines`);
    lines.push(`- Large files (>300 lines): ${analysis.metrics.largeFiles}`);
    lines.push(`- Nested loops: ${analysis.metrics.nestedLoops}`);
    lines.push(`- Estimated bundle size: ${analysis.metrics.bundleSizeEstimate}KB\n`);

    lines.push('## Issues\n');
    for (const issue of analysis.issues.slice(0, 10)) {
      lines.push(`### [${issue.severity.toUpperCase()}] ${issue.title}`);
      if (issue.file) lines.push(`**Location:** ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
      lines.push(`**Impact:** ${issue.impact}`);
      lines.push(`**Suggestion:** ${issue.suggestion}\n`);
    }

    lines.push('## Optimization Opportunities\n');
    for (const opt of analysis.optimizations) {
      lines.push(`### ${opt.title}`);
      lines.push(`**Benefit:** ${opt.benefit}`);
      lines.push(`**Effort:** ${opt.effort}`);
      if (opt.codeExample) lines.push(`\`\`\`\n${opt.codeExample}\n\`\`\``);
      lines.push('');
    }

    return lines.join('\n');
  }
}

export default PerformanceAnalyzer.getInstance();
