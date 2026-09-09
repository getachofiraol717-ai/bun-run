/**
 * Runtime Registry for Terminal Sandbox
 * Central registry for managing all runtime environments
 */

import PythonRuntime from './PythonRuntime';
import NodeRuntime from './NodeRuntime';
import GitWorkspace from './GitWorkspace';
import ZipTools from './ZipTools';
import DockerRuntime from './DockerRuntime';
import type { RuntimeProfile, CommandResult } from '../models/types';

export type RuntimeType = 'python' | 'node' | 'git' | 'zip' | 'docker';

export interface RuntimeInfo {
  type: RuntimeType;
  name: string;
  version: string;
  initialized: boolean;
  executable: string;
  maxMemoryMB: number;
}

/**
 * RuntimeRegistry - Central registry for all runtime environments
 */
export class RuntimeRegistry {
  private static instance: RuntimeRegistry | null = null;
  private runtimes: Map<RuntimeType, {
    instance: PythonRuntime | NodeRuntime | GitWorkspace | ZipTools;
    type: RuntimeType;
    name: string;
    initialized: boolean;
  }> = new Map();

  private constructor() {
    this.initializeRuntimes();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RuntimeRegistry {
    if (!RuntimeRegistry.instance) {
      RuntimeRegistry.instance = new RuntimeRegistry();
    }
    return RuntimeRegistry.instance;
  }

  /**
   * Initialize all available runtimes
   */
  private initializeRuntimes(): void {
    this.runtimes.set('python', {
      instance: PythonRuntime.getInstance(),
      type: 'python',
      name: 'Python',
      initialized: false,
    });

    this.runtimes.set('node', {
      instance: NodeRuntime.getInstance(),
      type: 'node',
      name: 'Node.js',
      initialized: false,
    });

    this.runtimes.set('git', {
      instance: GitWorkspace.getInstance(),
      type: 'git',
      name: 'Git',
      initialized: false,
    });

    this.runtimes.set('zip', {
      instance: ZipTools.getInstance(),
      type: 'zip',
      name: 'ZIP Tools',
      initialized: false,
    });

    this.runtimes.set('docker', {
      instance: DockerRuntime as any,
      type: 'docker',
      name: 'Docker Container Engine',
      initialized: true,
    });
  }

  /**
   * Initialize a specific runtime
   */
  async initializeRuntime(type: RuntimeType, profile?: RuntimeProfile): Promise<boolean> {
    const runtime = this.runtimes.get(type);
    if (!runtime) {
      return false;
    }

    try {
      switch (type) {
        case 'python':
          await (runtime.instance as PythonRuntime).initialize(profile!);
          break;
        case 'node':
          await (runtime.instance as NodeRuntime).initialize(profile!);
          break;
        // Git and ZIP don't need explicit initialization
      }

      runtime.initialized = true;
      return true;
    } catch (error) {
      console.error(`Failed to initialize ${type} runtime:`, error);
      return false;
    }
  }

  /**
   * Initialize all runtimes
   */
  async initializeAll(profile?: RuntimeProfile): Promise<void> {
    const initPromises = Array.from(this.runtimes.keys()).map((type) =>
      this.initializeRuntime(type, profile).catch(() => false)
    );

    await Promise.allSettled(initPromises);
  }

  /**
   * Get runtime by type
   */
  getRuntime(type: RuntimeType): PythonRuntime | NodeRuntime | GitWorkspace | ZipTools | undefined {
    return this.runtimes.get(type)?.instance;
  }

  /**
   * Get runtime info
   */
  getRuntimeInfo(type: RuntimeType): RuntimeInfo | undefined {
    const runtime = this.runtimes.get(type);
    if (!runtime) {
      return undefined;
    }

    let version = '';
    let executable = '';
    let maxMemoryMB = 512;

    switch (type) {
      case 'python':
        version = (runtime.instance as PythonRuntime).getVersion();
        executable = 'python3';
        break;
      case 'node':
        version = (runtime.instance as NodeRuntime).getVersion();
        executable = 'node';
        break;
      case 'git':
        version = '2.40.0';
        executable = 'git';
        break;
      case 'zip':
        version = '3.0';
        executable = 'zip';
        break;
    }

    return {
      type,
      name: runtime.name,
      version,
      initialized: runtime.initialized,
      executable,
      maxMemoryMB,
    };
  }

  /**
   * Get all runtime info
   */
  getAllRuntimeInfo(): RuntimeInfo[] {
    return Array.from(this.runtimes.keys()).map((type) =>
      this.getRuntimeInfo(type)!
    ).filter(Boolean);
  }

  /**
   * Check if runtime is available
   */
  isRuntimeAvailable(type: RuntimeType): boolean {
    return this.runtimes.has(type);
  }

  /**
   * Check if runtime is initialized
   */
  isRuntimeInitialized(type: RuntimeType): boolean {
    return this.runtimes.get(type)?.initialized || false;
  }

  /**
   * Get all available runtime types
   */
  getAvailableRuntimes(): RuntimeType[] {
    return Array.from(this.runtimes.keys());
  }

  /**
   * Execute code in a specific runtime
   */
  async execute(
    type: RuntimeType,
    code: string,
    options?: { timeout?: number }
  ): Promise<CommandResult> {
    const runtime = this.runtimes.get(type);
    if (!runtime) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: `Runtime '${type}' not available`,
        executionTime: 0,
        timestamp: new Date(),
      };
    }

    if (!runtime.initialized) {
      await this.initializeRuntime(type);
    }

    try {
      switch (type) {
        case 'python':
          return await (runtime.instance as PythonRuntime).execute(
            code,
            options?.timeout
          );
        case 'node':
          return await (runtime.instance as NodeRuntime).execute(
            code,
            options?.timeout
          );
        default:
          return {
            success: false,
            exitCode: 1,
            stdout: '',
            stderr: `Runtime '${type}' does not support direct code execution`,
            executionTime: 0,
            timestamp: new Date(),
          };
      }
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Install package in a runtime
   */
  async installPackage(
    type: RuntimeType,
    packageName: string,
    version?: string
  ): Promise<CommandResult> {
    const runtime = this.runtimes.get(type);
    if (!runtime) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: `Runtime '${type}' not available`,
        executionTime: 0,
        timestamp: new Date(),
      };
    }

    if (!runtime.initialized) {
      await this.initializeRuntime(type);
    }

    try {
      switch (type) {
        case 'python':
          return await (runtime.instance as PythonRuntime).installPackage(
            packageName,
            version
          );
        case 'node':
          return await (runtime.instance as NodeRuntime).installPackage(
            packageName,
            version
          );
        default:
          return {
            success: false,
            exitCode: 1,
            stdout: '',
            stderr: `Runtime '${type}' does not support package installation`,
            executionTime: 0,
            timestamp: new Date(),
          };
      }
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Installation failed',
        executionTime: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get Python runtime instance
   */
  getPythonRuntime(): PythonRuntime | undefined {
    return this.getRuntime('python') as PythonRuntime | undefined;
  }

  /**
   * Get Node runtime instance
   */
  getNodeRuntime(): NodeRuntime | undefined {
    return this.getRuntime('node') as NodeRuntime | undefined;
  }

  /**
   * Get Git workspace instance
   */
  getGitWorkspace(): GitWorkspace | undefined {
    return this.getRuntime('git') as GitWorkspace | undefined;
  }

  /**
   * Get ZIP tools instance
   */
  getZipTools(): ZipTools | undefined {
    return this.getRuntime('zip') as ZipTools | undefined;
  }
}

export default RuntimeRegistry;
