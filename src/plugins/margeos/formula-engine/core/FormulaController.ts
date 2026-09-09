// Formula Engine — FormulaController
// Central orchestrator for formula processing
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type {
  EnrichedFormula,
  AgeBand,
  LearningStyle,
  ExplanationMode,
  FormulaGenerationInput,
  FormulaAnalysisResult,
  PracticeQuestion,
  VisualRepresentation,
} from "../models/FormulaModels";
import { classifyFormula, suggestAgeAppropriateDifficulty, adaptClassificationForLearningStyle } from "./FormulaClassifier";
import { analyzeVariables, enrichExplanationWithVariables } from "./VariableAnalyzer";
import { generateExplanation, generateMultipleModeExplanations, type ExplanationConfig } from "./FormulaExplainer";
import { solveFormula, generateWorkedExample, verifySolution } from "./FormulaSolver";
import { generateExamples } from "./ExampleGenerator";
import { generatePracticeQuestions, createPracticeSession, type PracticeSession } from "./PracticeGenerator";
import { getCommonMistakes, type MistakeAnalysis } from "./MistakeAnalyzer";
import { assessDifficulty, generateAnalyticsForFormula, adaptDifficulty } from "./FormulaDifficultyEngine";

export interface FormulaControllerConfig {
  ageBand: AgeBand;
  learningStyle: LearningStyle;
  explanationMode: ExplanationMode;
  practiceCount: number;
  enableVisualRepresentations: boolean;
  enableMemoryTips: boolean;
}

const DEFAULT_CONFIG: FormulaControllerConfig = {
  ageBand: "14-16",
  learningStyle: "mixed",
  explanationMode: "detailed",
  practiceCount: 5,
  enableVisualRepresentations: true,
  enableMemoryTips: true
};

export interface FormulaEnrichmentResult {
  enrichedFormula: EnrichedFormula;
  practiceQuestions: PracticeQuestion[];
  mistakeAnalysis: MistakeAnalysis;
  config: FormulaControllerConfig;
}

/**
 * Main controller for enriching a formula with all learning artifacts.
 * This is the primary entry point for transforming a detected formula
 * into a complete learning experience.
 */
export function enrichFormula(
  formula: Formula,
  config?: Partial<FormulaControllerConfig>
): FormulaEnrichmentResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Step 1: Classify the formula
  const classification = classifyFormula(formula.formula, formula.subject);
  const adaptedClassification = adaptClassificationForLearningStyle(classification, cfg.learningStyle);

  // Step 2: Suggest age-appropriate difficulty if not set
  const difficulty = formula.difficulty || suggestAgeAppropriateDifficulty(adaptedClassification, cfg.ageBand);

  // Step 3: Analyze variables
  const varAnalysis = analyzeVariables(formula, cfg.ageBand);

  // Step 4: Generate explanations in multiple modes
  const explanationConfig: Partial<ExplanationConfig> = {
    ageBand: cfg.ageBand,
    learningStyle: cfg.learningStyle,
    mode: cfg.explanationMode,
    includeExamples: true,
    includeMistakes: true,
    includeRealWorld: true
  };

  const baseExplanation = generateExplanation(formula, explanationConfig);
  const enrichedBase = enrichExplanationWithVariables(baseExplanation, varAnalysis);
  const explanationModes = generateMultipleModeExplanations(formula, explanationConfig);

  // Step 5: Generate worked examples
  const workedExamples = generateExamples(formula, {
    ageBand: cfg.ageBand,
    learningStyle: cfg.learningStyle,
    count: 3
  });

  // Step 6: Generate practice questions
  const practiceQuestions = generatePracticeQuestions(formula, {
    ageBand: cfg.ageBand,
    difficulty,
    count: cfg.practiceCount,
    includeHints: true,
    includeMultipleChoice: true
  });

  // Step 7: Analyze common mistakes
  const mistakeAnalysis = getCommonMistakes(formula);

  // Step 8: Generate visual representations
  const visualRepresentations = cfg.enableVisualRepresentations
    ? generateVisualRepresentations(formula, cfg.ageBand)
    : [];

  // Step 9: Generate memory tips
  const memoryTips = cfg.enableMemoryTips
    ? generateMemoryTips(formula, cfg.ageBand)
    : [];

  // Step 10: Find related formulas
  const relatedFormulas = mistakeAnalysis.relatedFormulas;

  // Step 11: Generate analytics
  const analytics = generateAnalyticsForFormula(formula, cfg.ageBand);

  // Assemble enriched formula
  const enrichedFormula: EnrichedFormula = {
    ...formula,
    explanation: enrichedBase,
    explanationModes,
    solvingSteps: [], // Populated when solving specific problems
    workedExamples,
    practiceQuestions,
    commonMistakes: mistakeAnalysis.mistakes,
    visualRepresentations,
    memoryTips,
    relatedFormulas,
    analytics
  };

  return {
    enrichedFormula,
    practiceQuestions,
    mistakeAnalysis,
    config: cfg
  };
}

