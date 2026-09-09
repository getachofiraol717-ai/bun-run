import type { SubjectType } from "../types/SubjectType";

const RULES: { subject: SubjectType; patterns: RegExp[] }[] = [
  { subject: "programming", patterns: [/\b(code|function|python|javascript|typescript|react|algorithm|bug|api|class|variable|loop|array|regex|sql)\b/i, /```/] },
  { subject: "mathematics", patterns: [/\b(math|algebra|calculus|derivative|integral|equation|matrix|geometry|trigonometry|probability|theorem|proof)\b/i, /\$.+?\$/, /\d+\s*[+\-*/=]\s*\d+/] },
  { subject: "physics", patterns: [/\b(physics|force|newton|velocity|acceleration|momentum|energy|quantum|relativity|wave|electric|magnetic|thermodynamics)\b/i] },
  { subject: "chemistry", patterns: [/\b(chem|molecule|atom|reaction|bond|acid|base|periodic|element|compound|mole|ph)\b/i, /[A-Z][a-z]?\d/] },
  { subject: "biology", patterns: [/\b(biology|cell|dna|rna|gene|evolution|organism|photosynthesis|mitosis|meiosis|ecosystem|species)\b/i] },
  { subject: "history", patterns: [/\b(history|war|empire|revolution|century|ancient|medieval|dynasty|treaty|battle|colonial)\b/i, /\b\d{3,4}\s*(bc|ad|ce|bce)?\b/i] },
  { subject: "geography", patterns: [/\b(geography|continent|country|capital|mountain|river|ocean|climate|latitude|longitude|map|population)\b/i] },
  { subject: "language", patterns: [/\b(grammar|verb|noun|adjective|translate|translation|essay|paragraph|vocabulary|synonym|antonym|literature|poem)\b/i] },
  { subject: "pdf", patterns: [/\b(this pdf|the document|this document|from the book|from the pdf|according to the text)\b/i] },
];

export function detectSubject(text: string, hint?: string): SubjectType {
  const t = (text || "").toLowerCase();
  if (hint && (hint.toLowerCase() as SubjectType)) {
    const h = hint.toLowerCase() as SubjectType;
    if (RULES.some((r) => r.subject === h)) return h;
  }
  const scores = new Map<SubjectType, number>();
  for (const rule of RULES) {
    let s = 0;
    for (const p of rule.patterns) if (p.test(t)) s += 1;
    if (s > 0) scores.set(rule.subject, s);
  }
  if (!scores.size) return "general";
  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
