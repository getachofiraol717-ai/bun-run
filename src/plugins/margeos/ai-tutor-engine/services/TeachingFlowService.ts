// AI Tutor Engine — TeachingFlowService (Feature 12)
import type { LessonBlock, LessonPlan } from "../models/LessonPlan";

function updateBlock(plan: LessonPlan, blockId: string, patch: Partial<LessonBlock>): LessonPlan {
  return { ...plan, blocks: plan.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) };
}

export function markBlockInProgress(plan: LessonPlan, blockId: string): LessonPlan {
  return updateBlock(plan, blockId, { status: "in_progress" });
}

export function markBlockTaught(plan: LessonPlan, blockId: string, messageId: string): LessonPlan {
  return updateBlock(plan, blockId, { status: "taught", messageId });
}

export function markBlockSkipped(plan: LessonPlan, blockId: string): LessonPlan {
  return updateBlock(plan, blockId, { status: "skipped" });
}

/** The block currently being taught, or — if none — the next untaught one in order. Null once the whole plan is done. */
export function currentOrNextBlock(plan: LessonPlan): LessonBlock | null {
  const inProgress = plan.blocks.find((b) => b.status === "in_progress");
  if (inProgress) return inProgress;
  return [...plan.blocks].sort((a, b) => a.order - b.order).find((b) => b.status === "not_started") ?? null;
}

export function isLessonComplete(plan: LessonPlan): boolean {
  return plan.blocks.every((b) => b.status === "taught" || b.status === "skipped");
}
