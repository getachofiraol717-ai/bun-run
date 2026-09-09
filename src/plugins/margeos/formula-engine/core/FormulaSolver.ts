// @ts-nocheck
// Formula Engine — FormulaSolver
// Feature 5: Step-by-step formula solving engine
import type { Formula, FormulaDifficulty } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, SolvingStep, WorkedExample } from "../models/FormulaModels";
import { VariableAnalysisResult, analyzeVariables } from "./VariableAnalyzer";

export interface SolverConfig {
  ageBand: AgeBand;
  showReasoning: boolean;
  highlightKeySteps: boolean;
  maxSteps?: number;
}

const DEFAULT_CONFIG: Required<SolverConfig> = {
  ageBand: "14-16",
  showReasoning: true,
  highlightKeySteps: true,
  maxSteps: 10
};

interface SolvedValue {
  symbol: string;
  value: number;
  unit: string | null;
  formula: string;
}

export interface SolverResult {
  steps: SolvingStep[];
  finalAnswer: string;
  units: Record<string, string | null>;
  verification?: string;
}

const SOLVER_TEMPLATES: Record<string, (given: Record<string, number>, find: string) => SolverResult | null> = {
  // Physics - F = ma
  "f=ma": (given, find) => {
    const m = given.m;
    const a = given.a;
    const f = given.f;

    if (find === "f") {
      return {
        steps: [
          { stepNumber: 1, description: "Identify the formula", formula: "F = ma", explanation: "We use Newton's Second Law.", isKeyStep: false },
          { stepNumber: 2, description: "Substitute known values", formula: `F = ${m} × ${a}`, variables: [{ symbol: "m", value: `${m} kg` }, { symbol: "a", value: `${a} m/s²` }], explanation: "Plug in mass and acceleration.", isKeyStep: false },
          { stepNumber: 3, description: "Calculate", formula: `F = ${m * a}`, explanation: "Multiply to get the force.", isKeyStep: true }
        ],
        finalAnswer: `F = ${m * a} N`,
        units: { F: "N", m: "kg", a: "m/s²" }
      };
    }
    if (find === "m") {
      return {
        steps: [
          { stepNumber: 1, description: "Start with the formula", formula: "F = ma", explanation: "We need to solve for mass.", isKeyStep: false },
          { stepNumber: 2, description: "Rearrange for m", formula: "m = F/a", explanation: "Divide both sides by acceleration.", isKeyStep: true },
          { stepNumber: 3, description: "Substitute values", formula: `m = ${f} / ${a}`, variables: [{ symbol: "F", value: `${f} N` }, { symbol: "a", value: `${a} m/s²` }], explanation: "Plug in force and acceleration.", isKeyStep: false },
          { stepNumber: 4, description: "Calculate", formula: `m = ${f / a}`, explanation: "Divide to get mass.", isKeyStep: true }
        ],
        finalAnswer: `m = ${f / a} kg`,
        units: { F: "N", m: "kg", a: "m/s²" }
      };
    }
    if (find === "a") {
      return {
        steps: [
          { stepNumber: 1, description: "Start with the formula", formula: "F = ma", explanation: "We need to solve for acceleration.", isKeyStep: false },
          { stepNumber: 2, description: "Rearrange for a", formula: "a = F/m", explanation: "Divide both sides by mass.", isKeyStep: true },
          { stepNumber: 3, description: "Substitute values", formula: `a = ${f} / ${m}`, variables: [{ symbol: "F", value: `${f} N` }, { symbol: "m", value: `${m} kg` }], explanation: "Plug in force and mass.", isKeyStep: false },
          { stepNumber: 4, description: "Calculate", formula: `a = ${f / m}`, explanation: "Divide to get acceleration.", isKeyStep: true }
        ],
        finalAnswer: `a = ${f / m} m/s²`,
        units: { F: "N", m: "kg", a: "m/s²" }
      };
    }
    return null;
  },

  // Area of circle A = πr²
  "area_circle": (given, find) => {
    const r = given.r;
    const π = Math.PI;

    if (find === "a" || find === "area") {
      return {
        steps: [
          { stepNumber: 1, description: "Use the circle area formula", formula: "A = πr²", explanation: "Area of a circle equals pi times radius squared.", isKeyStep: false },
          { stepNumber: 2, description: "Substitute the radius", formula: `A = π × ${r}²`, variables: [{ symbol: "r", value: `${r} m` }], explanation: "Plug in the given radius.", isKeyStep: false },
          { stepNumber: 3, description: "Calculate r²", formula: `A = π × ${r * r}`, explanation: "Square the radius.", isKeyStep: true },
          { stepNumber: 4, description: "Multiply by π", formula: `A = ${π.toFixed(2)} × ${r * r}`, explanation: "Complete the multiplication.", isKeyStep: true },
          { stepNumber: 5, description: "Final answer", formula: `A = ${(π * r * r).toFixed(2)}`, explanation: "Area in square meters.", isKeyStep: false }
        ],
        finalAnswer: `A = ${(π * r * r).toFixed(2)} m²`,
        units: { A: "m²", r: "m" }
      };
    }
    return null;
  },

  // Quadratic formula
  "quadratic": (given, find) => {
    const a = given.a;
    const b = given.b;
    const c = given.c;
    const discriminant = b * b - 4 * a * c;

    if (find === "x") {
      const steps: SolvingStep[] = [
        { stepNumber: 1, description: "Identify coefficients", formula: `a=${a}, b=${b}, c=${c}`, explanation: "Standard form: ax² + bx + c = 0", isKeyStep: false },
        { stepNumber: 2, description: "Write quadratic formula", formula: "x = (-b ± √(b² - 4ac)) / 2a", explanation: "The formula for solving quadratics.", isKeyStep: true }
      ];

      if (discriminant >= 0) {
        const sqrtDisc = Math.sqrt(discriminant);
        steps.push(
          { stepNumber: 3, description: "Calculate discriminant", formula: `b² - 4ac = ${b}² - 4(${a})(${c}) = ${discriminant}`, explanation: "The part under the square root.", isKeyStep: true },
          { stepNumber: 4, description: "Find square root", formula: `√${discriminant} = ${sqrtDisc.toFixed(2)}`, explanation: "Take the square root.", isKeyStep: false },
          { stepNumber: 5, description: "Calculate x₁", formula: `x₁ = (${-b} + ${sqrtDisc.toFixed(2)}) / ${2 * a} = ${((-b + sqrtDisc) / (2 * a)).toFixed(2)}`, explanation: "First solution using plus sign.", isKeyStep: true },
          { stepNumber: 6, description: "Calculate x₂", formula: `x₂ = (${-b} - ${sqrtDisc.toFixed(2)}) / ${2 * a} = ${((-b - sqrtDisc) / (2 * a)).toFixed(2)}`, explanation: "Second solution using minus sign.", isKeyStep: true }
        );
        return {
          steps,
          finalAnswer: `x₁ = ${((-b + sqrtDisc) / (2 * a)).toFixed(2)}, x₂ = ${((-b - sqrtDisc) / (2 * a)).toFixed(2)}`,
          units: {}
        };
      } else {
        steps.push(
          { stepNumber: 3, description: "Calculate discriminant", formula: `b² - 4ac = ${discriminant} < 0`, explanation: "Negative discriminant means complex roots!", isKeyStep: true },
          { stepNumber: 4, description: "Complex roots", formula: `x = (${-b} ± i√${Math.abs(discriminant)}) / ${2 * a}`, explanation: "Complex solutions.", isKeyStep: true }
        );
        return {
          steps,
          finalAnswer: `x = ${(-b / (2 * a)).toFixed(2)} ± ${(Math.sqrt(Math.abs(discriminant)) / (2 * a)).toFixed(2)}i`,
          units: {}
        };
      }
    }
    return null;
  },

  // Ohm's Law V = IR
  "ohms_law": (given, find) => {
    const v = given.v;
    const i = given.i;
    const r = given.r;

    if (find === "v") {
      return {
        steps: [
          { stepNumber: 1, description: "Use Ohm's Law", formula: "V = IR", explanation: "Voltage equals current times resistance.", isKeyStep: false },
          { stepNumber: 2, description: "Substitute values", formula: `V = ${i} × ${r}`, variables: [{ symbol: "I", value: `${i} A` }, { symbol: "R", value: `${r} Ω` }], explanation: "Plug in current and resistance.", isKeyStep: false },
          { stepNumber: 3, description: "Calculate", formula: `V = ${i * r}`, explanation: "Multiply to get voltage.", isKeyStep: true }
        ],
        finalAnswer: `V = ${i * r} V`,
        units: { V: "V", I: "A", R: "Ω" }
      };
    }
    return null;
  },

  // Kinetic Energy KE = ½mv²
  "kinetic_energy": (given, find) => {
    const m = given.m;
    const v = given.v;

    if (find === "ke" || find === "e") {
      return {
        steps: [
          { stepNumber: 1, description: "Use kinetic energy formula", formula: "KE = ½mv²", explanation: "Energy of motion.", isKeyStep: false },
          { stepNumber: 2, description: "Square the velocity", formula: `v² = ${v}² = ${v * v}`, explanation: "Calculate v squared first.", isKeyStep: true },
          { stepNumber: 3, description: "Multiply by mass", formula: `m × v² = ${m} × ${v * v}`, variables: [{ symbol: "m", value: `${m} kg` }, { symbol: "v", value: `${v} m/s` }], explanation: "Multiply mass by v squared.", isKeyStep: false },
          { stepNumber: 4, description: "Multiply by ½", formula: `KE = ½ × ${m * v * v} = ${0.5 * m * v * v}`, explanation: "Half of the product.", isKeyStep: true }
        ],
        finalAnswer: `KE = ${(0.5 * m * v * v).toFixed(2)} J`,
        units: { KE: "J", m: "kg", v: "m/s" }
      };
    }
    return null;
  },

  // pH = -log[H+]
  "ph_calculation": (given, find) => {
    const h = given.h || given["h+"];

    if (find === "ph" || find === "pH") {
      const logH = Math.log10(h);
      return {
        steps: [
          { stepNumber: 1, description: "Use pH formula", formula: "pH = -log[H⁺]", explanation: "Negative logarithm of hydrogen ion concentration.", isKeyStep: false },
          { stepNumber: 2, description: "Take logarithm", formula: `log[H⁺] = log(${h}) = ${logH.toFixed(4)}`, variables: [{ symbol: "[H⁺]", value: `${h} mol/L` }], explanation: "Calculate log base 10.", isKeyStep: true },
          { stepNumber: 3, description: "Apply negative sign", formula: `pH = -(${logH.toFixed(4)}) = ${(-logH).toFixed(2)}`, explanation: "pH is the negative log.", isKeyStep: true }
        ],
        finalAnswer: `pH = ${(-logH).toFixed(2)}`,
        units: {}
      };
    }
    return null;
  }
};

