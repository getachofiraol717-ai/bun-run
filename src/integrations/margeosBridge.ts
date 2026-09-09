// MargeOS Bridge — single typed entry point between the React UI and the
// MargeOS backend tables. All cross-cutting reads/writes go through here so
// existing Knowledge25 code paths stay untouched.
import { supabase } from "@/integrations/supabase/client";
import type {
  Workspace,
  WorkspaceFile,
  Task,
  Execution,
  AgentLog,
  MemoryEntry,
  KnowledgeEntry,
  MargeSession,
  MemoryScope,
  AgentName,
  FileKind,
  TaskStatus,
  AnalyticsEvent,
  AnalyticsSummaryRow,
  AnalyticsTimeseriesRow,
  AnalyticsCategory,
} from "@/plugins/margeos/types";

// Tables are not yet in the generated Database types; cast via `any` at the
// boundary so we keep strong types in app code without editing the generated
// supabase/types.ts file.
const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
  auth: typeof supabase.auth;
};

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "workspace";
}

// ---------- Workspaces ----------
export const workspaces = {
  async list(): Promise<Workspace[]> {
    const { data, error } = await db
      .from("margeos_workspaces")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Workspace[];
  },
  async create(input: { name: string; description?: string }): Promise<Workspace> {
    const user_id = await uid();
    const payload = {
      user_id,
      name: input.name,
      slug: slugify(input.name) + "-" + Math.random().toString(36).slice(2, 6),
      description: input.description ?? null,
    };
    const { data, error } = await db
      .from("margeos_workspaces")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as Workspace;
  },
  async rename(id: string, name: string) {
    const { error } = await db.from("margeos_workspaces").update({ name }).eq("id", id);
    if (error) throw error;
  },
  async archive(id: string, archived = true) {
    const { error } = await db.from("margeos_workspaces").update({ archived }).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string) {
    const { error } = await db.from("margeos_workspaces").delete().eq("id", id);
    if (error) throw error;
  },
};

// ---------- Virtual FS ----------
export const files = {
  async list(workspace_id: string): Promise<WorkspaceFile[]> {
    const { data, error } = await db
      .from("margeos_workspace_files")
      .select("*")
      .eq("workspace_id", workspace_id)
      .order("path", { ascending: true });
    if (error) throw error;
    return (data ?? []) as WorkspaceFile[];
  },
  async upsert(input: {
    workspace_id: string;
    parent_id?: string | null;
    path: string;
    name: string;
    kind: FileKind;
    content?: string | null;
    mime?: string | null;
  }): Promise<WorkspaceFile> {
    const user_id = await uid();
    const row = {
      user_id,
      workspace_id: input.workspace_id,
      parent_id: input.parent_id ?? null,
      path: input.path,
      name: input.name,
      kind: input.kind,
      mime: input.mime ?? null,
      content: input.content ?? null,
      size_bytes: input.content ? new Blob([input.content]).size : 0,
    };
    const { data, error } = await db
      .from("margeos_workspace_files")
      .upsert(row, { onConflict: "workspace_id,path" })
      .select("*")
      .single();
    if (error) throw error;
    return data as WorkspaceFile;
  },
  async remove(id: string) {
    const { error } = await db.from("margeos_workspace_files").delete().eq("id", id);
    if (error) throw error;
  },
};

