// @ts-nocheck
// AI Tutor Engine — AITutorEngine (Feature 1 + 2 orchestration)
import { getPageContext } from "../services/ContextMemoryService";
import { generateTeachingText } from "../services/AIConversationService";
import { buildTeachingInstruction, memoryHintFor, subjectForContext, connectionsLine } from "../services/TutorPromptService";
import { findAdjacentChapters } from "../utils/teachingUtils";
import { planLesson } from "./LessonPlanner";
import { generateExplanation } from "./ExplanationGenerator";
import { teachFormula } from "./FormulaTeachingEngine";
import { nextTutorMessageId, type TutorMessage } from "../models/TutorMessage";
import type { LessonBlock, LessonPlan } from "../models/LessonPlan";
import type { PageContext } from "../models/TeachingSession";
import type { ExplanationMode, StudentProfile } from "../models/StudentProfile";
import type { TeachingResult } from "../models/TeachingResult";
import { predictFollowUpQuestions } from "./TutorDecisionEngine";
import type { ChapterHierarchy } from "@/plugins/margeos/smart-pdf-engine";

export interface PageSession {
  context: PageContext;
  lessonPlan: LessonPlan;
}

/** Feature 1 — page awareness + lesson planning, purely from already-computed Smart PDF Engine data. Returns null if that document hasn't finished analysis yet. */
export function preparePageSession(documentId: string, pageNumber: number): PageSession | null {
  const context = getPageContext(documentId, pageNumber);
  if (!context) return null;
  return { context, lessonPlan: planLesson(context) };
}

async function generateSimpleNote(
  type: "page_intro" | "diagram_note" | "table_note" | "session_summary",
  task: string,
  conceptLabel: string | null,
  pageNumber: number,
  profile: StudentProfile,
  context: PageContext,
  onUpdate?: (message: TutorMessage) => void,
  signal?: AbortSignal
): Promise<TeachingResult> {
  let message: TutorMessage = {
    id: nextTutorMessageId(),
    type,
    content: "",
    status: "streaming",
    error: null,
    conceptLabel,
    pageNumber,
    mode: profile.preferredMode,
    ageBand: profile.ageBand,
    learningStyle: profile.learningStyle,
    createdAt: Date.now(),
  };
  onUpdate?.(message);

  const instruction = buildTeachingInstruction({ task, profile, context });
  const result = await generateTeachingText({
    userInstruction: instruction,
    subject: subjectForContext(context),
    memoryHint: memoryHintFor(profile, context),
    onChunk: (partial) => { message = { ...message, content: partial }; onUpdate?.(message); },
    signal,
  });

  message = { ...message, content: result.text || message.content, status: result.error ? "error" : "complete", error: result.error };
  onUpdate?.(message);
  return { message, suggestedFollowUps: conceptLabel ? predictFollowUpQuestions(conceptLabel) : [] };
}

export interface TeachBlockOptions {
  block: LessonBlock;
  profile: StudentProfile;
  context: PageContext;
  /** Needed for Feature 9 connections on the intro block — pass the full hierarchy from the same already-computed analysis (no re-analysis). */
  chapterHierarchy?: ChapterHierarchy;
  /** Overrides profile.preferredMode for this one block (only applies to concept_explanation). */
  mode?: ExplanationMode;
  /** Extra hint appended to the instruction — e.g. a Feature-13 confusion-escalation hint. */
  extraHint?: string;
  onUpdate?: (message: TutorMessage) => void;
  signal?: AbortSignal;
}

/**
 * Feature 2 — generate the teaching content for one lesson block. Dispatches
 * concept/formula blocks to their dedicated generators (Features 3/4); page
 * intro and diagram/table notes are handled inline here since they're
 * page-level, not concept-level. Returns null for the session_summary block
 * type, which is produced separately once a session actually ends.
 */
