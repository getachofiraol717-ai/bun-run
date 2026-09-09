// Formula Engine — FormulaClassifier
// Feature 1: Automatic formula classification by subject, type, and domain
import type { Formula, FormulaSubject, FormulaDifficulty } from "@/plugins/margeos/smart-pdf-engine";
import type { AgeBand, LearningStyle } from "../models/FormulaModels";

export type FormulaType = "algebraic" | "differential" | "geometric" | "statistical" | "physical" | "chemical" | "other";
export type FormulaDomain = "mechanics" | "thermodynamics" | "electromagnetism" | "optics" | "waves" | "quantum" | "organic" | "inorganic" | "physical_chem" | "calculus" | "linear_algebra" | "statistics" | "geometry" | "trigonometry" | "algebra" | "calculus_prep" | "unknown";

export interface FormulaClassification {
  subject: FormulaSubject;
  type: FormulaType;
  domain: FormulaDomain;
  keywords: string[];
  isCoreFormula: boolean;
  isDerivedFormula: boolean;
  isFundamental: boolean;
}

const SUBJECT_PATTERNS: Record<FormulaSubject, RegExp[]> = {
  physics: [
    /\bf\s*=\s*ma\b/i, /E\s*=\s*mc²/i, /\bv\s*=\s*[du]\/dt\b/i, /\bF\s*=\s*kq/i, /\bP\s*=\s*VI\b/i,
    /\bPV\s*=\s*nRT\b/i, /lambda\s*=\s*h\/p/i, /\[F\]\s*=/i, /gravity/i, /velocity/i,
    /acceleration/i, /momentum/i, /energy/i, /work\s*[=]/i, /power\s*[=]/i,
    /wavelength/i, /frequency/i, /amplitude/i, /period/i, /force/i
  ],
  chemistry: [
    /PV\s*=\s*nRT/i, /\b[\[\]()]+\s*=\s*/i, /\bmol\b/i, /\bM\s*=\s*m\/V\b/i,
    /\b[\[\]]+\s*→/i, /\bK\s*=\s*\[/i, /\bpH\s*=/i, /\bpOH\s*=/i, /\bH\s*=\s*U\s*\+/i,
    /molar/i, /concentration/i, /reaction/i, /equilibrium/i, /stoichiometr/i
  ],
  math: [
    /∫|∑|∂|∇|d\/dx/i, /sin|cos|tan|log|ln|exp/i, /√|\^|\*|\/|±/i,
    /x\s*\^|y\s*\^|a\s*\^/i, /\bdy\/dx\b/i, /lim/i, /infinity/i,
    /matrix|vector|determinant/i, /eigen/i, /polynomial/i, /quadratic/i
  ],
  statistics: [
    /μ|σ|Σ|χ²/i, /mean|median|mode|range/i, /\bP\s*\(/i, /variance/i,
    /standard\s*deviation/i, /correlation/i, /regression/i, /hypothesis/i,
    /confidence|interval/i, /p-value|z-score|t-test/i
  ],
  unknown: []
};

const DOMAIN_PATTERNS: Record<string, { keywords: string[]; isFundamental: boolean }> = {
  mechanics: { keywords: ["force", "mass", "velocity", "acceleration", "momentum", "energy", "work", "F=ma", "kinetic", "potential"], isFundamental: true },
  thermodynamics: { keywords: ["heat", "temperature", "entropy", "enthalpy", "gas", "thermal", "Q=mcT", "PV=nRT"], isFundamental: false },
  electromagnetism: { keywords: ["charge", "field", "current", "voltage", "resistance", "capacitor", "magnetic", "E", "V"], isFundamental: false },
  optics: { keywords: ["light", "mirror", "lens", "refraction", "reflection", "wavelength", "c=λf"], isFundamental: false },
  waves: { keywords: ["wave", "frequency", "amplitude", "period", " wavelength", "vibration"], isFundamental: false },
  quantum: { keywords: ["quantum", "photon", "electron", "wave function", "uncertainty", "Planck"], isFundamental: false },
  organic: { keywords: ["organic", "hydrocarbon", "functional group", "reaction mechanism", "bond"], isFundamental: false },
  inorganic: { keywords: ["inorganic", "periodic", "element", "compound", "reaction"], isFundamental: false },
  physical_chem: { keywords: ["physical chemistry", "equilibrium", "kinetics", "thermodynamics", "electrochemistry"], isFundamental: false },
  calculus: { keywords: ["derivative", "integral", "differential", "limit", "continuity", "dy/dx", "∫"], isFundamental: true },
  linear_algebra: { keywords: ["matrix", "vector", "eigenvalue", "determinant", "linear transformation"], isFundamental: true },
  statistics: { keywords: ["mean", "variance", "distribution", "probability", "hypothesis", "regression"], isFundamental: true },
  geometry: { keywords: ["area", "volume", "perimeter", "circumference", "angle", "triangle", "circle"], isFundamental: true },
  trigonometry: { keywords: ["sine", "cosine", "tangent", "angle", "SOH CAH TOA", "radian"], isFundamental: true },
  algebra: { keywords: ["equation", "variable", "solve", "polynomial", "quadratic", "factor"], isFundamental: true },
  calculus_prep: { keywords: ["slope", "rate", "change", "function", "graph", "line"], isFundamental: true }
};

const CORE_FORMULAS: Record<string, boolean> = {
  "F=ma": true, "E=mc^2": true, "PV=nRT": true, "V=IR": true, "a^2+b^2=c^2": true,
  "x=(-b±√(b²-4ac))/2a": true, "A=πr^2": true, "v=u+at": true, "s=ut+½at^2": true,
  "F=Gm1m2/r^2": true, "Q=mcΔT": true, "pH=-log[H+]": true, "PV=constant": true
};

export function classifyFormula(formula: string, subject?: FormulaSubject): FormulaClassification {
  const lower = formula.toLowerCase();

  // Determine subject
  let detectedSubject: FormulaSubject = subject ?? "unknown";
  if (!subject || subject === "unknown") {
    for (const [subj, patterns] of Object.entries(SUBJECT_PATTERNS)) {
      if (patterns.some(p => p.test(lower))) {
        detectedSubject = subj as FormulaSubject;
        break;
      }
    }
  }

  // Determine type
  let type: FormulaType = "other";
  if (/∫|d\/dx|∂|∑/.test(formula)) type = "differential";
  else if (/sin|cos|tan|√|geometry/.test(lower)) type = "geometric";
  else if (/μ|σ|mean|variance|probability/.test(lower)) type = "statistical";
  else if (/F|E|mass|force|velocity/.test(lower)) type = "physical";
  else if (/→|equilibrium|concentration/.test(lower)) type = "chemical";
  else if (/[xyz]\^|[0-9]/.test(formula)) type = "algebraic";

  // Determine domain
  let domain: FormulaDomain = "unknown";
  let isFundamental = false;
  for (const [dom, config] of Object.entries(DOMAIN_PATTERNS)) {
    if (config.keywords.some(k => lower.includes(k))) {
      domain = dom as FormulaDomain;
      isFundamental = config.isFundamental;
      break;
    }
  }

  // Keywords extraction
  const keywords: string[] = [];
  const allKeywords = Object.values(DOMAIN_PATTERNS).flatMap(d => d.keywords);
  for (const kw of allKeywords) {
    if (lower.includes(kw)) keywords.push(kw);
  }

  // Core/derived/fundamental detection
  const isCoreFormula = Object.keys(CORE_FORMULAS).some(cf => lower.includes(cf.toLowerCase()));
  const normalizedFormula = lower.replace(/\s+/g, "").replace(/²/g, "^2").replace(/³/g, "^3");
  const isDerivedFormula = !isCoreFormula && /[=]/.test(formula);
  const isFund = isFundamental || isCoreFormula;

  return {
    subject: detectedSubject,
    type,
    domain,
    keywords: [...new Set(keywords)],
    isCoreFormula,
    isDerivedFormula,
    isFundamental: isFund
  };
}

export function suggestAgeAppropriateDifficulty(classification: FormulaClassification, ageBand: AgeBand): FormulaDifficulty {
  const { isCoreFormula, isFundamental, subject, domain } = classification;

  // Age-based difficulty mapping
  if (ageBand === "8-10") {
    return isCoreFormula && subject === "math" ? "beginner" : "intermediate";
  }
  if (ageBand === "11-13") {
    if (isCoreFormula && (domain === "algebra" || domain === "geometry" || domain === "trigonometry")) {
      return "beginner";
    }
    return "intermediate";
  }
  if (ageBand === "14-16") {
    return isCoreFormula ? "beginner" : isFundamental ? "intermediate" : "advanced";
  }
  if (ageBand === "17-19" || ageBand === "university") {
    return isFundamental ? "intermediate" : "advanced";
  }
  return "advanced";
}

export function adaptClassificationForLearningStyle(classification: FormulaClassification, learningStyle: LearningStyle): FormulaClassification {
  const adapted = { ...classification };

  // Adjust keywords based on learning style
  if (learningStyle === "visual") {
    adapted.keywords.push("diagram", "visual", "graph", "chart");
  } else if (learningStyle === "auditory") {
    adapted.keywords.push("verbal", "explain", "discuss", "listen");
  } else if (learningStyle === "kinesthetic") {
    adapted.keywords.push("practice", "experiment", "hands-on", "example");
  }

  return adapted;
}
