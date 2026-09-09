// @ts-nocheck
// Formula Engine — FormulaAnalyticsService
// Feature 12: Learning analytics and progress tracking
import type { Formula } from "@/plugins/margeos/smart-pdf-engine";
import type { FormulaAnalytics, AgeBand } from "../models/FormulaModels";

export interface LearningProgress {
  formulaId: string;
  timesViewed: number;
  timesSolved: number;
  correctAnswers: number;
  totalAttempts: number;
  averageTime: number; // seconds
  lastStudied: Date | null;
  masteryLevel: MasteryLevel;
  weakAreas: string[];
  strongAreas: string[];
}

export type MasteryLevel = "not_started" | "introduced" | "practicing" | "mastered";

export interface StudyAnalytics {
  totalFormulasStudied: number;
  formulasByMastery: Record<MasteryLevel, number>;
  averageAccuracy: number;
  totalStudyTime: number;
  streakDays: number;
  recommendedFormulas: string[];
}

const MASTERY_THRESHOLDS = {
  not_started: 0,
  introduced: 1,
  practicing: 5,
  mastered: 10
};

const ACCURACY_THRESHOLDS = {
  not_started: 0,
  introduced: 0.3,
  practicing: 0.7,
  mastered: 0.9
};

export function calculateMasteryLevel(progress: LearningProgress): MasteryLevel {
  const { correctAnswers, totalAttempts, timesSolved } = progress;

  if (totalAttempts === 0) {
    return timesSolved > 0 ? "introduced" : "not_started";
  }

  const accuracy = correctAnswers / totalAttempts;

  if (accuracy >= ACCURACY_THRESHOLDS.mastered && timesSolved >= MASTERY_THRESHOLDS.mastered) {
    return "mastered";
  }
  if (accuracy >= ACCURACY_THRESHOLDS.practicing && timesSolved >= MASTERY_THRESHOLDS.practicing) {
    return "practicing";
  }
  if (accuracy >= ACCURACY_THRESHOLDS.introduced || timesSolved >= MASTERY_THRESHOLDS.introduced) {
    return "introduced";
  }

  return "not_started";
}

export function updateProgress(
  current: LearningProgress,
  result: { correct: boolean; timeSpent: number }
): LearningProgress {
  const newProgress: LearningProgress = {
    ...current,
    timesViewed: current.timesViewed,
    timesSolved: current.timesSolved + 1,
    totalAttempts: current.totalAttempts + 1,
    correctAnswers: result.correct ? current.correctAnswers + 1 : current.correctAnswers,
    totalTime: (current.totalTime || 0) + result.timeSpent,
    averageTime: calculateAverageTime(current, result.timeSpent),
    lastStudied: new Date(),
    masteryLevel: calculateMasteryLevel({
      ...current,
      timesSolved: current.timesSolved + 1,
      totalAttempts: current.totalAttempts + 1,
      correctAnswers: result.correct ? current.correctAnswers + 1 : current.correctAnswers
    })
  };

  return newProgress;
}

function calculateAverageTime(current: LearningProgress, newTime: number): number {
  const totalAttempts = current.totalAttempts + 1;
  const totalTime = (current.averageTime * current.totalAttempts) + newTime;
  return totalTime / totalAttempts;
}

export function identifyWeakAreas(progress: LearningProgress): string[] {
  const weakAreas: string[] = [];

  if (progress.totalAttempts > 3) {
    const accuracy = progress.correctAnswers / progress.totalAttempts;
    if (accuracy < 0.5) {
      weakAreas.push("Needs more practice with basic application");
    }
    if (progress.averageTime > 120) { // More than 2 minutes
      weakAreas.push("Taking too long - needs faster recall");
    }
  }

  return weakAreas;
}

export function identifyStrongAreas(progress: LearningProgress): string[] {
  const strongAreas: string[] = [];

  if (progress.totalAttempts > 0) {
    const accuracy = progress.correctAnswers / progress.totalAttempts;
    if (accuracy >= 0.8) {
      strongAreas.push("Strong understanding of concept");
    }
    if (progress.averageTime < 30) { // Less than 30 seconds
      strongAreas.push("Quick recall - well memorized");
    }
  }

  return strongAreas;
}

