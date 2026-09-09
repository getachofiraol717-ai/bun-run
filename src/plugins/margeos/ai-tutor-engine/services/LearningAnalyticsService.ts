export interface StudentAnalytics {
  ageBand: string;
  learningSpeed: "Slow" | "Normal" | "Fast";
  knowledgeLevel: "Beginner" | "Intermediate" | "Advanced";
  weakConcepts: string[];
  strongConcepts: string[];
  totalSessions: number;
}

export class LearningAnalyticsService {
  private analytics: StudentAnalytics = {
    ageBand: "High School",
    learningSpeed: "Normal",
    knowledgeLevel: "Intermediate",
    weakConcepts: [],
    strongConcepts: [],
    totalSessions: 1,
  };

  getAnalytics(): StudentAnalytics {
    return { ...this.analytics };
  }

  recordConceptOutcome(concept: string, isMastered: boolean) {
    if (isMastered) {
      if (!this.analytics.strongConcepts.includes(concept)) {
        this.analytics.strongConcepts.push(concept);
      }
      this.analytics.weakConcepts = this.analytics.weakConcepts.filter((c) => c !== concept);
    } else {
      if (!this.analytics.weakConcepts.includes(concept)) {
        this.analytics.weakConcepts.push(concept);
      }
    }
  }
}
