import type { ReferenceCardData } from "../cards/ReferenceCard";

export interface RecommendationOptions {
  subject?: string;
  topic: string;
}

export function generateRecommendationData(opts: RecommendationOptions): ReferenceCardData {
  return {
    title: `Recommended Reference Books & Revision Topics`,
    referenceBooks: [
      {
        title: `Comprehensive Guide to ${opts.topic}`,
        author: "Prof. H. R. Jenkins",
        chapter: "Chapter 4: Advanced Concepts & Solutions",
        summary: "Clear breakdowns, step-by-step solved problems, and exam-focused practice questions."
      },
      {
        title: "Standard University Physics & Mathematics",
        author: "Dr. A. E. Thorne",
        chapter: "Section 2.3: System Kinetics",
        summary: "In-depth theoretical derivations and experimental validations."
      }
    ],
    teacherNotes: [
      `Pay special attention to unit conversions before attempting calculations in ${opts.topic}.`,
      `Practice drawing concept diagrams to build visual intuition.`
    ],
    researchSources: [
      `MIT OpenCourseWare Lecture Series on ${opts.topic}`,
      `Stanford Educational Materials & Case Studies`
    ]
  };
}
