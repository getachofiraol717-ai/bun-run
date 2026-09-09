/**
 * Permission Manager for Terminal Sandbox
 * Manages user and session permissions
 */

import type { SandboxPolicy, PermissionSet } from '../models/types';

export type Permission =
  | 'read'
  | 'write'
  | 'execute'
  | 'network'
  | 'filesystem'
  | 'process'
  | 'admin';

export interface Role {
  name: string;
  permissions: Permission[];
  restrictions: {
    maxMemoryMB?: number;
    maxCpuPercent?: number;
    maxSessions?: number;
    maxStorageMB?: number;
    allowedCommands?: string[];
    deniedCommands?: string[];
  };
}

export interface UserPermissions {
  userId: string;
  roles: Role[];
  customPermissions?: Permission[];
  expiresAt?: Date;
}

/**
 * PermissionManager - Manages permissions for terminal sessions
 */
export class PermissionManager {
  private static instance: PermissionManager | null = null;
  private userPermissions: Map<string, UserPermissions> = new Map();
  private roles: Map<string, Role> = new Map();

  private constructor() {
    this.initializeDefaultRoles();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    // Admin role - full access
    this.roles.set('admin', {
      name: 'admin',
      permissions: ['read', 'write', 'execute', 'network', 'filesystem', 'process', 'admin'],
      restrictions: {},
    });

    // User role - standard access
    this.roles.set('user', {
      name: 'user',
      permissions: ['read', 'write', 'execute', 'network', 'filesystem', 'process'],
      restrictions: {
        maxMemoryMB: 512,
        maxCpuPercent: 50,
        maxSessions: 5,
        maxStorageMB: 100,
      },
    });

    // Student role - restricted access for educational use
    this.roles.set('student', {
      name: 'student',
      permissions: ['read', 'write', 'execute', 'filesystem'],
      restrictions: {
        maxMemoryMB: 256,
        maxCpuPercent: 25,
        maxSessions: 2,
        maxStorageMB: 50,
        deniedCommands: ['rm -rf /', 'mkfs', 'dd', ':(){:|:&};:', 'chmod -R 777'],
      },
    });

    // Guest role - read-only with limited execution
    this.roles.set('guest', {
      name: 'guest',
      permissions: ['read', 'execute'],
      restrictions: {
        maxMemoryMB: 128,
        maxCpuPercent: 10,
        maxSessions: 1,
        maxStorageMB: 10,
        allowedCommands: ['ls', 'cat', 'cd', 'pwd', 'python', 'node', 'git'],
      },
    });
  }

  /**
   * Create a new role
   */
  createRole(name: string, permissions: Permission[], restrictions: Role['restrictions'] = {}): Role {
    const role: Role = {
      name,
      permissions,
      restrictions,
    };

    this.roles.set(name, role);
    return role;
  }

  /**
   * Get a role by name
   */
  getRole(name: string): Role | undefined {
    return this.roles.get(name);
  }

  /**
   * Get all roles
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Assign roles to a user
   */
  assignRoles(userId: string, roleNames: string[]): boolean {
    const roles: Role[] = [];

    for (const name of roleNames) {
      const role = this.roles.get(name);
      if (role) {
        roles.push(role);
      }
    }

    if (roles.length === 0) {
      return false;
    }

    this.userPermissions.set(userId, {
      userId,
      roles,
    });

    return true;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId: string): UserPermissions | undefined {
    return this.userPermissions.get(userId);
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(userId: string, permission: Permission): boolean {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms) {
      return false;
    }

    // Check custom permissions first
    if (userPerms.customPermissions?.includes(permission)) {
      return true;
    }

    // Check role permissions
    for (const role of userPerms.roles) {
      if (role.permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(userId: string, permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(userId, p));
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(userId: string, permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(userId, p));
  }

  /**
   * Get effective permissions for a user
   */
  getEffectivePermissions(userId: string): Permission[] {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms) {
      return [];
    }

    const perms = new Set<Permission>(userPerms.customPermissions || []);

    for (const role of userPerms.roles) {
      for (const p of role.permissions) {
        perms.add(p);
      }
    }

    return Array.from(perms);
  }

  /**
   * Get role restrictions for a user
   */
  getRestrictions(userId: string): Role['restrictions'] {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms) {
      return {};
    }

    // Merge restrictions from all roles (most permissive)
    const merged: Role['restrictions'] = {
      maxMemoryMB: 0,
      maxCpuPercent: 0,
      maxSessions: 0,
      maxStorageMB: 0,
      deniedCommands: [],
      allowedCommands: [],
    };

    for (const role of userPerms.roles) {
      const r = role.restrictions;
      if (r.maxMemoryMB !== undefined) merged.maxMemoryMB = Math.max(merged.maxMemoryMB!, r.maxMemoryMB);
      if (r.maxCpuPercent !== undefined) merged.maxCpuPercent = Math.max(merged.maxCpuPercent!, r.maxCpuPercent);
      if (r.maxSessions !== undefined) merged.maxSessions = Math.max(merged.maxSessions!, r.maxSessions);
      if (r.maxStorageMB !== undefined) merged.maxStorageMB = Math.max(merged.maxStorageMB!, r.maxStorageMB);
      if (r.deniedCommands) merged.deniedCommands!.push(...r.deniedCommands);
      if (r.allowedCommands) merged.allowedCommands!.push(...r.allowedCommands);
    }

    return merged;
  }

  /**
   * Revoke all roles from a user
   */
  revokeRoles(userId: string): boolean {
    return this.userPermissions.delete(userId);
  }

  /**
   * Set permission expiration
   */
  setExpiration(userId: string, expiresAt: Date): void {
    const userPerms = this.userPermissions.get(userId);
    if (userPerms) {
      userPerms.expiresAt = expiresAt;
    }
  }

  /**
   * Check if permissions have expired
   */
  isExpired(userId: string): boolean {
    const userPerms = this.userPermissions.get(userId);
    if (!userPerms?.expiresAt) {
      return false;
    }

    return new Date() > userPerms.expiresAt;
  }

  /**
   * Create permission set from policy
   */
  createPermissionSetFromPolicy(policy: SandboxPolicy): PermissionSet {
    const permissions: Permission[] = [];

    if (policy.allowRead) permissions.push('read');
    if (policy.allowWrite) permissions.push('write');
    if (policy.allowExecute) permissions.push('execute');
    if (policy.allowNetwork) permissions.push('network');
    if (policy.allowFilesystem) permissions.push('filesystem');
    if (policy.allowProcess) permissions.push('process');

    return {
      permissions,
      deniedPaths: policy.deniedPaths,
      allowedPaths: policy.allowedPaths,
      maxMemoryMB: policy.maxMemoryMB,
      maxCpuPercent: policy.maxCpuPercent,
      maxSessions: policy.maxSessions,
    };
  }
}

export default PermissionManager;
