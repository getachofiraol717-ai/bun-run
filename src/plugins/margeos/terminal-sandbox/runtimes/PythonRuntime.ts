/**
 * Python Runtime Support for Terminal Sandbox
 * Provides Python execution environment and package management
 */

import { safeMathEval } from '../utils/safeMathParser';
import type {
  RuntimeProfile,
  PythonEnvironment,
  InstalledPackage,
  CommandResult,
} from '../models/types';

/**
 * PythonRuntime - Manages Python execution environment
 */
export class PythonRuntime {
  private static instance: PythonRuntime | null = null;
  private environment: PythonEnvironment | null = null;
  private outputBuffer: string[] = [];
  private errorBuffer: string[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PythonRuntime {
    if (!PythonRuntime.instance) {
      PythonRuntime.instance = new PythonRuntime();
    }
    return PythonRuntime.instance;
  }

  /**
   * Initialize Python environment
   */
  async initialize(profile: RuntimeProfile): Promise<PythonEnvironment> {
    this.environment = {
      version: '3.11.0 (Client Parser & Sandbox)',
      executable: 'python3-sandbox',
      interpreter: 'python3-sandbox',
      packages: [],
      virtualenvPath: null,
      workingDirectory: '/tmp/terminal-sandbox/python',
      environmentVariables: {},
      maxMemoryMB: 512,
      executionTimeout: 30,
    };

    this.outputBuffer = [];
    this.errorBuffer = [];

    return this.environment;
  }

  /**
   * Execute Python code
   */
  async execute(code: string, timeout: number = 30): Promise<CommandResult> {
    if (!this.environment) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: 'Python environment not initialized',
        executionTime: 0,
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();

    try {
      // Simulate Python execution with output capture
      this.outputBuffer = [];
      this.errorBuffer = [];

      // Parse and execute Python code simulation
      const result = this.simulatePythonExecution(code);

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
   * Simulate Python execution
   */
  private simulatePythonExecution(code: string): { output?: string; error?: string } {
    // Basic Python syntax validation and simulation
    const lines = code.split('\n');
    const outputs: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // print() statement simulation
      const printMatch = trimmed.match(/^print\s*\(\s*(['"])(.*?)\1\s*\)$/);
      if (printMatch) {
        outputs.push(printMatch[2]);
        continue;
      }

      // print() with variable
      const printVarMatch = trimmed.match(/^print\s*\(\s*(\w+)\s*\)$/);
      if (printVarMatch) {
        outputs.push(`<${printVarMatch[1]}>`);
        continue;
      }

      // print() with expression
      const printExprMatch = trimmed.match(/^print\s*\(\s*(.+)\s*\)$/);
      if (printExprMatch) {
        const expr = printExprMatch[1];
        try {
          // Simple arithmetic evaluation
          if (/^[\d\s+\-*/().]+$/.test(expr)) {
            outputs.push(safeMathEval(expr).toString());
          } else if (expr.includes('"') || expr.includes("'")) {
            outputs.push(expr.replace(/['"]/g, ''));
          } else {
            outputs.push(`<expression: ${expr}>`);
          }
        } catch {
          outputs.push(`<expression: ${expr}>`);
        }
        continue;
      }

      // Variable assignment (for validation)
      if (/^\w+\s*=/.test(trimmed) && !trimmed.includes('def ') && !trimmed.includes('class ')) {
        continue;
      }

      // Comments
      if (trimmed.startsWith('#')) {
        continue;
      }

      // Function/class definitions (simplified)
      if (trimmed.startsWith('def ') || trimmed.startsWith('class ') || trimmed === 'pass') {
        continue;
      }

      // For/while loops (simplified)
      if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
        continue;
      }

      // If statements
      if (trimmed.startsWith('if ')) {
        continue;
      }

      // Import statements
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
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
   * Install a Python package
   */
  async installPackage(packageName: string, version?: string): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      if (!this.environment) {
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: 'Python environment not initialized',
          executionTime: 0,
          timestamp: new Date(),
        };
      }

      // Simulate package installation
      const pkg: InstalledPackage = {
        name: packageName,
        version: version || 'latest',
        installedAt: new Date(),
        size: Math.floor(Math.random() * 5000) + 500,
      };

      this.environment.packages.push(pkg);

      return {
        success: true,
        exitCode: 0,
        stdout: `Successfully installed ${packageName}${version ? `@${version}` : ''}`,
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
   * Uninstall a Python package
   */
  async uninstallPackage(packageName: string): Promise<CommandResult> {
    const startTime = Date.now();

    if (!this.environment) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: 'Python environment not initialized',
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
      stdout: `Successfully uninstalled ${packageName}`,
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
   * Get Python version
   */
  getVersion(): string {
    return this.environment?.version || 'Not initialized';
  }

  /**
   * Get environment info
   */
  getEnvironment(): PythonEnvironment | null {
    return this.environment;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.environment !== null;
  }
}

export default PythonRuntime;
