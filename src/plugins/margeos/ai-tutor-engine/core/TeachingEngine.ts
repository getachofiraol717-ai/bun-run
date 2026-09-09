import { TeachingService } from "../services/TeachingService";

export class TeachingEngine {
  static teachTopic(topic: string, mode: string = "Teacher Mode") {
    return {
      summary: TeachingService.getSummaryCard(topic),
      quiz: TeachingService.getQuizCard(topic),
      flashcard: TeachingService.getFlashcardCard(topic),
      visual: TeachingService.getVisualCard(topic),
      recommendations: TeachingService.getRecommendationCard(topic),
    };
  }
}
