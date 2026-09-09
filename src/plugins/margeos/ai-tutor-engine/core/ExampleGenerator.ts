// AI Tutor Engine — ExampleGenerator (Feature 5)
import { buildTeachingInstruction, memoryHintFor, subjectForContext } from "../services/TutorPromptService";
import { generateTeachingText } from "../services/AIConversationService";
import { nextTutorMessageId, type TutorMessage } from "../models/TutorMessage";
import type { StudentProfile } from "../models/StudentProfile";
import type { PageContext } from "../models/TeachingSession";
import type { TeachingResult } from "../models/TeachingResult";
import { predictFollowUpQuestions } from "./TutorDecisionEngine";

export interface GenerateExampleOptions {
  conceptLabel: string;
  pageNumber: number;
  profile: StudentProfile;
  context: PageContext;
  /** How many examples to generate — defaults to 1 (Feature 13's "more_examples" escalation uses 2). */
  count?: number;
  onUpdate?: (message: TutorMessage) => void;
  signal?: AbortSignal;
}

export async function generateExample(opts: GenerateExampleOptions): Promise<TeachingResult> {
  const count = opts.count ?? 1;
  let message: TutorMessage = {
    id: nextTutorMessageId(),
    type: "example",
    content: "",
    status: "streaming",
    error: null,
    conceptLabel: opts.conceptLabel,
    pageNumber: opts.pageNumber,
    mode: opts.profile.preferredMode,
    ageBand: opts.profile.ageBand,
    learningStyle: opts.profile.learningStyle,
    createdAt: Date.now(),
  };
  opts.onUpdate?.(message);

  const task = `Give ${count} concrete, worked example${count > 1 ? "s" : ""} of "${opts.conceptLabel}" — no restating the definition, just the example(s) with enough detail to follow along.`;
  const instruction = buildTeachingInstruction({ task, profile: opts.profile, context: opts.context });

  const result = await generateTeachingText({
    userInstruction: instruction,
    subject: subjectForContext(opts.context),
    memoryHint: memoryHintFor(opts.profile, opts.context),
    onChunk: (partial) => {
      message = { ...message, content: partial };
      opts.onUpdate?.(message);
    },
    signal: opts.signal,
  });

  message = { ...message, content: result.text || message.content, status: result.error ? "error" : "complete", error: result.error };
  opts.onUpdate?.(message);

  return { message, suggestedFollowUps: predictFollowUpQuestions(opts.conceptLabel) };
}