/**
 * Generate visual representations for a formula.
 */
function generateVisualRepresentations(formula: Formula, ageBand: AgeBand): VisualRepresentation[] {
  const representations: VisualRepresentation[] = [];
  const lower = formula.formula.toLowerCase();

  // LaTeX representation (always)
  representations.push({
    type: "latex",
    content: formulaToLaTeX(formula.formula),
    description: `LaTeX representation of ${formula.formula}`
  });

  // Age-appropriate visualizations
  if (ageBand === "8-10" || ageBand === "11-13") {
    if (lower.includes("f=ma") || lower.includes("force")) {
      representations.push({
        type: "diagram",
        content: "[Force diagram showing mass, acceleration arrows]",
        description: "Visual showing how force relates to mass and acceleration"
      });
    } else if (lower.includes("area") || lower.includes("π")) {
      representations.push({
        type: "diagram",
        content: "[Circle with radius labeled, area shaded]",
        description: "Circle showing radius and shaded area"
      });
    }
  } else {
    // For older students, show more abstract representations
    if (lower.includes("f=ma")) {
      representations.push({
        type: "graph",
        content: "[F vs m graph at constant a, F vs a graph at constant m]",
        description: "Linear relationships showing proportionalities"
      });
    } else if (lower.includes("quadratic")) {
      representations.push({
        type: "graph",
        content: "[Parabola with labeled vertex, axis of symmetry, roots]",
        description: "Parabola showing key features"
      });
    }
  }

  return representations;
}

/**
 * Convert formula string to LaTeX.
 */
function formulaToLaTeX(formula: string): string {
  let latex = formula
    // Superscripts
    .replace(/\^2/g, "^{2}")
    .replace(/\^3/g, "^{3}")
    .replace(/\^(\d+)/g, "^{$1}")
    // Square root
    .replace(/√/g, "\\sqrt{")
    // Greek letters
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/θ/g, "\\theta")
    .replace(/π/g, "\\pi")
    .replace(/μ/g, "\\mu")
    .replace(/σ/g, "\\sigma")
    .replace(/Δ/g, "\\Delta")
    .replace(/Σ/g, "\\Sigma")
    .replace(/λ/g, "\\lambda")
    // Other common symbols
    .replace(/÷/g, "\\div")
    .replace(/×/g, "\\times")
    .replace(/≤/g, "\\leq")
    .replace(/≥/g, "\\geq")
    .replace(/≠/g, "\\neq");

  // Wrap unbracketed square roots
  const sqrtCount = (latex.match(/\\sqrt\{/g) || []).length;
  if (sqrtCount > 0) {
    // Count closing braces
    let opens = (latex.match(/\\sqrt\{/g) || []).length;
    let closes = (latex.match(/\}/g) || []).length;
    if (opens > closes) {
      latex += "}".repeat(opens - closes);
    }
  }

  return latex;
}

