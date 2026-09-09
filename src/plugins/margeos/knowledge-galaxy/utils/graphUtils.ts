// @ts-nocheck
// Knowledge Galaxy — Graph Utilities
// Utility functions for graph operations

import type { KnowledgeNode, KnowledgeEdge } from "../models";

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  density: number;
  averageDegree: number;
  connectedComponents: number;
}

export function calculateGraphMetrics(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): GraphMetrics {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  // Calculate density
  const maxEdges = nodeCount * (nodeCount - 1);
  const density = maxEdges > 0 ? edgeCount / maxEdges : 0;

  // Calculate average degree
  const degrees = new Map<string, number>();
  for (const node of nodes) {
    degrees.set(node.id, 0);
  }
  for (const edge of edges) {
    degrees.set(edge.sourceNodeId, (degrees.get(edge.sourceNodeId) || 0) + 1);
    degrees.set(edge.targetNodeId, (degrees.get(edge.targetNodeId) || 0) + 1);
  }
  const avgDegree = nodeCount > 0
    ? Array.from(degrees.values()).reduce((a, b) => a + b, 0) / nodeCount
    : 0;

  // Count connected components (simplified)
  const visited = new Set<string>();
  let connectedComponents = 0;

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      connectedComponents++;
      const queue = [node.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        for (const edge of edges) {
          if (edge.sourceNodeId === current && !visited.has(edge.targetNodeId)) {
            queue.push(edge.targetNodeId);
          }
          if (edge.targetNodeId === current && !visited.has(edge.sourceNodeId)) {
            queue.push(edge.sourceNodeId);
          }
        }
      }
    }
  }

  return {
    nodeCount,
    edgeCount,
    density: Math.round(density * 1000) / 1000,
    averageDegree: Math.round(avgDegree * 100) / 100,
    connectedComponents
  };
}

export function filterNodesBySubject(nodes: KnowledgeNode[], subject: string): KnowledgeNode[] {
  return nodes.filter(n => n.subject === subject);
}

export function filterNodesByType(nodes: KnowledgeNode[], type: string): KnowledgeNode[] {
  return nodes.filter(n => n.type === type);
}

export function filterNodesByMastery(nodes: KnowledgeNode[], minMastery: number, maxMastery: number = 100): KnowledgeNode[] {
  return nodes.filter(n => n.masteryScore >= minMastery && n.masteryScore <= maxMastery);
}

export function sortNodesByImportance(nodes: KnowledgeNode[]): KnowledgeNode[] {
  return [...nodes].sort((a, b) => b.importance - a.importance);
}

export function sortNodesByMastery(nodes: KnowledgeNode[]): KnowledgeNode[] {
  return [...nodes].sort((a, b) => a.masteryScore - b.masteryScore);
}

export function groupNodesBySubject(nodes: KnowledgeNode[]): Map<string, KnowledgeNode[]> {
  const groups = new Map<string, KnowledgeNode[]>();
  for (const node of nodes) {
    const existing = groups.get(node.subject) || [];
    existing.push(node);
    groups.set(node.subject, existing);
  }
  return groups;
}

export function getNodeDegree(nodeId: string, edges: KnowledgeEdge[]): number {
  return edges.filter(e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId).length;
}

export function getConnectedNodes(nodeId: string, edges: KnowledgeEdge[]): string[] {
  const connected: string[] = [];
  for (const edge of edges) {
    if (edge.sourceNodeId === nodeId) connected.push(edge.targetNodeId);
    if (edge.targetNodeId === nodeId) connected.push(edge.sourceNodeId);
  }
  return [...new Set(connected)];
}
