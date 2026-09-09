/**
 * Workspace Model
 * Workspace management for Terminal Sandbox
 */

import type { Workspace, WorkspaceFile, WorkspaceSettings } from './types';

export function createWorkspace(
  id: string,
  name: string,
  userId: string,
  path: string
): Workspace {
  return {
    id,
    name,
    userId,
    path,
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      autoSave: true,
      maxFileSize: 10 * 1024 * 1024,
      allowedExtensions: ['.txt', '.md', '.json', '.js', '.ts', '.py', '.html', '.css'],
    },
  };
}

export function createWorkspaceFile(
  id: string,
  workspaceId: string,
  name: string,
  path: string,
  content: string = ''
): WorkspaceFile {
  return {
    id,
    workspaceId,
    name,
    path,
    content,
    size: content.length,
    createdAt: new Date(),
    modifiedAt: new Date(),
    permissions: '-rw-r--r--',
  };
}

export function updateWorkspaceSettings(
  workspace: Workspace,
  settings: Partial<WorkspaceSettings>
): Workspace {
  return {
    ...workspace,
    settings: { ...workspace.settings, ...settings },
    updatedAt: new Date(),
  };
}

export function getWorkspacePath(workspace: Workspace, filePath: string): string {
  return `${workspace.path}/${filePath}`;
}
