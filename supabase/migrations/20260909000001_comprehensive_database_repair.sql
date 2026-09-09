-- ============================================================================
-- Migration: 20260909000001_comprehensive_database_repair.sql
-- Description: Comprehensive database schema alignment and repair.
-- Resolves column mismatches, missing tables (quizzes, user_presence),
-- missing RLS policies, RPC signatures, and ensures 100% idempotent execution.
-- ============================================================================

-- 1. Ensure enum types
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'school', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Enhanced has_role functions supporting both app_role enum and TEXT
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO anon, authenticated, service_role;

-- 3. Core Profiles alignment
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student',
  grade INTEGER DEFAULT 9,
  subscription TEXT NOT NULL DEFAULT 'free',
  avatar_url TEXT,
  study_plan TEXT,
  language TEXT DEFAULT 'en',
  phone TEXT,
  phone_country_code TEXT,
  signup_source TEXT,
  subscription_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS grade INTEGER DEFAULT 9,
  ADD COLUMN IF NOT EXISTS subscription TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_country_code TEXT,
  ADD COLUMN IF NOT EXISTS signup_source TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS study_plan TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. User Roles alignment
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;

CREATE POLICY "user_roles_select_policy" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Payments table alignment (resolves missing payment_status / verification_status)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'premium',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ETB',
  payment_method TEXT NOT NULL DEFAULT 'telebirr',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  reference_number TEXT,
  transaction_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Sync status and payment_status
UPDATE public.payments
SET payment_status = status
WHERE payment_status IS NULL OR payment_status = '';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_user_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_user_select" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all" ON public.payments;

CREATE POLICY "payments_user_insert" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payments_user_select" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Analytics Events table alignment
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page TEXT,
  duration_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  quiz_id UUID,
  score INTEGER,
  total_questions INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS page TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quiz_id UUID,
  ADD COLUMN IF NOT EXISTS score INTEGER,
  ADD COLUMN IF NOT EXISTS total_questions INTEGER,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.analytics_events TO anon;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_events_insert_policy" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_select_policy" ON public.analytics_events;

CREATE POLICY "analytics_events_insert_policy" ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "analytics_events_select_policy" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 7. Quizzes table (resolves missing table in memoryVaultAnalytics)
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Practice Quiz',
  subject TEXT NOT NULL DEFAULT 'General',
  grade INTEGER DEFAULT 9,
  difficulty TEXT DEFAULT 'medium',
  score REAL DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT SELECT ON public.quizzes TO anon;
GRANT ALL ON public.quizzes TO service_role;

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select_policy" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_insert_policy" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_update_policy" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_delete_policy" ON public.quizzes;

CREATE POLICY "quizzes_select_policy" ON public.quizzes
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR user_id IS NULL);

