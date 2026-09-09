// AI Tutor Engine — DifficultyAdapter (Features 6 + 13)
import { escalationForConfusionCount, escalationPromptHint, type ConfusionEscalation } from "../utils/difficultyUtils";
import type { TeachingSession } from "../models/TeachingSession";

export function confusionCountFor(session: TeachingSession, conceptLabel: string): number {
  return session.confusion.byConcept[conceptLabel] ?? 0;
}

export function escalationFor(session: TeachingSession, conceptLabel: string): ConfusionEscalation {
  return escalationForConfusionCount(confusionCountFor(session, conceptLabel));
}

/** Feature 13 — call when the student re-requests an explanation for the same concept. Returns a new session (immutable) with the count bumped. */
export function recordConfusionIncrement(session: TeachingSession, conceptLabel: string): TeachingSession {
  const count = confusionCountFor(session, conceptLabel) + 1;
  return { ...session, confusion: { byConcept: { ...session.confusion.byConcept, [conceptLabel]: count } } };
}

/** Translate an escalation level into the concrete next action the tutor should take. */
export interface EscalationAction {
  level: ConfusionEscalation;
  promptHint: string;
  /** "example" → call ExampleGenerator instead of re-explaining; "analogy" → call AnalogyService with avoid-list; otherwise re-explain with the hint folded in. */
  action: "reexplain" | "example" | "analogy";
}

export function escalationAction(level: ConfusionEscalation): EscalationAction {
  const promptHint = escalationPromptHint(level);
  if (level === "more_examples") return { level, promptHint, action: "example" };
  if (level === "new_analogy" || level === "visual_description") return { level, promptHint, action: "analogy" };
  return { level, promptHint, action: "reexplain" };
}
