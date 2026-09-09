import { TeachingService } from "../services/TeachingService";

export class RecommendationEngine {
  static getRecommendations(topic: string) {
    return TeachingService.getRecommendationCard(topic);
  }
}
