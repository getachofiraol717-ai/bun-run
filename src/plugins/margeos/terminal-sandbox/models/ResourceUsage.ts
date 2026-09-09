/**
 * Resource Usage Model
 * Resource monitoring for Terminal Sandbox
 */

import type { ResourceUsage, MemoryUsage, CpuUsage, StorageUsage } from './types';

export function createResourceUsage(
  memoryMB: number,
  memoryLimitMB: number,
  cpuPercent: number,
  storageMB: number,
  storageLimitMB: number,
  processCount: number = 1
): ResourceUsage {
  return {
    memory: {
      usedMB: memoryMB,
      limitMB: memoryLimitMB,
      percent: (memoryMB / memoryLimitMB) * 100,
    },
    cpu: {
      percent: cpuPercent,
      userPercent: cpuPercent * 0.7,
      systemPercent: cpuPercent * 0.3,
    },
    storage: {
      usedMB: storageMB,
      limitMB: storageLimitMB,
      percent: (storageMB / storageLimitMB) * 100,
    },
    processes: processCount,
    timestamp: new Date(),
  };
}

export function checkResourceLimits(usage: ResourceUsage): {
  memoryExceeded: boolean;
  cpuExceeded: boolean;
  storageExceeded: boolean;
} {
  return {
    memoryExceeded: usage.memory.percent >= 90,
    cpuExceeded: usage.cpu.percent >= 90,
    storageExceeded: usage.storage.percent >= 90,
  };
}

export function shouldTerminateSession(usage: ResourceUsage): boolean {
  const limits = checkResourceLimits(usage);
  return limits.memoryExceeded || limits.cpuExceeded || limits.storageExceeded;
}

export function getResourceWarningLevel(usage: ResourceUsage): 'normal' | 'warning' | 'critical' {
  const maxPercent = Math.max(
    usage.memory.percent,
    usage.cpu.percent,
    usage.storage.percent
  );

  if (maxPercent >= 90) return 'critical';
  if (maxPercent >= 75) return 'warning';
  return 'normal';
}
