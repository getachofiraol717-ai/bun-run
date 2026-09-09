/**
 * Security Policy Manager
 * Security policy enforcement for Terminal Sandbox
 */

import type { SandboxPolicy, SecurityEvent } from '../models/types';
import { getEducationalPolicy, createSecurityEvent } from '../models/SandboxPolicy';

export class SecurityPolicyManager {
  private static instance: SecurityPolicyManager | null = null;
  private policies: Map<string, SandboxPolicy> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private blockedPatterns = [
    /rm\s+-rf\s+\/\*/i,
    /:\s*\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*:/i,
    /dd\s+if=.*of=\/dev\/sd/i,
    /shutdown|halt|reboot/i,
  ];

  private constructor() {
    this.policies.set('educational', getEducationalPolicy());
  }

  static getInstance(): SecurityPolicyManager {
    if (!SecurityPolicyManager.instance) {
      SecurityPolicyManager.instance = new SecurityPolicyManager();
    }
    return SecurityPolicyManager.instance;
  }

  validateCommand(command: string): { valid: boolean; reason?: string } {
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(command)) {
        this.logSecurityEvent(createSecurityEvent('dangerous_command', 'critical', `Blocked dangerous command: ${command}`));
        return { valid: false, reason: 'Command blocked for security reasons' };
      }
    }
    return { valid: true };
  }

  getPolicy(policyId: string): SandboxPolicy | undefined {
    return this.policies.get(policyId);
  }

  setPolicy(policyId: string, policy: SandboxPolicy): void {
    this.policies.set(policyId, policy);
  }

  getActivePolicy(): SandboxPolicy {
    return this.policies.get('educational') || getEducationalPolicy();
  }

  logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  clearSecurityEvents(): void {
    this.securityEvents = [];
  }
}

export default SecurityPolicyManager;
