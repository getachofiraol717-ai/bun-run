// @ts-nocheck
/**
 * ZIP / Project Intelligence Engine for MargeOS in Knowledge22vv
 * Entry point exporting all core engines, analyzers, services, models, hooks, stores, utils, and interfaces.
 */

// Core
export * from './core/ZipIntelligenceEngine';
export { default as zipIntelligenceEngine } from './core/ZipIntelligenceEngine';
export * from './core/ArchiveExtractor';
export { default as archiveExtractor } from './core/ArchiveExtractor';
export * from './core/ProjectAnalyzer';
export { default as projectAnalyzer } from './core/ProjectAnalyzer';
export * from './core/ArchitectureAnalyzer';
export { default as architectureAnalyzer } from './core/ArchitectureAnalyzer';
export * from './core/DependencyAnalyzer';
export { default as dependencyAnalyzer } from './core/DependencyAnalyzer';
export * from './core/DocumentationGenerator';
export { default as documentationGenerator } from './core/DocumentationGenerator';
export * from './core/CodebaseExplainer';
export { default as codebaseExplainer } from './core/CodebaseExplainer';
export * from './core/BugAnalysisEngine';
export { default as bugAnalysisEngine } from './core/BugAnalysisEngine';
export * from './core/ImprovementEngine';
export { default as improvementEngine } from './core/ImprovementEngine';
export * from './core/ProjectController';
export { default as projectController } from './core/ProjectController';

// Analyzers
export * from './analyzers/FolderStructureAnalyzer';
export { default as folderStructureAnalyzer } from './analyzers/FolderStructureAnalyzer';
export * from './analyzers/TechnologyDetector';
export { default as technologyDetector } from './analyzers/TechnologyDetector';
export * from './analyzers/FrameworkDetector';
export { default as frameworkDetector } from './analyzers/FrameworkDetector';
export * from './analyzers/LanguageDetector';
export { default as languageDetector } from './analyzers/LanguageDetector';
export * from './analyzers/DependencyGraphAnalyzer';
export { default as dependencyGraphAnalyzer } from './analyzers/DependencyGraphAnalyzer';
export * from './analyzers/CodeQualityAnalyzer';
export { default as codeQualityAnalyzer } from './analyzers/CodeQualityAnalyzer';
export * from './analyzers/SecurityAnalyzer';
export { default as securityAnalyzer } from './analyzers/SecurityAnalyzer';
export * from './analyzers/PerformanceAnalyzer';
export { default as performanceAnalyzer } from './analyzers/PerformanceAnalyzer';
export * from './analyzers/DocumentationAnalyzer';
export { default as documentationAnalyzer } from './analyzers/DocumentationAnalyzer';

// Services
export * from './services/ArchiveService';
export { default as archiveService } from './services/ArchiveService';
export * from './services/AnalysisService';
export { default as analysisService } from './services/AnalysisService';
export * from './services/DocumentationService';
export { default as documentationService } from './services/DocumentationService';
export * from './services/ExplanationService';
export { default as explanationService } from './services/ExplanationService';
export * from './services/ProjectStorageService';
export { default as projectStorageService } from './services/ProjectStorageService';
export * from './services/ProjectSearchService';
export { default as projectSearchService } from './services/ProjectSearchService';

// Models
export * from './models/ProjectModel';
export * from './models/ArchitectureReport';
export * from './models/AnalysisReport';
export * from './models/BugReport';
export * from './models/Documentation';
export * from './models/DependencyGraph';
export * from './models/TechnologyProfile';

// Hooks
export * from './hooks/useProjectAnalysis';
export * from './hooks/useArchitecture';
export * from './hooks/useDocumentation';
export * from './hooks/useBugReports';
export * from './hooks/useProjectExplorer';

// Store
export * from './store/zipIntelligenceStore';
export { default as zipIntelligenceStore } from './store/zipIntelligenceStore';

// Components
export * from './components/ZipCompressionPanel';

// Utils
export * from './utils/archiveUtils';
export * from './utils/mergeVerificationUtils';
export * from './utils/analysisUtils';
export * from './utils/documentationUtils';
export * from './utils/dependencyUtils';
export * from './utils/projectUtils';
export * from './utils/redactSecrets';

// Interfaces
export * from './interfaces/ProjectAnalyzer';
export * from './interfaces/DocumentationProvider';
export * from './interfaces/ArchitectureProvider';
