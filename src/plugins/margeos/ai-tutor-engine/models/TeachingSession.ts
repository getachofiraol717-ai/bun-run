// AI Tutor Engine — TeachingSession model
import type { Chapter, Diagram, Formula, PDFTable, Topic } from "@/plugins/margeos/smart-pdf-engine";
import type { LessonPlan } from "./LessonPlan";
import type { TutorMessage } from "./TutorMessage";

/**
 * Feature 1 — Page Awareness. Every field here is read directly from an
 * already-computed Smart PDF Engine PDFAnalysisResult (see
 * ContextMemoryService) — nothing in this engine re-analyzes the PDF.
 */
export interface PageContext {
  documentId: string;
  pageNumber: number;
  chapter: Chapter | null;
  topics: Topic[];
  formulas: Formula[];
  diagrams: Diagram[];
  tables: PDFTable[];
}

export type TeachingSessionStatus = "idle" | "planning" | "teaching" | "summarizing" | "complete";

export interface ConfusionState {
  /** Number of times the student re-requested an explanation for this concept, in this session. */
  byConcept: Record<string, number>;
}

export interface TeachingSession {
  id: string;
  documentId: string;
  pageNumber: number;
  status: TeachingSessionStatus;
  context: PageContext | null;
  lessonPlan: LessonPlan | null;
  messages: TutorMessage[];
  confusion: ConfusionState;
  startedAt: number;
  endedAt: number | null;
}

export function createEmptySession(documentId: string, pageNumber: number): TeachingSession {
  return {
    id: `session-${documentId}-${pageNumber}-${Date.now().toString(36)}`,
    documentId,
    pageNumber,
    status: "idle",
    context: null,
    lessonPlan: null,
    messages: [],
    confusion: { byConcept: {} },
    startedAt: Date.now(),
    endedAt: null,
  };
}
