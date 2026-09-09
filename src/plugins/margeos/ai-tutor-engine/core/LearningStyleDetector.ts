// AI Tutor Engine — LearningStyleDetector (Feature 7)
import { LEARNING_STYLE_DESCRIPTORS, type LearningStyle, type LearningStyleDescriptor } from "../models/LearningStyle";
import type { ExplanationMode, StudentProfile } from "../models/StudentProfile";

export function currentLearningStyle(profile: StudentProfile): LearningStyle {
  return profile.learningStyle;
}

export function descriptorFor(style: LearningStyle): LearningStyleDescriptor {
  return LEARNING_STYLE_DESCRIPTORS[style];
}

/**
 * Lightweight heuristic: if a student consistently *requests* certain
 * explanation modes, that's a real signal about their style — not a
 * replacement for an explicit profile setting, but a reasonable suggestion
 * a UI could surface ("It looks like you learn best with analogies — switch
 * your default style?").
 */
export function suggestStyleFromModeUsage(modeCounts: Partial<Record<ExplanationMode, number>>): LearningStyle | null {
  const total = Object.values(modeCounts).reduce((sum, n) => sum + (n ?? 0), 0);
  if (total < 4) return null; // not enough signal yet

  const storyOrAnalogy = (modeCounts.story ?? 0) + (modeCounts.analogy ?? 0);
  const technicalOrDetailed = (modeCounts.technical ?? 0) + (modeCounts.detailed ?? 0);
  const examPrep = modeCounts.exam_prep ?? 0;

  if (storyOrAnalogy / total > 0.5) return "auditory";
  if (technicalOrDetailed / total > 0.5) return "reading_writing";
  if (examPrep / total > 0.4) return "reading_writing";
  return null; // no strong enough signal — leave the explicit setting alone
}
