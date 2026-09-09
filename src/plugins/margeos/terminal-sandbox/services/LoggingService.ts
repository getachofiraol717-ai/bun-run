/**
 * Logging Service for Terminal Sandbox
 * Centralized logging and audit trail
 */

import AuditManager from '../core/AuditManager';
import type { SecurityEvent } from '../models/types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  sessionId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LogFilter {
  level?: LogLevel;
  category?: string;
  sessionId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * LoggingService - Centralized logging service
 */
export class LoggingService {
  private static instance: LoggingService | null = null;
  private logs: LogEntry[] = [];
  private auditManager: AuditManager;
  private maxLogs: number = 10000;
  private listeners: ((entry: LogEntry) => void)[] = [];

  private constructor() {
    this.auditManager = AuditManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Log a message
   */
  log(
    level: LogLevel,
    category: string,
    message: string,
    options?: {
      sessionId?: string;
      userId?: string;
      details?: Record<string, unknown>;
      error?: Error;
    }
  ): LogEntry {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      level,
      category,
      message,
      sessionId: options?.sessionId,
      userId: options?.userId,
      details: options?.details,
      error: options?.error
        ? {
            name: options.error.name,
            message: options.error.message,
            stack: options.error.stack,
          }
        : undefined,
    };

    this.logs.push(entry);

    // Trim if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners(entry);

    // Log to console in development
    if (import.meta.env.DEV) {
      this.logToConsole(entry);
    }

    return entry;
  }

  /**
   * Log debug message
   */
  debug(category: string, message: string, options?: Omit<LogEntry, 'id' | 'timestamp' | 'level' | 'category' | 'message'>): LogEntry {
    return this.log('debug', category, message, options as Parameters<typeof this.log>[3]);
  }

  /**
   * Log info message
   */
  info(category: string, message: string, options?: Omit<LogEntry, 'id' | 'timestamp' | 'level' | 'category' | 'message'>): LogEntry {
    return this.log('info', category, message, options as Parameters<typeof this.log>[3]);
  }

  /**
   * Log warning
   */
  warn(category: string, message: string, options?: Omit<LogEntry, 'id' | 'timestamp' | 'level' | 'category' | 'message'>): LogEntry {
    return this.log('warn', category, message, options as Parameters<typeof this.log>[3]);
  }

  /**
   * Log error
   */
  error(category: string, message: string, error?: Error, options?: Omit<LogEntry, 'id' | 'timestamp' | 'level' | 'category' | 'message'>): LogEntry {
    return this.log('error', category, message, { ...options, error });
  }

  /**
   * Log critical message
   */
  critical(category: string, message: string, error?: Error, options?: Omit<LogEntry, 'id' | 'timestamp' | 'level' | 'category' | 'message'>): LogEntry {
    const entry = this.log('critical', category, message, { ...options, error });

    // Also log to audit
    this.auditManager.logSecurityEvent({
      eventType: 'critical',
      severity: 'critical',
      message: `[${category}] ${message}`,
      timestamp: new Date(),
      sessionId: options?.sessionId,
      userId: options?.userId,
      details: options?.details,
      blocked: false,
      resolved: false,
    });

    return entry;
  }

  /**
   * Log command execution
   */
  logCommand(
    sessionId: string,
    userId: string,
    command: string,
    exitCode: number,
    duration: number
  ): LogEntry {
    return this.log('info', 'command', `Executed: ${command}`, {
      sessionId,
      userId,
      details: {
        exitCode,
        duration,
        commandLength: command.length,
      },
    });
  }

  /**
   * Log security event
   */
  logSecurity(
    severity: SecurityEvent['severity'],
    message: string,
    options?: {
      sessionId?: string;
      userId?: string;
      details?: Record<string, unknown>;
      blocked?: boolean;
    }
  ): LogEntry {
    const entry = this.log(
      severity === 'critical' || severity === 'high' ? 'error' : 'warn',
      'security',
      message,
      {
        sessionId: options?.sessionId,
        userId: options?.userId,
        details: options?.details,
      }
    );

    // Also log to audit
    this.auditManager.logSecurityEvent({
      eventType: 'security',
      severity,
      message,
      timestamp: new Date(),
      sessionId: options?.sessionId,
      userId: options?.userId,
      details: options?.details,
      blocked: options?.blocked,
      resolved: true,
    });

    return entry;
  }

  /**
   * Get logs with filter
   */
  getLogs(filter?: LogFilter): LogEntry[] {
    let results = [...this.logs];

    if (!filter) {
      return results;
    }

    if (filter.level) {
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
      const minLevel = levels.indexOf(filter.level);
      results = results.filter((l) => levels.indexOf(l.level) >= minLevel);
    }

    if (filter.category) {
      results = results.filter((l) => l.category === filter.category);
    }

    if (filter.sessionId) {
      results = results.filter((l) => l.sessionId === filter.sessionId);
    }

    if (filter.userId) {
      results = results.filter((l) => l.userId === filter.userId);
    }

    if (filter.startDate) {
      results = results.filter((l) => l.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter((l) => l.timestamp <= filter.endDate!);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      results = results.filter(
        (l) =>
          l.message.toLowerCase().includes(searchLower) ||
          l.category.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by category
   */
  getByCategory(category: string): LogEntry[] {
    return this.logs.filter((l) => l.category === category);
  }

  /**
   * Get logs by session
   */
  getBySession(sessionId: string): LogEntry[] {
    return this.logs.filter((l) => l.sessionId === sessionId);
  }

  /**
   * Get logs by user
   */
  getByUser(userId: string): LogEntry[] {
    return this.logs.filter((l) => l.userId === userId);
  }

  /**
   * Clear logs
   */
  clear(filter?: LogFilter): number {
    const before = this.logs.length;

    if (!filter) {
      this.logs = [];
      return before;
    }

    this.logs = this.logs.filter((l) => {
      if (filter.level && l.level !== filter.level) return true;
      if (filter.category && l.category !== filter.category) return true;
      if (filter.sessionId && l.sessionId !== filter.sessionId) return true;
      if (filter.userId && l.userId !== filter.userId) return true;
      return false;
    });

    return before - this.logs.length;
  }

  /**
   * Export logs
   */
  exportLogs(filter?: LogFilter, format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs(filter);

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = ['id', 'timestamp', 'level', 'category', 'message', 'sessionId', 'userId'];
    const rows = logs.map((l) =>
      headers.map((h) => {
        const val = l[h as keyof LogEntry];
        if (val === undefined) return '';
        if (val instanceof Date) return val.toISOString();
        return String(val).replace(/"/g, '""');
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Subscribe to log events
   */
  subscribe(callback: (entry: LogEntry) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(entry: LogEntry): void {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (error) {
        console.error('Log listener error:', error);
      }
    }
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.details || '');
        break;
      case 'info':
        console.info(message, entry.details || '');
        break;
      case 'warn':
        console.warn(message, entry.details || '');
        break;
      case 'error':
      case 'critical':
        console.error(message, entry.error || '', entry.details || '');
        break;
    }
  }

  /**
   * Set max logs
   */
  setMaxLogs(max: number): void {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<string, number>;
  } {
    return {
      total: this.logs.length,
      byLevel: this.logs.reduce((acc, l) => {
        acc[l.level] = (acc[l.level] || 0) + 1;
        return acc;
      }, {} as Record<LogLevel, number>),
      byCategory: this.logs.reduce((acc, l) => {
        acc[l.category] = (acc[l.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export default LoggingService;
