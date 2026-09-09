// Study Companion — Analytics Utilities
// Utility functions for analytics and statistics

export interface StudyStats {
  totalStudyTime: number;
  totalSessions: number;
  averageSessionLength: number;
  longestSession: number;
  shortestSession: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
}

export interface TrendData {
  date: string;
  value: number;
  change: number;
}

export interface HeatmapData {
  day: number;
  hour: number;
  value: number;
}

/**
 * Calculate average from array
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Calculate median from array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = calculateAverage(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);

  return Math.round(Math.sqrt(avgSquareDiff));
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;

  return sorted[Math.max(0, index)];
}

/**
 * Get study time by day of week
 */
export function getStudyTimeByDayOfWeek(sessions: { startTime: string; actualDuration: number }[]): Record<string, number> {
  const byDay: Record<string, number[]> = {
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  sessions.forEach(session => {
    const day = dayNames[new Date(session.startTime).getDay()];
    byDay[day].push(session.actualDuration);
  });

  const totals: Record<string, number> = {};
  dayNames.forEach(day => {
    totals[day] = byDay[day].reduce((sum, v) => sum + v, 0);
  });

  return totals;
}

/**
 * Get study time by hour of day
 */
export function getStudyTimeByHour(sessions: { startTime: string; actualDuration: number }[]): Record<number, number> {
  const byHour: Record<number, number> = {};

  for (let i = 0; i < 24; i++) {
    byHour[i] = 0;
  }

  sessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    byHour[hour] += session.actualDuration;
  });

  return byHour;
}

/**
 * Find most productive day
 */
export function findMostProductiveDay(sessions: { startTime: string; actualDuration: number }[]): string {
  const byDay = getStudyTimeByDayOfWeek(sessions);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let maxDay = dayNames[0];
  let maxTime = 0;

  dayNames.forEach(day => {
    if (byDay[day] > maxTime) {
      maxTime = byDay[day];
      maxDay = day;
    }
  });

  return maxDay;
}

/**
 * Find most productive hour
 */
export function findMostProductiveHour(sessions: { startTime: string; actualDuration: number }[]): number {
  const byHour = getStudyTimeByHour(sessions);

  let maxHour = 0;
  let maxTime = 0;

  Object.entries(byHour).forEach(([hour, time]) => {
    if (time > maxTime) {
      maxTime = time;
      maxHour = parseInt(hour);
    }
  });

  return maxHour;
}

/**
 * Calculate streak data
 */
export function calculateStreak(dates: Date[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  // Sort dates descending
  const sortedDates = [...dates]
    .map(d => new Date(d).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  sortedDates.forEach(dateStr => {
    const date = new Date(dateStr);

    if (prevDate === null) {
      streak = 1;
      // Check if streak is current
      if (dateStr === today || dateStr === yesterday) {
        current = 1;
      }
    } else {
      const diffDays = (prevDate.getTime() - date.getTime()) / 86400000;

      if (diffDays === 1) {
        streak++;
        // Update current if this is part of active streak
        if (dateStr === today || dateStr === yesterday) {
          current = streak;
        }
      } else {
        longest = Math.max(longest, streak);
        streak = 1;
      }
    }

    prevDate = date;
  });

  longest = Math.max(longest, streak);

  return { current, longest };
}

/**
 * Generate heatmap data
 */
export function generateHeatmapData(
  sessions: { startTime: string; actualDuration: number }[]
): HeatmapData[] {
  const heatmap: HeatmapData[] = [];

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const relevantSessions = sessions.filter(s => {
        const date = new Date(s.startTime);
        return date.getDay() === day && date.getHours() === hour;
      });

      const totalTime = relevantSessions.reduce((sum, s) => sum + s.actualDuration, 0);

      heatmap.push({ day, hour, value: totalTime });
    }
  }

  return heatmap;
}

/**
 * Calculate trend
 */
export function calculateTrend(current: number, previous: number): TrendData {
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);

  return {
    date: new Date().toISOString().split("T")[0],
    value: current,
    change
  };
}

/**
 * Group data by time period
 */
export function groupByPeriod<T extends { timestamp: string }>(
  data: T[],
  period: "day" | "week" | "month"
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};

  data.forEach(item => {
    const date = new Date(item.timestamp);
    let key: string;

    switch (period) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  return groups;
}

/**
 * Calculate focus score (0-100)
 */
export function calculateFocusScore(
  totalTime: number,
  productiveTime: number,
  distractions: number
): number {
  if (totalTime === 0) return 0;

  const productivityRatio = productiveTime / totalTime;
  const distractionPenalty = Math.min(distractions / 10, 1) * 0.3;

  const score = (productivityRatio - distractionPenalty) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate study statistics
 */
export function generateStudyStats(sessions: { startTime: string; actualDuration: number }[]): StudyStats {
  const durations = sessions.map(s => s.actualDuration);

  return {
    totalStudyTime: durations.reduce((sum, d) => sum + d, 0),
    totalSessions: sessions.length,
    averageSessionLength: calculateAverage(durations),
    longestSession: Math.max(0, ...durations),
    shortestSession: durations.length > 0 ? Math.min(...durations) : 0,
    mostProductiveDay: findMostProductiveDay(sessions),
    mostProductiveHour: findMostProductiveHour(sessions)
  };
}

/**
 * Format hour for display
 */
export function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Get time period label
 */
export function getTimePeriodLabel(hour: number): string {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}
