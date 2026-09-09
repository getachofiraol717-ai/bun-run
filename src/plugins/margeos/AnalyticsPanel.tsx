import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { analytics, type AnalyticsOverview } from "@/integrations/margeosBridge";
import type { AnalyticsSummaryRow, AnalyticsTimeseriesRow } from "./types";
import {
  agentBarData,
  pivotTimeseries,
  successRate,
  summaryByCategory,
} from "./analyticsUtils";
import type { PanelProps } from "./MargeOSShell";

// Theme-friendly categorical palette (mirrors the neon aesthetic of the app).
const PALETTE = ["#22d3ee", "#a78bfa", "#34d399", "#f472b6", "#fbbf24", "#60a5fa", "#f87171", "#4ade80", "#c084fc"];

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-orbitron neon-text">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}

export default function AnalyticsPanel({ workspace }: PanelProps) {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummaryRow[]>([]);
  const [series, setSeries] = useState<AnalyticsTimeseriesRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const wsId = workspace?.id ?? null;

  const refresh = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [o, s, t] = await Promise.all([
        analytics.overview(wsId),
        analytics.summary(wsId),
        analytics.timeseries(wsId, 14),
      ]);
      setOverview(o);
      setSummary(s);
      setSeries(t);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [wsId]);

  useEffect(() => {
    refresh();
    analytics.track({ category: "ui", event: "panel.view", subject: "analytics", workspace_id: wsId });
  }, [refresh, wsId]);

  const catData = summaryByCategory(summary);
  const agentData = overview ? agentBarData(overview.agents.byAgent) : [];
  const { data: tsData, categories } = pivotTimeseries(series);
  const taskData = overview
    ? Object.entries(overview.tasks.byStatus).map(([status, count]) => ({ status, count }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Usage across agents, terminal, memory, vault and tutor{workspace ? ` · ${workspace.name}` : " · all workspaces"}.
        </p>
        <Button size="sm" onClick={refresh} disabled={busy}>
          {busy ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {err && <Card className="p-3 text-sm text-red-400">Failed to load analytics: {err}</Card>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi
          label="Executions"
          value={overview?.executions.total ?? 0}
          sub={`${successRate(overview?.executions.success ?? 0, overview?.executions.total ?? 0)}% success`}
        />
        <Kpi label="Terminal runs" value={overview?.executions.terminal ?? 0} sub={`avg ${overview?.executions.avg_duration_ms ?? 0}ms`} />
        <Kpi label="Agent calls" value={overview?.agents.calls ?? 0} sub={`${overview?.agents.tokens ?? 0} tokens`} />
        <Kpi label="Memory" value={overview?.memory ?? 0} sub="entries" />
        <Kpi label="Vault" value={overview?.knowledge ?? 0} sub="documents" />
        <Kpi label="Sessions" value={overview?.sessions ?? 0} sub={`${overview?.files ?? 0} files`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-2">Activity (last 14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={tsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {categories.map((c, i) => (
                <Area
                  key={c}
                  type="monotone"
                  dataKey={c}
                  stackId="1"
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={PALETTE[i % PALETTE.length]}
                  fillOpacity={0.25}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          {!tsData.length && <p className="text-xs text-muted-foreground">No tracked events yet.</p>}
        </Card>

        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-2">Agent usage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="agent" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="calls" fill={PALETTE[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {!agentData.length && <p className="text-xs text-muted-foreground">No agent calls logged yet.</p>}
        </Card>

        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-2">Tracked events by category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={catData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="events" fill={PALETTE[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {!catData.length && <p className="text-xs text-muted-foreground">No tracked events yet.</p>}
        </Card>

        <Card className="p-3">
          <h3 className="text-sm font-semibold mb-2">Tasks by status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="count" fill={PALETTE[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {!taskData.length && <p className="text-xs text-muted-foreground">No tasks created yet.</p>}
        </Card>
      </div>
    </div>
  );
}
