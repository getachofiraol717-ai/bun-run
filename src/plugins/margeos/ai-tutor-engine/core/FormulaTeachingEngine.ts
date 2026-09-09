// AI Tutor Engine — FormulaTeachingEngine (Feature 4)
// Reuses Task 1's Formula.explanation (variables/examples/commonMistakes/
// realWorldExamples) as grounding facts fed *into* the AI prompt, rather
// than asking the AI to invent them from scratch — reduces hallucination
// and means the formula was genuinely "detected once", per the spec.
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import { buildTeachingInstruction, memoryHintFor, subjectForContext } from "../services/TutorPromptService";
import { generateTeachingText } from "../services/AIConversationService";
import { nextTutorMessageId, type TutorMessage } from "../models/TutorMessage";
import type { StudentProfile } from "../models/StudentProfile";
import type { PageContext } from "../models/TeachingSession";
import type { TeachingResult } from "../models/TeachingResult";
import { predictFollowUpQuestions } from "./TutorDecisionEngine";

function formulaTeachingTask(formula: Formula): string {
  const known = formula.explanation;
  const knownVars = known.variables.map((v) => `${v.symbol} = ${v.meaning}`).join(", ");
  const knownMistakes = known.commonMistakes.join("; ");
  const knownRealWorld = known.realWorldExamples.join("; ");

  return [
    `Teach the formula "${formula.formula}" (subject: ${formula.subject}, difficulty: ${formula.difficulty}).`,
    `Known variable meanings so far: ${knownVars || "not yet known — infer sensibly from context"}.`,
    "Cover, in order: (1) what it means in plain language, (2) a clear explanation of every variable, (3) a derivation IF appropriate for this level (skip if it would be confusing), (4) one full step-by-step worked numeric example, (5) common mistakes students make, (6) one memory tip or mnemonic, (7) a real-world use.",
    knownMistakes ? `Build on these already-known common mistakes rather than repeating generic ones: ${knownMistakes}.` : "",
    knownRealWorld ? `Build on this already-known real-world use: ${knownRealWorld}.` : "",
  ].filter(Boolean).join("\n");
}

export interface TeachFormulaOptions {
  formula: Formula;
  profile: StudentProfile;
  context: PageContext;
  /** e.g. a Feature-13 confusion-escalation hint. */
  extraHint?: string;
  onUpdate?: (message: TutorMessage) => void;
  signal?: AbortSignal;
}

export async function teachFormula(opts: TeachFormulaOptions): Promise<TeachingResult> {
  let message: TutorMessage = {
    id: nextTutorMessageId(),
    type: "formula_teaching",
    content: "",
    status: "streaming",
    error: null,
    conceptLabel: opts.formula.formula,
    pageNumber: opts.formula.pageNumber,
    mode: opts.profile.preferredMode,
    ageBand: opts.profile.ageBand,
    learningStyle: opts.profile.learningStyle,
    createdAt: Date.now(),
  };
  opts.onUpdate?.(message);

  const instruction = buildTeachingInstruction({
    task: formulaTeachingTask(opts.formula),
    profile: opts.profile,
    context: opts.context,
    extraHint: opts.extraHint,
  });

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

  return { message, suggestedFollowUps: predictFollowUpQuestions(opts.formula.formula) };
}
