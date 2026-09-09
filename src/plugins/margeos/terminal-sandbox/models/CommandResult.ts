/**
 * Command Result Model
 * Command execution results for Terminal Sandbox
 */

import type { CommandResult, ParsedCommand, CommandSuggestion } from './types';

export function createCommandResult(
  success: boolean,
  exitCode: number,
  stdout: string = '',
  stderr: string = '',
  executionTime: number = 0
): CommandResult {
  return {
    success,
    exitCode,
    stdout,
    stderr,
    executionTime,
    timestamp: new Date(),
  };
}

export function completeCommand(
  stdout: string,
  stderr: string = '',
  exitCode: number = 0
): CommandResult {
  return {
    success: exitCode === 0,
    exitCode,
    stdout,
    stderr,
    executionTime: 0,
    timestamp: new Date(),
  };
}

export function parseCommandString(command: string): ParsedCommand {
  const parts: string[] = [];
  let current = '';
  let inQuote: string | null = null;

  for (const char of command) {
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = char;
    } else if (char === ' ') {
      if (current) {
        parts.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    parts.push(current);
  }

  const cmd = parts[0] || '';
  const args = parts.slice(1);
  const flags: Record<string, string | boolean> = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value !== undefined ? value : true;
    } else if (arg.startsWith('-')) {
      for (const char of arg.slice(1)) {
        flags[char] = true;
      }
    }
  }

  return { command: cmd, args, flags, raw: command };
}

export function suggestCorrections(
  command: string,
  availableCommands: string[]
): CommandSuggestion[] {
  const parsed = parseCommandString(command);
  const suggestions: CommandSuggestion[] = [];

  for (const cmd of availableCommands) {
    const distance = levenshteinDistance(parsed.command, cmd);
    if (distance <= 3) {
      suggestions.push({
        command: cmd,
        description: `Run ${cmd}`,
        score: 1 / (distance + 1),
      });
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
