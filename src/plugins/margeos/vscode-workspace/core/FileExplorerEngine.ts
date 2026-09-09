/**
 * FileExplorerEngine.ts
 *
 * Engine for managing file explorer operations, tree building, and file system operations.
 */

import {
  FileNode,
  FileNodeType,
  createFileNode,
  createDirectory,
  buildFileTree,
  sortFileNodes,
  getFileExtension,
  getLanguageFromExtension,
  updateFileContent,
  renameFileNode,
  moveFileNode,
  isHiddenFile,
  isSystemDirectory,
  FileNodeTree
} from '../models/FileNode';

const STORAGE_KEY = 'file_explorer_data';

export interface FileExplorerState {
  expandedFolders: Set<string>;
  selectedFiles: Set<string>;
  clipboard: { nodes: FileNode[]; operation: 'cut' | 'copy' } | null;
  lastRefresh: string;
}

export interface FileOperationResult {
  success: boolean;
  file?: FileNode;
  error?: string;
}

export class FileExplorerEngine {
  private static instance: FileExplorerEngine;
  private fileNodes: Map<string, Map<string, FileNode>> = new Map();
  private state: FileExplorerState = {
    expandedFolders: new Set(),
    selectedFiles: new Set(),
    clipboard: null,
    lastRefresh: new Date().toISOString()
  };
  private listeners: Map<string, Set<Function>> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.loadState();
  }

  static getInstance(): FileExplorerEngine {
    if (!FileExplorerEngine.instance) {
      FileExplorerEngine.instance = new FileExplorerEngine();
    }
    return FileExplorerEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadState();
    this.initialized = true;
    this.emit('initialized', {});
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.state.expandedFolders = new Set(data.expandedFolders || []);
        this.state.selectedFiles = new Set(data.selectedFiles || []);
        this.state.lastRefresh = data.lastRefresh || new Date().toISOString();
      }
    } catch (error) {
      console.error('Failed to load file explorer state:', error);
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        expandedFolders: Array.from(this.state.expandedFolders),
        selectedFiles: Array.from(this.state.selectedFiles),
        lastRefresh: this.state.lastRefresh
      }));
    } catch (error) {
      console.error('Failed to save file explorer state:', error);
    }
  }

  // File Operations
  createFile(projectId: string, name: string, path: string, content: string = ''): FileNode {
    const file = createFileNode(projectId, name, `${path}/${name}`, null, 'file', content);

    if (!this.fileNodes.has(projectId)) {
      this.fileNodes.set(projectId, new Map());
    }
    this.fileNodes.get(projectId)!.set(file.id, file);

    this.updateParentChildCount(projectId, path);
    this.saveState();
    this.emit('fileCreated', { projectId, file });

    return file;
  }

  createFolder(projectId: string, name: string, path: string): FileNode {
    const folder = createDirectory(projectId, name, `${path}/${name}`, null);

    if (!this.fileNodes.has(projectId)) {
      this.fileNodes.set(projectId, new Map());
    }
    this.fileNodes.get(projectId)!.set(folder.id, folder);

    this.updateParentChildCount(projectId, path);
    this.saveState();
    this.emit('folderCreated', { projectId, folder });

    return folder;
  }

  renameFile(projectId: string, fileId: string, newName: string): FileOperationResult {
    const files = this.fileNodes.get(projectId);
    if (!files) return { success: false, error: 'Project not found' };

    const file = files.get(fileId);
    if (!file) return { success: false, error: 'File not found' };

    const renamed = renameFileNode(file, newName);
    files.set(fileId, renamed);

    this.saveState();
    this.emit('fileRenamed', { projectId, file: renamed, oldName: file.name });

    return { success: true, file: renamed };
  }

  moveFile(projectId: string, fileId: string, newParentId: string | null, newPath: string): FileOperationResult {
    const files = this.fileNodes.get(projectId);
    if (!files) return { success: false, error: 'Project not found' };

    const file = files.get(fileId);
    if (!file) return { success: false, error: 'File not found' };

    const oldParentId = file.parentId;
    const moved = moveFileNode(file, newParentId, `${newPath}/${file.name}`);
    files.set(fileId, moved);

    if (oldParentId) {
      this.updateParentChildCount(projectId, this.getFilePath(projectId, oldParentId));
    }
    if (newParentId) {
      this.updateParentChildCount(projectId, newPath);
    }

    this.saveState();
    this.emit('fileMoved', { projectId, file: moved, oldPath: file.path });

    return { success: true, file: moved };
  }

  deleteFile(projectId: string, fileId: string): FileOperationResult {
    const files = this.fileNodes.get(projectId);
    if (!files) return { success: false, error: 'Project not found' };

    const file = files.get(fileId);
    if (!file) return { success: false, error: 'File not found' };

    // Delete children first if it's a directory
    if (file.type === 'directory') {
      this.deleteChildren(projectId, fileId);
    }

    // Update parent's child count
    if (file.parentId) {
      const parentPath = this.getFilePath(projectId, file.parentId);
      this.updateParentChildCount(projectId, parentPath);
    }

    files.delete(fileId);
    this.state.selectedFiles.delete(fileId);

    this.saveState();
    this.emit('fileDeleted', { projectId, fileId, fileName: file.name });

    return { success: true };
  }

  private deleteChildren(projectId: string, parentId: string): void {
    const files = this.fileNodes.get(projectId);
    if (!files) return;

    const children = Array.from(files.values()).filter(f => f.parentId === parentId);
    children.forEach(child => {
      if (child.type === 'directory') {
        this.deleteChildren(projectId, child.id);
      }
      files.delete(child.id);
      this.state.selectedFiles.delete(child.id);
    });
  }

  updateFileContent(projectId: string, fileId: string, content: string): FileNode | undefined {
    const files = this.fileNodes.get(projectId);
    if (!files) return undefined;

    const file = files.get(fileId);
    if (!file) return undefined;

    const updated = updateFileContent(file, content);
    files.set(fileId, updated);

    return updated;
  }

  // Query Methods
  getFile(projectId: string, fileId: string): FileNode | undefined {
    return this.fileNodes.get(projectId)?.get(fileId);
  }

  getFileByPath(projectId: string, path: string): FileNode | undefined {
    const files = this.fileNodes.get(projectId);
    if (!files) return undefined;

    return Array.from(files.values()).find(f => f.path === path);
  }

  getProjectFiles(projectId: string): FileNode[] {
    return Array.from(this.fileNodes.get(projectId)?.values() || []);
  }

  getFileTree(projectId: string, foldersFirst: boolean = true): FileNodeTree {
    const files = this.getProjectFiles(projectId);
    const sorted = sortFileNodes(files, foldersFirst);
    return buildFileTree(sorted);
  }

  getChildren(projectId: string, parentId: string | null): FileNode[] {
    const files = this.fileNodes.get(projectId);
    if (!files) return [];

    return Array.from(files.values())
      .filter(f => f.parentId === parentId)
      .sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
  }

  getRootFiles(projectId: string): FileNode[] {
    return this.getChildren(projectId, null);
  }

  private getFilePath(projectId: string, fileId: string): string {
    const file = this.getFile(projectId, fileId);
    return file?.path || '';
  }

  private updateParentChildCount(projectId: string, parentPath: string): void {
    const files = this.fileNodes.get(projectId);
    if (!files) return;

    const parent = Array.from(files.values()).find(f => f.path === parentPath);
    if (parent && parent.type === 'directory') {
      parent.childCount = Array.from(files.values()).filter(f => f.parentId === parent.id).length;
    }
  }

  // Expand/Collapse
  expandFolder(projectId: string, folderId: string): void {
    this.state.expandedFolders.add(`${projectId}:${folderId}`);
    this.saveState();
    this.emit('folderExpanded', { projectId, folderId });
  }

  collapseFolder(projectId: string, folderId: string): void {
    this.state.expandedFolders.delete(`${projectId}:${folderId}`);
    this.saveState();
    this.emit('folderCollapsed', { projectId, folderId });
  }

  toggleFolder(projectId: string, folderId: string): void {
    const key = `${projectId}:${folderId}`;
    if (this.state.expandedFolders.has(key)) {
      this.collapseFolder(projectId, folderId);
    } else {
      this.expandFolder(projectId, folderId);
    }
  }

  isFolderExpanded(projectId: string, folderId: string): boolean {
    return this.state.expandedFolders.has(`${projectId}:${folderId}`);
  }

  getExpandedFolders(projectId: string): string[] {
    const prefix = `${projectId}:`;
    return Array.from(this.state.expandedFolders)
      .filter(key => key.startsWith(prefix))
      .map(key => key.replace(prefix, ''));
  }

  expandAll(projectId: string): void {
    const files = this.fileNodes.get(projectId);
    if (!files) return;

    files.forEach((file, id) => {
      if (file.type === 'directory') {
        this.state.expandedFolders.add(`${projectId}:${id}`);
      }
    });
    this.saveState();
    this.emit('allExpanded', { projectId });
  }

  collapseAll(projectId: string): void {
    const prefix = `${projectId}:`;
    this.state.expandedFolders.forEach(key => {
      if (key.startsWith(prefix)) {
        this.state.expandedFolders.delete(key);
      }
    });
    this.saveState();
    this.emit('allCollapsed', { projectId });
  }

  // Selection
  selectFile(projectId: string, fileId: string): void {
    this.state.selectedFiles.clear();
    this.state.selectedFiles.add(`${projectId}:${fileId}`);
    this.saveState();
    this.emit('fileSelected', { projectId, fileId });
  }

  addToSelection(projectId: string, fileId: string): void {
    this.state.selectedFiles.add(`${projectId}:${fileId}`);
    this.saveState();
    this.emit('selectionChanged', { projectId, fileIds: this.getSelectedFileIds(projectId) });
  }

  removeFromSelection(projectId: string, fileId: string): void {
    this.state.selectedFiles.delete(`${projectId}:${fileId}`);
    this.saveState();
    this.emit('selectionChanged', { projectId, fileIds: this.getSelectedFileIds(projectId) });
  }

  clearSelection(projectId: string): void {
    this.state.selectedFiles.forEach(key => {
      if (key.startsWith(`${projectId}:`)) {
        this.state.selectedFiles.delete(key);
      }
    });
    this.saveState();
    this.emit('selectionCleared', { projectId });
  }

  getSelectedFileIds(projectId: string): string[] {
    const prefix = `${projectId}:`;
    return Array.from(this.state.selectedFiles)
      .filter(key => key.startsWith(prefix))
      .map(key => key.replace(prefix, ''));
  }

  getSelectedFiles(projectId: string): FileNode[] {
    const fileIds = this.getSelectedFileIds(projectId);
    const files = this.fileNodes.get(projectId);
    if (!files) return [];

    return fileIds.map(id => files.get(id)).filter((f): f is FileNode => f !== undefined);
  }

  isSelected(projectId: string, fileId: string): boolean {
    return this.state.selectedFiles.has(`${projectId}:${fileId}`);
  }

  // Clipboard Operations
  cutFiles(projectId: string, fileIds: string[]): void {
    const files = this.fileNodes.get(projectId);
    if (!files) return;

    const nodes = fileIds.map(id => files.get(id)).filter((f): f is FileNode => f !== undefined);
    this.state.clipboard = { nodes, operation: 'cut' };
    this.saveState();
    this.emit('clipboardChanged', { operation: 'cut', count: nodes.length });
  }

  copyFiles(projectId: string, fileIds: string[]): void {
    const files = this.fileNodes.get(projectId);
    if (!files) return;

    const nodes = fileIds.map(id => files.get(id)).filter((f): f is FileNode => f !== undefined);
    this.state.clipboard = { nodes, operation: 'copy' };
    this.saveState();
    this.emit('clipboardChanged', { operation: 'copy', count: nodes.length });
  }

  pasteFiles(projectId: string, targetPath: string): FileOperationResult[] {
    if (!this.state.clipboard) return [{ success: false, error: 'Clipboard is empty' }];

    const results: FileOperationResult[] = [];
    const files = this.fileNodes.get(projectId);
    if (!files) return [{ success: false, error: 'Project not found' }];

    this.state.clipboard.nodes.forEach(node => {
      if (this.state.clipboard!.operation === 'copy') {
        const newFile = createFileNode(
          projectId,
          node.name,
          `${targetPath}/${node.name}`,
          null,
          node.type,
          node.content || ''
        );
        newFile.metadata = { ...node.metadata };
        files.set(newFile.id, newFile);
        results.push({ success: true, file: newFile });
      } else {
        const moved = moveFileNode({ ...node }, null, `${targetPath}/${node.name}`);
        files.set(node.id, moved);
        results.push({ success: true, file: moved });
      }
    });

    if (this.state.clipboard.operation === 'cut') {
      this.state.clipboard = null;
    }

    this.saveState();
    this.emit('filesPasted', { projectId, targetPath, results });

    return results;
  }

  clearClipboard(): void {
    this.state.clipboard = null;
    this.saveState();
    this.emit('clipboardCleared', {});
  }

  getClipboardContent(): { operation: 'cut' | 'copy'; count: number } | null {
    if (!this.state.clipboard) return null;
    return {
      operation: this.state.clipboard.operation,
      count: this.state.clipboard.nodes.length
    };
  }

  // Search
  searchFiles(projectId: string, query: string): FileNode[] {
    const files = this.fileNodes.get(projectId);
    if (!files) return [];

    const lowerQuery = query.toLowerCase();
    return Array.from(files.values()).filter(file =>
      file.name.toLowerCase().includes(lowerQuery) ||
      file.path.toLowerCase().includes(lowerQuery) ||
      file.content?.toLowerCase().includes(lowerQuery)
    );
  }

  searchByExtension(projectId: string, extension: string): FileNode[] {
    const files = this.fileNodes.get(projectId);
    if (!files) return [];

    return Array.from(files.values()).filter(file =>
      file.extension?.toLowerCase() === extension.toLowerCase()
    );
  }

  searchByType(projectId: string, type: FileNodeType): FileNode[] {
    const files = this.fileNodes.get(projectId);
    if (!files) return [];

    return Array.from(files.values()).filter(file => file.type === type);
  }

  // Utility
  getStats(projectId: string): { totalFiles: number; totalFolders: number; totalSize: number } {
    const files = this.fileNodes.get(projectId);
    if (!files) return { totalFiles: 0, totalFolders: 0, totalSize: 0 };

    let totalSize = 0;
    let totalFiles = 0;
    let totalFolders = 0;

    files.forEach(file => {
      if (file.type === 'file') {
        totalFiles++;
        totalSize += file.metadata.size || 0;
      } else {
        totalFolders++;
      }
    });

    return { totalFiles, totalFolders, totalSize };
  }

  refresh(projectId: string): void {
    this.state.lastRefresh = new Date().toISOString();
    this.saveState();
    this.emit('refreshed', { projectId, timestamp: this.state.lastRefresh });
  }

  // Project Management
  createProjectFiles(projectId: string): void {
    if (!this.fileNodes.has(projectId)) {
      this.fileNodes.set(projectId, new Map());
    }
  }

  deleteProjectFiles(projectId: string): void {
    this.fileNodes.delete(projectId);
    this.state.selectedFiles.forEach(key => {
      if (key.startsWith(`${projectId}:`)) {
        this.state.selectedFiles.delete(key);
      }
    });
    this.state.expandedFolders.forEach(key => {
      if (key.startsWith(`${projectId}:`)) {
        this.state.expandedFolders.delete(key);
      }
    });
    this.saveState();
    this.emit('projectFilesDeleted', { projectId });
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

export default FileExplorerEngine;
