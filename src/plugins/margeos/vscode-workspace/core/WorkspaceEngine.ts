/**
 * WorkspaceEngine.ts
 *
 * Core engine for managing the VSCode-style workspace.
 */

import { Workspace, createWorkspace, getDefaultSettings, getDefaultPanels } from '../models/Workspace';
import { Project } from '../models/Project';
import { FileNode, createFileNode, createDirectory, buildFileTree } from '../models/FileNode';
import { EditorTab, createEditorTab } from '../models/EditorTab';

const STORAGE_KEY = 'workspace_engine_data';

export interface WorkspaceEngineConfig {
  maxProjects?: number;
  maxOpenTabs?: number;
  autoSaveInterval?: number;
  enableAnalytics?: boolean;
}

export class WorkspaceEngine {
  private static instance: WorkspaceEngine;
  private workspace: Workspace | null = null;
  private projects: Map<string, Project> = new Map();
  private fileNodes: Map<string, FileNode> = new Map();
  private editorTabs: Map<string, EditorTab> = new Map();
  private config: WorkspaceEngineConfig;
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor(config: WorkspaceEngineConfig = {}) {
    this.config = {
      maxProjects: config.maxProjects || 20,
      maxOpenTabs: config.maxOpenTabs || 20,
      autoSaveInterval: config.autoSaveInterval || 30000,
      enableAnalytics: config.enableAnalytics !== false
    };
  }

