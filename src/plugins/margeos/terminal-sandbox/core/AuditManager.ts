/**
 * Audit Manager
 * Audit logging and compliance tracking for Terminal Sandbox
 */

import type { SecurityEvent } from '../models/types';

interface AuditEntry {
  id: string;
  timestamp: Date;
  type: 'session' | 'command' | 'security' | 'system';
  message: string;
  sessionId?: string;
  userId?: string;
  details?: Record<string, unknown>;
}

export class AuditManager {
  private static instance: AuditManager | null = null;
  private entries: AuditEntry[] = [];
  private securityEvents: SecurityEvent[] = [];
  private maxEntries: number = 10000;

  private constructor() {}

  static getInstance(): AuditManager {
    if (!AuditManager.instance) {
      AuditManager.instance = new AuditManager();
    }
    return AuditManager.instance;
  }

  logEvent(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    const fullEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
    };
    this.entries.push(fullEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    this.logEvent({
      type: 'security',
      message: event.message,
      sessionId: event.sessionId,
      userId: event.userId,
      details: event.details,
    });
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  logSessionEvent(sessionId: string, userId: string, message: string): void {
    this.logEvent({
      type: 'session',
      message,
      sessionId,
      userId,
    });
  }

  logCommandEvent(sessionId: string, userId: string, command: string, exitCode: number): void {
    this.logEvent({
      type: 'command',
      message: `Executed: ${command} (exit: ${exitCode})`,
      sessionId,
      userId,
      details: { command, exitCode },
    });
  }

  getEntries(filter?: { type?: AuditEntry['type']; sessionId?: string; userId?: string }): AuditEntry[] {
    let filtered = [...this.entries];
    if (filter?.type) filtered = filtered.filter((e) => e.type === filter.type);
    if (filter?.sessionId) filtered = filtered.filter((e) => e.sessionId === filter.sessionId);
    if (filter?.userId) filtered = filtered.filter((e) => e.userId === filter.userId);
    return filtered;
  }

  getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify({ audit: this.entries, security: this.securityEvents }, null, 2);
    }
    const headers = ['id', 'timestamp', 'type', 'message', 'sessionId', 'userId'];
    const rows = this.entries.map((e) =>
      headers.map((h) => {
        const val = e[h as keyof AuditEntry];
        return val instanceof Date ? val.toISOString() : String(val || '');
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  clear(): void {
    this.entries = [];
    this.securityEvents = [];
  }
}

export default AuditManager;
