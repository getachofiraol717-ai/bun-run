// @ts-nocheck
// Formula Engine — VariableAnalyzer
// Feature 2: Comprehensive variable explanation system
import type { Formula, FormulaExplanation } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, LearningStyle } from "../models/FormulaModels";

export interface VariableInfo {
  symbol: string;
  name: string;
  unit: string | null;
  type: "scalar" | "vector" | "tensor" | "constant" | "function";
  range?: { min?: number; max?: number; description: string };
  description: string;
  commonValues?: { value: string; context: string }[];
  physicalInterpretation?: string;
  geometricInterpretation?: string;
}

export interface VariableAnalysisResult {
  variables: VariableInfo[];
  dependencies: Record<string, string[]>;
  independentVariables: string[];
  dependentVariables: string[];
  constants: string[];
}

const VARIABLE_DEFINITIONS: Record<string, { name: string; unit: string | null; type: "scalar" | "vector" | "tensor" | "constant" | "function"; commonUnit: string }> = {
  // Physics - Mechanics
  "F": { name: "Force", unit: "N", type: "vector", commonUnit: "Newton (N)" },
  "m": { name: "Mass", unit: "kg", type: "scalar", commonUnit: "kilogram (kg)" },
  "a": { name: "Acceleration", unit: "m/s²", type: "vector", commonUnit: "meters per second squared (m/s²)" },
  "v": { name: "Velocity", unit: "m/s", type: "vector", commonUnit: "meters per second (m/s)" },
  "u": { name: "Initial velocity", unit: "m/s", type: "vector", commonUnit: "meters per second (m/s)" },
  "t": { name: "Time", unit: "s", type: "scalar", commonUnit: "seconds (s)" },
  "s": { name: "Displacement", unit: "m", type: "vector", commonUnit: "meters (m)" },
  "d": { name: "Distance", unit: "m", type: "scalar", commonUnit: "meters (m)" },
  "g": { name: "Gravitational acceleration", unit: "m/s²", type: "constant", commonUnit: "m/s² (≈9.8 on Earth)" },
  "p": { name: "Momentum", unit: "kg·m/s", type: "vector", commonUnit: "kilogram meters per second" },
  "W": { name: "Work", unit: "J", type: "scalar", commonUnit: "Joules (J)" },
  "E": { name: "Energy", unit: "J", type: "scalar", commonUnit: "Joules (J)" },
  "K": { name: "Kinetic energy", unit: "J", type: "scalar", commonUnit: "Joules (J)" },
  "U": { name: "Potential energy", unit: "J", type: "scalar", commonUnit: "Joules (J)" },
  "P": { name: "Power", unit: "W", type: "scalar", commonUnit: "Watts (W)" },
  // Physics - Electromagnetism
  "q": { name: "Electric charge", unit: "C", type: "scalar", commonUnit: "Coulombs (C)" },
  "V": { name: "Voltage / Potential", unit: "V", type: "scalar", commonUnit: "Volts (V)" },
  "I": { name: "Electric current", unit: "A", type: "scalar", commonUnit: "Amperes (A)" },
  "R": { name: "Resistance", unit: "Ω", type: "scalar", commonUnit: "Ohms (Ω)" },
  "C": { name: "Capacitance", unit: "F", type: "scalar", commonUnit: "Farads (F)" },
  "L": { name: "Inductance", unit: "H", type: "scalar", commonUnit: "Henrys (H)" },
  "E": { name: "Electric field", unit: "N/C", type: "vector", commonUnit: "Newtons per Coulomb" },
  "B": { name: "Magnetic field", unit: "T", type: "vector", commonUnit: "Tesla (T)" },
  // Physics - Thermodynamics
  "T": { name: "Temperature", unit: "K", type: "scalar", commonUnit: "Kelvin (K)" },
  "Q": { name: "Heat", unit: "J", type: "scalar", commonUnit: "Joules (J)" },
  "c": { name: "Specific heat capacity", unit: "J/(kg·K)", type: "scalar", commonUnit: "Joules per kilogram Kelvin" },
  "S": { name: "Entropy", unit: "J/K", type: "scalar", commonUnit: "Joules per Kelvin" },
  "H": { name: "Enthalpy", unit: "J", type: "scalar", commonUnit: "Joules (J)" },
  "ΔT": { name: "Temperature change", unit: "K", type: "scalar", commonUnit: "Kelvin (K)" },
  // Chemistry
  "n": { name: "Amount of substance", unit: "mol", type: "scalar", commonUnit: "moles (mol)" },
  "M": { name: "Molar mass / Molarity", unit: "g/mol or mol/L", type: "scalar", commonUnit: "g/mol or mol/L" },
  "P": { name: "Pressure", unit: "Pa", type: "scalar", commonUnit: "Pascals (Pa)" },
  "[H+]": { name: "Hydrogen ion concentration", unit: "mol/L", type: "scalar", commonUnit: "moles per liter" },
  "pH": { name: "pH value", unit: null, type: "scalar", commonUnit: "dimensionless (0-14)" },
  "K": { name: "Equilibrium constant", unit: null, type: "scalar", commonUnit: "dimensionless" },
  // Math
  "x": { name: "Variable x", unit: null, type: "scalar", commonUnit: "depends on context" },
  "y": { name: "Variable y", unit: null, type: "scalar", commonUnit: "depends on context" },
  "z": { name: "Variable z", unit: null, type: "scalar", commonUnit: "depends on context" },
  "r": { name: "Radius", unit: "m", type: "scalar", commonUnit: "meters (m)" },
  "h": { name: "Height", unit: "m", type: "scalar", commonUnit: "meters (m)" },
  "w": { name: "Width", unit: "m", type: "scalar", commonUnit: "meters (m)" },
  "A": { name: "Area", unit: "m²", type: "scalar", commonUnit: "square meters (m²)" },
  "V": { name: "Volume", unit: "m³", type: "scalar", commonUnit: "cubic meters (m³)" },
  "θ": { name: "Angle theta", unit: "rad or °", type: "scalar", commonUnit: "radians or degrees" },
  "π": { name: "Pi", unit: null, type: "constant", commonUnit: "≈3.14159" },
  "e": { name: "Euler's number", unit: null, type: "constant", commonUnit: "≈2.71828" },
  // Statistics
  "μ": { name: "Population mean", unit: null, type: "scalar", commonUnit: "same as data" },
  "σ": { name: "Standard deviation", unit: null, type: "scalar", commonUnit: "same as data" },
  "σ²": { name: "Variance", unit: null, type: "scalar", commonUnit: "same as data squared" },
  "n": { name: "Sample size", unit: null, type: "scalar", commonUnit: "count" },
  "Σ": { name: "Summation", unit: null, type: "function", commonUnit: "sum of values" },
  "p": { name: "Probability", unit: null, type: "scalar", commonUnit: "0 to 1" },
  "z": { name: "Z-score", unit: null, type: "scalar", commonUnit: "standard deviations" },
};

