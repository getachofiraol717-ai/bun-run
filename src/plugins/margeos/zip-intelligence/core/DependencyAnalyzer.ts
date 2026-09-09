/**
 * Dependency Analyzer
 * Analyzes project dependencies and their relationships
 */

import { Project, ProjectFile, ProjectFolder } from '../models/ProjectModel';
import { DependencyGraph, DependencyNode, DependencyEdge, DependencyStatistics } from '../models/DependencyGraph';

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  description?: string;
  repository?: string;
  licenses?: string[];
}

export class DependencyAnalyzer {
  private static instance: DependencyAnalyzer | null = null;

  private constructor() {}

  static getInstance(): DependencyAnalyzer {
    if (!DependencyAnalyzer.instance) {
      DependencyAnalyzer.instance = new DependencyAnalyzer();
    }
    return DependencyAnalyzer.instance;
  }

  analyze(project: Project): DependencyGraph {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    const packageJsonFiles = this.findPackageJsonFiles(project.rootFolder);

    // Add root package
    nodes.push({
      id: 'root',
      name: project.name,
      type: 'root',
      category: 'runtime',
      description: 'Project root',
      dependencies: [],
      dependents: [],
    });

    // Analyze each package.json
    for (const pkgFile of packageJsonFiles) {
      try {
        if (pkgFile.content) {
          const pkg = JSON.parse(pkgFile.content);
          const dirPath = pkgFile.path.replace('/package.json', '').split('/').pop() || 'root';

          // Process dependencies
          if (pkg.dependencies) {
            for (const [name, version] of Object.entries(pkg.dependencies)) {
              this.addDependencyNode(nodes, name, version as string, 'direct');
              edges.push({
                from: dirPath,
                to: name,
                type: 'depends-on',
                versionConstraint: version as string,
              });
            }
          }

          // Process dev dependencies
          if (pkg.devDependencies) {
            for (const [name, version] of Object.entries(pkg.devDependencies)) {
              this.addDependencyNode(nodes, name, version as string, 'dev');
              edges.push({
                from: dirPath,
                to: name,
                type: 'dev-depends-on',
                versionConstraint: version as string,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Failed to parse ${pkgFile.path}:`, error);
      }
    }

    // Calculate statistics
    const stats = this.calculateStatistics(nodes, edges);

    // Detect issues
    const issues = this.detectIssues(nodes, edges);

    return {
      id: `dep-graph-${project.id}`,
      projectId: project.id,
      createdAt: new Date(),
      nodes,
      edges,
      rootPackages: nodes.filter((n) => n.type === 'direct').map((n) => n.name),
      externalPackages: nodes.filter((n) => n.type === 'transitive').map((n) => n.name),
      statistics: stats,
      analysis: {
        hasCircularDependencies: this.detectCircularDependencies(nodes, edges).length > 0,
        hasOutdatedDependencies: false,
        hasVulnerabilities: false,
        hasUnusedDependencies: false,
        healthScore: this.calculateHealthScore(stats, issues),
        recommendations: this.generateRecommendations(issues),
        issues,
      },
    };
  }

  private addDependencyNode(nodes: DependencyNode[], name: string, version: string, type: 'direct' | 'dev' | 'transitive'): void {
    if (!nodes.find((n) => n.name === name)) {
      nodes.push({
        id: this.sanitizeId(name),
        name,
        version,
        type: type === 'direct' ? 'direct' : type === 'dev' ? 'dev' : 'transitive',
        category: 'runtime',
        description: this.getPackageDescription(name),
        dependencies: [],
        dependents: [],
      });
    }
  }

  private sanitizeId(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private getPackageDescription(name: string): string {
    // Common package descriptions
    const descriptions: Record<string, string> = {
      react: 'JavaScript library for building user interfaces',
      vue: 'Progressive JavaScript framework for building UIs',
      angular: 'Platform for building mobile and desktop web applications',
      express: 'Fast, unopinionated web framework',
      lodash: 'Utility library for JavaScript',
      axios: 'Promise-based HTTP client',
      redux: 'State management library',
      next: 'React framework for production',
      typescript: 'TypeScript compiler and language',
      jest: 'JavaScript testing framework',
    };

    return descriptions[name] || 'NPM package';
  }

  private findPackageJsonFiles(folder: ProjectFolder): ProjectFile[] {
    const results: ProjectFile[] = [];

    const search = (f: ProjectFolder) => {
      for (const file of f.files) {
        if (file.name === 'package.json') {
          results.push(file);
        }
      }
      for (const subfolder of f.subfolders) {
        search(subfolder);
      }
    };

    search(folder);
    return results;
  }

  private calculateStatistics(nodes: DependencyNode[], edges: DependencyEdge[]): DependencyStatistics {
    const directDeps = nodes.filter((n) => n.type === 'direct').length;
    const transitiveDeps = nodes.filter((n) => n.type === 'transitive').length;
    const devDeps = nodes.filter((n) => n.type === 'dev').length;

    return {
      totalPackages: nodes.length,
      directDependencies: directDeps,
      transitiveDependencies: transitiveDeps,
      devDependencies: devDeps,
      outdatedPackages: 0,
      vulnerablePackages: 0,
      unusedPackages: 0,
      deepestNesting: this.calculateDepth(nodes, edges),
      circularDependencies: this.detectCircularDependencies(nodes, edges),
    };
  }

  private calculateDepth(nodes: DependencyNode[], edges: DependencyEdge[]): number {
    const graph = new Map<string, string[]>();
    for (const node of nodes) {
      graph.set(node.name, []);
    }
    for (const edge of edges) {
      const deps = graph.get(edge.from) || [];
      deps.push(edge.to);
      graph.set(edge.from, deps);
    }

    let maxDepth = 0;
    const visited = new Set<string>();

    const dfs = (node: string, depth: number): void => {
      visited.add(node);
      maxDepth = Math.max(maxDepth, depth);
      const deps = graph.get(node) || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dfs(dep, depth + 1);
        }
      }
    };

    for (const node of nodes) {
      if (node.type === 'root') {
        dfs(node.name, 0);
      }
    }

    return maxDepth;
  }

  private detectCircularDependencies(nodes: DependencyNode[], edges: DependencyEdge[]): string[][] {
    const graph = new Map<string, string[]>();
    for (const node of nodes) {
      graph.set(node.name, []);
    }
    for (const edge of edges) {
      const deps = graph.get(edge.from) || [];
      deps.push(edge.to);
      graph.set(edge.from, deps);
    }

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const deps = graph.get(node) || [];
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dfs(dep);
        } else if (recursionStack.has(dep)) {
          const cycleStart = path.indexOf(dep);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), dep]);
          }
        }
      }

      path.pop();
      recursionStack.delete(node);
    };

    for (const node of nodes) {
      if (!visited.has(node.name)) {
        dfs(node.name);
      }
    }

    return cycles;
  }

  private detectIssues(nodes: DependencyNode[], edges: DependencyEdge[]): DependencyGraph['analysis']['issues'] {
    const issues: DependencyGraph['analysis']['issues'] = [];

    // Detect large dependencies
    const largeDeps = ['lodash', 'moment', 'ramda', 'underscore'];
    for (const node of nodes) {
      if (largeDeps.includes(node.name)) {
        issues.push({
          id: `large-${node.name}`,
          severity: 'info',
          type: 'outdated',
          title: 'Consider a smaller alternative',
          description: `${node.name} is a large library. Consider using more modular alternatives or selective imports.`,
          package: node.name,
        });
      }
    }

    // Detect potential security issues (simplified)
    const suspiciousPackages = ['evil-package', 'malicious-lib'];
    for (const node of nodes) {
      if (suspiciousPackages.includes(node.name)) {
        issues.push({
          id: `suspicious-${node.name}`,
          severity: 'error',
          type: 'vulnerable',
          title: 'Suspicious package detected',
          description: `${node.name} has been flagged as potentially unsafe.`,
          package: node.name,
        });
      }
    }

    return issues;
  }

  private calculateHealthScore(stats: DependencyStatistics, issues: DependencyGraph['analysis']['issues']): number {
    let score = 100;

    // Penalize circular dependencies
    score -= stats.circularDependencies.length * 10;

    // Penalize issues
    for (const issue of issues) {
      if (issue.severity === 'error') score -= 15;
      else if (issue.severity === 'warning') score -= 5;
      else score -= 1;
    }

    // Penalize deep nesting
    if (stats.deepestNesting > 5) {
      score -= (stats.deepestNesting - 5) * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(issues: DependencyGraph['analysis']['issues']): DependencyGraph['analysis']['recommendations'] {
    const recommendations: DependencyGraph['analysis']['recommendations'] = [];

    for (const issue of issues) {
      if (issue.type === 'outdated') {
        recommendations.push({
          id: `rec-${issue.id}`,
          priority: 'medium',
          title: 'Update dependencies',
          description: issue.description || 'Keep dependencies up to date for security and performance.',
          reason: 'Updated dependencies receive bug fixes and security patches.',
          impact: 'Improved security and access to new features',
          effort: 'low',
          package: issue.package,
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec-good',
        priority: 'low',
        title: 'Dependencies look healthy',
        description: 'No major issues detected with your dependencies.',
        reason: 'Regular maintenance helps prevent issues.',
        impact: 'Continue current practices',
        effort: 'low',
      });
    }

    return recommendations;
  }

  generateDependencyTree(dependencyGraph: DependencyGraph): string {
    let output = `# ${dependencyGraph.projectId} Dependencies\n\n`;

    // Group by type
    const root = dependencyGraph.nodes.filter((n) => n.type === 'root');
    const direct = dependencyGraph.nodes.filter((n) => n.type === 'direct');
    const dev = dependencyGraph.nodes.filter((n) => n.type === 'dev');
    const transitive = dependencyGraph.nodes.filter((n) => n.type === 'transitive');

    if (root.length > 0) {
      output += '## Root\n\n';
      for (const node of root) {
        output += `- **${node.name}**\n`;
      }
      output += '\n';
    }

    if (direct.length > 0) {
      output += '## Dependencies\n\n';
      for (const node of direct) {
        output += `- ${node.name}@${node.version || 'latest'}\n`;
      }
      output += '\n';
    }

    if (dev.length > 0) {
      output += '## Dev Dependencies\n\n';
      for (const node of dev) {
        output += `- ${node.name}@${node.version || 'latest'}\n`;
      }
      output += '\n';
    }

    return output;
  }
}

export default DependencyAnalyzer.getInstance();
