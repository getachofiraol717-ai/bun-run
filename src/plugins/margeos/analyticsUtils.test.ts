import { describe, it, expect } from "vitest";
import {
  agentBarData,
  pivotTimeseries,
  successRate,
  summaryByCategory,
} from "./analyticsUtils";
import type {
  AnalyticsSummaryRow,
  AnalyticsTimeseriesRow,
} from "./types";

describe("summaryByCategory", () => {
  it("collapses events to one datum per category, sorted desc", () => {
    const rows: AnalyticsSummaryRow[] = [
      { category: "agent", event: "agent.call", events: 3, total_value: 30 },
      { category: "terminal", event: "terminal.run", events: 5, total_value: 50 },
      { category: "agent", event: "agent.stream", events: 2, total_value: 20 },
    ];
    const out = summaryByCategory(rows);
    expect(out).toEqual([
      { category: "agent", events: 5, value: 50 },
      { category: "terminal", events: 5, value: 50 },
    ]);
  });

  it("returns an empty array for no rows", () => {
    expect(summaryByCategory([])).toEqual([]);
  });
});

describe("agentBarData", () => {
  it("sorts agents by call count descending", () => {
    expect(agentBarData({ coordinator: 1, coding: 4, research: 2 })).toEqual([
      { agent: "coding", calls: 4 },
      { agent: "research", calls: 2 },
      { agent: "coordinator", calls: 1 },
    ]);
  });
});

describe("pivotTimeseries", () => {
  it("pivots rows into one entry per day with a column per category", () => {
    const rows: AnalyticsTimeseriesRow[] = [
      { day: "2026-06-21", category: "agent", events: 2 },
      { day: "2026-06-21", category: "terminal", events: 1 },
      { day: "2026-06-22", category: "agent", events: 3 },
    ];
    const { data, categories } = pivotTimeseries(rows);
    expect(categories).toEqual(["agent", "terminal"]);
    expect(data).toEqual([
      { day: "2026-06-21", agent: 2, terminal: 1 },
      { day: "2026-06-22", agent: 3, terminal: 0 },
    ]);
  });

  it("handles empty input", () => {
    expect(pivotTimeseries([])).toEqual({ data: [], categories: [] });
  });
});

describe("successRate", () => {
  it("computes a rounded percentage", () => {
    expect(successRate(3, 4)).toBe(75);
  });
  it("guards against divide-by-zero", () => {
    expect(successRate(0, 0)).toBe(0);
  });
});
