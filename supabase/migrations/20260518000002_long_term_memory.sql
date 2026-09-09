-- ============================================================
-- MIGRATION: Long-Term Life-Aware Memory System
-- Extends ai_memory with emotional, behavioral, and goal tracking
-- ============================================================

-- Extend memory_type CHECK to include new life-aware types
ALTER TABLE public.ai_memory DROP CONSTRAINT IF EXISTS ai_memory_memory_type_check;
ALTER TABLE public.ai_memory
  ADD CONSTRAINT ai_memory_memory_type_check CHECK (memory_type IN (
    -- Original types
    'grade', 'weak_subject', 'strong_subject',
    'preference', 'quiz_history', 'study_habit',
    'goal', 'pdf_read', 'general',
    -- New life-aware types
    'exam_date',        -- upcoming exams
    'long_term_goal',   -- degree, career goals
    'burnout_signal',   -- detected burnout episodes
    'motivation_peak',  -- high-motivation moments
    'emotional_state',  -- current/recent mood
    'focus_duration',   -- how long they focus per session
    'achievement',      -- milestones reached
    'struggle_pattern', -- recurring difficulty patterns
    'preferred_style',  -- how they learn best
    'companion_name',   -- custom AI companion name
    'companion_config', -- companion personality JSON
    'consistency_streak',-- study streak tracking
    'quiz_score_history',-- per-subject quiz score trend
    'time_preference',  -- morning/evening study preference
    'ai_mode_preference' -- which modes they use most
  ));

-- Add new columns for richer memory
ALTER TABLE public.ai_memory
  ADD COLUMN IF NOT EXISTS value_numeric REAL,       -- for scores, durations, streaks
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,   -- for time-sensitive memories
  ADD COLUMN IF NOT EXISTS emotion TEXT,             -- 'positive'|'negative'|'neutral'
  ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 10);

-- Index for emotional state queries
CREATE INDEX IF NOT EXISTS idx_ai_memory_emotion ON public.ai_memory(user_id, emotion, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_importance ON public.ai_memory(user_id, importance DESC);

-- ── Companion config table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT 'KU',
  personality TEXT NOT NULL DEFAULT 'encouraging',  -- 'strict'|'encouraging'|'playful'|'calm'
  voice_speed REAL DEFAULT 1.0,
  voice_pitch REAL DEFAULT 1.0,
  aura_color TEXT DEFAULT '#8b5cf6',               -- hex color for avatar glow
  avatar_style TEXT DEFAULT 'hologram',            -- 'hologram'|'robot'|'cosmic'|'scholar'
  catchphrase TEXT,                                -- personal tagline
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_companions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own companion" ON public.ai_companions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Emotional state tracking ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_emotional_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  detected_state TEXT NOT NULL CHECK (detected_state IN (
    'focused', 'confused', 'frustrated', 'burned_out',
    'motivated', 'bored', 'stressed', 'confident', 'neutral'
  )),
  trigger_context TEXT,    -- what caused the detection
  session_id TEXT,
  response_time_ms INTEGER, -- how long they took to respond
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotional_log_user ON public.ai_emotional_log(user_id, created_at DESC);

ALTER TABLE public.ai_emotional_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own emotional log" ON public.ai_emotional_log
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service inserts emotional log" ON public.ai_emotional_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ── Study sessions for consistency tracking ─────────────────────
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  ai_mode TEXT,
  duration_minutes INTEGER,
  messages_sent INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id, started_at DESC);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.study_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Function: get full memory context for AI ────────────────────
CREATE OR REPLACE FUNCTION public.get_memory_context(_user_id UUID, _limit INTEGER DEFAULT 30)
RETURNS TABLE (
  memory_type TEXT,
  content TEXT,
  subject TEXT,
  value_numeric REAL,
  emotion TEXT,
  importance INTEGER,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.memory_type, m.content, m.subject, m.value_numeric, m.emotion, m.importance, m.updated_at
  FROM public.ai_memory m
  WHERE m.user_id = _user_id
    AND (m.expires_at IS NULL OR m.expires_at > now())
  ORDER BY m.importance DESC, m.updated_at DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_memory_context(UUID, INTEGER) TO authenticated;

-- ── Function: get companion config ───────────────────────────────
CREATE OR REPLACE FUNCTION public.get_or_create_companion(_user_id UUID)
RETURNS public.ai_companions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _comp public.ai_companions;
BEGIN
  SELECT * INTO _comp FROM public.ai_companions WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.ai_companions (user_id) VALUES (_user_id) RETURNING * INTO _comp;
  END IF;
  RETURN _comp;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_companion(UUID) TO authenticated;
