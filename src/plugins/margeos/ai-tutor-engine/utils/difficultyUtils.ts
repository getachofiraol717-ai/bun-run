// AI Tutor Engine — difficultyUtils (Features 6 + 13)
import type { AgeBand } from "../models/StudentProfile";

export interface AgeBandDescriptor {
  band: AgeBand;
  label: string;
  /** Folded into the AI instruction so the same concept genuinely reads differently per band. */
  promptHint: string;
}

export const AGE_BAND_DESCRIPTORS: Record<AgeBand, AgeBandDescriptor> = {
  "8-10": {
    band: "8-10",
    label: "Ages 8–10 (elementary)",
    promptHint: "Use very simple words, short sentences, playful tone, and a concrete everyday example a young child would recognize. Avoid jargon entirely.",
  },
  "11-13": {
    band: "11-13",
    label: "Ages 11–13 (middle school)",
    promptHint: "Use clear, friendly language with a relatable example from school or daily life. Introduce one new term at a time and define it immediately.",
  },
  "14-16": {
    band: "14-16",
    label: "Ages 14–16 (early high school)",
    promptHint: "Use standard textbook language with proper terminology, but still ground it with a concrete example. It's fine to reference earlier topics.",
  },
  "17-19": {
    band: "17-19",
    label: "Ages 17–19 (late high school)",
    promptHint: "Use precise academic language, connect to exam-style reasoning, and mention how this concept tends to be tested.",
  },
  university: {
    band: "university",
    label: "University level",
    promptHint: "Use rigorous, technical language. Assume prior foundational knowledge. Reference underlying theory and edge cases where relevant.",
  },
  professional: {
    band: "professional",
    label: "Professional / practitioner",
    promptHint: "Be concise and practical. Focus on real-world application, common pitfalls in practice, and skip basic definitions unless asked.",
  },
};

// ── Feature 13 — confusion detection ────────────────────────
/** Number of repeat requests for the same concept before the tutor starts simplifying — this IS the count=1 tier below, kept as a named constant since other code may want to reference "has this crossed the escalation point" without duplicating the tier logic. */
export const CONFUSION_THRESHOLD = 1;

export type ConfusionEscalation = "none" | "simplify" | "more_examples" | "new_analogy" | "visual_description";

/** Decide how the tutor should adapt after N repeated requests for the same concept. Note: this is only called once the student has *already* re-requested (the original explanation doesn't go through here), so count=CONFUSION_THRESHOLD is itself a repeat and must not just silently regenerate the same answer. */
export function escalationForConfusionCount(count: number): ConfusionEscalation {
  if (count < CONFUSION_THRESHOLD) return "none";
  if (count === CONFUSION_THRESHOLD) return "simplify";
  if (count === CONFUSION_THRESHOLD + 1) return "more_examples";
  if (count === CONFUSION_THRESHOLD + 2) return "new_analogy";
  return "visual_description";
}

export function escalationPromptHint(level: ConfusionEscalation): string {
  switch (level) {
    case "simplify":
      return "The student asked again — this time use noticeably simpler words and a shorter explanation than before.";
    case "more_examples":
      return "The student is still stuck — skip the formal explanation and go straight to 2 fresh, very concrete examples.";
    case "new_analogy":
      return "Previous explanations haven't landed — use a completely different analogy than before, from a different domain of everyday life.";
    case "visual_description":
      return "Try a different angle — describe this concept as if drawing it out step by step, focusing on what the student would *see* happening.";
    default:
      return "";
  }
}
