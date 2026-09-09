/**
 * Session Manager
 * Session lifecycle management for Terminal Sandbox
 */

import type { TerminalSession, SessionStatus, TerminalRuntime } from '../models/types';
import { createTerminalSession } from '../models/TerminalSession';

type SessionListener = {
  onStatusChange?: (session: TerminalSession) => void;
  onClose?: (sessionId: string) => void;
};

export class SessionManager {
  private static instance: SessionManager | null = null;
  private sessions: Map<string, TerminalSession> = new Map();
  private listeners: Map<string, SessionListener> = new Map();

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  createSession(userId: string, runtime: TerminalRuntime): TerminalSession {
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const session = createTerminalSession(id, userId, runtime);
    this.sessions.set(id, session);
    return session;
  }

  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  getActiveSessions(): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.status === 'active' || s.status === 'idle'
    );
  }

  getSessionsByUser(userId: string): TerminalSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }

  closeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = 'closed';
    this.sessions.set(sessionId, session);
    this.listeners.get(sessionId)?.onClose?.(sessionId);
    return true;
  }

  updateSessionStatus(sessionId: string, status: SessionStatus): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = status;
    session.lastActivity = new Date();
    this.sessions.set(sessionId, session);
    this.listeners.get(sessionId)?.onStatusChange?.(session);
    return true;
  }

  registerListener(sessionId: string, listeners: SessionListener): void {
    this.listeners.set(sessionId, listeners);
  }

  unregisterListener(sessionId: string): void {
    this.listeners.delete(sessionId);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getActiveCount(): number {
    return this.getActiveSessions().length;
  }
}

export default SessionManager;