export function generateStudyRecommendations(
  progress: LearningProgress,
  allFormulas: Formula[]
): string[] {
  const recommendations: string[] = [];

  switch (progress.masteryLevel) {
    case "not_started":
      recommendations.push("Start with the basics - watch the explanation video");
      recommendations.push("Try the first practice question with help enabled");
      break;

    case "introduced":
      recommendations.push("Practice with easier questions first");
      recommendations.push("Review the memory tips again");
      recommendations.push("Try to solve without looking at the formula");
      break;

    case "practicing":
      if (progress.correctAnswers / progress.totalAttempts < 0.7) {
        recommendations.push("Focus on understanding why mistakes happen");
        recommendations.push("Review worked examples step by step");
      } else {
        recommendations.push("Ready for harder questions");
        recommendations.push("Try exam-style problems");
      }
      break;

    case "mastered":
      recommendations.push("Great job! Move on to related formulas");
      recommendations.push("Review occasionally to maintain mastery");
      break;
  }

  return recommendations;
}

export function calculateStudyAnalytics(
  allProgress: Map<string, LearningProgress>
): StudyAnalytics {
  const progressArray = Array.from(allProgress.values());

  const formulasByMastery: Record<MasteryLevel, number> = {
    not_started: 0,
    introduced: 0,
    practicing: 0,
    mastered: 0
  };

  let totalCorrect = 0;
  let totalAttempts = 0;
  let totalStudyTime = 0;

  for (const progress of progressArray) {
    formulasByMastery[progress.masteryLevel]++;
    totalCorrect += progress.correctAnswers;
    totalAttempts += progress.totalAttempts;
    totalStudyTime += (progress.averageTime * progress.totalAttempts);
  }

  const averageAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  // Find streak (simplified - would need actual date tracking in production)
  const streakDays = calculateStreak(progressArray);

  // Recommend formulas that are "introduced" or "practicing"
  const recommendedFormulas = progressArray
    .filter(p => p.masteryLevel === "introduced" || p.masteryLevel === "practicing")
    .map(p => p.formulaId);

  return {
    totalFormulasStudied: progressArray.length,
    formulasByMastery,
    averageAccuracy,
    totalStudyTime,
    streakDays,
    recommendedFormulas
  };
}

function calculateStreak(progressArray: LearningProgress[]): number {
  // Simplified streak calculation
  // In production, this would check actual dates
  const studied = progressArray.filter(p => p.timesSolved > 0);
  if (studied.length === 0) return 0;

  // Placeholder: return 1 if any studied today
  const today = new Date();
  const studiedToday = studied.some(p =>
    p.lastStudied && p.lastStudied.toDateString() === today.toDateString()
  );

  return studiedToday ? 1 : 0;
}

export function predictMasteryTime(
  progress: LearningProgress,
  targetMastery: MasteryLevel
): number {
  // Rough estimate based on current progress
  const currentLevel = MASTERY_THRESHOLDS[progress.masteryLevel];
  const targetLevel = MASTERY_THRESHOLDS[targetMastery];
  const remaining = targetLevel - progress.timesSolved;

  if (remaining <= 0) return 0;

  // Estimate based on average practice rate
  const practiceRate = progress.totalAttempts > 0
    ? progress.totalAttempts / Math.max(1, daysSinceStart(progress))
    : 1;

  return Math.ceil(remaining / Math.max(practiceRate, 0.5));
}

function daysSinceStart(progress: LearningProgress): number {
  if (!progress.lastStudied) return 0;
  const now = new Date();
  const diff = now.getTime() - progress.lastStudied.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function generateProgressReport(
  allProgress: Map<string, LearningProgress>,
  formulaName: string
): string {
  const progress = allProgress.get(formulaName);
  if (!progress) {
    return `No progress recorded for ${formulaName}`;
  }

  const masteryEmoji: Record<MasteryLevel, string> = {
    not_started: "❌",
    introduced: "📖",
    practicing: "💪",
    mastered: "🏆"
  };

  const lines = [
    `## Progress Report: ${formulaName}`,
    "",
    `**Mastery Level:** ${masteryEmoji[progress.masteryLevel]} ${progress.masteryLevel}`,
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Times Solved | ${progress.timesSolved} |`,
    `| Correct Answers | ${progress.correctAnswers} |`,
    `| Accuracy | ${(progress.correctAnswers / Math.max(1, progress.totalAttempts) * 100).toFixed(1)}% |`,
    `| Average Time | ${progress.averageTime.toFixed(0)}s |`,
    `| Last Studied | ${progress.lastStudied?.toLocaleDateString() || "Never"} |`,
    ""
  ];

  const weakAreas = identifyWeakAreas(progress);
  if (weakAreas.length > 0) {
    lines.push("**Areas to Improve:**");
    weakAreas.forEach(area => lines.push(`- ${area}`));
    lines.push("");
  }

  const strongAreas = identifyStrongAreas(progress);
  if (strongAreas.length > 0) {
    lines.push("**Strengths:**");
    strongAreas.forEach(area => lines.push(`- ${area}`));
    lines.push("");
  }

  return lines.join("\n");
}
