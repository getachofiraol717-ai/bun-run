// @ts-nocheck
/**
 * Dependency Graph Analyzer
 * Analyzes and visualizes project dependencies
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import { DependencyGraph, DependencyNode, DependencyEdge, DependencyType } from '../models/DependencyGraph';

export interface DependencyAnalysisResult {
  graph: DependencyGraph;
  circularDependencies: string[][];
  healthScore: number;
  issues: DependencyIssue[];
  recommendations: string[];
}

export interface DependencyIssue {
  type: 'missing' | 'circular' | 'unused' | 'version-mismatch' | 'deprecated';
  severity: 'error' | 'warning' | 'info';
  message: string;
  affected: string[];
}

export class DependencyGraphAnalyzer {
  private static instance: DependencyGraphAnalyzer | null = null;

  private constructor() {}

  static getInstance(): DependencyGraphAnalyzer {
    if (!DependencyGraphAnalyzer.instance) {
      DependencyGraphAnalyzer.instance = new DependencyGraphAnalyzer();
    }
    return DependencyGraphAnalyzer.instance;
  }

  analyze(project: Project): DependencyAnalysisResult {
    const files = this.flattenFiles(project.rootFolder);
    const nodes = this.buildNodes(files);
    const edges = this.buildEdges(files, nodes);
    const circularDeps = this.detectCircularDependencies(edges);
    const issues = this.findIssues(nodes, edges, circularDeps, project);
    const healthScore = this.calculateHealthScore(nodes, edges, circularDeps, issues);
    const recommendations = this.generateRecommendations(healthScore, issues, circularDeps);

    const graph: DependencyGraph = {
      id: `dep-graph-${project.id}`,
      projectId: project.id,
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        maxDepth: this.calculateMaxDepth(edges, nodes),
        circularDependencies: circularDeps.length,
        analysisDate: new Date(),
      },
    };

    return {
      graph,
      circularDependencies: circularDeps,
      healthScore,
      issues,
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

  private buildNodes(files: ProjectFile[]): DependencyNode[] {
    const nodes: DependencyNode[] = [];
    const nodeMap = new Map<string, DependencyNode>();

    for (const file of files) {
      if (!this.isCodeFile(file.extension)) continue;

      const node: DependencyNode = {
        id: this.normalizePath(file.path),
        name: file.name,
        path: file.path,
        type: this.getNodeType(file),
        dependencies: [],
        dependents: [],
        linesOfCode: file.content?.split('\n').length || 0,
        complexity: this.calculateComplexity(file),
      };

      nodes.push(node);
      nodeMap.set(node.id, node);
    }

    return nodes;
  }

  private isCodeFile(ext: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.go', '.rs'];
    return codeExtensions.includes(ext.toLowerCase());
  }

  private getNodeType(file: ProjectFile): DependencyNode['type'] {
    const name = file.name.toLowerCase();

    if (name.includes('test') || name.includes('spec')) return 'test';
    if (name.includes('index') || name === 'main' || name === 'app') return 'entry';
    if (name.includes('config')) return 'config';
    if (name.includes('util') || name.includes('helper')) return 'utility';
    if (name.includes('component') || name.includes('.vue') || name.includes('.jsx')) return 'component';
    if (name.includes('service')) return 'service';
    if (name.includes('model') || name.includes('schema')) return 'model';

    return 'module';
  }

  private calculateComplexity(file: ProjectFile): 'low' | 'medium' | 'high' {
    if (!file.content) return 'low';

    const lines = file.content.split('\n').length;
    const functions = (file.content.match(/function\s+\w+|def\s+\w+|fn\s+\w+/g) || []).length;
    const classes = (file.content.match(/class\s+\w+|interface\s+\w+/g) || []).length;

    const score = lines / 100 + functions * 0.5 + classes * 2;

    if (score < 5) return 'low';
    if (score < 15) return 'medium';
    return 'high';
  }

  private buildEdges(files: ProjectFile[], nodes: DependencyNode[]): DependencyEdge[] {
    const edges: DependencyEdge[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const file of files) {
      if (!file.content) continue;

      const fromId = this.normalizePath(file.path);
      const fromNode = nodeMap.get(fromId);
      if (!fromNode) continue;

      // JavaScript/TypeScript imports
      const importMatches = file.content.matchAll(
        /(?:import|require)\s*(?:{|[^}]*\s+from\s+|)\s*['"]([@\w\-./]+)['"]/g
      );

      for (const match of importMatches) {
        const rawPath = match[1];
        const toPath = this.resolveImportPath(rawPath, file.path);

        if (toPath) {
          const toNode = nodeMap.get(toPath);
          if (toNode && toNode.id !== fromId) {
            const edge: DependencyEdge = {
              from: fromId,
              to: toNode.id,
              type: this.classifyDependency(rawPath, toPath),
              weight: 1,
            };

            if (!edges.some((e) => e.from === edge.from && e.to === edge.to)) {
              edges.push(edge);
              fromNode.dependencies.push(toNode.id);
              toNode.dependents.push(fromId);
            }
          }
        }
      }

      // Python imports
      const pythonMatches = file.content.matchAll(
        /(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/g
      );

      for (const match of pythonMatches) {
        const moduleName = match[1] || match[2];
        if (moduleName && !moduleName.startsWith('_')) {
          // External modules would have node entries
          const toPath = this.normalizePath(moduleName.replace(/\./g, '/') + '.py');
          const toNode = nodes.find((n) => n.name === toPath || n.name.includes(moduleName.split('.')[0]));

          if (toNode && toNode.id !== fromId) {
            const edge: DependencyEdge = {
              from: fromId,
              to: toNode.id,
              type: 'internal',
              weight: 1,
            };

            if (!edges.some((e) => e.from === edge.from && e.to === edge.to)) {
              edges.push(edge);
              fromNode.dependencies.push(toNode.id);
              toNode.dependents.push(fromId);
            }
          }
        }
      }
    }

    return edges;
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/\.(ts|tsx|js|jsx)$/, '')
      .toLowerCase();
  }

  private resolveImportPath(importPath: string, fromFile: string): string | null {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const baseDir = fromFile.substring(0, fromFile.lastIndexOf('/'));
      const resolved = this.resolveRelativePath(baseDir, importPath);
      return resolved;
    }

    // Handle absolute/package imports - find matching file
    return importPath
      .replace(/^@/, '')
      .replace(/\//g, '-')
      .toLowerCase();
  }

  private resolveRelativePath(baseDir: string, relativePath: string): string {
    const parts = baseDir.split('/').filter(Boolean);
    const relParts = relativePath.split('/');

    for (const part of relParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.') {
        parts.push(part);
      }
    }

    return parts.join('/');
  }

  private classifyDependency(rawPath: string, resolvedPath: string): DependencyType {
    if (rawPath.startsWith('.')) {
      return 'internal';
    }

    if (rawPath.startsWith('@/') || rawPath.startsWith('~/')) {
      return 'internal';
    }

    // Framework and library imports
    const frameworkPatterns = [
      'react', 'vue', 'angular', '@angular',
      'express', 'fastapi', 'django', 'flask',
      'lodash', 'axios', 'moment',
      '@nestjs', '@mui', 'antd',
    ];

    if (frameworkPatterns.some((p) => rawPath.includes(p))) {
      return 'framework';
    }

    return 'external';
  }

  private detectCircularDependencies(edges: DependencyEdge[]): string[][] {
    const cycles: string[][] = [];
    const graph = new Map<string, string[]>();

    // Build adjacency list
    for (const edge of edges) {
      if (!graph.has(edge.from)) {
        graph.set(edge.from, []);
      }
      graph.get(edge.from)!.push(edge.to);
    }

    // DFS to find cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Found cycle
          const cycleStart = path.indexOf(neighbor);
          const cycle = [...path.slice(cycleStart), neighbor];
          cycles.push(cycle);
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    // Remove duplicate cycles
    return cycles.map((c) => [...new Set(c)]).filter((c, i, arr) =>
      arr.findIndex((x) => x.length === c.length && x.every((v, j) => v === c[j])) === i
    );
  }

  private findIssues(
    nodes: DependencyNode[],
    edges: DependencyEdge[],
    circularDeps: string[][],
    project: Project
  ): DependencyIssue[] {
    const issues: DependencyIssue[] = [];

    // Check for circular dependencies
    for (const cycle of circularDeps) {
      issues.push({
        type: 'circular',
        severity: 'error',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        affected: cycle,
      });
    }

    // Check for unused modules
    for (const node of nodes) {
      if (node.type !== 'entry' && node.dependents.length === 0 && node.type !== 'config') {
        issues.push({
          type: 'unused',
          severity: 'warning',
          message: `Module ${node.name} appears to be unused`,
          affected: [node.id],
        });
      }
    }

    // Check for entry points with no dependencies (incomplete modules)
    for (const node of nodes) {
      if (node.type === 'entry' && node.dependencies.length === 0) {
        issues.push({
          type: 'missing',
          severity: 'warning',
          message: `Entry point ${node.name} has no dependencies`,
          affected: [node.id],
        });
      }
    }

    return issues;
  }

  private calculateHealthScore(
    nodes: DependencyNode[],
    edges: DependencyEdge[],
    circularDeps: string[][],
    issues: DependencyIssue[]
  ): number {
    let score = 100;

    // Penalize circular dependencies heavily
    score -= circularDeps.length * 15;

    // Penalize issues
    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    }

    // Penalize high complexity nodes
    const highComplexityCount = nodes.filter((n) => n.complexity === 'high').length;
    score -= Math.min(highComplexityCount * 2, 20);

    // Bonus for well-structured dependencies
    if (nodes.length > 0 && edges.length / nodes.length > 2) {
      score -= 5; // Too many connections
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateMaxDepth(edges: DependencyEdge[], nodes: DependencyNode[]): number {
    if (nodes.length === 0) return 0;

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    let maxDepth = 0;

    const dfs = (nodeId: string, depth: number): void => {
      visited.add(nodeId);
      maxDepth = Math.max(maxDepth, depth);

      const outgoing = edges.filter((e) => e.from === nodeId);
      for (const edge of outgoing) {
        if (!visited.has(edge.to)) {
          dfs(edge.to, depth + 1);
        }
      }

      visited.delete(nodeId);
    };

    // Start from entry points
    const entryNodes = nodes.filter((n) => n.type === 'entry');
    if (entryNodes.length === 0) {
      dfs(nodes[0].id, 1);
    } else {
      for (const entry of entryNodes) {
        dfs(entry.id, 1);
      }
    }

    return maxDepth;
  }

  private generateRecommendations(
    healthScore: number,
    issues: DependencyIssue[],
    circularDeps: string[][]
  ): string[] {
    const recommendations: string[] = [];

    if (healthScore < 50) {
      recommendations.push(
        'The dependency graph has significant issues. Consider refactoring to improve modularity.'
      );
    }

    if (circularDeps.length > 0) {
      recommendations.push(
        'Break circular dependencies by extracting shared functionality into separate modules.'
      );
    }

    const unusedCount = issues.filter((i) => i.type === 'unused').length;
    if (unusedCount > 5) {
      recommendations.push(
        `${unusedCount} unused modules detected. Remove or consolidate them to reduce complexity.`
      );
    }

    const highComplexityNodes = issues.length > 0 ? 0 : 0; // Simplified
    if (recommendations.length === 0) {
      recommendations.push(
        'The dependency structure looks good. Continue maintaining clean architecture principles.'
      );
    }

    return recommendations;
  }

  visualizeAsText(graph: DependencyGraph, maxNodes: number = 20): string {
    const lines: string[] = [];
    lines.push('Dependency Graph:\n');

    const sortedNodes = [...graph.nodes].sort(
      (a, b) => b.dependents.length - a.dependents.length
    );

    for (const node of sortedNodes.slice(0, maxNodes)) {
      const indent = '  ';
      lines.push(`${indent}📦 ${node.name} (${node.type})`);
      lines.push(`${indent}   Dependencies: ${node.dependencies.length}`);
      lines.push(`${indent}   Dependents: ${node.dependents.length}`);

      if (node.dependencies.length > 0) {
        lines.push(`${indent}   → uses: ${node.dependencies.slice(0, 5).join(', ')}${node.dependencies.length > 5 ? '...' : ''}`);
      }
    }

    if (graph.metadata.circularDependencies > 0) {
      lines.push(`\n⚠️  Circular Dependencies: ${graph.metadata.circularDependencies}`);
    }

    return lines.join('\n');
  }
}

export default DependencyGraphAnalyzer.getInstance();
