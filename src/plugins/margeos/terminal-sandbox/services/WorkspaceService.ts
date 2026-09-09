/**
 * Workspace Service for Terminal Sandbox
 * Manages workspace operations
 */

import TerminalSandboxEngine from '../core/TerminalSandboxEngine';
import type { Workspace, WorkspaceFile, WorkspaceSettings } from '../models/types';

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: Date;
  permissions: string;
}

export interface DirectoryListing {
  path: string;
  files: FileInfo[];
  totalCount: number;
}

/**
 * WorkspaceService - Manages workspace operations
 */
export class WorkspaceService {
  private static instance: WorkspaceService | null = null;
  private engine: TerminalSandboxEngine;
  private workspaceFiles: Map<string, WorkspaceFile[]> = new Map();

  private constructor() {
    this.engine = TerminalSandboxEngine.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  /**
   * Create a workspace
   */
  async createWorkspace(name: string, userId: string): Promise<Workspace | null> {
    try {
      const workspace = await this.engine.createWorkspace(name, userId);

      if (workspace) {
        // Initialize with default files
        this.workspaceFiles.set(workspace.id, []);
      }

      return workspace;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      return null;
    }
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(workspaceId: string): Workspace | undefined {
    return this.engine.getWorkspace(workspaceId);
  }

  /**
   * Get all workspaces
   */
  getAllWorkspaces(): Workspace[] {
    return this.engine.getAllWorkspaces();
  }

  /**
   * Get user's workspaces
   */
  getUserWorkspaces(userId: string): Workspace[] {
    return this.engine.getWorkspacesByUser(userId);
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<boolean> {
    this.workspaceFiles.delete(workspaceId);
    return this.engine.deleteWorkspace(workspaceId);
  }

  /**
   * Create a file in workspace
   */
  async createFile(
    workspaceId: string,
    path: string,
    content: string = ''
  ): Promise<WorkspaceFile | null> {
    const workspace = this.getWorkspace(workspaceId);
    if (!workspace) {
      return null;
    }

    const file: WorkspaceFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      workspaceId,
      name: path.split('/').pop() || path,
      path,
      content,
      size: content.length,
      createdAt: new Date(),
      modifiedAt: new Date(),
      permissions: '-rw-r--r--',
    };

    const files = this.workspaceFiles.get(workspaceId) || [];
    files.push(file);
    this.workspaceFiles.set(workspaceId, files);

    return file;
  }

  /**
   * Get file content
   */
  getFileContent(workspaceId: string, path: string): string | null {
    const files = this.workspaceFiles.get(workspaceId);
    if (!files) return null;

    const file = files.find((f) => f.path === path);
    return file?.content || null;
  }

  /**
   * Update file content
   */
  async updateFileContent(
    workspaceId: string,
    path: string,
    content: string
  ): Promise<boolean> {
    const files = this.workspaceFiles.get(workspaceId);
    if (!files) return false;

    const file = files.find((f) => f.path === path);
    if (!file) return false;

    file.content = content;
    file.size = content.length;
    file.modifiedAt = new Date();

    return true;
  }

  /**
   * Delete a file
   */
  async deleteFile(workspaceId: string, path: string): Promise<boolean> {
    const files = this.workspaceFiles.get(workspaceId);
    if (!files) return false;

    const index = files.findIndex((f) => f.path === path);
    if (index === -1) return false;

    files.splice(index, 1);
    return true;
  }

  /**
   * List directory contents
   */
  listDirectory(workspaceId: string, path: string = '/'): DirectoryListing {
    const files = this.workspaceFiles.get(workspaceId) || [];

    const prefix = path === '/' ? '' : path + '/';
    const listing: FileInfo[] = [];
    const seen = new Set<string>();

    for (const file of files) {
      if (file.path.startsWith(prefix)) {
        const relative = file.path.slice(prefix.length);
        const firstSlash = relative.indexOf('/');

        if (firstSlash === -1) {
          // Direct child
          if (!seen.has(file.name)) {
            seen.add(file.name);
            listing.push({
              name: file.name,
              path: file.path,
              isDirectory: false,
              size: file.size,
              modifiedAt: file.modifiedAt,
              permissions: file.permissions,
            });
          }
        } else {
          // Subdirectory
          const dirName = relative.slice(0, firstSlash);
          if (!seen.has(dirName)) {
            seen.add(dirName);
            listing.push({
              name: dirName,
              path: path + '/' + dirName,
              isDirectory: true,
              size: 0,
              modifiedAt: new Date(),
              permissions: 'drwxr-xr-x',
            });
          }
        }
      }
    }

    // Sort: directories first, then by name
    listing.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      path,
      files: listing,
      totalCount: listing.length,
    };
  }

  /**
   * Check if path exists
   */
  exists(workspaceId: string, path: string): boolean {
    const files = this.workspaceFiles.get(workspaceId) || [];
    return files.some((f) => f.path === path);
  }

  /**
   * Get file info
   */
  getFileInfo(workspaceId: string, path: string): FileInfo | null {
    const files = this.workspaceFiles.get(workspaceId) || [];
    const file = files.find((f) => f.path === path);

    if (!file) return null;

    const isDirectory = file.path.endsWith('/');

    return {
      name: file.name,
      path: file.path,
      isDirectory,
      size: file.size,
      modifiedAt: file.modifiedAt,
      permissions: file.permissions,
    };
  }

  /**
   * Create directory
   */
  async createDirectory(workspaceId: string, path: string): Promise<boolean> {
    const dirPath = path.endsWith('/') ? path : path + '/';

    const files = this.workspaceFiles.get(workspaceId) || [];

    // Check if directory already exists
    const exists = files.some((f) => f.path === dirPath);
    if (exists) return false;

    const dir: WorkspaceFile = {
      id: `dir-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      workspaceId,
      name: path.split('/').pop() || path,
      path: dirPath,
      content: '',
      size: 0,
      createdAt: new Date(),
      modifiedAt: new Date(),
      permissions: 'drwxr-xr-x',
    };

    files.push(dir);
    this.workspaceFiles.set(workspaceId, files);

    return true;
  }

  /**
   * Get workspace settings
   */
  getSettings(workspaceId: string): WorkspaceSettings | undefined {
    const workspace = this.getWorkspace(workspaceId);
    return workspace?.settings;
  }

  /**
   * Update workspace settings
   */
  updateSettings(workspaceId: string, settings: Partial<WorkspaceSettings>): boolean {
    const workspace = this.getWorkspace(workspaceId);
    if (!workspace) return false;

    workspace.settings = { ...workspace.settings, ...settings };
    return true;
  }

  /**
   * Get workspace storage usage
   */
  getStorageUsage(workspaceId: string): { files: number; size: number } {
    const files = this.workspaceFiles.get(workspaceId) || [];

    return {
      files: files.length,
      size: files.reduce((sum, f) => sum + f.size, 0),
    };
  }
}

export default WorkspaceService;
