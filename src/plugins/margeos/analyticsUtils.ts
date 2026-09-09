// Pure, side-effect-free helpers that shape MargeOS analytics rows into the
// structures the recharts dashboard consumes. Kept separate from React so they
// can be unit-tested without a DOM or Supabase.
import type {
  AnalyticsSummaryRow,
  AnalyticsTimeseriesRow,
} from "./types";

export interface CategoryDatum {
  category: string;
  events: number;
  value: number;
}

/** Collapse summary rows (category+event) down to one datum per category. */
export function summaryByCategory(rows: AnalyticsSummaryRow[]): CategoryDatum[] {
  const map = new Map<string, CategoryDatum>();
  for (const r of rows) {
    const d = map.get(r.category) ?? { category: r.category, events: 0, value: 0 };
    d.events += Number(r.events) || 0;
    d.value += Number(r.total_value) || 0;
    map.set(r.category, d);
  }
  return [...map.values()].sort((a, b) => b.events - a.events);
}

export interface AgentDatum {
  agent: string;
  calls: number;
}

/** Turn the byAgent record into a sorted bar-chart series. */
export function agentBarData(byAgent: Record<string, number>): AgentDatum[] {
  return Object.entries(byAgent)
    .map(([agent, calls]) => ({ agent, calls }))
    .sort((a, b) => b.calls - a.calls);
}

export type PivotRow = { day: string } & Record<string, number | string>;

/**
 * Pivot timeseries rows into one row per day with a numeric column per
 * category, filling gaps with 0. Returns chronologically ordered rows plus the
 * list of category keys present so the chart can render one series per key.
 */
export function pivotTimeseries(
  rows: AnalyticsTimeseriesRow[],
): { data: PivotRow[]; categories: string[] } {
  const categories = [...new Set(rows.map((r) => r.category))].sort();
  const byDay = new Map<string, PivotRow>();
  for (const r of rows) {
    const day = String(r.day).slice(0, 10);
    const row = byDay.get(day) ?? ({ day } as PivotRow);
    for (const c of categories) if (!(c in row)) row[c] = 0;
    row[r.category] = (Number(row[r.category]) || 0) + (Number(r.events) || 0);
    byDay.set(day, row);
  }
  const data = [...byDay.values()].sort((a, b) =>
    String(a.day).localeCompare(String(b.day)),
  );
  return { data, categories };
}

/** Execution success rate as a 0-100 integer (0 when there are no runs). */
export function successRate(success: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((success / total) * 100);
}
