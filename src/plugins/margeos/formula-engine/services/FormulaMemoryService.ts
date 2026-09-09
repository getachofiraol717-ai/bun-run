// @ts-nocheck
// Formula Engine — FormulaMemoryService
// Feature 10: Memory tips and visualization generation
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type { VisualRepresentation, MemoryTip, AgeBand } from "../models/FormulaModels";

export interface MemoryTechnique {
  type: "mnemonic" | "visual" | "story" | "association" | "practice";
  description: string;
  example: string;
}

const MEMORY_TECHNIQUES: Record<string, MemoryTechnique[]> = {
  "f=ma": [
    {
      type: "mnemonic",
      description: "Use the phrase 'Forceful Mary Always Accelerates'",
      example: "F(orce) = M(ary) A(lways) A(ccelerates)"
    },
    {
      type: "visual",
      description: "Picture pushing an empty shopping cart vs a full one",
      example: "Empty cart moves easily (small mass = big acceleration), full cart needs more push (big mass = small acceleration)"
    },
    {
      type: "association",
      description: "Relate to real experiences",
      example: "Pushing a bicycle vs a car - the car has more mass and needs more force to accelerate"
    }
  ],
  "area_circle": [
    {
      type: "story",
      description: "Imagine a pizza cut into slices that fill a rectangle",
      example: "Half the circumference × radius = πr × r = πr²"
    },
    {
      type: "visual",
      description: "Picture the circle transforming into a rectangle",
      example: "The rectangle has height r and width πr (half the circumference)"
    },
    {
      type: "mnemonic",
      description: "'Apple Pies Are' (A = πr²)",
      example: "A = πr² means 'Apple Pies Are Two' - think of two pies, squared!"
    }
  ],
  "quadratic": [
    {
      type: "mnemonic",
      description: "'Negative Boy: Answer Xylophone' for x = (-b ± √(b²-4ac)) / 2a",
      example: "N(-) B(b) A(X) X(x) - helps remember the negative and ±"
    },
    {
      type: "visual",
      description: "Picture a parabola and the axis of symmetry",
      example: "The formula finds where the parabola crosses the x-axis"
    }
  ],
  "ohms_law": [
    {
      type: "visual",
      description: "Use the V-I-R triangle",
      example: "Cover what you want to find: V on top = I × R, I on bottom = V/R, R on bottom = V/I"
    },
    {
      type: "association",
      description: "Think of water flowing through pipes",
      example: "Voltage = water pressure, Current = flow rate, Resistance = pipe width"
    }
  ],
  "kinetic_energy": [
    {
      type: "mnemonic",
      description: "'Katherine Elizabeth Is Very Energetic' (KE = ½mv²)",
      example: "Half-mass-velocity-squared"
    },
    {
      type: "association",
      description: "Doubling speed = 4× energy",
      example: "A car at 100 km/h has 4× the energy of one at 50 km/h"
    }
  ]
};

export function generateMemoryTechniques(formula: Formula): MemoryTechnique[] {
  const lower = formula.formula.toLowerCase().replace(/\s+/g, "").replace(/²/g, "2");

  for (const [key, techniques] of Object.entries(MEMORY_TECHNIQUES)) {
    const normalizedKey = key.toLowerCase().replace(/\s+/g, "").replace(/²/g, "2");
    if (lower.includes(normalizedKey) || normalizedKey.includes(lower)) {
      return techniques;
    }
  }

  // Return generic techniques if no specific match
  return getGenericMemoryTechniques(formula);
}

function getGenericMemoryTechniques(formula: Formula): MemoryTechnique[] {
  return [
    {
      type: "practice",
      description: "Write the formula 10 times while saying it aloud",
      example: "Each repetition strengthens the neural pathway"
    },
    {
      type: "association",
      description: "Connect the formula to something you know well",
      example: "Find an everyday example where this formula applies"
    },
    {
      type: "visual",
      description: "Draw a diagram showing what the formula represents",
      example: "Visual learners remember pictures better than text"
    }
  ];
}

export function generateMemoryTips(formula: Formula, ageBand: AgeBand): MemoryTip[] {
  const techniques = generateMemoryTechniques(formula);
  const tips: MemoryTip[] = techniques.map(t => ({
    technique: t.type,
    description: t.description,
    example: t.example,
    applicability: getTechniqueApplicability(t.type, ageBand)
  }));

  // Add general study tips
  tips.push({
    technique: "spaced_repetition",
    description: "Review this formula at increasing intervals",
    example: "Day 1, Day 3, Day 7, Day 14, Day 30",
    applicability: "all"
  });

  tips.push({
    technique: "active_recall",
    description: "Test yourself without looking at the formula",
    example: "Close your eyes and try to write the formula from memory",
    applicability: ageBand === "11-13" ? "recommended" : "all"
  });

  return tips;
}

