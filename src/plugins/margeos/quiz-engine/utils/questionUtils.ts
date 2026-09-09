// @ts-nocheck
// Adaptive Quiz Engine — Question Utils
// Utility functions for question handling

import type { Question, QuestionType, DifficultyLevel, Option } from "../models/Question";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice",
  true_false: "True/False",
  short_answer: "Short Answer",
  long_answer: "Long Answer",
  numerical: "Numerical",
  formula: "Formula",
  diagram: "Diagram",
  matching: "Matching",
  sequencing: "Sequencing",
  scenario: "Scenario"
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  mcq: "list-bullets",
  true_false: "toggle-left",
  short_answer: "pencil",
  long_answer: "document-text",
  numerical: "calculator",
  formula: "function",
  diagram: "photo",
  matching: "link",
  sequencing: "排序",
  scenario: "compass"
};

export const QUESTION_TYPE_COLORS: Record<QuestionType, string> = {
  mcq: "#3b82f6",
  true_false: "#8b5cf6",
  short_answer: "#06b6d4",
  long_answer: "#14b8a6",
  numerical: "#f59e0b",
  formula: "#ef4444",
  diagram: "#ec4899",
  matching: "#6366f1",
  sequencing: "#8b5cf6",
  scenario: "#84cc16"
};

export const COGNITIVE_LEVEL_LABELS: Record<string, string> = {
  remember: "Remember",
  understand: "Understand",
  apply: "Apply",
  analyze: "Analyze",
  evaluate: "Evaluate",
  create: "Create"
};

export function getQuestionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_LABELS[type] || type;
}

export function getQuestionTypeIcon(type: QuestionType): string {
  return QUESTION_TYPE_ICONS[type] || "question";
}

export function getQuestionTypeColor(type: QuestionType): string {
  return QUESTION_TYPE_COLORS[type] || "#6b7280";
}

export function formatQuestionPreview(question: Question, maxLength: number = 100): string {
  const text = question.content.text;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

export function shuffleOptions(options: Option[], preserveCorrect: boolean = true): Option[] {
  const shuffled = [...options].sort(() => Math.random() - 0.5);

  if (preserveCorrect) {
    return shuffled.map((opt, idx) => ({ ...opt, id: String.fromCharCode(97 + idx) }));
  }

  return shuffled;
}

export function validateQuestion(question: Question): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check content
  if (!question.content.text && !question.content.imageUrl) {
    errors.push("Question must have text or image content");
  }

  // Check type-specific validation
  switch (question.type) {
    case "mcq":
      if (!question.options || question.options.length < 2) {
        errors.push("MCQ must have at least 2 options");
      }
      if (!question.options?.some(o => o.isCorrect)) {
        errors.push("MCQ must have at least one correct option");
      }
      break;

    case "true_false":
      if (question.correctAnswer === undefined) {
        errors.push("True/False must have a correct answer");
      }
      break;

    case "short_answer":
    case "long_answer":
      if (!question.correctAnswer) {
        warnings.push("Short/Long answer should have a reference answer");
      }
      break;

    case "numerical":
      if (question.correctAnswer === undefined) {
        errors.push("Numerical question must have a correct answer");
      }
      break;
  }

  // Check metadata
  if (!question.metadata.subject) {
    errors.push("Question must have a subject");
  }
  if (!question.metadata.topic) {
    errors.push("Question must have a topic");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function getCorrectAnswerText(question: Question): string {
  switch (question.type) {
    case "mcq":
      return question.options?.find(o => o.isCorrect)?.text || "";
    case "true_false":
      return String(question.correctAnswer);
    case "short_answer":
    case "long_answer":
    case "scenario":
      return String(question.correctAnswer);
    case "numerical":
    case "formula":
      return String(question.correctAnswer);
    default:
      return "";
  }
}

export function calculateEstimatedTime(
  question: Question,
  userLevel: DifficultyLevel = "medium"
): number {
  const baseTime = question.metadata.estimatedTime || 60;
  const typeMultipliers: Record<QuestionType, number> = {
    mcq: 1.0,
    true_false: 0.5,
    short_answer: 2.0,
    long_answer: 5.0,
    numerical: 3.0,
    formula: 4.0,
    diagram: 2.5,
    matching: 2.0,
    sequencing: 2.0,
    scenario: 3.0
  };

  const difficultyMultipliers: Record<DifficultyLevel, number> = {
    easy: 1.2,
    medium: 1.0,
    hard: 0.85,
    expert: 0.7
  };

  const typeMult = typeMultipliers[question.type] || 1.0;
  const diffMult = difficultyMultipliers[userLevel] || 1.0;

  return Math.round(baseTime * typeMult * diffMult);
}

export function getQuestionDifficultyColor(difficulty: DifficultyLevel): string {
  const colors: Record<DifficultyLevel, string> = {
    easy: "#22c55e",
    medium: "#eab308",
    hard: "#f97316",
    expert: "#ef4444"
  };
  return colors[difficulty] || "#6b7280";
}

export function filterQuestions(
  questions: Question[],
  filter: {
    types?: QuestionType[];
    difficulty?: DifficultyLevel[];
    subjects?: string[];
    topics?: string[];
    search?: string;
  }
): Question[] {
  return questions.filter(q => {
    if (filter.types?.length && !filter.types.includes(q.type)) return false;
    if (filter.difficulty?.length && !filter.difficulty.includes(q.metadata.difficulty || "medium")) return false;
    if (filter.subjects?.length && !filter.subjects.includes(q.metadata.subject)) return false;
    if (filter.topics?.length && !filter.topics.includes(q.metadata.topic)) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesText = q.content.text.toLowerCase().includes(searchLower);
      const matchesTopic = q.metadata.topic.toLowerCase().includes(searchLower);
      if (!matchesText && !matchesTopic) return false;
    }
    return true;
  });
}

export function groupQuestionsByTopic(questions: Question[]): Map<string, Question[]> {
  const grouped = new Map<string, Question[]>();

  questions.forEach(q => {
    const topic = q.metadata.topic;
    if (!grouped.has(topic)) {
      grouped.set(topic, []);
    }
    grouped.get(topic)!.push(q);
  });

  return grouped;
}

export function groupQuestionsByType(questions: Question[]): Map<QuestionType, Question[]> {
  const grouped = new Map<QuestionType, Question[]>();

  questions.forEach(q => {
    if (!grouped.has(q.type)) {
      grouped.set(q.type, []);
    }
    grouped.get(q.type)!.push(q);
  });

  return grouped;
}
