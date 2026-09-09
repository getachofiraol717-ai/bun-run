// @ts-nocheck
/**
 * Execution Orchestrator for MargeOS Terminal Sandbox
 * Canonical Execution Orchestrator coordinating secure execution sessions,
 * security policies, resource limits, and isolated runtime environments.
 */

import { CommandValidation } from '../security/CommandValidation';
import { FilesystemGuard } from '../security/FilesystemGuard';
import { NetworkPolicy } from '../security/NetworkPolicy';
import { ResourceLimiter } from '../security/ResourceLimiter';
import { SandboxIsolation } from '../security/SandboxIsolation';
import { AuditManager } from './AuditManager';
import { TerminalSandboxEngine } from './TerminalSandboxEngine';
import PythonRuntime from '../runtimes/PythonRuntime';
import NodeRuntime from '../runtimes/NodeRuntime';
import GitWorkspace from '../runtimes/GitWorkspace';
import ZipTools from '../runtimes/ZipTools';
import DockerRuntime from '../runtimes/DockerRuntime';
import { CommandDispatcher } from './CommandDispatcher';
import type { CommandResult, TerminalRuntime } from '../models/types';
import { FileSystemService } from '../../vscode-workspace/services/FileSystemService';

export interface ExecutionRequest {
  userId: string;
  projectId: string;
  workspaceId?: string;
  command: string;
  runtime?: TerminalRuntime | 'python' | 'node' | 'git' | 'zip' | 'docker' | 'bash';
  cwd?: string;
  timeoutMs?: number;
  files?: Array<{ path: string; content: string }>;
}

export interface ExecutionSessionMeta {
  executionId: string;
  userId: string;
  projectId: string;
  workspaceId: string;
  runtime: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  exitCode: number;
  durationMs: number;
  stdout: string;
  stderr: string;
  error?: string;
}

// Explicit SAFE Environment Allowlist - NEVER expose app secrets or host env
export const SAFE_RUNTIME_ENVIRONMENT: Record<string, string> = {
  PATH: '/usr/local/bin:/usr/bin:/bin',
  HOME: '/tmp/terminal-sandbox/home',
  LANG: 'en_US.UTF-8',
  NODE_ENV: 'sandbox',
  PYTHONPATH: '/tmp/terminal-sandbox/python',
  TERM: 'xterm-256color',
  ISOLATED_SANDBOX: 'true',
};

export class ExecutionOrchestrator {
  private static instance: ExecutionOrchestrator | null = null;
  private commandValidation: CommandValidation;
  private fsGuard: FilesystemGuard;
  private networkPolicy: NetworkPolicy;
  private resourceLimiter: ResourceLimiter;
  private sandboxIsolation: SandboxIsolation;
  private auditManager: AuditManager;
  private engine: TerminalSandboxEngine;
  private activeExecutions: Map<string, {
    meta: ExecutionSessionMeta;
    abortController: AbortController;
  }> = new Map();

  private constructor() {
    this.commandValidation = CommandValidation.getInstance();
    this.fsGuard = FilesystemGuard.getInstance();
    this.networkPolicy = NetworkPolicy.getInstance();
    this.resourceLimiter = ResourceLimiter.getInstance();
    this.sandboxIsolation = SandboxIsolation.getInstance();
    this.auditManager = AuditManager.getInstance();
    this.engine = TerminalSandboxEngine.getInstance();
  }

  static getInstance(): ExecutionOrchestrator {
    if (!ExecutionOrchestrator.instance) {
      ExecutionOrchestrator.instance = new ExecutionOrchestrator();
    }
    return ExecutionOrchestrator.instance;
  }

