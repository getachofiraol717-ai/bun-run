// Smart PDF Engine — Learning Path types (Feature 8)

export type LearningLevel = "beginner" | "intermediate" | "advanced";

export interface LearningPathStep {
  id: string;
  order: number;
  title: string;
  level: LearningLevel;
  /** Chapter.id this step is anchored to, if any. */
  chapterId: string | null;
  /** Topic.id[] this step focuses on. */
  topicIds: string[];
  pageStart: number;
  pageEnd: number;
  completed: boolean;
}

export interface LearningPath {
  beginner: LearningPathStep[];
  intermediate: LearningPathStep[];
  advanced: LearningPathStep[];
}

/** Flatten a LearningPath into a single ordered sequence across all levels. */
export function flattenLearningPath(path: LearningPath): LearningPathStep[] {
  return [...path.beginner, ...path.intermediate, ...path.advanced].sort((a, b) => a.order - b.order);
}
