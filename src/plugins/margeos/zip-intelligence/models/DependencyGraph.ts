/**
 * Dependency Graph Model
 * Represents project dependencies and their relationships
 */

export interface DependencyGraph {
  id: string;
  projectId: string;
  createdAt: Date;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  rootPackages: string[];
  externalPackages: string[];
  statistics: DependencyStatistics;
  analysis: DependencyAnalysis;
}

export interface DependencyNode {
  id: string;
  name: string;
  version?: string;
  type: 'root' | 'direct' | 'transitive' | 'dev';
  category: DependencyCategory;
  path?: string;
  description?: string;
  licenses?: string[];
  repository?: string;
  homepage?: string;
  dependencies: string[];
  dependents: string[];
  metadata?: Record<string, unknown>;
}

export type DependencyCategory =
  | 'runtime'
  | 'dev'
  | 'peer'
  | 'optional'
  | 'bundled'
  | 'system';

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'depends-on' | 'dev-depends-on' | 'peer-depends-on' | 'optional-depends-on';
  versionConstraint?: string;
}

export interface DependencyStatistics {
  totalPackages: number;
  directDependencies: number;
  transitiveDependencies: number;
  devDependencies: number;
  outdatedPackages: number;
  vulnerablePackages: number;
  unusedPackages: number;
  largestDependency?: string;
  deepestNesting: number;
  circularDependencies: string[][];
}

export interface DependencyAnalysis {
  hasCircularDependencies: boolean;
  hasOutdatedDependencies: boolean;
  hasVulnerabilities: boolean;
  hasUnusedDependencies: boolean;
  healthScore: number; // 0-100
  recommendations: DependencyRecommendation[];
  issues: DependencyIssue[];
}

export interface DependencyRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  reason: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  package?: string;
  targetVersion?: string;
}

export interface DependencyIssue {
  id: string;
  severity: 'info' | 'warning' | 'error';
  type: 'outdated' | 'vulnerable' | 'unused' | 'circular' | 'missing' | 'conflict';
  title: string;
  description: string;
  package?: string;
  currentVersion?: string;
  latestVersion?: string;
  vulnerableVersions?: string;
  cve?: string;
  fixSuggestion?: string;
}

// Dependency graph utilities
export function createDependencyGraph(
  id: string,
  projectId: string,
  packages: DependencyNode[]
): DependencyGraph {
  const edges: DependencyEdge[] = [];
  const rootPackages: string[] = [];
  const externalPackages: string[] = [];

  for (const pkg of packages) {
    if (pkg.type === 'root' || pkg.type === 'direct') {
      rootPackages.push(pkg.name);
    } else {
      externalPackages.push(pkg.name);
    }

    for (const dep of pkg.dependencies) {
      edges.push({
        from: pkg.name,
        to: dep,
        type: pkg.type === 'dev' ? 'dev-depends-on' : 'depends-on',
      });
    }
  }

  const analysis = analyzeDependencies(packages, edges);
  const statistics = calculateStatistics(packages, edges, rootPackages, externalPackages);

  return {
    id,
    projectId,
    createdAt: new Date(),
    nodes: packages,
    edges,
    rootPackages,
    externalPackages,
    statistics,
    analysis,
  };
}

export function analyzeDependencies(
  packages: DependencyNode[],
  edges: DependencyEdge[]
): DependencyAnalysis {
  const issues: DependencyIssue[] = [];
  const recommendations: DependencyRecommendation[] = [];
  let healthScore = 100;

  // Detect circular dependencies
  const circular = detectCircularDependencies(packages, edges);
  if (circular.length > 0) {
    healthScore -= circular.length * 5;
    for (const cycle of circular) {
      issues.push({
        id: `circular-${cycle.join('-')}`,
        severity: 'warning',
        type: 'circular',
        title: 'Circular dependency detected',
        description: `Packages form a circular dependency: ${cycle.join(' -> ')}`,
        package: cycle[0],
      });
    }
    recommendations.push({
      id: 'fix-circular',
      priority: 'medium',
      title: 'Resolve circular dependencies',
      description: 'Circular dependencies make the codebase harder to maintain and can cause issues during builds.',
      reason: 'Circular dependencies create tight coupling and can lead to initialization order problems.',
      impact: 'Improved maintainability and build reliability',
      effort: 'medium',
    });
  }

  // Check for outdated packages (simulated)
  const outdated = packages.filter((p) => p.version?.includes('^') || p.version?.includes('~'));
  if (outdated.length > 0) {
    healthScore -= Math.min(outdated.length, 20);
    for (const pkg of outdated.slice(0, 5)) {
      issues.push({
        id: `outdated-${pkg.name}`,
        severity: 'info',
        type: 'outdated',
        title: 'Package may be outdated',
        description: `${pkg.name} is using a version range that may not include the latest version`,
        package: pkg.name,
      });
    }
  }

  return {
    hasCircularDependencies: circular.length > 0,
    hasOutdatedDependencies: outdated.length > 0,
    hasVulnerabilities: false,
    hasUnusedDependencies: false,
    healthScore: Math.max(healthScore, 0),
    recommendations,
    issues,
  };
}

