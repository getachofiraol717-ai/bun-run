// Knowledge Galaxy — Node Utilities
// Utility functions for working with knowledge nodes

import type { KnowledgeNode, NodeType } from "../models/KnowledgeNode";

export function getNodeColor(node: KnowledgeNode): string {
  const colors: Record<NodeType, string> = {
    subject: "#6366F1",
    chapter: "#8B5CF6",
    topic: "#A855F7",
    concept: "#10B981",
    skill: "#F59E0B",
    formula: "#EC4899",
    definition: "#06B6D4",
    example: "#84CC16",
    reference: "#14B8A6",
    lesson: "#F97316",
    quiz: "#EF4444",
    flashcard: "#22D3EE"
  };
  return colors[node.type] || "#6B7280";
}

export function getNodeIcon(node: KnowledgeNode): string {
  const icons: Record<NodeType, string> = {
    subject: "globe",
    chapter: "book",
    topic: "folder",
    concept: "lightbulb",
    skill: "target",
    formula: "function",
    definition: "text",
    example: "play",
    reference: "bookmark",
    lesson: "video",
    quiz: "check-square",
    flashcard: "layers"
  };
  return icons[node.type] || "circle";
}

export function getNodeSize(node: KnowledgeNode): number {
  const baseSize = node.type === "subject" ? 60 : node.type === "chapter" ? 50 : 40;
  const importanceBonus = node.importance * 2;
  const masteryBonus = node.masteryScore > 80 ? 10 : 0;
  return baseSize + importanceBonus + masteryBonus;
}

export function getMasteryColor(masteryScore: number): string {
  if (masteryScore >= 80) return "#10B981";
  if (masteryScore >= 60) return "#3B82F6";
  if (masteryScore >= 40) return "#F59E0B";
  if (masteryScore >= 20) return "#EF4444";
  return "#6B7280";
}

export function formatMasteryLabel(masteryScore: number): string {
  if (masteryScore >= 90) return "Expert";
  if (masteryScore >= 70) return "Advanced";
  if (masteryScore >= 50) return "Intermediate";
  if (masteryScore >= 30) return "Novice";
  return "Beginner";
}

export function isNodeAccessible(node: KnowledgeNode): boolean {
  return node.status !== "locked" && node.status !== "hidden";
}

export function isNodeLearned(node: KnowledgeNode): boolean {
  return node.masteryScore >= 80;
}

export function getNodeProgress(node: KnowledgeNode): { current: number; total: number; percentage: number } {
  return {
    current: node.masteryScore,
    total: 100,
    percentage: node.masteryScore
  };
}
