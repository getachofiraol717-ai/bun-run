// Adaptive Quiz Engine — Mastery Utils
// Utility functions for mastery calculations

import type { MasteryLevel } from "../models/MasteryReport";

export const MASTERY_LEVEL_ORDER: MasteryLevel[] = [
  "not_started",
  "introductory",
  "developing",
  "proficient",
  "mastered",
  "expert"
];

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  not_started: "Not Started",
  introductory: "Introductory",
  developing: "Developing",
  proficient: "Proficient",
  mastered: "Mastered",
  expert: "Expert"
};

export const MASTERY_COLORS: Record<MasteryLevel, string> = {
  not_started: "#9ca3af",
  introductory: "#f97316",
  developing: "#eab308",
  proficient: "#22c55e",
  mastered: "#3b82f6",
  expert: "#8b5cf6"
};

export const MASTERY_DESCRIPTIONS: Record<MasteryLevel, string> = {
  not_started: "No exposure to this topic yet",
  introductory: "Basic understanding of concepts",
  developing: "Growing understanding with some gaps",
  proficient: "Solid understanding of core concepts",
  mastered: "Complete understanding and application",
  expert: "Deep expertise and ability to teach others"
};

export const MASTERY_THRESHOLDS = {
  not_started: { min: 0, max: 20 },
  introductory: { min: 20, max: 50 },
  developing: { min: 50, max: 70 },
  proficient: { min: 70, max: 85 },
  mastered: { min: 85, max: 95 },
  expert: { min: 95, max: 100 }
};

export const MASTERY_ICONS: Record<MasteryLevel, string> = {
  not_started: "circle",
  introductory: "play",
  developing: "trending-up",
  proficient: "check-circle",
  mastered: "star",
  expert: "trophy"
};

export function getMasteryLevel(score: number): MasteryLevel {
  if (score >= 95) return "expert";
  if (score >= 85) return "mastered";
  if (score >= 70) return "proficient";
  if (score >= 50) return "developing";
  if (score >= 20) return "introductory";
  return "not_started";
}

export function getMasteryIndex(level: MasteryLevel): number {
  return MASTERY_LEVEL_ORDER.indexOf(level);
}

export function getNextMasteryLevel(current: MasteryLevel): MasteryLevel | null {
  const index = getMasteryIndex(current);
  return index < MASTERY_LEVEL_ORDER.length - 1 ? MASTERY_LEVEL_ORDER[index + 1] : null;
}

export function getMasteryLabel(level: MasteryLevel): string {
  return MASTERY_LABELS[level] || level;
}

export function getMasteryColor(level: MasteryLevel): string {
  return MASTERY_COLORS[level] || "#6b7280";
}

export function getMasteryDescription(level: MasteryLevel): string {
  return MASTERY_DESCRIPTIONS[level] || "";
}

export function getMasteryProgress(current: MasteryLevel): number {
  const thresholds = MASTERY_THRESHOLDS[current];
  return (thresholds.max + thresholds.min) / 2;
}

export function calculateProgressToNextLevel(
  currentScore: number,
  currentLevel: MasteryLevel
): { progress: number; pointsNeeded: number; nextLevel: MasteryLevel | null } {
  const thresholds = MASTERY_THRESHOLDS[currentLevel];
  const progress = currentScore - thresholds.min;
  const range = thresholds.max - thresholds.min;
  const progressPercent = (progress / range) * 100;
  const nextLevel = getNextMasteryLevel(currentLevel);
  const pointsNeeded = nextLevel ? thresholds.max - currentScore : 0;

  return {
    progress: Math.min(100, Math.max(0, progressPercent)),
    pointsNeeded: Math.max(0, pointsNeeded),
    nextLevel
  };
}

export function estimateTimeToMastery(
  currentScore: number,
  targetScore: number,
  questionsPerDay: number,
  accuracy: number = 0.7
): number | null {
  if (currentScore >= targetScore) return 0;
  if (questionsPerDay === 0 || accuracy === 0) return null;

  const scorePerQuestion = accuracy * 5; // Assume ~5 points per question
  const pointsNeeded = targetScore - currentScore;
  const questionsNeeded = Math.ceil(pointsNeeded / scorePerQuestion);
  const daysNeeded = Math.ceil(questionsNeeded / questionsPerDay);

  return daysNeeded;
}

export function formatMasteryLevel(level: MasteryLevel): string {
  return MASTERY_LABELS[level] || level;
}

export function compareMastery(a: MasteryLevel, b: MasteryLevel): number {
  return getMasteryIndex(a) - getMasteryIndex(b);
}

export function isMastered(level: MasteryLevel): boolean {
  return level === "mastered" || level === "expert";
}

export function needsWork(level: MasteryLevel): boolean {
  return level === "not_started" || level === "introductory" || level === "developing";
}

export function calculateMasteryFromAttempts(
  totalAttempts: number,
  correctAttempts: number
): number {
  if (totalAttempts === 0) return 0;

  const baseAccuracy = (correctAttempts / totalAttempts) * 100;
  const experienceBonus = Math.min(totalAttempts * 2, 20); // Up to 20 bonus for experience
  const recencyBonus = totalAttempts >= 5 ? 10 : 0;

  return Math.min(100, baseAccuracy + experienceBonus + recencyBonus);
}

export function getMasteryRecommendations(level: MasteryLevel): string[] {
  switch (level) {
    case "not_started":
      return [
        "Start with foundational concepts",
        "Watch introductory videos",
        "Complete beginner exercises"
      ];
    case "introductory":
      return [
        "Practice basic problems",
        "Review key terminology",
        "Take diagnostic quizzes"
      ];
    case "developing":
      return [
        "Focus on weak areas",
        "Practice with varied question types",
        "Review explanations for mistakes"
      ];
    case "proficient":
      return [
        "Challenge yourself with harder problems",
        "Apply concepts in different contexts",
        "Speed up your problem-solving"
      ];
    case "mastered":
      return [
        "Teach others to reinforce knowledge",
        "Tackle expert-level challenges",
        "Create your own practice problems"
      ];
    case "expert":
      return [
        "Explore advanced topics",
        "Contribute to study materials",
        "Mentor other learners"
      ];
    default:
      return [];
  }
}
