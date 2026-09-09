// AI Tutor Engine — ExplanationGenerator (Features 3, 6, 7, 8)
import { expandConcept } from "../services/ConceptExpansionService";
import { predictFollowUpQuestions } from "./TutorDecisionEngine";
import { nextTutorMessageId, type TutorMessage } from "../models/TutorMessage";
import type { ExplanationMode, StudentProfile } from "../models/StudentProfile";
import type { PageContext } from "../models/TeachingSession";
import type { TeachingResult } from "../models/TeachingResult";

export interface ExplainOptions {
  conceptLabel: string;
  pageNumber: number;
  profile: StudentProfile;
  context: PageContext;
  mode?: ExplanationMode;
  extraHint?: string;
  /** Called with the evolving message on every streamed chunk and on completion. */
  onUpdate?: (message: TutorMessage) => void;
  signal?: AbortSignal;
}

export async function generateExplanation(opts: ExplainOptions): Promise<TeachingResult> {
  let message: TutorMessage = {
    id: nextTutorMessageId(),
    type: "concept_explanation",
    content: "",
    status: "streaming",
    error: null,
    conceptLabel: opts.conceptLabel,
    pageNumber: opts.pageNumber,
    mode: opts.mode ?? opts.profile.preferredMode,
    ageBand: opts.profile.ageBand,
    learningStyle: opts.profile.learningStyle,
    createdAt: Date.now(),
  };
  opts.onUpdate?.(message);

  const result = await expandConcept({
    conceptLabel: opts.conceptLabel,
    profile: opts.profile,
    context: opts.context,
    mode: opts.mode,
    extraHint: opts.extraHint,
    onChunk: (partial) => {
      message = { ...message, content: partial };
      opts.onUpdate?.(message);
    },
    signal: opts.signal,
  });

  message = {
    ...message,
    content: result.text || message.content,
    status: result.error ? "error" : "complete",
    error: result.error,
  };
  opts.onUpdate?.(message);

  return { message, suggestedFollowUps: predictFollowUpQuestions(opts.conceptLabel) };
}
