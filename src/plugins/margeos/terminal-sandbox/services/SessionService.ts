// @ts-nocheck
/**
 * Session Service for Terminal Sandbox
 * Manages terminal session lifecycle
 */

import SessionManager from '../core/SessionManager';
import type { TerminalSession, SessionStatus } from '../models/types';

export interface SessionSnapshot {
  id: string;
  sessionId: string;
  timestamp: Date;
  state: {
    status: SessionStatus;
    history: { command: string; exitCode: number; timestamp: Date }[];
    workingDirectory: string;
    environmentVariables: Record<string, string>;
  };
}

/**
 * SessionService - Manages terminal session lifecycle
 */
export class SessionService {
  private static instance: SessionService | null = null;
  private manager: SessionManager;
  private snapshots: Map<string, SessionSnapshot[]> = new Map();

  private constructor() {
    this.manager = SessionManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Create a new session
   */
  async createSession(userId: string, runtime: string = 'bash'): Promise<TerminalSession | null> {
    return this.manager.createSession(userId, runtime);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.manager.getSession(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): TerminalSession[] {
    return this.manager.getAllSessions();
  }

  /**
   * Get sessions by user ID
   */
  getSessionsByUser(userId: string): TerminalSession[] {
    return this.manager.getSessionsByUser(userId);
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): TerminalSession[] {
    return this.manager.getActiveSessions();
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    return this.manager.closeSession(sessionId);
  }

  /**
   * Close all sessions for a user
   */
  async closeUserSessions(userId: string): Promise<number> {
    const sessions = this.getSessionsByUser(userId);
    let closed = 0;

    for (const session of sessions) {
      if (await this.manager.closeSession(session.id)) {
        closed++;
      }
    }

    return closed;
  }

  /**
   * Update session status
   */
  updateStatus(sessionId: string, status: SessionStatus): boolean {
    return this.manager.updateSessionStatus(sessionId, status);
  }

  /**
   * Register session listeners
   */
  registerSession(
    session: TerminalSession,
    listeners: {
      onStatusChange?: (session: TerminalSession) => void;
      onClose?: (sessionId: string) => void;
    }
  ): () => void {
    const handlers = {
      onStatusChange: listeners.onStatusChange,
      onClose: listeners.onClose,
    };

    this.manager.registerListener(session.id, handlers);

    // Return unregister function
    return () => {
      this.manager.unregisterListener(session.id);
    };
  }

  /**
   * Create a snapshot of session state
   */
  createSnapshot(sessionId: string): SessionSnapshot | null {
    const session = this.manager.getSession(sessionId);
    if (!session) {
      return null;
    }

    const snapshot: SessionSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      sessionId,
      timestamp: new Date(),
      state: {
        status: session.status,
        history: [...session.history],
        workingDirectory: session.workingDirectory,
        environmentVariables: { ...session.environmentVariables },
      },
    };

    if (!this.snapshots.has(sessionId)) {
      this.snapshots.set(sessionId, []);
    }

    this.snapshots.get(sessionId)!.push(snapshot);

    // Limit snapshots per session
    const sessionSnapshots = this.snapshots.get(sessionId)!;
    if (sessionSnapshots.length > 10) {
      sessionSnapshots.shift();
    }

    return snapshot;
  }

  /**
   * Get snapshots for a session
   */
  getSnapshots(sessionId: string): SessionSnapshot[] {
    return this.snapshots.get(sessionId) || [];
  }

  /**
   * Restore from snapshot
   */
  restoreSnapshot(snapshotId: string): boolean {
    for (const [sessionId, sessionSnapshots] of this.snapshots.entries()) {
      const snapshot = sessionSnapshots.find((s) => s.id === snapshotId);
      if (snapshot) {
        const session = this.manager.getSession(sessionId);
        if (session) {
          session.status = snapshot.state.status;
          session.history = [...snapshot.state.history];
          session.workingDirectory = snapshot.state.workingDirectory;
          session.environmentVariables = { ...snapshot.state.environmentVariables };
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(snapshotId: string): boolean {
    for (const [sessionId, sessionSnapshots] of this.snapshots.entries()) {
      const index = sessionSnapshots.findIndex((s) => s.id === snapshotId);
      if (index !== -1) {
        sessionSnapshots.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Clear all snapshots for a session
   */
  clearSnapshots(sessionId: string): void {
    this.snapshots.delete(sessionId);
  }

  /**
   * Get session statistics
   */
  getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    closedSessions: number;
    byStatus: Record<SessionStatus, number>;
    byRuntime: Record<string, number>;
  } {
    const sessions = this.getAllSessions();

    return {
      totalSessions: sessions.length,
      activeSessions: this.getActiveSessions().length,
      closedSessions: sessions.filter((s) => s.status === 'closed').length,
      byStatus: sessions.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<SessionStatus, number>),
      byRuntime: sessions.reduce((acc, s) => {
        acc[s.runtime] = (acc[s.runtime] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export default SessionService;
