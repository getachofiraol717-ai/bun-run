// @ts-nocheck
// Formula Engine — ExampleGenerator
// Feature 6: Generate worked examples with multiple difficulty levels
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, LearningStyle, WorkedExample, PracticeQuestion } from "../models/FormulaModels";
import { analyzeVariables } from "./VariableAnalyzer";

export interface ExampleConfig {
  ageBand: AgeBand;
  learningStyle: LearningStyle;
  count: number;
  difficultyOverride?: "beginner" | "intermediate" | "advanced";
}

const DEFAULT_EXAMPLE_CONFIG: ExampleConfig = {
  ageBand: "14-16",
  learningStyle: "mixed",
  count: 3
};

interface ExampleTemplate {
  title: string;
  problem: string;
  given: Record<string, number | string>;
  find: string;
  result: string;
  explanation: string;
}

export function generateExamples(formula: Formula, config: Partial<ExampleConfig> = {}): WorkedExample[] {
  const cfg = { ...DEFAULT_EXAMPLE_CONFIG, ...config };
  const examples: WorkedExample[] = [];
  const lower = formula.formula.toLowerCase();

  // Generate based on formula type
  if (lower.includes("f=ma")) {
    examples.push(...generatePhysicsExamples(cfg.ageBand));
  } else if (lower.includes("area") || lower.includes("π") || lower.includes("circle")) {
    examples.push(...generateGeometryExamples(cfg.ageBand));
  } else if (lower.includes("ohmic") || lower.includes("v=ir")) {
    examples.push(...generateElectronicsExamples(cfg.ageBand));
  } else if (lower.includes("kinetic") || lower.includes("mv²")) {
    examples.push(...generateEnergyExamples(cfg.ageBand));
  } else if (lower.includes("quadratic")) {
    examples.push(...generateQuadraticExamples(cfg.ageBand));
  } else if (lower.includes("ph=")) {
    examples.push(...generateChemistryExamples(cfg.ageBand));
  } else {
    examples.push(...generateGenericExamples(formula, cfg));
  }

  return examples.slice(0, cfg.count);
}

function generatePhysicsExamples(ageBand: AgeBand): WorkedExample[] {
  if (ageBand === "8-10") {
    return [
      {
        title: "Pushing a Cart",
        problem: "You push a toy cart that weighs 5 kg. It speeds up by 2 m/s². How hard are you pushing?",
        given: { m: 5, a: 2 },
        find: "F",
        solution: "F = 10 N",
        steps: [
          { stepNumber: 1, description: "Use the formula", formula: "F = m × a", explanation: "Force equals mass times acceleration.", isKeyStep: false },
          { stepNumber: 2, description: "Put in the numbers", formula: "F = 5 × 2", explanation: "5 kg times 2 m/s²", isKeyStep: false },
          { stepNumber: 3, description: "Get the answer", formula: "F = 10 N", explanation: "You pushed with 10 Newtons of force!", isKeyStep: true }
        ],
        result: "F = 10 N",
        difficulty: "beginner"
      }
    ];
  } else if (ageBand === "14-16") {
    return [
      {
        title: "Car Acceleration",
        problem: "A 1500 kg car accelerates from rest to 27 m/s (about 97 km/h) in 9 seconds. Calculate the accelerating force.",
        given: { m: 1500, a: 3 },
        find: "F",
        solution: "F = 4500 N",
        steps: [
          { stepNumber: 1, description: "Calculate acceleration", formula: "a = Δv/Δt = 27/9 = 3 m/s²", explanation: "Change in velocity divided by time.", isKeyStep: true },
          { stepNumber: 2, description: "Apply Newton's Second Law", formula: "F = ma", explanation: "F = 1500 × 3", isKeyStep: false },
          { stepNumber: 3, description: "Calculate force", formula: "F = 4500 N", explanation: "The engine provides 4500 N of force.", isKeyStep: true }
        ],
        result: "F = 4500 N",
        difficulty: "intermediate"
      },
      {
        title: "Braking Force",
        problem: "A 800 kg car needs to stop from 20 m/s in 4 seconds. What braking force is required?",
        given: { m: 800, a: -5 },
        find: "F",
        solution: "F = -4000 N (negative means opposite to motion)",
        steps: [
          { stepNumber: 1, description: "Calculate deceleration", formula: "a = (0 - 20)/4 = -5 m/s²", explanation: "Negative acceleration because we're slowing down.", isKeyStep: true },
          { stepNumber: 2, description: "Calculate force", formula: "F = 800 × (-5) = -4000 N", explanation: "Negative sign shows force opposes motion.", isKeyStep: true }
        ],
        result: "F = -4000 N",
        difficulty: "intermediate"
      }
    ];
  } else {
    return [
      {
        title: "Variable Mass System",
        problem: "A rocket burns fuel at 50 kg/s, expelling it at 2000 m/s relative to the rocket. Initial mass is 10000 kg. Find the initial thrust.",
        given: { m_dot: 50, v_exhaust: 2000, m_initial: 10000 },
        find: "F",
        solution: "F = 100,000 N",
        steps: [
          { stepNumber: 1, description: "Use Tsiolkovsky rocket equation concept", formula: "F = v × dm/dt", explanation: "Thrust equals exhaust velocity times mass flow rate.", isKeyStep: true },
          { stepNumber: 2, description: "Substitute values", formula: "F = 2000 × 50", explanation: "2000 m/s × 50 kg/s", isKeyStep: false },
          { stepNumber: 3, description: "Calculate", formula: "F = 100,000 N", explanation: "Significant thrust for liftoff.", isKeyStep: true }
        ],
        result: "F = 100,000 N",
        difficulty: "advanced"
      }
    ];
  }
}

