/**
 * Cleanup Manager
 * Session cleanup management for Terminal Sandbox
 */

import { SessionManager } from './SessionManager';

export class CleanupManager {
  private static instance: CleanupManager | null = null;
  private autoCleanupInterval: number | null = null;
  private cleanupIntervalMs: number = 60000;

  private constructor() {}

  static getInstance(): CleanupManager {
    if (!CleanupManager.instance) {
      CleanupManager.instance = new CleanupManager();
    }
    return CleanupManager.instance;
  }

  startAutoCleanup(intervalMs: number = 60000): void {
    this.cleanupIntervalMs = intervalMs;
    this.stopAutoCleanup();
    this.autoCleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  stopAutoCleanup(): void {
    if (this.autoCleanupInterval !== null) {
      clearInterval(this.autoCleanupInterval);
      this.autoCleanupInterval = null;
    }
  }

  cleanup(): { closedSessions: number; clearedHistory: number } {
    const sessionManager = SessionManager.getInstance();
    const sessions = sessionManager.getAllSessions();
    let closedSessions = 0;
    let clearedHistory = 0;

    for (const session of sessions) {
      if (session.status === 'closed') {
        closedSessions++;
        sessionManager.closeSession(session.id);
      }
    }

    return { closedSessions, clearedHistory };
  }

  cleanupOldSessions(maxAgeMs: number = 3600000): number {
    const sessionManager = SessionManager.getInstance();
    const sessions = sessionManager.getAllSessions();
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    for (const session of sessions) {
      if (new Date(session.lastActivity).getTime() < cutoff && session.status === 'closed') {
        sessionManager.closeSession(session.id);
        cleaned++;
      }
    }

    return cleaned;
  }

  setCleanupInterval(intervalMs: number): void {
    this.cleanupIntervalMs = intervalMs;
    if (this.autoCleanupInterval !== null) {
      this.startAutoCleanup(intervalMs);
    }
  }
}

export default CleanupManager;
