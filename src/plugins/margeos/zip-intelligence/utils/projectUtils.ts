/**
 * Project Utilities
 * Helper functions for project operations
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface ProjectStats {
  totalFiles: number;
  totalFolders: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  totalSize: number;
  languages: Record<string, number>;
  largestFiles: Array<{ name: string; path: string; lines: number }>;
  newestFile?: string;
  oldestFile?: string;
}

/**
 * Calculate comprehensive project statistics
 */
export function calculateProjectStats(project: Project): ProjectStats {
  const files = flattenFiles(project.rootFolder);

  let totalLines = 0;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let totalSize = 0;
  const languages: Record<string, number> = {};
  const largestFiles: Array<{ name: string; path: string; lines: number }> = [];

  for (const file of files) {
    if (!file.content) continue;

    const lines = file.content.split('\n');
    const fileLines = lines.length;
    const fileCodeLines = lines.filter((l) => {
      const trimmed = l.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('#') && !trimmed.startsWith('/*');
    }).length;
    const fileCommentLines = lines.filter((l) => {
      const trimmed = l.trim();
      return trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    }).length;
    const fileBlankLines = lines.filter((l) => l.trim().length === 0).length;

    totalLines += fileLines;
    codeLines += fileCodeLines;
    commentLines += fileCommentLines;
    blankLines += fileBlankLines;
    totalSize += file.size || 0;

    // Count by language
    const lang = getLanguage(file.extension);
    languages[lang] = (languages[lang] || 0) + fileLines;

    // Track largest files
    largestFiles.push({
      name: file.name,
      path: file.path,
      lines: fileLines,
    });
  }

  // Sort and take top 10 largest files
  largestFiles.sort((a, b) => b.lines - a.lines);
  const topLargest = largestFiles.slice(0, 10);

  return {
    totalFiles: files.length,
    totalFolders: countFolders(project.rootFolder),
    totalLines,
    codeLines,
    commentLines,
    blankLines,
    totalSize,
    languages,
    largestFiles: topLargest,
  };
}

/**
 * Flatten folder structure to file list
 */
export function flattenFiles(folder: ProjectFolder): ProjectFile[] {
  const files: ProjectFile[] = [...folder.files];

  for (const subfolder of folder.subfolders) {
    files.push(...flattenFiles(subfolder));
  }

  return files;
}

/**
 * Count total folders
 */
export function countFolders(folder: ProjectFolder): number {
  let count = folder.subfolders.length;

  for (const subfolder of folder.subfolders) {
    count += countFolders(subfolder);
  }

  return count;
}

/**
 * Get language from extension
 */
export function getLanguage(extension: string): string {
  const ext = extension.toLowerCase();

  const languageMap: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
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
    '.sass': 'Sass',
    '.less': 'Less',
    '.json': 'JSON',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.xml': 'XML',
    '.md': 'Markdown',
    '.sql': 'SQL',
    '.sh': 'Shell',
    '.bash': 'Bash',
  };

  return languageMap[ext] || 'Other';
}

/**
 * Find file by path
 */
export function findFileByPath(project: Project, path: string): ProjectFile | null {
  const files = flattenFiles(project.rootFolder);
  return files.find((f) => f.path === path) || null;
}

/**
 * Find files by name pattern
 */
export function findFilesByName(project: Project, pattern: string, caseSensitive: boolean = false): ProjectFile[] {
  const files = flattenFiles(project.rootFolder);
  const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

  return files.filter((f) => {
    const name = caseSensitive ? f.name : f.name.toLowerCase();
    return name.includes(searchPattern);
  });
}

/**
 * Find files by extension
 */
export function findFilesByExtension(project: Project, extensions: string[]): ProjectFile[] {
  const files = flattenFiles(project.rootFolder);
  const normalizedExts = extensions.map((e) => e.toLowerCase());

  return files.filter((f) => normalizedExts.includes(f.extension.toLowerCase()));
}

/**
 * Search files by content
 */
export function searchInFiles(project: Project, query: string): Array<{
  file: ProjectFile;
  matches: number;
  preview: string;
}> {
  const files = flattenFiles(project.rootFolder);
  const results: Array<{ file: ProjectFile; matches: number; preview: string }> = [];
  const lowerQuery = query.toLowerCase();

  for (const file of files) {
    if (!file.content) continue;

    const lowerContent = file.content.toLowerCase();
    let matches = 0;
    let index = 0;

    while ((index = lowerContent.indexOf(lowerQuery, index)) !== -1) {
      matches++;
      index += query.length;
    }

    if (matches > 0) {
      // Find preview text
      const firstMatchIndex = lowerContent.indexOf(lowerQuery);
      const previewStart = Math.max(0, firstMatchIndex - 50);
      const previewEnd = Math.min(file.content.length, firstMatchIndex + query.length + 50);
      const preview = file.content.slice(previewStart, previewEnd).replace(/\n/g, ' ');

      results.push({
        file,
        matches,
        preview: `...${preview}...`,
      });
    }
  }

  // Sort by matches
  results.sort((a, b) => b.matches - a.matches);

  return results;
}

