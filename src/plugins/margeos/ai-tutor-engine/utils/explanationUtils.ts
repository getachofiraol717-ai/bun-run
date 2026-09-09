// AI Tutor Engine — explanationUtils (Features 3 + 8)
import type { ExplanationMode } from "../models/StudentProfile";

/** Feature 3 — the six things every concept explanation should cover. */
export const CONCEPT_EXPLANATION_STRUCTURE = [
  "a clear one-sentence definition",
  "its purpose (what problem it solves)",
  "why it matters",
  "where it's used",
  "one real-life application",
  "one related concept worth knowing next",
] as const;

export function conceptExplanationInstruction(conceptLabel: string): string {
  return `Explain "${conceptLabel}" covering: ${CONCEPT_EXPLANATION_STRUCTURE.join("; ")}. Keep each part brief — this should read like a focused micro-lesson, not an essay.`;
}

/** Feature 8 — explanation modes (Analogy Mode has its own richer logic in analogyUtils). */
export const EXPLANATION_MODE_HINTS: Record<ExplanationMode, string> = {
  simple: "Use Simple Mode: short sentences, plain words, one idea at a time.",
  detailed: "Use Detailed Mode: thorough explanation with structure (headings/bullets), covering nuance and edge cases.",
  technical: "Use Technical Mode: precise terminology, formal definitions, and rigor appropriate for an advanced student.",
  story: "Use Story Mode: wrap the explanation in a short narrative or scenario with a character facing a problem this concept solves.",
  analogy: "Use Analogy Mode: explain primarily through one strong analogy to everyday life.",
  exam_prep: "Use Exam Preparation Mode: focus on what's commonly tested, likely question phrasings, and a quick recall trick.",
};

/** Best-effort split of a markdown explanation into rough sections by heading/bullet structure — used only for lightweight previews, never for re-parsing meaning. */
export function previewSnippet(markdown: string, maxLength = 140): string {
  const plain = markdown.replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
  return plain.length <= maxLength ? plain : `${plain.slice(0, maxLength - 1)}…`;
}