CREATE POLICY "quizzes_insert_policy" ON public.quizzes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "quizzes_update_policy" ON public.quizzes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "quizzes_delete_policy" ON public.quizzes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_quizzes_user_subject ON public.quizzes(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON public.quizzes(created_at DESC);

-- 8. User Presence table (resolves missing table in memoryVaultAnalytics)
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_online BOOLEAN NOT NULL DEFAULT true,
  presence_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presence TO authenticated;
GRANT SELECT ON public.user_presence TO anon;
GRANT ALL ON public.user_presence TO service_role;

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "presence_select_policy" ON public.user_presence;
DROP POLICY IF EXISTS "presence_insert_policy" ON public.user_presence;
DROP POLICY IF EXISTS "presence_update_policy" ON public.user_presence;

CREATE POLICY "presence_select_policy" ON public.user_presence
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "presence_insert_policy" ON public.user_presence
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "presence_update_policy" ON public.user_presence
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_user_presence_user_date ON public.user_presence(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen DESC);

-- 9. User Sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  device_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_sessions_select" ON public.user_sessions;
DROP POLICY IF EXISTS "user_sessions_insert" ON public.user_sessions;

CREATE POLICY "user_sessions_select" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_sessions_insert" ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON public.user_sessions(user_id, started_at DESC);

-- 10. Quiz Attempts & Questions
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  percentage REAL DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  answers JSONB DEFAULT '[]'::jsonb,
  subject TEXT,
  grade INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_attempts_select" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_insert" ON public.quiz_attempts;

CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER DEFAULT 0,
  difficulty TEXT DEFAULT 'medium',
  subject TEXT,
  grade INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quiz_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_questions_select" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_admin_manage" ON public.quiz_questions;

CREATE POLICY "quiz_questions_select" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "quiz_questions_admin_manage" ON public.quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. User Streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 1,
  longest_streak INTEGER NOT NULL DEFAULT 1,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_freeze_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_streaks TO authenticated;
GRANT ALL ON public.user_streaks TO service_role;

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_streaks_select" ON public.user_streaks;
DROP POLICY IF EXISTS "user_streaks_update" ON public.user_streaks;

CREATE POLICY "user_streaks_select" ON public.user_streaks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_streaks_update" ON public.user_streaks
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 12. AI Settings & Usage
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  free_msg_limit INT NOT NULL DEFAULT 100,
  free_img_limit INT NOT NULL DEFAULT 20,
  free_msg_limit_per_provider INT NOT NULL DEFAULT 100,
  window_hours INT NOT NULL DEFAULT 24,
  enabled BOOLEAN NOT NULL DEFAULT true,
  model_preference TEXT DEFAULT 'gemini-1.5-flash',
  personality TEXT DEFAULT 'encouraging',
  response_length TEXT DEFAULT 'medium',
  difficulty TEXT DEFAULT 'adaptive',
  voice_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.ai_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.ai_settings TO anon, authenticated;
GRANT ALL ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_settings_select" ON public.ai_settings;
DROP POLICY IF EXISTS "ai_settings_admin_all" ON public.ai_settings;

CREATE POLICY "ai_settings_select" ON public.ai_settings FOR SELECT USING (true);
CREATE POLICY "ai_settings_admin_all" ON public.ai_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 13. Memory Vault Analytics Analytics Tables
CREATE TABLE IF NOT EXISTS public.learning_arc_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quiz_accuracy REAL DEFAULT 0,
  quiz_count INTEGER DEFAULT 0,
  study_duration_minutes INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  confidence_level REAL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject, date)
);

CREATE TABLE IF NOT EXISTS public.motivation_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_sessions INTEGER DEFAULT 0,
  total_session_minutes INTEGER DEFAULT 0,
  study_intensity REAL DEFAULT 0,
  consistency_score REAL DEFAULT 0,
  burnout_risk_score REAL DEFAULT 0,
  event_type TEXT,
  value REAL,
  description TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS public.burnout_recovery_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  onset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  initial_burnout_score REAL DEFAULT 0,
  recovery_complete_date DATE,
  recovery_duration_days INTEGER,
  phase TEXT DEFAULT 'early_onset',
  fatigue_score REAL DEFAULT 0,
  recommended_action TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.memory_vault_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_users_analyzed INTEGER DEFAULT 1,
  burnout_prevalence_pct REAL DEFAULT 0,
  avg_study_streak REAL DEFAULT 0,
  total_study_minutes INTEGER DEFAULT 0,
  total_quizzes_taken INTEGER DEFAULT 0,
  avg_quiz_score REAL DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.learning_arc_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.motivation_timeline TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.burnout_recovery_phases TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.memory_vault_aggregates TO authenticated;

ALTER TABLE public.learning_arc_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivation_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burnout_recovery_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_vault_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arc_snapshots_user_policy" ON public.learning_arc_snapshots;
DROP POLICY IF EXISTS "motivation_user_policy" ON public.motivation_timeline;
DROP POLICY IF EXISTS "burnout_user_policy" ON public.burnout_recovery_phases;
DROP POLICY IF EXISTS "aggregates_user_policy" ON public.memory_vault_aggregates;

CREATE POLICY "arc_snapshots_user_policy" ON public.learning_arc_snapshots
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "motivation_user_policy" ON public.motivation_timeline
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "burnout_user_policy" ON public.burnout_recovery_phases
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "aggregates_user_policy" ON public.memory_vault_aggregates
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL OR public.has_role(auth.uid(), 'admin'));

