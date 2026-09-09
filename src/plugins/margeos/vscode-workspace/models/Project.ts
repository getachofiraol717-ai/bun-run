/**
 * Project.ts
 *
 * Model for Project entity representing a coding project.
 */

export type ProjectType =
  | 'web'
  | 'mobile'
  | 'desktop'
  | 'api'
  | 'library'
  | 'script'
  | 'data-science'
  | 'machine-learning'
  | 'game'
  | 'other';

export type ProjectStatus = 'active' | 'archived' | 'deleted' | 'shared';

export interface ProjectDependency {
  name: string;
  version: string;
  type: 'prod' | 'dev' | 'peer';
}

export interface ProjectScript {
  name: string;
  command: string;
  description: string;
}

export interface ProjectEnvironment {
  name: string;
  variables: Record<string, string>;
}

export interface ProjectStats {
  totalFiles: number;
  totalLines: number;
  languages: Record<string, number>;
  complexity: number;
  lastAnalyzed: string;
}

export interface ProjectLearning {
  technologies: string[];
  concepts: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  completedModules: number;
  totalModules: number;
}

export interface Project {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  language: string;
  framework?: string;
  version: string;
  rootPath: string;
  mainFile?: string;
  files: any[];
  dependencies: ProjectDependency[];
  devDependencies: ProjectDependency[];
  scripts: ProjectScript[];
  environments: ProjectEnvironment[];
  settings: Record<string, any>;
  stats: ProjectStats;
  learning: ProjectLearning;
  isTemplate: boolean;
  templateId?: string;
  parentProjectId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  archivedAt?: string;
}

/**
 * Factory functions
 */

export function getDefaultStats(): ProjectStats {
  return {
    totalFiles: 0,
    totalLines: 0,
    languages: {},
    complexity: 0,
    lastAnalyzed: new Date().toISOString()
  };
}

export function getDefaultLearning(): ProjectLearning {
  return {
    technologies: [],
    concepts: [],
    difficulty: 'beginner',
    estimatedTime: 0,
    completedModules: 0,
    totalModules: 0
  };
}

export function createProject(
  workspaceId: string,
  userId: string,
  name: string,
  type: ProjectType,
  language: string,
  rootPath: string,
  description: string = '',
  framework?: string
): Project {
  return {
    id: `PRJ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    workspaceId,
    userId,
    name,
    description,
    type,
    status: 'active',
    language,
    framework,
    version: '1.0.0',
    rootPath,
    files: [],
    dependencies: [],
    devDependencies: [],
    scripts: [],
    environments: [],
    settings: {},
    stats: getDefaultStats(),
    learning: getDefaultLearning(),
    isTemplate: false,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastOpenedAt: new Date().toISOString()
  };
}

export function addDependency(
  project: Project,
  name: string,
  version: string,
  type: 'prod' | 'dev' | 'peer' = 'prod'
): Project {
  const dependency: ProjectDependency = { name, version, type };

  if (type === 'dev') {
    if (!project.devDependencies.find(d => d.name === name)) {
      project.devDependencies.push(dependency);
    }
  } else {
    if (!project.dependencies.find(d => d.name === name)) {
      project.dependencies.push(dependency);
    }
  }

  project.updatedAt = new Date().toISOString();
  return project;
}

export function removeDependency(project: Project, name: string): Project {
  project.dependencies = project.dependencies.filter(d => d.name !== name);
  project.devDependencies = project.devDependencies.filter(d => d.name !== name);
  project.updatedAt = new Date().toISOString();
  return project;
}

export function addScript(
  project: Project,
  name: string,
  command: string,
  description: string = ''
): Project {
  if (!project.scripts.find(s => s.name === name)) {
    project.scripts.push({ name, command, description });
    project.updatedAt = new Date().toISOString();
  }
  return project;
}

export function updateStats(
  project: Project,
  stats: Partial<ProjectStats>
): Project {
  project.stats = { ...project.stats, ...stats, lastAnalyzed: new Date().toISOString() };
  project.updatedAt = new Date().toISOString();
  return project;
}

export function updateLearning(
  project: Project,
  learning: Partial<ProjectLearning>
): Project {
  project.learning = { ...project.learning, ...learning };
  project.updatedAt = new Date().toISOString();
  return project;
}

export function archiveProject(project: Project): Project {
  project.status = 'archived';
  project.archivedAt = new Date().toISOString();
  project.updatedAt = new Date().toISOString();
  return project;
}

export function restoreProject(project: Project): Project {
  project.status = 'active';
  project.archivedAt = undefined;
  project.updatedAt = new Date().toISOString();
  return project;
}

export function duplicateProject(
  project: Project,
  newName: string,
  newRootPath: string
): Project {
  const duplicated: Project = {
    ...JSON.parse(JSON.stringify(project)),
    id: `PRJ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    name: newName,
    rootPath: newRootPath,
    status: 'active',
    isTemplate: false,
    parentProjectId: project.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastOpenedAt: new Date().toISOString(),
    archivedAt: undefined
  };

  return duplicated;
}

export function getProjectLanguages(project: Project): string[] {
  return Object.keys(project.stats.languages);
}

export function getTotalDependencies(project: Project): number {
  return project.dependencies.length + project.devDependencies.length;
}

export function getProjectComplexityLabel(complexity: number): 'simple' | 'moderate' | 'complex' | 'very-complex' {
  if (complexity < 10) return 'simple';
  if (complexity < 25) return 'moderate';
  if (complexity < 50) return 'complex';
  return 'very-complex';
}
