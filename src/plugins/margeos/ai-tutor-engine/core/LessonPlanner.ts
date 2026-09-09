// AI Tutor Engine — LessonPlanner (Feature 12)
import { buildLessonBlocks } from "../utils/teachingUtils";
import type { LessonPlan } from "../models/LessonPlan";
import type { PageContext } from "../models/TeachingSession";

export function planLesson(context: PageContext): LessonPlan {
  return {
    documentId: context.documentId,
    pageNumber: context.pageNumber,
    blocks: buildLessonBlocks(context),
    generatedAt: Date.now(),
  };
}
