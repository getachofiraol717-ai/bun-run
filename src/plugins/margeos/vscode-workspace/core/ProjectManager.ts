// @ts-nocheck
/**
 * ProjectManager.ts
 *
 * Engine for managing coding projects with templates and imports.
 */

import { Project, ProjectType, createProject, duplicateProject } from '../models/Project';
import { FileNode, createFileNode, createDirectory } from '../models/FileNode';

const STORAGE_KEY = 'project_manager_data';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  language: string;
  framework?: string;
  files: Array<{ name: string; path: string; content: string }>;
  dependencies: Array<{ name: string; version: string }>;
  devDependencies: Array<{ name: string; version: string }>;
  settings: Record<string, any>;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  technologies: string[];
  concepts: string[];
}

export class ProjectManager {
  private static instance: ProjectManager;
  private projects: Map<string, Project> = new Map();
  private templates: Map<string, ProjectTemplate> = new Map();
  private projectFiles: Map<string, Map<string, FileNode>> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.initializeDefaultTemplates();
  }

  static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private initializeDefaultTemplates(): void {
    // JavaScript Basic Template
    this.templates.set('js-basic', {
      id: 'js-basic',
      name: 'JavaScript Basic',
      description: 'A basic JavaScript project to learn fundamentals',
      type: 'web',
      language: 'javascript',
      files: [
        { name: 'index.html', path: '/', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My App</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <script src="src/index.js"></script>\n</body>\n</html>' },
        { name: 'index.js', path: '/src', content: '// Welcome to JavaScript!\nconsole.log("Hello, World!");' }
      ],
      dependencies: [],
      devDependencies: [],
      settings: {},
      tags: ['javascript', 'beginner', 'web'],
      difficulty: 'beginner',
      estimatedTime: 60,
      technologies: ['JavaScript', 'HTML'],
      concepts: ['variables', 'functions', 'console']
    });

    // React Basic Template
    this.templates.set('react-basic', {
      id: 'react-basic',
      name: 'React Basic',
      description: 'A basic React application',
      type: 'web',
      language: 'javascript',
      framework: 'react',
      files: [
        { name: 'index.html', path: '/', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script src="dist/bundle.js"></script>\n</body>\n</html>' },
        { name: 'App.jsx', path: '/src', content: 'import React from "react";\n\nfunction App() {\n  return (\n    <div>\n      <h1>Welcome to React!</h1>\n    </div>\n  );\n}\n\nexport default App;' },
        { name: 'index.jsx', path: '/src', content: 'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));' }
      ],
      dependencies: [{ name: 'react', version: '^18.2.0' }, { name: 'react-dom', version: '^18.2.0' }],
      devDependencies: [{ name: 'webpack', version: '^5.0.0' }],
      settings: { framework: 'react' },
      tags: ['react', 'javascript', 'frontend'],
      difficulty: 'intermediate',
      estimatedTime: 120,
      technologies: ['React', 'JavaScript', 'HTML'],
      concepts: ['components', 'jsx', 'state']
    });

    // Python Basic Template
    this.templates.set('python-basic', {
      id: 'python-basic',
      name: 'Python Basic',
      description: 'A basic Python project',
      type: 'script',
      language: 'python',
      files: [
        { name: 'main.py', path: '/', content: '# Welcome to Python!\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()' }
      ],
      dependencies: [],
      devDependencies: [],
      settings: {},
      tags: ['python', 'beginner'],
      difficulty: 'beginner',
      estimatedTime: 60,
      technologies: ['Python'],
      concepts: ['functions', 'print', 'main']
    });

    // TypeScript Project Template
    this.templates.set('typescript-basic', {
      id: 'typescript-basic',
      name: 'TypeScript Basic',
      description: 'A basic TypeScript project',
      type: 'web',
      language: 'typescript',
      files: [
        { name: 'index.ts', path: '/src', content: '// Welcome to TypeScript!\n\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));' },
        { name: 'tsconfig.json', path: '/', content: JSON.stringify({
          compilerOptions: { target: 'ES2020', module: 'commonjs', strict: true }
        }, null, 2) }
      ],
      dependencies: [{ name: 'typescript', version: '^5.0.0' }],
      devDependencies: [],
      settings: {},
      tags: ['typescript', 'javascript', 'beginner'],
      difficulty: 'beginner',
      estimatedTime: 90,
      technologies: ['TypeScript', 'JavaScript'],
      concepts: ['types', 'interfaces', 'generics']
    });

    // Node.js API Template
    this.templates.set('node-api', {
      id: 'node-api',
      name: 'Node.js API',
      description: 'A RESTful API with Node.js and Express',
      type: 'api',
      language: 'javascript',
      framework: 'express',
      files: [
        { name: 'server.js', path: '/', content: 'const express = require("express");\nconst app = express();\n\napp.use(express.json());\n\napp.get("/", (req, res) => {\n  res.json({ message: "Welcome to the API" });\n});\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});' },
        { name: 'package.json', path: '/', content: JSON.stringify({
          name: 'my-api', version: '1.0.0', main: 'server.js',
          scripts: { start: 'node server.js' },
          dependencies: { express: '^4.18.0' }
        }, null, 2) }
      ],
      dependencies: [{ name: 'express', version: '^4.18.0' }],
      devDependencies: [],
      settings: {},
      tags: ['node', 'api', 'express', 'backend'],
      difficulty: 'intermediate',
      estimatedTime: 180,
      technologies: ['Node.js', 'Express', 'JavaScript'],
      concepts: ['routes', 'middleware', 'REST']
    });
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.projects = new Map(Object.entries(data.projects || {}));
      }
    } catch (error) {
      console.error('Failed to load project manager data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projects: Object.fromEntries(this.projects)
      }));
    } catch (error) {
      console.error('Failed to save project manager data:', error);
    }
  }

  // Template Management
  getTemplates(): ProjectTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(templateId: string): ProjectTemplate | undefined {
    return this.templates.get(templateId);
  }

  getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): ProjectTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.difficulty === difficulty);
  }

  getTemplatesByLanguage(language: string): ProjectTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.language === language);
  }

  getTemplatesByType(type: ProjectType): ProjectTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }

  // Project Creation from Template
  createFromTemplate(
    templateId: string,
    userId: string,
    projectName: string,
    workspaceId: string
  ): Project | undefined {
    const template = this.templates.get(templateId);
    if (!template) return undefined;

    const project = createProject(
      workspaceId,
      userId,
      projectName,
      template.type,
      template.language,
      `/workspace/${projectName}`,
      template.description,
      template.framework
    );

    project.dependencies = template.dependencies;
    project.devDependencies = template.devDependencies;
    project.settings = template.settings;
    project.learning = {
      technologies: template.technologies,
      concepts: template.concepts,
      difficulty: template.difficulty,
      estimatedTime: template.estimatedTime,
      completedModules: 0,
      totalModules: template.concepts.length
    };

    this.projects.set(project.id, project);

    // Create files from template
    const fileMap = new Map<string, FileNode>();
    template.files.forEach(file => {
      const node = createFileNode(
        project.id,
        file.name,
        `${project.rootPath}${file.path}/${file.name}`,
        null,
        'file',
        file.content
      );
      fileMap.set(node.id, node);
    });

    this.projectFiles.set(project.id, fileMap);
    this.saveToStorage();
    this.emit('projectCreated', project);

    return project;
  }

  // Project CRUD
  createProject(
    workspaceId: string,
    userId: string,
    name: string,
    type: ProjectType,
    language: string,
    description?: string,
    framework?: string
  ): Project {
    const project = createProject(workspaceId, userId, name, type, language, `/workspace/${name}`, description, framework);
    this.projects.set(project.id, project);
    this.projectFiles.set(project.id, new Map());
    this.saveToStorage();
    this.emit('projectCreated', project);
    return project;
  }

  getProject(projectId: string): Project | undefined {
    return this.projects.get(projectId);
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  getUserProjects(userId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
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
      this.projectFiles.delete(projectId);
      this.saveToStorage();
      this.emit('projectDeleted', { projectId });
    }
    return deleted;
  }

  archiveProject(projectId: string): Project | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    project.status = 'archived';
    project.archivedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();
    this.saveToStorage();
    this.emit('projectArchived', project);
    return project;
  }

  duplicateProject(projectId: string, newName: string): Project | undefined {
    const original = this.projects.get(projectId);
    if (!original) return undefined;

    const duplicated = duplicateProject(original, newName, `/workspace/${newName}`);
    this.projects.set(duplicated.id, duplicated);

    // Duplicate files
    const originalFiles = this.projectFiles.get(projectId);
    if (originalFiles) {
      const newFiles = new Map<string, FileNode>();
      originalFiles.forEach((file, id) => {
        const newFile = { ...file, id: `FN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}` };
        newFile.path = file.path.replace(original.name, newName);
        newFiles.set(newFile.id, newFile);
      });
      this.projectFiles.set(duplicated.id, newFiles);
    }

    this.saveToStorage();
    this.emit('projectDuplicated', { originalId: projectId, newProject: duplicated });
    return duplicated;
  }

  // File Operations
  getProjectFiles(projectId: string): FileNode[] {
    const files = this.projectFiles.get(projectId);
    return files ? Array.from(files.values()) : [];
  }

  getFile(projectId: string, fileId: string): FileNode | undefined {
    return this.projectFiles.get(projectId)?.get(fileId);
  }

  addFile(projectId: string, name: string, path: string, content: string = ''): FileNode | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const file = createFileNode(projectId, name, `${project.rootPath}${path}/${name}`, null, 'file', content);
    const files = this.projectFiles.get(projectId) || new Map();
    files.set(file.id, file);
    this.projectFiles.set(projectId, files);

    this.updateProjectStats(projectId);
    this.saveToStorage();
    this.emit('fileCreated', { projectId, file });
    return file;
  }

  updateFileContent(projectId: string, fileId: string, content: string): FileNode | undefined {
    const file = this.projectFiles.get(projectId)?.get(fileId);
    if (!file) return undefined;

    file.content = content;
    file.metadata.lineCount = content.split('\n').length;
    file.metadata.size = new Blob([content]).size;
    file.updatedAt = new Date().toISOString();

    this.updateProjectStats(projectId);
    this.saveToStorage();
    this.emit('fileUpdated', { projectId, file });
    return file;
  }

  deleteFile(projectId: string, fileId: string): boolean {
    const files = this.projectFiles.get(projectId);
    if (!files) return false;

    const deleted = files.delete(fileId);
    if (deleted) {
      this.updateProjectStats(projectId);
      this.saveToStorage();
      this.emit('fileDeleted', { projectId, fileId });
    }
    return deleted;
  }

  private updateProjectStats(projectId: string): void {
    const project = this.projects.get(projectId);
    const files = this.projectFiles.get(projectId);
    if (!project || !files) return;

    const fileArray = Array.from(files.values()).filter(f => f.type === 'file');
    const languages: Record<string, number> = {};
    let totalLines = 0;

    fileArray.forEach(file => {
      const lang = file.metadata.language || 'plaintext';
      languages[lang] = (languages[lang] || 0) + 1;
      totalLines += file.metadata.lineCount || 0;
    });

    project.stats.totalFiles = fileArray.length;
    project.stats.totalLines = totalLines;
    project.stats.languages = languages;
    project.stats.lastAnalyzed = new Date().toISOString();
  }

  // Export/Import
  exportProject(projectId: string): { project: Project; files: FileNode[] } | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const files = this.getProjectFiles(projectId);
    return { project, files };
  }

  importProject(data: { project: Project; files: FileNode[] }): Project {
    const newProject = { ...data.project, id: `PRJ-${Date.now()}` };
    this.projects.set(newProject.id, newProject);

    const files = new Map<string, FileNode>();
    data.files.forEach(file => {
      const newFile = { ...file, id: `FN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}` };
      files.set(newFile.id, newFile);
    });
    this.projectFiles.set(newProject.id, files);

    this.saveToStorage();
    this.emit('projectImported', newProject);
    return newProject;
  }

  // Search
  searchProjects(query: string): Project[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.projects.values()).filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  // Events
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

  getStats(): { totalProjects: number; activeProjects: number; templates: number } {
    return {
      totalProjects: this.projects.size,
      activeProjects: Array.from(this.projects.values()).filter(p => p.status === 'active').length,
      templates: this.templates.size
    };
  }
}

export default ProjectManager;
