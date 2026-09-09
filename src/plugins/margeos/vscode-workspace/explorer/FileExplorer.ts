/**
 * FileExplorer.ts
 *
 * Component for file explorer tree management and file operations.
 */

import { FileNode, FileNodeType, buildFileTree, sortFileNodes } from '../models/FileNode';
import FileExplorerEngine from '../core/FileExplorerEngine';

export interface FileFilter {
  extensions?: string[];
  types?: FileNodeType[];
  excludePatterns?: string[];
  includeHidden?: boolean;
}

export interface DragDropPayload {
  sourceFileIds: string[];
  targetFileId: string;
  operation: 'move' | 'copy';
}

export interface FileOperation {
  type: 'create' | 'rename' | 'delete' | 'move' | 'copy';
  targetPath: string;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

export interface ExplorerState {
  expandedFolders: Set<string>;
  selectedFiles: Set<string>;
  hoveredFile: string | null;
  contextMenuFile: string | null;
  renamingFile: string | null;
  clipboard: { files: FileNode[]; operation: 'cut' | 'copy' } | null;
  searchQuery: string;
  filters: FileFilter;
  sortOrder: 'name' | 'type' | 'modified';
  sortDirection: 'asc' | 'desc';
}

export interface FileIcon {
  name: string;
  color?: string;
  extensions?: string[];
}

export class FileExplorer {
  private static instance: FileExplorer;
  private engine: FileExplorerEngine;
  private state: ExplorerState;
  private operationHistory: FileOperation[] = [];
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {
    this.engine = FileExplorerEngine.getInstance();
    this.state = {
      expandedFolders: new Set(),
      selectedFiles: new Set(),
      hoveredFile: null,
      contextMenuFile: null,
      renamingFile: null,
      clipboard: null,
      searchQuery: '',
      filters: {},
      sortOrder: 'name',
      sortDirection: 'asc'
    };
  }

  static getInstance(): FileExplorer {
    if (!FileExplorer.instance) {
      FileExplorer.instance = new FileExplorer();
    }
    return FileExplorer.instance;
  }

  // File Tree Operations
  getFileTree(projectId: string, foldersFirst: boolean = true): any {
    return this.engine.getFileTree(projectId, foldersFirst);
  }

  getRootFiles(projectId: string): FileNode[] {
    return this.engine.getRootFiles(projectId);
  }

  getChildren(projectId: string, parentId: string | null): FileNode[] {
    return this.engine.getChildren(projectId, parentId);
  }

  getFile(projectId: string, fileId: string): FileNode | undefined {
    return this.engine.getFile(projectId, fileId);
  }

  getFileByPath(projectId: string, path: string): FileNode | undefined {
    return this.engine.getFileByPath(projectId, path);
  }

  // Create Operations
  createFile(projectId: string, name: string, path: string, content: string = ''): FileNode {
    const file = this.engine.createFile(projectId, name, path, content);
    this.recordOperation('create', `${path}/${name}`);
    this.emit('fileCreated', file);
    return file;
  }

  createFolder(projectId: string, name: string, path: string): FileNode {
    const folder = this.engine.createFolder(projectId, name, path);
    this.recordOperation('create', `${path}/${name}`);
    this.emit('folderCreated', folder);
    return folder;
  }

  // Rename Operations
  renameFile(projectId: string, fileId: string, newName: string): FileNode | undefined {
    const file = this.engine.getFile(projectId, fileId);
    if (!file) return undefined;

    const result = this.engine.renameFile(projectId, fileId, newName);
    if (result.success && result.file) {
      this.recordOperation('rename', result.file.path);
      this.state.renamingFile = null;
      this.emit('fileRenamed', { oldPath: file.path, newPath: result.file.path });
      return result.file;
    }
    return undefined;
  }

  startRenaming(projectId: string, fileId: string): void {
    this.state.renamingFile = fileId;
    this.emit('renamingStarted', { projectId, fileId });
  }

  cancelRenaming(): void {
    this.state.renamingFile = null;
    this.emit('renamingCancelled', {});
  }

  // Delete Operations
  deleteFile(projectId: string, fileId: string): boolean {
    const file = this.engine.getFile(projectId, fileId);
    if (!file) return false;

    const result = this.engine.deleteFile(projectId, fileId);
    if (result.success) {
      this.recordOperation('delete', file.path);
      this.emit('fileDeleted', { file });
    }
    return result.success;
  }