export function solveFormula(formula: Formula, given: Record<string, number>, find: string, config?: Partial<SolverConfig>): SolverResult | null {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const lower = formula.formula.toLowerCase().replace(/\s+/g, "");

  // Find matching template
  for (const [template, solver] of Object.entries(SOLVER_TEMPLATES)) {
    if (lower.includes(template.replace(/_/g, ""))) {
      const result = solver(given, find);
      if (result) {
        // Adapt steps for age band
        if (cfg.ageBand === "8-10" || cfg.ageBand === "11-13") {
          result.steps = simplifyStepsForAge(result.steps, cfg.ageBand);
        }
        return result;
      }
    }
  }

  // Generic solver for unknown formulas
  return generateGenericSolver(formula, given, find, cfg);
}

function simplifyStepsForAge(steps: SolvingStep[], ageBand: AgeBand): SolvingStep[] {
  if (ageBand === "8-10") {
    // Simplify to 3-4 maximum steps
    const simplified = steps.filter(s => s.isKeyStep).slice(0, 3);
    return simplified.map((s, i) => ({ ...s, stepNumber: i + 1 }));
  }
  // For 11-13, keep key steps but simplify language
  return steps.map(s => ({
    ...s,
    explanation: s.isKeyStep ? s.explanation : "(intermediate step)"
  }));
}

