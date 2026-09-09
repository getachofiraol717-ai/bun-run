// Formula Engine — FormulaDifficultyEngine
// Feature 9: Intelligent difficulty assessment and adaptation
import type { Formula, FormulaDifficulty } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, LearningStyle, FormulaAnalytics, EnrichedFormula } from "../models/FormulaModels";
import { classifyFormula, type FormulaClassification } from "./FormulaClassifier";
import { analyzeVariables, type VariableAnalysisResult } from "./VariableAnalyzer";

export interface DifficultyAssessment {
  difficulty: FormulaDifficulty;
  confidence: number;
  factors: DifficultyFactor[];
  recommendations: string[];
  estimatedTime: number; // minutes
}

export interface DifficultyFactor {
  name: string;
  impact: "increases" | "decreases" | "neutral";
  weight: number;
  reason: string;
}

const DIFFICULTY_WEIGHTS = {
  // Variable complexity
  variableCount: {
    1: { weight: -0.2, desc: "Single variable formula" },
    2: { weight: 0, desc: "Two variable formula" },
    3: { weight: 0.1, desc: "Three variable formula" },
    4: { weight: 0.2, desc: "Four variable formula" },
    more: { weight: 0.3, desc: "Multiple variable formula" }
  },
  // Mathematical operations
  operations: {
    basic: { weight: -0.1, desc: "Only + - × ÷" },
    exponent: { weight: 0.1, desc: "Exponents/roots" },
    log: { weight: 0.2, desc: "Logarithms" },
    calculus: { weight: 0.3, desc: "Derivatives/integrals" }
  },
  // Concept level
  concept: {
    concrete: { weight: -0.2, desc: "Concrete, observable" },
    abstract: { weight: 0.2, desc: "Abstract concept" },
    theoretical: { weight: 0.3, desc: "Highly theoretical" }
  }
};

