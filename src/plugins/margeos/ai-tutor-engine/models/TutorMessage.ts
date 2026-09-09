// AI Tutor Engine — TutorMessage model
import type { ExplanationMode } from "./StudentProfile";
import type { LearningStyle } from "./LearningStyle";

export type TutorMessageType =
  | "page_intro"
  | "concept_explanation"
  | "formula_teaching"
  | "example"
  | "analogy"
  | "diagram_note"
  | "table_note"
  | "session_summary"
  | "prediction_answer";

export type TutorMessageStatus = "pending" | "streaming" | "complete" | "error";

export interface TutorMessage {
  id: string;
  type: TutorMessageType;
  /** Markdown content — empty while status is "pending"/"streaming". */
  content: string;
  status: TutorMessageStatus;
  error: string | null;
  /** What this block is about, e.g. a Topic.label or Formula.formula — null for page-level blocks (intro/summary). */
  conceptLabel: string | null;
  pageNumber: number;
  mode: ExplanationMode;
  ageBand: string;
  learningStyle: LearningStyle;
  createdAt: number;
}

let messageCounter = 0;
export function nextTutorMessageId(): string {
  messageCounter += 1;
  return `tutor-msg-${messageCounter}-${Date.now().toString(36)}`;
}
