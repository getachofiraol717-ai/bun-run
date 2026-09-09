import type { FlashcardCardData } from "../cards/FlashcardCard";

export interface FlashcardOptions {
  topic: string;
  concept?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
}

export function generateFlashcardData(opts: FlashcardOptions): FlashcardCardData {
  return {
    question: `What is the core definition and significance of ${opts.concept || opts.topic}?`,
    answer: `${opts.concept || opts.topic} is a fundamental concept describing system behavior under specified conditions. It allows precise modeling and predictive problem-solving.`,
    difficulty: opts.difficulty || "Medium",
    memoryHint: `Associate ${opts.concept || opts.topic} with its primary real-world visual analogy or standard equation!`,
    subject: opts.topic
  };
}