function getTechniqueApplicability(technique: MemoryTechnique["type"], ageBand: AgeBand): string {
  const applicability: Record<string, Record<string, string>> = {
    mnemonic: {
      "8-10": "excellent",
      "11-13": "excellent",
      "14-16": "good",
      "17-19": "moderate",
      "university": "moderate"
    },
    visual: {
      "8-10": "moderate",
      "11-13": "good",
      "14-16": "excellent",
      "17-19": "excellent",
      "university": "good"
    },
    story: {
      "8-10": "excellent",
      "11-13": "excellent",
      "14-16": "good",
      "17-19": "moderate",
      "university": "limited"
    },
    association: {
      "8-10": "moderate",
      "11-13": "good",
      "14-16": "excellent",
      "17-19": "excellent",
      "university": "excellent"
    },
    practice: {
      "8-10": "good",
      "11-13": "excellent",
      "14-16": "excellent",
      "17-19": "excellent",
      "university": "excellent"
    }
  };

  return applicability[technique]?.[ageBand] || "good";
}

export function generateVisualRepresentations(formula: Formula, ageBand: AgeBand): VisualRepresentation[] {
  const representations: VisualRepresentation[] = [];

  // Always include LaTeX
  representations.push({
    type: "latex",
    content: formulaToLaTeX(formula.formula),
    description: `Standard mathematical notation`
  });

  // Add age-appropriate diagrams
  if (ageBand === "8-10" || ageBand === "11-13") {
    representations.push({
      type: "diagram",
      content: generateSimpleDiagram(formula),
      description: getSimpleDiagramDescription(formula)
    });
  } else {
    representations.push({
      type: "graph",
      content: generateGraphRepresentation(formula),
      description: getGraphDescription(formula)
    });

    representations.push({
      type: "table",
      content: generateVariableTable(formula),
      description: "Variable definitions and units"
    });
  }

  return representations;
}

function formulaToLaTeX(formula: string): string {
  let latex = formula
    .replace(/\^2/g, "^{2}")
    .replace(/\^3/g, "^{3}")
    .replace(/\^(\d)/g, "^{$1}")
    .replace(/√(\w+)/g, "\\sqrt{$1}")
    .replace(/√/g, "\\sqrt{}")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/θ/g, "\\theta")
    .replace(/π/g, "\\pi")
    .replace(/μ/g, "\\mu")
    .replace(/σ/g, "\\sigma")
    .replace(/÷/g, "\\div")
    .replace(/×/g, "\\times")
    .replace(/≤/g, "\\leq")
    .replace(/≥/g, "\\geq");

  return latex;
}

function generateSimpleDiagram(formula: Formula): string {
  const lower = formula.formula.toLowerCase();

  if (lower.includes("f=ma")) {
    return `[Diagram: An arrow labeled 'F' pushing a box of mass 'm', causing acceleration 'a']`;
  }
  if (lower.includes("area") && lower.includes("π")) {
    return `[Diagram: A circle with radius 'r' and area A, showing the relationship]`;
  }
  if (lower.includes("v=ir")) {
    return `[Diagram: A circuit with battery V, resistor R, and current I flowing]`;
  }
  if (lower.includes("kinetic")) {
    return `[Diagram: A ball moving with velocity v, labeled with KE = ½mv²]`;
  }

  return `[Diagram showing the formula components]`;
}

function getSimpleDiagramDescription(formula: Formula): string {
  const lower = formula.formula.toLowerCase();

  if (lower.includes("f=ma")) {
    return "Force diagram showing how pushing a mass causes acceleration";
  }
  if (lower.includes("area") && lower.includes("π")) {
    return "Circle with radius labeled and area calculation";
  }
  if (lower.includes("v=ir")) {
    return "Simple circuit showing voltage, current, and resistance";
  }

  return "Visual representation of the formula";
}

function generateGraphRepresentation(formula: Formula): string {
  const lower = formula.formula.toLowerCase();

  if (lower.includes("f=ma")) {
    return `[
  {
    "type": "line_graph",
    "title": "F vs m (constant a)",
    "x_label": "mass (kg)",
    "y_label": "Force (N)",
    "relationship": "direct_proportionality"
  },
  {
    "type": "line_graph",
    "title": "F vs a (constant m)",
    "x_label": "acceleration (m/s²)",
    "y_label": "Force (N)",
    "relationship": "direct_proportionality"
  }
]`;
  }
  if (lower.includes("quadratic")) {
    return `[
  {
    "type": "parabola",
    "title": "Quadratic function",
    "features": ["vertex", "axis_of_symmetry", "roots", "y_intercept"]
  }
]`;
  }
  if (lower.includes("kinetic")) {
    return `[
  {
    "type": "exponential_graph",
    "title": "KE vs velocity",
    "x_label": "velocity (m/s)",
    "y_label": "Kinetic Energy (J)",
    "relationship": "quadratic"
  }
]`;
  }

  return "[]";
}

function getGraphDescription(formula: Formula): string {
  const lower = formula.formula.toLowerCase();

  if (lower.includes("f=ma")) {
    return "Linear graphs showing direct proportionality between F, m, and a";
  }
  if (lower.includes("quadratic")) {
    return "Parabola showing the characteristic U-shape of quadratic functions";
  }
  if (lower.includes("kinetic")) {
    return "Graph showing how kinetic energy increases with the square of velocity";
  }

  return "Mathematical graph representation";
}

function generateVariableTable(formula: Formula): string {
  const tableRows = formula.variables.map(v =>
    `| ${v} | variable | - |`
  ).join("\n");

  return `| Variable | Type | Unit |\n|---------|------|------|\n${tableRows}`;
}
