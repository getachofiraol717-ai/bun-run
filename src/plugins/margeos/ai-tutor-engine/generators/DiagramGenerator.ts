import type { DiagramCardData } from "../cards/DiagramCard";

export interface DiagramGenOptions {
  title: string;
  topic?: string;
}

export function generateDiagramData(opts: DiagramGenOptions): DiagramCardData {
  const svg = `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto text-blue-400">
    <rect x="20" y="20" width="100" height="60" rx="10" fill="#3b82f6" fill-opacity="0.2" stroke="#3b82f6" stroke-width="2"/>
    <text x="70" y="55" fill="#93c5fd" font-size="12" text-anchor="middle" font-family="sans-serif">Input Node</text>
    <path d="M 120 50 L 180 50" stroke="#60a5fa" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="180" y="20" width="120" height="60" rx="10" fill="#8b5cf6" fill-opacity="0.2" stroke="#8b5cf6" stroke-width="2"/>
    <text x="240" y="55" fill="#c4b5fd" font-size="12" text-anchor="middle" font-family="sans-serif">Processing Engine</text>
    <path d="M 240 80 L 240 130" stroke="#a78bfa" stroke-width="2"/>
    <circle cx="240" cy="150" r="25" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="2"/>
    <text x="240" y="154" fill="#6ee7b7" font-size="10" text-anchor="middle" font-family="sans-serif">Output</text>
  </svg>`;

  return {
    title: `Diagram: ${opts.title}`,
    explanation: `This visual diagram outlines the architectural components and data flow for ${opts.title}.`,
    purpose: `To help students visually grasp structural relationships and procedural sequences.`,
    labels: [
      { key: "Input Node", description: "Initial data source or entry point" },
      { key: "Processing Engine", description: "Transformation logic and core algorithm" },
      { key: "Output Result", description: "Final calculated state or response" }
    ],
    svgContent: svg
  };
}
