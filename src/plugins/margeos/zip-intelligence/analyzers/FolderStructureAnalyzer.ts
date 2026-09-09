/**
 * Folder Structure Analyzer
 * Analyzes and categorizes project folder structures
 */

import { Project, ProjectFolder, ProjectFile } from '../models/ProjectModel';

export interface StructureAnalysis {
  totalFiles: number;
  totalFolders: number;
  maxDepth: number;
  fileTypeDistribution: Record<string, number>;
  folderCategories: FolderCategory[];
  structureHealth: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export interface FolderCategory {
  name: string;
  type: 'source' | 'test' | 'config' | 'documentation' | 'build' | 'data' | 'other';
  fileCount: number;
  folderCount: number;
  purpose: string;
}

export class FolderStructureAnalyzer {
  private static instance: FolderStructureAnalyzer | null = null;

  private constructor() {}

  static getInstance(): FolderStructureAnalyzer {
    if (!FolderStructureAnalyzer.instance) {
      FolderStructureAnalyzer.instance = new FolderStructureAnalyzer();
    }
    return FolderStructureAnalyzer.instance;
  }

  analyze(project: Project): StructureAnalysis {
    const files = this.flattenFiles(project.rootFolder);
    const folders = this.flattenFolders(project.rootFolder);
    const maxDepth = this.calculateMaxDepth(project.rootFolder);
    const fileTypeDistribution = this.getFileTypeDistribution(files);
    const folderCategories = this.categorizeFolders(project.rootFolder);
    const structureHealth = this.evaluateStructureHealth(maxDepth, files, folders);
    const recommendations = this.generateRecommendations(structureHealth, maxDepth, folderCategories);

    return {
      totalFiles: files.length,
      totalFolders: folders.length,
      maxDepth,
      fileTypeDistribution,
      folderCategories,
      structureHealth,
      recommendations,
    };
  }

  private flattenFiles(folder: ProjectFolder): ProjectFile[] {
    const files: ProjectFile[] = [...folder.files];

    for (const subfolder of folder.subfolders) {
      files.push(...this.flattenFiles(subfolder));
    }

    return files;
  }

  private flattenFolders(folder: ProjectFolder, depth: number = 0): Array<{ folder: ProjectFolder; depth: number }> {
    const result: Array<{ folder: ProjectFolder; depth: number }> = [{ folder, depth }];

    for (const subfolder of folder.subfolders) {
      result.push(...this.flattenFolders(subfolder, depth + 1));
    }

    return result;
  }

  private calculateMaxDepth(folder: ProjectFolder, currentDepth: number = 0): number {
    let maxDepth = currentDepth;

    for (const subfolder of folder.subfolders) {
      const subfolderDepth = this.calculateMaxDepth(subfolder, currentDepth + 1);
      maxDepth = Math.max(maxDepth, subfolderDepth);
    }

    return maxDepth;
  }

  private getFileTypeDistribution(files: ProjectFile[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const file of files) {
      const ext = file.extension.toLowerCase() || 'no-extension';
      distribution[ext] = (distribution[ext] || 0) + 1;
    }

    return distribution;
  }

  private categorizeFolders(root: ProjectFolder): FolderCategory[] {
    const categories: FolderCategory[] = [];
    const folderData = this.flattenFolders(root);

    for (const { folder, depth } of folderData) {
      if (folder.name === root.name) continue;

      const category = this.determineFolderCategory(folder.name, depth);
      categories.push({
        name: folder.name,
        type: category.type,
        fileCount: folder.files.length,
        folderCount: folder.subfolders.length,
        purpose: category.purpose,
      });
    }

    return categories.sort((a, b) => b.fileCount - a.fileCount);
  }

