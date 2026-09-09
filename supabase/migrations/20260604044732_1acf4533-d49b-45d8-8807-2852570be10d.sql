
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.ai_chats ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'tutor';
ALTER TABLE public.ai_chats ADD COLUMN IF NOT EXISTS document_id uuid;

-- USER MEMORY
CREATE TABLE IF NOT EXISTS public.user_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memory TO authenticated;
GRANT ALL ON public.user_memory TO service_role;
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own memory" ON public.user_memory FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all memory" ON public.user_memory FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER user_memory_updated BEFORE UPDATE ON public.user_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chat_id uuid,
  title text NOT NULL DEFAULT 'Untitled',
  source_url text,
  page_count int,
  char_count int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_documents TO authenticated;
GRANT ALL ON public.user_documents TO service_role;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documents" ON public.user_documents FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all documents" ON public.user_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- CHUNKS (vector 1536 for openai/text-embedding-3-small)
CREATE TABLE IF NOT EXISTS public.doc_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.user_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_chunks TO authenticated;
GRANT ALL ON public.doc_chunks TO service_role;
ALTER TABLE public.doc_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own chunks" ON public.doc_chunks FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS doc_chunks_embedding_idx
  ON public.doc_chunks USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.match_doc_chunks(
  _user_id uuid,
  _document_id uuid,
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE(id uuid, content text, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT d.id, d.content, 1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.doc_chunks d
  WHERE d.user_id = _user_id
    AND (_document_id IS NULL OR d.document_id = _document_id)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;
