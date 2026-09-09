import { detectSubject } from "./SubjectDetector";
import { detectDifficulty } from "./DifficultyDetector";
import { pushLesson, setState, getState } from "../store/aiTutorStore";
import type { Lesson, LessonCard } from "../types/Lesson";
import type { StudentContext } from "../types/StudentContext";
import { supabase } from "@/integrations/supabase/client";
import { generateTeachingText } from "../services/AIConversationService";
import { generateQuizData } from "../generators/QuizGenerator";
import { generateFlashcardData } from "../generators/FlashcardGenerator";
import { generateFormulaData } from "../generators/FormulaGenerator";
import { generateSummaryData } from "../generators/SummaryGenerator";

export interface AskArgs {
  question: string;
  subjectHint?: string;
  context?: StudentContext;
  documentContext?: any;
  history?: { role: "user" | "assistant"; content: string }[];
  abortSignal?: AbortSignal;
}

export async function ask(args: AskArgs): Promise<Lesson> {
  const context = { ...getState().context, ...(args.context || {}) };
  const subject = detectSubject(args.question, args.subjectHint);
  const difficulty = detectDifficulty(args.question, context.grade);
  setState({ loading: true, error: null, context });

  try {
    const qLower = args.question.toLowerCase();
    const isFormulaReq = qLower.includes("formula") || qLower.includes("equation") || qLower.includes("derive");
    const isExampleReq = qLower.includes("example") || qLower.includes("worked") || qLower.includes("step-by-step");
    const isQuizReq = qLower.includes("quiz") || qLower.includes("check") || qLower.includes("questions");
    const isFlashcardReq = qLower.includes("flashcard") || qLower.includes("card") || qLower.includes("revision");
    const isConceptReq = qLower.includes("concept") || qLower.includes("explain") || (!isFormulaReq && !isQuizReq && !isFlashcardReq);

    // Call AI conversation service for authoritative explanation
    const result = await generateTeachingText({
      userInstruction: args.question,
      subject,
      pdfContent: args.documentContext?.pdfText,
      signal: args.abortSignal,
    });

    const bodyText = result.text || "Interactive lesson generated.";
    const topic = args.question.replace(/^(explain|derive|provide|create|generate|teach me about|what is|how does)\s+/i, "").slice(0, 60).trim() || subject;
    const now = Date.now();

    // Create the clean, authentic AI lesson card from the generated content
    const cards: LessonCard[] = [
      {
        id: `card_exp_${now}`,
        type: "explanation",
        body: bodyText,
        title: topic,
      } as any,
    ];

    const lesson: Lesson = {
      id: `lesson_${now}`,
      title: args.question.slice(0, 75),
      subject,
      difficulty,
      cards,
      createdAt: now,
    };

    pushLesson(lesson);
    setState({ loading: false });

    // Fire-and-forget analytics
    try {
      await supabase.from("analytics_events").insert({
        event_type: "ai_tutor_lesson",
        event_data: {
          subject,
          difficulty,
          cards: lesson.cards.length,
          features: {
            concept: isConceptReq,
            formula: isFormulaReq,
            example: isExampleReq,
            quiz: isQuizReq,
            flashcard: isFlashcardReq,
          }
        } as any,
        page: "/ai-tutor",
      } as any);
    } catch { /* ignore */ }

    return lesson;
  } catch (e: any) {
    setState({ loading: false, error: e?.message || "Failed to generate lesson" });
    throw e;
  }
}


