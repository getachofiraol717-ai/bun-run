/**
 * Command Dispatcher
 * Command parsing and execution for Terminal Sandbox
 */

import type { CommandResult } from '../models/types';
import DockerRuntime from '../runtimes/DockerRuntime';

const BUILT_IN_COMMANDS = [
  'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'rmdir', 'touch', 'rm', 'cp', 'mv',
  'ln', 'find', 'grep', 'awk', 'sed', 'sort', 'uniq', 'wc', 'head', 'tail',
  'date', 'whoami', 'id', 'env', 'export', 'history', 'help', 'man', 'clear',
];

export class CommandDispatcher {
  private static instance: CommandDispatcher | null = null;

  private constructor() {}

  static getInstance(): CommandDispatcher {
    if (!CommandDispatcher.instance) {
      CommandDispatcher.instance = new CommandDispatcher();
    }
    return CommandDispatcher.instance;
  }

  async execute(sessionId: string, command: string): Promise<CommandResult> {
    const startTime = Date.now();

    if (!command.trim()) {
      return {
        success: true,
        exitCode: 0,
        stdout: '',
        stderr: '',
        executionTime: 0,
        timestamp: new Date(),
      };
    }

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case 'ls':
          return this.executeLs(args);
        case 'pwd':
          return this.executePwd();
        case 'echo':
          return this.executeEcho(args);
        case 'mkdir':
          return this.executeMkdir(args);
        case 'rmdir':
          return this.executeRmdir(args);
        case 'touch':
          return this.executeTouch(args);
        case 'cat':
          return this.executeCat(args);
        case 'clear':
          return this.executeClear();
        case 'history':
          return this.executeHistory();
        case 'whoami':
          return this.executeWhoami();
        case 'id':
          return this.executeId();
        case 'date':
          return this.executeDate();
        case 'docker': {
          const dockerRes = await DockerRuntime.executeCommand(args);
          return {
            success: dockerRes.status === 'success',
            exitCode: dockerRes.status === 'success' ? 0 : 1,
            stdout: dockerRes.status === 'success' ? dockerRes.output : '',
            stderr: dockerRes.status === 'error' ? dockerRes.output : '',
            executionTime: Date.now() - startTime,
            timestamp: new Date(),
          };
        }
        default:
          return {
            success: false,
            exitCode: 127,
            stdout: '',
            stderr: `${cmd}: command not found`,
            executionTime: Date.now() - startTime,
            timestamp: new Date(),
          };
      }
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private executeLs(args: string[]): CommandResult {
    const showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
    const longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
    const files = showHidden ? ['.', '..', '.hidden', 'file1.txt', 'file2.ts', 'src'] : ['file1.txt', 'file2.ts', 'src'];

    if (longFormat) {
      const output = files.map((f) => `-rw-r--r--  1 user  staff  1024 Jan  1 10:00 ${f}`).join('\n');
      return { success: true, exitCode: 0, stdout: output, stderr: '', executionTime: 0, timestamp: new Date() };
    }

    return { success: true, exitCode: 0, stdout: files.join('  '), stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executePwd(): CommandResult {
    return { success: true, exitCode: 0, stdout: '/tmp/terminal-sandbox', stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeEcho(args: string[]): CommandResult {
    return { success: true, exitCode: 0, stdout: args.join(' '), stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeMkdir(args: string[]): CommandResult {
    if (args.length === 0) {
      return { success: false, exitCode: 1, stdout: '', stderr: 'mkdir: missing operand', executionTime: 0, timestamp: new Date() };
    }
    return { success: true, exitCode: 0, stdout: `Created directory: ${args[0]}`, stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeRmdir(args: string[]): CommandResult {
    if (args.length === 0) {
      return { success: false, exitCode: 1, stdout: '', stderr: 'rmdir: missing operand', executionTime: 0, timestamp: new Date() };
    }
    return { success: true, exitCode: 0, stdout: `Removed directory: ${args[0]}`, stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeTouch(args: string[]): CommandResult {
    if (args.length === 0) {
      return { success: false, exitCode: 1, stdout: '', stderr: 'touch: missing file operand', executionTime: 0, timestamp: new Date() };
    }
    return { success: true, exitCode: 0, stdout: `Created file: ${args[0]}`, stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeCat(args: string[]): CommandResult {
    if (args.length === 0) {
      return { success: false, exitCode: 1, stdout: '', stderr: 'cat: missing operand', executionTime: 0, timestamp: new Date() };
    }
    return { success: true, exitCode: 0, stdout: `Content of ${args[0]}...`, stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeClear(): CommandResult {
    return { success: true, exitCode: 0, stdout: '\x1b[2J\x1b[H', stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeHistory(): CommandResult {
    return { success: true, exitCode: 0, stdout: '1  ls\n2  pwd\n3  echo "Hello"', stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeWhoami(): CommandResult {
    return { success: true, exitCode: 0, stdout: 'user', stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeId(): CommandResult {
    return { success: true, exitCode: 0, stdout: 'uid=1000(user) gid=1000(staff) groups=1000(staff)', stderr: '', executionTime: 0, timestamp: new Date() };
  }

  private executeDate(): CommandResult {
    return { success: true, exitCode: 0, stdout: new Date().toString(), stderr: '', executionTime: 0, timestamp: new Date() };
  }

  getBuiltInCommands(): string[] {
    return [...BUILT_IN_COMMANDS];
  }
}

export default CommandDispatcher;
