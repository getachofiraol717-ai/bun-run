/**
 * Network Policy for Terminal Sandbox
 * Manages network access restrictions
 */

export interface NetworkRule {
  id: string;
  type: 'allow' | 'deny';
  protocol?: 'tcp' | 'udp' | 'icmp' | 'all';
  port?: number | string; // number, 'any', or range like '80-443'
  host?: string; // hostname or IP, supports wildcards
  direction: 'inbound' | 'outbound' | 'both';
  reason?: string;
}

export interface NetworkAccessDecision {
  allowed: boolean;
  reason?: string;
  matchedRule?: NetworkRule;
}

export interface NetworkStats {
  totalRequests: number;
  allowedRequests: number;
  deniedRequests: number;
  connectionsByProtocol: Record<string, number>;
  connectionsByPort: Record<number, number>;
}

/**
 * NetworkPolicy - Manages network access policies for terminal sessions
 */
export class NetworkPolicy {
  private static instance: NetworkPolicy | null = null;
  private rules: NetworkRule[] = [];
  private stats: NetworkStats = {
    totalRequests: 0,
    allowedRequests: 0,
    deniedRequests: 0,
    connectionsByProtocol: {},
    connectionsByPort: {},
  };
  private whitelist: Set<string> = new Set();

  private constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NetworkPolicy {
    if (!NetworkPolicy.instance) {
      NetworkPolicy.instance = new NetworkPolicy();
    }
    return NetworkPolicy.instance;
  }

  /**
   * Initialize default network rules
   */
  private initializeDefaultRules(): void {
    // Default allow localhost
    this.rules.push({
      id: 'allow-localhost',
      type: 'allow',
      protocol: 'all',
      host: 'localhost',
      direction: 'both',
      reason: 'Localhost access allowed',
    });

    // Default allow 127.0.0.1
    this.rules.push({
      id: 'allow-loopback',
      type: 'allow',
      protocol: 'all',
      host: '127.0.0.1',
      direction: 'both',
      reason: 'Loopback access allowed',
    });

    // Default allow sandbox internal
    this.rules.push({
      id: 'allow-sandbox',
      type: 'allow',
      protocol: 'all',
      host: '*.terminal-sandbox.local',
      direction: 'both',
      reason: 'Sandbox internal network allowed',
    });

    // Deny sensitive ports outbound
    this.rules.push({
      id: 'deny-ssh-outbound',
      type: 'deny',
      protocol: 'tcp',
      port: 22,
      direction: 'outbound',
      reason: 'SSH outbound denied',
    });

    this.rules.push({
      id: 'deny-ftp-outbound',
      type: 'deny',
      protocol: 'tcp',
      port: 21,
      direction: 'outbound',
      reason: 'FTP outbound denied',
    });

    // Allow common HTTP/HTTPS ports
    this.rules.push({
      id: 'allow-http-https',
      type: 'allow',
      protocol: 'tcp',
      port: '80,443,8080,8443',
      direction: 'outbound',
      reason: 'HTTP/HTTPS access allowed',
    });

    // Deny all other by default
    this.rules.push({
      id: 'deny-all',
      type: 'deny',
      protocol: 'all',
      host: '*',
      direction: 'both',
      reason: 'All other network access denied by default',
    });
  }

  /**
   * Check network access
   */
  checkAccess(
    host: string,
    port: number,
    protocol: 'tcp' | 'udp' | 'icmp' = 'tcp',
    direction: 'inbound' | 'outbound' = 'outbound'
  ): NetworkAccessDecision {
    this.stats.totalRequests++;

    // Check whitelist first
    const whitelistKey = `${protocol}:${host}:${port}`;
    if (this.whitelist.has(whitelistKey)) {
      this.stats.allowedRequests++;
      this.updateStats(protocol, port);
      return {
        allowed: true,
        reason: 'Whitelisted',
      };
    }

    // Check rules in order
    for (const rule of this.rules) {
      if (this.matchesRule(rule, host, port, protocol, direction)) {
        if (rule.type === 'allow') {
          this.stats.allowedRequests++;
          this.updateStats(protocol, port);
          return {
            allowed: true,
            reason: rule.reason,
            matchedRule: rule,
          };
        } else {
          this.stats.deniedRequests++;
          return {
            allowed: false,
            reason: rule.reason || 'Network access denied',
            matchedRule: rule,
          };
        }
      }
    }

    // Default deny
    this.stats.deniedRequests++;
    return {
      allowed: false,
      reason: 'No matching rule found, access denied by default',
    };
  }

  /**
   * Check if a rule matches the request
   */
  private matchesRule(
    rule: NetworkRule,
    host: string,
    port: number,
    protocol: 'tcp' | 'udp' | 'icmp',
    direction: 'inbound' | 'outbound'
  ): boolean {
    // Check direction
    if (rule.direction !== 'both' && rule.direction !== direction) {
      return false;
    }

    // Check protocol
    if (rule.protocol !== 'all' && rule.protocol !== protocol) {
      return false;
    }

    // Check host
    if (rule.host && !this.matchHost(rule.host, host)) {
      return false;
    }

    // Check port
    if (rule.port && !this.matchPort(rule.port, port)) {
      return false;
    }

    return true;
  }

  /**
   * Match host against rule pattern
   */
  private matchHost(pattern: string, host: string): boolean {
    if (pattern === '*') return true;
    if (pattern === host) return true;

    // Wildcard matching
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1);
      return host.endsWith(suffix) || host === suffix.slice(1);
    }

    // IP range matching (simplified)
    if (pattern.includes('/')) {
      const [base, bits] = pattern.split('/');
      if (host.startsWith(base.split('.').slice(0, -1).join('.'))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Match port against rule
   */
  private matchPort(rulePort: number | string, port: number): boolean {
    if (rulePort === 'any') return true;

    if (typeof rulePort === 'string') {
      // Comma-separated ports or ranges
      const parts = rulePort.split(',');
      for (const part of parts) {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          if (port >= start && port <= end) {
            return true;
          }
        } else if (parseInt(part, 10) === port) {
          return true;
        }
      }
      return false;
    }

    return rulePort === port;
  }

  /**
   * Update statistics
   */
  private updateStats(protocol: string, port: number): void {
    this.stats.connectionsByProtocol[protocol] =
      (this.stats.connectionsByProtocol[protocol] || 0) + 1;
    this.stats.connectionsByPort[port] =
      (this.stats.connectionsByPort[port] || 0) + 1;
  }

  /**
   * Add a rule
   */
  addRule(rule: Omit<NetworkRule, 'id'>): NetworkRule {
    const newRule: NetworkRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };
    this.rules.push(newRule);
    return newRule;
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update a rule
   */
  updateRule(ruleId: string, updates: Partial<NetworkRule>): boolean {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): NetworkRule[] {
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
   * Add to whitelist
   */
  whitelistHost(protocol: string, host: string, port: number): void {
    this.whitelist.add(`${protocol}:${host}:${port}`);
  }

  /**
   * Remove from whitelist
   */
  removeFromWhitelist(protocol: string, host: string, port: number): boolean {
    return this.whitelist.delete(`${protocol}:${host}:${port}`);
  }

  /**
   * Clear whitelist
   */
  clearWhitelist(): void {
    this.whitelist.clear();
  }

  /**
   * Get whitelist entries
   */
  getWhitelist(): string[] {
    return Array.from(this.whitelist);
  }

  /**
   * Get network statistics
   */
  getStats(): NetworkStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      deniedRequests: 0,
      connectionsByProtocol: {},
      connectionsByPort: {},
    };
  }
}

export default NetworkPolicy;
