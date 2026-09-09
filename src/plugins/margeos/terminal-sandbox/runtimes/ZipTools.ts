/**
 * ZIP Archive Tools for Terminal Sandbox
 * Provides archive creation, extraction, and management
 */

import type { CommandResult, WorkspaceFile } from '../models/types';

export interface ArchiveEntry {
  name: string;
  path: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
  modifiedAt: Date;
  permissions: string;
}

export interface ArchiveInfo {
  path: string;
  format: 'zip' | 'tar' | 'gz' | 'bz2';
  totalSize: number;
  compressedSize: number;
  entryCount: number;
  entries: ArchiveEntry[];
  createdAt: Date;
}

/**
 * ZipTools - Manages archive operations within sandbox
 */
export class ZipTools {
  private static instance: ZipTools | null = null;
  private archives: Map<string, ArchiveInfo> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ZipTools {
    if (!ZipTools.instance) {
      ZipTools.instance = new ZipTools();
    }
    return ZipTools.instance;
  }

  /**
   * Create a new ZIP archive
   */
  async createArchive(
    archivePath: string,
    files: string[],
    compressionLevel: number = 6
  ): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      const entries: ArchiveEntry[] = files.map((file) => ({
        name: file.split('/').pop() || file,
        path: file,
        size: Math.floor(Math.random() * 10000) + 100,
        compressedSize: Math.floor(Math.random() * 5000) + 50,
        isDirectory: file.endsWith('/'),
        modifiedAt: new Date(),
        permissions: '-rw-r--r--',
      }));

      const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
      const compressedSize = entries.reduce((sum, e) => sum + e.compressedSize, 0);

      const archive: ArchiveInfo = {
        path: archivePath,
        format: 'zip',
        totalSize,
        compressedSize,
        entryCount: entries.length,
        entries,
        createdAt: new Date(),
      };

      this.archives.set(archivePath, archive);

      const compressionRatio = ((1 - compressedSize / totalSize) * 100).toFixed(1);

      return {
        success: true,
        exitCode: 0,
        stdout: `Creating archive: ${archivePath}\n  adding: ${entries.length} file(s)\n  total size: ${totalSize} bytes\n  compressed: ${compressedSize} bytes (${compressionRatio}% reduction)`,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Archive creation failed',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Extract an archive
   */
  async extractArchive(archivePath: string, destination: string): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      const archive = this.archives.get(archivePath);
      if (!archive) {
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: `Archive not found: ${archivePath}`,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      let output = `Extracting: ${archivePath}\n`;

      for (const entry of archive.entries) {
        const targetPath = `${destination}/${entry.name}`;
        output += `  ${entry.isDirectory ? 'creating' : 'extracting' }: ${targetPath}\n`;
      }

      output += `\nTotal files extracted: ${archive.entryCount}`;

      return {
        success: true,
        exitCode: 0,
        stdout: output,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Archive extraction failed',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * List archive contents
   */
  async listArchive(archivePath: string): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      const archive = this.archives.get(archivePath);
      if (!archive) {
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: `Archive not found: ${archivePath}`,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      let output = `Archive: ${archive.path}\n`;
      output += `Format: ${archive.format.toUpperCase()}\n`;
      output += `Size: ${archive.totalSize} bytes\n`;
      output += `Compressed: ${archive.compressedSize} bytes\n`;
      output += `Entries: ${archive.entryCount}\n\n`;
      output += 'Contents:\n';
      output += '-'.repeat(60) + '\n';

      for (const entry of archive.entries) {
        const sizeStr = entry.isDirectory ? '-' : entry.size.toString().padStart(8);
        const dateStr = entry.modifiedAt.toISOString().split('T')[0];
        output += `${entry.permissions} ${sizeStr}  ${dateStr}  ${entry.name}\n`;
      }

      return {
        success: true,
        exitCode: 0,
        stdout: output,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Failed to list archive',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Add files to an existing archive
   */
  async addToArchive(archivePath: string, files: string[]): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      const archive = this.archives.get(archivePath);
      if (!archive) {
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: `Archive not found: ${archivePath}`,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      const newEntries: ArchiveEntry[] = files.map((file) => ({
        name: file.split('/').pop() || file,
        path: file,
        size: Math.floor(Math.random() * 10000) + 100,
        compressedSize: Math.floor(Math.random() * 5000) + 50,
        isDirectory: file.endsWith('/'),
        modifiedAt: new Date(),
        permissions: '-rw-r--r--',
      }));

      archive.entries.push(...newEntries);
      archive.entryCount = archive.entries.length;
      archive.totalSize = archive.entries.reduce((sum, e) => sum + e.size, 0);
      archive.compressedSize = archive.entries.reduce((sum, e) => sum + e.compressedSize, 0);

      return {
        success: true,
        exitCode: 0,
        stdout: `Adding ${files.length} file(s) to ${archivePath}`,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Failed to add to archive',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Remove files from an archive
   */
  async removeFromArchive(archivePath: string, files: string[]): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      const archive = this.archives.get(archivePath);
      if (!archive) {
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: `Archive not found: ${archivePath}`,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      const removedCount = archive.entries.filter((e) => files.includes(e.name)).length;
      archive.entries = archive.entries.filter((e) => !files.includes(e.name));
      archive.entryCount = archive.entries.length;
      archive.totalSize = archive.entries.reduce((sum, e) => sum + e.size, 0);
      archive.compressedSize = archive.entries.reduce((sum, e) => sum + e.compressedSize, 0);

      return {
        success: true,
        exitCode: 0,
        stdout: `Removed ${removedCount} file(s) from ${archivePath}`,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Failed to remove from archive',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test archive integrity
   */
  async testArchive(archivePath: string): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      const archive = this.archives.get(archivePath);
      if (!archive) {
        return {
          success: false,
          exitCode: 1,
          stdout: '',
          stderr: `Archive not found: ${archivePath}`,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      const output = `Testing archive: ${archivePath}\n` +
        `  Archive format: ${archive.format.toUpperCase()}\n` +
        `  Entries tested: ${archive.entryCount}\n` +
        `  No errors found`;

      return {
        success: true,
        exitCode: 0,
        stdout: output,
        stderr: '',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Archive test failed',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get archive info
   */
  getArchiveInfo(path: string): ArchiveInfo | undefined {
    return this.archives.get(path);
  }

  /**
   * List all archives
   */
  listArchives(): ArchiveInfo[] {
    return Array.from(this.archives.values());
  }

  /**
   * Delete an archive
   */
  deleteArchive(path: string): boolean {
    return this.archives.delete(path);
  }
}

export default ZipTools;
