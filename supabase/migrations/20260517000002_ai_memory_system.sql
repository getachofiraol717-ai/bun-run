-- ============================================================
-- MIGRATION: AI Memory System (RAG)
-- Stores per-user learning memories for personalized AI responses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'grade', 'weak_subject', 'strong_subject',
    'preference', 'quiz_history', 'study_habit',
    'goal', 'pdf_read', 'general'
  )),
  content TEXT NOT NULL,
  subject TEXT,
  confidence REAL DEFAULT 1.0,
  source TEXT DEFAULT 'conversation', -- 'conversation' | 'quiz' | 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, memory_type, content)
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON public.ai_memory(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_type ON public.ai_memory(user_id, memory_type);

ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memory" ON public.ai_memory
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users insert own memory" ON public.ai_memory
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own memory" ON public.ai_memory
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins read all memory" ON public.ai_memory
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to upsert a memory entry
CREATE OR REPLACE FUNCTION public.upsert_ai_memory(
  _user_id UUID,
  _memory_type TEXT,
  _content TEXT,
  _subject TEXT DEFAULT NULL,
  _source TEXT DEFAULT 'conversation'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_memory (user_id, memory_type, content, subject, source, updated_at)
  VALUES (_user_id, _memory_type, _content, _subject, _source, now())
  ON CONFLICT (user_id, memory_type, content)
  DO UPDATE SET updated_at = now(), subject = COALESCE(_subject, EXCLUDED.subject);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_ai_memory(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Trigger to track updated_at
CREATE OR REPLACE FUNCTION public.update_ai_memory_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ai_memory_updated ON public.ai_memory;
CREATE TRIGGER trg_ai_memory_updated
  BEFORE UPDATE ON public.ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_memory_updated_at();

COMMENT ON TABLE public.ai_memory IS 'Per-user AI learning memory for personalized RAG-style context injection';
