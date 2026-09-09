
-- Phase 3: add embedding support to the Knowledge Vault
ALTER TABLE public.margeos_knowledge_entries
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS margeos_knowledge_entries_embedding_idx
  ON public.margeos_knowledge_entries
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE OR REPLACE FUNCTION public.match_margeos_knowledge(
  query_embedding vector,
  match_count integer DEFAULT 8,
  _category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  source text,
  tags text[],
  metadata jsonb,
  similarity double precision,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT k.id, k.category, k.title, k.content, k.source, k.tags, k.metadata,
         1 - (k.embedding <=> query_embedding) AS similarity,
         k.created_at, k.updated_at
  FROM public.margeos_knowledge_entries k
  WHERE k.user_id = auth.uid()
    AND k.embedding IS NOT NULL
    AND (_category IS NULL OR k.category = _category)
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE EXECUTE ON FUNCTION public.match_margeos_knowledge(vector, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_margeos_knowledge(vector, integer, text) TO authenticated;
