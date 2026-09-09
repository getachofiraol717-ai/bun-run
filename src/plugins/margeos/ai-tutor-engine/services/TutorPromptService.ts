// AI Tutor Engine — TutorPromptService
import { AGE_BAND_DESCRIPTORS } from "../utils/difficultyUtils";
import { LEARNING_STYLE_DESCRIPTORS } from "../models/LearningStyle";
import { EXPLANATION_MODE_HINTS } from "../utils/explanationUtils";
import { analogyPromptHint } from "../utils/analogyUtils";
import { summarizeProfileForAI, type ExplanationMode, type StudentProfile } from "../models/StudentProfile";
import type { PageContext } from "../models/TeachingSession";

export interface BuildInstructionOptions {
  /** The core teaching task text, e.g. from explanationUtils.conceptExplanationInstruction(...). */
  task: string;
  profile: StudentProfile;
  context: PageContext;
  /** Overrides profile.preferredMode for this one request. */
  mode?: ExplanationMode;
  /** Extra hint appended last — e.g. a Feature-13 confusion-escalation hint or an analogy-avoid list. */
  extraHint?: string;
}

/** Combine the page's chapter + a few of its strongest topics into one line — gives the AI document grounding without needing raw page text (Smart PDF Engine's *derived* data is enough; no re-analysis, no re-extraction). */
function pageGroundingLine(context: PageContext): string {
  const parts: string[] = [];
  if (context.chapter) parts.push(`Chapter: "${context.chapter.title}".`);
  if (context.topics.length) parts.push(`Key topics on this page: ${context.topics.slice(0, 6).map((t) => t.label).join(", ")}.`);
  if (context.formulas.length) parts.push(`Formulas on this page: ${context.formulas.map((f) => f.formula).join(", ")}.`);
  return parts.join(" ");
}

/** Feature 9 — concept connections, folded in as a single hint line when available. */
export function connectionsLine(previousChapterTitle: string | null, nextChapterTitle: string | null): string {
  const parts: string[] = [];
  if (previousChapterTitle) parts.push(`it follows "${previousChapterTitle}"`);
  if (nextChapterTitle) parts.push(`it leads into "${nextChapterTitle}"`);
  if (!parts.length) return "";
  return `If natural, briefly mention how this connects: ${parts.join(" and ")}.`;
}

/** Assemble the full instruction sent as the user-turn message content. */
export function buildTeachingInstruction(opts: BuildInstructionOptions): string {
  const mode = opts.mode ?? opts.profile.preferredMode;
  const modeHint = mode === "analogy" ? analogyPromptHint() : EXPLANATION_MODE_HINTS[mode];
  const ageHint = AGE_BAND_DESCRIPTORS[opts.profile.ageBand].promptHint;
  const styleHint = LEARNING_STYLE_DESCRIPTORS[opts.profile.learningStyle].promptHint;

  return [
    "[AI TEACHER INSTRUCTION] You are acting as a proactive, encouraging personal tutor sitting beside the student. Teach directly — do not say things like 'let me know if you have questions'; assume you're already mid-lesson.",
    pageGroundingLine(opts.context),
    opts.task,
    ageHint,
    styleHint,
    modeHint,
    opts.extraHint ?? "",
  ].filter(Boolean).join("\n");
}

/** Subject sent to the shared edge function (folds chapter context into its existing `subject` system-prompt line). */
export function subjectForContext(context: PageContext): string | undefined {
  return context.chapter?.title;
}

/** memoryHint sent to the shared edge function (Feature 10 personalization via the existing mechanism — no new backend field needed). */
export function memoryHintFor(profile: StudentProfile, context: PageContext): string {
  return summarizeProfileForAI(profile, context.topics.map((t) => t.label));
}
