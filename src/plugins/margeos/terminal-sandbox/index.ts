/**
 * Terminal Sandbox - Index
 * Secure Terminal Sandbox Engine for MargeOS
 *
 * Provides isolated terminal execution with support for:
 * - Multiple runtimes (Python, Node.js, Git, ZIP)
 * - Secure sandbox isolation
 * - Workspace management
 * - AI tutoring integration
 * - Audit logging
 */

// Models
export * from './models';
export * from './models/types';
export * from './models/TerminalSession';
export * from './models/Workspace';
export * from './models/RuntimeProfile';
export * from './models/CommandResult';
export * from './models/ResourceUsage';
export * from './models/SandboxPolicy';

// Core Engines
export * from './core';
export { default as TerminalSandboxEngine } from './core/TerminalSandboxEngine';
export { default as SessionManager } from './core/SessionManager';
export { default as CommandDispatcher } from './core/CommandDispatcher';
export { default as EnvironmentManager } from './core/EnvironmentManager';
export { default as ResourceManager } from './core/ResourceManager';
export { default as SecurityPolicyManager } from './core/SecurityPolicyManager';
export { default as CleanupManager } from './core/CleanupManager';
export { default as SandboxController } from './core/SandboxController';
export { default as AuditManager } from './core/AuditManager';
export { default as ExecutionOrchestrator, SAFE_RUNTIME_ENVIRONMENT } from './core/ExecutionOrchestrator';

// Runtimes
export { default as PythonRuntime } from './runtimes/PythonRuntime';
export { default as NodeRuntime } from './runtimes/NodeRuntime';
export { default as GitWorkspace } from './runtimes/GitWorkspace';
export { default as DockerRuntime } from './runtimes/DockerRuntime';
export { default as ZipTools } from './runtimes/ZipTools';
export { default as RuntimeRegistry } from './runtimes/RuntimeRegistry';

// Security
export { default as SandboxIsolation } from './security/SandboxIsolation';
export { default as PermissionManager } from './security/PermissionManager';
export { default as ResourceLimiter } from './security/ResourceLimiter';
export { default as FilesystemGuard } from './security/FilesystemGuard';
export { default as NetworkPolicy } from './security/NetworkPolicy';
export { default as CommandValidation } from './security/CommandValidation';

// Services
export { default as TerminalService } from './services/TerminalService';
export { default as SessionService } from './services/SessionService';
export { default as RuntimeService } from './services/RuntimeService';
export { default as LoggingService } from './services/LoggingService';
export { default as WorkspaceService } from './services/WorkspaceService';
export { default as StorageService } from './services/StorageService';

// Hooks
export { useTerminal } from './hooks/useTerminal';
export { useWorkspace } from './hooks/useWorkspace';
export { useRuntime } from './hooks/useRuntime';
export { useResources } from './hooks/useResources';
export { useTerminalSession } from './hooks/useTerminalSession';

// Store
export {
  useTerminalStore,
  selectCurrentSession,
  selectCurrentWorkspace,
  selectActiveSessions,
  selectSettings,
  type TerminalState,
  type TerminalSettings,
} from './store/terminalStore';

// Utils
export * from './utils/safeMathParser';
export * from './utils/terminalUtils';
export * from './utils/runtimeUtils';
export * from './utils/securityUtils';
export * from './utils/workspaceUtils';
export * from './utils/archiveUtils';

// Main engine instance
import TerminalSandboxEngine from './core/TerminalSandboxEngine';

/**
 * Initialize the Terminal Sandbox
 */
export async function initializeTerminalSandbox(): Promise<void> {
  const engine = TerminalSandboxEngine.getInstance();
  await engine.initialize();
}

/**
 * Get Terminal Sandbox engine instance
 */
export function getTerminalSandboxEngine(): TerminalSandboxEngine {
  return TerminalSandboxEngine.getInstance();
}

// Default export
export default TerminalSandboxEngine;
