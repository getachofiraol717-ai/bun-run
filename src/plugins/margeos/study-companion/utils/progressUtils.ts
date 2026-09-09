// Study Companion — Progress Utilities
// Utility functions for progress calculations and formatting

export interface ProgressData {
  current: number;
  target: number;
  percentage: number;
  isComplete: boolean;
  remaining: number;
}

export interface StudyTimeData {
  totalMinutes: number;
  hours: number;
  minutes: number;
  formatted: string;
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercentage(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * Calculate progress data
 */
export function getProgressData(current: number, target: number): ProgressData {
  const percentage = calculateProgressPercentage(current, target);
  return {
    current,
    target,
    percentage,
    isComplete: current >= target,
    remaining: Math.max(0, target - current)
  };
}

/**
 * Format study time in minutes to human readable string
 */
export function formatStudyTime(minutes: number): string {
  if (minutes < 1) return "0m";
  if (minutes < 60) return `${Math.round(minutes)}m`;

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

/**
 * Parse study time string to minutes
 */
export function parseStudyTime(timeStr: string): number {
  const hourMatch = timeStr.match(/(\d+)h/);
  const minMatch = timeStr.match(/(\d+)m/);
  const dayMatch = timeStr.match(/(\d+)d/);

  let totalMinutes = 0;

  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1]);
  if (dayMatch) totalMinutes += parseInt(dayMatch[1]) * 24 * 60;

  return totalMinutes;
}

/**
 * Convert minutes to hours
 */
export function minutesToHours(minutes: number): number {
  return Math.round(minutes / 60 * 10) / 10;
}

/**
 * Convert hours to minutes
 */
export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

/**
 * Calculate daily goal completion
 */
export function calculateDailyProgress(
  studyMinutesToday: number,
  dailyGoalMinutes: number
): ProgressData {
  return getProgressData(studyMinutesToday, dailyGoalMinutes);
}

/**
 * Calculate weekly goal completion
 */
export function calculateWeeklyProgress(
  studyMinutesThisWeek: number,
  weeklyGoalMinutes: number
): ProgressData {
  return getProgressData(studyMinutesThisWeek, weeklyGoalMinutes);
}

/**
 * Calculate mastery level
 */
export function calculateMasteryLevel(
  correctAnswers: number,
  totalAttempts: number
): number {
  if (totalAttempts === 0) return 0;
  return Math.round((correctAnswers / totalAttempts) * 100);
}

/**
 * Get mastery description
 */
export function getMasteryDescription(masteryLevel: number): string {
  if (masteryLevel >= 90) return "Expert";
  if (masteryLevel >= 80) return "Proficient";
  if (masteryLevel >= 70) return "Competent";
  if (masteryLevel >= 60) return "Developing";
  if (masteryLevel >= 40) return "Novice";
  return "Beginner";
}

/**
 * Calculate streak multiplier
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  if (currentStreak <= 0) return 1.0;
  if (currentStreak < 7) return 1.0;
  if (currentStreak < 14) return 1.1;
  if (currentStreak < 30) return 1.2;
  if (currentStreak < 60) return 1.3;
  return 1.5;
}

/**
 * Calculate XP for study session
 */
export function calculateSessionXP(
  studyMinutes: number,
  streakMultiplier: number,
  focusBonus: number = 0
): number {
  const baseXP = Math.floor(studyMinutes * 2);
  const streakBonus = Math.floor(baseXP * (streakMultiplier - 1));
  return baseXP + streakBonus + focusBonus;
}

/**
 * Get level from XP
 */
export function getLevelFromXP(totalXP: number): number {
  if (totalXP < 100) return 1;
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

/**
 * Get XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

/**
 * Get progress to next level
 */
export function getLevelProgress(totalXP: number): {
  level: number;
  currentXP: number;
  requiredXP: number;
  percentage: number;
} {
  const level = getLevelFromXP(totalXP);
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const requiredXP = getXPForNextLevel(level);
  const currentXP = totalXP - currentLevelXP;
  const percentage = Math.round((currentXP / requiredXP) * 100);

  return { level, currentXP, requiredXP, percentage };
}

/**
 * Calculate completion rate
 */
export function calculateCompletionRate(
  completedItems: number,
  totalItems: number
): number {
  if (totalItems === 0) return 0;
  return Math.round((completedItems / totalItems) * 100);
}

/**
 * Calculate average
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Calculate trend direction
 */
export function calculateTrend(
  currentValue: number,
  previousValue: number
): "up" | "down" | "stable" {
  if (previousValue === 0) return currentValue > 0 ? "up" : "stable";

  const change = ((currentValue - previousValue) / previousValue) * 100;

  if (change > 5) return "up";
  if (change < -5) return "down";
  return "stable";
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: "short" | "long" = "short"): string {
  if (format === "short") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * Get days until date
 */
export function getDaysUntil(date: Date): number {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is overdue
 */
export function isOverdue(date: Date): boolean {
  return date.getTime() < Date.now();
}