export function assessDifficulty(
  formula: Formula,
  ageBand: AgeBand,
  learningStyle?: LearningStyle
): DifficultyAssessment {
  const classification = classifyFormula(formula.formula, formula.subject);
  const varAnalysis = analyzeVariables(formula, ageBand);
  const factors: DifficultyFactor[] = [];

  let totalWeight = 0;
  let maxWeight = 0;

  // 1. Variable count factor
  const varCount = varAnalysis.variables.length;
  const varWeight = varCount <= 4
    ? DIFFICULTY_WEIGHTS.variableCount[varCount as keyof typeof DIFFICULTY_WEIGHTS.variableCount]?.weight || 0
    : DIFFICULTY_WEIGHTS.variableCount.more.weight;
  factors.push({
    name: "Number of variables",
    impact: varWeight > 0 ? "increases" : "decreases",
    weight: Math.abs(varWeight),
    reason: varCount <= 4
      ? DIFFICULTY_WEIGHTS.variableCount[varCount as keyof typeof DIFFICULTY_WEIGHTS.variableCount]?.desc
      : DIFFICULTY_WEIGHTS.variableCount.more.desc
  });
  totalWeight += varWeight;
  maxWeight += Math.abs(varWeight);

  // 2. Mathematical operations factor
  const hasCalculus = /∫|∂|d\/dx|derivative|integral/.test(formula.formula);
  const hasLog = /log|ln|logarithm/.test(formula.formula.toLowerCase());
  const hasExponent = /\^|²|³|√|sqrt|square/.test(formula.formula);

  let opWeight = DIFFICULTY_WEIGHTS.operations.basic.weight;
  let opDesc = DIFFICULTY_WEIGHTS.operations.basic.desc;

  if (hasCalculus) {
    opWeight = DIFFICULTY_WEIGHTS.operations.calculus.weight;
    opDesc = DIFFICULTY_WEIGHTS.operations.calculus.desc;
  } else if (hasLog) {
    opWeight = DIFFICULTY_WEIGHTS.operations.log.weight;
    opDesc = DIFFICULTY_WEIGHTS.operations.log.desc;
  } else if (hasExponent) {
    opWeight = DIFFICULTY_WEIGHTS.operations.exponent.weight;
    opDesc = DIFFICULTY_WEIGHTS.operations.exponent.desc;
  }

  factors.push({
    name: "Mathematical operations",
    impact: opWeight > 0 ? "increases" : "decreases",
    weight: Math.abs(opWeight),
    reason: opDesc
  });
  totalWeight += opWeight;
  maxWeight += Math.abs(opWeight);

  // 3. Formula complexity
  const hasMultipleEquals = (formula.formula.match(/=/g) || []).length > 1;
  const isMultiStep = hasMultipleEquals || /→|implies|therefore/.test(formula.formula);

  if (isMultiStep) {
    factors.push({
      name: "Multi-step formula",
      impact: "increases",
      weight: 0.15,
      reason: "Requires multiple calculations or rearrangements"
    });
    totalWeight += 0.15;
    maxWeight += 0.15;
  }

  // 4. Abstract vs concrete
  const isAbstract = classification.isFundamental || classification.isCoreFormula;
  const conceptWeight = isAbstract
    ? DIFFICULTY_WEIGHTS.concept.abstract.weight
    : DIFFICULTY_WEIGHTS.concept.concrete.weight;

  factors.push({
    name: "Conceptual complexity",
    impact: conceptWeight > 0 ? "increases" : "decreases",
    weight: Math.abs(conceptWeight),
    reason: isAbstract
      ? DIFFICULTY_WEIGHTS.concept.abstract.desc
      : DIFFICULTY_WEIGHTS.concept.concrete.desc
  });
  totalWeight += conceptWeight;
  maxWeight += Math.abs(conceptWeight);

  // 5. Subject-specific difficulty
  const subjectDifficulty: Record<string, number> = {
    math: 0.1,
    physics: 0.15,
    chemistry: 0.15,
    statistics: 0.2
  };
  const subjectWeight = subjectDifficulty[formula.subject] || 0;
  factors.push({
    name: "Subject difficulty",
    impact: subjectWeight > 0 ? "increases" : "decreases",
    weight: subjectWeight,
    reason: `${formula.subject} often involves complex reasoning`
  });
  totalWeight += subjectWeight;
  maxWeight += subjectWeight;

  // 6. Age appropriateness
  const ageAppropriate = isAgeAppropriate(formula, ageBand);
  if (!ageAppropriate) {
    factors.push({
      name: "Age appropriateness",
      impact: "increases",
      weight: 0.2,
      reason: "This formula may require concepts not typically covered at this age level"
    });
    totalWeight += 0.2;
    maxWeight += 0.2;
  }

  // Calculate normalized score
  const normalizedScore = maxWeight > 0 ? (totalWeight + maxWeight) / (2 * maxWeight) : 0.5;
  const confidence = Math.min(0.95, 0.5 + (factors.length * 0.05)); // More factors = more confidence

  // Map score to difficulty
  let difficulty: FormulaDifficulty;
  if (normalizedScore < 0.35) {
    difficulty = "beginner";
  } else if (normalizedScore < 0.65) {
    difficulty = "intermediate";
  } else {
    difficulty = "advanced";
  }

  // Generate recommendations
  const recommendations = generateRecommendations(formula, factors, ageBand, learningStyle);

  // Estimate time
  const estimatedTime = calculateEstimatedTime(factors, difficulty);

  return {
    difficulty,
    confidence,
    factors,
    recommendations,
    estimatedTime
  };
}

function isAgeAppropriate(formula: Formula, ageBand: AgeBand): boolean {
  const lower = formula.formula.toLowerCase();

  // Check age-appropriateness based on formula complexity
  if (ageBand === "8-10") {
    // Should be basic arithmetic or simple geometry
    return /[+\-×÷]/.test(formula.formula) && !/∫|∑|log|ln/.test(lower);
  }
  if (ageBand === "11-13") {
    // Can handle exponents, basic algebra
    return !/∫|∑|∂/.test(lower);
  }
  if (ageBand === "14-16") {
    // Can handle logarithms, basic calculus concepts
    return !/∫/.test(lower);
  }
  // University and professional can handle anything
  return true;
}

