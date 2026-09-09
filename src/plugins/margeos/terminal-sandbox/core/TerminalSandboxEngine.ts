/**
 * Terminal Sandbox Engine
 * Main engine for terminal sandbox management
 */

import type {
  TerminalSession,
  TerminalRuntime,
  Workspace,
  CommandResult,
} from '../models/types';
import { createTerminalSession, addToHistory } from '../models/TerminalSession';
import { createWorkspace } from '../models/Workspace';

const STORAGE_KEY = 'terminal_sandbox_engine';

interface EngineState {
  sessions: TerminalSession[];
  workspaces: Workspace[];
  activeSessionId: string | null;
}

export class TerminalSandboxEngine {
  private static instance: TerminalSandboxEngine | null = null;
  private sessions: Map<string, TerminalSession> = new Map();
  private workspaces: Map<string, Workspace> = new Map();
  private activeSessionId: string | null = null;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): TerminalSandboxEngine {
    if (!TerminalSandboxEngine.instance) {
      TerminalSandboxEngine.instance = new TerminalSandboxEngine();
    }
    return TerminalSandboxEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.loadFromStorage();
    this.initialized = true;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: EngineState = JSON.parse(stored);
        this.sessions = new Map(
          state.sessions.map((s) => [
            s.id,
            { ...s, startedAt: new Date(s.startedAt), lastActivity: new Date(s.lastActivity), history: s.history.map((h) => ({ ...h, timestamp: new Date(h.timestamp) })) },
          ])
        );
        this.workspaces = new Map(
          state.workspaces.map((w) => [
            w.id,
            { ...w, createdAt: new Date(w.createdAt), updatedAt: new Date(w.updatedAt) },
          ])
        );
        this.activeSessionId = state.activeSessionId;
      }
    } catch (error) {
      console.error('Failed to load terminal sandbox state:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const state: EngineState = {
        sessions: Array.from(this.sessions.values()),
        workspaces: Array.from(this.workspaces.values()),
        activeSessionId: this.activeSessionId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save terminal sandbox state:', error);
    }
  }

  createSession(userId: string, runtime: TerminalRuntime): TerminalSession {
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const session = createTerminalSession(id, userId, runtime);
    this.sessions.set(id, session);
    this.activeSessionId = id;
    this.saveToStorage();
    return session;
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  closeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = 'closed';
    this.sessions.set(sessionId, session);
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    this.saveToStorage();
    return true;
  }

  updateSessionStatus(sessionId: string, status: TerminalSession['status']): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = status;
    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);
    this.saveToStorage();
    return true;
  }

  addToHistory(sessionId: string, entry: { command: string; exitCode: number; timestamp: Date }): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    const updated = addToHistory(session, entry);
    this.sessions.set(sessionId, updated);
    this.saveToStorage();
    return true;
  }

  clearHistory(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.history = [];
    this.sessions.set(sessionId, session);
    this.saveToStorage();
    return true;
  }

  async createWorkspace(name: string, userId: string): Promise<Workspace | null> {
    try {
      const id = `workspace-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const path = `/tmp/terminal-sandbox/workspaces/${id}`;
      const workspace = createWorkspace(id, name, userId, path);
      this.workspaces.set(id, workspace);
      this.saveToStorage();
      return workspace;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      return null;
    }
  }

  getWorkspace(workspaceId: string): Workspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  getWorkspacesByUser(userId: string): Workspace[] {
    return Array.from(this.workspaces.values()).filter((w) => w.userId === userId);
  }

  deleteWorkspace(workspaceId: string): boolean {
    const result = this.workspaces.delete(workspaceId);
    if (result) {
      this.saveToStorage();
    }
    return result;
  }

  attachWorkspace(sessionId: string, workspaceId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.workspaceId = workspaceId;
    this.sessions.set(sessionId, session);
    this.saveToStorage();
    return true;
  }

  getActiveSession(): TerminalSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) || null;
  }

  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }
}

export default TerminalSandboxEngine;
