// Formula Engine — MistakeAnalyzer
// Feature 8: Detect and explain common mistakes with corrections
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, MistakeEntry } from "../models/FormulaModels";

export interface MistakeAnalysis {
  mistakes: MistakeEntry[];
  preventionTips: string[];
  relatedFormulas: string[];
}

export interface StudentMistake {
  attemptedFormula: string;
  expectedAnswer: string;
  actualAnswer: string;
  studentAge?: AgeBand;
}

const MISTAKE_DATABASE: Record<string, MistakeEntry[]> = {
  "f=ma": [
    {
      mistake: "Confusing mass and weight",
      why: "Weight (in Newtons) = mass × gravity. Students often think mass and weight are the same. On Earth, weight = mass × 9.8, but on the Moon, the same mass has different weight.",
      correction: "Always distinguish: mass (kg) is the amount of matter, weight (N) is the force of gravity on that mass. Use the formula W = mg when asked for weight.",
      prevention: "Circle the units in your answer: kg means mass, N means force. Ask: 'Am I finding how much stuff, or how hard gravity pulls on it?'"
    },
    {
      mistake: "Forgetting to convert units",
      why: "If mass is in grams instead of kilograms, or distance in cm instead of m, the answer will be wrong. Physics requires consistent SI units.",
      correction: "Always convert to SI base units at the start: kg (not g), m (not cm), s (not min).",
      prevention: "Before calculating, write down all values with units. If any aren't in SI, convert first. Make a habit: 'Convert → Calculate → Check units'"
    },
    {
      mistake: "Using negative acceleration incorrectly",
      why: "Students sometimes forget that deceleration is just negative acceleration in the direction of motion. The sign matters!",
      correction: "Define your positive direction first. If the acceleration opposes motion, it should be negative in your calculations.",
      prevention: "Draw a diagram showing the direction of motion and forces. If forces oppose motion, they'll have negative signs."
    },
    {
      mistake: "Multiplying when should divide",
      why: "When rearranging F = ma, students often flip the operation. 'More mass = less acceleration for same force' means division, not multiplication.",
      correction: "If you double the mass with constant force, acceleration halves. Use the rearranged formula: a = F/m or m = F/a depending on what you're solving for.",
      prevention: "Ask yourself: 'If I increase this variable, should my answer get bigger or smaller?' This helps verify your formula arrangement."
    }
  ],
  "area_circle": [
    {
      mistake: "Using diameter instead of radius",
      why: "The formula A = πr² uses radius, but students often mistakenly use diameter. Radius is half the diameter.",
      correction: "If you're given diameter (d), first calculate r = d/2, then use A = πr².",
      prevention: "Always ask: 'Do I have radius or diameter?' If diameter, divide by 2 first. Draw a radius line on the circle."
    },
    {
      mistake: "Forgetting to square the radius",
      why: "A = πr² means r × r. Students sometimes multiply π by r once instead of squaring r first.",
      correction: "Calculate r² = r × r, then multiply by π. Never multiply π by r alone.",
      prevention: "Say the formula aloud: 'pi-ARR-squared'. The 'squared' part tells you to square the radius first."
    },
    {
      mistake: "Using wrong value for π",
      why: "Sometimes 3.14 is enough, sometimes you need more precision. Using the wrong π can cause small errors.",
      correction: "Check if the problem specifies π. If not, 3.14 is usually fine for basic problems, 3.14159 for more precision.",
      prevention: "Note the π value used in the problem. If none given, write down which π you're using so you stay consistent."
    }
  ],
  "quadratic": [
    {
      mistake: "Forgetting to set equation to zero",
      why: "The quadratic formula solves ax² + bx + c = 0. If your equation isn't set to zero, you can't directly apply it.",
      correction: "Rearrange your equation so one side equals zero. For x² + 5x = 6, write x² + 5x - 6 = 0 first.",
      prevention: "Before applying any formula, check that it's in the correct form: ax² + bx + c = 0."
    },
    {
      mistake: "Sign errors in the formula",
      why: "The formula is x = (-b ± √(b²-4ac)) / 2a. The negative b is inside parentheses, and the denominator is 2a, not just 2.",
      correction: "Write the formula step by step: 1) Calculate -b 2) Calculate b²-4ac 3) Take square root 4) Add/subtract from -b 5) Divide by 2a.",
      prevention: "Parentheses matter! Write each step separately. Check: Is -b correct? Is 2a in the denominator (not just 2)?"
    },
    {
      mistake: "Not checking the discriminant",
      why: "If b² - 4ac < 0, there are no real solutions. Students often ignore this and try to take square roots of negative numbers.",
      correction: "Always calculate the discriminant (b² - 4ac) first. If negative: no real roots. If zero: one repeated root. If positive: two real roots.",
      prevention: "Before calculating square roots, check the sign of the discriminant. Say: 'discriminant is positive → two solutions.'"
    }
  ],
  "ohms_law": [
    {
      mistake: "Confusing V, I, and R",
      why: "The three variables look similar. Voltage is potential, current is flow, resistance is opposition. Mixing them up gives completely wrong answers.",
      correction: "Use the triangle method: V at top, I and R at bottom. Cover what you want, read remaining symbols. If V on top and I below, V÷I=R.",
      prevention: "Draw the V-I-R triangle until it's automatic. Remember: V is cause (battery), I is effect (current flows), R resists."
    },
    {
      mistake: "Forgetting units",
      why: "3 volts divided by 2 amps gives 1.5, but the answer must be in ohms. Without units, you can't tell if your answer is reasonable.",
      correction: "V in volts, I in amps, R in ohms. Always include units in your answer and during calculations.",
      prevention: "Write units with every number from the start. Ask: 'If I put V and A into this formula, what unit do I get?'"
    }
  ],
  "kinetic_energy": [
    {
      mistake: "Forgetting to square the velocity",
      why: "KE = ½mv². The v is squared. Doubling the speed quadruples the kinetic energy (not doubles).",
      correction: "Calculate v² first, then multiply by mass and ½. Never multiply by v only.",
      prevention: "Say the formula aloud with emphasis: 'one-half em-vee-squared'. Notice the squared is on the v."
    },
    {
      mistake: "Thinking energy has direction",
      why: "Unlike velocity and momentum, kinetic energy is a scalar. It has no direction. A ball moving north or south at the same speed has the same KE.",
      correction: "KE is always positive (or zero). If you get a negative answer, something went wrong.",
      prevention: "Ask: 'Can energy be negative?' No! Check your signs if you get a negative KE."
    }
  ],
  "ph_calculation": [
    {
      mistake: "Taking log of negative number",
      why: "pH = -log[H⁺]. The [H⁺] must be positive. Some students try to find pH of bases (like NaOH) using this formula directly.",
      correction: "For bases, first find [H⁺] from pOH or Kw. For strong acids with [H⁺] < 1, pH will be positive.",
      prevention: "Remember: pH applies to [H⁺]. If given [OH⁻], use pOH first or find [H⁺] = Kw/[OH⁻]."
    },
    {
      mistake: "Thinking pH can only be 0-14",
      why: "The pH scale is logarithmic. A pH of -1 means [H⁺] = 10 M, which is possible for very strong concentrated acids.",
      correction: "pH can be negative for very strong acids and greater than 14 for very strong bases. 0-14 is common but not a hard limit.",
      prevention: "pH < 0 and pH > 14 are possible. Check if your [H⁺] is reasonable: very concentrated = extreme pH."
    }
  ]
};

