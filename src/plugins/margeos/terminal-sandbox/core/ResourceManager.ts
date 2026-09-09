/**
 * Resource Manager
 * Resource monitoring for Terminal Sandbox
 */

import type { ResourceUsage } from '../models/types';
import { createResourceUsage } from '../models/ResourceUsage';

export class ResourceManager {
  private static instance: ResourceManager | null = null;
  private lastUpdate: Date = new Date();
  private sessionUsages: Map<string, ResourceUsage> = new Map();

  private constructor() {}

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  getCurrentUsage(): ResourceUsage {
    return createResourceUsage(
      Math.random() * 100 + 50,
      512,
      Math.random() * 30 + 10,
      Math.random() * 50 + 10,
      100
    );
  }

  getSessionUsage(sessionId: string): ResourceUsage | undefined {
    return this.sessionUsages.get(sessionId);
  }

  updateSessionUsage(sessionId: string, usage: ResourceUsage): void {
    this.sessionUsages.set(sessionId, usage);
    this.lastUpdate = new Date();
  }

  clearSessionUsage(sessionId: string): void {
    this.sessionUsages.delete(sessionId);
  }

  getLastUpdate(): Date {
    return this.lastUpdate;
  }

  getActiveSessionCount(): number {
    return this.sessionUsages.size;
  }

  getTotalMemoryUsage(): number {
    let total = 0;
    this.sessionUsages.forEach((usage) => {
      total += usage.memory.usedMB;
    });
    return total;
  }

  getAverageCpuUsage(): number {
    if (this.sessionUsages.size === 0) return 0;
    let total = 0;
    this.sessionUsages.forEach((usage) => {
      total += usage.cpu.percent;
    });
    return total / this.sessionUsages.size;
  }
}

export default ResourceManager;
