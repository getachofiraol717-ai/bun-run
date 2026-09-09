import { TeachingService } from "../services/TeachingService";

export class ResponseCardEngine {
  static createCard(cardType: string, topic: string, extraData?: any) {
    switch (cardType) {
      case "concept":
        return { type: "concept", data: { title: topic, definition: `Definition and key insights for ${topic}` } };
      case "formula":
        return { type: "formula", data: TeachingService.getFormulaCard(topic, extraData?.latex) };
      case "summary":
        return { type: "summary", data: TeachingService.getSummaryCard(topic) };
      case "quiz":
        return { type: "quiz", data: TeachingService.getQuizCard(topic) };
      case "flashcard":
        return { type: "flashcard", data: TeachingService.getFlashcardCard(topic) };
      case "coding":
        return { type: "coding", data: TeachingService.getCodingCard(extraData?.language || "javascript", extraData?.code || "", topic) };
      case "diagram":
        return { type: "diagram", data: TeachingService.getDiagramCard(topic) };
      case "visual":
        return { type: "visual", data: TeachingService.getVisualCard(topic) };
      default:
        return { type: "summary", data: TeachingService.getSummaryCard(topic) };
    }
  }
}
