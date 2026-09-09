/**
 * Runtime Utilities for Terminal Sandbox
 * Helper functions for runtime operations
 */

/**
 * Get runtime display name
 */
export function getRuntimeDisplayName(runtime: string): string {
  const names: Record<string, string> = {
    bash: 'Bash',
    zsh: 'Zsh',
    sh: 'Shell',
    python: 'Python',
    python3: 'Python 3',
    node: 'Node.js',
    ruby: 'Ruby',
    php: 'PHP',
    perl: 'Perl',
    lua: 'Lua',
    go: 'Go',
    rust: 'Rust',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
  };

  return names[runtime] || runtime.toUpperCase();
}

/**
 * Get runtime icon
 */
export function getRuntimeIcon(runtime: string): string {
  const icons: Record<string, string> = {
    bash: '🐚',
    zsh: '⚡',
    sh: '🐚',
    python: '🐍',
    python3: '🐍',
    node: '🟢',
    ruby: '💎',
    php: '🐘',
    perl: '🐪',
    lua: '🌙',
    go: '🔷',
    rust: '🦀',
    java: '☕',
    c: '🔧',
    cpp: '⚙️',
  };

  return icons[runtime] || '📦';
}

/**
 * Check if runtime supports packages
 */
export function supportsPackages(runtime: string): boolean {
  const packageManagers: string[] = [
    'python',
    'python3',
    'node',
    'ruby',
    'php',
    'perl',
    'lua',
  ];

  return packageManagers.includes(runtime);
}

/**
 * Get package manager for runtime
 */
export function getPackageManager(runtime: string): string | null {
  const managers: Record<string, string> = {
    python: 'pip',
    python3: 'pip',
    node: 'npm',
    ruby: 'gem',
    php: 'composer',
    perl: 'cpan',
    lua: 'luarocks',
  };

  return managers[runtime] || null;
}

/**
 * Format package list for display
 */
export function formatPackageList(packages: Array<{ name: string; version?: string }>): string {
  if (packages.length === 0) return 'No packages installed';

  const maxNameLength = Math.max(...packages.map((p) => p.name.length));

  return packages
    .map((p) => {
      const name = p.name.padEnd(maxNameLength);
      const version = p.version ? ` v${p.version}` : '';
      return `  ${name}${version}`;
    })
    .join('\n');
}

/**
 * Validate Python code syntax
 */
export function validatePythonSyntax(code: string): { valid: boolean; error?: string } {
  // Basic Python syntax checks
  const lines = code.split('\n');
  let indentStack: number[] = [0];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for unclosed strings
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    const tripleQuotes = (line.match(/"""'''/g) || []).length;

    // Check bracket balance
    const brackets = {
      '(': (line.match(/\(/g) || []).length,
      ')': (line.match(/\)/g) || []).length,
      '[': (line.match(/\[/g) || []).length,
      ']': (line.match(/\]/g) || []).length,
      '{': (line.match(/\{/g) || []).length,
      '}': (line.match(/\}/g) || []).length,
    };

    // Basic check for unmatched brackets
    for (const [open, close] of [[' parentheses', '('], ['brackets', '['], ['braces', '{']]) {
      if (brackets[open as keyof typeof brackets] !== brackets[close as keyof typeof brackets]) {
        return {
          valid: false,
          error: `Line ${i + 1}: Unmatched ${open}`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate JavaScript code syntax
 */
export function validateJavaScriptSyntax(code: string): { valid: boolean; error?: string } {
  // Basic JavaScript syntax checks
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//')) continue;

    // Check for unclosed strings
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    const backticks = (line.match(/`/g) || []).length;

    // Check bracket balance
    const brackets = {
      '(': (line.match(/\(/g) || []).length,
      ')': (line.match(/\)/g) || []).length,
      '[': (line.match(/\[/g) || []).length,
      ']': (line.match(/\]/g) || []).length,
      '{': (line.match(/\{/g) || []).length,
      '}': (line.match(/\}/g) || []).length,
    };

    for (const [open, close] of [[' parentheses', '('], ['brackets', '['], ['braces', '{']]) {
      if (brackets[open as keyof typeof brackets] !== brackets[close as keyof typeof brackets]) {
        return {
          valid: false,
          error: `Line ${i + 1}: Unmatched ${open}`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Parse shebang line
 */
export function parseShebang(code: string): string | null {
  const lines = code.split('\n');
  if (lines.length === 0) return null;

  const firstLine = lines[0].trim();
  if (!firstLine.startsWith('#!')) return null;

  const parts = firstLine.slice(2).trim().split(/\s+/);
  return parts[0] || null;
}

/**
 * Detect runtime from code
 */
export function detectRuntime(code: string): string | null {
  const shebang = parseShebang(code);
  if (shebang) {
    if (shebang.includes('python')) return 'python';
    if (shebang.includes('node')) return 'node';
    if (shebang.includes('ruby')) return 'ruby';
    if (shebang.includes('perl')) return 'perl';
    if (shebang.includes('bash')) return 'bash';
    if (shebang.includes('sh')) return 'sh';
  }

  // Detect from syntax
  const lines = code.split('\n').slice(0, 20);
  const combined = lines.join('\n');

  // Python indicators
  if (/\bdef\s+\w+\s*\(/.test(combined) || /\bclass\s+\w+/.test(combined)) {
    return 'python';
  }

  // JavaScript/Node indicators
  if (/\bconst\s+\w+\s*=/.test(combined) || /\blet\s+\w+\s*=/.test(combined)) {
    return 'node';
  }

  // Ruby indicators
  if (/\bdef\s+\w+\s*$/.test(combined) || /\bend\b/.test(combined)) {
    return 'ruby';
  }

  return null;
}

/**
 * Get language mode for code editor
 */
export function getLanguageMode(runtime: string): string {
  const modes: Record<string, string> = {
    bash: 'shell',
    zsh: 'shell',
    sh: 'shell',
    python: 'python',
    python3: 'python',
    node: 'javascript',
    ruby: 'ruby',
    php: 'php',
    perl: 'perl',
    lua: 'lua',
    go: 'go',
    rust: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
  };

  return modes[runtime] || 'text';
}

export default {
  getRuntimeDisplayName,
  getRuntimeIcon,
  supportsPackages,
  getPackageManager,
  formatPackageList,
  validatePythonSyntax,
  validateJavaScriptSyntax,
  parseShebang,
  detectRuntime,
  getLanguageMode,
};