  deleteMultiple(projectId: string, fileIds: string[]): number {
    let deletedCount = 0;
    fileIds.forEach(fileId => {
      if (this.deleteFile(projectId, fileId)) {
        deletedCount++;
      }
    });
    return deletedCount;
  }

  // Move/Copy Operations
  moveFile(projectId: string, fileId: string, newParentId: string | null, newPath: string): FileNode | undefined {
    const file = this.engine.getFile(projectId, fileId);
    if (!file) return undefined;

    const result = this.engine.moveFile(projectId, fileId, newParentId, newPath);
    if (result.success && result.file) {
      this.recordOperation('move', result.file.path);
      this.emit('fileMoved', { oldPath: file.path, newPath: result.file.path });
      return result.file;
    }
    return undefined;
  }

  copyFile(projectId: string, fileId: string, newPath: string): FileNode | undefined {
    const file = this.engine.getFile(projectId, fileId);
    if (!file) return undefined;

    const newFile = this.engine.createFile(projectId, file.name, newPath, file.content || '');
    this.recordOperation('copy', newFile.path);
    this.emit('fileCopied', { source: file, target: newFile });
    return newFile;
  }

  // Drag and Drop
  handleDragStart(projectId: string, fileId: string): void {
    this.state.selectedFiles.add(fileId);
    this.emit('dragStarted', { projectId, fileIds: Array.from(this.state.selectedFiles) });
  }

  handleDragOver(targetFileId: string): boolean {
    // Return true if target can accept dropped files
    const target = this.findFileInAllProjects(targetFileId);
    return target?.type === 'directory';
  }

  handleDrop(projectId: string, sourceFileIds: string[], targetFileId: string, operation: 'move' | 'copy'): void {
    const target = this.engine.getFile(projectId, targetFileId);
    if (!target || target.type !== 'directory') return;

    sourceFileIds.forEach(fileId => {
      if (operation === 'move') {
        this.moveFile(projectId, fileId, targetFileId, target.path);
      } else {
        this.copyFile(projectId, fileId, target.path);
      }
    });

    this.emit('dropCompleted', { projectId, sourceFileIds, targetFileId, operation });
  }

  private findFileInAllProjects(fileId: string): FileNode | undefined {
    // Search through all projects to find file
    const allFiles = this.engine.getProjectFiles(fileId);
    return allFiles.find(f => f.id === fileId);
  }

  // Clipboard Operations
  cutFiles(projectId: string, fileIds: string[]): void {
    this.engine.cutFiles(projectId, fileIds);
    this.emit('clipboardUpdated', { operation: 'cut', count: fileIds.length });
  }

  copyFiles(projectId: string, fileIds: string[]): void {
    this.engine.copyFiles(projectId, fileIds);
    this.emit('clipboardUpdated', { operation: 'copy', count: fileIds.length });
  }

  pasteFiles(projectId: string, targetPath: string): FileOperation[] {
    const results = this.engine.pasteFiles(projectId, targetPath);
    const successful = results.filter(r => r.success).length;
    this.emit('pasteCompleted', { targetPath, successful, failed: results.length - successful });
    return results;
  }

  canPaste(): boolean {
    return this.engine.getClipboardContent() !== null;
  }

  clearClipboard(): void {
    this.engine.clearClipboard();
    this.emit('clipboardCleared', {});
  }

  // Selection
  selectFile(projectId: string, fileId: string, addToSelection: boolean = false): void {
    if (!addToSelection) {
      this.state.selectedFiles.clear();
    }
    this.state.selectedFiles.add(fileId);
    this.engine.selectFile(projectId, fileId);
    this.emit('selectionChanged', { projectId, fileIds: Array.from(this.state.selectedFiles) });
  }

  addToSelection(projectId: string, fileId: string): void {
    if (!this.state.selectedFiles.has(fileId)) {
      this.state.selectedFiles.add(fileId);
      this.engine.addToSelection(projectId, fileId);
      this.emit('selectionChanged', { projectId, fileIds: Array.from(this.state.selectedFiles) });
    }
  }

  removeFromSelection(projectId: string, fileId: string): void {
    this.state.selectedFiles.delete(fileId);
    this.engine.removeFromSelection(projectId, fileId);
    this.emit('selectionChanged', { projectId, fileIds: Array.from(this.state.selectedFiles) });
  }

