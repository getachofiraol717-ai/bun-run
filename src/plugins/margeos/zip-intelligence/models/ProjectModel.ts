/**
 * Project Model for ZIP Intelligence
 * Represents an uploaded project with all its metadata
 */

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  type: 'file' | 'directory';
  content?: string;
  children?: ProjectFile[];
  lastModified: Date;
  permissions?: string;
}

export interface ProjectFolder {
  id: string;
  name: string;
  path: string;
  files: ProjectFile[];
  subfolders: ProjectFolder[];
  totalSize: number;
  fileCount: number;
  depth: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  uploadedAt: Date;
  analyzedAt?: Date;
  rootFolder: ProjectFolder;
  structure: ProjectStructure;
  technologyProfile: TechnologyProfile;
  architecture: ArchitectureReport;
  statistics: ProjectStatistics;
  metadata: ProjectMetadata;
  searchIndex?: SearchIndex;
  insights?: LearningInsight[];
}

export interface ProjectStructure {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  maxDepth: number;
  largestFile?: ProjectFile;
  deepestPath?: string;
  fileTypes: Record<string, number>;
  folderBreakdown: FolderBreakdown[];
}

export interface FolderBreakdown {
  path: string;
  name: string;
  fileCount: number;
  totalSize: number;
  depth: number;
  percentage: number;
}

export interface TechnologyProfile {
  languages: LanguageInfo[];
  frameworks: FrameworkInfo[];
  libraries: LibraryInfo[];
  packageManagers: string[];
  buildTools: string[];
  databases?: string[];
  apis?: string[];
  configurationFiles: ConfigurationFile[];
  detectedFeatures: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface LanguageInfo {
  name: string;
  version?: string;
  files: number;
  lines: number;
  percentage: number;
}

export interface FrameworkInfo {
  name: string;
  version?: string;
  category: string;
  detected: boolean;
  confidence: number;
}

export interface LibraryInfo {
  name: string;
  version?: string;
  category: string;
  purpose: string;
}

export interface ConfigurationFile {
  name: string;
  path: string;
  type: string;
  purpose: string;
}

export interface ArchitectureReport {
  pattern: ArchitecturePattern;
  description: string;
  layers: ArchitectureLayer[];
  components: ComponentInfo[];
  relationships: ComponentRelationship[];
  flow: DataFlow[];
  strengths: string[];
  weaknesses: string[];
  recommendations: ArchitectureRecommendation[];
}

export interface ArchitecturePattern {
  name: string;
  category: 'layered' | 'modular' | 'component' | 'monolithic' | 'microservice' | 'serverless' | 'mvc' | 'mvvm' | 'flux' | 'clean';
  description: string;
}

export interface ArchitectureLayer {
  name: string;
  description: string;
  folders: string[];
  responsibilities: string[];
  dependencies: string[];
}

export interface ComponentInfo {
  name: string;
  path: string;
  type: 'module' | 'component' | 'service' | 'controller' | 'model' | 'view' | 'utility' | 'config';
  description?: string;
  exports?: string[];
  imports?: string[];
  lines?: number;
}

export interface ComponentRelationship {
  from: string;
  to: string;
  type: 'imports' | 'uses' | 'extends' | 'implements' | 'composes' | 'inherits';
  description?: string;
}

export interface DataFlow {
  from: string;
  to: string;
  data: string;
  description: string;
}

export interface ArchitectureRecommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  impact: string;
}

export interface ProjectStatistics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  averageFileSize: number;
  languageDistribution: Record<string, number>;
  folderDistribution: Record<string, number>;
}

export interface ProjectMetadata {
  author?: string;
  license?: string;
  repository?: string;
  homepage?: string;
  version?: string;
  keywords?: string[];
  scripts?: Record<string, string>;
  environment?: Record<string, string>;
}

export interface SearchIndex {
  files: Map<string, SearchableFile>;
  functions: Map<string, SearchableFunction>;
  classes: Map<string, SearchableClass>;
  components: Map<string, SearchableComponent>;
  terms: Map<string, string[]>;
}

