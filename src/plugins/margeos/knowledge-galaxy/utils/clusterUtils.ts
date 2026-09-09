// Knowledge Galaxy — Cluster Utilities
// Utility functions for working with galaxy clusters

import type { GalaxyCluster } from "../models/GalaxyCluster";

export function getClusterColor(cluster: GalaxyCluster): string {
  return cluster.color;
}

export function getClusterProgress(cluster: GalaxyCluster): number {
  if (cluster.totalNodes === 0) return 0;
  return Math.round((cluster.masteredNodes / cluster.totalNodes) * 100);
}

export function getClusterProgressColor(cluster: GalaxyCluster): string {
  const progress = getClusterProgress(cluster);
  if (progress >= 80) return "#10B981";
  if (progress >= 50) return "#3B82F6";
  if (progress >= 20) return "#F59E0B";
  return "#6B7280";
}

export function getClusterStatusLabel(cluster: GalaxyCluster): string {
  const progress = getClusterProgress(cluster);
  if (progress >= 100) return "Completed";
  if (progress > 0) return "In Progress";
  return "Not Started";
}

export function isClusterComplete(cluster: GalaxyCluster): boolean {
  return cluster.totalNodes > 0 && cluster.masteredNodes === cluster.totalNodes;
}

export function isClusterActive(cluster: GalaxyCluster): boolean {
  return cluster.status === "active" && cluster.totalNodes > 0;
}

export function filterClustersByStatus(clusters: GalaxyCluster[], status: GalaxyCluster["status"]): GalaxyCluster[] {
  return clusters.filter(c => c.status === status);
}

export function sortClustersByProgress(clusters: GalaxyCluster[]): GalaxyCluster[] {
  return [...clusters].sort((a, b) => getClusterProgress(b) - getClusterProgress(a));
}

export function sortClustersBySize(clusters: GalaxyCluster[]): GalaxyCluster[] {
  return [...clusters].sort((a, b) => b.totalNodes - a.totalNodes);
}

export function getClusterMasteryDistribution(cluster: GalaxyCluster): { mastered: number; inProgress: number; notStarted: number } {
  const notStarted = cluster.totalNodes - cluster.masteredNodes - cluster.inProgressNodes;
  return {
    mastered: cluster.masteredNodes,
    inProgress: cluster.inProgressNodes,
    notStarted: Math.max(0, notStarted)
  };
}
