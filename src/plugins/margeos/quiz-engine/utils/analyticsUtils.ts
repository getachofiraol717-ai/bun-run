// Adaptive Quiz Engine — Analytics Utils
// Utility functions for analytics and data visualization

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  secondary?: number;
}

export interface PieChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export interface BarChartData {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export const CHART_COLORS = [
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#eab308", // Yellow
  "#f97316", // Orange
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#6366f1"  // Indigo
];

export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export function formatDate(date: Date, format: "short" | "long" | "relative" = "short"): string {
  if (format === "relative") {
    return formatRelativeTime(date);
  }

  if (format === "long") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export function formatRelativeTime(date: Date): string {
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

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = calculateAverage(values);
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

  return Math.sqrt(variance);
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

export function calculateTrend(values: number[]): "improving" | "stable" | "declining" {
  if (values.length < 3) return "stable";

  const recent = values.slice(0, Math.ceil(values.length / 2));
  const older = values.slice(Math.ceil(values.length / 2));

  const recentAvg = calculateAverage(recent);
  const olderAvg = calculateAverage(older);

  const diff = recentAvg - olderAvg;

  if (diff > 5) return "improving";
  if (diff < -5) return "declining";
  return "stable";
}

export function groupByDate(
  data: Array<{ date: Date; value: number }>,
  interval: "day" | "week" | "month" = "day"
): Map<string, number[]> {
  const grouped = new Map<string, number[]>();

  data.forEach(item => {
    let key: string;

    if (interval === "day") {
      key = item.date.toISOString().split("T")[0];
    } else if (interval === "week") {
      const weekStart = new Date(item.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item.value);
  });

  return grouped;
}

export function aggregateByDate(
  data: Array<{ date: Date; value: number }>,
  aggregator: "sum" | "average" | "max" | "min" = "average"
): TimeSeriesData[] {
  const grouped = groupByDate(data);
  const result: TimeSeriesData[] = [];

  const sortedKeys = Array.from(grouped.keys()).sort();

  sortedKeys.forEach(key => {
    const values = grouped.get(key)!;
    let value: number;

    switch (aggregator) {
      case "sum":
        value = values.reduce((a, b) => a + b, 0);
        break;
      case "max":
        value = Math.max(...values);
        break;
      case "min":
        value = Math.min(...values);
        break;
      default:
        value = calculateAverage(values);
    }

    result.push({ date: key, value });
  });

  return result;
}

export function preparePieChartData(
  items: Array<{ label: string; value: number }>,
  colors?: string[]
): PieChartData[] {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return items.map((item, index) => ({
    label: item.label,
    value: item.value,
    color: colors?.[index] || CHART_COLORS[index % CHART_COLORS.length],
    percentage: total > 0 ? (item.value / total) * 100 : 0
  }));
}

export function prepareBarChartData(
  items: Array<{ label: string; value: number }>,
  colors?: string[]
): BarChartData[] {
  const max = Math.max(...items.map(i => i.value), 1);

  return items.map((item, index) => ({
    label: item.label,
    value: item.value,
    max,
    color: colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]
  }));
}

export function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;

  const first = values[values.length - 1];
  const last = values[0];

  if (first === 0) return 0;

  return ((last - first) / first) * 100;
}

export function smoothData(values: number[], windowSize: number = 3): number[] {
  if (values.length <= windowSize) return values;

  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(values.length, i + Math.ceil(windowSize / 2));
    const window = values.slice(start, end);
    result.push(calculateAverage(window));
  }

  return result;
}

export function detectOutliers(values: number[], threshold: number = 2): number[] {
  const avg = calculateAverage(values);
  const stdDev = calculateStandardDeviation(values);

  return values.filter(v => Math.abs(v - avg) > threshold * stdDev);
}

export function interpolateMissing(values: (number | null)[]): number[] {
  return values.map((v, i) => {
    if (v !== null) return v;

    // Find previous and next non-null values
    let prev = i - 1;
    let next = i + 1;

    while (prev >= 0 && values[prev] === null) prev--;
    while (next < values.length && values[next] === null) next++;

    if (prev >= 0 && next < values.length) {
      const prevVal = values[prev] as number;
      const nextVal = values[next] as number;
      const fraction = (i - prev) / (next - prev);
      return prevVal + (nextVal - prevVal) * fraction;
    }

    if (prev >= 0) return values[prev] as number;
    if (next < values.length) return values[next] as number;

    return 0;
  });
}
