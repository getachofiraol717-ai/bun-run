// Smart PDF Engine — FormulaDetector (Features 3 + 4)
import { pseudoLines, type PageText } from "../services/TextExtractionService";
import { buildFormulaExplanation, extractVariables, FORMULA_PATTERNS } from "../utils/formulaUtils";
import type { Formula } from "../types/Formula";

let formulaCounter = 0;
function nextFormulaId(): string {
  formulaCounter += 1;
  return `formula-${formulaCounter}`;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export interface FormulaDetectorOptions {
  pages: PageText[];
  onProgress?: (pagesProcessed: number, totalPages: number) => void;
}

export async function detectFormulas(opts: FormulaDetectorOptions): Promise<Formula[]> {
  const seen = new Set<string>(); // dedupe identical formula text across the whole doc
  const out: Formula[] = [];

  for (let i = 0; i < opts.pages.length; i++) {
    const { page, text } = opts.pages[i];
    if (!text) continue;

    for (const line of pseudoLines(text)) {
      let specificMatchedThisLine = false;
      for (const pattern of FORMULA_PATTERNS) {
        if (pattern.generic && specificMatchedThisLine) continue;
        pattern.re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pattern.re.exec(line))) {
          if (!pattern.generic) specificMatchedThisLine = true; // even if this exact text was already seen on an earlier page
          const formulaText = m[0].trim().replace(/\s+/g, " ");
          const key = formulaText.toLowerCase();
          if (formulaText.length < 3 || seen.has(key)) {
            if (!pattern.re.global) break;
            continue;
          }
          seen.add(key);
          out.push({
            id: nextFormulaId(),
            formula: formulaText,
            variables: extractVariables(formulaText),
            subject: pattern.subject,
            difficulty: pattern.difficulty,
            pageNumber: page,
            context: line.length <= 160 ? line : `${line.slice(0, 157)}…`,
            explanation: buildFormulaExplanation(formulaText, pattern.subject),
          });
          if (!pattern.re.global) break;
        }
      }
    }

    opts.onProgress?.(i + 1, opts.pages.length);
    if (i % 25 === 24) await yieldToMain();
  }

  return out;
}
