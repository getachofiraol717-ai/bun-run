// @ts-nocheck
/**
 * Project Storage Service
 * Handles local storage of projects and analysis results
 */

import { Project } from '../models/ProjectModel';
import { AnalysisReport } from '../models/AnalysisReport';
import { BugReport } from '../models/BugReport';
import { Documentation } from '../models/Documentation';
import { DependencyGraph } from '../models/DependencyGraph';

export interface StorageConfig {
  storageKey: string;
  maxProjects: number;
  compressData: boolean;
  includeContent: boolean;
}

const DEFAULT_CONFIG: StorageConfig = {
  storageKey: 'zip-intelligence-projects',
  maxProjects: 10,
  compressData: false,
  includeContent: false,
};

export interface StoredProject {
  id: string;
  name: string;
  description?: string;
  uploadedAt: Date;
  lastAnalyzed?: Date;
  size: number;
  fileCount: number;
  tags?: string[];
}

export interface StorageMetadata {
  projects: StoredProject[];
  totalSize: number;
  lastUpdated: Date;
  version: string;
}

export class ProjectStorageService {
  private static instance: ProjectStorageService | null = null;
  private config: StorageConfig;
  private memoryCache: Map<string, Project>;
  private listeners: Set<() => void> = new Set();

  private constructor(config?: Partial<StorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryCache = new Map();
    this.loadFromStorage();
  }

  static getInstance(config?: Partial<StorageConfig>): ProjectStorageService {
    if (!ProjectStorageService.instance) {
      ProjectStorageService.instance = new ProjectStorageService(config);
    }
    return ProjectStorageService.instance;
  }

