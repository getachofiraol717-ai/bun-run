// @ts-nocheck
/**
 * Documentation Service
 * Generates and manages project documentation
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import { Documentation, DocumentationSection } from '../models/Documentation';

import DocumentationGenerator from '../core/DocumentationGenerator';
import DocumentationAnalyzer from '../analyzers/DocumentationAnalyzer';

export interface DocumentationOptions {
  includeOverview?: boolean;
  includeArchitecture?: boolean;
  includeAPI?: boolean;
  includeExamples?: boolean;
  includeSetup?: boolean;
  includeContributing?: boolean;
  language?: 'en' | 'zh' | 'es' | 'ja';
  format?: 'markdown' | 'html' | 'json';
}

export interface DocumentationResult {
  documentation: Documentation;
  markdown?: string;
  html?: string;
  exportReady: boolean;
}

export class DocumentationService {
  private static instance: DocumentationService | null = null;
  private generator: DocumentationGenerator;
  private analyzer: DocumentationAnalyzer;

  private constructor() {
    this.generator = DocumentationGenerator.getInstance();
    this.analyzer = DocumentationAnalyzer.getInstance();
  }

  static getInstance(): DocumentationService {
    if (!DocumentationService.instance) {
      DocumentationService.instance = new DocumentationService();
    }
    return DocumentationService.instance;
  }

  generate(project: Project, options: DocumentationOptions = {}): DocumentationResult {
    // Set generator options
    this.generator.setOptions({
      includeOverview: options.includeOverview ?? true,
      includeArchitecture: options.includeArchitecture ?? true,
      includeAPI: options.includeAPI ?? true,
      includeExamples: options.includeExamples ?? true,
      includeSetup: options.includeSetup ?? true,
      includeContributing: options.includeContributing ?? false,
    });

    // Generate documentation
    const documentation = this.generator.generate(project);

    // Generate format-specific output
    let markdown: string | undefined;
    let html: string | undefined;

    switch (options.format) {
      case 'markdown':
        markdown = this.generator.generateMarkdown(documentation);
        break;
      case 'html':
        html = this.generator.generateHTML(documentation);
        break;
      default:
        markdown = this.generator.generateMarkdown(documentation);
        html = this.generator.generateHTML(documentation);
    }

    return {
      documentation,
      markdown,
      html,
      exportReady: true,
    };
  }

  analyze(project: Project): ReturnType<DocumentationAnalyzer['analyze']> {
    return this.analyzer.analyze(project);
  }

  generateReadme(project: Project): string {
    return this.analyzer.generateDocumentationTemplate(project);
  }

  getTableOfContents(documentation: Documentation): Array<{ id: string; title: string; level: number }> {
    return documentation.sections.map((section) => ({
      id: section.id,
      title: section.title,
      level: section.level,
    }));
  }

  getSection(documentation: Documentation, sectionId: string): DocumentationSection | null {
    return documentation.sections.find((s) => s.id === sectionId) || null;
  }

  searchDocumentation(documentation: Documentation, query: string): DocumentationSection[] {
    const lowerQuery = query.toLowerCase();

    return documentation.sections.filter((section) => {
      return (
        section.title.toLowerCase().includes(lowerQuery) ||
        section.content.toLowerCase().includes(lowerQuery)
      );
    });
  }

  mergeDocumentation(docs: Documentation[]): Documentation {
    const mergedSections: DocumentationSection[] = [];
    let order = 0;

    // Merge sections in order
    for (const doc of docs) {
      for (const section of doc.sections) {
        mergedSections.push({
          ...section,
          order: order++,
        });
      }
    }

    return {
      id: `merged-${Date.now()}`,
      projectId: docs[0]?.projectId || '',
      createdAt: new Date(),
      sections: mergedSections,
      metadata: docs[0]?.metadata || {
        projectName: '',
        projectDescription: '',
        version: '1.0.0',
        author: '',
        license: '',
        repository: '',
        generatedAt: new Date(),
        language: 'en',
        tags: [],
      },
      files: docs.flatMap((d) => d.files),
      accessibility: docs[0]?.accessibility || {
        compatible: true,
        screenReaderFriendly: true,
        keyboardNavigable: true,
        highContrastCompatible: true,
        arLabelsPresent: false,
        recommendations: [],
      },
    };
  }

  exportToFile(documentation: Documentation, format: 'markdown' | 'html' | 'json'): string {
    switch (format) {
      case 'markdown':
        return this.generator.generateMarkdown(documentation);
      case 'html':
        return this.generator.generateHTML(documentation);
      case 'json':
        return JSON.stringify(documentation, null, 2);
      default:
        return this.generator.generateMarkdown(documentation);
    }
  }

  getFileDocumentation(documentation: Documentation): Array<{
    path: string;
    name: string;
    summary: string;
    purpose: string;
  }> {
    return documentation.files.map((file) => ({
      path: file.path,
      name: file.name,
      summary: file.summary,
      purpose: file.purpose,
    }));
  }

  validateDocumentation(documentation: Documentation): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required sections
    const requiredSections = ['overview', 'installation', 'usage'];
    for (const required of requiredSections) {
      if (!documentation.sections.some((s) => s.id === required)) {
        warnings.push(`Missing recommended section: ${required}`);
      }
    }

    // Check section order
    let lastOrder = -1;
    for (const section of documentation.sections) {
      if (section.order <= lastOrder) {
        errors.push(`Section ordering issue: ${section.title}`);
      }
      lastOrder = section.order;
    }

    // Check for empty content
    for (const section of documentation.sections) {
      if (!section.content || section.content.trim().length < 10) {
        warnings.push(`Section may have insufficient content: ${section.title}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export default DocumentationService.getInstance();
