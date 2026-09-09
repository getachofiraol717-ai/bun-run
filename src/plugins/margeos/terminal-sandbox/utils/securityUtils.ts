/**
 * Security Utilities for Terminal Sandbox
 * Helper functions for security operations
 */

import FilesystemGuard from '../security/FilesystemGuard';
import CommandValidation from '../security/CommandValidation';
import NetworkPolicy from '../security/NetworkPolicy';
import SandboxIsolation from '../security/SandboxIsolation';

/**
 * Validate command for security
 */
export function validateCommand(command: string): {
  valid: boolean;
  error?: string;
  warning?: string;
  riskLevel: string;
} {
  return CommandValidation.getInstance().validate(command);
}

/**
 * Check filesystem access
 */
export function checkFileAccess(
  path: string,
  operation: 'read' | 'write' | 'execute'
): { allowed: boolean; reason?: string; sanitizedPath?: string } {
  const guard = FilesystemGuard.getInstance();

  switch (operation) {
    case 'read':
      return guard.validateRead(path);
    case 'write':
      return guard.validateWrite(path);
    case 'execute':
      return guard.validateExecute(path);
  }
}

/**
 * Check network access
 */
export function checkNetworkAccess(
  host: string,
  port: number,
  protocol: 'tcp' | 'udp' | 'icmp' = 'tcp',
  direction: 'inbound' | 'outbound' = 'outbound'
): { allowed: boolean; reason?: string } {
  return NetworkPolicy.getInstance().checkAccess(host, port, protocol, direction);
}

/**
 * Create isolation context for session
 */
export function createIsolation(
  sessionId: string,
  userId: string
): { success: boolean; error?: string } {
  return SandboxIsolation.getInstance().createContext(sessionId, userId);
}

/**
 * Check if path is in sandbox
 */
export function isInSandbox(sessionId: string, path: string): boolean {
  return SandboxIsolation.getInstance().isPathAccessible(sessionId, path);
}

/**
 * Sanitize user input for display
 */
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize user input for storage
 */
export function sanitizeForStorage(input: string): string {
  return input
    .replace(/\0/g, '')
    .replace(/[\n\r]/g, ' ')
    .trim();
}

/**
 * Validate filename
 */
export function validateFilename(filename: string): { valid: boolean; error?: string } {
  // Check for empty
  if (!filename || filename.trim() === '') {
    return { valid: false, error: 'Filename cannot be empty' };
  }

  // Check length
  if (filename.length > 255) {
    return { valid: false, error: 'Filename too long (max 255 characters)' };
  }

  // Check for invalid characters
  const invalidChars = /[\x00-\x1f\x7f<>:"|?*\x2f]/;
  if (invalidChars.test(filename)) {
    return { valid: false, error: 'Filename contains invalid characters' };
  }

  // Check for reserved names
  const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'LPT1', 'LPT2', 'LPT3'];
  const upperName = filename.toUpperCase().split('.')[0];
  if (reserved.includes(upperName)) {
    return { valid: false, error: 'Filename is a reserved name' };
  }

  // Check for dots at start/end
  if (filename.startsWith('.') || filename.endsWith('.')) {
    return { valid: false, error: 'Filename cannot start or end with a dot' };
  }

  // Check for trailing spaces
  if (filename !== filename.trim()) {
    return { valid: false, error: 'Filename cannot have leading or trailing spaces' };
  }

  return { valid: true };
}

/**
 * Validate path
 */
export function validatePath(path: string): { valid: boolean; error?: string } {
  // Check for empty
  if (!path || path.trim() === '') {
    return { valid: false, error: 'Path cannot be empty' };
  }

  // Check length
  if (path.length > 4096) {
    return { valid: false, error: 'Path too long (max 4096 characters)' };
  }

  // Check for null bytes
  if (path.includes('\0')) {
    return { valid: false, error: 'Path contains null bytes' };
  }

  // Check for path traversal attempts
  if (path.includes('..')) {
    return { valid: false, error: 'Path traversal not allowed' };
  }

  return { valid: true };
}

/**
 * Check for potential command injection
 */
export function hasCommandInjection(input: string): boolean {
  const injectionPatterns = [
    /;/,
    /\|/,
    /&&/,
    /\|\|/,
    /`/,
    /\$\(/,
    /\$\{/,
    />/,
    /<</,
    /\n/,
    /\r/,
  ];

  return injectionPatterns.some((pattern) => pattern.test(input));
}

/**
 * Generate secure random string
 */
export function generateSecureId(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const random = new Uint32Array(length);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(random);
  } else {
    for (let i = 0; i < length; i++) {
      random[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }

  return Array.from(random)
    .map((x) => chars[x % chars.length])
    .join('');
}

/**
 * Hash sensitive data
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  strength: 'weak' | 'medium' | 'strong' | 'very strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character type checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Common patterns
  if (password.length < 8) feedback.push('Password too short (min 8 characters)');
  if (!/[a-z]/.test(password)) feedback.push('Add lowercase letters');
  if (!/[A-Z]/.test(password)) feedback.push('Add uppercase letters');
  if (!/[0-9]/.test(password)) feedback.push('Add numbers');
  if (!/[^a-zA-Z0-9]/.test(password)) feedback.push('Add special characters');

  // Check for common passwords
  const common = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (common.some((p) => password.toLowerCase().includes(p))) {
    score = 0;
    feedback.push('Password is too common');
  }

  let strength: 'weak' | 'medium' | 'strong' | 'very strong';
  if (score < 3) strength = 'weak';
  else if (score < 5) strength = 'medium';
  else if (score < 7) strength = 'strong';
  else strength = 'very strong';

  return { score, strength, feedback };
}

export default {
  validateCommand,
  checkFileAccess,
  checkNetworkAccess,
  createIsolation,
  isInSandbox,
  sanitizeForDisplay,
  sanitizeForStorage,
  validateFilename,
  validatePath,
  hasCommandInjection,
  generateSecureId,
  hashData,
  checkPasswordStrength,
};
