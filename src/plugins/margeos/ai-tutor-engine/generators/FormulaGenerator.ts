import type { FormulaCardData } from "../cards/FormulaCard";

export interface FormulaGenOptions {
  formulaTitle: string;
  latex?: string;
  subject?: string;
}

export function generateFormulaData(opts: FormulaGenOptions): FormulaCardData {
  return {
    title: opts.formulaTitle,
    formula: opts.latex || "F = m \\times a",
    variables: [
      { name: "Force / Output Magnitude", symbol: "F", unit: "N (Newtons)", description: "Vector force applied to system" },
      { name: "Mass / System Inertia", symbol: "m", unit: "kg", description: "Inherent resistance to acceleration" },
      { name: "Acceleration / Rate of Change", symbol: "a", unit: "m/s²", description: "Rate of change of velocity over time" }
    ],
    explanation: `This formula states that force equals mass times acceleration. Increasing force increases acceleration linearly for a constant mass.`,
    workedExample: {
      problem: "Calculate the force required to accelerate a 10 kg object at 5 m/s².",
      solutionSteps: [
        "Identify given variables: m = 10 kg, a = 5 m/s²",
        "Apply formula: F = m × a",
        "Substitute values: F = 10 × 5"
      ],
      result: "F = 50 N"
    },
    commonMistakes: [
      "Mixing units (e.g. using grams instead of kilograms).",
      "Forgetting that Force and Acceleration are vector quantities with direction."
    ],
    practiceExercises: [
      "If F = 100 N and m = 20 kg, solve for acceleration a.",
      "What happens to acceleration if mass is doubled while keeping force constant?"
    ]
  };
}
