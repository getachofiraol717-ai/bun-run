// Knowledge Galaxy — Relationship Utilities
// Utility functions for working with relationships

import type { KnowledgeEdge, EdgeType } from "../models/KnowledgeEdge";

export function getEdgeColor(edge: KnowledgeEdge): string {
  const colors: Record<EdgeType, string> = {
    prerequisite: "#EF4444",
    depends_on: "#F97316",
    explains: "#3B82F6",
    uses: "#8B5CF6",
    extends: "#EC4899",
    related_to: "#6B7280",
    applied_in: "#10B981",
    contradicts: "#DC2626",
    similar_to: "#9CA3AF",
    part_of: "#14B8A6",
    references: "#06B6D4",
    examples: "#84CC16",
    derives_from: "#F59E0B",
    leads_to: "#22D3EE",
    supports: "#A3E635"
  };
  return colors[edge.type] || "#6B7280";
}

export function getEdgeLabel(edge: KnowledgeEdge): string {
  const labels: Record<EdgeType, string> = {
    prerequisite: "requires",
    depends_on: "depends on",
    explains: "explains",
    uses: "uses",
    extends: "extends",
    related_to: "related to",
    applied_in: "applied in",
    contradicts: "contradicts",
    similar_to: "similar to",
    part_of: "part of",
    references: "references",
    examples: "examples of",
    derives_from: "derives from",
    leads_to: "leads to",
    supports: "supports"
  };
  return labels[edge.type] || "connected to";
}

export function getEdgeWidth(edge: KnowledgeEdge): number {
  const baseWidth = 2;
  const strengthBonus = edge.strength === "strong" ? 3 : edge.strength === "medium" ? 2 : 1;
  return baseWidth + strengthBonus;
}

export function isEdgeHighlighted(edge: KnowledgeEdge, sourceId: string, targetId: string): boolean {
  return edge.sourceNodeId === sourceId && edge.targetNodeId === targetId;
}

export function filterEdgesByType(edges: KnowledgeEdge[], types: EdgeType[]): KnowledgeEdge[] {
  return edges.filter(e => types.includes(e.type));
}

export function filterEdgesByStrength(edges: KnowledgeEdge[], minStrength: number): KnowledgeEdge[] {
  return edges.filter(e => e.weight >= minStrength);
}

export function getEdgesForNode(nodeId: string, edges: KnowledgeEdge[]): KnowledgeEdge[] {
  return edges.filter(e => e.sourceNodeId === nodeId || e.targetNodeId === nodeId);
}

export function getOutgoingEdges(nodeId: string, edges: KnowledgeEdge[]): KnowledgeEdge[] {
  return edges.filter(e => e.sourceNodeId === nodeId);
}

export function getIncomingEdges(nodeId: string, edges: KnowledgeEdge[]): KnowledgeEdge[] {
  return edges.filter(e => e.targetNodeId === nodeId);
}
