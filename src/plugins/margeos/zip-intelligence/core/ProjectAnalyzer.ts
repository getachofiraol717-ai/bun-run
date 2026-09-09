// @ts-nocheck
/**
 * Project Analyzer
 * Analyzes uploaded projects and generates insights
 */

import { Project, ProjectFile, ProjectFolder, TechnologyProfile, ArchitectureReport } from '../models/ProjectModel';
import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport, Bug, COMMON_BUG_PATTERNS } from '../models/BugReport';

export interface AnalysisOptions {
  analyzeStructure: boolean;
  analyzeTechnologies: boolean;
  analyzeArchitecture: boolean;
  detectBugs: boolean;
  calculateMetrics: boolean;
}

const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  analyzeStructure: true,
  analyzeTechnologies: true,
  analyzeArchitecture: true,
  detectBugs: true,
  calculateMetrics: true,
};

export class ProjectAnalyzer {
  private static instance: ProjectAnalyzer | null = null;
  private options: AnalysisOptions;

  private constructor() {
    this.options = DEFAULT_ANALYSIS_OPTIONS;
  }

  static getInstance(): ProjectAnalyzer {
    if (!ProjectAnalyzer.instance) {
      ProjectAnalyzer.instance = new ProjectAnalyzer();
    }
    return ProjectAnalyzer.instance;
  }

