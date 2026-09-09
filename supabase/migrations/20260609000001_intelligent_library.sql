-- ═══════════════════════════════════════════════════════════════════
-- PHASE 1: INTELLIGENT LIBRARY — Smart Notes, Flashcards, Quizzes
-- ═══════════════════════════════════════════════════════════════════

-- ── library_notes ──────────────────────────────────────────────────
-- Highlights, text notes, voice notes, drawings, and AI-generated notes
CREATE TABLE IF NOT EXISTS public.library_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE CASCADE,
  page integer NOT NULL DEFAULT 1,
  kind text NOT NULL DEFAULT 'note' CHECK (kind IN ('note','highlight','voice','drawing','ai')),
  text text,
  color text DEFAULT '#fbbf24',
  audio_url text,
  drawing_data jsonb,
  shared boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_notes TO authenticated;
GRANT ALL ON public.library_notes TO service_role;
ALTER TABLE public.library_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_notes_owner" ON public.library_notes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shared notes are readable by anyone authenticated (for "Shared Notes" feature)
CREATE POLICY "library_notes_shared_read" ON public.library_notes
  FOR SELECT TO authenticated USING (shared = true);

CREATE INDEX IF NOT EXISTS idx_library_notes_user_book ON public.library_notes(user_id, content_item_id, page);

-- ── library_flashcards ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.library_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard','adaptive')),
  source text NOT NULL DEFAULT 'ai',
  box integer NOT NULL DEFAULT 1,
  ease numeric NOT NULL DEFAULT 2.5,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_flashcards TO authenticated;
GRANT ALL ON public.library_flashcards TO service_role;
ALTER TABLE public.library_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_flashcards_owner" ON public.library_flashcards
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_library_flashcards_user_book ON public.library_flashcards(user_id, content_item_id);
CREATE INDEX IF NOT EXISTS idx_library_flashcards_due ON public.library_flashcards(user_id, next_review_at);

-- ── library_flashcard_reviews ──────────────────────────────────────
-- Spaced-repetition review log (SM-2 lite)
CREATE TABLE IF NOT EXISTS public.library_flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id uuid NOT NULL REFERENCES public.library_flashcards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 4), -- 1=again 2=hard 3=good 4=easy
  reviewed_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.library_flashcard_reviews TO authenticated;
GRANT ALL ON public.library_flashcard_reviews TO service_role;
ALTER TABLE public.library_flashcard_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_flashcard_reviews_owner" ON public.library_flashcard_reviews
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── library_quiz_results ───────────────────────────────────────────
-- Stores AI-generated quiz attempts for learning analytics / knowledge gaps
CREATE TABLE IF NOT EXISTS public.library_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'page', -- 'page' | 'chapter' | 'book'
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '[]', -- [{question, type, correct, given, explanation}]
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.library_quiz_results TO authenticated;
GRANT ALL ON public.library_quiz_results TO service_role;
ALTER TABLE public.library_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_quiz_results_owner" ON public.library_quiz_results
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_library_quiz_results_user ON public.library_quiz_results(user_id, content_item_id);
