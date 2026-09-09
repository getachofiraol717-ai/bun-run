/**
 * useResources Hook for Terminal Sandbox
 * React hook for resource monitoring
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import ResourceManager from '../core/ResourceManager';
import ResourceLimiter from '../security/ResourceLimiter';
import type { ResourceUsage } from '../models/types';

export interface ResourceLimit {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxStorageMB: number;
  maxSessions: number;
}

export interface UseResourcesReturn {
  // State
  usage: ResourceUsage | null;
  limits: ResourceLimit;
  isUnderPressure: boolean;
  violations: Array<{
    type: string;
    current: number;
    limit: number;
    sessionId: string;
    timestamp: Date;
  }>;

  // Actions
  refresh: () => void;
  checkLimits: (sessionId: string) => Array<{
    type: string;
    current: number;
    limit: number;
  }>;
  setLimits: (limits: Partial<ResourceLimit>) => void;
}

export function useResources(): UseResourcesReturn {
  const [usage, setUsage] = useState<ResourceUsage | null>(null);
  const [isUnderPressure, setIsUnderPressure] = useState<boolean>(false);
  const [violations, setViolations] = useState<UseResourcesReturn['violations']>([]);

  const resourceManager = ResourceManager.getInstance();
  const limiter = ResourceLimiter.getInstance();
  const intervalRef = useRef<number | null>(null);

  // Get current limits
  const limits: ResourceLimit = {
    maxMemoryMB: limiter.getLimits().maxMemoryMB,
    maxCpuPercent: limiter.getLimits().maxCpuPercent,
    maxStorageMB: limiter.getLimits().maxStorageMB,
    maxSessions: limiter.getLimits().maxSessions,
  };

  // Refresh resource data
  const refresh = useCallback(() => {
    const currentUsage = resourceManager.getCurrentUsage();
    setUsage(currentUsage);

    const pressure = limiter.isSystemUnderPressure();
    setIsUnderPressure(pressure);

    // Get recent violations
    const allViolations = limiter.getAllViolations();
    setViolations(
      allViolations.slice(-10).map((v) => ({
        type: v.type,
        current: v.current,
        limit: v.limit,
        sessionId: v.sessionId,
        timestamp: v.timestamp,
      }))
    );
  }, []);

  // Check limits for a session
  const checkLimits = useCallback(
    (sessionId: string): Array<{ type: string; current: number; limit: number }> => {
      const sessionUsage = resourceManager.getSessionUsage(sessionId);
      if (!sessionUsage) return [];

      const results: Array<{ type: string; current: number; limit: number }> = [];

      // Check memory
      if (sessionUsage.memory.usedMB > limits.maxMemoryMB) {
        results.push({
          type: 'memory',
          current: sessionUsage.memory.usedMB,
          limit: limits.maxMemoryMB,
        });
      }

      // Check CPU
      if (sessionUsage.cpu.percent > limits.maxCpuPercent) {
        results.push({
          type: 'cpu',
          current: sessionUsage.cpu.percent,
          limit: limits.maxCpuPercent,
        });
      }

      // Check storage
      if (sessionUsage.storage.usedMB > limits.maxStorageMB) {
        results.push({
          type: 'storage',
          current: sessionUsage.storage.usedMB,
          limit: limits.maxStorageMB,
        });
      }

      return results;
    },
    [limits]
  );

  // Set new limits
  const setLimits = useCallback((newLimits: Partial<ResourceLimit>) => {
    limiter.setLimits(newLimits);
  }, []);

  // Poll for updates
  useEffect(() => {
    // Initial load
    refresh();

    // Set up polling
    intervalRef.current = window.setInterval(refresh, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refresh]);

  return {
    usage,
    limits,
    isUnderPressure,
    violations,
    refresh,
    checkLimits,
    setLimits,
  };
}

export default useResources;
