// Smart PDF Engine — topic/keyword heuristics

export const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","else","of","in","on","at","to","for","with",
  "is","are","was","were","be","been","being","this","that","these","those","it","its","as",
  "by","from","into","about","than","so","such","not","no","can","could","will","would","may",
  "might","must","should","shall","we","you","they","he","she","i","our","your","their","his",
  "her","them","us","do","does","did","have","has","had","also","which","who","whom","what",
  "when","where","why","how","all","any","each","more","most","other","some","just","only",
]);

/** Lowercase word tokens with stopwords removed. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []).filter((w) => !STOPWORDS.has(w));
}

/** Capitalized multi-word phrases — decent proxy for named concepts/terms in textbook prose. */
export function extractCapitalizedPhrases(text: string): string[] {
  const matches = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g) ?? [];
  return matches.filter((m) => {
    const words = m.split(/\s+/);
    // Multi-word phrases ("Newton's Laws", "Cell Theory") are reliable signal.
    if (words.length >= 2) return true;
    // A bare single capitalized word is only useful if it isn't a common
    // sentence-starting word ("The", "This", "When", …) that merely happens
    // to be capitalized because it opens a sentence.
    return m.length > 3 && !STOPWORDS.has(m.toLowerCase());
  });
}

export interface DefinitionMatch {
  term: string;
  definition: string;
}

// "X is defined as Y", "X refers to Y", "X means Y", "X: Y" (glossary style)
const DEFINITION_PATTERNS: RegExp[] = [
  /\b([A-Z][\w\s-]{2,40}?)\s+is\s+defined\s+as\s+([^.]{5,200})\./gi,
  /\b([A-Z][\w\s-]{2,40}?)\s+refers\s+to\s+([^.]{5,200})\./gi,
  /\b([A-Z][\w\s-]{2,40}?)\s+means\s+([^.]{5,200})\./gi,
];

export function extractDefinitions(text: string): DefinitionMatch[] {
  const out: DefinitionMatch[] = [];
  for (const re of DEFINITION_PATTERNS) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      out.push({ term: m[1].trim(), definition: m[2].trim() });
      if (out.length > 200) return out; // safety cap on pathological input
    }
  }
  return out;
}

/** Glossary-style "Term: definition" lines, common in textbook glossaries. */
export function extractGlossaryLines(line: string): DefinitionMatch | null {
  const m = line.match(/^([A-Z][\w\s-]{2,40})\s*[:–-]\s+(.{10,200})$/);
  if (!m) return null;
  return { term: m[1].trim(), definition: m[2].trim() };
}
