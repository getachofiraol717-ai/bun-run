// Formula Engine — FormulaExplainer
// Feature 4: Multi-mode formula explanation engine
import type { Formula, FormulaExplanation } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, LearningStyle, ExplanationMode, EnrichedFormula } from "../models/FormulaModels";
import { VariableAnalysisResult, analyzeVariables, generateVariableExplanation } from "./VariableAnalyzer";

export interface ExplanationConfig {
  ageBand: AgeBand;
  learningStyle: LearningStyle;
  mode: ExplanationMode;
  includeExamples?: boolean;
  includeMistakes?: boolean;
  includeRealWorld?: boolean;
  maxLength?: number;
}

const DEFAULT_CONFIG: Required<ExplanationConfig> = {
  ageBand: "14-16",
  learningStyle: "mixed",
  mode: "detailed",
  includeExamples: true,
  includeMistakes: true,
  includeRealWorld: true,
  maxLength: 500
};

const AGE_EXPLANATIONS: Record<AgeBand, Record<string, string>> = {
  "8-10": {
    "F=ma": "When you push a shopping cart, you're using a FORCE. The harder you push (more force) and the lighter the cart (less mass), the faster it zooms! This formula shows that FORCE equals MASS times ACCELERATION.",
    "area": "Imagine covering a floor with carpet. The AREA tells you how much carpet you need. For a rectangle, multiply how long by how wide!",
    "pH": "pH tells us if something is sour like lemon (acid) or bitter like soap (base)."
  },
  "11-13": {
    "F=ma": "Force equals mass times acceleration. This means: to accelerate something (make it speed up), you need more force if it has more mass. A bowling ball needs more push than a tennis ball.",
    "PV=nRT": "This is the Ideal Gas Law. Pressure times Volume equals Amount times Gas Constant times Temperature. It explains how gases behave when heated or compressed.",
    "quadratic": "A quadratic equation has an x² term. We solve it to find where a parabola crosses the x-axis."
  },
  "14-16": {
    "F=ma": "Newton's Second Law: Force applied to an object equals its mass times acceleration. More precisely, the net external force equals the rate of change of momentum.",
    "PV=nRT": "Ideal Gas Law: Relates pressure, volume, temperature, and amount of gas. Used to predict gas behavior under different conditions.",
    "quadratic": "Quadratic equations can be solved by factoring, completing the square, or using the quadratic formula x = (-b ± √(b²-4ac))/2a."
  },
  "17-19": {
    "F=ma": "F = dp/dt (rate of change of momentum). This is Newton's second law in its most general form, applicable to variable mass systems and relativistic velocities.",
    "PV=nRT": "Ideal Gas Law derived from kinetic theory. Assumes point particles with no volume and no intermolecular forces except elastic collisions.",
    "quadratic": "Solutions exist when discriminant b²-4ac ≥ 0 for real roots. Complex roots occur when b²-4ac < 0."
  },
  "university": {
    "F=ma": "In tensor form: Fᵢ = Σⱼ Mᵢⱼaⱼ for multi-dimensional systems. Extends to F = d/dt(γm₀v) in special relativity.",
    "PV=nRT": "First derived from kinetic theory. Real gases deviate due to finite particle volume and intermolecular forces (van der Waals corrections).",
    "quadratic": "Numerical methods for finding roots: Newton-Raphson iteration, bisection method. Applications in optimization and curve fitting."
  },
  "professional": {
    "F=ma": "Fundamental equation in classical mechanics. Extensions include Lagrangian and Hamiltonian formulations, canonical equations, and Poisson brackets.",
    "PV=nRT": "Foundation for thermodynamic state equations. Real gas corrections: van der Waals, Redlich-Kwong, Peng-Robinson equations of state.",
    "quadratic": "Central to numerical analysis. Used in least squares fitting, eigenvalue problems, and optimization algorithms."
  }
};

const STORY_EXPLANATIONS: Record<string, { story: string; lesson: string }> = {
  "F=ma": {
    story: "Sir Isaac Newton was sitting under an apple tree when an apple fell on his head. This got him thinking - why do things fall down? He realized that the same force that pulled the apple down also keeps the Moon orbiting Earth!",
    lesson: "The same simple rule (F=ma) governs everything from falling apples to orbiting moons."
  },
  "E=mc²": {
    story: "Einstein was a patent clerk in Switzerland, working in his spare time on the nature of light and motion. One day he imagined riding alongside a beam of light - if he could catch up to light itself, what would he see?",
    lesson: "Mass and energy are two faces of the same coin. The tiny mass inside atoms can release enormous energy."
  },
  "PV=nRT": {
    story: "Before the gas laws, scientists like Boyle, Charles, and Avogadro each discovered pieces of the puzzle. Boyle found pressure and volume are inversely related. Charles found volume and temperature are directly related. Avogadro found that equal volumes of gases contain equal numbers of molecules.",
    lesson: "Great discoveries often come from combining simple observations - the whole is greater than the sum of its parts."
  }
};