function generateGeometryExamples(ageBand: AgeBand): WorkedExample[] {
  if (ageBand === "8-10") {
    return [
      {
        title: "Pizza Area",
        problem: "A pizza has a radius of 10 cm. How much space does it cover? (Use π ≈ 3)",
        given: { r: 10, π: 3 },
        find: "A",
        solution: "A = 300 cm²",
        steps: [
          { stepNumber: 1, description: "Square the radius", formula: "r² = 10 × 10 = 100", explanation: "First multiply 10 by itself.", isKeyStep: true },
          { stepNumber: 2, description: "Multiply by π", formula: "A = 3 × 100 = 300", explanation: "Then multiply by pi.", isKeyStep: true },
          { stepNumber: 3, description: "Answer", formula: "A = 300 cm²", explanation: "The pizza covers 300 square centimeters!", isKeyStep: true }
        ],
        result: "A = 300 cm²",
        difficulty: "beginner"
      }
    ];
  } else {
    return [
      {
        title: "Circular Garden",
        problem: "A circular garden has a diameter of 14 meters. Calculate its area in square meters. (Use π = 22/7)",
        given: { d: 14, r: 7, π: 22/7 },
        find: "A",
        solution: "A = 154 m²",
        steps: [
          { stepNumber: 1, description: "Find radius", formula: "r = d/2 = 7 m", explanation: "Radius is half the diameter.", isKeyStep: false },
          { stepNumber: 2, description: "Apply area formula", formula: "A = πr² = (22/7) × 49", explanation: "Substitute into A = πr².", isKeyStep: true },
          { stepNumber: 3, description: "Calculate", formula: "A = 154 m²", explanation: "The garden covers 154 square meters.", isKeyStep: true }
        ],
        result: "A = 154 m²",
        difficulty: "intermediate"
      }
    ];
  }
}

function generateElectronicsExamples(ageBand: AgeBand): WorkedExample[] {
  return [
    {
      title: "LED Circuit",
      problem: "A LED in a circuit draws 20 mA when connected to 5 V. What resistance is needed to protect the LED?",
      given: { V: 5, I: 0.02 },
      find: "R",
      solution: "R = 250 Ω",
      steps: [
        { stepNumber: 1, description: "Use Ohm's Law", formula: "R = V/I", explanation: "Rearrange V = IR to solve for R.", isKeyStep: true },
        { stepNumber: 2, description: "Substitute values", formula: "R = 5 V / 0.02 A", explanation: "20 mA = 0.02 A", isKeyStep: false },
        { stepNumber: 3, description: "Calculate", formula: "R = 250 Ω", explanation: "Use a 250 ohm resistor (or next standard value).", isKeyStep: true }
      ],
      result: "R = 250 Ω",
      difficulty: "intermediate"
    }
  ];
}

