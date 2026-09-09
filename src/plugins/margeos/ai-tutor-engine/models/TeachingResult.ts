// AI Tutor Engine — TeachingResult model (Feature 14 — session summaries)
import type { TutorMessage } from "./TutorMessage";

/** Generic wrapper returned by generation calls (ExplanationGenerator, FormulaTeachingEngine, ExampleGenerator…). */
export interface TeachingResult {
  message: TutorMessage;
  /** Feature 11 — predicted follow-up questions the student is likely to ask next. */
  suggestedFollowUps: string[];
}

/** Feature 14 — produced once a teaching session ends. */
export interface SessionSummary {
  documentId: string;
  pageNumber: number;
  keyConcepts: string[];
  importantFormulas: string[];
  vocabulary: string[];
  reviewChecklist: string[];
  needsMorePractice: string[];
  generatedAt: number;
}

/** Pull a short, de-duplicated list of concept labels actually taught in a session's messages. */
export function conceptsTaught(messages: TutorMessage[]): string[] {
  const seen = new Set<string>();
  for (const m of messages) if (m.conceptLabel && m.status === "complete") seen.add(m.conceptLabel);
  return [...seen];
}