  /**
   * Execute command inside isolated sandbox
   */
  async execute(request: ExecutionRequest): Promise<ExecutionSessionMeta> {
    const startTime = Date.now();
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const workspaceId = request.workspaceId || request.projectId || 'default-workspace';
    const runtimeName = request.runtime || 'bash';

    const sessionMeta: ExecutionSessionMeta = {
      executionId,
      userId: request.userId,
      projectId: request.projectId,
      workspaceId,
      runtime: runtimeName,
      status: 'pending',
      startedAt: new Date(),
      exitCode: -1,
      durationMs: 0,
      stdout: '',
      stderr: '',
    };

    const abortController = new AbortController();
    this.activeExecutions.set(executionId, { meta: sessionMeta, abortController });

    try {
      // Step 1: Request Validation & Auth verification
      if (!request.userId || !request.projectId) {
        throw new Error('Authentication & Project context required');
      }

      if (!request.command || !request.command.trim()) {
        sessionMeta.status = 'completed';
        sessionMeta.exitCode = 0;
        sessionMeta.completedAt = new Date();
        return sessionMeta;
      }

      sessionMeta.status = 'running';

      // Step 2: Command & Security Validation
      const valResult = this.commandValidation.validate(request.command);
      if (!valResult.valid) {
        this.auditManager.logEvent({
          type: 'security',
          message: `Blocked dangerous command: ${valResult.error}`,
          userId: request.userId,
        });
        throw new Error(`Security Violation: ${valResult.error}`);
      }

      // Step 3: Filesystem path guard
      const cwd = request.cwd || '/';
      const pathCheck = this.fsGuard.checkAccess(cwd);
      if (!pathCheck.allowed) {
        throw new Error(`Filesystem Violation: ${pathCheck.reason}`);
      }

      // Step 4: System Resource Limiter Check
      if (this.resourceLimiter.isSystemUnderPressure()) {
        throw new Error('Server execution limits reached. Please wait before running more commands.');
      }

      // Step 5: Isolated Workspace Sync (Phase B Canonical Workspace)
      const fsService = FileSystemService.getInstance();
      if (request.files && request.files.length > 0) {
        request.files.forEach((f) => {
          try {
            fsService.createFile(workspaceId, f.path.split('/').pop() || f.path, f.path, f.content);
          } catch {
            fsService.updateFile(workspaceId, f.path, f.content);
          }
        });
      }

      // Create Sandbox Isolation Context
      this.sandboxIsolation.createContext(executionId, request.userId);

      // Step 6: Dispatch execution based on runtime / command
      const rawCmd = request.command.trim();
      const parts = rawCmd.split(/\s+/);
      const head = parts[0].toLowerCase();
      const args = parts.slice(1);

      let result: CommandResult;
      const timeoutMs = request.timeoutMs || 30000;

      // Timeout timer promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Execution timed out after ${timeoutMs / 1000}s`));
        }, timeoutMs);
        abortController.signal.addEventListener('abort', () => clearTimeout(timer));
      });

      const execPromise = (async (): Promise<CommandResult> => {
        if (head === 'python' || head === 'python3') {
          const pyCode = args[0] === '-c' ? args.slice(1).join(' ') : (request.files?.find(f => f.path.endsWith('.py'))?.content || 'print("Python isolated sandbox ready")');
          return await PythonRuntime.getInstance().execute(pyCode, Math.floor(timeoutMs / 1000));
        }

        if (head === 'node') {
          const nodeCode = args[0] === '-e' ? args.slice(1).join(' ') : (request.files?.find(f => f.path.endsWith('.js') || f.path.endsWith('.ts'))?.content || 'console.log("Node isolated sandbox ready")');
          return await NodeRuntime.getInstance().execute(nodeCode, Math.floor(timeoutMs / 1000));
        }

        if (head === 'docker' || head === 'docker-compose') {
          const dockerRes = await DockerRuntime.executeCommand(head === 'docker-compose' ? ['compose', ...args] : args);
          return {
            success: dockerRes.status === 'success',
            exitCode: dockerRes.status === 'success' ? 0 : 1,
            stdout: dockerRes.status === 'success' ? dockerRes.output : '',
            stderr: dockerRes.status === 'error' ? dockerRes.output : '',
            executionTime: Date.now() - startTime,
            timestamp: new Date(),
          };
        }

        if (head === 'git') {
          const sub = args[0] || 'status';
          const gitWs = GitWorkspace.getInstance();
          await gitWs.initialize(workspaceId, request.files ? Object.fromEntries(request.files.map(f => [f.path, f.content])) : {});
          if (sub === 'init') {
            await gitWs.initialize(workspaceId, {});
            return { success: true, exitCode: 0, stdout: 'Initialized empty Git repository (in-memory sandbox)', stderr: '', executionTime: 0, timestamp: new Date() };
          }
          if (sub === 'status') {
            const status = gitWs.getStatus();
            return { success: true, exitCode: 0, stdout: `On branch ${status.currentBranch}\nStaged: ${status.stagedFiles.length} file(s)\nModified: ${status.modifiedFiles.length} file(s)`, stderr: '', executionTime: 0, timestamp: new Date() };
          }
          if (sub === 'add') {
            gitWs.stageFile(args[1] || '.');
            return { success: true, exitCode: 0, stdout: `Staged ${args[1] || '.'}`, stderr: '', executionTime: 0, timestamp: new Date() };
          }
          if (sub === 'commit') {
            const msgIdx = args.indexOf('-m');
            const msg = msgIdx !== -1 ? args.slice(msgIdx + 1).join(' ').replace(/^["']|["']$/g, '') : 'Commit';
            const commit = gitWs.commit(msg, request.userId);
            return commit 
              ? { success: true, exitCode: 0, stdout: `[${commit.branch} ${commit.id}] ${commit.message}`, stderr: '', executionTime: 0, timestamp: new Date() }
              : { success: false, exitCode: 1, stdout: '', stderr: 'Nothing to commit', executionTime: 0, timestamp: new Date() };
          }
        }

        if (head === 'zip' || head === 'unzip') {
          const zipTools = ZipTools.getInstance();
          if (head === 'zip') {
            const fileList = request.files ? request.files.map(f => f.path) : [];
            const archive = await zipTools.createArchive(fileList, workspaceId);
            return { success: true, exitCode: 0, stdout: `Created zip archive (${archive.byteLength} bytes)`, stderr: '', executionTime: 0, timestamp: new Date() };
          }
        }

        // Built-in commands via CommandDispatcher
        const dispatcher = CommandDispatcher.getInstance();
        return await dispatcher.execute(executionId, rawCmd);
      })();

      result = await Promise.race([execPromise, timeoutPromise]);

      // Enforce Output Size Limits (Max 100,000 chars)
      const maxOutputLen = 100000;
      sessionMeta.stdout = (result.stdout || '').slice(0, maxOutputLen);
      sessionMeta.stderr = (result.stderr || '').slice(0, maxOutputLen);
      sessionMeta.exitCode = result.exitCode;
      sessionMeta.status = result.success ? 'completed' : 'failed';

      // Step 7: Audit Logging
      this.auditManager.logEvent({
        type: 'command',
        message: `Command executed: ${rawCmd}`,
        userId: request.userId,
        metadata: { exitCode: result.exitCode, durationMs: Date.now() - startTime },
      });

    } catch (error: any) {
      const isTimeout = error.message?.includes('timed out');
      const isAbort = error.name === 'AbortError' || abortController.signal.aborted;

      sessionMeta.status = isTimeout ? 'timeout' : isAbort ? 'cancelled' : 'failed';
      sessionMeta.exitCode = isTimeout ? 124 : 1;
      sessionMeta.stderr = error.message || 'Execution error';
      sessionMeta.error = error.message;

      this.auditManager.logEvent({
        type: 'error',
        message: `Execution ${sessionMeta.status}: ${error.message}`,
        userId: request.userId,
      });
    } finally {
      // Step 8: Complete Cleanup
      sessionMeta.completedAt = new Date();
      sessionMeta.durationMs = Date.now() - startTime;
      this.sandboxIsolation.destroyContext(executionId);
      this.activeExecutions.delete(executionId);
    }

    return sessionMeta;
  }

  /**
   * Cancel an active execution session
   */
  cancelExecution(executionId: string): boolean {
    const active = this.activeExecutions.get(executionId);
    if (!active) return false;

    active.abortController.abort();
    active.meta.status = 'cancelled';
    this.sandboxIsolation.destroyContext(executionId);
    this.activeExecutions.delete(executionId);

    this.auditManager.logEvent({
      type: 'system',
      message: `Execution ${executionId} cancelled by user`,
    });

    return true;
  }

  /**
   * Get metadata for an active execution
   */
  getExecutionMeta(executionId: string): ExecutionSessionMeta | undefined {
    return this.activeExecutions.get(executionId)?.meta;
  }

  /**
   * Get all currently running executions
   */
  getActiveExecutions(): ExecutionSessionMeta[] {
    return Array.from(this.activeExecutions.values()).map(a => a.meta);
  }
}

export default ExecutionOrchestrator;