  static resetInstance(): void {
    ProjectStorageService.instance = null;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('Storage listener error:', error);
      }
    }
  }

  // Project Operations
  saveProject(project: Project): void {
    // Update cache
    this.memoryCache.set(project.id, project);

    // Save to localStorage
    const metadata = this.getMetadata();
    const existingIndex = metadata.projects.findIndex((p) => p.id === project.id);

    const storedProject: StoredProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      uploadedAt: new Date(project.uploadedAt),
      lastAnalyzed: project.lastAnalyzed ? new Date(project.lastAnalyzed) : undefined,
      size: project.statistics.totalSize,
      fileCount: project.structure.totalFiles,
      tags: project.metadata.tags,
    };

    if (existingIndex >= 0) {
      metadata.projects[existingIndex] = storedProject;
    } else {
      metadata.projects.push(storedProject);
    }

    // Trim if exceeds max
    while (metadata.projects.length > this.config.maxProjects) {
      const oldest = metadata.projects.shift();
      if (oldest) {
        this.removeProjectData(oldest.id);
      }
    }

    // Save project data
    this.saveProjectData(project);

    // Update metadata
    metadata.lastUpdated = new Date();
    metadata.totalSize = this.calculateTotalSize();
    this.saveMetadata(metadata);

    this.emit();
  }

  getProject(projectId: string): Project | null {
    // Check cache first
    if (this.memoryCache.has(projectId)) {
      return this.memoryCache.get(projectId)!;
    }

    // Load from storage
    const project = this.loadProjectData(projectId);
    if (project) {
      this.memoryCache.set(projectId, project);
    }

    return project;
  }

  getAllProjects(): StoredProject[] {
    const metadata = this.getMetadata();
    return metadata.projects.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  deleteProject(projectId: string): boolean {
    // Remove from cache
    this.memoryCache.delete(projectId);

    // Remove from metadata
    const metadata = this.getMetadata();
    const index = metadata.projects.findIndex((p) => p.id === projectId);

    if (index === -1) {
      return false;
    }

    metadata.projects.splice(index, 1);
    this.saveMetadata(metadata);

    // Remove project data
    this.removeProjectData(projectId);

    this.emit();
    return true;
  }

  // Analysis Results
  saveAnalysisResults(projectId: string, results: {
    analysis?: AnalysisReport;
    bugReport?: BugReport;
    documentation?: Documentation;
    dependencyGraph?: DependencyGraph;
  }): void {
    const key = `${this.config.storageKey}-analysis-${projectId}`;

    try {
      localStorage.setItem(key, JSON.stringify({
        ...results,
        savedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to save analysis results:', error);
      this.handleStorageError();
    }
  }

  getAnalysisResults(projectId: string): {
    analysis?: AnalysisReport;
    bugReport?: BugReport;
    documentation?: Documentation;
    dependencyGraph?: DependencyGraph;
    savedAt?: Date;
  } | null {
    const key = `${this.config.storageKey}-analysis-${projectId}`;

    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      if (parsed.savedAt) {
        parsed.savedAt = new Date(parsed.savedAt);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load analysis results:', error);
      return null;
    }
  }

  // Storage Management
  private loadFromStorage(): void {
    // Load metadata and cached projects
    const metadata = this.getMetadata();

    for (const project of metadata.projects) {
      try {
        const projectData = this.loadProjectData(project.id);
        if (projectData) {
          this.memoryCache.set(project.id, projectData);
        }
      } catch (error) {
        console.warn(`Failed to load project ${project.id}:`, error);
      }
    }
  }

  private getMetadata(): StorageMetadata {
    const key = `${this.config.storageKey}-metadata`;

    try {
      const data = localStorage.getItem(key);
      if (!data) {
        return {
          projects: [],
          totalSize: 0,
          lastUpdated: new Date(),
          version: '1.0.0',
        };
      }

      const parsed = JSON.parse(data);
      parsed.lastUpdated = new Date(parsed.lastUpdated);
      return parsed;
    } catch (error) {
      console.error('Failed to load metadata:', error);
      return {
        projects: [],
        totalSize: 0,
        lastUpdated: new Date(),
        version: '1.0.0',
      };
    }
  }

  private saveMetadata(metadata: StorageMetadata): void {
    const key = `${this.config.storageKey}-metadata`;

    try {
      localStorage.setItem(key, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to save metadata:', error);
      this.handleStorageError();
    }
  }

  private saveProjectData(project: Project): void {
    const key = `${this.config.storageKey}-project-${project.id}`;

    try {
      if (this.config.includeContent) {
        // Save full project with content
        localStorage.setItem(key, JSON.stringify(project));
      } else {
        // Save without file content to save space
        const projectWithoutContent = {
          ...project,
          rootFolder: this.removeContentFromFolder(project.rootFolder),
        };
        localStorage.setItem(key, JSON.stringify(projectWithoutContent));
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      this.handleStorageError();
    }
  }

  private loadProjectData(projectId: string): Project | null {
    const key = `${this.config.storageKey}-project-${projectId}`;

    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return this.reconstructProject(parsed);
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  private removeProjectData(projectId: string): void {
    const projectKey = `${this.config.storageKey}-project-${projectId}`;
    const analysisKey = `${this.config.storageKey}-analysis-${projectId}`;

    localStorage.removeItem(projectKey);
    localStorage.removeItem(analysisKey);
  }

  private removeContentFromFolder(folder: { subfolders: unknown[]; files: unknown[] }): unknown {
    return {
      ...folder,
      subfolders: folder.subfolders.map((subfolder) =>
        this.removeContentFromFolder(subfolder as { subfolders: unknown[]; files: unknown[] })
      ),
      files: folder.files.map((file: unknown) => {
        const f = file as { content?: string };
        return { ...f, content: undefined };
      }),
    };
  }

  private reconstructProject(data: unknown): Project {
    const project = data as Project;

    // Ensure dates are Date objects
    project.uploadedAt = new Date(project.uploadedAt);
    if (project.lastAnalyzed) {
      project.lastAnalyzed = new Date(project.lastAnalyzed);
    }

    return project;
  }

  private calculateTotalSize(): number {
    let total = 0;

    for (const project of this.memoryCache.values()) {
      total += project.statistics.totalSize;
    }

    return total;
  }

  private handleStorageError(): void {
    // Try to free up space by removing old projects
    const metadata = this.getMetadata();

    if (metadata.projects.length > 1) {
      // Remove oldest project
      const oldest = metadata.projects.shift();
      if (oldest) {
        this.deleteProject(oldest.id);
      }
    } else {
      // Try removing analysis results
      for (const project of metadata.projects) {
        localStorage.removeItem(`${this.config.storageKey}-analysis-${project.id}`);
      }
    }

    this.emit();
  }

  // Utility Methods
  getStorageUsage(): { used: number; available: number; percentage: number } {
    let used = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.config.storageKey)) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // Estimate available (5MB is typical localStorage limit)
    const available = 5 * 1024 * 1024 - used;

    return {
      used,
      available: Math.max(0, available),
      percentage: Math.round((used / (5 * 1024 * 1024)) * 100),
    };
  }

  clearAll(): void {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.config.storageKey)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    this.memoryCache.clear();
    this.emit();
  }

  updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  exists(projectId: string): boolean {
    const metadata = this.getMetadata();
    return metadata.projects.some((p) => p.id === projectId);
  }
}

export default ProjectStorageService.getInstance();
