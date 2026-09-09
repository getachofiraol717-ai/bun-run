/**
 * Resource Limiter for Terminal Sandbox
 * Enforces resource limits for sessions
 */

import type { ResourceUsage, TerminalSession } from '../models/types';

export interface ResourceLimit {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxStorageMB: number;
  maxSessions: number;
  maxProcesses: number;
  maxOutputLines: number;
  executionTimeout: number;
}

export interface LimitViolation {
  type: 'memory' | 'cpu' | 'storage' | 'sessions' | 'processes' | 'output' | 'timeout';
  current: number;
  limit: number;
  sessionId: string;
  timestamp: Date;
}

/**
 * ResourceLimiter - Enforces resource limits for terminal sessions
 */
export class ResourceLimiter {
  private static instance: ResourceLimiter | null = null;
  private limits: ResourceLimit;
  private violations: LimitViolation[] = [];
  private sessionResources: Map<string, ResourceUsage> = new Map();

  private constructor() {
    this.limits = {
      maxMemoryMB: 512,
      maxCpuPercent: 80,
      maxStorageMB: 100,
      maxSessions: 10,
      maxProcesses: 50,
      maxOutputLines: 10000,
      executionTimeout: 300, // 5 minutes
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ResourceLimiter {
    if (!ResourceLimiter.instance) {
      ResourceLimiter.instance = new ResourceLimiter();
    }
    return ResourceLimiter.instance;
  }

  /**
   * Set resource limits
   */
  setLimits(limits: Partial<ResourceLimit>): void {
    this.limits = { ...this.limits, ...limits };
  }

  /**
   * Get current limits
   */
  getLimits(): ResourceLimit {
    return { ...this.limits };
  }

  /**
   * Update session resource tracking
   */
  updateSessionResources(sessionId: string, usage: ResourceUsage): void {
    this.sessionResources.set(sessionId, usage);
  }

  /**
   * Check if session is within memory limits
   */
  checkMemoryLimit(sessionId: string, currentMB: number): LimitViolation | null {
    if (currentMB > this.limits.maxMemoryMB) {
      const violation: LimitViolation = {
        type: 'memory',
        current: currentMB,
        limit: this.limits.maxMemoryMB,
        sessionId,
        timestamp: new Date(),
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  /**
   * Check if session is within CPU limits
   */
  checkCpuLimit(sessionId: string, currentPercent: number): LimitViolation | null {
    if (currentPercent > this.limits.maxCpuPercent) {
      const violation: LimitViolation = {
        type: 'cpu',
        current: currentPercent,
        limit: this.limits.maxCpuPercent,
        sessionId,
        timestamp: new Date(),
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  /**
   * Check if session is within storage limits
   */
  checkStorageLimit(sessionId: string, currentMB: number): LimitViolation | null {
    if (currentMB > this.limits.maxStorageMB) {
      const violation: LimitViolation = {
        type: 'storage',
        current: currentMB,
        limit: this.limits.maxStorageMB,
        sessionId,
        timestamp: new Date(),
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  /**
   * Check if within session count limit
   */
  checkSessionLimit(currentSessions: number): LimitViolation | null {
    if (currentSessions >= this.limits.maxSessions) {
      const violation: LimitViolation = {
        type: 'sessions',
        current: currentSessions,
        limit: this.limits.maxSessions,
        sessionId: 'global',
        timestamp: new Date(),
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  /**
   * Check if within process limit
   */
  checkProcessLimit(sessionId: string, currentProcesses: number): LimitViolation | null {
    if (currentProcesses > this.limits.maxProcesses) {
      const violation: LimitViolation = {
        type: 'processes',
        current: currentProcesses,
        limit: this.limits.maxProcesses,
        sessionId,
        timestamp: new Date(),
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  /**
   * Check if within output line limit
   */
  checkOutputLimit(sessionId: string, currentLines: number): LimitViolation | null {
    if (currentLines > this.limits.maxOutputLines) {
      const violation: LimitViolation = {
        type: 'output',
        current: currentLines,
        limit: this.limits.maxOutputLines,
        sessionId,
        timestamp: new Date(),
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  /**
   * Check execution timeout
   */
  checkTimeout(startTime: Date): LimitViolation | null {
    const elapsed = (Date.now() - startTime.getTime()) / 1000;
    if (elapsed > this.limits.executionTimeout) {
      const violation: LimitViolation = {
        type: 'timeout',
        current: elapsed,
        limit: this.limits.executionTimeout,
        sessionId: 'global',
        timestamp: new Date(),
      };
      this.violations.push(violation);
      return violation;
    }
    return null;
  }

  /**
   * Check all resource limits for a session
   */
  checkAllLimits(sessionId: string, usage: ResourceUsage): LimitViolation[] {
    const violations: LimitViolation[] = [];

    const memoryViolation = this.checkMemoryLimit(sessionId, usage.memory.usedMB);
    if (memoryViolation) violations.push(memoryViolation);

    const cpuViolation = this.checkCpuLimit(sessionId, usage.cpu.percent);
    if (cpuViolation) violations.push(cpuViolation);

    const storageViolation = this.checkStorageLimit(sessionId, usage.storage.usedMB);
    if (storageViolation) violations.push(storageViolation);

    return violations;
  }

  /**
   * Get violations for a session
   */
  getSessionViolations(sessionId: string): LimitViolation[] {
    return this.violations.filter((v) => v.sessionId === sessionId);
  }

  /**
   * Get all violations
   */
  getAllViolations(): LimitViolation[] {
    return [...this.violations];
  }

  /**
   * Clear violations for a session
   */
  clearSessionViolations(sessionId: string): void {
    this.violations = this.violations.filter((v) => v.sessionId !== sessionId);
  }

  /**
   * Clear all violations
   */
  clearAllViolations(): void {
    this.violations = [];
  }

  /**
   * Get current resource usage for a session
   */
  getSessionUsage(sessionId: string): ResourceUsage | undefined {
    return this.sessionResources.get(sessionId);
  }

  /**
   * Remove session resources
   */
  removeSessionResources(sessionId: string): boolean {
    return this.sessionResources.delete(sessionId);
  }

  /**
   * Get aggregate resource usage across all sessions
   */
  getAggregateUsage(): {
    totalMemoryMB: number;
    avgCpuPercent: number;
    totalStorageMB: number;
    sessionCount: number;
  } {
    const usages = Array.from(this.sessionResources.values());

    if (usages.length === 0) {
      return {
        totalMemoryMB: 0,
        avgCpuPercent: 0,
        totalStorageMB: 0,
        sessionCount: 0,
      };
    }

    return {
      totalMemoryMB: usages.reduce((sum, u) => sum + u.memory.usedMB, 0),
      avgCpuPercent: usages.reduce((sum, u) => sum + u.cpu.percent, 0) / usages.length,
      totalStorageMB: usages.reduce((sum, u) => sum + u.storage.usedMB, 0),
      sessionCount: usages.length,
    };
  }

  /**
   * Check if system is under pressure
   */
  isSystemUnderPressure(): boolean {
    const aggregate = this.getAggregateUsage();

    return (
      aggregate.totalMemoryMB > this.limits.maxMemoryMB * 0.8 ||
      aggregate.avgCpuPercent > this.limits.maxCpuPercent * 0.8 ||
      aggregate.sessionCount >= this.limits.maxSessions
    );
  }

  /**
   * Get resource statistics
   */
  getStats(): {
    limits: ResourceLimit;
    violationCount: number;
    activeSessions: number;
    underPressure: boolean;
  } {
    return {
      limits: this.getLimits(),
      violationCount: this.violations.length,
      activeSessions: this.sessionResources.size,
      underPressure: this.isSystemUnderPressure(),
    };
  }
}

export default ResourceLimiter;