-- 14. Flexible RPCs for Analytics
CREATE OR REPLACE FUNCTION public.record_motivation_snapshot(
  _user_id UUID,
  _daily_sessions INTEGER DEFAULT 1,
  _total_session_minutes INTEGER DEFAULT 0,
  _study_intensity REAL DEFAULT 0,
  _consistency_score REAL DEFAULT 0,
  _burnout_risk_score REAL DEFAULT 0,
  _avg_session_duration_minutes REAL DEFAULT 0,
  _preferred_study_time TEXT DEFAULT 'evening',
  _motivation_momentum REAL DEFAULT 0.5
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.motivation_timeline (
    user_id, date, daily_sessions, total_session_minutes,
    study_intensity, consistency_score, burnout_risk_score
  ) VALUES (
    _user_id, CURRENT_DATE, _daily_sessions, _total_session_minutes,
    _study_intensity, _consistency_score, _burnout_risk_score
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    daily_sessions = _daily_sessions,
    total_session_minutes = _total_session_minutes,
    study_intensity = _study_intensity,
    consistency_score = _consistency_score,
    burnout_risk_score = _burnout_risk_score;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_motivation_snapshot(UUID, INTEGER, INTEGER, REAL, REAL, REAL, REAL, TEXT, REAL) TO authenticated;

-- Overload matching original 6-arg signature
CREATE OR REPLACE FUNCTION public.record_motivation_snapshot(
  _user_id UUID,
  _daily_sessions INTEGER,
  _total_session_minutes INTEGER,
  _study_intensity REAL,
  _consistency_score REAL,
  _burnout_risk_score REAL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM public.record_motivation_snapshot(_user_id, _daily_sessions, _total_session_minutes, _study_intensity, _consistency_score, _burnout_risk_score, 0, 'evening', 0.5);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_motivation_snapshot(UUID, INTEGER, INTEGER, REAL, REAL, REAL) TO authenticated;

-- Presence ping function
CREATE OR REPLACE FUNCTION public.update_user_presence(_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, last_seen, date, is_online, presence_updated_at)
  VALUES (_user_id, now(), CURRENT_DATE, true, now())
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    last_seen = now(),
    is_online = true,
    presence_updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_presence(UUID) TO authenticated;

-- 15. Ensure Creator Ecosystem, Intelligent Library & Marketplace Tables
CREATE TABLE IF NOT EXISTS public.creator_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  language text DEFAULT 'web',
  template text DEFAULT 'blank',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.creator_projects(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text DEFAULT '',
  language text DEFAULT 'plaintext',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, path)
);

CREATE TABLE IF NOT EXISTS public.creator_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  track text NOT NULL DEFAULT 'web',
  level text NOT NULL DEFAULT 'beginner',
  body_md text NOT NULL DEFAULT '',
  starter_code text DEFAULT '',
  language text DEFAULT 'javascript',
  xp int DEFAULT 50,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.creator_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  code text DEFAULT '',
  xp_earned int DEFAULT 0,
  completed_at timestamptz,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.creator_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.creator_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo',
  milestone text DEFAULT '',
  due_at timestamptz,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collab_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  project_id uuid REFERENCES public.creator_projects(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collab_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.collab_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Creator',
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.research_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  body text DEFAULT '',
  citations jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  source text NOT NULL DEFAULT 'ai',
  box integer NOT NULL DEFAULT 1,
  ease numeric NOT NULL DEFAULT 2.5,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_flashcard_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id uuid NOT NULL REFERENCES public.library_flashcards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  reviewed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE CASCADE,
  page integer NOT NULL DEFAULT 1,
  kind text NOT NULL DEFAULT 'note',
  text text,
  color text DEFAULT '#fbbf24',
  audio_url text,
  drawing_data jsonb,
  shared boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.library_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'page',
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  item_type TEXT,
  price_credits INTEGER,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tradeable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.marketplace_items(id) ON DELETE CASCADE,
  installed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.quiz_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  grade INTEGER DEFAULT 9,
  status TEXT NOT NULL DEFAULT 'waiting',
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  host_score INTEGER DEFAULT 0,
  challenger_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  challenger_name TEXT,
  challenger_score INTEGER DEFAULT 0,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  questions JSONB DEFAULT '[]',
  current_question INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_files TO authenticated;
GRANT SELECT ON public.creator_lessons TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.research_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_flashcards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_flashcard_reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_quiz_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_items TO authenticated;
GRANT SELECT ON public.marketplace_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_installs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_battles TO authenticated;

-- 16. Storage buckets initialization
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true), ('content-files', 'content-files', true)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN null;
  WHEN others THEN null;
END $$;

-- 17. PostgREST Schema Cache Reload
NOTIFY pgrst, 'reload schema';
