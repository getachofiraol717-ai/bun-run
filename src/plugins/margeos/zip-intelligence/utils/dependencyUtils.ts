// @ts-nocheck
/**
 * Dependency Utilities
 * Helper functions for dependency graph analysis
 */

import { DependencyGraph, DependencyNode, DependencyEdge, DependencyType } from '../models/DependencyGraph';

export interface CircularDependency {
  nodes: string[];
  path: string;
  severity: 'critical' | 'warning';
}

/**
 * Find all circular dependencies in a graph
 */
export function findCircularDependencies(graph: DependencyGraph): CircularDependency[] {
  const cycles: CircularDependency[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  const adjacencyList = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (!adjacencyList.has(edge.from)) {
      adjacencyList.set(edge.from, []);
    }
    adjacencyList.get(edge.from)!.push(edge.to);
  }

  const dfs = (nodeId: string): void => {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        const cycleNodes = [...path.slice(cycleStart), neighbor];

        cycles.push({
          nodes: cycleNodes,
          path: cycleNodes.join(' → '),
          severity: cycleNodes.length <= 2 ? 'critical' : 'warning',
        });
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
  };

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  // Remove duplicate cycles
  const uniqueCycles = new Map<string, CircularDependency>();

  for (const cycle of cycles) {
    const key = cycle.nodes.slice().sort().join(',');
    if (!uniqueCycles.has(key)) {
      uniqueCycles.set(key, cycle);
    }
  }

  return Array.from(uniqueCycles.values());
}

/**
 * Calculate dependency depth for each node
 */
export function calculateDependencyDepth(graph: DependencyGraph): Map<string, number> {
  const depths = new Map<string, number>();

  // Find entry points (nodes with no dependencies)
  const entryPoints = graph.nodes.filter((n) => n.dependencies.length === 0);
  for (const entry of entryPoints) {
    depths.set(entry.id, 0);
  }

  // BFS to calculate depths
  const queue: Array<{ id: string; depth: number }> = entryPoints.map((n) => ({
    id: n.id,
    depth: 0,
  }));

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;

    const dependents = graph.edges.filter((e) => e.to === id);
    for (const dependent of dependents) {
      const currentDepth = depths.get(dependent.from) || 0;
      const newDepth = Math.max(currentDepth, depth + 1);

      if (!depths.has(dependent.from) || depths.get(dependent.from)! < newDepth) {
        depths.set(dependent.from, newDepth);
        queue.push({ id: dependent.from, depth: newDepth });
      }
    }
  }

  // Handle disconnected nodes
  for (const node of graph.nodes) {
    if (!depths.has(node.id)) {
      depths.set(node.id, 0);
    }
  }

  return depths;
}

/**
 * Calculate coupling metrics
 */
export function calculateCoupling(graph: DependencyGraph): {
  afferentCoupling: Map<string, number>;
  efferentCoupling: Map<string, number>;
  instability: Map<string, number>;
} {
  const afferentCoupling = new Map<string, number>();
  const efferentCoupling = new Map<string, number>();

  // Afferent (incoming) coupling
  for (const node of graph.nodes) {
    afferentCoupling.set(node.id, node.dependents.length);
  }

  // Efferent (outgoing) coupling
  for (const node of graph.nodes) {
    efferentCoupling.set(node.id, node.dependencies.length);
  }

  // Instability (efferent / (afferent + efferent))
  const instability = new Map<string, number>();
  for (const node of graph.nodes) {
    const a = afferentCoupling.get(node.id) || 0;
    const e = efferentCoupling.get(node.id) || 0;
    const total = a + e;

    instability.set(node.id, total > 0 ? e / total : 0);
  }

  return { afferentCoupling, efferentCoupling, instability };
}

/**
 * Find hub and authority scores
 */
export function calculateHubAuthority(graph: DependencyGraph): Map<string, { hub: number; authority: number }> {
  const scores = new Map<string, { hub: number; authority: number }>();

  // Initialize scores
  for (const node of graph.nodes) {
    scores.set(node.id, { hub: 1, authority: 1 });
  }

  // Simplified Kleinberg algorithm (2 iterations)
  for (let i = 0; i < 2; i++) {
    // Update authorities
    const newAuthorities = new Map<string, number>();
    for (const edge of graph.edges) {
      const fromScore = scores.get(edge.from);
      if (fromScore) {
        const current = newAuthorities.get(edge.to) || 0;
        newAuthorities.set(edge.to, current + fromScore.hub);
      }
    }

    // Update hubs
    const newHubs = new Map<string, number>();
    for (const edge of graph.edges) {
      const toScore = scores.get(edge.to);
      if (toScore) {
        const current = newHubs.get(edge.from) || 0;
        newHubs.set(edge.from, current + toScore.authority);
      }
    }

    // Normalize and update
    let maxAuth = 0;
    let maxHub = 0;

    for (const node of graph.nodes) {
      const auth = newAuthorities.get(node.id) || 0;
      const hub = newHubs.get(node.id) || 0;
      maxAuth = Math.max(maxAuth, auth);
      maxHub = Math.max(maxHub, hub);
    }

    for (const node of graph.nodes) {
      const auth = newAuthorities.get(node.id) || 0;
      const hub = newHubs.get(node.id) || 0;

      scores.set(node.id, {
        hub: maxHub > 0 ? hub / maxHub : 0,
        authority: maxAuth > 0 ? auth / maxAuth : 0,
      });
    }
  }

  return scores;
}

