/**
 * core/index.ts
 *
 * Barrel export for all core modules.
 */

import { TerminalSandboxEngine } from './TerminalSandboxEngine';
import { SessionManager } from './SessionManager';
import { CommandDispatcher } from './CommandDispatcher';
import { EnvironmentManager } from './EnvironmentManager';
import { ResourceManager } from './ResourceManager';
import { SecurityPolicyManager } from './SecurityPolicyManager';
import { CleanupManager } from './CleanupManager';
import { SandboxController } from './SandboxController';
import { AuditManager } from './AuditManager';

export { TerminalSandboxEngine, default as TerminalSandboxEngineDefault } from './TerminalSandboxEngine';
export { SessionManager, default as SessionManagerDefault } from './SessionManager';
export { CommandDispatcher, default as CommandDispatcherDefault } from './CommandDispatcher';
export { EnvironmentManager, default as EnvironmentManagerDefault } from './EnvironmentManager';
export { ResourceManager, default as ResourceManagerDefault } from './ResourceManager';
export { SecurityPolicyManager, default as SecurityPolicyManagerDefault } from './SecurityPolicyManager';
export { CleanupManager, default as CleanupManagerDefault } from './CleanupManager';
export { SandboxController, default as SandboxControllerDefault } from './SandboxController';
export { AuditManager, default as AuditManagerDefault } from './AuditManager';

// Singleton instances
let terminalSandboxEngineInstance: TerminalSandboxEngine | null = null;
let sessionManagerInstance: SessionManager | null = null;
let commandDispatcherInstance: CommandDispatcher | null = null;
let environmentManagerInstance: EnvironmentManager | null = null;
let resourceManagerInstance: ResourceManager | null = null;
let securityPolicyManagerInstance: SecurityPolicyManager | null = null;
let cleanupManagerInstance: CleanupManager | null = null;
let sandboxControllerInstance: SandboxController | null = null;
let auditManagerInstance: AuditManager | null = null;

export function getTerminalSandboxEngine(): TerminalSandboxEngine {
  if (!terminalSandboxEngineInstance) {
    terminalSandboxEngineInstance = TerminalSandboxEngine.getInstance();
  }
  return terminalSandboxEngineInstance;
}

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = SessionManager.getInstance();
  }
  return sessionManagerInstance;
}

export function getCommandDispatcher(): CommandDispatcher {
  if (!commandDispatcherInstance) {
    commandDispatcherInstance = CommandDispatcher.getInstance();
  }
  return commandDispatcherInstance;
}

export function getEnvironmentManager(): EnvironmentManager {
  if (!environmentManagerInstance) {
    environmentManagerInstance = EnvironmentManager.getInstance();
  }
  return environmentManagerInstance;
}

export function getResourceManager(): ResourceManager {
  if (!resourceManagerInstance) {
    resourceManagerInstance = ResourceManager.getInstance();
  }
  return resourceManagerInstance;
}

export function getSecurityPolicyManager(): SecurityPolicyManager {
  if (!securityPolicyManagerInstance) {
    securityPolicyManagerInstance = SecurityPolicyManager.getInstance();
  }
  return securityPolicyManagerInstance;
}

export function getCleanupManager(): CleanupManager {
  if (!cleanupManagerInstance) {
    cleanupManagerInstance = CleanupManager.getInstance();
  }
  return cleanupManagerInstance;
}

export function getSandboxController(): SandboxController {
  if (!sandboxControllerInstance) {
    sandboxControllerInstance = SandboxController.getInstance();
  }
  return sandboxControllerInstance;
}

export function getAuditManager(): AuditManager {
  if (!auditManagerInstance) {
    auditManagerInstance = AuditManager.getInstance();
  }
  return auditManagerInstance;
}

// Initialize all engines
export async function initializeAllEngines(): Promise<void> {
  await getTerminalSandboxEngine().initialize();
  getSessionManager();
  getCommandDispatcher();
  getEnvironmentManager();
  getResourceManager();
  getSecurityPolicyManager();
  getCleanupManager();
  getSandboxController();
  getAuditManager();
}

// Default export with all engines
export default {
  TerminalSandboxEngine: getTerminalSandboxEngine,
  SessionManager: getSessionManager,
  CommandDispatcher: getCommandDispatcher,
  EnvironmentManager: getEnvironmentManager,
  ResourceManager: getResourceManager,
  SecurityPolicyManager: getSecurityPolicyManager,
  CleanupManager: getCleanupManager,
  SandboxController: getSandboxController,
  AuditManager: getAuditManager,
  initializeAllEngines
};
