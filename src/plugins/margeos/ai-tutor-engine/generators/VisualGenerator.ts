import type { VisualLearningCardData, VisualNode } from "../cards/VisualLearningCard";

export interface VisualGenOptions {
  topic: string;
  type?: "mindmap" | "flowchart" | "conceptmap" | "learningtree" | "architecture";
}

export function generateVisualData(opts: VisualGenOptions): VisualLearningCardData {
  const type = opts.type || "mindmap";
  const nodes: VisualNode[] = [
    { id: "root", label: opts.topic, category: "Core Concept", children: ["node1", "node2", "node3"] },
    { id: "node1", label: "Foundational Theory", category: "Principles", children: ["leaf1", "leaf2"] },
    { id: "node2", label: "Mathematical Framework", category: "Formulas", children: ["leaf3"] },
    { id: "node3", label: "Practical Applications", category: "Practice", children: ["leaf4"] },
    { id: "leaf1", label: "First Axiom", category: "Detail" },
    { id: "leaf2", label: "Boundary Conditions", category: "Detail" },
    { id: "leaf3", label: "Primary Equation", category: "Detail" },
    { id: "leaf4", label: "Real-World Case Study", category: "Detail" }
  ];

  return {
    title: `Visual Learning Map: ${opts.topic}`,
    type,
    nodes,
    summary: `Structured map highlighting hierarchical relationships and connections across ${opts.topic}.`
  };
}
