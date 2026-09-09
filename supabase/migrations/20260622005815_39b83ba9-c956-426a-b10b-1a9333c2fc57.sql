-- Enable pgvector (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding column (1536 dims matches text-embedding-3-small / gemini-embedding-001 default truncation we'll request)
ALTER TABLE public.margeos_memory_entries
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS margeos_memory_embedding_idx
  ON public.margeos_memory_entries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Semantic search RPC (security definer; scoped to caller)
CREATE OR REPLACE FUNCTION public.match_margeos_memory(
  query_embedding vector(1536),
  match_count integer DEFAULT 8,
  _workspace_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  workspace_id uuid,
  scope text,
  key text,
  content text,
  metadata jsonb,
  similarity double precision,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.workspace_id, m.scope, m.key, m.content, m.metadata,
         1 - (m.embedding <=> query_embedding) AS similarity,
         m.created_at, m.updated_at
  FROM public.margeos_memory_entries m
  WHERE m.user_id = auth.uid()
    AND m.embedding IS NOT NULL
    AND (_workspace_id IS NULL OR m.workspace_id = _workspace_id)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_margeos_memory(vector, integer, uuid) TO authenticated, service_role;