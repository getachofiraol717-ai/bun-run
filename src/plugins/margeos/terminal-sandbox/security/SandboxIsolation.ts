/**
 * Sandbox Isolation for Terminal Sandbox
 * Provides process and resource isolation mechanisms
 */

import type { SandboxPolicy, SecurityEvent } from '../models/types';

export interface IsolationContext {
  sessionId: string;
  userId: string;
  sandboxPath: string;
  allowedPaths: string[];
  deniedPaths: string[];
  startTime: Date;
}

export interface IsolationResult {
  success: boolean;
  context?: IsolationContext;
  error?: string;
}

/**
 * SandboxIsolation - Manages sandbox isolation for terminal sessions
 */
export class SandboxIsolation {
  private static instance: SandboxIsolation | null = null;
  private contexts: Map<string, IsolationContext> = new Map();
  private globalAllowedPaths: string[] = ['/tmp/terminal-sandbox'];
  private globalDeniedPaths: string[] = [
    '/etc',
    '/root',
    '/sys',
    '/proc',
    '/boot',
    '/dev',
  ];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SandboxIsolation {
    if (!SandboxIsolation.instance) {
      SandboxIsolation.instance = new SandboxIsolation();
    }
    return SandboxIsolation.instance;
  }

  /**
   * Create an isolated context for a session
   */
  createContext(
    sessionId: string,
    userId: string,
    policy?: SandboxPolicy
  ): IsolationResult {
    try {
      const sandboxPath = `/tmp/terminal-sandbox/sessions/${sessionId}`;

      const context: IsolationContext = {
        sessionId,
        userId,
        sandboxPath,
        allowedPaths: policy?.allowedPaths || [...this.globalAllowedPaths],
        deniedPaths: policy?.deniedPaths || [...this.globalDeniedPaths],
        startTime: new Date(),
      };

      this.contexts.set(sessionId, context);

      return {
        success: true,
        context,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create context',
      };
    }
  }

  /**
   * Get an isolation context
   */
  getContext(sessionId: string): IsolationContext | undefined {
    return this.contexts.get(sessionId);
  }

  /**
   * Check if a path is accessible within the sandbox
   */
  isPathAccessible(sessionId: string, path: string): boolean {
    const context = this.contexts.get(sessionId);
    if (!context) {
      return false;
    }

    // Check denied paths first
    for (const denied of context.deniedPaths) {
      if (path.startsWith(denied)) {
        return false;
      }
    }

    // Check allowed paths
    for (const allowed of context.allowedPaths) {
      if (path.startsWith(allowed) || path === allowed) {
        return true;
      }
    }

    // Default deny
    return false;
  }

  /**
   * Validate path access and return detailed result
   */
  validatePathAccess(sessionId: string, path: string): {
    accessible: boolean;
    reason?: string;
    sanitizedPath?: string;
  } {
    const context = this.contexts.get(sessionId);
    if (!context) {
      return {
        accessible: false,
        reason: 'No isolation context found for session',
      };
    }

    // Normalize path
    const normalizedPath = this.normalizePath(path);

    // Check if in denied list
    for (const denied of context.deniedPaths) {
      if (normalizedPath.startsWith(denied)) {
        return {
          accessible: false,
          reason: `Path is in denied directory: ${denied}`,
          sanitizedPath: `${context.sandboxPath}/${path.split('/').pop()}`,
        };
      }
    }

    // Check if in allowed list
    for (const allowed of context.allowedPaths) {
      if (normalizedPath.startsWith(allowed) || normalizedPath === allowed) {
        return {
          accessible: true,
          sanitizedPath: normalizedPath,
        };
      }
    }

    // Redirect to sandbox if not in allowed list
    return {
      accessible: true,
      reason: 'Path redirected to sandbox',
      sanitizedPath: `${context.sandboxPath}/${path.split('/').pop()}`,
    };
  }

  /**
   * Normalize a file path
   */
  private normalizePath(path: string): string {
    // Remove leading/trailing whitespace
    let normalized = path.trim();

    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');

    // Remove /./ components
    normalized = normalized.replace(/\/\.\//g, '/');

    // Handle ../ components
    const parts = normalized.split('/');
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else if (part !== '.' && part !== '') {
        resolved.push(part);
      }
    }

    normalized = '/' + resolved.join('/');

    return normalized;
  }

  /**
   * Destroy an isolation context
   */
  destroyContext(sessionId: string): boolean {
    return this.contexts.delete(sessionId);
  }

  /**
   * Get all active contexts
   */
  getAllContexts(): IsolationContext[] {
    return Array.from(this.contexts.values());
  }

  /**
   * Configure global allowed paths
   */
  setGlobalAllowedPaths(paths: string[]): void {
    this.globalAllowedPaths = [...paths];
  }

  /**
   * Configure global denied paths
   */
  setGlobalDeniedPaths(paths: string[]): void {
    this.globalDeniedPaths = [...paths];
  }

  /**
   * Check if session is isolated
   */
  isIsolated(sessionId: string): boolean {
    return this.contexts.has(sessionId);
  }

  /**
   * Get isolation statistics
   */
  getStats(): {
    totalContexts: number;
    activeSessions: number;
    globalAllowedPaths: number;
    globalDeniedPaths: number;
  } {
    return {
      totalContexts: this.contexts.size,
      activeSessions: this.contexts.size,
      globalAllowedPaths: this.globalAllowedPaths.length,
      globalDeniedPaths: this.globalDeniedPaths.length,
    };
  }
}

export default SandboxIsolation;
