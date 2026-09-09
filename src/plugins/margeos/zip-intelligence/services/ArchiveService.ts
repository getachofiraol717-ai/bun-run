// @ts-nocheck
/**
 * Archive Service
 * Handles ZIP archive operations and file extraction
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';

export interface ExtractionResult {
  success: boolean;
  files: ProjectFile[];
  rootFolder: ProjectFolder;
  totalFiles: number;
  totalSize: number;
  errors?: string[];
  warnings?: string[];
}

export interface ArchiveServiceConfig {
  maxFileSize: number;
  maxTotalSize: number;
  maxFiles: number;
  excludedPatterns: string[];
  includedExtensions: string[];
}

const DEFAULT_CONFIG: ArchiveServiceConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxTotalSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10000,
  excludedPatterns: [
    'node_modules/**',
    '.git/**',
    '.DS_Store',
    '*.log',
    '*.lock',
    'package-lock.json',
    'yarn.lock',
    '*.pyc',
    '__pycache__/**',
    'dist/**',
    'build/**',
    '.next/**',
    '.nuxt/**',
    '.cache/**',
    'coverage/**',
    '.env',
    '.env.local',
  ],
  includedExtensions: [
    '.ts', '.tsx', '.js', '.jsx', '.json',
    '.py', '.java', '.cs', '.go', '.rs', '.rb', '.php',
    '.html', '.css', '.scss', '.sass', '.less',
    '.md', '.txt', '.yaml', '.yml', '.xml',
    '.sql', '.sh', '.bash', '.zsh',
    '.vue', '.svelte', '.dart', '.swift', '.kt',
  ],
};

export class ArchiveService {
  private static instance: ArchiveService | null = null;
  private config: ArchiveServiceConfig;

  private constructor(config?: Partial<ArchiveServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<ArchiveServiceConfig>): ArchiveService {
    if (!ArchiveService.instance) {
      ArchiveService.instance = new ArchiveService(config);
    }
    return ArchiveService.instance;
  }

  static resetInstance(): void {
    ArchiveService.instance = null;
  }

  async extractFromFile(file: File): Promise<ExtractionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check file size
      if (file.size > this.config.maxTotalSize) {
        return {
          success: false,
          files: [],
          rootFolder: this.createEmptyFolder(''),
          totalFiles: 0,
          totalSize: 0,
          errors: [`File too large: ${this.formatSize(file.size)}. Max: ${this.formatSize(this.config.maxTotalSize)}`],
        };
      }

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Extract based on file type
      const fileName = file.name.toLowerCase();
      let result: ExtractionResult;

      if (fileName.endsWith('.zip')) {
        result = await this.extractZip(arrayBuffer);
      } else if (fileName.endsWith('.tar.gz') || fileName.endsWith('.tgz')) {
        result = await this.extractTarGz(arrayBuffer);
      } else if (fileName.endsWith('.tar')) {
        result = await this.extractTar(arrayBuffer);
      } else {
        // Try as single file
        result = await this.extractSingleFile(file.name, arrayBuffer);
      }

      // Filter excluded patterns
      result = this.filterExcludedFiles(result);
      result.warnings = warnings;

      return result;
    } catch (error) {
      return {
        success: false,
        files: [],
        rootFolder: this.createEmptyFolder(''),
        totalFiles: 0,
        totalSize: 0,
        errors: [error instanceof Error ? error.message : 'Unknown extraction error'],
      };
    }
  }

  async extractFromArrayBuffer(buffer: ArrayBuffer, fileName: string): Promise<ExtractionResult> {
    const mockFile = new File([buffer], fileName);
    return this.extractFromFile(mockFile);
  }

  private async extractZip(buffer: ArrayBuffer): Promise<ExtractionResult> {
    try {
      // Use JSZip or similar for browser-side extraction
      // For now, we'll use a simple implementation
      const files: ProjectFile[] = [];
      const rootFolder = this.createEmptyFolder('');

      // Check if JSZip is available
      if (typeof JSZip !== 'undefined') {
        const zip = await JSZip.loadAsync(buffer);

        for (const [path, zipEntry] of Object.entries(zip.files)) {
          if (zipEntry.dir) continue;

          const content = await zipEntry.async('string');
          const file = this.createProjectFile(path, content);
          files.push(file);
        }
      } else {
        // Fallback: use pako for inflate
        return this.extractZipWithPako(buffer, files, rootFolder);
      }

      this.buildFolderStructure(files, rootFolder);

      return {
        success: true,
        files,
        rootFolder,
        totalFiles: files.length,
        totalSize: files.reduce((sum, f) => sum + (f.content?.length || 0), 0),
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        rootFolder: this.createEmptyFolder(''),
        totalFiles: 0,
        totalSize: 0,
        errors: [`Failed to extract ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private async extractZipWithPako(
    buffer: ArrayBuffer,
    files: ProjectFile[],
    rootFolder: ProjectFolder
  ): Promise<ExtractionResult> {
    // Placeholder for pako-based extraction
    // In a real implementation, this would parse the ZIP format manually
    return {
      success: false,
      files,
      rootFolder,
      totalFiles: 0,
      totalSize: 0,
      errors: ['ZIP extraction requires JSZip library. Please include JSZip in your dependencies.'],
    };
  }

  private async extractTar(buffer: ArrayBuffer): Promise<ExtractionResult> {
    // Placeholder for TAR extraction
    return {
      success: false,
      files: [],
      rootFolder: this.createEmptyFolder(''),
      totalFiles: 0,
      totalSize: 0,
      errors: ['TAR extraction not yet implemented.'],
    };
  }

  private async extractTarGz(buffer: ArrayBuffer): Promise<ExtractionResult> {
    // Placeholder for TAR.GZ extraction
    return {
      success: false,
      files: [],
      rootFolder: this.createEmptyFolder(''),
      totalFiles: 0,
      totalSize: 0,
      errors: ['TAR.GZ extraction not yet implemented.'],
    };
  }

  private async extractSingleFile(fileName: string, buffer: ArrayBuffer): Promise<ExtractionResult> {
    try {
      const content = await this.arrayBufferToString(buffer);
      const file = this.createProjectFile(fileName, content);
      const rootFolder = this.createEmptyFolder('');

      return {
        success: true,
        files: [file],
        rootFolder,
        totalFiles: 1,
        totalSize: content.length,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        rootFolder: this.createEmptyFolder(''),
        totalFiles: 0,
        totalSize: 0,
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  private createProjectFile(path: string, content: string): ProjectFile {
    const segments = path.split('/');
    const name = segments[segments.length - 1];
    const ext = this.getExtension(name);

    return {
      id: this.generateId(),
      name,
      path,
      extension: ext,
      content,
      size: content.length,
      lines: content.split('\n').length,
    };
  }

  private createEmptyFolder(name: string): ProjectFolder {
    return {
      id: this.generateId(),
      name,
      path: name,
      files: [],
      subfolders: [],
      fileCount: 0,
      folderCount: 0,
    };
  }

  private buildFolderStructure(files: ProjectFile[], root: ProjectFolder): void {
    const folderMap = new Map<string, ProjectFolder>();

    for (const file of files) {
      const pathParts = file.path.split('/').filter(Boolean);
      let currentPath = '';
      let currentFolder = root;

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!folderMap.has(currentPath)) {
          const newFolder = this.createEmptyFolder(part);
          newFolder.path = currentPath;
          folderMap.set(currentPath, newFolder);
          currentFolder.subfolders.push(newFolder);
          root.folderCount++;
        }

        currentFolder = folderMap.get(currentPath)!;
      }

      currentFolder.files.push(file);
      root.fileCount++;
    }
  }

  private filterExcludedFiles(result: ExtractionResult): ExtractionResult {
    const filteredFiles: ProjectFile[] = [];
    const warnings: string[] = [];

    for (const file of result.files) {
      const shouldExclude = this.config.excludedPatterns.some((pattern) => {
        if (pattern.includes('**')) {
          const prefix = pattern.replace('/**', '');
          return file.path.startsWith(prefix);
        }
        const fileName = file.path.split('/').pop() || '';
        return fileName === pattern || file.path === pattern;
      });

      if (shouldExclude) {
        warnings.push(`Excluded: ${file.path}`);
        continue;
      }

      // Filter by extension
      if (this.config.includedExtensions.length > 0) {
        const ext = file.extension.toLowerCase();
        if (!this.config.includedExtensions.includes(ext) && ext !== '') {
          warnings.push(`Skipped (extension): ${file.path}`);
          continue;
        }
      }

      filteredFiles.push(file);
    }

    // Rebuild folder structure
    const rootFolder = this.createEmptyFolder('');
    this.buildFolderStructure(filteredFiles, rootFolder);

    return {
      ...result,
      files: filteredFiles,
      rootFolder,
      totalFiles: filteredFiles.length,
      warnings: [...result.warnings || [], ...warnings],
    };
  }

  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(lastDot) : '';
  }

  private async arrayBufferToString(buffer: ArrayBuffer): Promise<string> {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  updateConfig(config: Partial<ArchiveServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ArchiveServiceConfig {
    return { ...this.config };
  }
}

export default ArchiveService.getInstance();
