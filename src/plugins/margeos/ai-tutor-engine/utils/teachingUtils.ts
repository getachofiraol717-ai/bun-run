// AI Tutor Engine — teachingUtils (Features 9 + 12)
import type { Chapter, ChapterHierarchy } from "@/plugins/margeos/smart-pdf-engine";
import type { LessonBlock } from "../models/LessonPlan";
import type { PageContext } from "../models/TeachingSession";

// Caps keep a single page's lesson plan small and digestible (Feature 12 —
// "prevent information overload"), even if Smart PDF Engine detected far
// more topics/formulas than a student should tackle in one sitting.
const MAX_TOPIC_BLOCKS = 6;
const MAX_FORMULA_BLOCKS = 5;
const MAX_DIAGRAM_BLOCKS = 3;
const MAX_TABLE_BLOCKS = 3;

let blockCounter = 0;
function nextBlockId(): string {
  blockCounter += 1;
  return `block-${blockCounter}-${Date.now().toString(36)}`;
}

function block(order: number, type: LessonBlock["type"], conceptLabel: string | null, sourceId: string | null, title: string): LessonBlock {
  return { id: nextBlockId(), order, type, conceptLabel, sourceId, title, status: "not_started", messageId: null };
}

/** Feature 12 — break a page's Smart PDF Engine context into small, ordered, one-concept-at-a-time blocks. */
export function buildLessonBlocks(context: PageContext): LessonBlock[] {
  const blocks: LessonBlock[] = [];
  let order = 0;

  blocks.push(block(order++, "page_intro", null, null, context.chapter ? `Introduction: ${context.chapter.title}` : "Page overview"));

  // Topics already arrive sorted by weight (Task 1's TopicExtractor) — take the strongest few.
  for (const topic of context.topics.slice(0, MAX_TOPIC_BLOCKS)) {
    blocks.push(block(order++, "concept_explanation", topic.label, topic.id, topic.label));
  }

  for (const formula of context.formulas.slice(0, MAX_FORMULA_BLOCKS)) {
    blocks.push(block(order++, "formula_teaching", formula.formula, formula.id, formula.formula));
  }

  for (const diagram of context.diagrams.slice(0, MAX_DIAGRAM_BLOCKS)) {
    blocks.push(block(order++, "diagram_note", diagram.caption, diagram.id, diagram.caption ?? "Figure on this page"));
  }

  for (const table of context.tables.slice(0, MAX_TABLE_BLOCKS)) {
    blocks.push(block(order++, "table_note", table.caption, table.id, table.caption ?? "Table on this page"));
  }

  blocks.push(block(order++, "session_summary", null, null, "Page summary"));
  return blocks;
}

// ── Feature 9 — concept connections ─────────────────────────
export interface ChapterConnections {
  previous: Chapter | null;
  next: Chapter | null;
}

/** Previous/next top-level-ish chapter relative to the current one, in document order — using the already-built hierarchy, no re-analysis. */
export function findAdjacentChapters(hierarchy: ChapterHierarchy, currentChapterId: string | null): ChapterConnections {
  if (!currentChapterId) return { previous: null, next: null };
  const idx = hierarchy.flatIndex.findIndex((c) => c.id === currentChapterId);
  if (idx === -1) return { previous: null, next: null };
  const current = hierarchy.flatIndex[idx];
  const previous = [...hierarchy.flatIndex.slice(0, idx)].reverse().find((c) => c.depth === current.depth) ?? null;
  const next = hierarchy.flatIndex.slice(idx + 1).find((c) => c.depth === current.depth) ?? null;
  return { previous, next };
}
