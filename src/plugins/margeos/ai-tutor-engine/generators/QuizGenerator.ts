import type { QuizCardData, QuizQuestion } from "../cards/QuizCard";
import type { QuizSourceType } from "@/types/canonicalQuiz";

export interface QuizGenOptions {
  topic: string;
  subject?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Easy" | "Medium" | "Hard";
  count?: number;
  sourceType?: QuizSourceType;
  sourceDocumentId?: string;
  sourcePage?: number;
}

export function generateQuizData(opts: QuizGenOptions): QuizCardData {
  const count = opts.count || 3;
  const topic = opts.topic || "Core Concept";
  const questions: QuizQuestion[] = [
    {
      question: `What is the fundamental concept underlying ${topic}?`,
      options: [
        `The relationship between force and acceleration`,
        `The conservation principle inherent to system energy`,
        `The structural definition established in the core theory`,
        `None of the above`
      ],
      correctAnswer: 2,
      explanation: `The structural definition forms the cornerstone of ${topic}, serving as the baseline for all subsequent calculations.`,
      hint: `Recall the introductory definition given in chapter notes.`,
      learningObjective: `${topic} - Fundamental Concepts`
    },
    {
      question: `How does changing system variables affect the outcome in ${topic}?`,
      options: [
        `Outcome scales linearly with input magnitude`,
        `Inverse square relationship holds true under ideal conditions`,
        `It remains completely constant regardless of input`,
        `It depends dynamically on boundary factors`
      ],
      correctAnswer: 1,
      explanation: `Inverse square relationship is the standard theoretical model applied when boundary conditions are satisfied.`,
      hint: `Think about how distance or intensity scales in this field.`,
      learningObjective: `${topic} - Variable Analysis`
    },
    {
      question: `Which of the following represents a common mistake when solving problems in ${topic}?`,
      options: [
        `Checking dimensional consistency`,
        `Forgetting to convert units to SI standards`,
        `Drawing a reference diagram first`,
        `Isolating variables before plugging in numbers`
      ],
      correctAnswer: 1,
      explanation: `Unit conversion errors are responsible for the vast majority of calculation mistakes. Always standardize units first!`,
      hint: `Pay attention to units like km/h vs m/s or grams vs kilograms.`,
      learningObjective: `${topic} - Error Avoidance`
    }
  ];

  return {
    title: `Adaptive Quiz: ${topic}`,
    subject: opts.subject || "General",
    topic,
    difficulty: (opts.difficulty as any) || "Medium",
    sourceType: opts.sourceType || "AI_TUTOR",
    sourceDocumentId: opts.sourceDocumentId,
    sourcePage: opts.sourcePage,
    learningObjectives: [
      `${topic} - Fundamental Concepts`,
      `${topic} - Variable Analysis`,
      `${topic} - Error Avoidance`
    ],
    questions: questions.slice(0, count)
  };
}
