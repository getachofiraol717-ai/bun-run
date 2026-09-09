/**
 * Terminal Utilities for Terminal Sandbox
 * Helper functions for terminal operations
 */

/**
 * ANSI escape code patterns
 */
const ANSI_PATTERNS = {
  // Color codes
  color: /\x1b\[(?:(?:\d+;)*\d*m)/g,
  // Clear screen
  clearScreen: /\x1b\[2J/g,
  // Clear line
  clearLine: /\x1b\[2K/g,
  // Cursor movement
  cursorHome: /\x1b\[H/g,
  cursorPos: /\x1b\[\d+;\d+H/g,
  cursorUp: /\x1b\[\d+A/g,
  cursorDown: /\x1b\[\d+B/g,
  cursorForward: /\x1b\[\d+C/g,
  cursorBack: /\x1b\[\d+D/g,
  // Hide/show cursor
  hideCursor: /\x1b\[\?25l/g,
  showCursor: /\x1b\[\?25h/g,
  // Reset
  reset: /\x1b\[0m/g,
};

/**
 * Strip ANSI escape codes from text
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERNS.color, '').replace(ANSI_PATTERNS.reset, '');
}

/**
 * Parse ANSI escape codes and return styled segments
 */
export function parseAnsi(text: string): Array<{ text: string; style?: string }> {
  const segments: Array<{ text: string; style?: string }> = [];
  let currentStyle = '';
  let lastIndex = 0;

  const regex = /\x1b\[((?:\d+;)*\d*)m/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before this code
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        style: currentStyle || undefined,
      });
    }

    // Update current style
    const codes = match[1].split(';');
    if (codes.includes('0')) {
      currentStyle = '';
    } else {
      const styles: string[] = [];
      for (const code of codes) {
        const n = parseInt(code, 10);
        if (n === 1) styles.push('font-weight: bold');
        else if (n === 3) styles.push('font-style: italic');
        else if (n === 4) styles.push('text-decoration: underline');
        else if (n >= 30 && n <= 37) styles.push(`color: ${getAnsiColor(n - 30)}`);
        else if (n >= 40 && n <= 47) styles.push(`background-color: ${getAnsiColor(n - 40)}`);
      }
      currentStyle = styles.join(';');
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      style: currentStyle || undefined,
    });
  }

  return segments;
}

/**
 * Get ANSI color value
 */
function getAnsiColor(code: number): string {
  const colors = [
    '#000000', // Black
    '#cc0000', // Red
    '#4e9a06', // Green
    '#c4a000', // Yellow
    '#3465a4', // Blue
    '#75507b', // Magenta
    '#06989a', // Cyan
    '#d3d7cf', // White
  ];
  return colors[code] || '#d3d7cf';
}

/**
 * Format terminal output for display
 */
export function formatTerminalOutput(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Parse command string into parts
 */
export function parseCommand(command: string): {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
} {
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

  // Parse flags
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

/**
 * Get shell prompt format
 */
export function getPromptFormat(session: {
  user?: string;
  host?: string;
  cwd?: string;
}): string {
  const user = session.user || 'user';
  const host = session.host || 'localhost';
  const cwd = session.cwd || '~';

  return `\x1b[32m${user}@${host}\x1b[0m:\x1b[34m${cwd}\x1b[0m$ `;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0)} ${units[i]}`;
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Parse time string (e.g., "1h 30m 15s")
 */
export function parseTimeString(timeStr: string): number {
  const regex = /(\d+)([hms])/g;
  let total = 0;
  let match;

  while ((match = regex.exec(timeStr)) !== null) {
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 'h':
        total += value * 3600000;
        break;
      case 'm':
        total += value * 60000;
        break;
      case 's':
        total += value * 1000;
        break;
    }
  }

  return total;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Escape regex special characters
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate random session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Debounce function for terminal input
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function for terminal output
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

export default {
  stripAnsi,
  parseAnsi,
  formatTerminalOutput,
  parseCommand,
  getPromptFormat,
  formatFileSize,
  formatDuration,
  parseTimeString,
  truncate,
  escapeRegex,
  generateSessionId,
  debounce,
  throttle,
};
