/**
 * Terminal Sandbox Types
 * Shared type definitions for Terminal Sandbox
 */

export type TerminalRuntime = 'bash' | 'zsh' | 'sh' | 'python' | 'python3' | 'node' | 'ruby' | 'php';

export type SessionStatus = 'idle' | 'active' | 'paused' | 'closed' | 'error';

export type CommandType = 'built-in' | 'runtime' | 'external' | 'alias';

export interface TerminalSession {
  id: string;
  userId: string;
  runtime: TerminalRuntime;
  status: SessionStatus;
  startedAt: Date;
  lastActivity: Date;
  workingDirectory: string;
  environmentVariables: Record<string, string>;
  history: CommandHistoryEntry[];
  permissions: string[];
  workspaceId?: string;
}

export interface CommandHistoryEntry {
  command: string;
  exitCode: number;
  timestamp: Date;
  duration?: number;
}

export interface CommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTime: number;
  timestamp: Date;
}

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  autoSave: boolean;
  maxFileSize: number;
  allowedExtensions: string[];
}

export interface WorkspaceFile {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  content: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  permissions: string;
}

export interface RuntimeProfile {
  id: string;
  name: string;
  runtime: TerminalRuntime;
  version: string;
  packages: InstalledPackage[];
  environmentVariables: Record<string, string>;
}

export interface InstalledPackage {
  name: string;
  version: string;
  installedAt: Date;
  size: number;
}

export interface PythonEnvironment {
  version: string;
  executable: string;
  interpreter: string;
  packages: InstalledPackage[];
  virtualenvPath: string | null;
  workingDirectory: string;
  environmentVariables: Record<string, string>;
  maxMemoryMB: number;
  executionTimeout: number;
}

export interface NodeEnvironment {
  version: string;
  executable: string;
  npmVersion: string;
  packages: InstalledPackage[];
  nodeModulesPath: string;
  workingDirectory: string;
  environmentVariables: Record<string, string>;
  maxMemoryMB: number;
  executionTimeout: number;
}

export interface ResourceUsage {
  memory: MemoryUsage;
  cpu: CpuUsage;
  storage: StorageUsage;
  processes: number;
  timestamp: Date;
}

export interface MemoryUsage {
  usedMB: number;
  limitMB: number;
  percent: number;
}

export interface CpuUsage {
  percent: number;
  userPercent: number;
  systemPercent: number;
}

export interface StorageUsage {
  usedMB: number;
  limitMB: number;
  percent: number;
}

export interface SandboxPolicy {
  id: string;
  name: string;
  allowRead: boolean;
  allowWrite: boolean;
  allowExecute: boolean;
  allowNetwork: boolean;
  allowFilesystem: boolean;
  allowProcess: boolean;
  allowedPaths: string[];
  deniedPaths: string[];
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxSessions: number;
}

export interface PermissionSet {
  permissions: string[];
  deniedPaths: string[];
  allowedPaths: string[];
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxSessions: number;
}

export interface SecurityEvent {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  blocked: boolean;
  resolved: boolean;
}

export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
}

export interface CommandSuggestion {
  command: string;
  description: string;
  score: number;
}
