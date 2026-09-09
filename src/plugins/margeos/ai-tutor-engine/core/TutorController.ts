// AI Tutor Engine — TutorController (public facade)
import { preparePageSession, teachBlock } from "./AITutorEngine";
import { generateExplanation } from "./ExplanationGenerator";
import { teachFormula } from "./FormulaTeachingEngine";
import { generateExample } from "./ExampleGenerator";
import { escalationAction, escalationFor, recordConfusionIncrement } from "./DifficultyAdapter";
import {
  attachLessonPlan,
  endSession as endSessionTransition,
  recordFAQ,
  recordMastered,
  recordMistake,
  recordSkipped,
  startSession as startSessionTransition,
  upsertMessage,
} from "./TeachingSessionManager";
import { currentOrNextBlock, isLessonComplete, markBlockInProgress, markBlockSkipped, markBlockTaught } from "../services/TeachingFlowService";
import { generateAnalogy, instantSeedAnalogy } from "../services/AnalogyService";
import { syncMemoryToVault } from "../services/ContextMemoryService";
import { normalizeLabel } from "../utils/tutorUtils";
import { getProfile, getSession, setProfile, setSession } from "../store/aiTutorStore";
import { conceptsTaught, type SessionSummary, type TeachingResult } from "../models/TeachingResult";
import type { TeachingSession } from "../models/TeachingSession";
import type { TutorMessage } from "../models/TutorMessage";
import type {
  ExplainConceptOptions,
  ITutorController,
  StartSessionOptions,
  TeachFormulaOptions,
} from "../interfaces/TutorInterface";

function requireSession(documentId: string, pageNumber: number): TeachingSession | null {
  return getSession(documentId, pageNumber);
}

/** Wires a generator's onUpdate callback to persist every streamed/final message into the session — the one piece of plumbing every public method below needs. */
function persistToSession(documentId: string, pageNumber: number): (message: TutorMessage) => void {
  return (message: TutorMessage) => {
    const current = getSession(documentId, pageNumber);
    if (current) setSession(documentId, pageNumber, upsertMessage(current, message));
  };
}

export async function startSession(opts: StartSessionOptions): Promise<TeachingSession> {
  const existing = getSession(opts.documentId, opts.pageNumber);
  if (existing && existing.lessonPlan) return existing;

  const prepared = preparePageSession(opts.documentId, opts.pageNumber);
  let session = startSessionTransition(opts.documentId, opts.pageNumber, prepared?.context ?? null);
  if (prepared) session = attachLessonPlan(session, prepared.lessonPlan);
  setSession(opts.documentId, opts.pageNumber, session);
  return session;
}

/** Feature 2 — auto-teaching: generate the next untaught block in the page's lesson plan. */
export async function teachNextBlock(documentId: string, pageNumber: number): Promise<TeachingResult | null> {
  const session = requireSession(documentId, pageNumber);
  if (!session?.lessonPlan || !session.context) return null;

  const block = currentOrNextBlock(session.lessonPlan);
  if (!block) return null;

  setSession(documentId, pageNumber, { ...session, lessonPlan: markBlockInProgress(session.lessonPlan, block.id) });

  const result = await teachBlock({
    block,
    profile: getProfile(),
    context: session.context,
    onUpdate: persistToSession(documentId, pageNumber),
  });

  const after = getSession(documentId, pageNumber);
  if (after?.lessonPlan) {
    const updatedPlan = result ? markBlockTaught(after.lessonPlan, block.id, result.message.id) : markBlockSkipped(after.lessonPlan, block.id);
    setSession(documentId, pageNumber, { ...after, lessonPlan: updatedPlan });
  }

  return result;
}

export async function explainConcept(opts: ExplainConceptOptions): Promise<TeachingResult> {
  const session = requireSession(opts.documentId, opts.pageNumber);
  if (!session?.context) throw new Error("AI Tutor Engine: call startSession() before explainConcept().");

  return generateExplanation({
    conceptLabel: opts.conceptLabel,
    pageNumber: opts.pageNumber,
    profile: getProfile(),
    context: session.context,
    mode: opts.mode,
    onUpdate: (message) => {
      persistToSession(opts.documentId, opts.pageNumber)(message);
      opts.onChunk?.(message.content);
    },
  });
}

export async function teachFormulaById(opts: TeachFormulaOptions): Promise<TeachingResult> {
  const session = requireSession(opts.documentId, opts.pageNumber);
  if (!session?.context) throw new Error("AI Tutor Engine: call startSession() before teachFormula().");
  const formula = session.context.formulas.find((f) => f.id === opts.formulaId);
  if (!formula) throw new Error(`AI Tutor Engine: formula "${opts.formulaId}" not found on this page.`);

  return teachFormula({
    formula,
    profile: getProfile(),
    context: session.context,
    onUpdate: (message) => {
      persistToSession(opts.documentId, opts.pageNumber)(message);
      opts.onChunk?.(message.content);
    },
  });
}

export async function getExample(documentId: string, pageNumber: number, conceptLabel: string): Promise<TeachingResult> {
  const session = requireSession(documentId, pageNumber);
  if (!session?.context) throw new Error("AI Tutor Engine: call startSession() before getExample().");
  return generateExample({
    conceptLabel,
    pageNumber,
    profile: getProfile(),
    context: session.context,
    onUpdate: persistToSession(documentId, pageNumber),
  });
}

/**
 * Feature 13 — student re-requested the same concept. Bumps the confusion
 * counter and adapts: tiers 1–2 (none/simplify) re-explain with a
 * simplification hint, tier 3 switches to extra worked examples, tiers 4+
 * switch to a fresh analogy that explicitly avoids repeating earlier ones.
 * Every branch persists its result into the session, same as every other
 * generator in this controller.
 */
