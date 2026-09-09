import { supabase } from "@/integrations/supabase/client";
import type { Lesson, LessonCard } from "../types/Lesson";
import type { StudentContext } from "../types/StudentContext";
import type { SubjectType } from "../types/SubjectType";
import type { Difficulty } from "../types/Lesson";

interface RequestArgs {
  question: string;
  subject: SubjectType;
  difficulty: Difficulty;
  context: StudentContext;
  history?: { role: "user" | "assistant"; content: string }[];
}

// Calls the ai-tutor-lesson edge function which returns { lesson: Lesson }.
export async function requestLesson(args: RequestArgs): Promise<Lesson> {
  const { data, error } = await supabase.functions.invoke("ai-tutor-lesson", {
    body: args,
  });
  if (error) throw new Error(error.message || "Lesson request failed");
  const lesson = (data as any)?.lesson as Lesson | undefined;
  if (!lesson || !Array.isArray(lesson.cards)) {
    throw new Error("Malformed lesson response");
  }
  // Ensure ids exist for every card
  lesson.cards = lesson.cards.map((c: LessonCard, i: number) => ({
    ...c,
    id: c.id || `card-${i}-${Date.now()}`,
  }));
  return lesson;
}
