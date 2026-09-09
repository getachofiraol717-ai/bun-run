/**
 * useWorkspace Hook for Terminal Sandbox
 * React hook for workspace operations
 */

import { useState, useCallback, useEffect } from 'react';
import WorkspaceService from '../services/WorkspaceService';
import type { Workspace, WorkspaceFile, WorkspaceSettings } from '../models/types';

export interface UseWorkspaceOptions {
  autoLoad?: boolean;
}

export interface UseWorkspaceReturn {
  // State
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createWorkspace: (name: string, userId: string) => Promise<Workspace | null>;
  selectWorkspace: (workspaceId: string) => void;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  updateSettings: (settings: Partial<WorkspaceSettings>) => boolean;

  // File operations
  createFile: (path: string, content?: string) => Promise<WorkspaceFile | null>;
  updateFile: (path: string, content: string) => Promise<boolean>;
  deleteFile: (path: string) => Promise<boolean>;
  getFileContent: (path: string) => string | null;
  listDirectory: (path?: string) => ReturnType<WorkspaceService['listDirectory']>;

  // Storage
  storageUsage: { files: number; size: number };
}

export function useWorkspace(
  userId: string,
  options: UseWorkspaceOptions = {}
): UseWorkspaceReturn {
  const { autoLoad = true } = options;

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [storageUsage, setStorageUsage] = useState<{ files: number; size: number }>({
    files: 0,
    size: 0,
  });

  const service = WorkspaceService.getInstance();

  // Load user's workspaces
  const loadWorkspaces = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const userWorkspaces = service.getUserWorkspaces(userId);
      setWorkspaces(userWorkspaces);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create workspace
  const createWorkspace = useCallback(
    async (name: string, ownerId: string): Promise<Workspace | null> => {
      setError(null);

      try {
        const workspace = await service.createWorkspace(name, ownerId);
        if (workspace) {
          setWorkspaces((prev) => [...prev, workspace]);
        }
        return workspace;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create workspace');
        return null;
      }
    },
    []
  );

  // Select workspace
  const selectWorkspace = useCallback((workspaceId: string) => {
    setError(null);

    const workspace = service.getWorkspace(workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      setStorageUsage(service.getStorageUsage(workspaceId));
    } else {
      setError('Workspace not found');
    }
  }, []);

  // Delete workspace
  const deleteWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
    setError(null);

    try {
      const success = await service.deleteWorkspace(workspaceId);
      if (success) {
        setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
        if (currentWorkspace?.id === workspaceId) {
          setCurrentWorkspace(null);
        }
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
      return false;
    }
  }, [currentWorkspace]);

  // Update workspace settings
  const updateSettings = useCallback(
    (settings: Partial<WorkspaceSettings>): boolean => {
      if (!currentWorkspace) {
        setError('No workspace selected');
        return false;
      }

      const success = service.updateSettings(currentWorkspace.id, settings);
      if (success) {
        setCurrentWorkspace(service.getWorkspace(currentWorkspace.id) || null);
      }
      return success;
    },
    [currentWorkspace]
  );

  // Create file
  const createFile = useCallback(
    async (path: string, content: string = ''): Promise<WorkspaceFile | null> => {
      if (!currentWorkspace) {
        setError('No workspace selected');
        return null;
      }

      setError(null);

      try {
        const file = await service.createFile(currentWorkspace.id, path, content);
        if (file) {
          setStorageUsage(service.getStorageUsage(currentWorkspace.id));
        }
        return file;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create file');
        return null;
      }
    },
    [currentWorkspace]
  );

  // Update file
  const updateFile = useCallback(
    async (path: string, content: string): Promise<boolean> => {
      if (!currentWorkspace) {
        setError('No workspace selected');
        return false;
      }

      setError(null);

      try {
        const success = await service.updateFileContent(currentWorkspace.id, path, content);
        if (success) {
          setStorageUsage(service.getStorageUsage(currentWorkspace.id));
        }
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update file');
        return false;
      }
    },
    [currentWorkspace]
  );

  // Delete file
  const deleteFile = useCallback(
    async (path: string): Promise<boolean> => {
      if (!currentWorkspace) {
        setError('No workspace selected');
        return false;
      }

      setError(null);

      try {
        const success = await service.deleteFile(currentWorkspace.id, path);
        if (success) {
          setStorageUsage(service.getStorageUsage(currentWorkspace.id));
        }
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete file');
        return false;
      }
    },
    [currentWorkspace]
  );

  // Get file content
  const getFileContent = useCallback(
    (path: string): string | null => {
      if (!currentWorkspace) {
        return null;
      }
      return service.getFileContent(currentWorkspace.id, path);
    },
    [currentWorkspace]
  );

  // List directory
  const listDirectory = useCallback(
    (path: string = '/'): ReturnType<WorkspaceService['listDirectory']> => {
      if (!currentWorkspace) {
        return { path, files: [], totalCount: 0 };
      }
      return service.listDirectory(currentWorkspace.id, path);
    },
    [currentWorkspace]
  );

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadWorkspaces();
    }
  }, [autoLoad, loadWorkspaces]);

  return {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    createWorkspace,
    selectWorkspace,
    deleteWorkspace,
    updateSettings,
    createFile,
    updateFile,
    deleteFile,
    getFileContent,
    listDirectory,
    storageUsage,
  };
}

export default useWorkspace;
