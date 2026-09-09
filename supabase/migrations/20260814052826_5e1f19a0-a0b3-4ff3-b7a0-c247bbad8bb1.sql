CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $fn$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.margeos_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_workspaces TO authenticated;
GRANT ALL ON public.margeos_workspaces TO service_role;
ALTER TABLE public.margeos_workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ws_owner_all" ON public.margeos_workspaces;
CREATE POLICY "ws_owner_all" ON public.margeos_workspaces FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.margeos_workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.margeos_workspace_files(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('file','folder')),
  mime TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  content TEXT,
  storage_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, path)
);
CREATE INDEX IF NOT EXISTS margeos_files_ws_idx ON public.margeos_workspace_files(workspace_id);
CREATE INDEX IF NOT EXISTS margeos_files_parent_idx ON public.margeos_workspace_files(parent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_workspace_files TO authenticated;
GRANT ALL ON public.margeos_workspace_files TO service_role;
ALTER TABLE public.margeos_workspace_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "files_owner_all" ON public.margeos_workspace_files;
CREATE POLICY "files_owner_all" ON public.margeos_workspace_files FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.margeos_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','planning','running','completed','failed','cancelled')),
  priority INT NOT NULL DEFAULT 5,
  assigned_agent TEXT,
  plan JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS margeos_tasks_ws_idx ON public.margeos_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS margeos_tasks_status_idx ON public.margeos_tasks(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_tasks TO authenticated;
GRANT ALL ON public.margeos_tasks TO service_role;
ALTER TABLE public.margeos_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_owner_all" ON public.margeos_tasks;
CREATE POLICY "tasks_owner_all" ON public.margeos_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.margeos_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.margeos_tasks(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  command TEXT,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','success','error','timeout')),
  output TEXT,
  error TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS margeos_exec_ws_idx ON public.margeos_executions(workspace_id);
CREATE INDEX IF NOT EXISTS margeos_exec_task_idx ON public.margeos_executions(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_executions TO authenticated;
GRANT ALL ON public.margeos_executions TO service_role;
ALTER TABLE public.margeos_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exec_owner_all" ON public.margeos_executions;
CREATE POLICY "exec_owner_all" ON public.margeos_executions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.margeos_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.margeos_tasks(id) ON DELETE SET NULL,
  agent TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'assistant',
  content TEXT NOT NULL,
  tokens INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS margeos_agentlog_ws_idx ON public.margeos_agent_logs(workspace_id);
CREATE INDEX IF NOT EXISTS margeos_agentlog_task_idx ON public.margeos_agent_logs(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_agent_logs TO authenticated;
GRANT ALL ON public.margeos_agent_logs TO service_role;
ALTER TABLE public.margeos_agent_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agentlog_owner_all" ON public.margeos_agent_logs;
CREATE POLICY "agentlog_owner_all" ON public.margeos_agent_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.margeos_memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'session'
    CHECK (scope IN ('session','long_term','project','conversation')),
  key TEXT,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS margeos_mem_ws_idx ON public.margeos_memory_entries(workspace_id);
CREATE INDEX IF NOT EXISTS margeos_mem_scope_idx ON public.margeos_memory_entries(scope);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_memory_entries TO authenticated;
GRANT ALL ON public.margeos_memory_entries TO service_role;
ALTER TABLE public.margeos_memory_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mem_owner_all" ON public.margeos_memory_entries;
CREATE POLICY "mem_owner_all" ON public.margeos_memory_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.margeos_knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS margeos_know_cat_idx ON public.margeos_knowledge_entries(category);
CREATE INDEX IF NOT EXISTS margeos_know_tags_idx ON public.margeos_knowledge_entries USING GIN(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_knowledge_entries TO authenticated;
GRANT ALL ON public.margeos_knowledge_entries TO service_role;
ALTER TABLE public.margeos_knowledge_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "know_owner_all" ON public.margeos_knowledge_entries;
CREATE POLICY "know_owner_all" ON public.margeos_knowledge_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.margeos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  label TEXT,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS margeos_sess_ws_idx ON public.margeos_sessions(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_sessions TO authenticated;
GRANT ALL ON public.margeos_sessions TO service_role;
ALTER TABLE public.margeos_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sess_owner_all" ON public.margeos_sessions;
CREATE POLICY "sess_owner_all" ON public.margeos_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_margeos_ws_upd ON public.margeos_workspaces;
CREATE TRIGGER trg_margeos_ws_upd BEFORE UPDATE ON public.margeos_workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_margeos_files_upd ON public.margeos_workspace_files;
CREATE TRIGGER trg_margeos_files_upd BEFORE UPDATE ON public.margeos_workspace_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_margeos_tasks_upd ON public.margeos_tasks;
CREATE TRIGGER trg_margeos_tasks_upd BEFORE UPDATE ON public.margeos_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_margeos_mem_upd ON public.margeos_memory_entries;
CREATE TRIGGER trg_margeos_mem_upd BEFORE UPDATE ON public.margeos_memory_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_margeos_know_upd ON public.margeos_knowledge_entries;
CREATE TRIGGER trg_margeos_know_upd BEFORE UPDATE ON public.margeos_knowledge_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_margeos_sess_upd ON public.margeos_sessions;
CREATE TRIGGER trg_margeos_sess_upd BEFORE UPDATE ON public.margeos_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE public.margeos_memory_entries ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.margeos_knowledge_entries ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS margeos_memory_embedding_idx ON public.margeos_memory_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS margeos_knowledge_entries_embedding_idx ON public.margeos_knowledge_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION public.match_margeos_memory(
  query_embedding vector(1536), match_count integer DEFAULT 8, _workspace_id uuid DEFAULT NULL
) RETURNS TABLE (id uuid, workspace_id uuid, scope text, key text, content text, metadata jsonb, similarity double precision, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.workspace_id, m.scope, m.key, m.content, m.metadata,
         1 - (m.embedding <=> query_embedding) AS similarity, m.created_at, m.updated_at
  FROM public.margeos_memory_entries m
  WHERE m.user_id = auth.uid() AND m.embedding IS NOT NULL
    AND (_workspace_id IS NULL OR m.workspace_id = _workspace_id)
  ORDER BY m.embedding <=> query_embedding LIMIT match_count;
$$;
REVOKE EXECUTE ON FUNCTION public.match_margeos_memory(vector, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_margeos_memory(vector, integer, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.match_margeos_knowledge(
  query_embedding vector, match_count integer DEFAULT 8, _category text DEFAULT NULL
) RETURNS TABLE (id uuid, category text, title text, content text, source text, tags text[], metadata jsonb, similarity double precision, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT k.id, k.category, k.title, k.content, k.source, k.tags, k.metadata,
         1 - (k.embedding <=> query_embedding) AS similarity, k.created_at, k.updated_at
  FROM public.margeos_knowledge_entries k
  WHERE k.user_id = auth.uid() AND k.embedding IS NOT NULL
    AND (_category IS NULL OR k.category = _category)
  ORDER BY k.embedding <=> query_embedding LIMIT match_count;
$$;
REVOKE EXECUTE ON FUNCTION public.match_margeos_knowledge(vector, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_margeos_knowledge(vector, integer, text) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.margeos_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  event TEXT NOT NULL,
  subject TEXT,
  value DOUBLE PRECISION NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS margeos_analytics_user_idx ON public.margeos_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS margeos_analytics_ws_idx ON public.margeos_analytics_events(workspace_id);
CREATE INDEX IF NOT EXISTS margeos_analytics_cat_idx ON public.margeos_analytics_events(category);
CREATE INDEX IF NOT EXISTS margeos_analytics_created_idx ON public.margeos_analytics_events(created_at);
GRANT SELECT, INSERT, DELETE ON public.margeos_analytics_events TO authenticated;
GRANT ALL ON public.margeos_analytics_events TO service_role;
ALTER TABLE public.margeos_analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_owner_all" ON public.margeos_analytics_events;
CREATE POLICY "analytics_owner_all" ON public.margeos_analytics_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.margeos_analytics_summary(_workspace_id uuid DEFAULT NULL, _since timestamptz DEFAULT NULL)
RETURNS TABLE (category text, event text, events bigint, total_value double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.category, a.event, count(*)::bigint AS events, coalesce(sum(a.value), 0) AS total_value
  FROM public.margeos_analytics_events a
  WHERE a.user_id = auth.uid()
    AND (_workspace_id IS NULL OR a.workspace_id = _workspace_id)
    AND (_since IS NULL OR a.created_at >= _since)
  GROUP BY a.category, a.event ORDER BY events DESC;
$$;
REVOKE EXECUTE ON FUNCTION public.margeos_analytics_summary(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.margeos_analytics_summary(uuid, timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.margeos_analytics_timeseries(_workspace_id uuid DEFAULT NULL, _days integer DEFAULT 14)
RETURNS TABLE (day date, category text, events bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (a.created_at AT TIME ZONE 'UTC')::date AS day, a.category, count(*)::bigint AS events
  FROM public.margeos_analytics_events a
  WHERE a.user_id = auth.uid()
    AND (_workspace_id IS NULL OR a.workspace_id = _workspace_id)
    AND a.created_at >= now() - make_interval(days => greatest(_days, 1))
  GROUP BY 1, 2 ORDER BY 1 ASC;
$$;
REVOKE EXECUTE ON FUNCTION public.margeos_analytics_timeseries(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.margeos_analytics_timeseries(uuid, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.margeos_analytics_overview(_workspace_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'executions', (
      SELECT jsonb_build_object('total', count(*), 'success', count(*) FILTER (WHERE e.status = 'success'),
        'error', count(*) FILTER (WHERE e.status IN ('error','timeout')),
        'terminal', count(*) FILTER (WHERE e.kind = 'terminal'),
        'avg_duration_ms', COALESCE(round(avg(e.duration_ms) FILTER (WHERE e.duration_ms > 0))::int, 0))
      FROM public.margeos_executions e
      WHERE e.user_id = auth.uid() AND (_workspace_id IS NULL OR e.workspace_id = _workspace_id)),
    'agents', (
      SELECT jsonb_build_object('calls', COALESCE(sum(t.c), 0), 'tokens', COALESCE(sum(t.tok), 0),
        'byAgent', COALESCE(jsonb_object_agg(t.agent, t.c), '{}'::jsonb))
      FROM (SELECT a.agent AS agent, count(*) AS c, sum(COALESCE(a.tokens, 0)) AS tok
            FROM public.margeos_agent_logs a
            WHERE a.user_id = auth.uid() AND (_workspace_id IS NULL OR a.workspace_id = _workspace_id)
            GROUP BY a.agent) t),
    'tasks', (
      SELECT jsonb_build_object('total', COALESCE(sum(t.c), 0), 'byStatus', COALESCE(jsonb_object_agg(t.status, t.c), '{}'::jsonb))
      FROM (SELECT k.status AS status, count(*) AS c FROM public.margeos_tasks k
            WHERE k.user_id = auth.uid() AND (_workspace_id IS NULL OR k.workspace_id = _workspace_id)
            GROUP BY k.status) t),
    'memory', (SELECT count(*) FROM public.margeos_memory_entries m WHERE m.user_id = auth.uid() AND (_workspace_id IS NULL OR m.workspace_id = _workspace_id)),
    'knowledge', (SELECT count(*) FROM public.margeos_knowledge_entries k WHERE k.user_id = auth.uid()),
    'files', (SELECT count(*) FROM public.margeos_workspace_files f WHERE f.user_id = auth.uid() AND (_workspace_id IS NULL OR f.workspace_id = _workspace_id)),
    'sessions', (SELECT count(*) FROM public.margeos_sessions s WHERE s.user_id = auth.uid() AND (_workspace_id IS NULL OR s.workspace_id = _workspace_id))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.margeos_analytics_overview(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.margeos_analytics_overview(uuid) TO authenticated, service_role;