// @ts-nocheck
/**
 * Merge Verification and Duplicate Conflict Resolution Utilities
 * Checks for duplicate filename conflicts across merged archives and provides
 * deterministic resolution strategies (overwrite, rename, prefix, or skip).
 */

export interface MergeCandidateFile {
  id: string;
  sourceArchiveId: string;
  sourceArchiveName: string;
  originalPath: string;
  targetPath: string;
  resolvedPath: string;
  size: number;
  sizeFormatted: string;
  lastModified: number;
  lastModifiedFormatted: string;
  data: Uint8Array | ArrayBuffer;
  resolution: 'keep' | 'overwrite' | 'rename' | 'skip';
  isDuplicate: boolean;
  conflictGroupId?: string;
}

export interface DuplicateConflictGroup {
  conflictGroupId: string;
  targetPath: string;
  files: MergeCandidateFile[];
  resolved: boolean;
  selectedWinnerId?: string;
}

export interface MergeVerificationResult {
  hasConflicts: boolean;
  totalFiles: number;
  uniquePathsCount: number;
  conflictGroups: DuplicateConflictGroup[];
  files: MergeCandidateFile[];
}

/**
 * Format bytes to readable string
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Normalize path to prevent leading/trailing slashes and duplicate slashes
 */
export function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/^\//, '')
    .trim();
}

/**
 * Split path into directory and filename with extension
 */
export function splitPath(path: string): { dir: string; name: string; ext: string } {
  const normalized = normalizePath(path);
  const lastSlash = normalized.lastIndexOf('/');
  const dir = lastSlash !== -1 ? normalized.slice(0, lastSlash) : '';
  const fullName = lastSlash !== -1 ? normalized.slice(lastSlash + 1) : normalized;
  
  const lastDot = fullName.lastIndexOf('.');
  if (lastDot > 0) {
    return {
      dir,
      name: fullName.slice(0, lastDot),
      ext: fullName.slice(lastDot),
    };
  }
  return {
    dir,
    name: fullName,
    ext: '',
  };
}

/**
 * Analyze candidate files and group duplicate filename conflicts
 */
export function detectDuplicateConflicts(files: MergeCandidateFile[]): MergeVerificationResult {
  const pathMap = new Map<string, MergeCandidateFile[]>();

  for (const file of files) {
    const norm = normalizePath(file.targetPath);
    const list = pathMap.get(norm) || [];
    list.push(file);
    pathMap.set(norm, list);
  }

  const conflictGroups: DuplicateConflictGroup[] = [];
  const updatedFiles: MergeCandidateFile[] = [];

  for (const [targetPath, group] of pathMap.entries()) {
    const isConflict = group.length > 1;
    const conflictGroupId = isConflict ? `conflict-${targetPath.replace(/[^a-zA-Z0-9_-]/g, '_')}` : undefined;

    if (isConflict) {
      conflictGroups.push({
        conflictGroupId: conflictGroupId!,
        targetPath,
        files: group.map((f) => ({
          ...f,
          isDuplicate: true,
          conflictGroupId,
        })),
        resolved: false,
      });
    }

    for (const f of group) {
      updatedFiles.push({
        ...f,
        isDuplicate: isConflict,
        conflictGroupId,
        resolvedPath: f.resolvedPath || f.targetPath,
      });
    }
  }

  return {
    hasConflicts: conflictGroups.length > 0,
    totalFiles: files.length,
    uniquePathsCount: pathMap.size,
    conflictGroups,
    files: updatedFiles,
  };
}

/**
 * Automatically resolve duplicate conflicts according to a predefined strategy
 */
export function autoResolveConflicts(
  files: MergeCandidateFile[],
  strategy: 'rename-prefix' | 'rename-number' | 'overwrite-latest' | 'overwrite-first'
): MergeCandidateFile[] {
  const pathMap = new Map<string, MergeCandidateFile[]>();

  for (const file of files) {
    const norm = normalizePath(file.targetPath);
    const list = pathMap.get(norm) || [];
    list.push({ ...file });
    pathMap.set(norm, list);
  }

  const resolved: MergeCandidateFile[] = [];

  for (const [targetPath, group] of pathMap.entries()) {
    if (group.length === 1) {
      resolved.push({
        ...group[0],
        resolution: 'keep',
        resolvedPath: group[0].targetPath,
      });
      continue;
    }

    const { dir, name, ext } = splitPath(targetPath);

    if (strategy === 'rename-prefix') {
      group.forEach((item, index) => {
        const safeArchiveName = item.sourceArchiveName.replace(/\.zip$/i, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const newFileName = `${safeArchiveName}_${name}${ext}`;
        const newPath = dir ? `${dir}/${newFileName}` : newFileName;
        resolved.push({
          ...item,
          resolution: 'rename',
          resolvedPath: newPath,
        });
      });
    } else if (strategy === 'rename-number') {
      group.forEach((item, index) => {
        if (index === 0) {
          resolved.push({
            ...item,
            resolution: 'keep',
            resolvedPath: targetPath,
          });
        } else {
          const newFileName = `${name}_${index + 1}${ext}`;
          const newPath = dir ? `${dir}/${newFileName}` : newFileName;
          resolved.push({
            ...item,
            resolution: 'rename',
            resolvedPath: newPath,
          });
        }
      });
    } else if (strategy === 'overwrite-latest') {
      // Find the file with the most recent lastModified
      let latestIndex = 0;
      let latestTime = group[0].lastModified || 0;
      group.forEach((item, idx) => {
        if ((item.lastModified || 0) > latestTime) {
          latestTime = item.lastModified;
          latestIndex = idx;
        }
      });

      group.forEach((item, idx) => {
        if (idx === latestIndex) {
          resolved.push({
            ...item,
            resolution: 'keep',
            resolvedPath: targetPath,
          });
        } else {
          resolved.push({
            ...item,
            resolution: 'overwrite',
            resolvedPath: targetPath,
          });
        }
      });
    } else if (strategy === 'overwrite-first') {
      group.forEach((item, idx) => {
        if (idx === 0) {
          resolved.push({
            ...item,
            resolution: 'keep',
            resolvedPath: targetPath,
          });
        } else {
          resolved.push({
            ...item,
            resolution: 'overwrite',
            resolvedPath: targetPath,
          });
        }
      });
    }
  }

  return resolved;
}

/**
 * Validate that there are no collision conflicts remaining among non-skipped/non-overwritten files
 */
export function validateFinalFiles(files: MergeCandidateFile[]): {
  isValid: boolean;
  activeFiles: MergeCandidateFile[];
  remainingCollisions: string[];
} {
  const activeFiles = files.filter((f) => f.resolution !== 'overwrite' && f.resolution !== 'skip');
  const seenPaths = new Map<string, string>(); // path -> file id
  const remainingCollisions: string[] = [];

  for (const f of activeFiles) {
    const p = normalizePath(f.resolvedPath || f.targetPath);
    if (!p) {
      remainingCollisions.push(`Empty file path for source "${f.sourceArchiveName}" / "${f.originalPath}"`);
      continue;
    }
    if (seenPaths.has(p)) {
      if (!remainingCollisions.includes(p)) {
        remainingCollisions.push(p);
      }
    } else {
      seenPaths.set(p, f.id);
    }
  }

  return {
    isValid: remainingCollisions.length === 0,
    activeFiles,
    remainingCollisions,
  };
}
