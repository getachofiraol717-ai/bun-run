// Smart PDF Engine — formula detection + explanation heuristics
import type { Formula, FormulaDifficulty, FormulaExplanation, FormulaSubject } from "../types/Formula";

export interface FormulaPattern {
  re: RegExp;
  subject: FormulaSubject;
  difficulty: FormulaDifficulty;
  /** True only for the generic catch-all pattern — skipped on lines a specific pattern already matched. */
  generic?: boolean;
}

// Ordered roughly by specificity. Generic patterns are last so named formulas
// get matched (and explained) by their specific pattern first.
export const FORMULA_PATTERNS: FormulaPattern[] = [
  { re: /\bF\s*=\s*m\s*a\b/g, subject: "physics", difficulty: "beginner" },
  { re: /\bE\s*=\s*m\s*c\s*[²2]\b/g, subject: "physics", difficulty: "advanced" },
  { re: /\bP\s*V\s*=\s*n\s*R\s*T\b/gi, subject: "chemistry", difficulty: "intermediate" },
  { re: /\ba\s*[²2]\s*\+\s*b\s*[²2]\s*=\s*c\s*[²2]\b/g, subject: "math", difficulty: "beginner" },
  { re: /\bv\s*=\s*u\s*\+\s*a\s*t\b/g, subject: "physics", difficulty: "intermediate" },
  { re: /\bs\s*=\s*u\s*t\s*\+\s*(?:1\/2|½)\s*a\s*t\s*[²2]\b/g, subject: "physics", difficulty: "intermediate" },
  { re: /\bK\s*E\s*=\s*(?:1\/2|½)\s*m\s*v\s*[²2]\b/gi, subject: "physics", difficulty: "intermediate" },
  { re: /\bp\s*H\s*=\s*-?\s*log\s*\[?H\+?\]?/gi, subject: "chemistry", difficulty: "advanced" },
  { re: /\bx\s*=\s*\(?-b\s*±\s*√.{0,20}\)?\s*\/\s*2a\b/gi, subject: "math", difficulty: "advanced" },
  { re: /\bσ\s*=\s*√/g, subject: "statistics", difficulty: "advanced" },
  // Generic single-letter-variable equation, e.g. "y = mx + b" — lowest confidence, kept last,
  // and tagged `generic` so FormulaDetector skips it on lines a specific pattern already matched.
  { re: /\b[A-Za-zα-ωΣΔ]\s*=\s*[^=\n.,;()]{1,24}/g, subject: "unknown", difficulty: "intermediate", generic: true },
];

const KNOWLEDGE_BASE: Record<string, FormulaExplanation> = {
  "F = ma": {
    formula: "F = ma",
    explanation: "Newton's Second Law: the net force on an object equals its mass times its acceleration.",
    variables: [
      { symbol: "F", meaning: "Net force (newtons, N)" },
      { symbol: "m", meaning: "Mass (kilograms, kg)" },
      { symbol: "a", meaning: "Acceleration (m/s²)" },
    ],
    examples: ["A 2 kg cart accelerating at 3 m/s² experiences a net force of 6 N."],
    commonMistakes: ["Forgetting that F is the *net* force, not a single applied force.", "Mixing units (e.g. grams instead of kilograms)."],
    realWorldExamples: ["Why a heavier car needs a stronger engine to accelerate at the same rate as a lighter one."],
  },
  "E = mc²": {
    formula: "E = mc²",
    explanation: "Mass–energy equivalence: a small amount of mass corresponds to an enormous amount of energy because the speed of light, c, is squared.",
    variables: [
      { symbol: "E", meaning: "Energy (joules)" },
      { symbol: "m", meaning: "Mass (kilograms)" },
      { symbol: "c", meaning: "Speed of light, ≈3×10⁸ m/s" },
    ],
    examples: ["Converting 1 gram of mass entirely to energy releases about 9×10¹³ joules."],
    commonMistakes: ["Forgetting to square c.", "Using mass in grams instead of kilograms in SI calculations."],
    realWorldExamples: ["Energy released in nuclear reactions."],
  },
  "PV=nRT": {
    formula: "PV = nRT",
    explanation: "The Ideal Gas Law relates pressure, volume, moles, and temperature of an ideal gas.",
    variables: [
      { symbol: "P", meaning: "Pressure" },
      { symbol: "V", meaning: "Volume" },
      { symbol: "n", meaning: "Amount of gas (moles)" },
      { symbol: "R", meaning: "Ideal gas constant" },
      { symbol: "T", meaning: "Absolute temperature (kelvin)" },
    ],
    examples: ["Predicting how volume changes when you heat a gas at constant pressure."],
    commonMistakes: ["Using Celsius instead of Kelvin for T.", "Mismatched units between P, V, and R."],
    realWorldExamples: ["Why a sealed bag of chips puffs up at high altitude."],
  },
  "a²+b²=c²": {
    formula: "a² + b² = c²",
    explanation: "The Pythagorean Theorem: in a right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides.",
    variables: [
      { symbol: "a, b", meaning: "The two legs of a right triangle" },
      { symbol: "c", meaning: "The hypotenuse (longest side)" },
    ],
    examples: ["A 3-4-5 right triangle: 3² + 4² = 9 + 16 = 25 = 5²."],
    commonMistakes: ["Applying it to non-right triangles.", "Mixing up which side is the hypotenuse."],
    realWorldExamples: ["Finding the shortest diagonal distance across a rectangular field."],
  },
};

/** Normalize a matched formula string to a knowledge-base lookup key. */
function normalizeKey(formula: string): string {
  return formula.replace(/\s+/g, "").replace(/²/g, "2").toLowerCase();
}

const NORMALIZED_KB = new Map(Object.entries(KNOWLEDGE_BASE).map(([k, v]) => [normalizeKey(k), v]));

/** Pull plausible variable symbols (single letters / greek letters) out of a formula string. */
export function extractVariables(formula: string): string[] {
  const matches = formula.match(/[A-Za-zα-ωΣΔ]/g) ?? [];
  return [...new Set(matches)].filter((v) => !["=", "+", "-"].includes(v));
}

/** Build a Feature-4 explanation object — uses the knowledge base when the formula is recognized, otherwise a generic structured fallback. */
export function buildFormulaExplanation(formula: string, subject: FormulaSubject): FormulaExplanation {
  const known = NORMALIZED_KB.get(normalizeKey(formula));
  if (known) return known;

  const variables = extractVariables(formula);
  return {
    formula,
    explanation: `A ${subject !== "unknown" ? subject : "mathematical"} relationship between ${variables.join(", ") || "the variables shown"}. Open this in AI Tutor for a full step-by-step explanation.`,
    variables: variables.map((v) => ({ symbol: v, meaning: "Defined in the surrounding text" })),
    examples: [],
    commonMistakes: [],
    realWorldExamples: [],
  };
}

export type { Formula };
