// @ts-nocheck
/**
 * Project Controller
 * Main controller coordinating all ZIP Intelligence components
 */

import ZipIntelligenceEngine from './ZipIntelligenceEngine';
import ArchiveExtractor from './ArchiveExtractor';
import ProjectAnalyzer from './ProjectAnalyzer';
import ArchitectureAnalyzer from './ArchitectureAnalyzer';
import DependencyAnalyzer from './DependencyAnalyzer';
import DocumentationGenerator from './DocumentationGenerator';
import CodebaseExplainer from './CodebaseExplainer';
import BugAnalysisEngine from './BugAnalysisEngine';
import ImprovementEngine from './ImprovementEngine';
import { Project } from '../models/ProjectModel';
import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport } from '../models/BugReport';
import { Documentation } from '../models/Documentation';
import { DependencyGraph } from '../models/DependencyGraph';

export interface AnalysisResult {
  project: Project;
  analysis?: AnalysisReport;
  bugReport?: BugReport;
  documentation?: Documentation;
  dependencyGraph?: DependencyGraph;
  improvements?: ImprovementEngine['generateImprovements'] extends (project: Project, analysis?: AnalysisReport, bugReport?: BugReport) => infer R ? R : never;
}

export class ProjectController {
  private static instance: ProjectController | null = null;
  private engine: ZipIntelligenceEngine;
  private extractor: ArchiveExtractor;
  private analyzer: ProjectAnalyzer;
  private architectureAnalyzer: ArchitectureAnalyzer;
  private dependencyAnalyzer: DependencyAnalyzer;
  private documentationGenerator: DocumentationGenerator;
  private codebaseExplainer: CodebaseExplainer;
  private bugAnalysisEngine: BugAnalysisEngine;
  private improvementEngine: ImprovementEngine;
  private listeners: Set<(event: ControllerEvent) => void> = new Set();

  private constructor() {
    this.engine = ZipIntelligenceEngine.getInstance();
    this.extractor = ArchiveExtractor.getInstance();
    this.analyzer = ProjectAnalyzer.getInstance();
    this.architectureAnalyzer = ArchitectureAnalyzer.getInstance();
    this.dependencyAnalyzer = DependencyAnalyzer.getInstance();
    this.documentationGenerator = DocumentationGenerator.getInstance();
    this.codebaseExplainer = CodebaseExplainer.getInstance();
    this.bugAnalysisEngine = BugAnalysisEngine.getInstance();
    this.improvementEngine = ImprovementEngine.getInstance();
  }

