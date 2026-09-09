import { generateSummaryData } from "../generators/SummaryGenerator";
import { generateQuizData } from "../generators/QuizGenerator";
import { generateFlashcardData } from "../generators/FlashcardGenerator";
import { generateFormulaData } from "../generators/FormulaGenerator";
import { generateDiagramData } from "../generators/DiagramGenerator";
import { generateVisualData } from "../generators/VisualGenerator";
import { generateCodingData } from "../generators/CodingExplanationGenerator";
import { generateRecommendationData } from "../generators/RecommendationGenerator";

export class TeachingService {
  static getSummaryCard(topic: string, contextText?: string) {
    return generateSummaryData({ topic, contextText });
  }

  static getQuizCard(topic: string, difficulty?: "Beginner" | "Intermediate" | "Advanced") {
    return generateQuizData({ topic, difficulty });
  }

  static getFlashcardCard(topic: string, concept?: string) {
    return generateFlashcardData({ topic, concept });
  }

  static getFormulaCard(formulaTitle: string, latex?: string) {
    return generateFormulaData({ formulaTitle, latex });
  }

  static getDiagramCard(title: string) {
    return generateDiagramData({ title });
  }

  static getVisualCard(topic: string, type?: "mindmap" | "flowchart" | "conceptmap") {
    return generateVisualData({ topic, type });
  }

  static getCodingCard(language: string, code: string, topic?: string) {
    return generateCodingData({ language, code, topic });
  }

  static getRecommendationCard(topic: string) {
    return generateRecommendationData({ topic });
  }
}
