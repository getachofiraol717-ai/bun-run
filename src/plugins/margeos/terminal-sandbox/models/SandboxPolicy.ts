// @ts-nocheck
/**
 * Sandbox Policy Model
 * Security policies for Terminal Sandbox
 */

import type { SandboxPolicy, SandboxProfile, PermissionSet, SecurityEvent } from './types';

export function createSandboxPolicy(
  id: string,
  name: string,
  options: Partial<SandboxPolicy> = {}
): SandboxPolicy {
  return {
    id,
    name,
    allowRead: true,
    allowWrite: true,
    allowExecute: true,
    allowNetwork: false,
    allowFilesystem: true,
    allowProcess: true,
    allowedPaths: ['/tmp/terminal-sandbox'],
    deniedPaths: ['/etc', '/root', '/sys', '/proc'],
    maxMemoryMB: 512,
    maxCpuPercent: 80,
    maxSessions: 10,
    ...options,
  };
}

export function createSandboxProfile(
  id: string,
  name: string,
  policy: SandboxPolicy
): SandboxProfile {
  return {
    id,
    name,
    policy,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function getEducationalPolicy(): SandboxPolicy {
  return createSandboxPolicy('educational', 'Educational', {
    allowRead: true,
    allowWrite: true,
    allowExecute: true,
    allowNetwork: false,
    allowFilesystem: true,
    allowProcess: true,
    allowedPaths: ['/tmp/terminal-sandbox', '/home/student'],
    deniedPaths: ['/etc', '/root', '/sys', '/proc', '/boot', '/dev'],
    maxMemoryMB: 256,
    maxCpuPercent: 50,
    maxSessions: 5,
  });
}

export function getRestrictivePolicy(): SandboxPolicy {
  return createSandboxPolicy('restrictive', 'Restrictive', {
    allowRead: true,
    allowWrite: false,
    allowExecute: false,
    allowNetwork: false,
    allowFilesystem: false,
    allowProcess: false,
    allowedPaths: [],
    deniedPaths: ['/'],
    maxMemoryMB: 128,
    maxCpuPercent: 25,
    maxSessions: 1,
  });
}

export function createPermissionSet(policy: SandboxPolicy): PermissionSet {
  const permissions: string[] = [];
  if (policy.allowRead) permissions.push('read');
  if (policy.allowWrite) permissions.push('write');
  if (policy.allowExecute) permissions.push('execute');
  if (policy.allowNetwork) permissions.push('network');
  if (policy.allowFilesystem) permissions.push('filesystem');
  if (policy.allowProcess) permissions.push('process');

  return {
    permissions,
    deniedPaths: policy.deniedPaths,
    allowedPaths: policy.allowedPaths,
    maxMemoryMB: policy.maxMemoryMB,
    maxCpuPercent: policy.maxCpuPercent,
    maxSessions: policy.maxSessions,
  };
}

export function createSecurityEvent(
  eventType: string,
  severity: SecurityEvent['severity'],
  message: string,
  options?: Partial<SecurityEvent>
): SecurityEvent {
  return {
    eventType,
    severity,
    message,
    timestamp: new Date(),
    blocked: false,
    resolved: false,
    ...options,
  };
}
