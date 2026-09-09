// @ts-nocheck
/**
 * Archive Utilities
 * Helper functions for archive operations
 */

import { ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface ArchiveInfo {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  compressionRatio: number;
  fileTypes: Record<string, number>;
  largestFiles: Array<{ name: string; size: number }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Calculate statistics for an archive
 */
export function calculateArchiveInfo(files: ProjectFile[]): ArchiveInfo {
  const fileTypes: Record<string, number> = {};
  let totalSize = 0;
  const largestFiles: Array<{ name: string; size: number }> = [];

  for (const file of files) {
    const ext = file.extension.toLowerCase() || 'no-extension';
    fileTypes[ext] = (fileTypes[ext] || 0) + 1;
    totalSize += file.size || 0;

    largestFiles.push({
      name: file.name,
      size: file.size || 0,
    });
  }

  // Sort and take top 5 largest files
  largestFiles.sort((a, b) => b.size - a.size);
  const topLargest = largestFiles.slice(0, 5);

  return {
    totalFiles: files.length,
    totalFolders: 0, // Calculated separately
    totalSize,
    compressionRatio: 0, // Would need original size
    fileTypes,
    largestFiles: topLargest,
  };
}

/**
 * Validate a file before processing
 */
export function validateFile(file: File, options: {
  maxSize?: number;
  allowedExtensions?: string[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file extension
  const ext = getExtension(file.name);
  if (options.allowedExtensions && !options.allowedExtensions.includes(ext)) {
    errors.push(`File type not allowed: ${ext}`);
  }

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    errors.push(`File too large: ${formatSize(file.size)} (max: ${formatSize(options.maxSize)})`);
  }

  // Warnings for large files
  if (file.size > 50 * 1024 * 1024) {
    warnings.push('Large file detected. Processing may take longer.');
  }

  // Warnings for certain file types
  if (ext === '.zip' && file.size < 1024) {
    warnings.push('Small ZIP file detected. May not contain expected content.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get file extension
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : '';
}

/**
 * Format file size
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

/**
 * Extract path components
 */
export function parsePath(path: string): {
  directory: string;
  filename: string;
  extension: string;
} {
  const segments = path.split('/');
  const filename = segments.pop() || '';
  const directory = segments.join('/');

  const ext = getExtension(filename);

  return {
    directory,
    filename,
    extension: ext,
  };
}

/**
 * Build folder structure from flat file list
 */
export function buildFolderStructure(files: ProjectFile[]): ProjectFolder {
  const root: ProjectFolder = {
    id: 'root',
    name: 'root',
    path: '',
    files: [],
    subfolders: [],
    fileCount: 0,
    folderCount: 0,
  };

  const folderMap = new Map<string, ProjectFolder>();

  // Sort files by path depth
  const sortedFiles = [...files].sort((a, b) => {
    const depthA = a.path.split('/').length;
    const depthB = b.path.split('/').length;
    return depthA - depthB;
  });

  for (const file of sortedFiles) {
    const pathParts = file.path.split('/').filter(Boolean);

    if (pathParts.length === 0) {
      root.files.push(file);
      root.fileCount++;
      continue;
    }

    // Build folder hierarchy
    let currentPath = '';
    let parentFolder = root;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i];
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!folderMap.has(currentPath)) {
        const newFolder: ProjectFolder = {
          id: currentPath,
          name: folderName,
          path: currentPath,
          files: [],
          subfolders: [],
          fileCount: 0,
          folderCount: 0,
        };

        folderMap.set(currentPath, newFolder);
        parentFolder.subfolders.push(newFolder);
        parentFolder.folderCount++;
      }

      parentFolder = folderMap.get(currentPath)!;
    }

    // Add file to appropriate folder
    parentFolder.files.push(file);
    parentFolder.fileCount++;
    root.fileCount++;
  }

  // Calculate folder counts recursively
  const countFolders = (folder: ProjectFolder): number => {
    let count = folder.subfolders.length;
    for (const subfolder of folder.subfolders) {
      count += countFolders(subfolder);
    }
    return count;
  };

  root.folderCount = countFolders(root);

  return root;
}

/**
 * Flatten folder structure to file list
 */
export function flattenFolderStructure(folder: ProjectFolder): ProjectFile[] {
  const files: ProjectFile[] = [...folder.files];

  for (const subfolder of folder.subfolders) {
    files.push(...flattenFolderStructure(subfolder));
  }

  return files;
}

/**
 * Get file type category
 */
export function getFileCategory(extension: string): string {
  const ext = extension.toLowerCase();

  const categories: Record<string, string[]> = {
    'code': ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.go', '.rs', '.rb', '.php'],
    'style': ['.css', '.scss', '.sass', '.less', '.styl'],
    'data': ['.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.csv'],
    'document': ['.md', '.txt', '.pdf', '.doc', '.docx'],
    'config': ['.env', '.gitignore', '.npmrc', '.prettierrc', '.eslintrc'],
    'image': ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'],
    'font': ['.woff', '.woff2', '.ttf', '.eot', '.otf'],
    'archive': ['.zip', '.tar', '.gz', '.rar', '.7z'],
    'audio': ['.mp3', '.wav', '.ogg', '.flac', '.m4a'],
    'video': ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'other';
}

/**
 * Check if file is binary
 */
export function isBinaryFile(extension: string): boolean {
  const ext = extension.toLowerCase();
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.mp3', '.wav', '.ogg', '.flac', '.m4a',
    '.mp4', '.webm', '.mov', '.avi', '.mkv',
    '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
    '.exe', '.dll', '.so', '.dylib',
  ];

  return binaryExtensions.includes(ext);
}

/**
 * Get language from filename
 */
export function getLanguageFromFilename(filename: string): string {
  const ext = getExtension(filename);

  const languageMap: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.py': 'Python',
    '.java': 'Java',
    '.cs': 'C#',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.dart': 'Dart',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.md': 'Markdown',
    '.sql': 'SQL',
    '.sh': 'Shell',
  };

  return languageMap[ext] || 'Unknown';
}

export default {
  calculateArchiveInfo,
  validateFile,
  getExtension,
  formatSize,
  formatDuration,
  parsePath,
  buildFolderStructure,
  flattenFolderStructure,
  getFileCategory,
  isBinaryFile,
  getLanguageFromFilename,
};