const ANALOGIES: Record<string, { analogy: string; mapping: Record<string, string> }> = {
  "F=ma": {
    analogy: "Think of pushing a shopping cart. The FORCE is how hard you push. The MASS is how heavy the cart is (full vs empty). The ACCELERATION is how quickly the cart speeds up or slows down.",
    mapping: { "force": "your push strength", "mass": "cart weight", "acceleration": "speed change rate" }
  },
  "Ohm's Law V=IR": {
    analogy: "Water flowing through a pipe. VOLTAGE is like water pressure. CURRENT is like water flow rate. RESISTANCE is like a narrow section of pipe that slows the flow.",
    mapping: { "voltage": "water pressure", "current": "flow rate", "resistance": "pipe narrowing" }
  },
  "pH": {
    analogy: "pH is like a hot sauce scale. The hotter the sauce (lower pH = more acidic), the more it burns your tongue. Mild sauces (higher pH = more basic) burn less.",
    mapping: { "acidic": "hot sauce", "neutral": "plain water", "basic": "mild/milk" }
  },
  "quadratic": {
    analogy: "Finding roots of a quadratic is like finding where a ball thrown in the air will hit the ground - when height = 0.",
    mapping: { "roots": "ground contact points", "parabola": "ball's path", "vertex": "highest point" }
  }
};

export function generateExplanation(
  formula: Formula,
  config: Partial<ExplanationConfig> = {}
): FormulaExplanation {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const varAnalysis = analyzeVariables(formula, cfg.ageBand);

  let explanation: string;
  switch (cfg.mode) {
    case "simple":
      explanation = generateSimpleExplanation(formula, cfg.ageBand);
      break;
    case "detailed":
      explanation = generateDetailedExplanation(formula, varAnalysis, cfg.ageBand);
      break;
    case "technical":
      explanation = generateTechnicalExplanation(formula, varAnalysis);
      break;
    case "story":
      explanation = generateStoryExplanation(formula);
      break;
    case "analogy":
      explanation = generateAnalogyExplanation(formula, cfg.learningStyle);
      break;
    case "exam_prep":
      explanation = generateExamPrepExplanation(formula, varAnalysis, cfg.ageBand);
      break;
    default:
      explanation = generateDetailedExplanation(formula, varAnalysis, cfg.ageBand);
  }

  const variables = varAnalysis.variables.map(v => ({
    symbol: v.symbol,
    meaning: generateVariableExplanation(v, cfg.ageBand, cfg.learningStyle)
  }));

  return {
    formula: formula.formula,
    explanation,
    variables,
    examples: cfg.includeExamples ? generateExamples(formula, varAnalysis, cfg.ageBand) : [],
    commonMistakes: cfg.includeMistakes ? generateCommonMistakes(formula) : [],
    realWorldExamples: cfg.includeRealWorld ? generateRealWorldExamples(formula, cfg.ageBand) : []
  };
}

function generateSimpleExplanation(formula: Formula, ageBand: AgeBand): string {
  const lower = formula.formula.toLowerCase();
  for (const [key, explanations] of Object.entries(AGE_EXPLANATIONS)) {
    for (const [formulaKey, text] of Object.entries(explanations)) {
      if (lower.includes(formulaKey.toLowerCase())) {
        return text;
      }
    }
  }
  // Generic fallback
  const varNames = formula.variables.slice(0, 3).join(", ");
  return `${formula.formula} relates ${varNames}. This formula is used to calculate one quantity from others in ${formula.subject} problems.`;
}

function generateDetailedExplanation(formula: Formula, varAnalysis: VariableAnalysisResult, ageBand: AgeBand): string {
  const parts: string[] = [];

  // Introduction
  parts.push(`The formula ${formula.formula} is a fundamental relationship in ${formula.subject}.`);

  // What it expresses
  const resultVar = formula.formula.split("=")[0]?.trim();
  const inputVars = formula.formula.split("=")[1]?.trim() || "";
  parts.push(`It calculates ${resultVar} based on the values of: ${formula.variables.join(", ")}.`);

  // Physical/geometric meaning
  if (varAnalysis.variables.length > 0) {
    const mainVar = varAnalysis.variables[0];
    if (mainVar.physicalInterpretation) {
      parts.push(`Conceptually, ${mainVar.symbol} (${mainVar.name}) represents ${mainVar.physicalInterpretation.toLowerCase()}.`);
    }
  }

  // When to use
  parts.push(`This formula is typically used when ${getUsageContext(formula)}.`);

  return parts.join(" ");
}