function generateRecommendations(
  formula: Formula,
  factors: DifficultyFactor[],
  ageBand: AgeBand,
  learningStyle?: LearningStyle
): string[] {
  const recommendations: string[] = [];

  // Based on learning style
  if (learningStyle === "visual") {
    recommendations.push("Use diagrams and visual representations of the formula");
    recommendations.push("Draw the problem situation before solving");
  } else if (learningStyle === "auditory") {
    recommendations.push("Explain the formula aloud as you work through it");
    recommendations.push("Discuss similar problems with others");
  } else if (learningStyle === "kinesthetic") {
    recommendations.push("Work through physical examples you can measure");
    recommendations.push("Use manipulatives or simulations");
  }

  // Based on difficulty factors
  const hardFactors = factors.filter(f => f.impact === "increases" && f.weight > 0.15);
  for (const factor of hardFactors) {
    if (factor.name.includes("variable")) {
      recommendations.push("Focus on understanding what each variable represents");
      recommendations.push("Practice identifying variables in word problems");
    } else if (factor.name.includes("operation")) {
      recommendations.push("Review the specific math operations in this formula");
    } else if (factor.name.includes("concept")) {
      recommendations.push("Build intuition with concrete examples first");
    }
  }

  // Based on age
  if (ageBand === "8-10" || ageBand === "11-13") {
    recommendations.push("Start with simple numerical substitutions");
    recommendations.push("Gradually introduce algebraic rearrangements");
  } else if (ageBand === "university" || ageBand === "professional") {
    recommendations.push("Connect to underlying theory and derivations");
    recommendations.push("Practice with real-world applications");
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}

function calculateEstimatedTime(factors: DifficultyFactor[], difficulty: FormulaDifficulty): number {
  // Base time in minutes
  const baseTime: Record<FormulaDifficulty, number> = {
    beginner: 5,
    intermediate: 15,
    advanced: 30
  };

  let time = baseTime[difficulty];

  // Adjust for complexity factors
  const complexFactors = factors.filter(f => f.impact === "increases").length;
  time += complexFactors * 3; // Add 3 minutes per complexity factor

  return Math.max(3, Math.min(60, time)); // Clamp between 3 and 60 minutes
}

export function adaptDifficulty(
  currentDifficulty: FormulaDifficulty,
  studentPerformance: number, // 0-1, where 1 is perfect
  consecutiveCorrect: number
): FormulaDifficulty {
  // studentPerformance: recent quiz/exercise scores
  // consecutiveCorrect: how many questions answered correctly in a row

  let newDifficulty = currentDifficulty;

  // If performing well, consider increasing difficulty
  if (studentPerformance >= 0.9 && consecutiveCorrect >= 3) {
    if (currentDifficulty === "beginner") {
      newDifficulty = "intermediate";
    } else if (currentDifficulty === "intermediate") {
      newDifficulty = "advanced";
    }
  }

  // If struggling, consider decreasing difficulty
  if (studentPerformance < 0.6 && consecutiveCorrect < 2) {
    if (currentDifficulty === "advanced") {
      newDifficulty = "intermediate";
    } else if (currentDifficulty === "intermediate") {
      newDifficulty = "beginner";
    }
  }

  return newDifficulty;
}

export function generateAnalyticsForFormula(
  formula: Formula,
  ageBand: AgeBand
): FormulaAnalytics {
  const assessment = assessDifficulty(formula, ageBand);

  // Calculate prerequisite topics
  const prerequisites: string[] = [];
  const lower = formula.formula.toLowerCase();

  if (lower.includes("f=") || lower.includes("kinetic")) {
    prerequisites.push("Basic arithmetic operations");
    prerequisites.push("Understanding of units");
  }
  if (lower.includes("²") || lower.includes("sqrt")) {
    prerequisites.push("Exponents and roots");
  }
  if (lower.includes("log")) {
    prerequisites.push("Logarithms");
  }
  if (lower.includes("∫")) {
    prerequisites.push("Calculus basics");
    prerequisites.push("Limits");
  }

  // Estimate mastery attempts (more difficult = more attempts)
  const baseAttempts: Record<FormulaDifficulty, number> = {
    beginner: 3,
    intermediate: 5,
    advanced: 8
  };

  return {
    estimatedSolveTime: assessment.estimatedTime,
    prerequisiteTopics: prerequisites,
    estimatedMasteryAttempts: baseAttempts[assessment.difficulty],
    confidenceScore: assessment.confidence
  };
}
