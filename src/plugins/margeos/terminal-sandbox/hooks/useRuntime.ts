// @ts-nocheck
/**
 * useRuntime Hook for Terminal Sandbox
 * React hook for runtime operations
 */

import { useState, useCallback, useEffect } from 'react';
import RuntimeService from '../services/RuntimeService';
import type { CommandResult, InstalledPackage } from '../models/types';

export interface RuntimeInfo {
  type: 'python' | 'node' | 'git' | 'zip';
  name: string;
  version: string;
  initialized: boolean;
}

export interface UseRuntimeReturn {
  // State
  runtimes: RuntimeInfo[];
  isInitializing: boolean;
  error: string | null;

  // Actions
  initialize: (type: 'python' | 'node' | 'git' | 'zip') => Promise<boolean>;
  initializeAll: () => Promise<void>;
  execute: (type: 'python' | 'node', code: string, timeout?: number) => Promise<CommandResult>;

  // Python specific
  executePython: (code: string, timeout?: number) => Promise<CommandResult>;
  installPythonPackage: (name: string, version?: string) => Promise<CommandResult>;
  getPythonPackages: () => InstalledPackage[];

  // Node specific
  executeNode: (code: string, timeout?: number) => Promise<CommandResult>;
  installNodePackage: (name: string, version?: string) => Promise<CommandResult>;
  getNodePackages: () => InstalledPackage[];

  // Git operations
  gitClone: (url: string, path: string, depth?: number) => Promise<CommandResult>;
  gitInit: (name: string, path: string) => Promise<CommandResult>;
  gitStatus: (repoPath: string) => Promise<CommandResult>;
  gitCommit: (repoPath: string, message: string) => Promise<CommandResult>;
  gitLog: (repoPath: string, limit?: number) => Promise<CommandResult>;

  // Archive operations
  createArchive: (path: string, files: string[], level?: number) => Promise<CommandResult>;
  extractArchive: (archivePath: string, destination: string) => Promise<CommandResult>;
  listArchive: (archivePath: string) => Promise<CommandResult>;
}

export function useRuntime(): UseRuntimeReturn {
  const [runtimes, setRuntimes] = useState<RuntimeInfo[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const service = RuntimeService.getInstance();

  // Load runtime info
  const loadRuntimeInfo = useCallback(() => {
    const info = service.getAllRuntimeInfo();
    setRuntimes(
      info.map((r) => ({
        type: r.type,
        name: r.name,
        version: r.version,
        initialized: r.initialized,
      }))
    );
  }, []);

  // Initialize runtime
  const initialize = useCallback(
    async (type: 'python' | 'node' | 'git' | 'zip'): Promise<boolean> => {
      setError(null);
      setIsInitializing(true);

      try {
        const success = await service.initialize(type);
        loadRuntimeInfo();
        return success;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Initialization failed');
        return false;
      } finally {
        setIsInitializing(false);
      }
    },
    [loadRuntimeInfo]
  );

  // Initialize all runtimes
  const initializeAll = useCallback(async (): Promise<void> => {
    setError(null);
    setIsInitializing(true);

    try {
      await service.initializeAll();
      loadRuntimeInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Initialization failed');
    } finally {
      setIsInitializing(false);
    }
  }, [loadRuntimeInfo]);

  // Execute code
  const execute = useCallback(
    async (type: 'python' | 'node', code: string, timeout?: number): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.execute(type, code, { timeout });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Execution failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Execution failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  // Python operations
  const executePython = useCallback(
    async (code: string, timeout?: number): Promise<CommandResult> => {
      return execute('python', code, timeout);
    },
    [execute]
  );

  const installPythonPackage = useCallback(
    async (name: string, version?: string): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.installPythonPackage(name, version);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Installation failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Installation failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  const getPythonPackages = useCallback((): InstalledPackage[] => {
    return service.getPythonPackages();
  }, []);

  // Node operations
  const executeNode = useCallback(
    async (code: string, timeout?: number): Promise<CommandResult> => {
      return execute('node', code, timeout);
    },
    [execute]
  );

  const installNodePackage = useCallback(
    async (name: string, version?: string): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.installNodePackage(name, version);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Installation failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Installation failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  const getNodePackages = useCallback((): InstalledPackage[] => {
    return service.getNodePackages();
  }, []);

  // Git operations
  const gitClone = useCallback(
    async (url: string, path: string, depth?: number): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.gitClone(url, path, depth);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Git clone failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Git clone failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  const gitInit = useCallback(
    async (name: string, path: string): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.gitInit(name, path);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Git init failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Git init failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  const gitStatus = useCallback(
    async (repoPath: string): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.gitStatus(repoPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Git status failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Git status failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  const gitCommit = useCallback(
    async (repoPath: string, message: string): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.gitCommit(repoPath, message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Git commit failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Git commit failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  const gitLog = useCallback(
    async (repoPath: string, limit?: number): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.gitLog(repoPath, limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Git log failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Git log failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  // Archive operations
  const createArchive = useCallback(
    async (path: string, files: string[], level?: number): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.createArchive(path, files, level);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Archive creation failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Archive creation failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  const extractArchive = useCallback(
    async (archivePath: string, destination: string): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.extractArchive(archivePath, destination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Archive extraction failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Archive extraction failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  const listArchive = useCallback(
    async (archivePath: string): Promise<CommandResult> => {
      setError(null);

      try {
        return await service.listArchive(archivePath);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Archive listing failed');
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Archive listing failed',
          executionTime: 0,
          timestamp: new Date(),
        };
      }
    },
    []
  );

  // Load runtime info on mount
  useEffect(() => {
    loadRuntimeInfo();
  }, [loadRuntimeInfo]);

  return {
    runtimes,
    isInitializing,
    error,
    initialize,
    initializeAll,
    execute,
    executePython,
    installPythonPackage,
    getPythonPackages,
    executeNode,
    installNodePackage,
    getNodePackages,
    gitClone,
    gitInit,
    gitStatus,
    gitCommit,
    gitLog,
    createArchive,
    extractArchive,
    listArchive,
  };
}

export default useRuntime;