function generateTechnicalExplanation(formula: Formula, varAnalysis: VariableAnalysisResult): string {
  const parts: string[] = [];

  parts.push(`## Formula: ${formula.formula}`);
  parts.push(`\n**Subject:** ${formula.subject}`);
  parts.push(`**Difficulty:** ${formula.difficulty}`);
  parts.push(`**Domain:** ${formula.subject}-related calculation\n`);

  parts.push("### Derivation\n");
  parts.push("Derivation details and theoretical background would be provided here based on the formula's origin.\n");

  parts.push("### Variables\n");
  for (const v of varAnalysis.variables) {
    let line = `- **${v.symbol}** (${v.name}): `;
    if (v.unit) line += `Unit: ${v.description}`;
    else line += v.description;
    parts.push(line);
  }

  parts.push("\n### Applications\n");
  parts.push("- Specific engineering applications");
  parts.push("- Scientific research contexts");
  parts.push("- Advanced problem-solving scenarios\n");

  parts.push("### Limitations\n");
  parts.push("- Assumptions and boundary conditions");
  parts.push("- Conditions where formula may not apply");

  return parts.join("\n");
}

function generateStoryExplanation(formula: Formula): string {
  const lower = formula.formula.toLowerCase();
  for (const [key, { story, lesson }] of Object.entries(STORY_EXPLANATIONS)) {
    if (lower.includes(key.toLowerCase())) {
      return `${story}\n\n**Key Lesson:** ${lesson}`;
    }
  }
  // Generic story
  const scientists = {
    math: "Ancient mathematicians",
    physics: "Renaissance scientists",
    chemistry: "Alchemists turned scientists",
    statistics: "Early statisticians",
    unknown: "Scientists through history"
  };
  const scientist = scientists[formula.subject] || scientists.unknown;
  return `${scientist} discovered this relationship through careful observation and experimentation. The formula ${formula.formula} captures a fundamental pattern that appears repeatedly in nature. Understanding how this was discovered helps appreciate the beauty of scientific reasoning.`;
}

function generateAnalogyExplanation(formula: Formula, learningStyle: LearningStyle): string {
  const lower = formula.formula.toLowerCase();
  for (const [key, { analogy, mapping }] of Object.entries(ANALOGIES)) {
    if (lower.includes(key.toLowerCase())) {
      const mappings = Object.entries(mapping)
        .map(([k, v]) => `${k} = ${v}`)
        .join(", ");
      return `${analogy}\n\n**Key Mappings:** ${mappings}`;
    }
  }
  // Generic analogy based on learning style
  if (learningStyle === "kinesthetic") {
    return `Think of ${formula.formula} like building with blocks. Each variable represents a different property of the blocks. When you arrange them according to the formula, you get a predictable result!`;
  }
  return `The formula ${formula.formula} is like a recipe. The variables are the ingredients, and the formula tells you how to combine them to get the desired result.`;
}

function generateExamPrepExplanation(formula: Formula, varAnalysis: VariableAnalysisResult, ageBand: AgeBand): string {
  const parts: string[] = [];

  parts.push(`## ${formula.formula} — Exam Preparation\n`);

  // Key facts
  parts.push("### Key Facts to Memorize");
  parts.push(`1. Formula: ${formula.formula}`);
  parts.push(`2. Subject: ${formula.subject}`);
  parts.push(`3. Units: ${varAnalysis.variables.map(v => `${v.symbol} = ${v.description}`).join(", ")}`);

  // Common question types
  parts.push("\n### Common Exam Questions");
  parts.push(`- Calculate ${varAnalysis.variables[0]?.symbol || "a variable"} given the others`);
  parts.push(`- Identify which variables increase/decrease together`);
  parts.push(`- Convert units when necessary`);

  // Tips
  parts.push("\n### Exam Tips");
  parts.push("- Always identify what you're solving for first");
  parts.push("- List known variables before plugging in");
  parts.push("- Check your answer makes sense (order of magnitude)");

  return parts.join("\n");
}

