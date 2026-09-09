// @ts-nocheck
// Formula Engine — PracticeGenerator
// Feature 7: Generate practice questions with hints and explanations
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, PracticeQuestion, FormulaDifficulty } from "../models/FormulaModels";
import { analyzeVariables } from "./VariableAnalyzer";

export interface PracticeConfig {
  ageBand: AgeBand;
  difficulty: FormulaDifficulty;
  count: number;
  includeHints: boolean;
  includeMultipleChoice: boolean;
}

const DEFAULT_PRACTICE_CONFIG: PracticeConfig = {
  ageBand: "14-16",
  difficulty: "intermediate",
  count: 5,
  includeHints: true,
  includeMultipleChoice: true
};

let questionCounter = 0;
function generateId(): string {
  return `pq_${Date.now()}_${++questionCounter}`;
}

export function generatePracticeQuestions(formula: Formula, config: Partial<PracticeConfig> = {}): PracticeQuestion[] {
  const cfg = { ...DEFAULT_PRACTICE_CONFIG, ...config };
  const questions: PracticeQuestion[] = [];
  const lower = formula.formula.toLowerCase();

  // Generate based on formula type
  if (lower.includes("f=ma")) {
    questions.push(...generateForceQuestions(cfg));
  } else if (lower.includes("area") || lower.includes("π")) {
    questions.push(...generateAreaQuestions(cfg));
  } else if (lower.includes("ohmic") || lower.includes("v=ir")) {
    questions.push(...generateOhmsLawQuestions(cfg));
  } else if (lower.includes("kinetic") || lower.includes("mv²")) {
    questions.push(...generateEnergyQuestions(cfg));
  } else if (lower.includes("quadratic")) {
    questions.push(...generateQuadraticQuestions(cfg));
  } else if (lower.includes("ph=")) {
    questions.push(...generatePHQuestions(cfg));
  } else {
    questions.push(...generateGenericQuestions(formula, cfg));
  }

  return questions.slice(0, cfg.count);
}

function generateForceQuestions(cfg: PracticeConfig): PracticeQuestion[] {
  if (cfg.difficulty === "beginner" || cfg.ageBand === "8-10") {
    return [
      {
        id: generateId(),
        question: "A ball has mass 3 kg. You push it and it speeds up by 4 m/s². How much force did you use?",
        given: { m: 3, a: 4 },
        find: "F",
        correctAnswer: "12 N",
        options: ["7 N", "12 N", "34 N", "0.75 N"],
        difficulty: "beginner",
        hint: "Multiply mass (3) by acceleration (4)",
        explanation: "F = ma = 3 × 4 = 12 N. This follows Newton's Second Law."
      },
      {
        id: generateId(),
        question: "You push with 20 N of force on a 5 kg box. How fast does it accelerate?",
        given: { F: 20, m: 5 },
        find: "a",
        correctAnswer: "4 m/s²",
        options: ["100 m/s²", "4 m/s²", "25 m/s²", "15 m/s²"],
        difficulty: "beginner",
        hint: "Divide force by mass: F ÷ m",
        explanation: "a = F/m = 20/5 = 4 m/s²"
      }
    ];
  } else if (cfg.difficulty === "intermediate") {
    return [
      {
        id: generateId(),
        question: "A car of mass 1200 kg accelerates from rest to 30 m/s in 10 seconds. What is the average force exerted by the engine?",
        given: { m: 1200, v_initial: 0, v_final: 30, t: 10 },
        find: "F",
        correctAnswer: "3600 N",
        options: ["120 N", "360 N", "3600 N", "12000 N"],
        difficulty: "intermediate",
        hint: "First find acceleration: a = (v₂ - v₁)/t",
        explanation: "a = (30 - 0)/10 = 3 m/s². Then F = ma = 1200 × 3 = 3600 N"
      },
      {
        id: generateId(),
        question: "A rocket experiences 50000 N thrust and accelerates at 25 m/s². What is the rocket's mass?",
        given: { F: 50000, a: 25 },
        find: "m",
        correctAnswer: "2000 kg",
        options: ["2000 kg", "1250 kg", "50000 kg", "75 kg"],
        difficulty: "intermediate",
        hint: "Rearrange F = ma to solve for m: m = F/a",
        explanation: "m = F/a = 50000/25 = 2000 kg"
      }
    ];
  } else {
    return [
      {
        id: generateId(),
        question: "A 2 kg object experiences forces of 10 N east and 6 N west simultaneously. What is the acceleration?",
        given: { F_east: 10, F_west: 6, m: 2 },
        find: "a",
        correctAnswer: "2 m/s² east",
        options: ["8 m/s² east", "2 m/s² east", "4 m/s² west", "2 m/s² west"],
        difficulty: "advanced",
        hint: "Net force = F_east - F_west (they oppose each other)",
        explanation: "Net F = 10 - 6 = 4 N east. a = F_net/m = 4/2 = 2 m/s² east"
      },
      {
        id: generateId(),
        question: "An object with mass 5 kg accelerates at 4 m/s². After 3 seconds of this acceleration, what is its momentum?",
        given: { m: 5, a: 4, t: 3 },
        find: "p",
        correctAnswer: "60 kg·m/s",
        options: ["20 kg·m/s", "60 kg·m/s", "15 kg·m/s", "12 kg·m/s"],
        difficulty: "advanced",
        hint: "First find final velocity, then p = mv",
        explanation: "v = at = 4×3 = 12 m/s. p = mv = 5×12 = 60 kg·m/s"
      }
    ];
  }
}