// ---------- Tasks ----------
export const tasks = {
  async list(workspace_id?: string | null): Promise<Task[]> {
    let q = db.from("margeos_tasks").select("*").order("created_at", { ascending: false });
    if (workspace_id) q = q.eq("workspace_id", workspace_id);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Task[];
  },
  async create(input: {
    title: string;
    description?: string;
    workspace_id?: string | null;
    assigned_agent?: AgentName;
  }): Promise<Task> {
    const user_id = await uid();
    const { data, error } = await db
      .from("margeos_tasks")
      .insert({
        user_id,
        title: input.title,
        description: input.description ?? null,
        workspace_id: input.workspace_id ?? null,
        assigned_agent: input.assigned_agent ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as Task;
  },
  async setStatus(id: string, status: TaskStatus, patch: Partial<Task> = {}) {
    const { error } = await db
      .from("margeos_tasks")
      .update({ status, ...patch })
      .eq("id", id);
    if (error) throw error;
  },
};

// ---------- Executions ----------
export const executions = {
  async list(workspace_id?: string | null, limit = 100): Promise<Execution[]> {
    let q = db
      .from("margeos_executions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (workspace_id) q = q.eq("workspace_id", workspace_id);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Execution[];
  },
  async log(entry: Omit<Execution, "id" | "user_id" | "created_at">): Promise<Execution> {
    const user_id = await uid();
    const { data, error } = await db
      .from("margeos_executions")
      .insert({ ...entry, user_id })
      .select("*")
      .single();
    if (error) throw error;
    return data as Execution;
  },
};

// ---------- Agent logs ----------
export const agentLogs = {
  async list(task_id: string): Promise<AgentLog[]> {
    const { data, error } = await db
      .from("margeos_agent_logs")
      .select("*")
      .eq("task_id", task_id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as AgentLog[];
  },
  async append(entry: Omit<AgentLog, "id" | "user_id" | "created_at">): Promise<AgentLog> {
    const user_id = await uid();
    const { data, error } = await db
      .from("margeos_agent_logs")
      .insert({ ...entry, user_id })
      .select("*")
      .single();
    if (error) throw error;
    return data as AgentLog;
  },
};

// ---------- Memory ----------
export const memory = {
  async list(workspace_id: string | null, scope?: MemoryScope): Promise<MemoryEntry[]> {
    let q = db
      .from("margeos_memory_entries")
      .select("*")
      .order("updated_at", { ascending: false });
    if (workspace_id) q = q.eq("workspace_id", workspace_id);
    if (scope) q = q.eq("scope", scope);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as MemoryEntry[];
  },
  async write(entry: {
    workspace_id?: string | null;
    scope: MemoryScope;
    key?: string | null;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<MemoryEntry> {
    const user_id = await uid();
    const { data, error } = await db
      .from("margeos_memory_entries")
      .insert({
        user_id,
        workspace_id: entry.workspace_id ?? null,
        scope: entry.scope,
        key: entry.key ?? null,
        content: entry.content,
        metadata: entry.metadata ?? {},
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as MemoryEntry;
  },
  async remove(id: string) {
    const { error } = await db.from("margeos_memory_entries").delete().eq("id", id);
    if (error) throw error;
  },
};

// ---------- Knowledge Vault ----------
export const knowledge = {
  async list(category?: string, search?: string): Promise<KnowledgeEntry[]> {
    let q = db.from("margeos_knowledge_entries").select("*").order("updated_at", { ascending: false });
    if (category) q = q.eq("category", category);
    if (search) q = q.ilike("title", `%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as KnowledgeEntry[];
  },
  async add(entry: {
    category: string;
    title: string;
    content: string;
    source?: string;
    tags?: string[];
  }): Promise<KnowledgeEntry> {
    const user_id = await uid();
    const { data, error } = await db
      .from("margeos_knowledge_entries")
      .insert({
        user_id,
        category: entry.category,
        title: entry.title,
        content: entry.content,
        source: entry.source ?? null,
        tags: entry.tags ?? [],
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as KnowledgeEntry;
  },
  async remove(id: string) {
    const { error } = await db.from("margeos_knowledge_entries").delete().eq("id", id);
    if (error) throw error;
  },
};

// ---------- Sessions ----------
export const sessions = {
  async list(): Promise<MargeSession[]> {
    const { data, error } = await db
      .from("margeos_sessions")
      .select("*")
      .order("last_active_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as MargeSession[];
  },
  async touch(id: string, state: Record<string, unknown> = {}) {
    const { error } = await db
      .from("margeos_sessions")
      .update({ state, last_active_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },
  async open(workspace_id: string | null, label?: string): Promise<MargeSession> {
    const user_id = await uid();
    const { data, error } = await db
      .from("margeos_sessions")
      .insert({ user_id, workspace_id, label: label ?? null, state: {} })
      .select("*")
      .single();
    if (error) throw error;
    return data as MargeSession;
  },
};

// ---------- Analytics ----------
export interface AnalyticsOverview {
  executions: { total: number; success: number; error: number; terminal: number; avg_duration_ms: number };
  agents: { calls: number; tokens: number; byAgent: Record<string, number> };
  tasks: { total: number; byStatus: Record<string, number> };
  memory: number;
  knowledge: number;
  files: number;
  sessions: number;
}

export const analytics = {
  /** Best-effort event capture. Never throws so callers can fire-and-forget. */
  async track(input: {
    category: AnalyticsCategory | string;
    event: string;
    subject?: string | null;
    value?: number;
    workspace_id?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // Non-critical path: read the cached session instead of a network getUser().
      const { data } = await supabase.auth.getSession();
      const user_id = data.session?.user?.id;
      if (!user_id) return;
      await db.from("margeos_analytics_events").insert({
        user_id,
        workspace_id: input.workspace_id ?? null,
        category: input.category,
        event: input.event,
        subject: input.subject ?? null,
        value: input.value ?? 1,
        metadata: input.metadata ?? {},
      });
    } catch {
      /* analytics is non-critical */
    }
  },

  async events(workspace_id?: string | null, limit = 200): Promise<AnalyticsEvent[]> {
    let q = db
      .from("margeos_analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (workspace_id) q = q.eq("workspace_id", workspace_id);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as AnalyticsEvent[];
  },

  async summary(workspace_id?: string | null, sinceDays?: number): Promise<AnalyticsSummaryRow[]> {
    const since = sinceDays
      ? new Date(Date.now() - sinceDays * 86_400_000).toISOString()
      : null;
    const { data, error } = await db.rpc("margeos_analytics_summary", {
      _workspace_id: workspace_id ?? null,
      _since: since,
    });
    if (error) throw error;
    return (data ?? []) as AnalyticsSummaryRow[];
  },

  async timeseries(workspace_id?: string | null, days = 14): Promise<AnalyticsTimeseriesRow[]> {
    const { data, error } = await db.rpc("margeos_analytics_timeseries", {
      _workspace_id: workspace_id ?? null,
      _days: days,
    });
    if (error) throw error;
    return (data ?? []) as AnalyticsTimeseriesRow[];
  },

  /**
   * Dashboard KPIs. Aggregated server-side via the margeos_analytics_overview
   * RPC (one round trip, no PostgREST 1000-row truncation). Falls back to a
   * count-based client computation if the RPC is unavailable (e.g. migration
   * not yet applied).
   */
  async overview(workspace_id?: string | null): Promise<AnalyticsOverview> {
    const { data, error } = await db.rpc("margeos_analytics_overview", {
      _workspace_id: workspace_id ?? null,
    });
    if (error) return analyticsOverviewFallback(workspace_id ?? null);
    return normalizeOverview(data);
  },
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numRecord(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = num(val);
  }
  return out;
}

function normalizeOverview(raw: unknown): AnalyticsOverview {
  const o = (raw ?? {}) as Record<string, any>;
  const e = o.executions ?? {};
  const a = o.agents ?? {};
  const t = o.tasks ?? {};
  return {
    executions: {
      total: num(e.total),
      success: num(e.success),
      error: num(e.error),
      terminal: num(e.terminal),
      avg_duration_ms: num(e.avg_duration_ms),
    },
    agents: { calls: num(a.calls), tokens: num(a.tokens), byAgent: numRecord(a.byAgent) },
    tasks: { total: num(t.total), byStatus: numRecord(t.byStatus) },
    memory: num(o.memory),
    knowledge: num(o.knowledge),
    files: num(o.files),
    sessions: num(o.sessions),
  };
}

/**
 * Pre-migration fallback. Uses exact head counts for count-only tables and a
 * bounded row fetch for the statistical ones (still subject to the 1000-row cap,
 * but only used until margeos_analytics_overview exists).
 */
async function analyticsOverviewFallback(workspace_id: string | null): Promise<AnalyticsOverview> {
  const wsEq = (q: any) => (workspace_id ? q.eq("workspace_id", workspace_id) : q);
  const headCount = (table: string) => {
    const q = db.from(table).select("id", { count: "exact", head: true });
    return workspace_id ? q.eq("workspace_id", workspace_id) : q;
  };

  const [execRes, agentRes, taskRes, memRes, knowRes, fileRes, sessRes] = await Promise.all([
    wsEq(db.from("margeos_executions").select("status, kind, duration_ms")),
    wsEq(db.from("margeos_agent_logs").select("agent, tokens")),
    wsEq(db.from("margeos_tasks").select("status")),
    headCount("margeos_memory_entries"),
    db.from("margeos_knowledge_entries").select("id", { count: "exact", head: true }),
    headCount("margeos_workspace_files"),
    headCount("margeos_sessions"),
  ]);

  const execRows = (execRes.data ?? []) as { status: string; kind: string; duration_ms: number | null }[];
  const durations = execRows.map((r) => r.duration_ms ?? 0).filter((d) => d > 0);
  const executions = {
    total: execRows.length,
    success: execRows.filter((r) => r.status === "success").length,
    error: execRows.filter((r) => r.status === "error" || r.status === "timeout").length,
    terminal: execRows.filter((r) => r.kind === "terminal").length,
    avg_duration_ms: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0,
  };

  const agentRows = (agentRes.data ?? []) as { agent: string; tokens: number | null }[];
  const byAgent: Record<string, number> = {};
  let tokens = 0;
  for (const r of agentRows) {
    byAgent[r.agent] = (byAgent[r.agent] ?? 0) + 1;
    tokens += r.tokens ?? 0;
  }

  const taskRows = (taskRes.data ?? []) as { status: string }[];
  const byStatus: Record<string, number> = {};
  for (const r of taskRows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  return {
    executions,
    agents: { calls: agentRows.length, tokens, byAgent },
    tasks: { total: taskRows.length, byStatus },
    memory: num(memRes.count),
    knowledge: num(knowRes.count),
    files: num(fileRes.count),
    sessions: num(sessRes.count),
  };
}

export const margeos = {
  workspaces,
  files,
  tasks,
  executions,
  agentLogs,
  memory,
  knowledge,
  sessions,
  analytics,
};

export default margeos;