  static getInstance(): ProjectController {
    if (!ProjectController.instance) {
      ProjectController.instance = new ProjectController();
    }
    return ProjectController.instance;
  }

  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  subscribe(listener: (event: ControllerEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: ControllerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Controller event error:', error);
      }
    }
  }

  async uploadProject(file: File): Promise<Project | null> {
    this.emit({ type: 'upload-started', fileName: file.name });

    try {
      // Extract archive
      this.emit({ type: 'extracting', fileName: file.name });
      const extraction = await this.extractor.extractFromFile(file);

      if (!extraction.success || extraction.files.length === 0) {
        this.emit({ type: 'error', message: 'Failed to extract archive' });
        return null;
      }

      // Process project
      this.emit({ type: 'processing', fileName: file.name });
      const project = await this.engine.processArchive(
        await file.arrayBuffer(),
        file.name
      );

      if (project) {
        this.emit({ type: 'upload-completed', projectId: project.id });
      } else {
        this.emit({ type: 'error', message: 'Failed to process project' });
      }

      return project;
    } catch (error) {
      this.emit({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  async analyzeProject(projectId: string, options?: {
    fullAnalysis?: boolean;
    bugs?: boolean;
    architecture?: boolean;
    documentation?: boolean;
  }): Promise<AnalysisResult | null> {
    const project = this.engine.getProject(projectId);
    if (!project) {
      this.emit({ type: 'error', message: 'Project not found' });
      return null;
    }

    const result: AnalysisResult = { project };
    const opts = { fullAnalysis: true, bugs: true, architecture: true, documentation: true, ...options };

    try {
      // Set context for codebase explainer
      this.codebaseExplainer.setContext({
        project,
        files: this.flattenFiles(project.rootFolder),
      });

      // Run analysis
      if (opts.fullAnalysis) {
        this.emit({ type: 'analyzing', projectId, phase: 'code-quality' });
        result.analysis = await this.analyzer.analyze(project);
      }

      // Bug analysis
      if (opts.bugs) {
        this.emit({ type: 'analyzing', projectId, phase: 'bugs' });
        result.bugReport = this.analyzer.detectBugs(project);
      }

      // Architecture analysis
      if (opts.architecture) {
        this.emit({ type: 'analyzing', projectId, phase: 'architecture' });
        result.dependencyGraph = this.dependencyAnalyzer.analyze(project);
      }

      // Documentation
      if (opts.documentation) {
        this.emit({ type: 'analyzing', projectId, phase: 'documentation' });
        result.documentation = this.documentationGenerator.generate(project);
      }

      // Generate improvements
      this.emit({ type: 'analyzing', projectId, phase: 'improvements' });
      result.improvements = this.improvementEngine.generateImprovements(
        project,
        result.analysis,
        result.bugReport
      );

      this.emit({ type: 'analysis-completed', projectId });
    } catch (error) {
      this.emit({
        type: 'error',
        message: error instanceof Error ? error.message : 'Analysis failed',
      });
    }

    return result;
  }

  async askQuestion(projectId: string, question: string): Promise<CodebaseExplainer['explain'] extends (q: string) => infer R ? R : never> {
    const project = this.engine.getProject(projectId);
    if (!project) {
      return {
        question,
        answer: 'Project not found',
        relatedFiles: [],
        codeReferences: [],
        confidence: 0,
        educational: false,
      };
    }

    // Update context
    this.codebaseExplainer.setContext({
      project,
      files: this.flattenFiles(project.rootFolder),
    });

    return this.codebaseExplainer.explain(question);
  }

  generateReport(projectId: string): {
    analysis?: string;
    bugs?: string;
    documentation?: string;
    improvements?: string;
  } {
    const project = this.engine.getProject(projectId);
    if (!project) {
      return {};
    }

    const result: ReturnType<ProjectController['generateReport']> = {};

    // Generate analysis report
    const analysis = this.analyzer.analyze(project);
    result.analysis = this.formatAnalysisReport(analysis);

    // Generate bug report
    const bugs = this.analyzer.detectBugs(project);
    result.bugs = this.bugAnalysisEngine.generateReport(bugs);

    // Generate documentation
    const docs = this.documentationGenerator.generate(project);
    result.documentation = this.documentationGenerator.generateMarkdown(docs);

    // Generate improvements
    const improvements = this.improvementEngine.generateImprovements(project, analysis, bugs);
    result.improvements = this.improvementEngine.generateMarkdownReport(improvements);

    return result;
  }

  private flattenFiles(folder: ProjectFolder): ProjectFile[] {
    const files: ProjectFile[] = [...folder.files];

    for (const subfolder of folder.subfolders) {
      files.push(...this.flattenFiles(subfolder));
    }

    return files;
  }

  private formatAnalysisReport(analysis: AnalysisReport): string {
    return [
      `# Analysis Report`,
      ``,
      `**Project Health:** ${analysis.summary.overallHealth}`,
      `**Complexity:** ${analysis.summary.complexity}`,
      `**Maintainability:** ${analysis.summary.maintainability}/100`,
      `**Testability:** ${analysis.summary.testability}/100`,
      ``,
      `## Key Findings`,
      ...analysis.summary.keyFindings.map((f) => `- ${f}`),
      ``,
      `## Score: ${analysis.score?.overall || 0}/100 (Grade ${analysis.score?.grade || 'N/A'})`,
    ].join('\n');
  }

  getProject(projectId: string): Project | undefined {
    return this.engine.getProject(projectId);
  }

  getAllProjects(): Project[] {
    return this.engine.getAllProjects();
  }

  deleteProject(projectId: string): boolean {
    return this.engine.deleteProject(projectId);
  }
}

export interface ControllerEvent {
  type: string;
  fileName?: string;
  projectId?: string;
  phase?: string;
  message?: string;
}

export default ProjectController.getInstance();
