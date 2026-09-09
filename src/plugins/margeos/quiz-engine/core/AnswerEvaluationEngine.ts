// @ts-nocheck
// Adaptive Quiz Engine — AnswerEvaluationEngine
// Comprehensive answer evaluation with multiple algorithms

import type {
  Question,
  QuestionType,
  Option,
  MatchingPair,
  AnswerContent,
  AnswerEvaluation,
  AnswerFeedback,
  AnswerCorrection
} from "../models/Answer";
import type { DifficultyLevel } from "../models/Question";

export interface EvaluationContext {
  question: Question;
  userAnswer: AnswerContent;
  rubric?: LongAnswerRubric;
  strictness?: "lenient" | "normal" | "strict";
}

export interface ShortAnswerOptions {
  caseSensitive: boolean;
  trimWhitespace: boolean;
  ignorePunctuation: boolean;
  acceptSynonyms: boolean;
  keywordWeight: number;
  partialMatchThreshold: number;
}

export interface NumericalOptions {
  tolerance: number;
  toleranceType: "absolute" | "relative" | "significant_figures";
  significantFigures?: number;
  acceptUnitVariants: boolean;
}

export interface MatchingOptions {
  ordered: boolean;
  partialCredit: boolean;
  creditPerMatch: number;
}

export interface SequenceOptions {
  partialCredit: boolean;
  creditPerAdjacentSwap: number;
}

export interface LongAnswerRubric {
  criteria: RubricCriterion[];
  totalPoints: number;
  passingPoints: number;
}

export interface RubricCriterion {
  id: string;
  description: string;
  maxPoints: number;
  indicators: RubricIndicator[];
}

export interface RubricIndicator {
  level: number;
  description: string;
  points: number;
}

export class AnswerEvaluationEngine {
  private static instance: AnswerEvaluationEngine;

  private constructor() {}

  static getInstance(): AnswerEvaluationEngine {
    if (!AnswerEvaluationEngine.instance) {
      AnswerEvaluationEngine.instance = new AnswerEvaluationEngine();
    }
    return AnswerEvaluationEngine.instance;
  }

  async evaluate(params: {
    question: Question;
    userAnswer: AnswerContent;
    options?: Partial<ShortAnswerOptions | NumericalOptions | MatchingOptions | SequenceOptions>;
  }): Promise<AnswerEvaluation> {
    const { question, userAnswer } = params;
    const startTime = Date.now();

    let isCorrect = false;
    let isPartiallyCorrect = false;
    let score = 0;
    let maxScore = question.metadata.points;
    let partialCredit: number | undefined;
    let feedback: AnswerFeedback | undefined;
    let corrections: AnswerCorrection[] = [];

    switch (question.type) {
      case "mcq":
        ({ isCorrect, score, partialCredit, corrections } = this.evaluateMCQ(question, userAnswer));
        break;
      case "true_false":
        ({ isCorrect, score } = this.evaluateTrueFalse(question, userAnswer));
        break;
      case "short_answer":
        ({ isCorrect, isPartiallyCorrect, score, partialCredit, corrections } = this.evaluateShortAnswer(
          question,
          userAnswer,
          params.options as Partial<ShortAnswerOptions>
        ));
        break;
      case "long_answer":
        ({ isCorrect, isPartiallyCorrect, score, feedback } = this.evaluateLongAnswer(
          question,
          userAnswer,
          params.options as any
        ));
        break;
      case "numerical":
        ({ isCorrect, isPartiallyCorrect, score, partialCredit, corrections } = this.evaluateNumerical(
          question,
          userAnswer,
          params.options as Partial<NumericalOptions>
        ));
        break;
      case "formula":
        ({ isCorrect, isPartiallyCorrect, score, partialCredit, feedback } = this.evaluateFormula(
          question,
          userAnswer,
          params.options as Partial<NumericalOptions>
        ));
        break;
      case "matching":
        ({ isCorrect, isPartiallyCorrect, score, partialCredit, corrections } = this.evaluateMatching(
          question,
          userAnswer,
          params.options as Partial<MatchingOptions>
        ));
        break;
      case "sequencing":
        ({ isCorrect, isPartiallyCorrect, score, partialCredit, corrections } = this.evaluateSequence(
          question,
          userAnswer,
          params.options as Partial<SequenceOptions>
        ));
        break;
      case "diagram":
        ({ isCorrect, score } = this.evaluateDiagram(question, userAnswer));
        break;
      case "scenario":
        ({ isCorrect, isPartiallyCorrect, score, feedback } = this.evaluateScenario(question, userAnswer));
        break;
      default:
        isCorrect = false;
        score = 0;
    }

    // Generate feedback if not already set
    if (!feedback) {
      feedback = this.generateFeedback(question, userAnswer, isCorrect, isPartiallyCorrect);
    }

    const evaluationTime = Date.now() - startTime;

    return {
      isCorrect,
      isPartiallyCorrect,
      score,
      maxScore,
      partialCredit,
      feedback,
      corrections,
      metadata: {
        evaluationTime,
        algorithm: this.getEvaluationAlgorithm(question.type),
        confidence: this.calculateConfidence(question, isCorrect, isPartiallyCorrect),
        processingSteps: this.getProcessingSteps(question.type)
      }
    };
  }

