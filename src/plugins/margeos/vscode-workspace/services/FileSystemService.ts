/**
 * FileSystemService.ts
 *
 * Service for file system operations, real-time sync, and file watching.
 */

import { FileNode } from '../models/FileNode';
import FileExplorerEngine from '../core/FileExplorerEngine';

export interface FileChangeEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  file: FileNode;
  oldPath?: string;
  timestamp: string;
}

export interface FileWatchOptions {
  recursive: boolean;
  ignorePatterns: string[];
  includeHidden: boolean;
}

export interface FileFilter {
  extensions?: string[];
  excludePatterns?: string[];
  maxSize?: number;
  minSize?: number;
}

export interface BatchOperation {
  type: 'create' | 'copy' | 'move' | 'delete';
  items: Array<{ source: string; target?: string }>;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errors?: string[];
}

export class FileSystemService {
  private static instance: FileSystemService;
  private engine: FileExplorerEngine;
  private watchers: Map<string, (event: FileChangeEvent) => void> = new Map();
  private pendingChanges: FileChangeEvent[] = [];
  private batchOperations: Map<string, BatchOperation> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    this.engine = FileExplorerEngine.getInstance();
  }

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  // File Operations
  createFile(projectId: string, name: string, path: string, content: string = ''): FileNode {
    const file = this.engine.createFile(projectId, name, path, content);
    this.notifyWatchers({
      type: 'created',
      file,
      timestamp: new Date().toISOString()
    });
    return file;
  }

  createFolder(projectId: string, name: string, path: string): FileNode {
    const folder = this.engine.createFolder(projectId, name, path);
    this.notifyWatchers({
      type: 'created',
      file: folder,
      timestamp: new Date().toISOString()
    });
    return folder;
  }

  renameFile(projectId: string, fileId: string, newName: string): FileNode | undefined {
    const file = this.engine.getFile(projectId, fileId);
    const result = this.engine.renameFile(projectId, fileId, newName);

    if (result.success && result.file) {
      this.notifyWatchers({
        type: 'renamed',
        file: result.file,
        oldPath: file?.path,
        timestamp: new Date().toISOString()
      });
      return result.file;
    }
    return undefined;
  }

  moveFile(projectId: string, fileId: string, newParentId: string | null, newPath: string): FileNode | undefined {
    const file = this.engine.getFile(projectId, fileId);
    const result = this.engine.moveFile(projectId, fileId, newParentId, newPath);

    if (result.success && result.file) {
      this.notifyWatchers({
        type: 'renamed',
        file: result.file,
        oldPath: file?.path,
        timestamp: new Date().toISOString()
      });
      return result.file;
    }
    return undefined;
  }

  deleteFile(projectId: string, fileId: string): boolean {
    const file = this.engine.getFile(projectId, fileId);
    const result = this.engine.deleteFile(projectId, fileId);

    if (result.success && file) {
      this.notifyWatchers({
        type: 'deleted',
        file,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  updateFileContent(projectId: string, fileId: string, content: string): FileNode | undefined {
    const file = this.engine.updateFileContent(projectId, fileId, content);

    if (file) {
      this.notifyWatchers({
        type: 'modified',
        file,
        timestamp: new Date().toISOString()
      });
    }
    return file;
  }

  // Query Operations
  getFile(projectId: string, fileId: string): FileNode | undefined {
    return this.engine.getFile(projectId, fileId);
  }

  getFileByPath(projectId: string, path: string): FileNode | undefined {
    return this.engine.getFileByPath(projectId, path);
  }

  getChildren(projectId: string, parentId: string | null): FileNode[] {
    return this.engine.getChildren(projectId, parentId);
  }

  getAllFiles(projectId: string): FileNode[] {
    return this.engine.getProjectFiles(projectId);
  }

  // Search
  searchFiles(projectId: string, query: string, options?: FileFilter): FileNode[] {
    let results = this.engine.searchFiles(projectId, query);

    if (options) {
      if (options.extensions && options.extensions.length > 0) {
        results = results.filter(f => f.extension && options.extensions!.includes(f.extension));
      }
      if (options.excludePatterns && options.excludePatterns.length > 0) {
        results = results.filter(f => {
          return !options.excludePatterns!.some(pattern => {
            const regex = new RegExp(pattern);
            return regex.test(f.name);
          });
        });
      }
      if (options.maxSize) {
        results = results.filter(f => (f.metadata.size || 0) <= options.maxSize!);
      }
      if (options.minSize) {
        results = results.filter(f => (f.metadata.size || 0) >= options.minSize!);
      }
    }

    return results;
  }

  searchByExtension(projectId: string, extension: string): FileNode[] {
    return this.engine.searchByExtension(projectId, extension);
  }

  searchByType(projectId: string, type: 'file' | 'directory'): FileNode[] {
    return this.engine.searchByType(projectId, type);
  }

  // Batch Operations
  async batchCreateFiles(
    projectId: string,
    files: Array<{ name: string; path: string; content?: string }>
  ): Promise<FileNode[]> {
    const operationId = `BATCH-${Date.now()}`;
    const operation: BatchOperation = {
      type: 'create',
      items: files.map(f => ({ source: `${f.path}/${f.name}` })),
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      errors: []
    };

    this.batchOperations.set(operationId, operation);
    const results: FileNode[] = [];

    for (const file of files) {
      try {
        const created = this.engine.createFile(projectId, file.name, file.path, file.content || '');
        results.push(created);
      } catch (error) {
        operation.errors!.push(`Failed to create ${file.name}: ${error}`);
      }
    }

    operation.status = operation.errors!.length === 0 ? 'completed' : 'failed';
    this.emit('batchOperationCompleted', { operationId, operation });

    return results;
  }

  async batchDeleteFiles(projectId: string, fileIds: string[]): Promise<number> {
    const operationId = `BATCH-${Date.now()}`;
    const operation: BatchOperation = {
      type: 'delete',
      items: fileIds.map(id => ({ source: id })),
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      errors: []
    };

    this.batchOperations.set(operationId, operation);
    let deletedCount = 0;

    for (const fileId of fileIds) {
      try {
        if (this.engine.deleteFile(projectId, fileId).success) {
          deletedCount++;
        }
      } catch (error) {
        operation.errors!.push(`Failed to delete ${fileId}: ${error}`);
      }
    }

    operation.status = operation.errors!.length === 0 ? 'completed' : 'failed';
    this.emit('batchOperationCompleted', { operationId, operation });

    return deletedCount;
  }

  async batchCopyFiles(
    projectId: string,
    sourceIds: string[],
    targetPath: string
  ): Promise<FileNode[]> {
    const operationId = `BATCH-${Date.now()}`;
    const operation: BatchOperation = {
      type: 'copy',
      items: sourceIds.map(id => ({ source: id, target: targetPath })),
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      errors: []
    };

    this.batchOperations.set(operationId, operation);
    const results: FileNode[] = [];

    for (const sourceId of sourceIds) {
      try {
        const source = this.engine.getFile(projectId, sourceId);
        if (source) {
          const copy = this.engine.createFile(
            projectId,
            source.name,
            targetPath,
            source.content || ''
          );
          results.push(copy);
        }
      } catch (error) {
        operation.errors!.push(`Failed to copy ${sourceId}: ${error}`);
      }
    }

    operation.status = operation.errors!.length === 0 ? 'completed' : 'failed';
    this.emit('batchOperationCompleted', { operationId, operation });

    return results;
  }

  getBatchOperation(operationId: string): BatchOperation | undefined {
    return this.batchOperations.get(operationId);
  }

  // File Watching
  watchPath(path: string, callback: (event: FileChangeEvent) => void): () => void {
    this.watchers.set(path, callback);
    return () => {
      this.watchers.delete(path);
    };
  }

  private notifyWatchers(event: FileChangeEvent): void {
    this.pendingChanges.push(event);

    this.watchers.forEach((callback, path) => {
      if (event.file.path.startsWith(path) || path === '*') {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in file watcher:', error);
        }
      }
    });

    this.emit('fileChanged', event);
  }

  getPendingChanges(): FileChangeEvent[] {
    return [...this.pendingChanges];
  }

  clearPendingChanges(): void {
    this.pendingChanges = [];
  }

  // Directory Operations
  isDirectoryEmpty(projectId: string, folderId: string): boolean {
    const children = this.engine.getChildren(projectId, folderId);
    return children.length === 0;
  }

  getDirectorySize(projectId: string, folderId: string): number {
    const files = this.engine.getProjectFiles(projectId);
    let totalSize = 0;

    const addSizeRecursively = (parentId: string) => {
      const children = this.engine.getChildren(projectId, parentId);
      for (const child of children) {
        if (child.type === 'file') {
          totalSize += child.metadata.size || 0;
        } else {
          addSizeRecursively(child.id);
        }
      }
    };

    addSizeRecursively(folderId);
    return totalSize;
  }

  countFiles(projectId: string, folderId: string): { files: number; directories: number } {
    const files = this.engine.getProjectFiles(projectId);
    let fileCount = 0;
    let dirCount = 0;

    const countRecursively = (parentId: string) => {
      const children = this.engine.getChildren(projectId, parentId);
      for (const child of children) {
        if (child.type === 'file') {
          fileCount++;
        } else {
          dirCount++;
          countRecursively(child.id);
        }
      }
    };

    countRecursively(folderId);
    return { files: fileCount, directories: dirCount };
  }

  // Path Utilities
  joinPaths(...parts: string[]): string {
    return parts.join('/').replace(/\/+/g, '/');
  }

  dirname(path: string): string {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/') || '/';
  }

  basename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  extname(path: string): string {
    const name = this.basename(path);
    const dotIndex = name.lastIndexOf('.');
    return dotIndex > 0 ? name.slice(dotIndex) : '';
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
}

export default FileSystemService;
