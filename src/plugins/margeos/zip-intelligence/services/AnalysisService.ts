// @ts-nocheck
/**
 * Analysis Service
 * Orchestrates project analysis across multiple analyzers
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport } from '../models/BugReport';
import { Documentation } from '../models/Documentation';
import { DependencyGraph } from '../models/DependencyGraph';
import { TechnologyProfile } from '../models/TechnologyProfile';

import FolderStructureAnalyzer from '../analyzers/FolderStructureAnalyzer';
import TechnologyDetector from '../analyzers/TechnologyDetector';
import FrameworkDetector from '../analyzers/FrameworkDetector';
import LanguageDetector from '../analyzers/LanguageDetector';
import DependencyGraphAnalyzer from '../analyzers/DependencyGraphAnalyzer';
import CodeQualityAnalyzer from '../analyzers/CodeQualityAnalyzer';
import SecurityAnalyzer from '../analyzers/SecurityAnalyzer';
import PerformanceAnalyzer from '../analyzers/PerformanceAnalyzer';
import DocumentationAnalyzer from '../analyzers/DocumentationAnalyzer';

export interface AnalysisOptions {
  fullAnalysis?: boolean;
  quickAnalysis?: boolean;
  specificAnalyzers?: string[];
  includeDependencies?: boolean;
  includeSecurity?: boolean;
  includePerformance?: boolean;
}

export interface AnalysisResult {
  project: Project;
  analysis?: AnalysisReport;
  bugReport?: BugReport;
  documentation?: Documentation;
  dependencyGraph?: DependencyGraph;
  technologyProfile?: TechnologyProfile;
  analysisTimestamp: Date;
  duration: number;
}

export interface AnalyzerResult<T> {
  analyzer: string;
  result: T;
  success: boolean;
  errors?: string[];
  warnings?: string[];
}

export class AnalysisService {
  private static instance: AnalysisService | null = null;
  private analyzers: Map<string, unknown>;
  private isProcessing: boolean = false;
  private listeners: Set<(event: AnalysisEvent) => void> = new Set();

  private constructor() {
    this.analyzers = new Map();
    this.initializeAnalyzers();
  }

  static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  private initializeAnalyzers(): void {
    this.analyzers.set('structure', FolderStructureAnalyzer);
    this.analyzers.set('technology', TechnologyDetector);
    this.analyzers.set('framework', FrameworkDetector);
    this.analyzers.set('language', LanguageDetector);
    this.analyzers.set('dependency', DependencyGraphAnalyzer);
    this.analyzers.set('quality', CodeQualityAnalyzer);
    this.analyzers.set('security', SecurityAnalyzer);
    this.analyzers.set('performance', PerformanceAnalyzer);
    this.analyzers.set('documentation', DocumentationAnalyzer);
  }

  subscribe(listener: (event: AnalysisEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: AnalysisEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Analysis listener error:', error);
      }
    }
  }

  async analyze(project: Project, options: AnalysisOptions = {}): Promise<AnalysisResult> {
    if (this.isProcessing) {
      throw new Error('Analysis already in progress');
    }

    this.isProcessing = true;
    const startTime = Date.now();

    const result: AnalysisResult = {
      project,
      analysisTimestamp: new Date(),
      duration: 0,
    };

    try {
      const defaultOptions: AnalysisOptions = {
        fullAnalysis: true,
        includeDependencies: true,
        includeSecurity: true,
        includePerformance: true,
      };

      const opts = { ...defaultOptions, ...options };

      this.emit({ type: 'analysis-started', projectId: project.id });

      // Technology Detection
      this.emit({ type: 'analyzer-started', analyzer: 'technology' });
      result.technologyProfile = this.runTechnologyDetection(project);
      this.emit({ type: 'analyzer-completed', analyzer: 'technology' });

      // Quick analysis if requested
      if (opts.quickAnalysis) {
        result.analysis = this.runQuickAnalysis(project);
        this.emit({ type: 'analysis-completed', projectId: project.id, duration: Date.now() - startTime });
        return result;
      }

      // Full Analysis
      if (opts.fullAnalysis || opts.includeDependencies) {
        this.emit({ type: 'analyzer-started', analyzer: 'dependency' });
        const depResult = this.runDependencyAnalysis(project);
        result.dependencyGraph = depResult.result;
        if (depResult.errors?.length) {
          this.emit({ type: 'analyzer-error', analyzer: 'dependency', errors: depResult.errors });
        }
        this.emit({ type: 'analyzer-completed', analyzer: 'dependency' });
      }

      if (opts.fullAnalysis || opts.includeSecurity) {
        this.emit({ type: 'analyzer-started', analyzer: 'security' });
        const securityResult = this.runSecurityAnalysis(project);
        if (securityResult.result.vulnerabilities.length > 0) {
          this.emit({ type: 'warnings-found', analyzer: 'security', count: securityResult.result.vulnerabilities.length });
        }
        this.emit({ type: 'analyzer-completed', analyzer: 'security' });
      }

      if (opts.fullAnalysis || opts.includePerformance) {
        this.emit({ type: 'analyzer-started', analyzer: 'performance' });
        const perfResult = this.runPerformanceAnalysis(project);
        if (perfResult.result.issues.length > 0) {
          this.emit({ type: 'warnings-found', analyzer: 'performance', count: perfResult.result.issues.length });
        }
        this.emit({ type: 'analyzer-completed', analyzer: 'performance' });
      }

      // Documentation Analysis
      this.emit({ type: 'analyzer-started', analyzer: 'documentation' });
      const docsResult = this.runDocumentationAnalysis(project);
      this.emit({ type: 'analyzer-completed', analyzer: 'documentation' });

      // Bug Detection
      this.emit({ type: 'analyzer-started', analyzer: 'bugs' });
      result.bugReport = this.runBugDetection(project);
      this.emit({ type: 'analyzer-completed', analyzer: 'bugs' });

      // Full Analysis Report
      result.analysis = this.generateAnalysisReport(project, {
        technology: result.technologyProfile,
        dependency: result.dependencyGraph,
        documentation: docsResult.result,
      });

      result.duration = Date.now() - startTime;
      this.emit({ type: 'analysis-completed', projectId: project.id, duration: result.duration });

      return result;
    } catch (error) {
      this.emit({
        type: 'analysis-error',
        projectId: project.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  private runTechnologyDetection(project: Project): TechnologyProfile {
    const detector = this.analyzers.get('technology') as typeof TechnologyDetector;
    const result = detector.detect(project);
    return result.profile;
  }

  private runDependencyAnalysis(project: Project): AnalyzerResult<DependencyGraph> {
    try {
      const analyzer = this.analyzers.get('dependency') as typeof DependencyGraphAnalyzer;
      const result = analyzer.analyze(project);
      return { analyzer: 'dependency', result: result.graph, success: true };
    } catch (error) {
      return {
        analyzer: 'dependency',
        result: { id: '', projectId: project.id, nodes: [], edges: [], metadata: { totalNodes: 0, totalEdges: 0, maxDepth: 0, circularDependencies: 0, analysisDate: new Date() } },
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private runSecurityAnalysis(project: Project): AnalyzerResult<ReturnType<typeof SecurityAnalyzer.prototype.analyze>> {
    try {
      const analyzer = this.analyzers.get('security') as typeof SecurityAnalyzer;
      const result = analyzer.analyze(project);
      return { analyzer: 'security', result, success: true };
    } catch (error) {
      return {
        analyzer: 'security',
        result: { vulnerabilities: [], overallRisk: 'low', riskScore: 0, categories: {}, recommendations: [] },
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private runPerformanceAnalysis(project: Project): AnalyzerResult<ReturnType<typeof PerformanceAnalyzer.prototype.analyze>> {
    try {
      const analyzer = this.analyzers.get('performance') as typeof PerformanceAnalyzer;
      const result = analyzer.analyze(project);
      return { analyzer: 'performance', result, success: true };
    } catch (error) {
      return {
        analyzer: 'performance',
        result: { score: 100, issues: [], metrics: { averageFileSize: 0, largeFiles: 0, nestedLoops: 0, missingMemoization: 0, inefficientArrayOps: 0, heavyDependencies: 0, bundleSizeEstimate: 0 }, recommendations: [], optimizations: [] },
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private runDocumentationAnalysis(project: Project): AnalyzerResult<ReturnType<typeof DocumentationAnalyzer.prototype.analyze>> {
    try {
      const analyzer = this.analyzers.get('documentation') as typeof DocumentationAnalyzer;
      const result = analyzer.analyze(project);
      return { analyzer: 'documentation', result, success: true };
    } catch (error) {
      return {
        analyzer: 'documentation',
        result: { score: 0, hasReadme: false, hasContributing: false, hasLicense: false, hasChangelog: false, coverage: { readmeScore: 0, inlineDocumentation: 0, apiDocumentation: 0, examples: 0, overall: 0 }, quality: { clarity: 0, completeness: 0, accuracy: 0, maintenance: 0 }, missing: [], recommendations: [] },
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private runBugDetection(project: Project): BugReport {
    const securityAnalyzer = this.analyzers.get('security') as typeof SecurityAnalyzer;
    const securityResult = securityAnalyzer.analyze(project);

    const performanceAnalyzer = this.analyzers.get('performance') as typeof PerformanceAnalyzer;
    const performanceResult = performanceAnalyzer.analyze(project);

    const bugs = securityResult.vulnerabilities.map((v) => ({
      id: v.id,
      severity: v.severity as 'critical' | 'major' | 'minor' | 'info',
      category: v.category.toLowerCase() as 'logic' | 'style' | 'security' | 'performance' | 'documentation',
      title: v.title,
      description: v.description,
      file: v.file,
      line: v.line,
      suggestion: v.suggestion,
      educationalExplanation: v.educational,
      effort: v.severity === 'critical' ? 'high' : v.severity === 'high' ? 'medium' : 'low',
      autoFixable: false,
    }));

    return {
      id: `bug-report-${Date.now()}`,
      projectId: project.id,
      createdAt: new Date(),
      bugs,
      statistics: {
        totalBugs: bugs.length,
        criticalBugs: bugs.filter((b) => b.severity === 'critical').length,
        majorBugs: bugs.filter((b) => b.severity === 'major').length,
        minorBugs: bugs.filter((b) => b.severity === 'minor').length,
        infoBugs: bugs.filter((b) => b.severity === 'info').length,
        autoFixableBugs: bugs.filter((b) => b.autoFixable).length,
        bugsPerFile: {},
        bugsPerCategory: {},
      },
      severityBreakdown: {
        critical: bugs.filter((b) => b.severity === 'critical').length,
        major: bugs.filter((b) => b.severity === 'major').length,
        minor: bugs.filter((b) => b.severity === 'minor').length,
        info: bugs.filter((b) => b.severity === 'info').length,
      },
      categoryBreakdown: {},
    };
  }

  private runQuickAnalysis(project: Project): AnalysisReport {
    const structureAnalyzer = this.analyzers.get('structure') as typeof FolderStructureAnalyzer;
    const structure = structureAnalyzer.analyze(project);

    return {
      id: `analysis-${Date.now()}`,
      projectId: project.id,
      createdAt: new Date(),
      summary: {
        overallHealth: structure.structureHealth === 'excellent' ? 'Excellent' : structure.structureHealth === 'good' ? 'Good' : structure.structureHealth === 'fair' ? 'Fair' : 'Needs Improvement',
        complexity: structure.maxDepth > 6 ? 'High' : structure.maxDepth > 4 ? 'Medium' : 'Low',
        maintainability: structure.structureHealth === 'excellent' ? 90 : structure.structureHealth === 'good' ? 75 : structure.structureHealth === 'fair' ? 60 : 40,
        testability: 50,
        keyFindings: structure.recommendations,
      },
      details: {
        structure: {
          totalFiles: structure.totalFiles,
          totalFolders: structure.totalFolders,
          maxDepth: structure.maxDepth,
          recommendations: structure.recommendations,
        },
        codeQuality: { issues: [] },
        documentation: { hasReadme: false, documentationCoverage: 0 },
        dependencies: { total: 0, internal: 0, external: 0 },
        security: { vulnerabilities: [] },
      },
    };
  }

  private generateAnalysisReport(
    project: Project,
    additionalResults: {
      technology?: TechnologyProfile;
      dependency?: DependencyGraph;
      documentation?: ReturnType<DocumentationAnalyzer['analyze']>;
    }
  ): AnalysisReport {
    const structureAnalyzer = this.analyzers.get('structure') as typeof FolderStructureAnalyzer;
    const structure = structureAnalyzer.analyze(project);

    const qualityAnalyzer = this.analyzers.get('quality') as typeof CodeQualityAnalyzer;
    const quality = qualityAnalyzer.analyze(project);

    const documentation = additionalResults.documentation || {
      score: 50,
      hasReadme: false,
      hasContributing: false,
      hasLicense: false,
      hasChangelog: false,
      coverage: { readmeScore: 0, inlineDocumentation: 0, apiDocumentation: 0, examples: 0, overall: 0 },
      quality: { clarity: 0, completeness: 0, accuracy: 0, maintenance: 0 },
      missing: [],
      recommendations: [],
    };

    return {
      id: `analysis-${Date.now()}`,
      projectId: project.id,
      createdAt: new Date(),
      summary: {
        overallHealth: this.calculateOverallHealth(structure, quality, documentation),
        complexity: this.calculateComplexity(structure, additionalResults.technology),
        maintainability: quality.overallScore,
        testability: 50,
        keyFindings: [
          ...structure.recommendations,
          ...quality.recommendations,
          ...documentation.recommendations,
        ],
      },
      details: {
        structure: {
          totalFiles: structure.totalFiles,
          totalFolders: structure.totalFolders,
          maxDepth: structure.maxDepth,
          recommendations: structure.recommendations,
        },
        codeQuality: {
          issues: quality.issues.map((i) => ({
            severity: i.severity,
            message: i.message,
            file: i.file,
            line: i.line,
            category: i.category,
            suggestion: i.suggestion,
          })),
        },
        documentation: {
          hasReadme: documentation.hasReadme,
          documentationCoverage: documentation.coverage.inlineDocumentation,
        },
        dependencies: {
          total: additionalResults.dependency?.metadata.totalNodes || 0,
          internal: additionalResults.dependency?.edges.filter((e) => e.type === 'internal').length || 0,
          external: additionalResults.dependency?.edges.filter((e) => e.type === 'external').length || 0,
        },
        security: { vulnerabilities: [] },
      },
      score: {
        overall: quality.overallScore,
        codeQuality: quality.overallScore,
        documentation: documentation.score,
        maintainability: quality.overallScore,
        grade: this.getGrade(quality.overallScore),
      },
    };
  }

  private calculateOverallHealth(
    structure: ReturnType<typeof FolderStructureAnalyzer['analyze']>,
    quality: ReturnType<typeof CodeQualityAnalyzer['analyze']>,
    documentation: { score: number }
  ): 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement' {
    const avgScore = (quality.overallScore + documentation.score) / 2;

    if (avgScore >= 80 && structure.structureHealth === 'excellent') return 'Excellent';
    if (avgScore >= 60) return 'Good';
    if (avgScore >= 40) return 'Fair';
    return 'Needs Improvement';
  }

  private calculateComplexity(
    structure: ReturnType<typeof FolderStructureAnalyzer['analyze']>,
    technology?: TechnologyProfile
  ): 'Low' | 'Medium' | 'High' {
    if (structure.maxDepth > 6) return 'High';
    if (structure.maxDepth > 4) return 'Medium';

    if (technology?.overallComplexity === 'enterprise') return 'High';
    if (technology?.overallComplexity === 'complex') return 'Medium';

    return 'Low';
  }

  private getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

export interface AnalysisEvent {
  type: 'analysis-started' | 'analysis-completed' | 'analysis-error' | 'analyzer-started' | 'analyzer-completed' | 'analyzer-error' | 'warnings-found';
  projectId?: string;
  analyzer?: string;
  duration?: number;
  error?: string;
  errors?: string[];
  count?: number;
}

export default AnalysisService.getInstance();
