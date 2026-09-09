import type { CodingCardData } from "../cards/CodingCard";

export interface CodingOptions {
  language: string;
  code: string;
  topic?: string;
}

export function generateCodingData(opts: CodingOptions): CodingCardData {
  return {
    language: opts.language,
    code: opts.code,
    title: `AI Code Mentor: ${opts.topic || opts.language}`,
    explanation: `This implementation demonstrates modular code structure, memory-efficient data handling, and clean error isolation.`,
    executionFlow: `1. Initializes configuration & memory. 2. Processes input parameters. 3. Evaluates core logic. 4. Returns formatted output.`,
    bestPractices: [
      "Always validate input parameters before execution.",
      "Use explicit TypeScript types or clean type assertions.",
      "Handle potential runtime errors with try/catch blocks."
    ],
    commonMistakes: [
      "Mutating global state inside pure functions.",
      "Ignoring async promise rejections."
    ],
    optimizationIdeas: [
      "Memoize heavy computational results.",
      "Debounce frequent user events."
    ],
    securityTips: [
      "Sanitize dynamic input strings to prevent injection attacks."
    ]
  };
}
