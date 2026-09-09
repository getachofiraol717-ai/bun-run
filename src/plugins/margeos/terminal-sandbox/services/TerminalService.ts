/**
 * Terminal Service for Terminal Sandbox
 * Main service for terminal operations
 */

import TerminalSandboxEngine from '../core/TerminalSandboxEngine';
import CommandDispatcher from '../core/CommandDispatcher';
import type {
  TerminalSession,
  CommandResult,
  TerminalRuntime,
} from '../models/types';

export interface TerminalOptions {
  userId?: string;
  sessionId?: string;
  runtime?: TerminalRuntime;
  workspaceId?: string;
  onOutput?: (output: string) => void;
  onError?: (error: string) => void;
  onSessionUpdate?: (session: TerminalSession) => void;
}

/**
 * TerminalService - Main service for terminal operations
 */
export class TerminalService {
  private static instance: TerminalService | null = null;
  private engine: TerminalSandboxEngine;
  private dispatcher: CommandDispatcher;
  private listeners: Map<string, {
    onOutput?: (output: string) => void;
    onError?: (error: string) => void;
    onSessionUpdate?: (session: TerminalSession) => void;
  }> = new Map();

  private constructor() {
    this.engine = TerminalSandboxEngine.getInstance();
    this.dispatcher = CommandDispatcher.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TerminalService {
    if (!TerminalService.instance) {
      TerminalService.instance = new TerminalService();
    }
    return TerminalService.instance;
  }

  /**
   * Create a new terminal session
   */
  async createSession(options: TerminalOptions = {}): Promise<TerminalSession | null> {
    try {
      const session = await this.engine.createSession(
        options.userId || 'default',
        options.runtime || 'bash'
      );

      if (session && options.workspaceId) {
        await this.engine.attachWorkspace(session.id, options.workspaceId);
      }

      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }

  /**
   * Execute a command in a session
   */
  async executeCommand(
    sessionId: string,
    command: string
  ): Promise<CommandResult> {
    try {
      const session = this.engine.getSession(sessionId);
      if (!session) {
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: 'Session not found',
          executionTime: 0,
          timestamp: new Date(),
        };
      }

      // Emit output event
      this.emit(sessionId, 'output', `> ${command}\n`);

      // Execute via dispatcher
      const result = await this.dispatcher.execute(sessionId, command);

      // Add to history
      await this.engine.addToHistory(sessionId, {
        command,
        exitCode: result.exitCode,
        timestamp: new Date(),
      });

      // Emit result
      if (result.stdout) {
        this.emit(sessionId, 'output', result.stdout + '\n');
      }

      if (result.stderr) {
        this.emit(sessionId, 'error', result.stderr + '\n');
      }

      return result;
    } catch (error) {
      const errorResult: CommandResult = {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Command execution failed',
        executionTime: 0,
        timestamp: new Date(),
      };

      this.emit(sessionId, 'error', errorResult.stderr + '\n');
      return errorResult;
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.engine.getSession(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): TerminalSession[] {
    return this.engine.getAllSessions();
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    try {
      return await this.engine.closeSession(sessionId);
    } catch (error) {
      console.error('Failed to close session:', error);
      return false;
    }
  }

  /**
   * Get command history for a session
   */
  getHistory(sessionId: string): { command: string; exitCode: number; timestamp: Date }[] {
    const session = this.engine.getSession(sessionId);
    return session?.history || [];
  }

  /**
   * Clear history for a session
   */
  async clearHistory(sessionId: string): Promise<boolean> {
    return this.engine.clearHistory(sessionId);
  }

  /**
   * Register event listeners for a session
   */
  on(
    sessionId: string,
    event: 'output' | 'error' | 'sessionUpdate',
    callback: (data: string | TerminalSession) => void
  ): () => void {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, {});
    }

    const listener = this.listeners.get(sessionId)!;

    switch (event) {
      case 'output':
        listener.onOutput = callback as (output: string) => void;
        break;
      case 'error':
        listener.onError = callback as (error: string) => void;
        break;
      case 'sessionUpdate':
        listener.onSessionUpdate = callback as (session: TerminalSession) => void;
        break;
    }

    // Return unsubscribe function
    return () => {
      this.off(sessionId, event);
    };
  }

  /**
   * Unregister event listeners
   */
  off(sessionId: string, event: 'output' | 'error' | 'sessionUpdate'): void {
    const listener = this.listeners.get(sessionId);
    if (!listener) return;

    switch (event) {
      case 'output':
        listener.onOutput = undefined;
        break;
      case 'error':
        listener.onError = undefined;
        break;
      case 'sessionUpdate':
        listener.onSessionUpdate = undefined;
        break;
    }
  }

  /**
   * Emit an event
   */
  private emit(sessionId: string, event: string, data: string | TerminalSession): void {
    const listener = this.listeners.get(sessionId);
    if (!listener) return;

    switch (event) {
      case 'output':
        listener.onOutput?.(data as string);
        break;
      case 'error':
        listener.onError?.(data as string);
        break;
      case 'sessionUpdate':
        listener.onSessionUpdate?.(data as TerminalSession);
        break;
    }
  }

  /**
   * Write to terminal output
   */
  write(sessionId: string, text: string): void {
    this.emit(sessionId, 'output', text);
  }

  /**
   * Write error to terminal
   */
  writeError(sessionId: string, error: string): void {
    this.emit(sessionId, 'error', error);
  }

  /**
   * Clear terminal screen
   */
  clear(sessionId: string): void {
    this.emit(sessionId, 'output', '\x1b[2J\x1b[H');
  }

  /**
   * Set session status
   */
  setStatus(sessionId: string, status: TerminalSession['status']): void {
    this.engine.updateSessionStatus(sessionId, status);
    const session = this.engine.getSession(sessionId);
    if (session) {
      this.emit(sessionId, 'sessionUpdate', session);
    }
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.engine.getAllSessions().length;
  }
}

export default TerminalService;