export function detectCircularDependencies(
  packages: DependencyNode[],
  edges: DependencyEdge[]
): string[][] {
  const graph = new Map<string, string[]>();

  for (const pkg of packages) {
    graph.set(pkg.name, pkg.dependencies);
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path, neighbor]);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), neighbor]);
        }
      }
    }

    recursionStack.delete(node);
  }

  for (const pkg of packages) {
    if (!visited.has(pkg.name)) {
      dfs(pkg.name, [pkg.name]);
    }
  }

  return cycles;
}

export function calculateStatistics(
  packages: DependencyNode[],
  edges: DependencyEdge[],
  rootPackages: string[],
  externalPackages: string[]
): DependencyStatistics {
  const directDeps = packages.filter((p) => p.type === 'direct' || p.type === 'root');
  const transitiveDeps = packages.filter((p) => p.type === 'transitive');
  const devDeps = packages.filter((p) => p.type === 'dev');

  // Find deepest nesting
  let deepestNesting = 0;
  for (const pkg of packages) {
    const nesting = calculateNesting(pkg.name, edges, new Set());
    deepestNesting = Math.max(deepestNesting, nesting);
  }

  // Find largest dependency
  let largestDependency: string | undefined;
  let maxSize = 0;
  for (const pkg of packages) {
    const size = (pkg.metadata?.size as number) || 0;
    if (size > maxSize) {
      maxSize = size;
      largestDependency = pkg.name;
    }
  }

  return {
    totalPackages: packages.length,
    directDependencies: directDeps.length,
    transitiveDependencies: transitiveDeps.length,
    devDependencies: devDeps.length,
    outdatedPackages: 0,
    vulnerablePackages: 0,
    unusedPackages: 0,
    largestDependency,
    deepestNesting,
    circularDependencies: detectCircularDependencies(packages, edges),
  };
}

export function calculateNesting(
  packageName: string,
  edges: DependencyEdge[],
  visited: Set<string>,
  depth: number = 0
): number {
  if (visited.has(packageName)) return depth;

  visited.add(packageName);

  const dependencies = edges
    .filter((e) => e.from === packageName)
    .map((e) => e.to);

  if (dependencies.length === 0) return depth;

  let maxDepth = depth;
  for (const dep of dependencies) {
    maxDepth = Math.max(
      maxDepth,
      calculateNesting(dep, edges, new Set(visited), depth + 1)
    );
  }

  return maxDepth;
}

export function visualizeDependencies(graph: DependencyGraph): string {
  const lines: string[] = [];
  lines.push('```mermaid');
  lines.push('graph TD');
  lines.push('  subgraph Dependencies');
  lines.push('');

  for (const node of graph.nodes) {
    const label = node.version ? `${node.name}@${node.version}` : node.name;
    const shape = node.type === 'root' ? '([' : node.type === 'dev' ? '([' : '[';
    const closing = node.type === 'root' || node.type === 'dev' ? '])' : ']';
    lines.push(`    ${node.id}${shape}${label}${closing}`);
  }

  lines.push('  subgraph "Dependencies"');

  for (const edge of graph.edges) {
    lines.push(`    ${edge.from} --> ${edge.to}`);
  }

  lines.push('  end');
  lines.push('```');

  return lines.join('\n');
}

export default {
  createDependencyGraph,
  analyzeDependencies,
  detectCircularDependencies,
  calculateStatistics,
  calculateNesting,
  visualizeDependencies,
};
