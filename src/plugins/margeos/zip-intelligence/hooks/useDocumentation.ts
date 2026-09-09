// @ts-nocheck
/**
 * useDocumentation Hook
 * React hook for documentation generation and management
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Project } from '../models/ProjectModel';
import { Documentation, DocumentationSection } from '../models/Documentation';
import DocumentationService, { DocumentationOptions } from '../services/DocumentationService';
import DocumentationAnalyzer from '../analyzers/DocumentationAnalyzer';

export interface UseDocumentationReturn {
  // State
  documentation: Documentation | null;
  markdown: string;
  html: string;
  analysis: {
    score: number;
    hasReadme: boolean;
    hasContributing: boolean;
    hasLicense: boolean;
    hasChangelog: boolean;
    coverage: {
      readmeScore: number;
      inlineDocumentation: number;
      apiDocumentation: number;
      examples: number;
      overall: number;
    };
    missing: string[];
    recommendations: string[];
  } | null;
  isGenerating: boolean;
  error: string | null;
  selectedSection: string | null;

  // Actions
  generateDocumentation: (project: Project, options?: DocumentationOptions) => Promise<void>;
  analyzeDocumentation: (project: Project) => Promise<void>;
  selectSection: (sectionId: string | null) => void;
  searchDocumentation: (query: string) => DocumentationSection[];
  exportDocumentation: (format: 'markdown' | 'html' | 'json') => string;
  regenerateSection: (sectionId: string) => void;
  updateMetadata: (metadata: Partial<Documentation['metadata']>) => void;

  // Computed
  tableOfContents: Array<{ id: string; title: string; level: number }>;
  currentSection: DocumentationSection | null;
  readmeContent: string;
}

export function useDocumentation(): UseDocumentationReturn {
  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');
  const [analysis, setAnalysis] = useState<UseDocumentationReturn['analysis']>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const docService = useMemo(() => DocumentationService.getInstance(), []);
  const docAnalyzer = useMemo(() => DocumentationAnalyzer.getInstance(), []);

  const generateDocumentation = useCallback(async (project: Project, options?: DocumentationOptions) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = docService.generate(project, {
        includeOverview: true,
        includeArchitecture: true,
        includeAPI: true,
        includeExamples: true,
        includeSetup: true,
        includeContributing: false,
        language: 'en',
        ...options,
      });

      setDocumentation(result.documentation);
      setMarkdown(result.markdown || '');
      setHtml(result.html || '');

      // Also generate analysis
      const docAnalysis = docAnalyzer.analyze(project);
      setAnalysis({
        score: docAnalysis.score,
        hasReadme: docAnalysis.hasReadme,
        hasContributing: docAnalysis.hasContributing,
        hasLicense: docAnalysis.hasLicense,
        hasChangelog: docAnalysis.hasChangelog,
        coverage: docAnalysis.coverage,
        missing: docAnalysis.missing,
        recommendations: docAnalysis.recommendations,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate documentation');
    } finally {
      setIsGenerating(false);
    }
  }, [docService, docAnalyzer]);

  const analyzeDocumentation = useCallback(async (project: Project) => {
    try {
      const docAnalysis = docAnalyzer.analyze(project);
      setAnalysis({
        score: docAnalysis.score,
        hasReadme: docAnalysis.hasReadme,
        hasContributing: docAnalysis.hasContributing,
        hasLicense: docAnalysis.hasLicense,
        hasChangelog: docAnalysis.hasChangelog,
        coverage: docAnalysis.coverage,
        missing: docAnalysis.missing,
        recommendations: docAnalysis.recommendations,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze documentation');
    }
  }, [docAnalyzer]);

  const selectSection = useCallback((sectionId: string | null) => {
    setSelectedSection(sectionId);
  }, []);

  const searchDocumentation = useCallback((query: string): DocumentationSection[] => {
    if (!documentation) return [];
    return docService.searchDocumentation(documentation, query);
  }, [documentation, docService]);

  const exportDocumentation = useCallback((format: 'markdown' | 'html' | 'json'): string => {
    if (!documentation) return '';

    switch (format) {
      case 'markdown':
        return markdown;
      case 'html':
        return html;
      case 'json':
        return JSON.stringify(documentation, null, 2);
      default:
        return markdown;
    }
  }, [documentation, markdown, html, docService]);

  const regenerateSection = useCallback((sectionId: string) => {
    // In a full implementation, this would regenerate specific sections
    console.log('Regenerating section:', sectionId);
  }, []);

  const updateMetadata = useCallback((metadata: Partial<Documentation['metadata']>) => {
    if (!documentation) return;

    setDocumentation({
      ...documentation,
      metadata: {
        ...documentation.metadata,
        ...metadata,
      },
    });
  }, [documentation]);

  // Computed values
  const tableOfContents = useMemo(() => {
    if (!documentation) return [];
    return docService.getTableOfContents(documentation);
  }, [documentation, docService]);

  const currentSection = useMemo(() => {
    if (!documentation || !selectedSection) return null;
    return docService.getSection(documentation, selectedSection);
  }, [documentation, selectedSection, docService]);

  const readmeContent = useMemo(() => {
    if (!documentation) return '';
    return docService.exportToFile(documentation, 'markdown');
  }, [documentation, docService]);

  return {
    documentation,
    markdown,
    html,
    analysis,
    isGenerating,
    error,
    selectedSection,
    generateDocumentation,
    analyzeDocumentation,
    selectSection,
    searchDocumentation,
    exportDocumentation,
    regenerateSection,
    updateMetadata,
    tableOfContents,
    currentSection,
    readmeContent,
  };
}

export default useDocumentation;
