/**
 * Workspace Utilities for Terminal Sandbox
 * Helper functions for workspace operations
 */

import type { Workspace, WorkspaceFile } from '../models/types';

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Check if file is hidden
 */
export function isHiddenFile(filename: string): boolean {
  return filename.startsWith('.');
}

/**
 * Check if path is directory
 */
export function isDirectory(path: string): boolean {
  return path.endsWith('/');
}

/**
 * Get parent directory
 */
export function getParentDirectory(path: string): string {
  if (path === '/') return '/';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

/**
 * Join path segments
 */
export function joinPath(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/');
}

/**
 * Normalize path
 */
export function normalizePath(path: string): string {
  let normalized = path.replace(/\\/g, '/');

  // Remove duplicate slashes
  normalized = normalized.replace(/\/+/g, '/');

  // Remove /./ components
  normalized = normalized.replace(/\/\.\//g, '/');

  // Handle ../ components
  const parts = normalized.split('/').filter(Boolean);
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === '..') {
      if (resolved.length > 0) {
        resolved.pop();
      }
    } else if (part !== '.') {
      resolved.push(part);
    }
  }

  return '/' + resolved.join('/');
}

/**
 * Get relative path
 */
export function getRelativePath(from: string, to: string): string {
  const fromParts = normalizePath(from).split('/').filter(Boolean);
  const toParts = normalizePath(to).split('/').filter(Boolean);

  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
    i++;
  }

  const upCount = fromParts.length - i;
  const downPath = toParts.slice(i);

  return [...Array(upCount).fill('..'), ...downPath].join('/') || '.';
}

/**
 * Check if path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  return path.startsWith('/');
}

/**
 * Get filename from path
 */
export function getFilename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || path;
}

/**
 * Get directory from path
 */
export function getDirectory(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.slice(0, lastSlash) : '/';
}

/**
 * Check if file matches glob pattern
 */
export function matchesGlob(filename: string, pattern: string): boolean {
  const regex = new RegExp(
    '^' +
      pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') +
      '$'
  );

  return regex.test(filename);
}

/**
 * Get file type category
 */
export function getFileType(filename: string): 'code' | 'text' | 'data' | 'image' | 'archive' | 'other' {
  const ext = getFileExtension(filename);

  const codeExts = [
    'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp',
    'go', 'rs', 'swift', 'kt', 'scala', 'cs', 'vb', 'fs', 'lua', 'pl', 'r',
    'sh', 'bash', 'zsh', 'fish', 'ps1', 'sql', 'graphql', 'yaml', 'yml', 'toml',
    'json', 'xml', 'html', 'css', 'scss', 'sass', 'less', 'md', 'markdown',
  ];

  const textExts = ['txt', 'log', 'csv', 'ini', 'cfg', 'conf', 'env', 'properties'];

  const dataExts = ['json', 'xml', 'yaml', 'yml', 'toml', 'csv', 'tsv'];

  const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'ico', 'webp', 'tiff'];

  const archiveExts = ['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar', 'tgz'];

  if (codeExts.includes(ext)) return 'code';
  if (textExts.includes(ext)) return 'text';
  if (dataExts.includes(ext)) return 'data';
  if (imageExts.includes(ext)) return 'image';
  if (archiveExts.includes(ext)) return 'archive';

  return 'other';
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);

  const mimeTypes: Record<string, string> = {
    // Code
    js: 'application/javascript',
    ts: 'application/typescript',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    css: 'text/css',
    md: 'text/markdown',
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    // Archives
    zip: 'application/zip',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Sort files (directories first, then by name)
 */
export function sortFiles<T extends { name: string; isDirectory?: boolean }>(
  files: T[],
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...files].sort((a, b) => {
    const aIsDir = 'isDirectory' in a ? a.isDirectory : false;
    const bIsDir = 'isDirectory' in b ? b.isDirectory : false;

    // Directories first
    if (aIsDir !== bIsDir) {
      return aIsDir ? -1 : 1;
    }

    // Then alphabetically
    const comparison = a.name.localeCompare(b.name);
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filter files by pattern
 */
export function filterFiles<T extends { name: string }>(
  files: T[],
  pattern?: string,
  showHidden: boolean = false
): T[] {
  let filtered = files;

  // Filter hidden files
  if (!showHidden) {
    filtered = filtered.filter((f) => !isHiddenFile(f.name));
  }

  // Filter by pattern
  if (pattern) {
    const lowerPattern = pattern.toLowerCase();
    filtered = filtered.filter((f) => f.name.toLowerCase().includes(lowerPattern));
  }

  return filtered;
}

/**
 * Get total size of files
 */
export function getTotalSize(files: WorkspaceFile[]): number {
  return files.reduce((total, file) => total + (file.size || 0), 0);
}

/**
 * Count files by type
 */
export function countByType(
  files: WorkspaceFile[]
): Record<string, number> {
  return files.reduce((counts, file) => {
    const type = getFileType(file.name);
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

/**
 * Get workspace tree structure
 */
export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  file?: WorkspaceFile;
}

export function buildFileTree(files: WorkspaceFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const directories: Map<string, FileTreeNode> = new Map();

  // Sort files so directories come first
  const sortedFiles = sortFiles(files);

  for (const file of sortedFiles) {
    const parts = file.path.split('/').filter(Boolean);
    let currentPath = '';
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      currentPath = '/' + parts.slice(0, i + 1).join('/');

      let node = directories.get(currentPath);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          isDirectory: !isLast || file.path.endsWith('/'),
          children: [],
          file: isLast ? file : undefined,
        };

        directories.set(currentPath, node);
        currentLevel.push(node);
      }

      if (!isLast) {
        currentLevel = node.children!;
      }
    }
  }

  return root;
}

export default {
  getFileExtension,
  isHiddenFile,
  isDirectory,
  getParentDirectory,
  joinPath,
  normalizePath,
  getRelativePath,
  isAbsolutePath,
  getFilename,
  getDirectory,
  matchesGlob,
  getFileType,
  getMimeType,
  sortFiles,
  filterFiles,
  getTotalSize,
  countByType,
  buildFileTree,
};
