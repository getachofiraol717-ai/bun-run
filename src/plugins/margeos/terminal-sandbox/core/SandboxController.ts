/**
 * Sandbox Controller
 * Main controller coordinating all Terminal Sandbox components
 */

import { TerminalSandboxEngine } from './TerminalSandboxEngine';
import { SessionManager } from './SessionManager';
import { CommandDispatcher } from './CommandDispatcher';
import { EnvironmentManager } from './EnvironmentManager';
import { ResourceManager } from './ResourceManager';
import { SecurityPolicyManager } from './SecurityPolicyManager';
import { CleanupManager } from './CleanupManager';
import { AuditManager } from './AuditManager';

export class SandboxController {
  private static instance: SandboxController | null = null;
  private engine: TerminalSandboxEngine;
  private sessionManager: SessionManager;
  private commandDispatcher: CommandDispatcher;
  private environmentManager: EnvironmentManager;
  private resourceManager: ResourceManager;
  private securityManager: SecurityPolicyManager;
  private cleanupManager: CleanupManager;
  private auditManager: AuditManager;

  private constructor() {
    this.engine = TerminalSandboxEngine.getInstance();
    this.sessionManager = SessionManager.getInstance();
    this.commandDispatcher = CommandDispatcher.getInstance();
    this.environmentManager = EnvironmentManager.getInstance();
    this.resourceManager = ResourceManager.getInstance();
    this.securityManager = SecurityPolicyManager.getInstance();
    this.cleanupManager = CleanupManager.getInstance();
    this.auditManager = AuditManager.getInstance();
  }

  static getInstance(): SandboxController {
    if (!SandboxController.instance) {
      SandboxController.instance = new SandboxController();
    }
    return SandboxController.instance;
  }

  async initialize(): Promise<void> {
    await this.engine.initialize();
    this.cleanupManager.startAutoCleanup();
    this.auditManager.logEvent({ type: 'system', message: 'Sandbox controller initialized' });
  }

  shutdown(): void {
    this.cleanupManager.stopAutoCleanup();
    this.auditManager.logEvent({ type: 'system', message: 'Sandbox controller shutdown' });
  }

  getEngine(): TerminalSandboxEngine {
    return this.engine;
  }

  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  getCommandDispatcher(): CommandDispatcher {
    return this.commandDispatcher;
  }

  getEnvironmentManager(): EnvironmentManager {
    return this.environmentManager;
  }

  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  getSecurityManager(): SecurityPolicyManager {
    return this.securityManager;
  }

  getCleanupManager(): CleanupManager {
    return this.cleanupManager;
  }

  getAuditManager(): AuditManager {
    return this.auditManager;
  }
}

export default SandboxController;