/**
 * Find most connected nodes
 */
export function findMostConnectedNodes(graph: DependencyGraph, limit: number = 10): DependencyNode[] {
  return [...graph.nodes]
    .sort((a, b) => {
      const aConnections = a.dependencies.length + a.dependents.length;
      const bConnections = b.dependencies.length + b.dependents.length;
      return bConnections - aConnections;
    })
    .slice(0, limit);
}

/**
 * Find leaf nodes (no dependents)
 */
export function findLeafNodes(graph: DependencyGraph): DependencyNode[] {
  return graph.nodes.filter((n) => n.dependents.length === 0);
}

/**
 * Find entry points (no dependencies)
 */
export function findEntryPoints(graph: DependencyGraph): DependencyNode[] {
  return graph.nodes.filter((n) => n.dependencies.length === 0);
}

/**
 * Calculate package metrics
 */
export function calculatePackageMetrics(graph: DependencyGraph): {
  instability: number;
  abstractness: number;
  distance: number;
} {
  const { instability } = calculateCoupling(graph);

  // Calculate average instability
  let totalInstability = 0;
  for (const node of graph.nodes) {
    totalInstability += instability.get(node.id) || 0;
  }
  const avgInstability = graph.nodes.length > 0
    ? totalInstability / graph.nodes.length
    : 0;

  // Abstractness (placeholder - would need actual abstract class detection)
  const abstractness = 0.5;

  // Distance from main sequence (D = |A + I - 1|)
  const distance = Math.abs(abstractness + avgInstability - 1);

  return {
    instability: avgInstability,
    abstractness,
    distance,
  };
}

/**
 * Generate ASCII graph visualization
 */
export function generateAsciiGraph(graph: DependencyGraph, maxNodes: number = 20): string {
  const lines: string[] = ['Dependency Graph:', ''];

  // Sort by dependencies
  const sortedNodes = [...graph.nodes]
    .sort((a, b) => b.dependencies.length - a.dependencies.length)
    .slice(0, maxNodes);

  for (const node of sortedNodes) {
    const deps = node.dependencies
      .slice(0, 5)
      .map((d) => {
        const depNode = graph.nodes.find((n) => n.id === d);
        return depNode?.name || d;
      })
      .join(', ');

    const dependents = node.dependents
      .slice(0, 3)
      .map((d) => {
        const depNode = graph.nodes.find((n) => n.id === d);
        return depNode?.name || d;
      })
      .join(', ');

    let line = `📦 ${node.name}`;
    if (deps) line += `\n   depends: ${deps}`;
    if (dependents) line += `\n   used by: ${dependents}`;

    lines.push(line, '');
  }

  if (graph.metadata.circularDependencies > 0) {
    lines.push(`⚠️  ${graph.metadata.circularDependencies} circular dependency(ies) detected`);
  }

  return lines.join('\n');
}

/**
 * Get dependency type label
 */
export function getDependencyTypeLabel(type: DependencyType): string {
  const labels: Record<DependencyType, string> = {
    internal: 'Internal Module',
    external: 'External Package',
    framework: 'Framework',
    dev: 'Development Dependency',
  };

  return labels[type] || type;
}

/**
 * Filter graph by dependency type
 */
export function filterGraphByType(
  graph: DependencyGraph,
  types: DependencyType[]
): DependencyGraph {
  const filteredEdges = graph.edges.filter((e) => types.includes(e.type));

  const connectedNodes = new Set<string>();
  filteredEdges.forEach((e) => {
    connectedNodes.add(e.from);
    connectedNodes.add(e.to);
  });

  const filteredNodes = graph.nodes.filter((n) => connectedNodes.has(n.id));

  return {
    ...graph,
    nodes: filteredNodes,
    edges: filteredEdges,
    metadata: {
      ...graph.metadata,
      totalEdges: filteredEdges.length,
      totalNodes: filteredNodes.length,
    },
  };
}

export default {
  findCircularDependencies,
  calculateDependencyDepth,
  calculateCoupling,
  calculateHubAuthority,
  findMostConnectedNodes,
  findLeafNodes,
  findEntryPoints,
  calculatePackageMetrics,
  generateAsciiGraph,
  getDependencyTypeLabel,
  filterGraphByType,
};