  clearSelection(projectId: string): void {
    this.state.selectedFiles.clear();
    this.engine.clearSelection(projectId);
    this.emit('selectionCleared', { projectId });
  }

  getSelectedFiles(projectId: string): FileNode[] {
    return this.engine.getSelectedFiles(projectId);
  }

  isSelected(projectId: string, fileId: string): boolean {
    return this.state.selectedFiles.has(fileId);
  }

  // Expand/Collapse
  expandFolder(projectId: string, folderId: string): void {
    this.engine.expandFolder(projectId, folderId);
    this.state.expandedFolders.add(`${projectId}:${folderId}`);
    this.emit('folderExpanded', { projectId, folderId });
  }

  collapseFolder(projectId: string, folderId: string): void {
    this.engine.collapseFolder(projectId, folderId);
    this.state.expandedFolders.delete(`${projectId}:${folderId}`);
    this.emit('folderCollapsed', { projectId, folderId });
  }

  toggleFolder(projectId: string, folderId: string): void {
    if (this.state.expandedFolders.has(`${projectId}:${folderId}`)) {
      this.collapseFolder(projectId, folderId);
    } else {
      this.expandFolder(projectId, folderId);
    }
  }

  isFolderExpanded(projectId: string, folderId: string): boolean {
    return this.state.expandedFolders.has(`${projectId}:${folderId}`);
  }

  expandAll(projectId: string): void {
    this.engine.expandAll(projectId);
    this.state.expandedFolders.clear();
    const expanded = this.engine.getExpandedFolders(projectId);
    expanded.forEach(id => {
      this.state.expandedFolders.add(`${projectId}:${id}`);
    });
    this.emit('allExpanded', { projectId });
  }

  collapseAll(projectId: string): void {
    this.engine.collapseAll(projectId);
    this.state.expandedFolders.clear();
    this.emit('allCollapsed', { projectId });
  }

  // Hover
  setHoveredFile(fileId: string | null): void {
    this.state.hoveredFile = fileId;
    this.emit('hoverChanged', { fileId });
  }

  getHoveredFile(): string | null {
    return this.state.hoveredFile;
  }

  // Context Menu
  showContextMenu(fileId: string | null): void {
    this.state.contextMenuFile = fileId;
    this.emit('contextMenuShown', { fileId });
  }

  hideContextMenu(): void {
    this.state.contextMenuFile = null;
    this.emit('contextMenuHidden', {});
  }

  getContextMenuFile(): string | null {
    return this.state.contextMenuFile;
  }

  // Search
  searchFiles(projectId: string, query: string): FileNode[] {
    this.state.searchQuery = query;
    return this.engine.searchFiles(projectId, query);
  }

  searchByExtension(projectId: string, extension: string): FileNode[] {
    return this.engine.searchByExtension(projectId, extension);
  }

  searchByType(projectId: string, type: FileNodeType): FileNode[] {
    return this.engine.searchByType(projectId, type);
  }

  clearSearch(): void {
    this.state.searchQuery = '';
    this.emit('searchCleared', {});
  }

  // Filtering
  setFilters(filters: FileFilter): void {
    this.state.filters = filters;
    this.emit('filtersChanged', filters);
  }

  getFilters(): FileFilter {
    return { ...this.state.filters };
  }

  applyFilters(files: FileNode[]): FileNode[] {
    let filtered = [...files];

    // Filter by hidden files
    if (!this.state.filters.includeHidden) {
      filtered = filtered.filter(f => !f.isHidden);
    }

    // Filter by type
    if (this.state.filters.types && this.state.filters.types.length > 0) {
      filtered = filtered.filter(f => this.state.filters.types!.includes(f.type));
    }

    // Filter by extension
    if (this.state.filters.extensions && this.state.filters.extensions.length > 0) {
      filtered = filtered.filter(f => {
        if (!f.extension) return false;
        return this.state.filters.extensions!.includes(f.extension);
      });
    }

    // Filter by exclude patterns
    if (this.state.filters.excludePatterns) {
      this.state.filters.excludePatterns.forEach(pattern => {
        const regex = new RegExp(pattern);
        filtered = filtered.filter(f => !regex.test(f.name));
      });
    }

    return filtered;
  }

  // Sorting
  setSortOrder(order: 'name' | 'type' | 'modified'): void {
    this.state.sortOrder = order;
    this.emit('sortOrderChanged', order);
  }

