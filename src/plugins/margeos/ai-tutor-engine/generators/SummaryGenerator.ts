import type { SummaryCardData } from "../cards/SummaryCard";

export interface SummaryOptions {
  topic: string;
  contextText?: string;
  grade?: string;
}

export function generateSummaryData(opts: SummaryOptions): SummaryCardData {
  const topicLower = opts.topic.toLowerCase();
  
  return {
    title: `Summary & Key Takeaways: ${opts.topic}`,
    keyIdeas: [
      `Core principle governing ${opts.topic} and its primary application.`,
      `Critical relationships between variables and foundational assumptions.`,
      `Practical implications and real-world significance of ${opts.topic}.`
    ],
    importantFacts: [
      `Essential definition to memorize for exams regarding ${opts.topic}.`,
      `Key historical or theoretical context introduced in this section.`,
      `Standard unit, equation, or classification rule applicable here.`
    ],
    revisionNotes: [
      `Review step-by-step problem solving methods.`,
      `Watch out for edge cases and non-standard conditions.`
    ],
    takeaways: [
      `Mastering ${opts.topic} unlocks advanced topics in this chapter.`,
      `Practice applying formulas and drawing flowcharts.`
    ]
  };
}
