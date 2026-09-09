/**
 * Command Validation for Terminal Sandbox
 * Validates and sanitizes commands before execution
 */

export interface ValidationResult {
  valid: boolean;
  sanitizedCommand?: string;
  error?: string;
  warning?: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

export interface DangerousPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  example: string;
}

/**
 * CommandValidation - Validates and sanitizes terminal commands
 */
export class CommandValidation {
  private static instance: CommandValidation | null = null;
  private dangerousPatterns: DangerousPattern[] = [];
  private allowedCommands: Set<string> = new Set();
  private deniedCommands: Set<string> = new Set();

  private constructor() {
    this.initializeDefaultPatterns();
    this.initializeDefaultCommands();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CommandValidation {
    if (!CommandValidation.instance) {
      CommandValidation.instance = new CommandValidation();
    }
    return CommandValidation.instance;
  }

  /**
   * Initialize dangerous command patterns
   */
  private initializeDefaultPatterns(): void {
    // Critical - System destruction
    this.dangerousPatterns.push({
      pattern: /rm\s+-rf\s+(\/\s*|\/\*|["']?\s*\*)["']?/i,
      severity: 'critical',
      message: 'Recursive force delete detected',
      example: 'rm -rf / or rm -rf /* or rm -rf /*',
    });

    // Critical - Fork bomb
    this.dangerousPatterns.push(
      {
        pattern: /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/i,
        severity: 'critical',
        message: 'Fork bomb detected',
        example: ':(){ :|:& };:',
      },
      {
        pattern: /\|\s*&\s*\}\s*:/i,
        severity: 'critical',
        message: 'Fork bomb pattern detected',
        example: '| & };:',
      }
    );

    // Critical - Overwrite MBR
    this.dangerousPatterns.push({
      pattern: /dd\s+if=.*of=\/dev\/sd[a-z]/i,
      severity: 'critical',
      message: 'Direct disk write detected',
      example: 'dd if=/dev/zero of=/dev/sda',
    });

    // Critical - chmod dangerous permissions
    this.dangerousPatterns.push({
      pattern: /chmod\s+-R?\s*777\s+/i,
      severity: 'high',
      message: 'World-writable permissions detected',
      example: 'chmod -R 777 /some/path',
    });

    this.dangerousPatterns.push({
      pattern: /chmod\s+-R?\s*0[0-7][0-7][0-7]/i,
      severity: 'high',
      message: 'Dangerous permissions detected',
      example: 'chmod -R 0777',
    });

    // High - System manipulation
    this.dangerousPatterns.push({
      pattern: /shutdown|halt|reboot|init\s+0|init\s+6/i,
      severity: 'high',
      message: 'System shutdown/reboot command detected',
      example: 'shutdown -h now',
    });

    this.dangerousPatterns.push({
      pattern: /mkfs|mke2fs|mkfs\.(ext4|xfs|btrfs)/i,
      severity: 'high',
      message: 'Filesystem format command detected',
      example: 'mkfs.ext4 /dev/sdb1',
    });

    // High - Network configuration
    this.dangerousPatterns.push({
      pattern: /iptables|ip\s+table|ufw\s+(deny|block|remove)/i,
      severity: 'high',
      message: 'Firewall modification detected',
      example: 'iptables -F',
    });

    // Medium - Download and execute
    this.dangerousPatterns.push({
      pattern: /(curl|wget)\s+.*?\s*\|\s*(bash|sh|python|perl|ruby)/i,
      severity: 'medium',
      message: 'Pipe to shell detected (download-execute pattern)',
      example: 'curl http://example.com/script.sh | bash',
    });

    this.dangerousPatterns.push({
      pattern: /(wget|curl)\s+-O\s+.*?(bash|sh|py)\s*$/i,
      severity: 'medium',
      message: 'Download and execute pattern',
      example: 'wget script.sh -O - | bash',
    });

    // Medium - Modifying system files
    this.dangerousPatterns.push({
      pattern: />\s*\/etc\//i,
      severity: 'medium',
      message: 'Redirecting to /etc directory',
      example: 'echo "text" > /etc/somefile',
    });

    this.dangerousPatterns.push({
      pattern: />>\s*\/etc\//i,
      severity: 'medium',
      message: 'Appending to /etc directory',
      example: 'echo "text" >> /etc/somefile',
    });

    // Low - Suspicious patterns
    this.dangerousPatterns.push({
      pattern: /eval\s*\(/i,
      severity: 'low',
      message: 'Eval usage detected - potential code injection',
      example: 'eval "$variable"',
    });

    this.dangerousPatterns.push({
      pattern: /\$\([^)]+\)/i,
      severity: 'low',
      message: 'Command substitution detected',
      example: '$(cat file)',
    });

    this.dangerousPatterns.push({
      pattern: /`[^`]+`/i,
      severity: 'low',
      message: 'Backtick command substitution detected',
      example: '`whoami`',
    });
  }

  /**
   * Initialize default command lists
   */
  private initializeDefaultCommands(): void {
    // Common safe commands
    const safeCommands = [
      'ls', 'cd', 'pwd', 'echo', 'cat', 'head', 'tail', 'less', 'more',
      'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'rm', 'ln', 'find', 'grep',
      'awk', 'sed', 'sort', 'uniq', 'wc', 'cut', 'tr', 'tee',
      'date', 'cal', 'who', 'whoami', 'id', 'env', 'export', 'unset',
      'history', 'help', 'man', 'which', 'whereis', 'locate',
      'tar', 'gzip', 'gunzip', 'zip', 'unzip',
      'python', 'python3', 'node', 'npm', 'git',
      'ping', 'curl', 'wget', 'ifconfig', 'ip', 'netstat',
      'ps', 'top', 'htop', 'kill', 'killall', 'pkill',
    ];

    safeCommands.forEach((cmd) => this.allowedCommands.add(cmd));

    // Explicitly denied commands
    const deniedCommands = [
      'sudo', 'su', 'passwd', 'useradd', 'userdel', 'usermod',
      'groupadd', 'groupdel', 'groupmod',
      'chmod', 'chown', 'chgrp',
      'mount', 'umount', 'fdisk', 'parted',
      'shutdown', 'halt', 'reboot', 'poweroff',
      'init', 'systemctl', 'service',
      'iptables', 'ufw', 'firewalld',
    ];

    deniedCommands.forEach((cmd) => this.deniedCommands.add(cmd));
  }

  /**
   * Validate a command
   */
  validate(command: string): ValidationResult {
    const trimmed = command.trim();

    if (!trimmed) {
      return {
        valid: false,
        error: 'Empty command',
        riskLevel: 'none',
      };
    }

    // Check for empty/invalid input
    if (trimmed.length === 0) {
      return {
        valid: false,
        error: 'Command is empty',
        riskLevel: 'none',
      };
    }

    // Extract the base command
    const baseCommand = this.extractBaseCommand(trimmed);

    // Check if command is explicitly denied
    if (this.deniedCommands.has(baseCommand)) {
      return {
        valid: false,
        error: `Command '${baseCommand}' is not allowed`,
        riskLevel: 'critical',
      };
    }

    // Check for dangerous patterns
    let highestSeverity: ValidationResult['riskLevel'] = 'none';
    let warning: string | undefined;

    for (const pattern of this.dangerousPatterns) {
      if (pattern.pattern.test(trimmed)) {
        if (pattern.severity === 'critical') {
          return {
            valid: false,
            error: pattern.message,
            riskLevel: 'critical',
          };
        }

        if (
          pattern.severity === 'high' ||
          (pattern.severity === 'medium' && highestSeverity !== 'high')
        ) {
          highestSeverity = pattern.severity;
          warning = pattern.message;
        }
      }
    }

    // Sanitize the command
    const sanitized = this.sanitizeCommand(trimmed);

    return {
      valid: true,
      sanitizedCommand: sanitized,
      warning,
      riskLevel: highestSeverity,
    };
  }

  /**
   * Extract base command from full command string
   */
  private extractBaseCommand(command: string): string {
    // Remove pipes and redirections
    const withoutPipes = command.split(/\s*\|/)[0].trim();

    // Remove redirections
    const withoutRedirections = withoutPipes.split(/\s*>/)[0].trim();

    // Split by spaces and get first word
    const parts = withoutRedirections.split(/\s+/);

    // Handle commands like 'sudo rm' -> 'rm'
    if (parts[0] === 'sudo') {
      return parts[1] || '';
    }

    return parts[0] || '';
  }

  /**
   * Sanitize a command
   */
  private sanitizeCommand(command: string): string {
    let sanitized = command;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    // Remove potentially dangerous escapes
    sanitized = sanitized.replace(/\\/g, '');

    // Trim
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Add to allowed commands list
   */
  allowCommand(command: string): void {
    this.allowedCommands.add(command);
    this.deniedCommands.delete(command);
  }

  /**
   * Add to denied commands list
   */
  denyCommand(command: string): void {
    this.deniedCommands.add(command);
    this.allowedCommands.delete(command);
  }

  /**
   * Get allowed commands
   */
  getAllowedCommands(): string[] {
    return Array.from(this.allowedCommands);
  }

  /**
   * Get denied commands
   */
  getDeniedCommands(): string[] {
    return Array.from(this.deniedCommands);
  }

  /**
   * Add custom dangerous pattern
   */
  addDangerousPattern(pattern: DangerousPattern): void {
    this.dangerousPatterns.push(pattern);
  }

  /**
   * Get all dangerous patterns
   */
  getDangerousPatterns(): DangerousPattern[] {
    return [...this.dangerousPatterns];
  }

  /**
   * Check if command is allowed
   */
  isCommandAllowed(command: string): boolean {
    const baseCommand = this.extractBaseCommand(command);

    if (this.deniedCommands.has(baseCommand)) {
      return false;
    }

    if (this.allowedCommands.size > 0 && !this.allowedCommands.has(baseCommand)) {
      return false;
    }

    return true;
  }
}

export default CommandValidation;
