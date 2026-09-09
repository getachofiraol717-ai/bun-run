/**
 * Project Search Service
 * Provides search functionality across project files
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  regex?: boolean;
  includeContent?: boolean;
  fileTypes?: string[];
  excludePatterns?: string[];
  maxResults?: number;
}

export interface SearchResult {
  file: ProjectFile;
  matches: SearchMatch[];
  relevance: number;
}

export interface SearchMatch {
  line: number;
  content: string;
  index: number;
  length: number;
  context: string[];
}

export interface SearchSummary {
  totalFiles: number;
  totalMatches: number;
  filesWithMatches: number;
  searchTime: number;
  results: SearchResult[];
}

export interface SearchFilter {
  name?: string;
  type?: 'file' | 'folder';
  extension?: string;
  minSize?: number;
  maxSize?: number;
}

export class ProjectSearchService {
  private static instance: ProjectSearchService | null = null;
  private indexCache: Map<string, FileIndex>;
  private lastProjectId: string | null = null;

  private constructor() {
    this.indexCache = new Map();
  }

  static getInstance(): ProjectSearchService {
    if (!ProjectSearchService.instance) {
      ProjectSearchService.instance = new ProjectSearchService();
    }
    return ProjectSearchService.instance;
  }

  static resetInstance(): void {
    ProjectSearchService.instance = null;
  }

  async search(
    project: Project,
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchSummary> {
    const startTime = Date.now();
    const files = this.flattenFiles(project.rootFolder);
    const results: SearchResult[] = [];
    let totalMatches = 0;

    // Update index if project changed
    if (this.lastProjectId !== project.id) {
      this.buildIndex(project);
      this.lastProjectId = project.id;
    }

    // Apply filters
    let filteredFiles = files;

    if (options.fileTypes && options.fileTypes.length > 0) {
      filteredFiles = filteredFiles.filter((f) =>
        options.fileTypes!.includes(f.extension.toLowerCase())
      );
    }

    if (options.excludePatterns && options.excludePatterns.length > 0) {
      filteredFiles = filteredFiles.filter((f) =>
        !options.excludePatterns!.some((pattern) => {
          if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(f.name);
          }
          return f.path.includes(pattern);
        })
      );
    }

    // Search each file
    for (const file of filteredFiles) {
      if (!options.includeContent && !query.toLowerCase().includes(file.name.toLowerCase())) {
        continue;
      }

      const matches = this.searchInFile(file, query, options);

      if (matches.length > 0) {
        totalMatches += matches.length;

        results.push({
          file,
          matches,
          relevance: this.calculateRelevance(file, matches, query),
        });
      }

      // Limit results
      if (options.maxResults && results.length >= options.maxResults) {
        break;
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    // Apply max results limit
    const limitedResults = options.maxResults
      ? results.slice(0, options.maxResults)
      : results;

    return {
      totalFiles: filteredFiles.length,
      totalMatches,
      filesWithMatches: limitedResults.length,
      searchTime: Date.now() - startTime,
      results: limitedResults,
    };
  }

  private searchInFile(file: ProjectFile, query: string, options: SearchOptions): SearchMatch[] {
    const matches: SearchMatch[] = [];

    // Search in filename
    if (this.matchesQuery(file.name, query, options)) {
      matches.push({
        line: 0,
        content: file.name,
        index: 0,
        length: file.name.length,
        context: [],
      });
    }

    // Search in content
    if (options.includeContent !== false && file.content) {
      const lines = file.content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let searchIndex = 0;

        while (searchIndex < line.length) {
          const index = this.findMatchIndex(line, query, searchIndex, options);

          if (index === -1) break;

          matches.push({
            line: i + 1,
            content: line.trim(),
            index,
            length: query.length,
            context: this.getContext(lines, i),
          });

          searchIndex = index + 1;
        }
      }
    }

    return matches;
  }

  private matchesQuery(text: string, query: string, options: SearchOptions): boolean {
    if (options.regex) {
      try {
        const regex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
        return regex.test(text);
      } catch {
        return false;
      }
    }

    if (options.wholeWord) {
      const regex = new RegExp(
        `\\b${this.escapeRegex(query)}\\b`,
        options.caseSensitive ? 'g' : 'gi'
      );
      return regex.test(text);
    }

    const searchText = options.caseSensitive ? text : text.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    return searchText.includes(searchQuery);
  }

  private findMatchIndex(text: string, query: string, start: number, options: SearchOptions): number {
    if (options.regex) {
      try {
        const regex = new RegExp(query, options.caseSensitive ? '' : 'i');
        const substring = text.slice(start);
        const match = substring.match(regex);
        return match ? start + substring.indexOf(match[0]) : -1;
      } catch {
        return -1;
      }
    }

    if (options.wholeWord) {
      const regex = new RegExp(
        `\\b${this.escapeRegex(query)}\\b`,
        options.caseSensitive ? 'g' : 'gi'
      );
      const substring = text.slice(start);
      const match = substring.match(regex);
      return match ? start + substring.indexOf(match[0]) : -1;
    }

    const searchText = options.caseSensitive ? text : text.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    return searchText.indexOf(searchQuery, start);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getContext(lines: string[], lineIndex: number, contextLines: number = 2): string[] {
    const context: string[] = [];

    for (let i = Math.max(0, lineIndex - contextLines); i <= Math.min(lines.length - 1, lineIndex + contextLines); i++) {
      const prefix = i === lineIndex ? '>' : ' ';
      context.push(`${prefix} ${i + 1}: ${lines[i].trim()}`);
    }

    return context;
  }

  private calculateRelevance(file: ProjectFile, matches: SearchMatch[], query: string): number {
    let score = 0;

    // Filename match (highest weight)
    if (file.name.toLowerCase().includes(query.toLowerCase())) {
      score += 50;

      // Exact match bonus
      if (file.name.toLowerCase() === query.toLowerCase()) {
        score += 30;
      }
    }

    // Content matches
    score += matches.filter((m) => m.line > 0).length * 2;

    // Match in first lines bonus
    const earlyMatches = matches.filter((m) => m.line > 0 && m.line <= 20).length;
    score += earlyMatches * 5;

    // File type relevance
    const isCodeFile = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'].some(
      (ext) => file.extension.toLowerCase() === ext
    );
    if (isCodeFile) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  // Indexing for faster searches
  private buildIndex(project: Project): void {
    const index: FileIndex = {
      projectId: project.id,
      files: [],
      builtAt: new Date(),
    };

    const files = this.flattenFiles(project.rootFolder);

    for (const file of files) {
      if (!file.content) continue;

      const indexEntry: FileIndexEntry = {
        path: file.path,
        name: file.name,
        words: this.extractWords(file.content),
        firstLine: file.content.split('\n')[0]?.slice(0, 100) || '',
      };

      index.files.push(indexEntry);
    }

    this.indexCache.set(project.id, index);
  }

  private extractWords(content: string): Set<string> {
    const words = new Set<string>();
    const wordRegex = /\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g;

    let match;
    while ((match = wordRegex.exec(content)) !== null) {
      words.add(match[0].toLowerCase());
    }

    return words;
  }

  private flattenFiles(folder: ProjectFolder): ProjectFile[] {
    const files: ProjectFile[] = [...folder.files];

    for (const subfolder of folder.subfolders) {
      files.push(...this.flattenFiles(subfolder));
    }

    return files;
  }

  // Advanced Search Features
  async searchByType(project: Project, extension: string): Promise<ProjectFile[]> {
    const files = this.flattenFiles(project.rootFolder);
    return files.filter(
      (f) => f.extension.toLowerCase() === extension.toLowerCase()
    );
  }

  async searchBySize(project: Project, minSize?: number, maxSize?: number): Promise<ProjectFile[]> {
    const files = this.flattenFiles(project.rootFolder);
    return files.filter((f) => {
      const size = f.content?.length || 0;
      if (minSize !== undefined && size < minSize) return false;
      if (maxSize !== undefined && size > maxSize) return false;
      return true;
    });
  }

  async searchByPath(project: Project, pathPattern: string): Promise<ProjectFile[]> {
    const files = this.flattenFiles(project.rootFolder);
    const regex = new RegExp(pathPattern.replace(/\*/g, '.*'));

    return files.filter((f) => regex.test(f.path));
  }

  // Autocomplete
  getSuggestions(project: Project, prefix: string, maxSuggestions: number = 10): string[] {
    const suggestions = new Set<string>();

    const files = this.flattenFiles(project.rootFolder);

    for (const file of files) {
      // Suggest filenames
      if (file.name.toLowerCase().startsWith(prefix.toLowerCase())) {
        suggestions.add(file.name);
      }

      // Suggest words from content
      if (file.content) {
        const words = this.extractWords(file.content);
        for (const word of words) {
          if (word.startsWith(prefix.toLowerCase())) {
            suggestions.add(word);
          }
        }
      }
    }

    return Array.from(suggestions).slice(0, maxSuggestions);
  }

  // Search history
  private searchHistory: string[] = [];
  private maxHistory = 20;

  addToHistory(query: string): void {
    // Remove if already exists
    const index = this.searchHistory.indexOf(query);
    if (index !== -1) {
      this.searchHistory.splice(index, 1);
    }

    // Add to front
    this.searchHistory.unshift(query);

    // Trim
    while (this.searchHistory.length > this.maxHistory) {
      this.searchHistory.pop();
    }
  }

  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  clearHistory(): void {
    this.searchHistory = [];
  }

  // Export search results
  exportResults(results: SearchSummary, format: 'json' | 'csv' | 'markdown'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2);

      case 'csv':
        return this.exportToCSV(results);

      case 'markdown':
        return this.exportToMarkdown(results);

      default:
        return JSON.stringify(results, null, 2);
    }
  }

  private exportToCSV(results: SearchSummary): string {
    const lines: string[] = [];
    lines.push('File,Line,Content');

    for (const result of results.results) {
      for (const match of result.matches) {
        const escapedContent = match.content.replace(/"/g, '""');
        lines.push(`"${result.file.path}",${match.line},"${escapedContent}"`);
      }
    }

    return lines.join('\n');
  }

  private exportToMarkdown(results: SearchSummary): string {
    const lines: string[] = [];

    lines.push('# Search Results\n');
    lines.push(`**Query:** ${results.totalMatches} matches in ${results.filesWithMatches} files`);
    lines.push(`**Time:** ${results.searchTime}ms\n`);

    for (const result of results.results) {
      lines.push(`## ${result.file.path}\n`);

      for (const match of result.matches) {
        if (match.line === 0) {
          lines.push(`**Filename Match**\n`);
        } else {
          lines.push(`Line ${match.line}:\n`);
          lines.push('```');
          lines.push(...match.context);
          lines.push('```\n');
        }
      }
    }

    return lines.join('\n');
  }
}

interface FileIndex {
  projectId: string;
  files: FileIndexEntry[];
  builtAt: Date;
}

interface FileIndexEntry {
  path: string;
  name: string;
  words: Set<string>;
  firstLine: string;
}

export default ProjectSearchService.getInstance();
