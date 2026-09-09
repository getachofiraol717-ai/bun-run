-- ============== MargeOS Phase 4 — Analytics Engine ==============
-- Captures explicit product/user-activity events so the Analytics dashboard
-- can report on usage that is not already derivable from the executions,
-- agent_logs, memory, tasks and knowledge tables. Fully additive: no existing
-- MargeOS table is modified.

-- 1. ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS public.margeos_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  -- broad bucket: agent | terminal | tutor | memory | vault | workspace | file | session | ui
  category TEXT NOT NULL,
  -- specific verb within the category, e.g. agent.call, terminal.run, tutor.generate
  event TEXT NOT NULL,
  -- optional free-form subject (agent name, command, tutor kind, …)
  subject TEXT,
  -- numeric payload aggregated by the summary RPC (duration, tokens, count, …)
  value DOUBLE PRECISION NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS margeos_analytics_user_idx     ON public.margeos_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS margeos_analytics_ws_idx       ON public.margeos_analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS margeos_analytics_cat_idx      ON public.margeos_analytics_events(category);
CREATE INDEX IF NOT EXISTS margeos_analytics_created_idx  ON public.margeos_analytics_events(created_at);

GRANT SELECT, INSERT, DELETE ON public.margeos_analytics_events TO authenticated;
GRANT ALL ON public.margeos_analytics_events TO service_role;
ALTER TABLE public.margeos_analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_owner_all" ON public.margeos_analytics_events;
CREATE POLICY "analytics_owner_all" ON public.margeos_analytics_events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. SUMMARY RPC — counts/sums grouped by category+event for the caller.
CREATE OR REPLACE FUNCTION public.margeos_analytics_summary(
  _workspace_id uuid DEFAULT NULL,
  _since timestamptz DEFAULT NULL
)
RETURNS TABLE (
  category text,
  event text,
  events bigint,
  total_value double precision
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.category, a.event, count(*)::bigint AS events, coalesce(sum(a.value), 0) AS total_value
  FROM public.margeos_analytics_events a
  WHERE a.user_id = auth.uid()
    AND (_workspace_id IS NULL OR a.workspace_id = _workspace_id)
    AND (_since IS NULL OR a.created_at >= _since)
  GROUP BY a.category, a.event
  ORDER BY events DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.margeos_analytics_summary(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.margeos_analytics_summary(uuid, timestamptz) TO authenticated, service_role;

-- 3. TIMESERIES RPC — daily event counts for the caller (last N days).
CREATE OR REPLACE FUNCTION public.margeos_analytics_timeseries(
  _workspace_id uuid DEFAULT NULL,
  _days integer DEFAULT 14
)
RETURNS TABLE (
  day date,
  category text,
  events bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (a.created_at AT TIME ZONE 'UTC')::date AS day, a.category, count(*)::bigint AS events
  FROM public.margeos_analytics_events a
  WHERE a.user_id = auth.uid()
    AND (_workspace_id IS NULL OR a.workspace_id = _workspace_id)
    AND a.created_at >= now() - make_interval(days => greatest(_days, 1))
  GROUP BY 1, 2
  ORDER BY 1 ASC;
$$;
REVOKE EXECUTE ON FUNCTION public.margeos_analytics_timeseries(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.margeos_analytics_timeseries(uuid, integer) TO authenticated, service_role;

-- 4. OVERVIEW RPC — all dashboard KPIs computed server-side in one round trip.
-- Aggregating in SQL avoids PostgREST's default 1000-row cap that would silently
-- truncate a client-side count once any table grows past it.
CREATE OR REPLACE FUNCTION public.margeos_analytics_overview(
  _workspace_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'executions', (
      SELECT jsonb_build_object(
        'total', count(*),
        'success', count(*) FILTER (WHERE e.status = 'success'),
        'error', count(*) FILTER (WHERE e.status IN ('error','timeout')),
        'terminal', count(*) FILTER (WHERE e.kind = 'terminal'),
        'avg_duration_ms', COALESCE(round(avg(e.duration_ms) FILTER (WHERE e.duration_ms > 0))::int, 0)
      )
      FROM public.margeos_executions e
      WHERE e.user_id = auth.uid()
        AND (_workspace_id IS NULL OR e.workspace_id = _workspace_id)
    ),
    'agents', (
      SELECT jsonb_build_object(
        'calls', COALESCE(sum(t.c), 0),
        'tokens', COALESCE(sum(t.tok), 0),
        'byAgent', COALESCE(jsonb_object_agg(t.agent, t.c), '{}'::jsonb)
      )
      FROM (
        SELECT a.agent AS agent, count(*) AS c, sum(COALESCE(a.tokens, 0)) AS tok
        FROM public.margeos_agent_logs a
        WHERE a.user_id = auth.uid()
          AND (_workspace_id IS NULL OR a.workspace_id = _workspace_id)
        GROUP BY a.agent
      ) t
    ),
    'tasks', (
      SELECT jsonb_build_object(
        'total', COALESCE(sum(t.c), 0),
        'byStatus', COALESCE(jsonb_object_agg(t.status, t.c), '{}'::jsonb)
      )
      FROM (
        SELECT k.status AS status, count(*) AS c
        FROM public.margeos_tasks k
        WHERE k.user_id = auth.uid()
          AND (_workspace_id IS NULL OR k.workspace_id = _workspace_id)
        GROUP BY k.status
      ) t
    ),
    'memory', (
      SELECT count(*) FROM public.margeos_memory_entries m
      WHERE m.user_id = auth.uid()
        AND (_workspace_id IS NULL OR m.workspace_id = _workspace_id)
    ),
    'knowledge', (
      SELECT count(*) FROM public.margeos_knowledge_entries k
      WHERE k.user_id = auth.uid()
    ),
    'files', (
      SELECT count(*) FROM public.margeos_workspace_files f
      WHERE f.user_id = auth.uid()
        AND (_workspace_id IS NULL OR f.workspace_id = _workspace_id)
    ),
    'sessions', (
      SELECT count(*) FROM public.margeos_sessions s
      WHERE s.user_id = auth.uid()
        AND (_workspace_id IS NULL OR s.workspace_id = _workspace_id)
    )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.margeos_analytics_overview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.margeos_analytics_overview(uuid) TO authenticated, service_role;
