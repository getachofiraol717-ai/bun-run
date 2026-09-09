// AI Tutor Engine — LessonPlan model (Feature 12 — micro learning)
import type { TutorMessageType } from "./TutorMessage";

export type LessonBlockStatus = "not_started" | "in_progress" | "taught" | "skipped";

export interface LessonBlock {
  id: string;
  order: number;
  type: TutorMessageType;
  /** Topic.label / Formula.formula / Diagram.caption / Table.caption this block teaches — null for page-level blocks. */
  conceptLabel: string | null;
  /** Smart PDF Engine entity id this block is anchored to (Topic.id / Formula.id / Diagram.id / Table.id), if any. */
  sourceId: string | null;
  title: string;
  status: LessonBlockStatus;
  /** Set once a TutorMessage has actually been generated for this block. */
  messageId: string | null;
}

export interface LessonPlan {
  documentId: string;
  pageNumber: number;
  blocks: LessonBlock[];
  generatedAt: number;
}

export function lessonPlanProgress(plan: LessonPlan): { taught: number; total: number; percent: number } {
  const total = plan.blocks.length;
  const taught = plan.blocks.filter((b) => b.status === "taught" || b.status === "skipped").length;
  return { taught, total, percent: total === 0 ? 0 : Math.round((taught / total) * 100) };
}

export function nextUntaughtBlock(plan: LessonPlan): LessonBlock | null {
  return plan.blocks.find((b) => b.status === "not_started") ?? null;
}