function generateAreaQuestions(cfg: PracticeConfig): PracticeQuestion[] {
  return [
    {
      id: generateId(),
      question: "Find the area of a circle with radius 7 cm. Use π = 22/7.",
      given: { r: 7, π: 22/7 },
      find: "A",
      correctAnswer: "154 cm²",
      options: ["44 cm²", "154 cm²", "22 cm²", "14 cm²"],
      difficulty: cfg.difficulty === "beginner" ? "beginner" : "intermediate",
      hint: "A = πr². First find r², then multiply by π",
      explanation: "r² = 7×7 = 49. A = (22/7)×49 = 22×7 = 154 cm²"
    },
    {
      id: generateId(),
      question: "A circular pond has a diameter of 20 meters. What is its surface area?",
      given: { d: 20, π: 3.14 },
      find: "A",
      correctAnswer: "314 m²",
      options: ["62.8 m²", "314 m²", "1256 m²", "20 m²"],
      difficulty: "intermediate",
      hint: "Remember: radius = diameter ÷ 2",
      explanation: "r = 20/2 = 10 m. A = π×10² = 3.14×100 = 314 m²"
    }
  ];
}

function generateOhmsLawQuestions(cfg: PracticeConfig): PracticeQuestion[] {
  return [
    {
      id: generateId(),
      question: "A circuit has 12 V battery and 4 Ω resistor. What current flows through the circuit?",
      given: { V: 12, R: 4 },
      find: "I",
      correctAnswer: "3 A",
      options: ["0.33 A", "3 A", "48 A", "8 A"],
      difficulty: "intermediate",
      hint: "I = V/R from Ohm's Law",
      explanation: "I = V/R = 12/4 = 3 A"
    },
    {
      id: generateId(),
      question: "A device draws 2 A current from a 9 V battery. What is its resistance?",
      given: { I: 2, V: 9 },
      find: "R",
      correctAnswer: "4.5 Ω",
      options: ["18 Ω", "4.5 Ω", "11 Ω", "7 Ω"],
      difficulty: "intermediate",
      hint: "Rearrange V = IR to solve for R",
      explanation: "R = V/I = 9/2 = 4.5 Ω"
    }
  ];
}

function generateEnergyQuestions(cfg: PracticeConfig): PracticeQuestion[] {
  return [
    {
      id: generateId(),
      question: "A 2 kg ball rolls at 5 m/s. What is its kinetic energy?",
      given: { m: 2, v: 5 },
      find: "KE",
      correctAnswer: "25 J",
      options: ["10 J", "25 J", "50 J", "100 J"],
      difficulty: "intermediate",
      hint: "KE = ½mv². Square the velocity first!",
      explanation: "v² = 25, so KE = ½×2×25 = 25 J"
    },
    {
      id: generateId(),
      question: "An object has 200 J of kinetic energy and is moving at 10 m/s. What is its mass?",
      given: { KE: 200, v: 10 },
      find: "m",
      correctAnswer: "4 kg",
      options: ["20 kg", "4 kg", "2000 kg", "2 kg"],
      difficulty: "advanced",
      hint: "Rearrange KE = ½mv² to solve for m",
      explanation: "m = 2×KE/v² = 2×200/100 = 400/100 = 4 kg"
    }
  ];
}

