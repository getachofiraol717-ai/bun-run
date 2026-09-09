
-- ============== MargeOS Phase 1 Foundation ==============

-- 1. WORKSPACES
CREATE TABLE public.margeos_workspaces (
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
CREATE POLICY "ws_owner_all" ON public.margeos_workspaces FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. WORKSPACE FILES (virtual FS)
CREATE TABLE public.margeos_workspace_files (
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
CREATE INDEX margeos_files_ws_idx ON public.margeos_workspace_files(workspace_id);
CREATE INDEX margeos_files_parent_idx ON public.margeos_workspace_files(parent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_workspace_files TO authenticated;
GRANT ALL ON public.margeos_workspace_files TO service_role;
ALTER TABLE public.margeos_workspace_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_owner_all" ON public.margeos_workspace_files FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. TASKS
CREATE TABLE public.margeos_tasks (
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
CREATE INDEX margeos_tasks_ws_idx ON public.margeos_tasks(workspace_id);
CREATE INDEX margeos_tasks_status_idx ON public.margeos_tasks(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_tasks TO authenticated;
GRANT ALL ON public.margeos_tasks TO service_role;
ALTER TABLE public.margeos_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_owner_all" ON public.margeos_tasks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. EXECUTIONS
CREATE TABLE public.margeos_executions (
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
CREATE INDEX margeos_exec_ws_idx ON public.margeos_executions(workspace_id);
CREATE INDEX margeos_exec_task_idx ON public.margeos_executions(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_executions TO authenticated;
GRANT ALL ON public.margeos_executions TO service_role;
ALTER TABLE public.margeos_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exec_owner_all" ON public.margeos_executions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. AGENT LOGS
CREATE TABLE public.margeos_agent_logs (
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
CREATE INDEX margeos_agentlog_ws_idx ON public.margeos_agent_logs(workspace_id);
CREATE INDEX margeos_agentlog_task_idx ON public.margeos_agent_logs(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_agent_logs TO authenticated;
GRANT ALL ON public.margeos_agent_logs TO service_role;
ALTER TABLE public.margeos_agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agentlog_owner_all" ON public.margeos_agent_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. MEMORY ENTRIES (vector column added in Phase 2)
CREATE TABLE public.margeos_memory_entries (
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
CREATE INDEX margeos_mem_ws_idx ON public.margeos_memory_entries(workspace_id);
CREATE INDEX margeos_mem_scope_idx ON public.margeos_memory_entries(scope);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_memory_entries TO authenticated;
GRANT ALL ON public.margeos_memory_entries TO service_role;
ALTER TABLE public.margeos_memory_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mem_owner_all" ON public.margeos_memory_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. KNOWLEDGE VAULT
CREATE TABLE public.margeos_knowledge_entries (
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
CREATE INDEX margeos_know_cat_idx ON public.margeos_knowledge_entries(category);
CREATE INDEX margeos_know_tags_idx ON public.margeos_knowledge_entries USING GIN(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_knowledge_entries TO authenticated;
GRANT ALL ON public.margeos_knowledge_entries TO service_role;
ALTER TABLE public.margeos_knowledge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "know_owner_all" ON public.margeos_knowledge_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. SESSIONS
CREATE TABLE public.margeos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.margeos_workspaces(id) ON DELETE CASCADE,
  label TEXT,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX margeos_sess_ws_idx ON public.margeos_sessions(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margeos_sessions TO authenticated;
GRANT ALL ON public.margeos_sessions TO service_role;
ALTER TABLE public.margeos_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sess_owner_all" ON public.margeos_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at triggers (reuse existing public.update_updated_at_column)
CREATE TRIGGER trg_margeos_ws_upd     BEFORE UPDATE ON public.margeos_workspaces        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_margeos_files_upd  BEFORE UPDATE ON public.margeos_workspace_files   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_margeos_tasks_upd  BEFORE UPDATE ON public.margeos_tasks             FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_margeos_mem_upd    BEFORE UPDATE ON public.margeos_memory_entries    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_margeos_know_upd   BEFORE UPDATE ON public.margeos_knowledge_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_margeos_sess_upd   BEFORE UPDATE ON public.margeos_sessions          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