function generateExamples(formula: Formula, varAnalysis: VariableAnalysisResult, ageBand: AgeBand): string[] {
  const examples: string[] = [];
  const lower = formula.formula.toLowerCase();

  // Generate age-appropriate examples
  if (lower.includes("f=ma")) {
    if (ageBand === "8-10") {
      examples.push("A 10kg cart needs 50N of force to speed up. How much does it accelerate? (Answer: 5 m/s²)");
      examples.push("You push a 2kg ball with 10N. How fast does it speed up?");
    } else if (ageBand === "14-16") {
      examples.push("A 1500kg car accelerates at 3 m/s². What force is needed? (Answer: 4500N)");
      examples.push("A rocket with mass 50000kg needs 100000N thrust. What's its acceleration?");
    } else {
      examples.push("Calculate the force on a 2kg mass accelerating at 5 m/s².");
      examples.push("An object experiences 100N force with 0.5 m/s² acceleration. Find its mass.");
    }
  } else if (lower.includes("area") || lower.includes("π")) {
    examples.push("Find the area of a circle with radius 5cm.");
    examples.push("A circular garden has diameter 10m. How much soil is needed to fill it 0.3m deep?");
  } else {
    // Generic example
    const vars = varAnalysis.variables.slice(0, 3);
    if (vars.length >= 2) {
      examples.push(`Given ${vars.map(v => `${v.symbol} = typical value`).join(", ")}, calculate the result.`);
    }
  }

  return examples;
}

function generateCommonMistakes(formula: Formula): string[] {
  const lower = formula.formula.toLowerCase();
  const mistakes: string[] = [];

  if (lower.includes("f=ma")) {
    mistakes.push("Confusing mass and weight - mass is in kg, weight is in Newtons");
    mistakes.push("Using wrong units - always convert everything to kg, m, s first");
    mistakes.push("Forgetting that acceleration can be negative (deceleration)");
  } else if (lower.includes("ph=")) {
    mistakes.push("Thinking pH can be negative (it can, for very strong acids)");
    mistakes.push("Confusing acids with bases based on the number alone");
    mistakes.push("Forgetting that pH is logarithmic");
  } else if (lower.includes("area") || lower.includes("π")) {
    mistakes.push("Using diameter instead of radius - double-check!");
    mistakes.push("Forgetting to square the radius");
    mistakes.push("Using wrong units - keep everything consistent");
  } else {
    mistakes.push("Plugging in numbers before identifying what you're solving for");
    mistakes.push("Not checking if the answer makes physical sense");
  }

  return mistakes;
}

function generateRealWorldExamples(formula: Formula, ageBand: AgeBand): string[] {
  const lower = formula.formula.toLowerCase();
  const examples: string[] = [];

  if (lower.includes("f=ma")) {
    examples.push("Car crashes: understanding impact forces helps design safer vehicles");
    examples.push("Sports: athletes use this to optimize performance and prevent injuries");
    examples.push("Engineering: building structures that can withstand expected forces");
  } else if (lower.includes("pv=nrt") || lower.includes("pressure")) {
    examples.push("Scuba diving: understanding pressure changes at different depths");
    examples.push("Weather: air pressure systems affect weather patterns");
    examples.push("Cooking: pressure cookers cook faster due to higher pressure/temperature");
  } else if (lower.includes("ph=")) {
    examples.push("Swimming pools: maintaining correct pH for safe swimming");
    examples.push("Gardening: testing soil pH to choose appropriate plants");
    examples.push("Medicine: blood pH must stay in narrow range for health");
  } else if (lower.includes("area") || lower.includes("π")) {
    examples.push("Painting rooms: calculating paint needed for walls");
    examples.push("Agriculture: determining field sizes for planting");
    examples.push("Construction: ordering materials for circular foundations");
  } else {
    examples.push("Everyday calculations involving the formula's variables");
  }

  return examples;
}

function getUsageContext(formula: Formula): string {
  const lower = formula.formula.toLowerCase();
  if (lower.includes("f=ma")) return "you know the mass and acceleration and need to find force, or vice versa";
  if (lower.includes("area")) return "you need to find how much space a shape covers";
  if (lower.includes("ph=")) return "you need to find acidity levels";
  if (lower.includes("pv=nrt")) return "you have gas and need to find pressure, volume, or temperature relationships";
  return "you need to relate the variables in this formula to solve a problem";
}

export function generateMultipleModeExplanations(formula: Formula, config: Partial<ExplanationConfig> = {}): Partial<Record<ExplanationMode, FormulaExplanation>> {
  const modes: ExplanationMode[] = ["simple", "detailed", "technical", "story", "analogy", "exam_prep"];
  const results: Partial<Record<ExplanationMode, FormulaExplanation>> = {};

  for (const mode of modes) {
    results[mode] = generateExplanation(formula, { ...config, mode });
  }

  return results;
}