  setSortDirection(direction: 'asc' | 'desc'): void {
    this.state.sortDirection = direction;
    this.emit('sortDirectionChanged', direction);
  }

  getSortOrder(): 'name' | 'type' | 'modified' {
    return this.state.sortOrder;
  }

  getSortDirection(): 'asc' | 'desc' {
    return this.state.sortDirection;
  }

  sortFiles(files: FileNode[]): FileNode[] {
    const sorted = sortFileNodes(files, true);

    if (this.state.sortOrder === 'name') {
      sorted.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return this.state.sortDirection === 'asc' ? comparison : -comparison;
      });
    } else if (this.state.sortOrder === 'type') {
      sorted.sort((a, b) => {
        const comparison = (a.extension || '').localeCompare(b.extension || '');
        return this.state.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return sorted;
  }

  // File Icons
  getFileIcon(file: FileNode): FileIcon {
    if (file.type === 'directory') {
      return {
        name: file.isSystem ? 'folder-package' : 'folder',
        color: file.isSystem ? '#9cdcfe' : '#dcad65'
      };
    }

    const icons: Record<string, FileIcon> = {
      javascript: { name: 'file-code', color: '#f7df1e' },
      typescript: { name: 'file-code', color: '#3178c6' },
      javascriptreact: { name: 'file-code', color: '#61dafb' },
      typescriptreact: { name: 'file-code', color: '#61dafb' },
      python: { name: 'file-code', color: '#3572A5' },
      html: { name: 'file-code', color: '#e34c26' },
      css: { name: 'file-code', color: '#563d7c' },
      scss: { name: 'file-code', color: '#c6538c' },
      json: { name: 'file-json', color: '#f1e05a' },
      markdown: { name: 'file-text', color: '#083fa1' },
      yaml: { name: 'file-code', color: '#cb171e' },
      xml: { name: 'file-code', color: '#0060ac' },
      sql: { name: 'file-code', color: '#e38c00' },
      shell: { name: 'terminal', color: '#89e051' },
      java: { name: 'file-code', color: '#b07219' },
      go: { name: 'file-code', color: '#00add8' },
      rust: { name: 'file-code', color: '#dea584' },
      cpp: { name: 'file-code', color: '#f34b7d' },
      csharp: { name: 'file-code', color: '#178600' },
      php: { name: 'file-code', color: '#4f5d95' },
      ruby: { name: 'file-code', color: '#701516' },
      swift: { name: 'file-code', color: '#F05138' },
      kotlin: { name: 'file-code', color: '#A97BFF' },
      svg: { name: 'file-media', color: '#ffb13b' },
      image: { name: 'file-image', color: '#a074c4' },
      pdf: { name: 'file-text', color: '#cc0000' },
      zip: { name: 'file-archive', color: '#cbcb66' }
    };

    return icons[file.metadata.language || ''] || { name: 'file', color: '#cccccc' };
  }

  // Operation History
  private recordOperation(type: FileOperation['type'], targetPath: string): void {
    const operation: FileOperation = {
      type,
      targetPath,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    this.operationHistory.unshift(operation);
    if (this.operationHistory.length > 100) {
      this.operationHistory = this.operationHistory.slice(0, 100);
    }
  }

  getOperationHistory(): FileOperation[] {
    return [...this.operationHistory];
  }

  undoLastOperation(projectId: string): boolean {
    const lastOp = this.operationHistory[0];
    if (!lastOp) return false;

    // Undo logic based on operation type
    switch (lastOp.type) {
      case 'create':
        const file = this.engine.getFileByPath(projectId, lastOp.targetPath);
        if (file) {
          this.engine.deleteFile(projectId, file.id);
          this.operationHistory.shift();
          this.emit('undoCompleted', { operation: lastOp });
          return true;
        }
        break;
      case 'delete':
        // Would need to restore from trash/backup
        break;
    }

    return false;
  }

  // Stats
  getStats(projectId: string): { totalFiles: number; totalFolders: number; totalSize: number } {
    return this.engine.getStats(projectId);
  }

  // Refresh
  refresh(projectId: string): void {
    this.engine.refresh(projectId);
    this.emit('refreshed', { projectId });
  }

  // State Access
  getState(): ExplorerState {
    return { ...this.state };
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

export default FileExplorer;