  private evaluateMCQ(question: Question, answer: AnswerContent): MCQResult {
    if (!question.options || !answer.selectedOptions) {
      return { isCorrect: false, score: 0, corrections: [] };
    }

    const correctOptions = question.options.filter(o => o.isCorrect);
    const selectedIds = new Set(answer.selectedOptions);
    const correctIds = new Set(correctOptions.map(o => o.id));

    // Check for exact match
    if (selectedIds.size === correctIds.size && [...selectedIds].every(id => correctIds.has(id))) {
      return {
        isCorrect: true,
        score: question.metadata.points,
        corrections: []
      };
    }

    // Check for partial credit
    if (question.partialCredit?.enabled) {
      const correctSelections = [...selectedIds].filter(id => correctIds.has(id)).length;
      const incorrectSelections = [...selectedIds].filter(id => !correctIds.has(id)).length;
      const totalCorrect = correctOptions.length;

      let partialScore = (correctSelections / totalCorrect) * question.metadata.points;
      if (question.partialCredit.partialPoints !== undefined) {
        partialScore -= incorrectSelections * question.partialCredit.partialPoints;
      }

      return {
        isCorrect: false,
        score: Math.max(0, partialScore),
        partialCredit: partialScore,
        corrections: this.generateMCQCorrections(question.options, answer.selectedOptions)
      };
    }

    return {
      isCorrect: false,
      score: 0,
      corrections: this.generateMCQCorrections(question.options, answer.selectedOptions)
    };
  }

  private generateMCQCorrections(options: Option[], selected: string[]): AnswerCorrection[] {
    const corrections: AnswerCorrection[] = [];
    const selectedSet = new Set(selected);

    options.forEach(option => {
      const wasSelected = selectedSet.has(option.id);
      if (option.isCorrect && !wasSelected) {
        corrections.push({
          expected: option.text,
          received: "No selection",
          explanation: "This was the correct option",
          severity: "critical"
        });
      } else if (!option.isCorrect && wasSelected) {
        corrections.push({
          expected: "Not selected",
          received: option.text,
          explanation: option.explanation || "This was an incorrect selection",
          severity: "major"
        });
      }
    });

    return corrections;
  }

  private evaluateTrueFalse(question: Question, answer: AnswerContent): SimpleResult {
    if (answer.booleanValue === undefined) {
      return { isCorrect: false, score: 0 };
    }

    const correct = question.correctAnswer as boolean;
    const isCorrect = answer.booleanValue === correct;

    return {
      isCorrect,
      score: isCorrect ? question.metadata.points : 0
    };
  }

