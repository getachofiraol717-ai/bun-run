/**
 * Archive Utilities for Terminal Sandbox
 * Helper functions for archive operations
 */

import type { ArchiveEntry } from '../runtimes/ZipTools';

/**
 * Parse archive path
 */
export function parseArchivePath(path: string): {
  baseName: string;
  extension: string;
  directory: string;
} {
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  const directory = parts.slice(0, -1).join('/') || '/';

  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex + 1) : '';

  return { baseName, extension, directory };
}

/**
 * Get archive type from extension
 */
export function getArchiveType(extension: string): 'zip' | 'tar' | 'gzip' | 'bzip2' | null {
  const types: Record<string, 'zip' | 'tar' | 'gzip' | 'bzip2'> = {
    zip: 'zip',
    tar: 'tar',
    gz: 'gzip',
    gzip: 'gzip',
    bz2: 'bzip2',
    bzip2: 'bzip2',
    tgz: 'tar',
    taz: 'tar',
    'tar.gz': 'tar',
    'tar.bz2': 'tar',
  };

  return types[extension.toLowerCase()] || null;
}

/**
 * Get icon for archive type
 */
export function getArchiveIcon(extension: string): string {
  const icons: Record<string, string> = {
    zip: '📦',
    tar: '🗃️',
    gz: '🗜️',
    gzip: '🗜️',
    bz2: '🗜️',
    bzip2: '🗜️',
    rar: '📚',
    '7z': '📚',
  };

  return icons[extension.toLowerCase()] || '📁';
}

/**
 * Estimate compression ratio
 */
export function estimateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return ((originalSize - compressedSize) / originalSize) * 100;
}

/**
 * Format compression stats
 */
export function formatCompressionStats(
  originalSize: number,
  compressedSize: number
): string {
  const ratio = estimateCompressionRatio(originalSize, compressedSize);
  const saved = originalSize - compressedSize;

  return `${formatSize(compressedSize)} / ${formatSize(originalSize)} (${ratio.toFixed(1)}% smaller, saved ${formatSize(saved)})`;
}

/**
 * Format size
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * Filter archive entries
 */
export function filterArchiveEntries(
  entries: ArchiveEntry[],
  options: {
    pattern?: string;
    showDirectories?: boolean;
    showHidden?: boolean;
    type?: 'all' | 'files' | 'directories';
  } = {}
): ArchiveEntry[] {
  let filtered = [...entries];

  // Filter by type
  if (options.type === 'files') {
    filtered = filtered.filter((e) => !e.isDirectory);
  } else if (options.type === 'directories') {
    filtered = filtered.filter((e) => e.isDirectory);
  }

  // Filter hidden
  if (!options.showHidden) {
    filtered = filtered.filter((e) => !e.name.startsWith('.'));
  }

  // Filter by pattern
  if (options.pattern) {
    const lowerPattern = options.pattern.toLowerCase();
    filtered = filtered.filter((e) => e.name.toLowerCase().includes(lowerPattern));
  }

  return filtered;
}

/**
 * Sort archive entries
 */
export function sortArchiveEntries(
  entries: ArchiveEntry[],
  options: {
    order?: 'asc' | 'desc';
    sortBy?: 'name' | 'size' | 'date' | 'type';
  } = {}
): ArchiveEntry[] {
  const { order = 'asc', sortBy = 'name' } = options;

  return [...entries].sort((a, b) => {
    // Directories first
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }

    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'date':
        comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
        break;
      case 'type':
        comparison = a.name.localeCompare(b.name);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Get entry path depth
 */
export function getEntryDepth(path: string): number {
  return path.split('/').filter(Boolean).length;
}

/**
 * Group entries by directory
 */
export function groupByDirectory(
  entries: ArchiveEntry[]
): Map<string, ArchiveEntry[]> {
  const groups = new Map<string, ArchiveEntry[]>();

  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean);
    const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : '/';

    if (!groups.has(directory)) {
      groups.set(directory, []);
    }

    groups.get(directory)!.push(entry);
  }

  return groups;
}

/**
 * Find duplicate entries
 */
export function findDuplicates(
  entries: ArchiveEntry[]
): Map<string, ArchiveEntry[]> {
  const byName = new Map<string, ArchiveEntry[]>();

  for (const entry of entries) {
    if (!byName.has(entry.name)) {
      byName.set(entry.name, []);
    }
    byName.get(entry.name)!.push(entry);
  }

  // Filter to only duplicates
  const duplicates = new Map<string, ArchiveEntry[]>();
  for (const [name, group] of byName) {
    if (group.length > 1) {
      duplicates.set(name, group);
    }
  }

  return duplicates;
}

/**
 * Calculate total uncompressed size
 */
export function getTotalUncompressedSize(entries: ArchiveEntry[]): number {
  return entries.reduce((sum, e) => sum + e.size, 0);
}

/**
 * Calculate total compressed size
 */
export function getTotalCompressedSize(entries: ArchiveEntry[]): number {
  return entries.reduce((sum, e) => sum + e.compressedSize, 0);
}

/**
 * Get archive statistics
 */
export function getArchiveStats(entries: ArchiveEntry[]): {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  compressedSize: number;
  compressionRatio: number;
  largestFile: ArchiveEntry | null;
  newestFile: ArchiveEntry | null;
} {
  const files = entries.filter((e) => !e.isDirectory);
  const directories = entries.filter((e) => e.isDirectory);

  const totalSize = getTotalUncompressedSize(entries);
  const compressedSize = getTotalCompressedSize(entries);

  let largestFile: ArchiveEntry | null = null;
  let newestFile: ArchiveEntry | null = null;

  for (const entry of files) {
    if (!largestFile || entry.size > largestFile.size) {
      largestFile = entry;
    }
    if (!newestFile || entry.modifiedAt > newestFile.modifiedAt) {
      newestFile = entry;
    }
  }

  return {
    totalFiles: files.length,
    totalDirectories: directories.length,
    totalSize,
    compressedSize,
    compressionRatio: estimateCompressionRatio(totalSize, compressedSize),
    largestFile,
    newestFile,
  };
}

/**
 * Validate archive name
 */
export function validateArchiveName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Archive name cannot be empty' };
  }

  if (name.length > 255) {
    return { valid: false, error: 'Archive name too long' };
  }

  const invalidChars = /[\x00-\x1f<>:"/\\|?*\x2f]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: 'Archive name contains invalid characters' };
  }

  return { valid: true };
}

export default {
  parseArchivePath,
  getArchiveType,
  getArchiveIcon,
  estimateCompressionRatio,
  formatCompressionStats,
  formatSize,
  filterArchiveEntries,
  sortArchiveEntries,
  getEntryDepth,
  groupByDirectory,
  findDuplicates,
  getTotalUncompressedSize,
  getTotalCompressedSize,
  getArchiveStats,
  validateArchiveName,
};
