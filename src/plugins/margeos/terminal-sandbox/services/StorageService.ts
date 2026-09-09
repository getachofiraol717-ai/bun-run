// @ts-nocheck
/**
 * Storage Service for Terminal Sandbox
 * Manages persistent storage and data management
 */

import AuditManager from '../core/AuditManager';

export interface StorageMetadata {
  key: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  type: string;
}

const STORAGE_PREFIX = 'terminal_sandbox_';
const METADATA_KEY = 'terminal_sandbox_metadata';

/**
 * StorageService - Manages persistent storage for terminal sandbox
 */
export class StorageService {
  private static instance: StorageService | null = null;
  private metadata: Map<string, StorageMetadata> = new Map();
  private auditManager: AuditManager;

  private constructor() {
    this.auditManager = AuditManager.getInstance();
    this.loadMetadata();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Load metadata from storage
   */
  private loadMetadata(): void {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + METADATA_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.metadata = new Map(
          Object.entries(data).map(([key, value]: [string, unknown]) => [
            key,
            {
              ...(value as object),
              createdAt: new Date((value as StorageMetadata).createdAt),
              modifiedAt: new Date((value as StorageMetadata).modifiedAt),
            },
          ])
        );
      }
    } catch (error) {
      console.error('Failed to load storage metadata:', error);
      this.metadata = new Map();
    }
  }

  /**
   * Save metadata to storage
   */
  private saveMetadata(): void {
    try {
      const data = Object.fromEntries(this.metadata);
      localStorage.setItem(STORAGE_PREFIX + METADATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save storage metadata:', error);
    }
  }

  /**
   * Generate storage key
   */
  private getKey(key: string): string {
    return STORAGE_PREFIX + key;
  }

  /**
   * Store data
   */
  set<T>(key: string, value: T, type: string = 'json'): boolean {
    try {
      const storageKey = this.getKey(key);
      const serialized = JSON.stringify(value);
      const size = new Blob([serialized]).size;

      localStorage.setItem(storageKey, serialized);

      this.metadata.set(key, {
        key,
        size,
        createdAt: this.metadata.get(key)?.createdAt || new Date(),
        modifiedAt: new Date(),
        type,
      });

      this.saveMetadata();
      return true;
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  /**
   * Retrieve data
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const storageKey = this.getKey(key);
      const value = localStorage.getItem(storageKey);

      if (value === null) {
        return defaultValue;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return defaultValues;
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  /**
   * Remove data
   */
  remove(key: string): boolean {
    try {
      const storageKey = this.getKey(key);
      localStorage.removeItem(storageKey);
      this.metadata.delete(key);
      this.saveMetadata();
      return true;
    } catch (error) {
      console.error('Failed to remove data:', error);
      return false;
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
      this.metadata.clear();
      this.saveMetadata();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    const result: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX) && key !== STORAGE_PREFIX + METADATA_KEY) {
        result.push(key.slice(STORAGE_PREFIX.length));
      }
    }

    return result;
  }

  /**
   * Get metadata for a key
   */
  getMetadata(key: string): StorageMetadata | undefined {
    return this.metadata.get(key);
  }

  /**
   * Get all metadata
   */
  getAllMetadata(): StorageMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Get total storage size
   */
  getTotalSize(): number {
    return Array.from(this.metadata.values()).reduce((sum, m) => sum + m.size, 0);
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalKeys: number;
    totalSize: number;
    sizeFormatted: string;
    metadata: Record<string, StorageMetadata>;
  } {
    const totalSize = this.getTotalSize();

    return {
      totalKeys: this.metadata.size,
      totalSize,
      sizeFormatted: this.formatSize(totalSize),
      metadata: Object.fromEntries(this.metadata),
    };
  }

  /**
   * Format bytes to human readable
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  }

  /**
   * Export all data
   */
  export(): string {
    const data: Record<string, unknown> = {};

    for (const key of this.keys()) {
      data[key] = this.get(key);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data
   */
  import(jsonData: string): { success: number; failed: number } {
    try {
      const data = JSON.parse(jsonData);
      let success = 0;
      let failed = 0;

      for (const [key, value] of Object.entries(data)) {
        if (this.set(key, value)) {
          success++;
        } else {
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('Failed to import data:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Check if storage quota exceeded
   */
  isQuotaExceeded(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return false;
    } catch (error) {
      return true;
    }
  }

  /**
   * Clean up old data
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - maxAge);
    let removed = 0;

    for (const [key, meta] of this.metadata.entries()) {
      if (meta.modifiedAt < cutoff) {
        if (this.remove(key)) {
          removed++;
        }
      }
    }

    return removed;
  }
}

export default StorageService;