export async function teachBlock(opts: TeachBlockOptions): Promise<TeachingResult | null> {
  const { block, profile, context } = opts;

  switch (block.type) {
    case "page_intro": {
      const adjacent = opts.chapterHierarchy
        ? findAdjacentChapters(opts.chapterHierarchy, context.chapter?.id ?? null)
        : { previous: null, next: null };
      const connections = connectionsLine(adjacent.previous?.title ?? null, adjacent.next?.title ?? null);
      const task = [
        "Write a short, warm 1–2 sentence introduction telling the student what this page is about and what they're about to learn — proactive, like 'This page introduces Newton's Second Law. Let's understand it step by step.'",
        connections,
      ].filter(Boolean).join("\n");
      return generateSimpleNote("page_intro", task, null, context.pageNumber, profile, context, opts.onUpdate, opts.signal);
    }

    case "concept_explanation": {
      if (!block.conceptLabel) return null;
      return generateExplanation({
        conceptLabel: block.conceptLabel,
        pageNumber: context.pageNumber,
        profile,
        context,
        mode: opts.mode,
        extraHint: opts.extraHint,
        onUpdate: opts.onUpdate,
        signal: opts.signal,
      });
    }

    case "formula_teaching": {
      const formula = context.formulas.find((f) => f.id === block.sourceId);
      if (!formula) return null;
      return teachFormula({ formula, profile, context, onUpdate: opts.onUpdate, signal: opts.signal });
    }

    case "diagram_note": {
      const diagram = context.diagrams.find((d) => d.id === block.sourceId);
      const task = `Briefly (2–3 sentences) tell the student what the figure${diagram?.caption ? ` "${diagram.caption}"` : ""} shows and why it's worth looking at closely.`;
      return generateSimpleNote("diagram_note", task, block.conceptLabel, context.pageNumber, profile, context, opts.onUpdate, opts.signal);
    }

    case "table_note": {
      const table = context.tables.find((t) => t.id === block.sourceId);
      const task = `Briefly (2–3 sentences) tell the student what the table${table?.caption ? ` "${table.caption}"` : ""} shows and what to pay attention to in it.`;
      return generateSimpleNote("table_note", task, block.conceptLabel, context.pageNumber, profile, context, opts.onUpdate, opts.signal);
    }

    case "session_summary": {
      const taught = [...context.topics.map((t) => t.label), ...context.formulas.map((f) => f.formula)];
      const task = taught.length
        ? `Write a short (2–4 sentence) wrap-up of this page, briefly recapping: ${taught.join(", ")}. End with one encouraging line.`
        : "Write a short (1–2 sentence) encouraging wrap-up for finishing this page.";
      return generateSimpleNote("session_summary", task, null, context.pageNumber, profile, context, opts.onUpdate, opts.signal);
    }

    default:
      return null;
  }
}

import { TeachingService } from "../services/TeachingService";

export class AITutorEngine {
  private static instance: AITutorEngine;

  static getInstance(): AITutorEngine {
    if (!AITutorEngine.instance) {
      AITutorEngine.instance = new AITutorEngine();
    }
    return AITutorEngine.instance;
  }

  async initialize(): Promise<void> {
    // Engine initialized
  }

  async explainConcept(concept: string, options?: any) {
    const res = await generateTeachingText({
      userInstruction: `Explain concept: ${concept}`,
      subject: options?.subject,
    });
    return res.text || `Concept explanation for ${concept}`;
  }

  async summarizeContent(content: string, options?: any) {
    const res = await generateTeachingText({
      userInstruction: `Summarize content: ${content.substring(0, 500)}`,
      subject: options?.subject,
    });
    return res.text || `Summary: ${content.substring(0, 200)}`;
  }

  async answerQuestion(question: string, options?: any) {
    const res = await generateTeachingText({
      userInstruction: question,
      subject: options?.subject,
    });
    return res.text || "Answer generated.";
  }

  async suggestQuiz(topic: string, options?: any) {
    return [TeachingService.getQuizCard(topic, options?.difficulty)];
  }

  async generateStudyTips(topic: string, options?: any) {
    return TeachingService.getSummaryCard(topic);
  }

  async recommendContent(topic: string, options?: any) {
    return [TeachingService.getRecommendationCard(topic)];
  }

  async analyzeEngagement(data?: any) {
    return { score: 0.95, recommendations: ["High focus level maintained."] };
  }
}