export function getCommonMistakes(formula: Formula): MistakeAnalysis {
  const lower = formula.formula.toLowerCase();

  // Find matching mistakes
  let mistakes: MistakeEntry[] = [];
  for (const [key, entries] of Object.entries(MISTAKE_DATABASE)) {
    if (lower.includes(key.toLowerCase().replace(/_/g, ""))) {
      mistakes = entries;
      break;
    }
  }

  // If no specific match, generate generic mistakes
  if (mistakes.length === 0) {
    mistakes = generateGenericMistakes(formula);
  }

  const preventionTips = extractPreventionTips(mistakes);
  const relatedFormulas = findRelatedFormulas(formula);

  return {
    mistakes,
    preventionTips,
    relatedFormulas
  };
}

function generateGenericMistakes(formula: Formula): MistakeEntry[] {
  return [
    {
      mistake: "Algebraic rearrangement errors",
      why: "When solving for a different variable, students often make sign errors or forget to apply operations to all terms.",
      correction: "Write out each step clearly. If you divide by a variable, divide every term. If you subtract, subtract from every term.",
      prevention: "Use the 'do the same thing to both sides' rule consistently. Check your rearranged formula with a simple test."
    },
    {
      mistake: "Unit conversion mistakes",
      why: "Physics and chemistry require consistent units. Mixing systems (metric vs imperial, or different metric prefixes) causes errors.",
      correction: "Convert all values to base units (kg, m, s, K, mol) before plugging into formulas.",
      prevention: "Make a unit conversion checklist at the start of every problem. Ask: 'Are all my units consistent?'"
    },
    {
      mistake: "Order of operations errors",
      why: "Formulas have specific operation orders. Ignoring parentheses or exponent rules changes the result.",
      correction: "Follow PEMDAS/BODMAS: Parentheses/Brackets, Orders (exponents), Division/Multiplication, Addition/Subtraction.",
      prevention: "Write each step as a new line. Don't try to do too much in one calculation."
    }
  ];
}

