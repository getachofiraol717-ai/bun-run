// Smart PDF Engine — learning path heuristics
import type { Chapter } from "../types/Chapter";
import type { LearningLevel, LearningPathStep } from "../types/LearningPath";

/**
 * Bucket a chapter into beginner/intermediate/advanced based on its position
 * in the book (early chapters are assumed foundational) and depth (deeper
 * subsections tend to cover more advanced sub-topics).
 */
export function levelForChapter(indexInBook: number, totalChapters: number, depth: number): LearningLevel {
  if (totalChapters <= 1) return "beginner";
  const positionRatio = indexInBook / Math.max(1, totalChapters - 1);
  if (depth >= 2 || positionRatio > 0.66) return "advanced";
  if (depth === 1 || positionRatio > 0.33) return "intermediate";
  return "beginner";
}

let stepCounter = 0;
export function nextStepId(): string {
  stepCounter += 1;
  return `step-${stepCounter}-${Date.now().toString(36)}`;
}

/** Build one ordered LearningPathStep from a chapter and the topics anchored to it. */
export function buildStep(
  chapter: Chapter,
  order: number,
  level: LearningLevel,
  topicIds: string[]
): LearningPathStep {
  return {
    id: nextStepId(),
    order,
    title: chapter.title,
    level,
    chapterId: chapter.id,
    topicIds,
    pageStart: chapter.pageStart,
    pageEnd: chapter.pageEnd,
    completed: false,
  };
}
