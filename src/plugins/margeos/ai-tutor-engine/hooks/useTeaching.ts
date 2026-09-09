import { useState } from "react";
import { TeachingService } from "../services/TeachingService";

export function useTeaching() {
  const [loading, setLoading] = useState(false);

  const teach = (topic: string) => {
    setLoading(true);
    const summary = TeachingService.getSummaryCard(topic);
    const quiz = TeachingService.getQuizCard(topic);
    const flashcard = TeachingService.getFlashcardCard(topic);
    setLoading(false);
    return { summary, quiz, flashcard };
  };

  return { teach, loading };
}