  private determineFolderCategory(
    name: string,
    depth: number
  ): { type: FolderCategory['type']; purpose: string } {
    const lowerName = name.toLowerCase();

    // Source code folders
    if (['src', 'source', 'lib', 'app', 'code'].includes(lowerName)) {
      return { type: 'source', purpose: 'Main source code files' };
    }

    // Test folders
    if (['test', 'tests', 'spec', '__tests__', 'specs'].includes(lowerName)) {
      return { type: 'test', purpose: 'Test files and test utilities' };
    }

    // Configuration folders
    if (['config', 'configs', 'configuration', '.config'].includes(lowerName)) {
      return { type: 'config', purpose: 'Configuration files and settings' };
    }

    // Documentation folders
    if (['docs', 'documentation', 'doc', 'wiki'].includes(lowerName)) {
      return { type: 'documentation', purpose: 'Documentation and guides' };
    }

    // Build folders
    if (['build', 'dist', 'out', 'target', 'bin'].includes(lowerName)) {
      return { type: 'build', purpose: 'Build output and compiled files' };
    }

    // Data folders
    if (['data', 'assets', 'static', 'public', 'resources'].includes(lowerName)) {
      return { type: 'data', purpose: 'Static assets and data files' };
    }

    // Node modules and similar
    if (['node_modules', 'vendor', 'packages', 'dependencies'].includes(lowerName)) {
      return { type: 'other', purpose: 'External dependencies' };
    }

    // Hidden folders
    if (name.startsWith('.')) {
      return { type: 'config', purpose: 'Hidden configuration' };
    }

    // Deep nested folders
    if (depth > 2) {
      return { type: 'other', purpose: 'Nested folder structure' };
    }

    return { type: 'other', purpose: 'General purpose folder' };
  }

  private evaluateStructureHealth(
    maxDepth: number,
    files: ProjectFile[],
    folders: Array<{ folder: ProjectFolder; depth: number }>
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    // Excellent: depth <= 4, proper organization
    if (maxDepth <= 4 && folders.length > 5) {
      return 'excellent';
    }

    // Good: depth <= 6, reasonable organization
    if (maxDepth <= 6 && folders.length > 3) {
      return 'good';
    }

    // Fair: depth <= 8
    if (maxDepth <= 8) {
      return 'fair';
    }

    // Poor: deeply nested
    return 'poor';
  }

  private generateRecommendations(
    health: StructureAnalysis['structureHealth'],
    maxDepth: number,
    categories: FolderCategory[]
  ): string[] {
    const recommendations: string[] = [];

    if (maxDepth > 6) {
      recommendations.push(
        `Consider flattening the directory structure. Current max depth is ${maxDepth}, which exceeds the recommended 4-6 levels.`
      );
    }

    if (maxDepth > 4) {
      recommendations.push(
        'Deep nesting can make files harder to find. Consider grouping related functionality more efficiently.'
      );
    }

    const missingTypes = this.checkMissingStandardFolders(categories);

    if (missingTypes.length > 0) {
      recommendations.push(
        `Consider adding standard folders: ${missingTypes.join(', ')}.`
      );
    }

    const hasTestCategory = categories.some((c) => c.type === 'test');
    if (!hasTestCategory) {
      recommendations.push(
        'No dedicated test folder found. Consider adding tests/ or spec/ for better test organization.'
      );
    }

    if (categories.length < 3) {
      recommendations.push(
        'The project has a flat structure. Consider organizing code into logical groups (e.g., features/, components/, utils/).'
      );
    }

    return recommendations;
  }

  private checkMissingStandardFolders(categories: FolderCategory[]): string[] {
    const existingTypes = new Set(categories.map((c) => c.type));
    const missing: string[] = [];

    // For source code projects
    if (categories.length > 0 && !existingTypes.has('source')) {
      missing.push('src/');
    }

    return missing;
  }

  describeStructure(folder: ProjectFolder, maxDepth: number = 3, currentDepth: number = 0): string {
    if (currentDepth >= maxDepth) {
      return '';
    }

    const indent = '  '.repeat(currentDepth);
    let result = `${indent}📁 ${folder.name}/\n`;

    // Show top-level files
    const topFiles = folder.files.slice(0, 5);
    for (const file of topFiles) {
      result += `${indent}  📄 ${file.name}\n`;
    }

    if (folder.files.length > 5) {
      result += `${indent}  ... and ${folder.files.length - 5} more files\n`;
    }

    // Show subfolders
    for (const subfolder of folder.subfolders.slice(0, 5)) {
      result += this.describeStructure(subfolder, maxDepth, currentDepth + 1);
    }

    if (folder.subfolders.length > 5) {
      result += `${indent}  ... and ${folder.subfolders.length - 5} more folders\n`;
    }

    return result;
  }

  getNavigationPath(folder: ProjectFolder, targetName: string): string[] | null {
    if (folder.name === targetName) {
      return [folder.name];
    }

    for (const subfolder of folder.subfolders) {
      const path = this.getNavigationPath(subfolder, targetName);
      if (path) {
        return [folder.name, ...path];
      }
    }

    return null;
  }
}

export default FolderStructureAnalyzer.getInstance();