/**
 * Get project tree as string
 */
export function getProjectTree(project: Project, maxDepth: number = 3, indent: string = ''): string {
  const lines: string[] = [];
  const rootIndent = indent || '📁 ';

  lines.push(`${rootIndent}${project.name}/`);

  if (project.rootFolder.subfolders.length > 0) {
    lines.push(...formatFolderTree(project.rootFolder, 1, maxDepth));
  }

  // Show top-level files
  const topFiles = project.rootFolder.files.slice(0, 10);
  for (const file of topFiles) {
    lines.push(`${'  '.repeat(Math.min(maxDepth, 3))}📄 ${file.name}`);
  }

  if (project.rootFolder.files.length > 10) {
    lines.push(`${'  '.repeat(Math.min(maxDepth, 3))}... and ${project.rootFolder.files.length - 10} more files`);
  }

  return lines.join('\n');
}

/**
 * Format folder tree recursively
 */
function formatFolderTree(folder: ProjectFolder, depth: number, maxDepth: number): string[] {
  if (depth > maxDepth) return [];

  const lines: string[] = [];

  for (const subfolder of folder.subfolders) {
    const prefix = '  '.repeat(depth);
    lines.push(`${prefix}📁 ${subfolder.name}/`);

    // Show files in this folder
    const topFiles = subfolder.files.slice(0, 3);
    for (const file of topFiles) {
      lines.push(`${prefix}  📄 ${file.name}`);
    }

    if (subfolder.files.length > 3) {
      lines.push(`${prefix}  ... and ${subfolder.files.length - 3} more files`);
    }

    // Recurse
    lines.push(...formatFolderTree(subfolder, depth + 1, maxDepth));
  }

  return lines;
}

/**
 * Generate project summary
 */
export function generateProjectSummary(project: Project): string {
  const stats = calculateProjectStats(project);

  const lines = [
    `# ${project.name}`,
    '',
    project.description || 'No description provided.',
    '',
    '## Statistics',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Files | ${stats.totalFiles} |`,
    `| Total Folders | ${stats.totalFolders} |`,
    `| Total Lines | ${stats.totalLines} |`,
    `| Code Lines | ${stats.codeLines} |`,
    `| Comments | ${stats.commentLines} |`,
    `| Total Size | ${formatSize(stats.totalSize)} |`,
    '',
    '## Languages',
    '',
  ];

  // Sort languages by lines
  const sortedLanguages = Object.entries(stats.languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  for (const [lang, lines_count] of sortedLanguages) {
    const percentage = ((lines_count / stats.totalLines) * 100).toFixed(1);
    lines.push(`- ${lang}: ${lines_count} lines (${percentage}%)`);
  }

  lines.push('', '## Architecture');

  if (project.architecture.pattern.name) {
    lines.push(`**Pattern:** ${project.architecture.pattern.name}`);
  }

  if (project.architecture.layers.length > 0) {
    lines.push('', '**Layers:**');
    for (const layer of project.architecture.layers) {
      lines.push(`- ${layer.name}: ${layer.description}`);
    }
  }

  return lines.join('\n');
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
 * Copy project (deep clone)
 */
export function cloneProject(project: Project): Project {
  return JSON.parse(JSON.stringify(project));
}

/**
 * Compare two projects
 */
export function compareProjects(
  before: Project,
  after: Project
): {
  added: string[];
  removed: string[];
  modified: string[];
} {
  const beforeFiles = new Set(flattenFiles(before.rootFolder).map((f) => f.path));
  const afterFiles = new Set(flattenFiles(after.rootFolder).map((f) => f.path));

  const added: string[] = [];
  const removed: string[] = [];
  const modified: string[] = [];

  for (const path of afterFiles) {
    if (!beforeFiles.has(path)) {
      added.push(path);
    }
  }

  for (const path of beforeFiles) {
    if (!afterFiles.has(path)) {
      removed.push(path);
    } else if (!added.includes(path)) {
      // Check for modifications
      const beforeFile = findFileByPath(before, path);
      const afterFile = findFileByPath(after, path);

      if (beforeFile && afterFile && beforeFile.content !== afterFile.content) {
        modified.push(path);
      }
    }
  }

  return { added, removed, modified };
}

export default {
  calculateProjectStats,
  flattenFiles,
  countFolders,
  getLanguage,
  findFileByPath,
  findFilesByName,
  findFilesByExtension,
  searchInFiles,
  getProjectTree,
  generateProjectSummary,
  formatSize,
  cloneProject,
  compareProjects,
};
