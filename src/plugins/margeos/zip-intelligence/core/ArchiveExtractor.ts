/**
 * Archive Extractor
 * Extracts ZIP archives and handles various archive formats using JSZip
 */

import JSZip from 'jszip';
import { ProjectFile } from '../models/ProjectModel';

export interface ExtractionResult {
  success: boolean;
  files: ProjectFile[];
  totalSize: number;
  fileCount: number;
  errors: string[];
  warnings: string[];
}

export interface ExtractionOptions {
  maxFiles?: number;
  maxSize?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
  extractMetadata?: boolean;
}

const DEFAULT_OPTIONS: Required<ExtractionOptions> = {
  maxFiles: 10000,
  maxSize: 100 * 1024 * 1024, // 100MB
  excludePatterns: [
    'node_modules',
    '.git',
    '__pycache__',
    'dist',
    'build',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
  ],
  includePatterns: [],
  extractMetadata: true,
};

export class ArchiveExtractor {
  private static instance: ArchiveExtractor | null = null;
  private options: Required<ExtractionOptions>;

  private constructor() {
    this.options = DEFAULT_OPTIONS;
  }

  static getInstance(): ArchiveExtractor {
    if (!ArchiveExtractor.instance) {
      ArchiveExtractor.instance = new ArchiveExtractor();
    }
    return ArchiveExtractor.instance;
  }

  setOptions(options: Partial<ExtractionOptions>): void {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async extract(
    data: ArrayBuffer,
    options?: Partial<ExtractionOptions>
  ): Promise<ExtractionResult> {
    const opts = { ...this.options, ...options };
    const result: ExtractionResult = {
      success: false,
      files: [],
      totalSize: 0,
      fileCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      if (data.byteLength > opts.maxSize) {
        result.errors.push(`Archive exceeds maximum size of ${opts.maxSize} bytes`);
        return result;
      }

      const zip = await JSZip.loadAsync(data);
      const extractedFiles: ProjectFile[] = [];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        // Zip Slip and Path Traversal Protection
        if (relativePath.includes('..') || relativePath.includes('\0') || /^[a-zA-Z]:/.test(relativePath)) {
          result.warnings.push(`Blocked Zip Slip path traversal entry: ${relativePath}`);
          continue;
        }

        if (this.shouldExclude(relativePath, opts.excludePatterns)) {
          continue;
        }

        if (extractedFiles.length >= opts.maxFiles) {
          result.warnings.push(`Exceeded maximum file limit of ${opts.maxFiles}`);
          break;
        }

        const isDir = zipEntry.dir;
        let content = '';
        if (!isDir) {
          try {
            content = await zipEntry.async('text');
          } catch {
            content = '[Binary file]';
          }
        }

        const normalizedPath = '/' + relativePath.replace(/\\/g, '/').replace(/^\//, '');
        const fileName = normalizedPath.split('/').pop() || relativePath;
        const extension = this.getExtension(fileName);

        extractedFiles.push({
          id: `file-${Math.random().toString(36).slice(2, 9)}`,
          name: fileName,
          path: normalizedPath,
          extension: extension,
          size: (zipEntry as any)._data?.uncompressedSize || content.length,
          type: isDir ? 'directory' : 'file',
          content: content,
          lastModified: zipEntry.date || new Date(),
        });
      }

      result.files = extractedFiles;
      result.totalSize = extractedFiles.reduce((sum, f) => sum + f.size, 0);
      result.fileCount = extractedFiles.length;
      result.success = extractedFiles.length > 0;

      if (result.fileCount > 5000) {
        result.warnings.push('Large number of files detected - analysis may take longer');
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown extraction error');
    }

    return result;
  }

  private shouldExclude(path: string, patterns: string[]): boolean {
    const normalizedPath = path.toLowerCase().replace(/\\/g, '/');

    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
        if (regex.test(normalizedPath)) return true;
      } else {
        if (normalizedPath.includes(pattern.toLowerCase())) return true;
      }
    }

    return false;
  }

  private getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filename.length - 1) return '';
    return filename.slice(lastDot);
  }

  async extractFromBase64(base64Data: string, options?: Partial<ExtractionOptions>): Promise<ExtractionResult> {
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return this.extract(bytes.buffer, options);
    } catch (error) {
      return {
        success: false,
        files: [],
        totalSize: 0,
        fileCount: 0,
        errors: [error instanceof Error ? error.message : 'Invalid base64 data'],
        warnings: [],
      };
    }
  }

  async extractFromFile(file: File, options?: Partial<ExtractionOptions>): Promise<ExtractionResult> {
    const buffer = await file.arrayBuffer();
    return this.extract(buffer, options);
  }

  getSupportedFormats(): string[] {
    return ['zip', 'ZIP'];
  }

  validateArchive(data: ArrayBuffer): boolean {
    const bytes = new Uint8Array(data);
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  }

  getArchiveInfo(data: ArrayBuffer): { fileCount: number; totalSize: number } {
    const size = data.byteLength;
    const estimatedFiles = Math.floor(size / 500);
    return {
      fileCount: Math.min(estimatedFiles, 10000),
      totalSize: Math.floor(size * 3),
    };
  }
}

export default ArchiveExtractor.getInstance();