function generateEnergyExamples(ageBand: AgeBand): WorkedExample[] {
  return [
    {
      title: "Bouncing Ball",
      problem: "A 0.5 kg ball is thrown upward at 10 m/s. Calculate its kinetic energy at the moment of release.",
      given: { m: 0.5, v: 10 },
      find: "KE",
      solution: "KE = 25 J",
      steps: [
        { stepNumber: 1, description: "Use kinetic energy formula", formula: "KE = ½mv²", explanation: "Energy of motion.", isKeyStep: false },
        { stepNumber: 2, description: "Square the velocity", formula: "v² = 10² = 100", explanation: "10 times 10.", isKeyStep: true },
        { stepNumber: 3, description: "Multiply all terms", formula: "KE = ½ × 0.5 × 100 = 25 J", explanation: "Half mass times velocity squared.", isKeyStep: true }
      ],
      result: "KE = 25 J",
      difficulty: "intermediate"
    }
  ];
}

function generateQuadraticExamples(ageBand: AgeBand): WorkedExample[] {
  return [
    {
      title: "Projectile Path",
      problem: "A ball is thrown with height given by h = -5t² + 20t + 1. At what times is the height 6 meters?",
      given: { a: -5, b: 20, c: -5 },
      find: "t",
      solution: "t = 0.28 s or t = 3.72 s",
      steps: [
        { stepNumber: 1, description: "Set equation to zero", formula: "-5t² + 20t + 1 = 6 → -5t² + 20t - 5 = 0", explanation: "Subtract 6 from both sides.", isKeyStep: false },
        { stepNumber: 2, description: "Use quadratic formula", formula: "t = (-20 ± √(400 - 100)) / (-10)", explanation: "a=-5, b=20, c=-5", isKeyStep: true },
        { stepNumber: 3, description: "Calculate discriminant", formula: "√300 ≈ 17.32", explanation: "Inside the square root.", isKeyStep: true },
        { stepNumber: 4, description: "Find both solutions", formula: "t = (20 ± 17.32) / 10 → t ≈ 0.28 or 3.72", explanation: "Ball is at 6m on the way up and down.", isKeyStep: true }
      ],
      result: "t = 0.28 s, 3.72 s",
      difficulty: "advanced"
    }
  ];
}

function generateChemistryExamples(ageBand: AgeBand): WorkedExample[] {
  return [
    {
      title: "Acidity of Lemon Juice",
      problem: "Lemon juice has a hydrogen ion concentration of 0.005 mol/L. Calculate its pH.",
      given: { h: 0.005 },
      find: "pH",
      solution: "pH = 2.30",
      steps: [
        { stepNumber: 1, description: "Take logarithm", formula: "log(0.005) = log(5 × 10⁻³) = log 5 + log 10⁻³ = 0.699 - 3 = -2.301", explanation: "Use log properties.", isKeyStep: true },
        { stepNumber: 2, description: "Apply negative sign", formula: "pH = -(-2.301) = 2.30", explanation: "pH is the negative log.", isKeyStep: true },
        { stepNumber: 3, description: "Interpret result", formula: "pH ≈ 2.3 (strongly acidic)", explanation: "Lemon juice is indeed very sour!", isKeyStep: false }
      ],
      result: "pH = 2.30",
      difficulty: "intermediate"
    }
  ];
}

function generateGenericExamples(formula: Formula, config: ExampleConfig): WorkedExample[] {
  const varAnalysis = analyzeVariables(formula, config.ageBand);
  const example: WorkedExample = {
    title: "Applying the Formula",
    problem: `Use ${formula.formula} to solve for one of the variables.`,
    given: Object.fromEntries(varAnalysis.variables.slice(0, 2).map(v => [v.symbol, 10])),
    find: formula.formula.split("=")[0]?.trim() || "result",
    solution: `${formula.formula.split("=")[0]?.trim()} = 100`,
    steps: [
      { stepNumber: 1, description: "Identify the formula", formula: formula.formula, explanation: "Write down the formula.", isKeyStep: false },
      { stepNumber: 2, description: "Substitute known values", formula: "Substitute the given values", explanation: "Replace symbols with numbers.", isKeyStep: true },
      { stepNumber: 3, description: "Calculate", formula: "Compute the result", explanation: "Perform the arithmetic.", isKeyStep: true }
    ],
    result: "Result calculated",
    difficulty: formula.difficulty
  };

  return [example];
}