function generateQuadraticQuestions(cfg: PracticeConfig): PracticeQuestion[] {
  return [
    {
      id: generateId(),
      question: "Solve: x² - 5x + 6 = 0. What is the sum of the two solutions?",
      given: { a: 1, b: -5, c: 6 },
      find: "x₁ + x₂",
      correctAnswer: "5",
      options: ["5", "6", "-5", "1"],
      difficulty: "advanced",
      hint: "For x² + bx + c = 0, sum of roots = -b (Vieta's formula)",
      explanation: "Sum = -b/a = -(-5)/1 = 5"
    },
    {
      id: generateId(),
      question: "Solve: x² - 9 = 0. What are the solutions?",
      given: { a: 1, b: 0, c: -9 },
      find: "x",
      correctAnswer: "x = 3 or x = -3",
      options: ["x = 3", "x = -3", "x = 3 or x = -3", "x = 9"],
      difficulty: "intermediate",
      hint: "This is a difference of squares: (x-3)(x+3) = 0",
      explanation: "x² = 9, so x = ±√9 = ±3"
    }
  ];
}

function generatePHQuestions(cfg: PracticeConfig): PracticeQuestion[] {
  return [
    {
      id: generateId(),
      question: "A solution has [H⁺] = 0.001 mol/L. Calculate its pH.",
      given: { h: 0.001 },
      find: "pH",
      correctAnswer: "3",
      options: ["1", "3", "-3", "0.001"],
      difficulty: "intermediate",
      hint: "pH = -log[H⁺]. log(0.001) = -3",
      explanation: "log(10⁻³) = -3, so pH = -(-3) = 3"
    },
    {
      id: generateId(),
      question: "A solution has pH = 7. Is it acidic, basic, or neutral?",
      given: { pH: 7 },
      find: "nature",
      correctAnswer: "neutral",
      options: ["acidic", "neutral", "basic", "cannot determine"],
      difficulty: "beginner",
      hint: "pH 7 is the neutral point (like pure water)",
      explanation: "pH < 7 = acidic, pH = 7 = neutral, pH > 7 = basic"
    }
  ];
}

function generateGenericQuestions(formula: Formula, cfg: PracticeConfig): PracticeQuestion[] {
  return [
    {
      id: generateId(),
      question: `Using the formula ${formula.formula}, calculate the result given the following values.`,
      given: { x: 5, y: 3 },
      find: formula.formula.split("=")[0]?.trim() || "result",
      correctAnswer: "Calculate based on formula",
      options: ["Option A", "Option B", "Option C", "Option D"],
      difficulty: cfg.difficulty,
      hint: "Substitute the values and calculate step by step",
      explanation: "Follow the formula and perform the operations in the correct order."
    }
  ];
}

// Practice session management
export interface PracticeSession {
  formula: Formula;
  questions: PracticeQuestion[];
  currentIndex: number;
  answers: Record<string, string>;
  startedAt: Date;
  completedAt?: Date;
}

export function createPracticeSession(formula: Formula, config?: Partial<PracticeConfig>): PracticeSession {
  return {
    formula,
    questions: generatePracticeQuestions(formula, config),
    currentIndex: 0,
    answers: {},
    startedAt: new Date()
  };
}

export function evaluateAnswer(session: PracticeSession, questionId: string, answer: string): {
  correct: boolean;
  explanation: string;
  correctAnswer: string;
} {
  const question = session.questions.find(q => q.id === questionId);
  if (!question) {
    return { correct: false, explanation: "Question not found", correctAnswer: "" };
  }

  const correct = answer === question.correctAnswer;
  return {
    correct,
    explanation: question.explanation,
    correctAnswer: question.correctAnswer
  };
}
