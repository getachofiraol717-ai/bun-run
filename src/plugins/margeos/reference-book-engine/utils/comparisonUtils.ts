// Reference Book Engine — Utility functions
// Common helper functions for reference book operations

import type { ReferenceSource } from "../models/ReferenceBook";
import type { SourceComparison, UnifiedConcept } from "../models/SourceComparison";

/**
 * Calculate similarity between two texts
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeText(text1).split(/\s+/));
  const words2 = new Set(normalizeText(text2).split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract key terms from text
 */
export function extractKeyTerms(text: string, maxTerms: number = 10): string[] {
  const words = normalizeText(text).split(/\s+/);

  // Remove common stop words
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "dare",
    "and", "but", "or", "if", "then", "else", "when", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further",
    "this", "that", "these", "those", "am", "for", "not", "with", "as"
  ]);

  const filtered = words.filter(w => w.length > 3 && !stopWords.has(w));

  // Count frequency
  const frequency = new Map<string, number>();
  for (const word of filtered) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  // Sort by frequency
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([word]) => word);
}

/**
 * Format source title for display
 */
export function formatSourceTitle(source: ReferenceSource): string {
  const title = source.metadata.title;
  const authors = source.metadata.authors;

  if (authors.length > 0) {
    return `${title} by ${authors[0]}${authors.length > 1 ? " et al." : ""}`;
  }

  return title;
}

/**
 * Format citation for display
 */
export function formatCitation(
  author: string,
  year: string | undefined,
  title: string
): string {
  return `${author} (${year || "n.d."}). ${title}.`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Generate excerpt from text
 */
export function generateExcerpt(text: string, length: number = 150): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let excerpt = "";
  for (const sentence of sentences) {
    if ((excerpt + sentence).length > length) {
      break;
    }
    excerpt += sentence.trim() + ". ";
  }

  return excerpt.trim() || truncateText(text, length);
}

/**
 * Calculate reading time estimate
 */
export function estimateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Check if source is academic
 */
export function isAcademicSource(source: ReferenceSource): boolean {
  return (
    source.metadata.sourceType === "research_paper" ||
    source.metadata.sourceType === "textbook" ||
    source.metadata.doi !== undefined ||
    source.metadata.isbn !== undefined
  );
}

/**
 * Get source type display name
 */
export function getSourceTypeDisplay(type: string): string {
  const displays: Record<string, string> = {
    research_paper: "Research Paper",
    textbook: "Textbook",
    teacher_guide: "Teacher Guide",
    study_note: "Study Notes",
    lecture_slide: "Lecture Slides",
    personal_document: "Personal Document",
    class_handout: "Class Handout",
    book: "Book"
  };

  return displays[type] || type;
}

/**
 * Get subject area display name
 */
export function getSubjectDisplay(subject: string): string {
  const displays: Record<string, string> = {
    mathematics: "Mathematics",
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",
    computer_science: "Computer Science",
    engineering: "Engineering",
    literature: "Literature",
    history: "History",
    economics: "Economics",
    psychology: "Psychology",
    philosophy: "Philosophy",
    other: "Other"
  };

  return displays[subject] || subject;
}

/**
 * Compare dates for sorting
 */
export function compareDates(date1: Date, date2: Date, order: "asc" | "desc" = "desc"): number {
  const diff = date1.getTime() - date2.getTime();
  return order === "desc" ? -diff : diff;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, style: "short" | "long" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (style === "short") {
    return d.toLocaleDateString();
  }

  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * Validate citation style
 */
export function isValidCitationStyle(style: string): boolean {
  return ["apa", "mla", "chicago", "ieee", "harvard", "vancouver"].includes(style);
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Group items by key
 */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return groups;
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Merge arrays without duplicates
 */
export function mergeUnique<T>(array1: T[], array2: T[]): T[] {
  return unique([...array1, ...array2]);
}

/**
 * Check if arrays are equal
 */
export function arraysEqual<T>(array1: T[], array2: T[]): boolean {
  if (array1.length !== array2.length) return false;
  return array1.every((item, index) => item === array2[index]);
}