function extractVariablesFromFormula(formula: string): string[] {
  const variables: Set<string> = new Set();
  // Match single letters and Greek letters
  const matches = formula.match(/[a-zA-Zα-ωΑ-Ω][₀₁₂₃₄₅₆₇₈₉₀^']*/g) || [];
  for (const match of matches) {
    // Filter out common words and operators
    const cleaned = match.replace(/[₀-₉]/g, (d) => "0123456789"[parseInt(d)]);
    if (cleaned.length > 0 && !["sin", "cos", "tan", "log", "ln", "exp", "max", "min", "det"].includes(cleaned.toLowerCase())) {
      // Skip if it's just a number or operator
      if (!/^[0-9+\-*/=^()]+$/.test(cleaned)) {
        variables.add(cleaned);
      }
    }
  }
  return Array.from(variables);
}

export function analyzeVariables(formula: Formula, ageBand: AgeBand): VariableAnalysisResult {
  const formulaVars = formula.variables.length > 0 ? formula.variables : extractVariablesFromFormula(formula.formula);
  const variables: VariableInfo[] = [];

  for (const sym of formulaVars) {
    const def = VARIABLE_DEFINITIONS[sym];
    if (def) {
      variables.push({
        symbol: sym,
        name: def.name,
        unit: def.unit,
        type: def.type,
        description: def.commonUnit,
        commonValues: getCommonValues(sym, formula.subject),
        physicalInterpretation: getPhysicalInterpretation(sym),
        geometricInterpretation: getGeometricInterpretation(sym, ageBand)
      });
    } else {
      // Unknown variable - create generic entry
      variables.push({
        symbol: sym,
        name: `Variable ${sym}`,
        unit: null,
        type: "scalar",
        description: "Variable defined in context"
      });
    }
  }

  // Determine dependencies (which variables affect which)
  const dependencies: Record<string, string[]> = {};
  const independent: string[] = [];
  const dependent: string[] = [];
  const constants: string[] = [];

  for (const v of variables) {
    if (v.type === "constant") {
      constants.push(v.symbol);
      independent.push(v.symbol);
    } else if (v.symbol === formula.formula.split("=")[0]?.trim()) {
      dependent.push(v.symbol);
    } else {
      independent.push(v.symbol);
    }
  }

  // Build dependency map
  const resultVar = formula.formula.split("=")[0]?.trim();
  if (resultVar) {
    dependencies[resultVar] = formulaVars.filter(v => v !== resultVar);
  }

  return {
    variables,
    dependencies,
    independentVariables: independent,
    dependentVariables: dependent,
    constants
  };
}

function getCommonValues(symbol: string, subject?: string): { value: string; context: string }[] {
  const commonValues: Record<string, { value: string; context: string }[]> = {
    "g": [
      { value: "9.8 m/s²", context: "Earth's surface" },
      { value: "10 m/s²", context: "Approximation for calculations" },
      { value: "1.6 m/s²", context: "Moon's surface" }
    ],
    "c": [
      { value: "3×10⁸ m/s", context: "Speed of light in vacuum" },
      { value: "4.18 J/(g·°C)", context: "Specific heat of water" }
    ],
    "π": [
      { value: "3.14", context: "Approximation" },
      { value: "3.14159", context: "More precise" }
    ],
    "R": [
      { value: "8.314 J/(mol·K)", context: "Universal gas constant" },
      { value: "0.0821 L·atm/(mol·K)", context: "Alternate form" }
    ]
  };
  return commonValues[symbol] || [];
}

function getPhysicalInterpretation(symbol: string): string | undefined {
  const interpretations: Record<string, string> = {
    "F": "Represents how hard something is being pushed or pulled",
    "m": "How much matter is in an object - how hard it is to move",
    "a": "How quickly velocity is changing",
    "v": "How fast something is moving and in which direction",
    "E": "The ability to do work - stored or in motion",
    "p": "How hard it is to stop a moving object",
    "Q": "Energy transferred due to temperature difference",
    "T": "How hot or cold something is (related to average kinetic energy)"
  };
  return interpretations[symbol];
}

function getGeometricInterpretation(symbol: string, ageBand: AgeBand): string | undefined {
  if (ageBand === "8-10" || ageBand === "11-13") {
    const geoInterpretations: Record<string, string> = {
      "r": "Distance from center to edge of a circle",
      "h": "How tall something is",
      "A": "How much space a flat shape covers",
      "V": "How much space a 3D shape holds",
      "θ": "How turned around something is"
    };
    return geoInterpretations[symbol];
  }
  return undefined;
}

export function generateVariableExplanation(variable: VariableInfo, ageBand: AgeBand, learningStyle: LearningStyle): string {
  const parts: string[] = [];

  // Base explanation
  let intro = "";
  if (ageBand === "8-10") {
    intro = `${variable.symbol} stands for ${variable.name.toLowerCase()}`;
  } else if (ageBand === "11-13") {
    intro = `The symbol ${variable.symbol} represents ${variable.name.toLowerCase()}`;
  } else {
    intro = `${variable.symbol} (${variable.name})`;
  }

  parts.push(intro);

  // Unit info
  if (variable.unit) {
    if (ageBand === "8-10") {
      parts.push(`It is measured in ${variable.description}`);
    } else {
      parts.push(`Unit: ${variable.description}`);
    }
  }

  // Physical/geometric interpretation
  if (learningStyle === "visual" && variable.geometricInterpretation) {
    parts.push(`Think of it as: ${variable.geometricInterpretation}`);
  } else if (learningStyle === "kinesthetic") {
    parts.push(`You can feel this when: pushing a cart (force), catching a ball (momentum)`);
  } else if (variable.physicalInterpretation) {
    parts.push(variable.physicalInterpretation);
  }

  return parts.join(". ") + ".";
}

export function enrichExplanationWithVariables(explanation: FormulaExplanation, analysis: VariableAnalysisResult): FormulaExplanation {
  return {
    ...explanation,
    variables: analysis.variables.map(v => ({
      symbol: v.symbol,
      meaning: v.description
    }))
  };
}