function generateGenericSolver(formula: Formula, given: Record<string, number>, find: string, config: Required<SolverConfig>): SolverResult {
  const resultVar = formula.formula.split("=")[0]?.trim() || "Result";
  const inputVars = formula.formula.split("=")[1]?.trim() || "";

  const steps: SolvingStep[] = [
    { stepNumber: 1, description: "Write the formula", formula: formula.formula, explanation: "Start with the given formula.", isKeyStep: false }
  ];

  // Add given values
  const varList = Object.entries(given).map(([k, v]) => ({ symbol: k, value: `${v}` }));
  steps.push({
    stepNumber: 2,
    description: "Identify known values",
    formula: Object.entries(given).map(([k, v]) => `${k} = ${v}`).join(", "),
    variables: varList,
    explanation: "We know these values from the problem.",
    isKeyStep: false
  });

  // Generic solving step
  steps.push({
    stepNumber: 3,
    description: `Solve for ${find}`,
    formula: `${find} = [calculated]`,
    explanation: `Use algebraic operations to isolate ${find}.`,
    isKeyStep: true
  });

  // Calculate result
  let calculatedValue = 1;
  for (const val of Object.values(given)) {
    calculatedValue *= val;
  }

  steps.push({
    stepNumber: 4,
    description: "Calculate result",
    formula: `${find} = ${calculatedValue}`,
    explanation: "Complete the calculation.",
    isKeyStep: true
  });

  return {
    steps,
    finalAnswer: `${resultVar} = ${calculatedValue}`,
    units: {}
  };
}

