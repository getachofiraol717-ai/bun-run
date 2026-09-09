/**
 * Filesystem Guard for Terminal Sandbox
 * Protects sensitive filesystem paths
 */

export interface PathRule {
  pattern: string;
  action: 'allow' | 'deny' | 'redirect';
  redirectTo?: string;
  message?: string;
}

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
  sanitizedPath?: string;
  redirectTo?: string;
}

/**
 * FilesystemGuard - Protects sensitive filesystem paths from unauthorized access
 */
export class FilesystemGuard {
  private static instance: FilesystemGuard | null = null;
  private rules: PathRule[] = [];

  private constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): FilesystemGuard {
    if (!FilesystemGuard.instance) {
      FilesystemGuard.instance = new FilesystemGuard();
    }
    return FilesystemGuard.instance;
  }

  /**
   * Initialize default security rules
   */
  private initializeDefaultRules(): void {
    // Critical system directories - deny all
    this.rules.push(
      { pattern: '/etc/shadow', action: 'deny', message: 'Access to shadow passwords denied' },
      { pattern: '/etc/passwd', action: 'allow' },
      { pattern: '/etc/group', action: 'allow' },
      { pattern: '/root', action: 'deny', message: 'Root directory access denied' },
      { pattern: '/boot', action: 'deny', message: 'Boot directory access denied' },
      { pattern: '/sys', action: 'deny', message: 'Sys directory access denied' },
      { pattern: '/proc', action: 'deny', message: 'Proc directory access denied' },
      { pattern: '/dev', action: 'deny', message: 'Device directory access denied' },
    );

    // System configuration - deny modifications
    this.rules.push(
      { pattern: '/etc/sudoers', action: 'deny', message: 'Sudoers file access denied' },
      { pattern: '/etc/ssh', action: 'deny', message: 'SSH configuration access denied' },
      { pattern: '/etc/init.d', action: 'deny', message: 'Init scripts access denied' },
      { pattern: '/etc/systemd', action: 'deny', message: 'Systemd configuration access denied' },
    );

    // User directories - redirect to sandbox
    this.rules.push(
      { pattern: '/home', action: 'redirect', redirectTo: '/tmp/terminal-sandbox', message: 'Redirecting to sandbox' },
      { pattern: '/var/log', action: 'deny', message: 'Log directory access denied' },
      { pattern: '/var/tmp', action: 'redirect', redirectTo: '/tmp/terminal-sandbox/tmp' },
    );

    // Network and security related
    this.rules.push(
      { pattern: '/etc/hosts', action: 'allow' },
      { pattern: '/etc/resolv.conf', action: 'allow' },
      { pattern: '/etc/ssl', action: 'deny', message: 'SSL certificates access denied' },
    );

    // Allow tmp and sandbox
    this.rules.push(
      { pattern: '/tmp', action: 'allow' },
      { pattern: '/tmp/terminal-sandbox', action: 'allow' },
    );
  }

  /**
   * Check path access
   */
  checkAccess(path: string): AccessDecision {
    const normalizedPath = this.normalizePath(path);

    // Check rules in order (last match wins)
    let decision: AccessDecision = { allowed: true };

    for (const rule of this.rules) {
      if (this.matchPattern(normalizedPath, rule.pattern)) {
        switch (rule.action) {
          case 'deny':
            return {
              allowed: false,
              reason: rule.message || `Access to ${rule.pattern} denied`,
            };
          case 'allow':
            decision = { allowed: true };
            break;
          case 'redirect':
            decision = {
              allowed: true,
              reason: rule.message,
              redirectTo: rule.redirectTo,
              sanitizedPath: rule.redirectTo,
            };
            break;
        }
      }
    }

    return decision;
  }

  /**
   * Validate a path for read operation
   */
  validateRead(path: string): AccessDecision {
    const decision = this.checkAccess(path);

    if (!decision.allowed) {
      return {
        allowed: false,
        reason: `Read access denied: ${decision.reason}`,
      };
    }

    return decision;
  }

  /**
   * Validate a path for write operation
   */
  validateWrite(path: string): AccessDecision {
    const decision = this.checkAccess(path);

    if (!decision.allowed) {
      return {
        allowed: false,
        reason: `Write access denied: ${decision.reason}`,
      };
    }

    // Additional checks for write operations
    if (decision.redirectTo) {
      return decision;
    }

    // Check if path ends with sensitive file
    const sensitiveFiles = [
      '/etc/passwd',
      '/etc/shadow',
      '/etc/group',
      '/etc/sudoers',
      '/etc/fstab',
    ];

    for (const sensitive of sensitiveFiles) {
      if (path === sensitive || path.endsWith(sensitive)) {
        return {
          allowed: false,
          reason: `Write to ${sensitive} denied`,
        };
      }
    }

    return decision;
  }

  /**
   * Validate a path for execute operation
   */
  validateExecute(path: string): AccessDecision {
    const decision = this.checkAccess(path);

    if (!decision.allowed) {
      return {
        allowed: false,
        reason: `Execute access denied: ${decision.reason}`,
      };
    }

    // Check for dangerous binary patterns
    const dangerousBinaries = [
      '/bin/shutdown',
      '/bin/reboot',
      '/sbin/halt',
      '/usr/sbin/useradd',
      '/usr/sbin/userdel',
      '/usr/sbin/passwd',
    ];

    for (const dangerous of dangerousBinaries) {
      if (path.includes(dangerous)) {
        return {
          allowed: false,
          reason: `Execution of ${dangerous} denied for security`,
        };
      }
    }

    return decision;
  }

  /**
   * Sanitize a path
   */
  sanitize(path: string): string {
    const decision = this.checkAccess(path);

    if (decision.sanitizedPath) {
      return decision.sanitizedPath;
    }

    if (!decision.allowed) {
      return '/tmp/terminal-sandbox';
    }

    return path;
  }

  /**
   * Add a custom rule
   */
  addRule(rule: PathRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a rule by pattern
   */
  removeRule(pattern: string): boolean {
    const index = this.rules.findIndex((r) => r.pattern === pattern);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): PathRule[] {
    return [...this.rules];
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules = [];
  }

  /**
   * Reset to default rules
   */
  resetToDefaults(): void {
    this.rules = [];
    this.initializeDefaultRules();
  }

  /**
   * Normalize a path
   */
  private normalizePath(path: string): string {
    let normalized = path.trim();

    // Remove duplicate slashes
    normalized = normalized.replace(/\/+/g, '/');

    // Remove /./ components
    normalized = normalized.replace(/\/\.\//g, '/');

    // Handle ../ components
    const parts = normalized.split('/');
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        if (resolved.length > 1) {
          resolved.pop();
        }
      } else if (part !== '.' && part !== '') {
        resolved.push(part);
      }
    }

    normalized = '/' + resolved.join('/');

    return normalized;
  }

  /**
   * Match a path against a pattern
   */
  private matchPattern(path: string, pattern: string): boolean {
    if (pattern.endsWith('/')) {
      // Directory pattern
      return path.startsWith(pattern) || path === pattern.slice(0, -1);
    }

    // Exact or starts with match
    return path === pattern || path.startsWith(pattern + '/');
  }
}

export default FilesystemGuard;
