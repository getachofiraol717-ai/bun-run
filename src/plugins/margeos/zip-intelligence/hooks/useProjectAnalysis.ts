// @ts-nocheck
/**
 * useProjectAnalysis Hook
 * React hook for project analysis state and operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Project } from '../models/ProjectModel';
import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport } from '../models/BugReport';
import { Documentation } from '../models/Documentation';
import AnalysisService, { AnalysisEvent, AnalysisResult } from '../services/AnalysisService';
import ArchiveService from '../services/ArchiveService';
import ProjectStorageService from '../services/ProjectStorageService';

export interface UseProjectAnalysisReturn {
  // State
  project: Project | null;
  analysis: AnalysisReport | null;
  bugReport: BugReport | null;
  documentation: Documentation | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  progress: number;
  currentPhase: string;

  // Operations
  uploadProject: (file: File) => Promise<Project | null>;
  analyzeProject: (project: Project, options?: { fullAnalysis?: boolean }) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  clearProject: () => void;
  refreshAnalysis: () => Promise<void>;

  // Analysis History
  analysisHistory: AnalysisResult[];
}

export function useProjectAnalysis(): UseProjectAnalysisReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [bugReport, setBugReport] = useState<BugReport | null>(null);
  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);

  const analysisService = useRef(AnalysisService.getInstance());
  const archiveService = useRef(ArchiveService.getInstance());
  const storageService = useRef(ProjectStorageService.getInstance());

  // Subscribe to analysis events
  useEffect(() => {
    const unsubscribe = analysisService.current.subscribe((event: AnalysisEvent) => {
      switch (event.type) {
        case 'analysis-started':
          setIsAnalyzing(true);
          setProgress(0);
          setCurrentPhase('Starting analysis...');
          break;
        case 'analyzer-started':
          setCurrentPhase(`Analyzing ${event.analyzer}...`);
          setProgress((prev) => Math.min(prev + 10, 90));
          break;
        case 'analyzer-completed':
          setProgress((prev) => Math.min(prev + 10, 95));
          break;
        case 'warnings-found':
          console.warn(`Analysis warning: ${event.count} ${event.analyzer} issues found`);
          break;
        case 'analysis-completed':
          setIsAnalyzing(false);
          setProgress(100);
          setCurrentPhase('Analysis complete');
          break;
        case 'analysis-error':
          setError(event.error || 'Analysis failed');
          setIsAnalyzing(false);
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load saved analysis results when project changes
  useEffect(() => {
    if (project) {
      const savedResults = storageService.current.getAnalysisResults(project.id);
      if (savedResults) {
        if (savedResults.analysis) setAnalysis(savedResults.analysis);
        if (savedResults.bugReport) setBugReport(savedResults.bugReport);
        if (savedResults.documentation) setDocumentation(savedResults.documentation);
      }
    }
  }, [project]);

  const uploadProject = useCallback(async (file: File): Promise<Project | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Extract archive
      const extraction = await archiveService.current.extractFromFile(file);

      if (!extraction.success || extraction.files.length === 0) {
        throw new Error(extraction.errors?.[0] || 'Failed to extract archive');
      }

      // Create project from extracted files
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: file.name.replace(/\.(zip|tar|tar\.gz)$/i, ''),
        description: '',
        uploadedAt: new Date(),
        lastAnalyzed: undefined,
        rootFolder: extraction.rootFolder,
        structure: {
          totalFiles: extraction.totalFiles,
          totalFolders: extraction.rootFolder.folderCount,
          maxDepth: calculateMaxDepth(extraction.rootFolder),
          fileTypeDistribution: getFileTypeDistribution(extraction.files),
        },
        statistics: {
          totalFiles: extraction.totalFiles,
          totalFolders: extraction.rootFolder.folderCount,
          totalLines: extraction.files.reduce((sum, f) => sum + f.lines, 0),
          codeLines: extraction.files.reduce((sum, f) => sum + f.lines, 0),
          commentLines: 0,
          blankLines: 0,
          totalSize: extraction.totalSize,
        },
        technologyProfile: {
          languages: [],
          frameworks: [],
          libraries: [],
          buildTools: [],
          overallComplexity: 'moderate',
          detectedFeatures: [],
        },
        architecture: {
          pattern: { name: 'Unknown', description: '' },
          layers: [],
          components: [],
          relationships: [],
        },
        metadata: {
          version: '1.0.0',
          author: '',
          license: '',
          repository: '',
        },
      };

      // Save project
      storageService.current.saveProject(newProject);
      setProject(newProject);

      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeProject = useCallback(async (proj: Project, options?: { fullAnalysis?: boolean }) => {
    setIsAnalyzing(true);
    setError(null);
    setCurrentPhase('Analyzing project...');

    try {
      const result = await analysisService.current.analyze(proj, {
        fullAnalysis: options?.fullAnalysis ?? true,
        includeSecurity: true,
        includePerformance: true,
      });

      setProject(result.project);
      setAnalysis(result.analysis || null);
      setBugReport(result.bugReport || null);

      // Save analysis results
      storageService.current.saveAnalysisResults(proj.id, {
        analysis: result.analysis,
        bugReport: result.bugReport,
        documentation: result.documentation,
        dependencyGraph: result.dependencyGraph,
      });

      // Update history
      setAnalysisHistory((prev) => [result, ...prev.slice(0, 9)]);

      // Update project with analysis timestamp
      const updatedProject = { ...proj, lastAnalyzed: new Date() };
      storageService.current.saveProject(updatedProject);
      setProject(updatedProject);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedProject = storageService.current.getProject(projectId);

      if (!loadedProject) {
        throw new Error('Project not found');
      }

      setProject(loadedProject);

      // Load saved analysis
      const savedResults = storageService.current.getAnalysisResults(projectId);
      if (savedResults) {
        setAnalysis(savedResults.analysis || null);
        setBugReport(savedResults.bugReport || null);
        setDocumentation(savedResults.documentation || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearProject = useCallback(() => {
    setProject(null);
    setAnalysis(null);
    setBugReport(null);
    setDocumentation(null);
    setError(null);
    setProgress(0);
    setCurrentPhase('');
  }, []);

  const refreshAnalysis = useCallback(async () => {
    if (project) {
      await analyzeProject(project, { fullAnalysis: true });
    }
  }, [project, analyzeProject]);

  return {
    project,
    analysis,
    bugReport,
    documentation,
    isLoading,
    isAnalyzing,
    error,
    progress,
    currentPhase,
    uploadProject,
    analyzeProject,
    loadProject,
    clearProject,
    refreshAnalysis,
    analysisHistory,
  };
}

// Helper functions
function calculateMaxDepth(folder: { subfolders: unknown[] }, depth: number = 0): number {
  if (!folder.subfolders || folder.subfolders.length === 0) {
    return depth;
  }

  return Math.max(
    ...folder.subfolders.map((subfolder) =>
      calculateMaxDepth(subfolder as { subfolders: unknown[] }, depth + 1)
    )
  );
}

function getFileTypeDistribution(files: { extension: string }[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const file of files) {
    const ext = file.extension.toLowerCase() || 'no-extension';
    distribution[ext] = (distribution[ext] || 0) + 1;
  }

  return distribution;
}

export default useProjectAnalysis;
