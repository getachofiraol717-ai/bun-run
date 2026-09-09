// AI Tutor Engine — ConceptExpansionService (Feature 3)
import { conceptExplanationInstruction } from "../utils/explanationUtils";
import { buildTeachingInstruction, memoryHintFor, subjectForContext } from "./TutorPromptService";
import { generateTeachingText, type ConversationResult } from "./AIConversationService";
import type { ExplanationMode, StudentProfile } from "../models/StudentProfile";
import type { PageContext } from "../models/TeachingSession";

export interface ExpandConceptOptions {
  conceptLabel: string;
  profile: StudentProfile;
  context: PageContext;
  mode?: ExplanationMode;
  /** e.g. a Feature-13 confusion-escalation hint. */
  extraHint?: string;
  onChunk?: (partial: string) => void;
  signal?: AbortSignal;
}

export async function expandConcept(opts: ExpandConceptOptions): Promise<ConversationResult> {
  const task = conceptExplanationInstruction(opts.conceptLabel);
  const instruction = buildTeachingInstruction({
    task,
    profile: opts.profile,
    context: opts.context,
    mode: opts.mode,
    extraHint: opts.extraHint,
  });

  return generateTeachingText({
    userInstruction: instruction,
    subject: subjectForContext(opts.context),
    memoryHint: memoryHintFor(opts.profile, opts.context),
    onChunk: opts.onChunk,
    signal: opts.signal,
  });
}
