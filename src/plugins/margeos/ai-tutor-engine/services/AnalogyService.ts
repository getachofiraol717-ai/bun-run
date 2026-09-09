// AI Tutor Engine — AnalogyService (Feature 8 + Feature 13)
import { analogyPromptHint, seedAnalogyFor } from "../utils/analogyUtils";
import { buildTeachingInstruction, memoryHintFor, subjectForContext } from "./TutorPromptService";
import { generateTeachingText, type ConversationResult } from "./AIConversationService";
import type { StudentProfile } from "../models/StudentProfile";
import type { PageContext } from "../models/TeachingSession";

/** A tiny built-in analogy for a handful of very common concepts — useful as an instant opener line while the real AI analogy streams in. Never a substitute for it. */
export function instantSeedAnalogy(conceptLabel: string): string | null {
  return seedAnalogyFor(conceptLabel);
}

export interface GetAnalogyOptions {
  conceptLabel: string;
  profile: StudentProfile;
  context: PageContext;
  /** Previously-given analogies for this concept (Feature 13 — "new analogy" escalation must not repeat itself). */
  avoidAnalogies?: string[];
  onChunk?: (partial: string) => void;
  signal?: AbortSignal;
}

export async function generateAnalogy(opts: GetAnalogyOptions): Promise<ConversationResult> {
  const task = `Give a fresh, vivid analogy that explains "${opts.conceptLabel}".`;
  const instruction = buildTeachingInstruction({
    task,
    profile: opts.profile,
    context: opts.context,
    mode: "analogy",
    extraHint: analogyPromptHint(opts.avoidAnalogies),
  });

  return generateTeachingText({
    userInstruction: instruction,
    subject: subjectForContext(opts.context),
    memoryHint: memoryHintFor(opts.profile, opts.context),
    onChunk: opts.onChunk,
    signal: opts.signal,
  });
}