export interface SearchableFile {
  id: string;
  path: string;
  name: string;
  content: string;
  summary?: string;
  exports: string[];
  imports: string[];
}

export interface SearchableFunction {
  id: string;
  name: string;
  filePath: string;
  parameters: string[];
  returnType?: string;
  description?: string;
  lines?: number;
}

export interface SearchableClass {
  id: string;
  name: string;
  filePath: string;
  methods: string[];
  properties: string[];
  extends?: string;
  implements?: string[];
  description?: string;
}

export interface SearchableComponent {
  id: string;
  name: string;
  filePath: string;
  type: string;
  props?: string[];
  state?: string[];
  children?: string[];
  description?: string;
}

export interface LearningInsight {
  id: string;
  category: 'architecture' | 'pattern' | 'concept' | 'best-practice' | 'tip';
  title: string;
  description: string;
  relatedFiles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningPoints: string[];
  resources?: string[];
}

export interface AnalysisCache {
  projectId: string;
  timestamp: Date;
  checksum: string;
  data: string;
}

// Helper functions
export function createProject(id: string, name: string, rootFolder: ProjectFolder): Project {
  return {
    id,
    name,
    uploadedAt: new Date(),
    rootFolder,
    structure: {
      totalFiles: 0,
      totalFolders: 0,
      totalSize: 0,
      maxDepth: 0,
      fileTypes: {},
      folderBreakdown: [],
    },
    technologyProfile: {
      languages: [],
      frameworks: [],
      libraries: [],
      packageManagers: [],
      buildTools: [],
      configurationFiles: [],
      detectedFeatures: [],
      complexity: 'simple',
    },
    architecture: {
      pattern: { name: 'Unknown', category: 'monolithic', description: '' },
      description: '',
      layers: [],
      components: [],
      relationships: [],
      flow: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
    },
    statistics: {
      totalLines: 0,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      averageFileSize: 0,
      languageDistribution: {},
      folderDistribution: {},
    },
    metadata: {},
  };
}

export function calculateProjectStructure(project: Project): ProjectStructure {
  const stats = {
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    maxDepth: 0,
    fileTypes: {} as Record<string, number>,
    folderBreakdown: [] as FolderBreakdown[],
  };

  function analyzeFolder(folder: ProjectFolder, depth: number = 0): FolderBreakdown {
    let fileCount = 0;
    let totalSize = 0;
    let maxFileDepth = depth;

    const breakdown: FolderBreakdown = {
      path: folder.path,
      name: folder.name,
      fileCount: 0,
      totalSize: 0,
      depth,
      percentage: 0,
    };

    for (const file of folder.files) {
      if (file.type === 'file') {
        stats.totalFiles++;
        fileCount++;
        totalSize += file.size;
        stats.totalSize += file.size;

        const ext = file.extension || 'none';
        stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
      }
    }

    for (const subfolder of folder.subfolders) {
      stats.totalFolders++;
      const subBreakdown = analyzeFolder(subfolder, depth + 1);
      totalSize += subBreakdown.totalSize;
      maxFileDepth = Math.max(maxFileDepth, subBreakdown.depth);
    }

    breakdown.fileCount = fileCount;
    breakdown.totalSize = totalSize;
    breakdown.depth = maxFileDepth;
    stats.maxDepth = Math.max(stats.maxDepth, maxFileDepth);
    stats.folderBreakdown.push(breakdown);

    return breakdown;
  }

  analyzeFolder(project.rootFolder);

  // Calculate percentages
  for (const breakdown of stats.folderBreakdown) {
    breakdown.percentage = stats.totalSize > 0
      ? (breakdown.totalSize / stats.totalSize) * 100
      : 0;
  }

  // Sort by total size descending
  stats.folderBreakdown.sort((a, b) => b.totalSize - a.totalSize);

  return stats;
}

export default {
  createProject,
  calculateProjectStructure,
};
