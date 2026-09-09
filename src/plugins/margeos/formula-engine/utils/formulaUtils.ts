// Formula Engine — utility functions
// Common helper functions for formula processing
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, FormulaDifficulty } from "../models/FormulaModels";

/**
 * Normalize a formula string for comparison.
 */
export function normalizeFormula(formula: string): string {
  return formula
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/½/g, "1/2")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");
}

/**
 * Check if two formulas are equivalent.
 */
export function areFormulasEquivalent(formula1: string, formula2: string): boolean {
  return normalizeFormula(formula1) === normalizeFormula(formula2);
}

/**
 * Generate a unique ID for a formula.
 */
export function generateFormulaId(formula: string, pageNumber: number, documentId?: string): string {
  const base = normalizeFormula(formula);
  const hash = simpleHash(base);
  return `formula_${documentId || "doc"}_p${pageNumber}_${hash}`;
}

/**
 * Simple string hash function.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get display-friendly formula name.
 */
export function getFormulaDisplayName(formula: string): string {
  const lower = formula.toLowerCase();

  if (lower.includes("f=ma") || lower.includes("newton")) return "Newton's Second Law";
  if (lower.includes("e=mc")) return "Mass-Energy Equivalence";
  if (lower.includes("area") && lower.includes("circle")) return "Area of Circle";
  if (lower.includes("v=ir") || lower.includes("ohmic")) return "Ohm's Law";
  if (lower.includes("kinetic") || lower.includes("mv^2")) return "Kinetic Energy";
  if (lower.includes("pv=nrt") || lower.includes("ideal")) return "Ideal Gas Law";
  if (lower.includes("ph=") || lower.includes("log")) return "pH Formula";
  if (lower.includes("quadratic") || lower.includes("x^2")) return "Quadratic Formula";

  // Extract first part before equals
  const parts = formula.split("=");
  return parts[0].trim() || formula;
}

/**
 * Get icon name for formula type.
 */
export function getFormulaIcon(formula: string): string {
  const lower = formula.toLowerCase();

  if (lower.includes("f=ma") || lower.includes("force")) return "atom";
  if (lower.includes("area") || lower.includes("π")) return "circle";
  if (lower.includes("kinetic") || lower.includes("energy")) return "lightning";
  if (lower.includes("ph=") || lower.includes("acid")) return "flask";
  if (lower.includes("quadratic")) return "graph";
  if (lower.includes("v=ir") || lower.includes("electric")) return "zap";

  return "function";
}

/**
 * Format formula for display in UI.
 */
export function formatFormulaForDisplay(formula: string): string {
  return formula
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\*/g, "×")
    .replace(/\//g, "÷");
}

/**
 * Get difficulty color based on difficulty level.
 */
export function getDifficultyColor(difficulty: FormulaDifficulty): string {
  switch (difficulty) {
    case "beginner": return "green";
    case "intermediate": return "yellow";
    case "advanced": return "red";
    default: return "gray";
  }
}

/**
 * Get difficulty label for display.
 */
export function getDifficultyLabel(difficulty: FormulaDifficulty): string {
  switch (difficulty) {
    case "beginner": return "Easy";
    case "intermediate": return "Medium";
    case "advanced": return "Hard";
    default: return "Unknown";
  }
}

/**
 * Get age band display label.
 */
export function getAgeBandLabel(ageBand: AgeBand): string {
  switch (ageBand) {
    case "8-10": return "Elementary (8-10)";
    case "11-13": return "Middle School (11-13)";
    case "14-16": return "High School (14-16)";
    case "17-19": return "Pre-University (17-19)";
    case "university": return "University";
    case "professional": return "Professional";
    default: return ageBand;
  }
}

/**
 * Estimate reading time for explanation (in seconds).
 */
export function estimateReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60);
}

/**
 * Truncate text to max length with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Extract variables from a formula string.
 */
export function extractVariables(formula: string): string[] {
  const variables: string[] = [];
  const matches = formula.match(/[a-zA-Z][₀₁₂₃₄₅₆₇₈₉₀]*/g) || [];

  for (const match of matches) {
    // Filter out common words
    const lower = match.toLowerCase();
    if (!["sin", "cos", "tan", "log", "ln", "exp", "max", "min", "det", "the", "and"].includes(lower)) {
      if (!variables.includes(match)) {
        variables.push(match);
      }
    }
  }

  return variables;
}

/**
 * Validate that required variables are present.
 */
export function validateVariables(formula: string, required: string[]): { valid: boolean; missing: string[] } {
  const available = extractVariables(formula);
  const missing = required.filter(r => !available.includes(r));
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Parse a given values string into a record.
 */
export function parseGivenValues(input: string): Record<string, number> {
  const result: Record<string, number> = {};
  const pairs = input.split(/[,\n]/);

  for (const pair of pairs) {
    const [key, value] = pair.split(/[=:]/).map(s => s.trim());
    if (key && value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        result[key] = num;
      }
    }
  }

  return result;
}

/**
 * Format number with appropriate precision.
 */
export function formatNumber(num: number, precision = 4): string {
  if (Number.isInteger(num)) return num.toString();
  if (Math.abs(num) < 0.0001) return num.toExponential(precision);
  if (Math.abs(num) >= 10000) return num.toExponential(precision);
  return num.toFixed(precision);
}

/**
 * Check if a value is within expected range.
 */
export function isValueReasonable(value: number, formula: string): boolean {
  const lower = formula.toLowerCase();

  // Physics ranges
  if (lower.includes("f=ma") || lower.includes("force")) {
    // Force should be reasonable (not > 10^10 N)
    return Math.abs(value) < 1e10;
  }
  if (lower.includes("ph=")) {
    // pH should be in reasonable range
    return value >= -2 && value <= 18;
  }
  if (lower.includes("area") && lower.includes("π")) {
    // Area should be positive and reasonable
    return value > 0 && value < 1e10;
  }

  // Default: check for NaN and Infinity
  return isFinite(value);
}
