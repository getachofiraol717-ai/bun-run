export type SubjectType =
  | "programming"
  | "mathematics"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "language"
  | "pdf"
  | "general";

export const SUBJECT_LABELS: Record<SubjectType, string> = {
  programming: "Programming",
  mathematics: "Mathematics",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  history: "History",
  geography: "Geography",
  language: "Language",
  pdf: "Document",
  general: "General",
};
