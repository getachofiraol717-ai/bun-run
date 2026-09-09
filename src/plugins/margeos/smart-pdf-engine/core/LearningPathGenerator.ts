// Smart PDF Engine — LearningPathGenerator (Feature 8)
import type { ChapterHierarchy } from "../types/Chapter";
import type { TopicGraph } from "../types/Topic";
import type { LearningPath } from "../types/LearningPath";
import { buildStep, levelForChapter } from "../utils/learningPathUtils";

export interface LearningPathOptions {
  chapters: ChapterHierarchy;
  topics: TopicGraph;
}

/** Topics whose page range overlaps the chapter's page range. */
function topicsForChapter(topics: TopicGraph, pageStart: number, pageEnd: number): string[] {
  return topics.nodes
    .filter((t) => t.pages.some((p) => p >= pageStart && p < pageEnd))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map((t) => t.id);
}

/**
 * Builds the path from top-level chapters in document order. Using only
 * top-level chapters (not every subsection) keeps the path readable —
 * subsections still feed in indirectly via their topics, which get
 * attributed to the parent chapter's page range.
 */
export function generateLearningPath(opts: LearningPathOptions): LearningPath {
  const topLevel = opts.chapters.tree.length > 0 ? opts.chapters.tree : opts.chapters.flatIndex;
  const path: LearningPath = { beginner: [], intermediate: [], advanced: [] };

  topLevel.forEach((chapter, idx) => {
    const level = levelForChapter(idx, topLevel.length, chapter.depth);
    const topicIds = topicsForChapter(opts.topics, chapter.pageStart, chapter.pageEnd);
    const step = buildStep(chapter, idx + 1, level, topicIds);
    path[level].push(step);
  });

  // Renumber order sequentially across the whole path (beginner → intermediate → advanced)
  // so consumers can treat `order` as "step N of total" regardless of level.
  let order = 1;
  for (const level of ["beginner", "intermediate", "advanced"] as const) {
    for (const step of path[level]) step.order = order++;
  }

  return path;
}