  static getInstance(config?: WorkspaceEngineConfig): WorkspaceEngine {
    if (!WorkspaceEngine.instance) {
      WorkspaceEngine.instance = new WorkspaceEngine(config);
    }
    return WorkspaceEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.workspace) {
          this.workspace = data.workspace;
        }
        if (data.projects) {
          this.projects = new Map(Object.entries(data.projects));
        }
        if (data.fileNodes) {
          this.fileNodes = new Map(Object.entries(data.fileNodes));
        }
        if (data.editorTabs) {
          this.editorTabs = new Map(Object.entries(data.editorTabs));
        }
      }
    } catch (error) {
      console.error('Failed to load workspace data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        workspace: this.workspace,
        projects: Object.fromEntries(this.projects),
        fileNodes: Object.fromEntries(this.fileNodes),
        editorTabs: Object.fromEntries(this.editorTabs)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save workspace data:', error);
    }
  }

  // Workspace Management
  createWorkspace(userId: string, name: string, description?: string): Workspace {
    this.workspace = createWorkspace(userId, name, description);
    this.saveToStorage();
    this.emit('workspaceCreated', this.workspace);
    return this.workspace;
  }

  getWorkspace(): Workspace | null {
    return this.workspace;
  }

  updateWorkspace(updates: Partial<Workspace>): Workspace | null {
    if (!this.workspace) return null;
    Object.assign(this.workspace, updates);
    this.workspace.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.emit('workspaceUpdated', this.workspace);
    return this.workspace;
  }

  // Project Management
  createProject(
    userId: string,
    name: string,
    type: Project['type'],
    language: string,
    description?: string
  ): Project {
    if (this.projects.size >= this.config.maxProjects!) {
      throw new Error(`Maximum number of projects (${this.config.maxProjects}) reached`);
    }

    const project: Project = {
      id: `PRJ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      workspaceId: this.workspace?.id || '',
      userId,
      name,
      description: description || '',
      type,
      status: 'active',
      language,
      version: '1.0.0',
      rootPath: `/workspace/${name}`,
      files: [],
      dependencies: [],
      devDependencies: [],
      scripts: [],
      environments: [],
      settings: {},
      stats: { totalFiles: 0, totalLines: 0, languages: {}, complexity: 0, lastAnalyzed: new Date().toISOString() },
      learning: { technologies: [], concepts: [], difficulty: 'beginner', estimatedTime: 0, completedModules: 0, totalModules: 0 },
      isTemplate: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString()
    };

    this.projects.set(project.id, project);

    // Create default directory structure
    this.createDefaultStructure(project.id);

    // Add to recent projects
    if (this.workspace) {
      this.workspace.recentProjects.unshift(project.id);
      this.workspace.recentProjects = this.workspace.recentProjects.slice(0, 10);
    }

    this.saveToStorage();
    this.emit('projectCreated', project);
    return project;
  }

  private createDefaultStructure(projectId: string): void {
    const rootPath = `/workspace/projects/${projectId}`;

    const dirs = ['src', 'src/components', 'src/utils', 'src/hooks', 'public', 'tests'];
    dirs.forEach(dir => {
      const node = createDirectory(projectId, dir.split('/').pop() || dir, `${rootPath}/${dir}`);
      node.parentId = dir.includes('/') ? this.findParentId(projectId, dir) : null;
      node.depth = dir.split('/').length;
      this.fileNodes.set(node.id, node);
    });

    // Create README.md
    const readme = createFileNode(projectId, 'README.md', `${rootPath}/README.md`);
    readme.content = `# ${projectId}\n\nProject description here.\n`;
    this.fileNodes.set(readme.id, readme);

    // Create package.json
    const pkg = createFileNode(projectId, 'package.json', `${rootPath}/package.json`);
    pkg.content = JSON.stringify({
      name: projectId,
      version: '1.0.0',
      description: 'A new project',
      main: 'src/index.js',
      scripts: { start: 'echo "Error: no start script specified"', build: 'echo "Error: no build script specified"' },
      keywords: [],
      author: '',
      license: 'ISC'
    }, null, 2);
    this.fileNodes.set(pkg.id, pkg);
  }

  private findParentId(projectId: string, path: string): string | null {
    const parts = path.split('/');
    if (parts.length < 2) return null;

    const parentPath = parts.slice(0, -1).join('/');
    const parentName = parts[parts.length - 2];

    for (const node of this.fileNodes.values()) {
      if (node.projectId === projectId && node.name === parentName && node.type === 'directory') {
        return node.id;
      }
    }
    return null;
  }

  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values()).sort((a, b) =>
      new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    );
  }

  getActiveProjects(): Project[] {
    return Array.from(this.projects.values()).filter(p => p.status === 'active');
  }

  updateProject(projectId: string, updates: Partial<Project>): Project | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    Object.assign(project, updates);
    project.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.emit('projectUpdated', project);
    return project;
  }

  deleteProject(projectId: string): boolean {
    const deleted = this.projects.delete(projectId);
    if (deleted) {
      // Delete all files associated with the project
      for (const [id, node] of this.fileNodes) {
        if (node.projectId === projectId) {
          this.fileNodes.delete(id);
        }
      }
      this.saveToStorage();
      this.emit('projectDeleted', { projectId });
    }
    return deleted;
  }

  openProject(projectId: string): Project | undefined {
    const project = this.projects.get(projectId);
    if (project) {
      project.lastOpenedAt = new Date().toISOString();
      if (this.workspace) {
        this.workspace.recentProjects = this.workspace.recentProjects.filter(id => id !== projectId);
        this.workspace.recentProjects.unshift(projectId);
        this.workspace.recentProjects = this.workspace.recentProjects.slice(0, 10);
      }
      this.saveToStorage();
      this.emit('projectOpened', project);
    }
    return project;
  }

  // File Node Management
  getFileNode(nodeId: string): FileNode | undefined {
    return this.fileNodes.get(nodeId);
  }

  getProjectFiles(projectId: string): FileNode[] {
    return Array.from(this.fileNodes.values()).filter(n => n.projectId === projectId);
  }

  getFileTree(projectId: string): { rootNodes: FileNode[]; totalNodes: number; totalFiles: number; totalDirectories: number } {
    const nodes = this.getProjectFiles(projectId);
    return buildFileTree(nodes);
  }

  createFile(projectId: string, name: string, path: string, parentId: string | null, content: string = ''): FileNode {
    const node = createFileNode(projectId, name, path, parentId, 'file', content);
    this.fileNodes.set(node.id, node);
    this.updateProjectStats(projectId);
    this.saveToStorage();
    this.emit('fileCreated', node);
    return node;
  }

  createFolder(projectId: string, name: string, path: string, parentId: string | null): FileNode {
    const node = createDirectory(projectId, name, path, parentId);
    this.fileNodes.set(node.id, node);
    this.saveToStorage();
    this.emit('folderCreated', node);
    return node;
  }

  updateFileContent(nodeId: string, content: string): FileNode | undefined {
    const node = this.fileNodes.get(nodeId);
    if (!node || node.type !== 'file') return undefined;

    node.content = content;
    node.metadata.lineCount = content.split('\n').length;
    node.metadata.size = new Blob([content]).size;
    node.updatedAt = new Date().toISOString();

    this.updateProjectStats(node.projectId);
    this.saveToStorage();
    this.emit('fileContentUpdated', node);
    return node;
  }

  renameFileNode(nodeId: string, newName: string): FileNode | undefined {
    const node = this.fileNodes.get(nodeId);
    if (!node) return undefined;

    const oldName = node.name;
    node.name = newName;
    node.extension = newName.includes('.') ? newName.split('.').pop()?.toLowerCase() : undefined;
    node.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.emit('fileRenamed', { node, oldName, newName });
    return node;
  }

  deleteFileNode(nodeId: string): boolean {
    const node = this.fileNodes.get(nodeId);
    if (!node) return false;

    // Delete children if directory
    if (node.type === 'directory') {
      const children = Array.from(this.fileNodes.values()).filter(n => n.parentId === nodeId);
      children.forEach(child => this.deleteFileNode(child.id));
    }

    this.fileNodes.delete(nodeId);
    this.updateProjectStats(node.projectId);
    this.saveToStorage();
    this.emit('fileDeleted', { nodeId, node });
    return true;
  }

  private updateProjectStats(projectId: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;

    const files = this.getProjectFiles(projectId).filter(n => n.type === 'file');
    const languages: Record<string, number> = {};

    let totalLines = 0;
    files.forEach(file => {
      const lang = file.metadata.language || 'plaintext';
      languages[lang] = (languages[lang] || 0) + 1;
      totalLines += file.metadata.lineCount || 0;
    });

    project.stats.totalFiles = files.length;
    project.stats.totalLines = totalLines;
    project.stats.languages = languages;
    project.stats.lastAnalyzed = new Date().toISOString();
  }

  // Editor Tab Management
  openFile(fileId: string): EditorTab | undefined {
    const file = this.fileNodes.get(fileId);
    if (!file || file.type !== 'file') return undefined;

    // Check if already open
    let tab = Array.from(this.editorTabs.values()).find(t => t.fileId === fileId);
    if (tab) {
      tab.state = 'active';
      this.emit('tabActivated', tab);
      return tab;
    }

    // Check max tabs
    if (this.editorTabs.size >= this.config.maxOpenTabs!) {
      // Close oldest inactive tab
      const oldest = Array.from(this.editorTabs.values())
        .filter(t => t.state !== 'pinned')
        .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime())[0];
      if (oldest) {
        this.closeTab(oldest.id);
      }
    }

    tab = createEditorTab(file.id, file.name, file.path, file.metadata.language || 'plaintext', file.content || '');
    this.editorTabs.set(tab.id, tab);
    this.emit('tabOpened', tab);
    return tab;
  }

  closeTab(tabId: string): boolean {
    const deleted = this.editorTabs.delete(tabId);
    if (deleted) {
      this.saveToStorage();
      this.emit('tabClosed', { tabId });
    }
    return deleted;
  }

  getOpenTabs(): EditorTab[] {
    return Array.from(this.editorTabs.values()).sort((a, b) =>
      new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
    );
  }

  updateTabContent(tabId: string, content: string): EditorTab | undefined {
    const tab = this.editorTabs.get(tabId);
    if (!tab) return undefined;

    tab.content = content;
    tab.isDirty = content !== tab.originalContent;
    tab.lastModifiedAt = new Date().toISOString();

    // Update file content
    const file = this.fileNodes.get(tab.fileId);
    if (file) {
      file.content = content;
      file.updatedAt = new Date().toISOString();
    }

    this.saveToStorage();
    this.emit('tabContentUpdated', tab);
    return tab;
  }

  saveTab(tabId: string): EditorTab | undefined {
    const tab = this.editorTabs.get(tabId);
    if (!tab) return undefined;

    tab.originalContent = tab.content;
    tab.isDirty = false;
    tab.lastSavedAt = new Date().toISOString();

    // Save to file
    const file = this.fileNodes.get(tab.fileId);
    if (file) {
      file.content = tab.content;
      file.updatedAt = new Date().toISOString();
    }

    this.saveToStorage();
    this.emit('tabSaved', tab);
    return tab;
  }

  // Search
  searchInProject(projectId: string, query: string): FileNode[] {
    const lowerQuery = query.toLowerCase();
    return this.getProjectFiles(projectId).filter(node => {
      if (node.type === 'file' && node.content) {
        return node.content.toLowerCase().includes(lowerQuery) || node.name.toLowerCase().includes(lowerQuery);
      }
      return node.name.toLowerCase().includes(lowerQuery);
    });
  }

  // Event System
  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Statistics
  getStats(): { projects: number; files: number; tabs: number } {
    return {
      projects: this.projects.size,
      files: this.fileNodes.size,
      tabs: this.editorTabs.size
    };
  }
}

export default WorkspaceEngine;