export async function recordConfusion(documentId: string, pageNumber: number, conceptLabel: string): Promise<TeachingResult | null> {
  const session = requireSession(documentId, pageNumber);
  if (!session?.context) return null;

  const updated = recordConfusionIncrement(session, conceptLabel);
  setSession(documentId, pageNumber, updated);
  if (!updated.context) return null; // defensive — see comment on TeachingSession.context

  const action = escalationAction(escalationFor(updated, conceptLabel));
  const onUpdate = persistToSession(documentId, pageNumber);

  if (action.action === "example") {
    return generateExample({ conceptLabel, pageNumber, profile: getProfile(), context: updated.context, count: 2, onUpdate });
  }

  if (action.action === "analogy") {
    const previousAnalogies = updated.messages.filter((m) => m.type === "analogy" && m.conceptLabel === conceptLabel).map((m) => m.content);
    const seed = instantSeedAnalogy(conceptLabel);
    const avoidAnalogies = seed ? [...previousAnalogies, seed] : previousAnalogies;

    let message: TutorMessage = {
      id: `analogy-${Date.now().toString(36)}`,
      type: "analogy",
      content: "",
      status: "streaming",
      error: null,
      conceptLabel,
      pageNumber,
      mode: getProfile().preferredMode,
      ageBand: getProfile().ageBand,
      learningStyle: getProfile().learningStyle,
      createdAt: Date.now(),
    };
    onUpdate(message);

    const result = await generateAnalogy({
      conceptLabel,
      profile: getProfile(),
      context: updated.context,
      avoidAnalogies,
      onChunk: (partial) => { message = { ...message, content: partial }; onUpdate(message); },
    });

    message = { ...message, content: result.text || message.content, status: result.error ? "error" : "complete", error: result.error };
    onUpdate(message);
    return { message, suggestedFollowUps: [] };
  }

  // "reexplain" — tiers 1–2 (none/simplify): re-explain with the escalation's simplification hint folded in.
  // If the confused concept is actually a formula, use the grounded formula teacher (Feature 4) rather
  // than the generic concept explainer, so it still benefits from the already-known variables/mistakes/uses.
  const matchingFormula = updated.context.formulas.find((f) => f.formula === conceptLabel);
  if (matchingFormula) {
    return teachFormula({ formula: matchingFormula, profile: getProfile(), context: updated.context, extraHint: action.promptHint || undefined, onUpdate });
  }

  return generateExplanation({
    conceptLabel,
    pageNumber,
    profile: getProfile(),
    context: updated.context,
    extraHint: action.promptHint || undefined,
    onUpdate,
  });
}

export function markMastered(documentId: string, pageNumber: number, conceptLabel: string): void {
  setProfile(recordMastered(getProfile(), conceptLabel, documentId));
  const subject = requireSession(documentId, pageNumber)?.context?.chapter?.title ?? null;
  void syncMemoryToVault("strong_subject", `Mastered: ${conceptLabel}`, subject);
}

export function markSkipped(conceptLabel: string): void {
  setProfile(recordSkipped(getProfile(), conceptLabel));
  void syncMemoryToVault("weak_subject", `Skipped: ${conceptLabel}`);
}

export function logMistake(conceptLabel: string, description: string): void {
  setProfile(recordMistake(getProfile(), conceptLabel, description));
  void syncMemoryToVault("struggle_pattern", `Mistake on ${conceptLabel}: ${description}`, conceptLabel);
}

export function logQuestion(question: string, conceptLabel: string | null): void {
  const updatedProfile = recordFAQ(getProfile(), question, conceptLabel);
  setProfile(updatedProfile);
  // Only sync once a question has genuinely recurred — a one-off question isn't a "struggle pattern" worth remembering long-term.
  const faq = updatedProfile.faqs.find((f) => normalizeLabel(f.question) === normalizeLabel(question));
  if (faq && faq.count >= 2) {
    void syncMemoryToVault("struggle_pattern", `Repeated question (${faq.count}x): ${question}`, conceptLabel);
  }
}

/** Feature 14 — derived entirely from already-taught data (the session's messages + its Smart PDF Engine context), no extra AI call needed. */
export function endSession(documentId: string, pageNumber: number): SessionSummary | null {
  const session = requireSession(documentId, pageNumber);
  if (!session?.context) return null;

  const taughtLabels = conceptsTaught(session.messages);
  const formulaLabels = session.context.formulas.map((f) => f.formula).filter((f) => taughtLabels.includes(f));
  const vocabulary = session.context.topics
    .filter((t) => t.kind === "definition" || t.kind === "term")
    .map((t) => t.label)
    .filter((l) => taughtLabels.includes(l));
  const reviewChecklist = taughtLabels.filter((l) => !formulaLabels.includes(l));
  const needsMorePractice = Object.entries(session.confusion.byConcept).filter(([, count]) => count >= 2).map(([label]) => label);

  setSession(documentId, pageNumber, endSessionTransition(session));

  return {
    documentId,
    pageNumber,
    keyConcepts: taughtLabels.filter((l) => !formulaLabels.includes(l) && !vocabulary.includes(l)),
    importantFormulas: formulaLabels,
    vocabulary,
    reviewChecklist,
    needsMorePractice,
    generatedAt: Date.now(),
  };
}

export function isPageLessonComplete(documentId: string, pageNumber: number): boolean {
  const session = requireSession(documentId, pageNumber);
  return session?.lessonPlan ? isLessonComplete(session.lessonPlan) : false;
}

/** Implements ITutorController — exported as a single object for code that prefers the interface-shaped facade. */
export const tutorController: ITutorController = {
  startSession,
  teachNextBlock,
  explainConcept,
  teachFormula: teachFormulaById,
  getExample,
  recordConfusion,
  markMastered,
  markSkipped,
  endSession,
};
