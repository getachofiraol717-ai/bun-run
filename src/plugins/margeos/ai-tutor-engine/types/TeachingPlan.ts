import type { Lesson } from "./Lesson";
export interface TeachingPlan {
  subject: import("./SubjectType").SubjectType;
  difficulty: import("./Lesson").Difficulty;
  strategy: "explain-first" | "example-first" | "practice-first" | "story-first";
  steps: string[];
}
export interface TutorResponse {
  lesson: Lesson;
  plan: TeachingPlan;
}
