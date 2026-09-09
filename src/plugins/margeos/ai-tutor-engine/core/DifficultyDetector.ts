import type { Difficulty } from "../types/Lesson";

export function detectDifficulty(text: string, grade?: number): Difficulty {
  const t = (text || "").toLowerCase();
  if (/\b(advanced|prove|derive|complex|graduate|phd|research)\b/.test(t)) return "advanced";
  if (/\b(basic|simple|beginner|introduction|what is|explain like|eli5|for kids)\b/.test(t)) return "beginner";
  if (typeof grade === "number") {
    if (grade <= 6) return "beginner";
    if (grade >= 11) return "advanced";
    return "intermediate";
  }
  return "intermediate";
}
