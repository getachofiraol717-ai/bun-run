/**
 * Node.js Runtime Support for Terminal Sandbox
 * Provides Node.js execution environment and package management
 */

import { safeMathEval } from '../utils/safeMathParser';
import { runInSandbox } from '../../sandboxRunner';
import type {
  RuntimeProfile,
  NodeEnvironment,
  InstalledPackage,
  CommandResult,
} from '../models/types';

/**
 * NodeRuntime - Manages Node.js execution environment
 */
export class NodeRuntime {
  private static instance: NodeRuntime | null = null;
  private environment: NodeEnvironment | null = null;
  private outputBuffer: string[] = [];
  private errorBuffer: string[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NodeRuntime {
    if (!NodeRuntime.instance) {
      NodeRuntime.instance = new NodeRuntime();
    }
    return NodeRuntime.instance;
  }

  /**
   * Initialize Node.js environment
   */
  async initialize(profile: RuntimeProfile): Promise<NodeEnvironment> {
    this.environment = {
      version: '18.17.0',
      executable: 'node',
      npmVersion: '9.6.7',
      packages: [],
      nodeModulesPath: '/tmp/terminal-sandbox/node_modules',
      workingDirectory: '/tmp/terminal-sandbox/node',
      environmentVariables: {
        NODE_ENV: 'development',
      },
      maxMemoryMB: 512,
      executionTimeout: 30,
    };

    this.outputBuffer = [];
    this.errorBuffer = [];

    return this.environment;
  }

  /**
   * Execute JavaScript/Node.js code
   */
  async execute(code: string, timeout: number = 30): Promise<CommandResult> {
    if (!this.environment) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: 'Node.js environment not initialized',
        executionTime: 0,
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();

    try {
      this.outputBuffer = [];
      this.errorBuffer = [];

      // Run in genuine Web Worker sandbox if available in environment
      if (typeof Worker !== 'undefined') {
        const sandboxRes = await runInSandbox(code, { timeoutMs: timeout * 1000 });
        const stdoutLogs = sandboxRes.logs.map(l => l.text).join('\n');
        const output = sandboxRes.result && sandboxRes.result !== 'undefined' ? sandboxRes.result : '';
        const combinedStdout = [stdoutLogs, output].filter(Boolean).join('\n');

        return {
          success: sandboxRes.ok,
          exitCode: sandboxRes.ok ? 0 : 1,
          stdout: combinedStdout,
          stderr: sandboxRes.error || '',
          executionTime: sandboxRes.duration_ms,
          timestamp: new Date(),
        };
      }

      const result = this.simulateNodeExecution(code);

      if (result.error) {
        return {
          success: false,
          exitCode: 1,
          stdout: this.outputBuffer.join('\n'),
          stderr: result.error,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      if (result.output) {
        this.outputBuffer.push(result.output);
      }

      return {
        success: true,
        exitCode: 0,
        stdout: this.outputBuffer.join('\n'),
        stderr: this.errorBuffer.join('\n'),
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: this.outputBuffer.join('\n'),
        stderr: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Simulate Node.js execution
   */
  private simulateNodeExecution(code: string): { output?: string; error?: string } {
    const lines = code.split('\n');
    const outputs: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // console.log() simulation
      const consoleLogMatch = trimmed.match(/^console\.log\s*\(\s*(.+)\s*\)$/);
      if (consoleLogMatch) {
        const expr = consoleLogMatch[1];
        try {
          // String literal
          if ((expr.startsWith("'") && expr.endsWith("'")) || (expr.startsWith('"') && expr.endsWith('"'))) {
            outputs.push(expr.slice(1, -1));
          }
          // Template literal
          else if (expr.startsWith('`') && expr.endsWith('`')) {
            outputs.push(expr.slice(1, -1).replace(/\$\{[^}]+\}/g, '<value>'));
          }
          // Expression
          else if (/^[\d\s+\-*/().]+$/.test(expr)) {
            outputs.push(safeMathEval(expr).toString());
          }
          // Variable or expression
          else {
            outputs.push(`<${expr}>`);
          }
        } catch {
          outputs.push(`<${expr}>`);
        }
        continue;
      }

      // console.error() simulation
      const consoleErrorMatch = trimmed.match(/^console\.error\s*\(\s*(.+)\s*\)$/);
      if (consoleErrorMatch) {
        this.errorBuffer.push(`<error: ${consoleErrorMatch[1]}>`);
        continue;
      }

      // Variable declarations
      if (/^(const|let|var)\s+\w+/.test(trimmed)) {
        continue;
      }

      // Function declarations
      if (/^function\s+\w+/.test(trimmed)) {
        continue;
      }

      // Arrow functions
      if (trimmed.includes('=>')) {
        continue;
      }

      // require() statements (simulated)
      if (trimmed.startsWith('const ') && trimmed.includes('require(')) {
        const match = trimmed.match(/require\s*\(\s*['"](.+?)['"]\s*\)/);
        if (match) {
          // Return simulated module
          outputs.push(`[Module: ${match[1]}]`);
        }
        continue;
      }

      // import statements
      if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
        continue;
      }

      // Comments
      if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }

      // Empty lines
      if (trimmed === '') {
        continue;
      }
    }

    return {
      output: outputs.length > 0 ? outputs.join('\n') : undefined,
    };
  }

  /**
   * Install an npm package
   */
  async installPackage(packageName: string, version?: string): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      if (!this.environment) {
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: 'Node.js environment not initialized',
          executionTime: 0,
          timestamp: new Date(),
        };
      }

      const pkg: InstalledPackage = {
        name: packageName,
        version: version || 'latest',
        installedAt: new Date(),
        size: Math.floor(Math.random() * 10000) + 1000,
      };

      this.environment.packages.push(pkg);

      return {
        success: true,
        exitCode: 0,
        stdout: `added ${pkg.size} packages in 1s\n\n${packageName}@${pkg.version}`,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Installation failed',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Uninstall an npm package
   */
  async uninstallPackage(packageName: string): Promise<CommandResult> {
    const startTime = Date.now();

    if (!this.environment) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: 'Node.js environment not initialized',
        executionTime: 0,
        timestamp: new Date(),
      };
    }

    const index = this.environment.packages.findIndex((p) => p.name === packageName);
    if (index === -1) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: `Package '${packageName}' not found`,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }

    this.environment.packages.splice(index, 1);

    return {
      success: true,
      exitCode: 0,
      stdout: `removed ${packageName} in 1s`,
      stderr: '',
      executionTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  /**
   * List installed packages
   */
  listPackages(): InstalledPackage[] {
    return this.environment?.packages || [];
  }

  /**
   * Get Node.js version
   */
  getVersion(): string {
    return this.environment?.version || 'Not initialized';
  }

  /**
   * Get npm version
   */
  getNpmVersion(): string {
    return this.environment?.npmVersion || 'Not initialized';
  }

  /**
   * Get environment info
   */
  getEnvironment(): NodeEnvironment | null {
    return this.environment;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.environment !== null;
  }
}

export default NodeRuntime;