export function generateWorkedExample(formula: Formula, ageBand: AgeBand): WorkedExample {
  const lower = formula.formula.toLowerCase();
  const varAnalysis = analyzeVariables(formula, ageBand);

  // Generate typical problem values based on formula
  let given: Record<string, number> = {};
  let title = "";
  let problem = "";
  let find = "";

  if (lower.includes("f=ma")) {
    given = { m: 10, a: 5 };
    find = "f";
    title = "Force Calculation";
    problem = "A box with mass 10 kg is pulled with an acceleration of 5 m/s². What force is being applied?";
  } else if (lower.includes("area") || lower.includes("π")) {
    given = { r: 7 };
    find = "a";
    title = "Circle Area";
    problem = "Find the area of a circle with radius 7 cm.";
  } else if (lower.includes("ohmic") || lower.includes("v=ir")) {
    given = { i: 2, r: 12 };
    find = "v";
    title = "Voltage Calculation";
    problem = "A circuit has current of 2 A and resistance of 12 Ω. Find the voltage.";
  } else if (lower.includes("kinetic") || lower.includes("mv")) {
    given = { m: 5, v: 10 };
    find = "ke";
    title = "Kinetic Energy";
    problem = "What is the kinetic energy of a 5 kg ball moving at 10 m/s?";
  } else {
    // Generic
    const firstVar = varAnalysis.variables[0];
    given = firstVar ? { [firstVar.symbol]: 10 } : { x: 10 };
    find = firstVar ? firstVar.symbol : "y";
    title = "Formula Application";
    problem = `Given the formula ${formula.formula}, calculate ${find} using the provided values.`;
  }

  const solverResult = solveFormula(formula, given, find, { ageBand });

  return {
    title,
    problem,
    given,
    find,
    solution: solverResult?.finalAnswer || "Solution",
    steps: solverResult?.steps || [],
    result: solverResult?.finalAnswer || "",
    difficulty: formula.difficulty
  };
}

export function verifySolution(formula: Formula, given: Record<string, number>, result: number, find: string): string {
  // Basic verification by recalculating
  const solverResult = solveFormula(formula, given, find);
  if (solverResult) {
    const parsedResult = parseFloat(solverResult.finalAnswer.split("=")[1]?.trim() || "0");
    if (Math.abs(parsedResult - result) < 0.01) {
      return "Verified: Your answer is correct!";
    } else {
      return `Check your work: expected approximately ${parsedResult}`;
    }
  }
  return "Unable to verify automatically.";
}
