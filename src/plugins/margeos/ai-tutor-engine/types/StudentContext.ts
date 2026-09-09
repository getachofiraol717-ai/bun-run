import type { SubjectType } from "./SubjectType";
import type { Difficulty } from "./Lesson";
export type { SubjectType, Difficulty };
export interface StudentContext {
  userId?: string;
  grade?: number;
  language?: string;
  preferredStyle?: "visual" | "textual" | "practical" | "mixed";
  recentTopics?: string[];
  activePdfTitle?: string;
}