/**
 * Generate memory tips for memorizing the formula.
 */
function generateMemoryTips(formula: Formula, ageBand: AgeBand): string[] {
  const tips: string[] = [];
  const lower = formula.formula.toLowerCase();

  // Mnemonic devices
  if (lower.includes("f=ma")) {
    if (ageBand === "8-10") {
      tips.push("F = ma: 'Force equals mass times acceleration. More mass needs more push!'");
    } else {
      tips.push("F = ma: Remember 'Force makes mass accelerate'");
      tips.push("Picture: Pushing an empty cart (little force) vs full cart (lots of force)");
    }
  } else if (lower.includes("area") && lower.includes("π")) {
    tips.push("Area of circle: 'Pi r-squared' - think of pizza slices filling a circle");
    tips.push("Visualize: The area is the same as a triangle with base 2πr and height r");
  } else if (lower.includes("ohmic") || lower.includes("v=ir")) {
    tips.push("V = IR: Think of water flowing through a pipe - voltage is pressure, current is flow, resistance is pipe width");
    tips.push("Triangle trick: Cover what you want to find, read the remaining symbols");
  } else if (lower.includes("kinetic") || lower.includes("mv²")) {
    tips.push("KE = ½mv²: 'Half em vee squared' - square the speed first, then halve it");
    tips.push("Notice: Doubling speed quadruples energy (4x because of the square)");
  }

  // General memory tips
  tips.push("Write the formula 5 times while saying it aloud");
  tips.push("Use it in 3 different problems to cement understanding");
  tips.push("Try teaching it to someone else - explaining helps memorization");

  return tips.slice(0, 5);
}

/**
 * Process multiple formulas at once for batch enrichment.
 */
export function enrichFormulas(
  formulas: Formula[],
  config?: Partial<FormulaControllerConfig>
): FormulaEnrichmentResult[] {
  return formulas.map(formula => enrichFormula(formula, config));
}

/**
 * Get formula analysis result with confidence and suggestions.
 */
export function analyzeFormula(
  formula: Formula,
  config?: Partial<FormulaControllerConfig>
): FormulaAnalysisResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { enrichedFormula } = enrichFormula(formula, cfg);
  const assessment = assessDifficulty(formula, cfg.ageBand, cfg.learningStyle);

  const suggestions: string[] = [];
  for (const rec of assessment.recommendations) {
    suggestions.push(rec);
  }

  // Add learning style specific suggestions
  if (cfg.learningStyle === "visual") {
    suggestions.push("Draw diagrams for each step");
  } else if (cfg.learningStyle === "auditory") {
    suggestions.push("Explain each step verbally as you work");
  }

  return {
    formula: enrichedFormula,
    classification: classifyFormula(formula.formula, formula.subject),
    confidence: assessment.confidence,
    suggestions: suggestions.slice(0, 5)
  };
}

/**
 * Solve a specific problem using the formula.
 */
export function solveProblem(
  formula: Formula,
  given: Record<string, number>,
  find: string,
  config?: Partial<FormulaControllerConfig>
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  return solveFormula(formula, given, find, {
    ageBand: cfg.ageBand,
    showReasoning: true,
    highlightKeySteps: true
  });
}

/**
 * Check if a student's answer is correct.
 */
export function checkAnswer(
  formula: Formula,
  given: Record<string, number>,
  result: number,
  find: string
): { correct: boolean; feedback: string } {
  const verification = verifySolution(formula, given, result, find);
  return {
    correct: verification.includes("correct"),
    feedback: verification
  };
}

/**
 * Create a practice session for a formula.
 */
export function createFormulaPracticeSession(
  formula: Formula,
  config?: Partial<FormulaControllerConfig>
): PracticeSession {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  return createPracticeSession(formula, {
    ageBand: cfg.ageBand,
    difficulty: formula.difficulty || "intermediate",
    count: cfg.practiceCount,
    includeHints: true,
    includeMultipleChoice: true
  });
}