function extractPreventionTips(mistakes: MistakeEntry[]): string[] {
  const tips = mistakes.map(m => m.prevention);
  // Add some universal tips
  tips.unshift("Read the problem twice before starting");
  tips.push("Check your answer: does it make physical sense?");
  tips.push("If stuck, draw a diagram");
  return [...new Set(tips)];
}

function findRelatedFormulas(formula: Formula): string[] {
  const lower = formula.formula.toLowerCase();
  const related: string[] = [];

  // Find formulas from the same topic
  if (lower.includes("f=ma") || lower.includes("force")) {
    related.push("W = Fd (Work)", "P = W/t (Power)", "p = mv (Momentum)", "E = ½mv² (Kinetic Energy)");
  }
  if (lower.includes("area") || lower.includes("π")) {
    related.push("C = 2πr (Circumference)", "V = πr²h (Cylinder Volume)", "A = ½bh (Triangle Area)");
  }
  if (lower.includes("ohmic") || lower.includes("v=ir")) {
    related.push("P = VI (Power)", "R = ρL/A (Resistance formula)", "V = IR (Ohm's Law)");
  }
  if (lower.includes("kinetic") || lower.includes("mv²")) {
    related.push("p = mv (Momentum)", "W = ΔKE (Work-Energy Theorem)", "PE = mgh (Potential Energy)");
  }

  return related.slice(0, 5); // Limit to 5 related formulas
}

// Analyze a specific student mistake
export function analyzeStudentMistake(
  formula: Formula,
  mistake: StudentMistake
): {
  explanation: string;
  correct: boolean;
  tips: string[];
} {
  const analysis = getCommonMistakes(formula);

  // Simple check: compare expected vs actual
  const correct = mistake.actualAnswer === mistake.expectedAnswer;

  let explanation: string;
  if (correct) {
    explanation = "Correct! Your calculation matches the expected answer.";
  } else {
    // Find most likely mistake
    const likelyMistakes = analysis.mistakes.slice(0, 2);
    explanation = `Your answer differs from expected. Common reasons for errors with this formula:\n`;
    explanation += likelyMistakes.map(m => `- ${m.why}`).join("\n");
  }

  return {
    explanation,
    correct,
    tips: analysis.preventionTips.slice(0, 3)
  };
}
