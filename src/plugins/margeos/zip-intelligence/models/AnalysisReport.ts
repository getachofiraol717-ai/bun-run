/**
 * Analysis Report Model
 * Comprehensive analysis results for projects
 */

export interface AnalysisReport {
  id: string;
  projectId: string;
  createdAt: Date;
  analysisType: AnalysisType;
  summary: AnalysisSummary;
  details: AnalysisDetails;
  recommendations: AnalysisRecommendation[];
  score?: AnalysisScore;
}

export type AnalysisType = 'full' | 'quick' | 'security' | 'performance' | 'quality';

export interface AnalysisSummary {
  title: string;
  description: string;
  keyFindings: string[];
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  complexity: 'low' | 'medium' | 'high';
  maintainability: number; // 0-100
  testability: number; // 0-100
  reusability: number; // 0-100
}

export interface AnalysisDetails {
  codeQuality: CodeQualityMetrics;
  structure: StructureMetrics;
  documentation: DocumentationMetrics;
  testing?: TestingMetrics;
  dependencies: DependencyMetrics;
  security: SecurityMetrics;
}

export interface CodeQualityMetrics {
  linesOfCode: number;
  averageFileSize: number;
  cyclomaticComplexity?: number;
  codeToCommentRatio: number;
  namingConsistency: number; // 0-100
  duplication?: number; // percentage
  formatting?: number; // 0-100
  issues: CodeQualityIssue[];
}

export interface CodeQualityIssue {
  severity: 'info' | 'warning' | 'error';
  type: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface StructureMetrics {
  totalFiles: number;
  totalFolders: number;
  maxDepth: number;
  averageFilesPerFolder: number;
  moduleCoupling: number; // 0-100
  cohesion?: number; // 0-100
  organization: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface DocumentationMetrics {
  hasReadme: boolean;
  hasDocumentation: boolean;
  inlineComments: number;
  documentationCoverage: number; // percentage
  apiDocumentation?: number; // percentage
  hasExamples?: boolean;
  hasChangelog?: boolean;
  issues: DocumentationIssue[];
}

export interface DocumentationIssue {
  type: 'missing' | 'incomplete' | 'outdated';
  message: string;
  file?: string;
  suggestion?: string;
}

export interface TestingMetrics {
  hasTests: boolean;
  testCoverage?: number; // percentage
  testFiles: number;
  testTypes: string[];
  coverage?: CoverageDetails;
  issues: TestingIssue[];
}

export interface CoverageDetails {
  lines?: number;
  functions?: number;
  branches?: number;
  files?: number;
}

export interface TestingIssue {
  severity: 'info' | 'warning' | 'error';
  message: string;
  file?: string;
  suggestion?: string;
}

export interface DependencyMetrics {
  directDependencies: number;
  transitiveDependencies: number;
  outdated?: number;
  vulnerable?: number;
  unused?: number;
  circular?: boolean;
  issues: DependencyIssue[];
}

export interface DependencyIssue {
  severity: 'info' | 'warning' | 'error';
  type: 'outdated' | 'vulnerable' | 'unused' | 'circular' | 'missing';
  message: string;
  dependency?: string;
  suggestion?: string;
}

export interface SecurityMetrics {
  vulnerabilities: SecurityVulnerability[];
  sensitiveData: SensitiveDataExposure[];
  authentication?: boolean;
  authorization?: boolean;
  encryption?: boolean;
  secureHeaders?: boolean;
  score: number; // 0-100
}

export interface SecurityVulnerability {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  file?: string;
  line?: number;
  cwe?: string;
  remediation?: string;
}

export interface SensitiveDataExposure {
  type: 'api-key' | 'password' | 'token' | 'secret' | 'credential' | 'pii';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface AnalysisRecommendation {
  id: string;
  category: 'code' | 'structure' | 'documentation' | 'testing' | 'security' | 'performance' | 'maintainability';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  rationale: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  files?: string[];
  codeExample?: string;
}

export interface AnalysisScore {
  overall: number; // 0-100
  codeQuality: number;
  structure: number;
  documentation: number;
  testing?: number;
  security: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

// Helper functions
export function createAnalysisReport(
  id: string,
  projectId: string,
  analysisType: AnalysisType
): AnalysisReport {
  return {
    id,
    projectId,
    createdAt: new Date(),
    analysisType,
    summary: {
      title: '',
      description: '',
      keyFindings: [],
      overallHealth: 'fair',
      complexity: 'medium',
      maintainability: 50,
      testability: 50,
      reusability: 50,
    },
    details: {
      codeQuality: {
        linesOfCode: 0,
        averageFileSize: 0,
        codeToCommentRatio: 0,
        namingConsistency: 0,
        issues: [],
      },
      structure: {
        totalFiles: 0,
        totalFolders: 0,
        maxDepth: 0,
        averageFilesPerFolder: 0,
        moduleCoupling: 0,
        organization: 'fair',
      },
      documentation: {
        hasReadme: false,
        hasDocumentation: false,
        inlineComments: 0,
        documentationCoverage: 0,
        issues: [],
      },
      dependencies: {
        directDependencies: 0,
        transitiveDependencies: 0,
        issues: [],
      },
      security: {
        vulnerabilities: [],
        sensitiveData: [],
        score: 100,
      },
    },
    recommendations: [],
  };
}

export function calculateOverallScore(report: AnalysisReport): number {
  const weights = {
    codeQuality: 0.3,
    structure: 0.2,
    documentation: 0.15,
    testing: report.details.testing ? 0.15 : 0,
    security: 0.2,
  };

  let total = 0;
  let totalWeight = 0;

  total += report.details.codeQuality.namingConsistency * weights.codeQuality;
  totalWeight += weights.codeQuality;

  total += (report.details.structure.organization === 'excellent' ? 100
    : report.details.structure.organization === 'good' ? 75
    : report.details.structure.organization === 'fair' ? 50 : 25) * weights.structure;
  totalWeight += weights.structure;

  total += report.details.documentation.documentationCoverage * weights.documentation;
  totalWeight += weights.documentation;

  if (report.details.testing) {
    total += (report.details.testing.testCoverage || 0) * weights.testing;
    totalWeight += weights.testing;
  }

  total += report.details.security.score * weights.security;
  totalWeight += weights.security;

  return totalWeight > 0 ? Math.round(total / totalWeight) : 0;
}

export function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default {
  createAnalysisReport,
  calculateOverallScore,
  getGrade,
};