  private evaluateShortAnswer(
    question: Question,
    answer: AnswerContent,
    options?: Partial<ShortAnswerOptions>
  ): ShortAnswerResult {
    if (!answer.text || !question.correctAnswer) {
      return { isCorrect: false, isPartiallyCorrect: false, score: 0, corrections: [] };
    }

    const opts: Required<ShortAnswerOptions> = {
      caseSensitive: false,
      trimWhitespace: true,
      ignorePunctuation: false,
      acceptSynonyms: false,
      keywordWeight: 0.5,
      partialMatchThreshold: 0.7,
      ...options
    };

    let userAnswer = answer.text;
    let correctAnswer = question.correctAnswer as string;

    if (opts.trimWhitespace) {
      userAnswer = userAnswer.trim();
      correctAnswer = correctAnswer.trim();
    }

    if (!opts.caseSensitive) {
      userAnswer = userAnswer.toLowerCase();
      correctAnswer = correctAnswer.toLowerCase();
    }

    if (opts.ignorePunctuation) {
      userAnswer = userAnswer.replace(/[^\w\s]/g, "");
      correctAnswer = correctAnswer.replace(/[^\w\s]/g, "");
    }

    // Exact match
    if (userAnswer === correctAnswer) {
      return { isCorrect: true, isPartiallyCorrect: false, score: question.metadata.points, corrections: [] };
    }

    // Partial credit using keywords
    const correctKeywords = this.extractKeywords(correctAnswer);
    const userKeywords = this.extractKeywords(userAnswer);

    const matchedKeywords = userKeywords.filter(k => correctKeywords.includes(k));
    const matchRatio = correctKeywords.length > 0 ? matchedKeywords.length / correctKeywords.length : 0;

    if (matchRatio >= opts.partialMatchThreshold) {
      const partialScore = matchRatio * question.metadata.points * opts.keywordWeight;
      return {
        isCorrect: false,
        isPartiallyCorrect: true,
        score: partialScore,
        partialCredit: partialScore,
        corrections: [{
          expected: correctAnswer,
          received: answer.text,
          explanation: `Partial match with ${(matchRatio * 100).toFixed(0)}% keyword overlap`,
          severity: "minor"
        }]
      };
    }

    return {
      isCorrect: false,
      isPartiallyCorrect: false,
      score: 0,
      corrections: [{
        expected: correctAnswer,
        received: answer.text,
        explanation: "Answer does not match expected response",
        severity: "major"
      }]
    };
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "need", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once"]);
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  private evaluateLongAnswer(
    question: Question,
    answer: AnswerContent,
    rubric?: LongAnswerRubric
  ): LongAnswerResult {
    if (!answer.text) {
      return { isCorrect: false, isPartiallyCorrect: false, score: 0 };
    }

    // Rubric-based evaluation
    if (rubric && rubric.criteria) {
      let totalScore = 0;
      let maxScore = rubric.totalPoints;

      const feedback = {
        summary: "",
        correctAnswer: "",
        explanation: this.generateLongAnswerFeedback(rubric, answer.text)
      };

      // Simplified rubric evaluation
      const wordCount = answer.text.split(/\s+/).length;
      const expectedMinWords = 50;

      if (wordCount < expectedMinWords) {
        totalScore = Math.max(0, (wordCount / expectedMinWords) * rubric.totalPoints * 0.3);
      } else {
        totalScore = rubric.totalPoints * 0.5; // Base score for meeting length requirement
      }

      // Check for key concepts
      const keyConcepts = this.extractKeyConcepts(question.content.text);
      const userConcepts = this.extractKeywords(answer.text);
      const matchedConcepts = keyConcepts.filter(c => userConcepts.some(uc => uc.includes(c.toLowerCase())));
      const conceptRatio = keyConcepts.length > 0 ? matchedConcepts.length / keyConcepts.length : 0;
      totalScore += conceptRatio * rubric.totalPoints * 0.3;

      return {
        isCorrect: totalScore >= rubric.passingPoints,
        isPartiallyCorrect: totalScore > rubric.totalPoints * 0.5,
        score: totalScore,
        feedback
      };
    }

    // Default evaluation
    const wordCount = answer.text.split(/\s+/).length;
    const isCorrect = wordCount >= 50;

    return {
      isCorrect,
      isPartiallyCorrect: wordCount >= 20,
      score: Math.min(question.metadata.points, wordCount / 20)
    };
  }

  private extractKeyConcepts(text: string): string[] {
    // Extract important terms from question
    const words = text.split(/\s+/);
    return words.filter(w => w.length > 5 && /^[A-Z]/.test(w));
  }

  private generateLongAnswerFeedback(rubric: LongAnswerRubric, answer: string): string {
    const feedback = [];
    const wordCount = answer.split(/\s+/).length;

    if (wordCount < 50) {
      feedback.push("Consider expanding your answer with more detail.");
    }
    if (wordCount > 200) {
      feedback.push("Your answer is thorough. Focus on the most relevant points.");
    }

    feedback.push("Review the rubric criteria to ensure all requirements are addressed.");
    return feedback.join(" ");
  }

  private evaluateNumerical(
    question: Question,
    answer: AnswerContent,
    options?: Partial<NumericalOptions>
  ): NumericalResult {
    if (answer.numericalValue === undefined || answer.numericalValue === null) {
      return { isCorrect: false, isPartiallyCorrect: false, score: 0, corrections: [] };
    }

    const opts: Required<NumericalOptions> = {
      tolerance: 0.01,
      toleranceType: "absolute",
      significantFigures: 3,
      acceptUnitVariants: true,
      ...options
    };

    const userValue = answer.numericalValue;
    const correctValue = question.correctAnswer as number;

    let isCorrect = false;
    let isPartiallyCorrect = false;
    let partialScore = 0;

    if (opts.toleranceType === "absolute") {
      isCorrect = Math.abs(userValue - correctValue) <= opts.tolerance;
      if (!isCorrect && Math.abs(userValue - correctValue) <= opts.tolerance * 10) {
        isPartiallyCorrect = true;
        partialScore = question.metadata.points * 0.5;
      }
    } else if (opts.toleranceType === "relative") {
      const relativeError = Math.abs((userValue - correctValue) / correctValue);
      isCorrect = relativeError <= opts.tolerance;
      if (!isCorrect && relativeError <= opts.tolerance * 5) {
        isPartiallyCorrect = true;
        partialScore = question.metadata.points * 0.5;
      }
    }

    const score = isCorrect ? question.metadata.points : (isPartiallyCorrect ? partialScore : 0);

    return {
      isCorrect,
      isPartiallyCorrect,
      score,
      partialCredit: isPartiallyCorrect ? partialScore : undefined,
      corrections: !isCorrect ? [{
        expected: String(correctValue),
        received: String(userValue),
        explanation: isPartiallyCorrect ? "Close but not exact" : "Incorrect numerical value",
        severity: isPartiallyCorrect ? "minor" : "major"
      }] : []
    };
  }

  private evaluateFormula(
    question: Question,
    answer: AnswerContent,
    options?: Partial<NumericalOptions>
  ): FormulaResult {
    // Formula evaluation with step checking
    const result = this.evaluateNumerical(question, answer, options);

    let explanation: AnswerFeedback["explanation"];

    if (result.isCorrect) {
      explanation = "Correct application of the formula.";
      if (question.formulaData?.steps) {
        explanation += " Steps were followed correctly.";
      }
    } else {
      explanation = "Review the formula and ensure each step is calculated correctly.";
    }

    return {
      ...result,
      feedback: {
        summary: result.isCorrect ? "Formula applied correctly" : "Formula application needs review",
        correctAnswer: String(question.correctAnswer),
        explanation,
        steps: question.formulaData?.steps
      }
    };
  }

  private evaluateMatching(
    question: Question,
    answer: AnswerContent,
    options?: Partial<MatchingOptions>
  ): MatchingResult {
    if (!answer.matches || !question.matchingPairs) {
      return { isCorrect: false, isPartiallyCorrect: false, score: 0, corrections: [] };
    }

    const opts: Required<MatchingOptions> = {
      ordered: false,
      partialCredit: true,
      creditPerMatch: 1,
      ...options
    };

    const correctPairs = question.matchingPairs;
    const userMatches = new Map(answer.matches.map(m => [m.leftId, m.rightId]));

    let correctCount = 0;
    const corrections: AnswerCorrection[] = [];

    correctPairs.forEach(pair => {
      const userMatch = userMatches.get(pair.leftId);
      if (userMatch === pair.rightId) {
        correctCount++;
      } else {
        corrections.push({
          expected: `${pair.leftText} → ${pair.rightText}`,
          received: userMatch ? `${pair.leftText} → ${pair.rightText}` : "No match",
          explanation: userMatch ? "Incorrect pairing" : "This pair was not matched",
          severity: "major"
        });
      }
    });

    const isCorrect = correctCount === correctPairs.length;
    let score = 0;
    let partialCredit: number | undefined;

    if (isCorrect) {
      score = question.metadata.points;
    } else if (opts.partialCredit) {
      score = (correctCount / correctPairs.length) * question.metadata.points * opts.creditPerMatch;
      partialCredit = score;
    }

    return {
      isCorrect,
      isPartiallyCorrect: correctCount > 0 && correctCount < correctPairs.length,
      score,
      partialCredit,
      corrections
    };
  }

  private evaluateSequence(
    question: Question,
    answer: AnswerContent,
    options?: Partial<SequenceOptions>
  ): SequenceResult {
    if (!answer.sequence || !question.sequenceItems) {
      return { isCorrect: false, isPartiallyCorrect: false, score: 0, corrections: [] };
    }

    const opts: Required<SequenceOptions> = {
      partialCredit: true,
      creditPerAdjacentSwap: 0.5,
      ...options
    };

    const correctSequence = question.sequenceItems
      .sort((a, b) => a.correctPosition - b.correctPosition)
      .map(item => item.id);

    const userSequence = answer.sequence;

    // Check exact match
    if (JSON.stringify(userSequence) === JSON.stringify(correctSequence)) {
      return {
        isCorrect: true,
        isPartiallyCorrect: false,
        score: question.metadata.points,
        corrections: []
      };
    }

    // Calculate Levenshtein-like distance
    let correctPositions = 0;
    const corrections: AnswerCorrection[] = [];

    for (let i = 0; i < Math.min(userSequence.length, correctSequence.length); i++) {
      if (userSequence[i] === correctSequence[i]) {
        correctPositions++;
      } else {
        corrections.push({
          expected: `Position ${i + 1}: ${correctSequence[i]}`,
          received: `Position ${i + 1}: ${userSequence[i]}`,
          explanation: "Item is in wrong position",
          severity: "major"
        });
      }
    }

    const isPartiallyCorrect = correctPositions > 0;
    let score = 0;
    let partialCredit: number | undefined;

    if (opts.partialCredit) {
      const accuracy = correctPositions / correctSequence.length;
      score = accuracy * question.metadata.points;
      partialCredit = score;
    }

    return {
      isCorrect: false,
      isPartiallyCorrect,
      score,
      partialCredit,
      corrections
    };
  }

  private evaluateDiagram(question: Question, answer: AnswerContent): SimpleResult {
    // Simplified diagram evaluation
    if (!answer.diagramSelections || answer.diagramSelections.length === 0) {
      return { isCorrect: false, score: 0 };
    }

    // In a real implementation, would check against correct hotspots
    const isCorrect = answer.diagramSelections.length > 0;
    return {
      isCorrect,
      score: isCorrect ? question.metadata.points : 0
    };
  }

  private evaluateScenario(question: Question, answer: AnswerContent): ScenarioResult {
    // Scenario evaluation similar to long answer but with focus on problem-solving
    if (!answer.text) {
      return { isCorrect: false, isPartiallyCorrect: false, score: 0 };
    }

    const wordCount = answer.text.split(/\s+/).length;
    const minWords = 30;

    let score = 0;
    let isCorrect = false;
    let isPartiallyCorrect = false;

    if (wordCount >= minWords) {
      score = Math.min(question.metadata.points, wordCount / 15);
      isPartiallyCorrect = true;
      isCorrect = wordCount >= 100;
    }

    return {
      isCorrect,
      isPartiallyCorrect,
      score,
      feedback: {
        summary: isCorrect ? "Comprehensive scenario analysis" : (isPartiallyCorrect ? "Adequate response" : "Response needs more detail"),
        correctAnswer: "",
        explanation: isCorrect ? "Your analysis addresses the scenario effectively." : "Consider providing more detailed analysis of the scenario."
      }
    };
  }

  private generateFeedback(
    question: Question,
    answer: AnswerContent,
    isCorrect: boolean,
    isPartiallyCorrect: boolean
  ): AnswerFeedback {
    const correctAnswer = this.formatCorrectAnswer(question);

    let summary: string;
    if (isCorrect) {
      summary = "Correct!";
    } else if (isPartiallyCorrect) {
      summary = "Partially correct.";
    } else {
      summary = "Incorrect.";
    }

    return {
      summary,
      correctAnswer,
      explanation: question.explanation?.correct || "Review the material.",
      stepByStepSolution: question.explanation?.steps,
      hints: question.hints,
      commonMistakes: question.explanation?.commonMistakes,
      relatedConcepts: question.explanation?.relatedConcepts
    };
  }

  private formatCorrectAnswer(question: Question): string {
    switch (question.type) {
      case "mcq":
        return question.options?.find(o => o.isCorrect)?.text || "";
      case "true_false":
        return String(question.correctAnswer);
      case "short_answer":
      case "long_answer":
      case "scenario":
        return question.correctAnswer as string;
      case "numerical":
      case "formula":
        return String(question.correctAnswer);
      default:
        return "";
    }
  }

  private getEvaluationAlgorithm(type: QuestionType): AnswerEvaluation["metadata"]["algorithm"] {
    const algorithmMap: Record<QuestionType, AnswerEvaluation["metadata"]["algorithm"]> = {
      mcq: "exact_match",
      true_false: "exact_match",
      short_answer: "keyword",
      long_answer: "semantic",
      numerical: "exact_match",
      formula: "formula",
      diagram: "exact_match",
      matching: "exact_match",
      sequencing: "exact_match",
      scenario: "semantic"
    };
    return algorithmMap[type] || "exact_match";
  }

  private calculateConfidence(
    question: Question,
    isCorrect: boolean,
    isPartiallyCorrect: boolean
  ): number {
    let confidence = 0.5;

    if (isCorrect) {
      confidence = 0.9;
    } else if (isPartiallyCorrect) {
      confidence = 0.6;
    }

    // Adjust based on question difficulty
    if (question.metadata.difficulty === "expert") {
      confidence *= 0.9;
    } else if (question.metadata.difficulty === "easy") {
      confidence *= 1.1;
    }

    return Math.min(1, Math.max(0, confidence));
  }

  private getProcessingSteps(type: QuestionType): string[] {
    const stepsMap: Record<QuestionType, string[]> = {
      mcq: ["Parse options", "Compare selections", "Check against correct answers"],
      true_false: ["Evaluate boolean value", "Compare with correct answer"],
      short_answer: ["Normalize text", "Extract keywords", "Compare with reference"],
      long_answer: ["Count words", "Analyze structure", "Check key concepts"],
      numerical: ["Parse numerical value", "Apply tolerance check"],
      formula: ["Parse formula", "Check steps", "Verify result"],
      diagram: ["Parse selections", "Check hotspot matches"],
      matching: ["Parse matches", "Compare pairs"],
      sequencing: ["Parse sequence", "Compare positions"],
      scenario: ["Analyze response", "Evaluate problem-solving"]
    };
    return stepsMap[type] || ["Process answer"];
  }

  destroy(): void {
    AnswerEvaluationEngine.instance = null as any;
  }
}

interface SimpleResult {
  isCorrect: boolean;
  score: number;
}

interface MCQResult extends SimpleResult {
  partialCredit?: number;
  corrections: AnswerCorrection[];
}

interface ShortAnswerResult extends SimpleResult {
  isPartiallyCorrect: boolean;
  partialCredit?: number;
  corrections: AnswerCorrection[];
}

interface LongAnswerResult extends SimpleResult {
  isPartiallyCorrect: boolean;
  feedback?: AnswerFeedback;
}

interface NumericalResult extends SimpleResult {
  isPartiallyCorrect: boolean;
  partialCredit?: number;
  corrections: AnswerCorrection[];
}

interface FormulaResult extends NumericalResult {
  feedback?: AnswerFeedback;
}

interface MatchingResult extends SimpleResult {
  isPartiallyCorrect: boolean;
  partialCredit?: number;
  corrections: AnswerCorrection[];
}

interface SequenceResult extends SimpleResult {
  isPartiallyCorrect: boolean;
  partialCredit?: number;
  corrections: AnswerCorrection[];
}

interface ScenarioResult extends SimpleResult {
  isPartiallyCorrect: boolean;
  feedback?: AnswerFeedback;
}

export default AnswerEvaluationEngine;
