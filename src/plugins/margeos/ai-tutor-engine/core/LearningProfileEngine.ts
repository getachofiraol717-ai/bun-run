import { LearningAnalyticsService, StudentAnalytics } from "../services/LearningAnalyticsService";

export class LearningProfileEngine {
  private static service = new LearningAnalyticsService();

  static getProfile(): StudentAnalytics {
    return this.service.getAnalytics();
  }

  static recordOutcome(concept: string, mastered: boolean) {
    this.service.recordConceptOutcome(concept, mastered);
  }
}