  setOptions(options: Partial<AnalysisOptions>): void {
    this.options = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };
  }

  async analyze(project: Project): Promise<AnalysisReport> {
    const report: AnalysisReport = {
      id: `analysis-${Date.now()}`,
      projectId: project.id,
      createdAt: new Date(),
      analysisType: 'full',
      summary: {
        title: `${project.name} Analysis`,
        description: '',
        keyFindings: [],
        overallHealth: 'good',
        complexity: 'moderate',
        maintainability: 0,
        testability: 0,
        reusability: 0,
      },
      details: {
        codeQuality: this.analyzeCodeQuality(project),
        structure: this.analyzeProjectStructure(project),
        documentation: this.analyzeDocumentation(project),
        dependencies: this.analyzeDependencies(project),
        security: this.analyzeSecurity(project),
      },
      recommendations: [],
      score: {
        overall: 0,
        codeQuality: 0,
        structure: 0,
        documentation: 0,
        security: 0,
        grade: 'C',
      },
    };

    // Calculate summary
    report.summary.keyFindings = [
      `Total Files: ${project.structure.totalFiles}`,
      `Total Folders: ${project.structure.totalFolders}`,
      `Code Lines: ${project.statistics.codeLines}`,
      `Languages: ${project.technologyProfile.languages.length}`,
      `Frameworks: ${project.technologyProfile.frameworks.length}`,
    ];

    // Calculate overall scores
    report.score = {
      overall: this.calculateOverallScore(report.details),
      codeQuality: report.details.codeQuality.namingConsistency,
      structure: report.details.structure.maxDepth < 5 ? 90 : report.details.structure.maxDepth < 10 ? 75 : 60,
      documentation: report.details.documentation.documentationCoverage,
      security: report.details.security.score,
      grade: this.getGrade(this.calculateOverallScore(report.details)),
    };

    report.summary.maintainability = report.score.overall;
    report.summary.testability = report.details.testing ? report.details.testing.testCoverage || 0 : 0;
    report.summary.reusability = report.details.codeQuality.namingConsistency;
    report.summary.overallHealth = report.score.overall > 80 ? 'excellent' : report.score.overall > 60 ? 'good' : report.score.overall > 40 ? 'fair' : 'poor';

    return report;
  }

  private analyzeCodeQuality(project: Project): AnalysisReport['details']['codeQuality'] {
    let linesOfCode = 0;
    let commentLines = 0;
    let namingIssues = 0;
    const issues: AnalysisReport['details']['codeQuality']['issues'] = [];

    const analyzeFolder = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        if (file.content) {
          const lines = file.content.split('\n');
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*')) {
              commentLines++;
            } else {
              linesOfCode++;
            }
          }

          // Check for naming issues
          if (!this.isValidIdentifier(file.name)) {
            namingIssues++;
            issues.push({
              severity: 'warning',
              type: 'naming',
              message: `File name should use proper naming convention: ${file.name}`,
              file: file.path,
            });
          }
        }
      }

      for (const subfolder of folder.subfolders) {
        analyzeFolder(subfolder);
      }
    };

    analyzeFolder(project.rootFolder);

    const namingConsistency = Math.max(0, 100 - namingIssues * 10);

    return {
      linesOfCode,
      averageFileSize: project.structure.totalSize / (project.structure.totalFiles || 1),
      codeToCommentRatio: commentLines > 0 ? linesOfCode / commentLines : linesOfCode,
      namingConsistency,
      issues,
    };
  }

  private analyzeProjectStructure(project: Project): AnalysisReport['details']['structure'] {
    const avgFilesPerFolder = project.structure.totalFiles / (project.structure.totalFolders || 1);

    return {
      totalFiles: project.structure.totalFiles,
      totalFolders: project.structure.totalFolders,
      maxDepth: project.structure.maxDepth,
      averageFilesPerFolder: avgFilesPerFolder,
      moduleCoupling: this.calculateCoupling(project),
      organization: avgFilesPerFolder < 20 ? 'excellent' : avgFilesPerFolder < 50 ? 'good' : 'fair',
    };
  }

  private analyzeDocumentation(project: Project): AnalysisReport['details']['documentation'] {
    let hasReadme = false;
    let hasDocumentation = false;
    let inlineComments = 0;

    const checkFolder = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        if (file.name.toLowerCase() === 'readme.md' || file.name.toLowerCase() === 'readme.txt') {
          hasReadme = true;
        }
        if (file.name.includes('docs') || file.name.includes('documentation')) {
          hasDocumentation = true;
        }
        if (file.content) {
          inlineComments += (file.content.match(/\/\/|\/\*|#!/g) || []).length;
        }
      }

      for (const subfolder of folder.subfolders) {
        checkFolder(subfolder);
      }
    };

    checkFolder(project.rootFolder);

    const documentationCoverage = hasReadme ? 40 : 0;
    const overallCoverage = documentationCoverage + (hasDocumentation ? 30 : 0) + (inlineComments > 10 ? 30 : inlineComments > 0 ? 15 : 0);

    return {
      hasReadme,
      hasDocumentation,
      inlineComments,
      documentationCoverage: Math.min(overallCoverage, 100),
      issues: [],
    };
  }

  private analyzeDependencies(project: Project): AnalysisReport['details']['dependencies'] {
    const directDeps = project.technologyProfile.libraries.length;
    const transitiveDeps = Math.floor(directDeps * 1.5); // Estimate

    return {
      directDependencies: directDeps,
      transitiveDependencies: transitiveDeps,
      issues: [],
    };
  }

  private analyzeSecurity(project: Project): AnalysisReport['details']['security'] {
    const vulnerabilities: AnalysisReport['details']['security']['vulnerabilities'] = [];
    const sensitiveData: AnalysisReport['details']['security']['sensitiveData'] = [];

    const checkFolder = (folder: ProjectFolder) => {
      for (const file of folder.files) {
        if (file.content) {
          // Check for API keys
          if (file.content.match(/api[_-]?key|apikey/i) && file.content.match(/['"]?[a-zA-Z0-9]{20,}['"]?/)) {
            sensitiveData.push({
              type: 'api-key',
              message: 'Potential API key detected',
              file: file.path,
              suggestion: 'Move secrets to environment variables',
            });
          }

          // Check for hardcoded passwords
          if (file.content.match(/password\s*=\s*['"][^'"]+['"]/i)) {
            sensitiveData.push({
              type: 'password',
              message: 'Hardcoded password detected',
              file: file.path,
              suggestion: 'Use environment variables for credentials',
            });
          }

          // Check for innerHTML usage (XSS)
          if (file.content.includes('innerHTML')) {
            vulnerabilities.push({
              severity: 'medium',
              type: 'XSS',
              message: 'Potential XSS vulnerability with innerHTML',
              file: file.path,
              remediation: 'Use textContent or sanitize HTML',
            });
          }
        }
      }

      for (const subfolder of folder.subfolders) {
        checkFolder(subfolder);
      }
    };

    checkFolder(project.rootFolder);

    const score = Math.max(0, 100 - vulnerabilities.length * 15 - sensitiveData.length * 10);

    return {
      vulnerabilities,
      sensitiveData,
      score,
    };
  }

  private calculateCoupling(project: Project): number {
    // Simplified coupling calculation
    const fileCount = project.structure.totalFiles;
    const folderCount = project.structure.totalFolders;

    if (folderCount === 0) return 100;

    const cohesionRatio = fileCount / folderCount;
    return Math.min(100, Math.max(0, 100 - (cohesionRatio - 5) * 2));
  }

  private calculateOverallScore(details: AnalysisReport['details']): number {
    const weights = {
      codeQuality: 0.3,
      structure: 0.2,
      documentation: 0.15,
      testing: 0.15,
      security: 0.2,
    };

    return Math.round(
      details.codeQuality.namingConsistency * weights.codeQuality +
      (details.structure.organization === 'excellent' ? 90 : details.structure.organization === 'good' ? 75 : 50) * weights.structure +
      details.documentation.documentationCoverage * weights.documentation +
      (details.testing?.testCoverage || 0) * weights.testing +
      details.security.score * weights.security
    );
  }

  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private isValidIdentifier(name: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_-]*(\.[a-zA-Z]+)?$/.test(name);
  }

  detectBugs(project: Project): BugReport {
    const bugs: Bug[] = [];
    let bugId = 1;

    const analyzeFile = (file: ProjectFile) => {
      if (!file.content) return;

      for (const pattern of COMMON_BUG_PATTERNS) {
        if (pattern.pattern.test(file.content)) {
          const matches = file.content.match(pattern.pattern);
          if (matches) {
            bugs.push({
              id: `bug-${bugId++}`,
              severity: pattern.severity,
              category: pattern.category,
              title: pattern.title,
              description: pattern.description,
              file: file.path,
              suggestion: pattern.suggestion,
              educationalExplanation: pattern.educationalExplanation,
              effort: 'medium',
              autoFixable: false,
            });
          }
        }
      }

      // Check for long functions (simulated)
      const functions = file.content.match(/function\s+\w+|def\s+\w+|const\s+\w+\s*=\s*\(/g);
      if (functions && functions.length > 20) {
        bugs.push({
          id: `bug-${bugId++}`,
          severity: 'info',
          category: 'style',
          title: 'High function density',
          description: `This file has ${functions.length} functions which may indicate poor organization`,
          file: file.path,
          suggestion: 'Consider breaking this file into smaller modules',
          effort: 'medium',
        });
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
}

export default ProjectAnalyzer.getInstance();
