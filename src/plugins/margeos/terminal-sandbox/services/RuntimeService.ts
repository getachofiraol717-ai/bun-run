/**
 * Runtime Service for Terminal Sandbox
 * Manages runtime environments
 */

import RuntimeRegistry from '../runtimes/RuntimeRegistry';
import PythonRuntime from '../runtimes/PythonRuntime';
import NodeRuntime from '../runtimes/NodeRuntime';
import GitWorkspace from '../runtimes/GitWorkspace';
import ZipTools from '../runtimes/ZipTools';
import type { RuntimeProfile, CommandResult, InstalledPackage } from '../models/types';

/**
 * RuntimeService - Manages runtime environments for terminal sessions
 */
export class RuntimeService {
  private static instance: RuntimeService | null = null;
  private registry: RuntimeRegistry;

  private constructor() {
    this.registry = RuntimeRegistry.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RuntimeService {
    if (!RuntimeService.instance) {
      RuntimeService.instance = new RuntimeService();
    }
    return RuntimeService.instance;
  }

  /**
   * Initialize all runtimes
   */
  async initializeAll(profile?: RuntimeProfile): Promise<void> {
    await this.registry.initializeAll(profile);
  }

  /**
   * Initialize a specific runtime
   */
  async initialize(type: 'python' | 'node' | 'git' | 'zip', profile?: RuntimeProfile): Promise<boolean> {
    return this.registry.initializeRuntime(type, profile);
  }

  /**
   * Get runtime info
   */
  getRuntimeInfo(type: 'python' | 'node' | 'git' | 'zip') {
    return this.registry.getRuntimeInfo(type);
  }

  /**
   * Get all runtime info
   */
  getAllRuntimeInfo() {
    return this.registry.getAllRuntimeInfo();
  }

  /**
   * Execute code in a runtime
   */
  async execute(
    type: 'python' | 'node',
    code: string,
    options?: { timeout?: number }
  ): Promise<CommandResult> {
    return this.registry.execute(type, code, options);
  }

  /**
   * Execute Python code
   */
  async executePython(code: string, timeout?: number): Promise<CommandResult> {
    return this.execute('python', code, { timeout });
  }

  /**
   * Execute Node.js code
   */
  async executeNode(code: string, timeout?: number): Promise<CommandResult> {
    return this.execute('node', code, { timeout });
  }

  /**
   * Install a package in a runtime
   */
  async installPackage(
    type: 'python' | 'node',
    packageName: string,
    version?: string
  ): Promise<CommandResult> {
    return this.registry.installPackage(type, packageName, version);
  }

  /**
   * Install Python package
   */
  async installPythonPackage(packageName: string, version?: string): Promise<CommandResult> {
    return this.installPackage('python', packageName, version);
  }

  /**
   * Install Node.js package
   */
  async installNodePackage(packageName: string, version?: string): Promise<CommandResult> {
    return this.installPackage('node', packageName, version);
  }

  /**
   * Get installed packages for a runtime
   */
  getInstalledPackages(type: 'python' | 'node'): InstalledPackage[] {
    switch (type) {
      case 'python':
        return PythonRuntime.getInstance().listPackages();
      case 'node':
        return NodeRuntime.getInstance().listPackages();
      default:
        return [];
    }
  }

  /**
   * Get Python packages
   */
  getPythonPackages(): InstalledPackage[] {
    return this.getInstalledPackages('python');
  }

  /**
   * Get Node.js packages
   */
  getNodePackages(): InstalledPackage[] {
    return this.getInstalledPackages('node');
  }

  /**
   * Git operations
   */
  async gitClone(url: string, path: string, depth?: number): Promise<CommandResult> {
    return GitWorkspace.getInstance().clone(url, path, depth);
  }

  async gitInit(name: string, path: string): Promise<CommandResult> {
    return GitWorkspace.getInstance().init(name, path);
  }

  async gitStatus(repoPath: string): Promise<CommandResult> {
    return GitWorkspace.getInstance().status(repoPath);
  }

  async gitCommit(repoPath: string, message: string): Promise<CommandResult> {
    return GitWorkspace.getInstance().commit(repoPath, message);
  }

  async gitLog(repoPath: string, limit?: number): Promise<CommandResult> {
    return GitWorkspace.getInstance().log(repoPath, limit);
  }

  async gitAdd(repoPath: string, files: string[]): Promise<CommandResult> {
    return GitWorkspace.getInstance().add(repoPath, files);
  }

  async gitCheckout(repoPath: string, branch: string): Promise<CommandResult> {
    return GitWorkspace.getInstance().checkout(repoPath, branch);
  }

  async gitBranch(repoPath: string, name: string, checkout?: boolean): Promise<CommandResult> {
    return GitWorkspace.getInstance().branch(repoPath, name, checkout);
  }

  /**
   * Archive operations
   */
  async createArchive(
    archivePath: string,
    files: string[],
    compressionLevel?: number
  ): Promise<CommandResult> {
    return ZipTools.getInstance().createArchive(archivePath, files, compressionLevel);
  }

  async extractArchive(archivePath: string, destination: string): Promise<CommandResult> {
    return ZipTools.getInstance().extractArchive(archivePath, destination);
  }

  async listArchive(archivePath: string): Promise<CommandResult> {
    return ZipTools.getInstance().listArchive(archivePath);
  }

  async testArchive(archivePath: string): Promise<CommandResult> {
    return ZipTools.getInstance().testArchive(archivePath);
  }

  /**
   * Check if runtime is available
   */
  isAvailable(type: 'python' | 'node' | 'git' | 'zip'): boolean {
    return this.registry.isRuntimeAvailable(type);
  }

  /**
   * Check if runtime is initialized
   */
  isInitialized(type: 'python' | 'node' | 'git' | 'zip'): boolean {
    return this.registry.isRuntimeInitialized(type);
  }

  /**
   * Get runtime version
   */
  getVersion(type: 'python' | 'node' | 'git' | 'zip'): string {
    const info = this.getRuntimeInfo(type);
    return info?.version || 'Not available';
  }
}

export default RuntimeService;
