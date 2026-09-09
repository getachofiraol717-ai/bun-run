/**
 * Git Workspace Integration for Terminal Sandbox
 * Provides Git operations and repository management
 */

import type { CommandResult } from '../models/types';

export interface GitRepository {
  name: string;
  path: string;
  remote: string | null;
  branch: string;
  branches: string[];
  lastCommit: GitCommit | null;
  status: GitStatus;
  createdAt: Date;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

export interface GitStatus {
  staged: string[];
  modified: string[];
  untracked: string[];
  deleted: string[];
  ahead: number;
  behind: number;
}

export interface GitConfig {
  userName: string;
  userEmail: string;
  defaultBranch: string;
  автопуш: boolean;
}

/**
 * GitWorkspace - Manages Git operations within sandbox
 */
export class GitWorkspace {
  private static instance: GitWorkspace | null = null;
  private repositories: Map<string, GitRepository> = new Map();
  private config: GitConfig;
  private commitHistory: Map<string, GitCommit[]> = new Map();

  private constructor() {
    this.config = {
      userName: 'Terminal User',
      userEmail: 'user@terminal.local',
      defaultBranch: 'main',
      автопуш: false,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GitWorkspace {
    if (!GitWorkspace.instance) {
      GitWorkspace.instance = new GitWorkspace();
    }
    return GitWorkspace.instance;
  }

  /**
   * Initialize a new Git repository
   */
  async init(name: string, path: string): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      const repo: GitRepository = {
        name,
        path,
        remote: null,
        branch: this.config.defaultBranch,
        branches: [this.config.defaultBranch],
        lastCommit: null,
        status: {
          staged: [],
          modified: [],
          untracked: [],
          deleted: [],
          ahead: 0,
          behind: 0,
        },
        createdAt: new Date(),
      };

      this.repositories.set(path, repo);
      this.commitHistory.set(path, []);

      return {
        success: true,
        exitCode: 0,
        stdout: `Initialized empty Git repository in ${path}\nBranch '${this.config.defaultBranch}' set as default`,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Git init failed',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Clone a repository
   */
  async clone(url: string, path: string, depth?: number): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      // Extract repository name from URL
      const urlParts = url.split('/');
      const repoName = urlParts[urlParts.length - 1]?.replace('.git', '') || 'repo';

      const repo: GitRepository = {
        name: repoName,
        path,
        remote: url,
        branch: this.config.defaultBranch,
        branches: [this.config.defaultBranch],
        lastCommit: {
          hash: this.generateHash(),
          message: 'Initial commit',
          author: `${this.config.userName} <${this.config.userEmail}>`,
          date: new Date(),
          files: ['README.md'],
        },
        status: {
          staged: [],
          modified: [],
          untracked: [],
          deleted: [],
          ahead: 0,
          behind: 0,
        },
        createdAt: new Date(),
      };

      this.repositories.set(path, repo);
      this.commitHistory.set(path, [repo.lastCommit]);

      const depthInfo = depth ? ` (depth: ${depth})` : '';
      return {
        success: true,
        exitCode: 0,
        stdout: `Cloning into '${path}'...\nRemote: ${url}${depthInfo}\nBranch: ${this.config.defaultBranch}`,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 128,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Git clone failed',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Stage files for commit
   */
  async add(repoPath: string, files: string[]): Promise<CommandResult> {
    const startTime = Date.now();

    const repo = this.repositories.get(repoPath);
    if (!repo) {
      return {
        success: false,
        exitCode: 128,
        stdout: '',
        stderr: `fatal: not a git repository: ${repoPath}`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    for (const file of files) {
      const index = repo.status.untracked.indexOf(file);
      if (index !== -1) {
        repo.status.untracked.splice(index, 1);
      }
      if (!repo.status.staged.includes(file)) {
        repo.status.staged.push(file);
      }
    }

    return {
      success: true,
      exitCode: 0,
      stdout: files.length > 0 ? `Added ${files.length} file(s)` : 'No files added',
      stderr: '',
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Create a commit
   */
  async commit(repoPath: string, message: string): Promise<CommandResult> {
    const startTime = Date.now();

    const repo = this.repositories.get(repoPath);
    if (!repo) {
      return {
        success: false,
        exitCode: 128,
        stdout: '',
        stderr: `fatal: not a git repository: ${repoPath}`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    if (repo.status.staged.length === 0) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: 'Nothing to commit (working directory clean)',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    const commit: GitCommit = {
      hash: this.generateHash(),
      message,
      author: `${this.config.userName} <${this.config.userEmail}>`,
      date: new Date(),
      files: [...repo.status.staged],
    };

    repo.lastCommit = commit;
    repo.status.staged = [];

    const history = this.commitHistory.get(repoPath) || [];
    history.unshift(commit);
    this.commitHistory.set(repoPath, history);

    return {
      success: true,
      exitCode: 0,
      stdout: `[${repo.branch} ${commit.hash.slice(0, 7)}] ${message}\n ${commit.files.length} file(s) changed`,
      stderr: '',
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Show repository status
   */
  async status(repoPath: string): Promise<CommandResult> {
    const startTime = Date.now();

    const repo = this.repositories.get(repoPath);
    if (!repo) {
      return {
        success: false,
        exitCode: 128,
        stdout: '',
        stderr: `fatal: not a git repository: ${repoPath}`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    let output = `On branch ${repo.branch}\n`;

    if (repo.status.staged.length > 0) {
      output += '\nChanges to be committed:\n';
      for (const file of repo.status.staged) {
        output += `  ${file}\n`;
      }
    }

    if (repo.status.modified.length > 0) {
      output += '\nChanges not staged for commit:\n';
      for (const file of repo.status.modified) {
        output += `  ${file}\n`;
      }
    }

    if (repo.status.untracked.length > 0) {
      output += '\nUntracked files:\n';
      for (const file of repo.status.untracked) {
        output += `  ${file}\n`;
      }
    }

    if (repo.status.deleted.length > 0) {
      output += '\nDeleted files:\n';
      for (const file of repo.status.deleted) {
        output += `  ${file}\n`;
      }
    }

    if (
      repo.status.staged.length === 0 &&
      repo.status.modified.length === 0 &&
      repo.status.untracked.length === 0 &&
      repo.status.deleted.length === 0
    ) {
      output += '\nNothing to commit, working directory clean';
    }

    return {
      success: true,
      exitCode: 0,
      stdout: output,
      stderr: '',
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Show commit log
   */
  async log(repoPath: string, limit?: number): Promise<CommandResult> {
    const startTime = Date.now();

    const history = this.commitHistory.get(repoPath);
    if (!history || history.length === 0) {
      return {
        success: false,
        exitCode: 128,
        stdout: '',
        stderr: `fatal: your repository has no commits`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    const limitCount = limit || history.length;
    let output = '';

    for (let i = 0; i < Math.min(limitCount, history.length); i++) {
      const commit = history[i];
      output += `commit ${commit.hash}\n`;
      output += `Author: ${commit.author}\n`;
      output += `Date:   ${commit.date.toISOString()}\n\n`;
      output += `    ${commit.message}\n\n`;
    }

    return {
      success: true,
      exitCode: 0,
      stdout: output,
      stderr: '',
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Switch branches
   */
  async checkout(repoPath: string, branch: string): Promise<CommandResult> {
    const startTime = Date.now();

    const repo = this.repositories.get(repoPath);
    if (!repo) {
      return {
        success: false,
        exitCode: 128,
        stdout: '',
        stderr: `fatal: not a git repository: ${repoPath}`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    if (!repo.branches.includes(branch)) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: `error: pathspec '${branch}' did not match any file(s) known to git`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    repo.branch = branch;

    return {
      success: true,
      exitCode: 0,
      stdout: `Switched to branch '${branch}'`,
      stderr: '',
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Create a new branch
   */
  async branch(repoPath: string, name: string, checkout: boolean = false): Promise<CommandResult> {
    const startTime = Date.now();

    const repo = this.repositories.get(repoPath);
    if (!repo) {
      return {
        success: false,
        exitCode: 128,
        stdout: '',
        stderr: `fatal: not a git repository: ${repoPath}`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    if (repo.branches.includes(name)) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: `fatal: A branch named '${name}' already exists.`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    repo.branches.push(name);

    if (checkout) {
      repo.branch = name;
      return {
        success: true,
        exitCode: 0,
        stdout: `Created branch '${name}' and switched to it`,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      exitCode: 0,
      stdout: `Created branch '${name}'`,
      stderr: '',
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * Get repository info
   */
  getRepository(path: string): GitRepository | undefined {
    return this.repositories.get(path);
  }

  /**
   * List all repositories
   */
  listRepositories(): GitRepository[] {
    return Array.from(this.repositories.values());
  }

  /**
   * Configure Git settings
   */
  configure(settings: Partial<GitConfig>): void {
    this.config = { ...this.config, ...settings };
  }

  /**
   * Get Git configuration
   */
  getConfig(): GitConfig {
    return { ...this.config };
  }

  /**
   * Generate a random commit hash
   */
  private generateHash(): string {
    return Array.from({ length: 40 }, () =>
      Math.random().toString(16).charAt(2)
    ).join('');
  }
}

export default GitWorkspace;
