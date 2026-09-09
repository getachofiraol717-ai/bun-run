// AI Tutor Engine — StudentProfile model (Feature 10 + Features 6/7 preferences)
import type { LearningStyle } from "./LearningStyle";

export type AgeBand = "8-10" | "11-13" | "14-16" | "17-19" | "university" | "professional";

export type ExplanationMode = "simple" | "detailed" | "technical" | "story" | "analogy" | "exam_prep";

export interface MasteredTopic {
  topicLabel: string;
  documentId: string;
  masteredAt: string; // ISO timestamp
}

export interface MistakeRecord {
  topicLabel: string;
  description: string;
  recordedAt: string;
}

export interface FAQRecord {
  question: string;
  topicLabel: string | null;
  askedAt: string;
  /** How many times a similar question has been asked — feeds confusion detection (Feature 13). */
  count: number;
}

export interface StudentProfile {
  ageBand: AgeBand;
  learningStyle: LearningStyle;
  preferredMode: ExplanationMode;
  mastered: MasteredTopic[];
  skipped: string[]; // topic labels
  mistakes: MistakeRecord[];
  faqs: FAQRecord[];
}

export const DEFAULT_STUDENT_PROFILE: StudentProfile = {
  ageBand: "11-13",
  learningStyle: "mixed",
  preferredMode: "simple",
  mastered: [],
  skipped: [],
  mistakes: [],
  faqs: [],
};

/** Compact, human-readable summary of the profile — fed to the AI as `memoryHint` so it personalizes without needing a new backend field. */
export function summarizeProfileForAI(profile: StudentProfile, scopedTopics?: string[]): string {
  const lines: string[] = [];
  lines.push(`Age band ${profile.ageBand}, ${profile.learningStyle} learner, prefers ${profile.preferredMode} explanations.`);

  const relevantMastered = scopedTopics
    ? profile.mastered.filter((m) => scopedTopics.includes(m.topicLabel))
    : profile.mastered;
  if (relevantMastered.length) lines.push(`Already mastered: ${relevantMastered.slice(-8).map((m) => m.topicLabel).join(", ")}.`);

  const relevantMistakes = scopedTopics
    ? profile.mistakes.filter((m) => scopedTopics.includes(m.topicLabel))
    : profile.mistakes;
  if (relevantMistakes.length) lines.push(`Past mistakes: ${relevantMistakes.slice(-5).map((m) => `${m.topicLabel} (${m.description})`).join("; ")}.`);

  const repeatedFaqs = profile.faqs.filter((f) => f.count > 1).slice(-3);
  if (repeatedFaqs.length) lines.push(`Has asked more than once: ${repeatedFaqs.map((f) => f.question).join("; ")}.`);

  return lines.join(" ");
}
